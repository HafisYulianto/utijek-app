'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDistance } from '@/lib/utils/formatters'
import { calculatePrice, getServiceLabel, getServiceIcon } from '@/lib/utils/pricing'
import { useDriverLocation } from '@/hooks/useDriverLocation'
import type { Order, PricingConfig } from '@/types/database.types'
import { MapPinIcon, CheckCircleIcon, PhoneIcon, UserIcon } from '@heroicons/react/24/solid'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

const LiveMap = dynamic(() => import('@/components/map/LiveMap'), { ssr: false })

type TripPhase = 'picking_up' | 'on_trip' | 'completing'

interface CustomerInfo {
  full_name: string | null
  phone: string | null
}

export default function DriverNavigationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')
  const supabase = createClient()

  const [order, setOrder] = useState<Order | null>(null)
  const [pricing, setPricing] = useState<PricingConfig | null>(null)
  const [phase, setPhase] = useState<TripPhase>('picking_up')
  const [distanceTraveled, setDistanceTraveled] = useState(0)
  const [currentPrice, setCurrentPrice] = useState(0)
  const [driverId, setDriverId] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [customer, setCustomer] = useState<CustomerInfo | null>(null)
  const prevCoordsRef = useRef<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setDriverId(user.id)

      if (!orderId) return

      const { data: ord } = await (supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single() as any)

      if (ord) {
        const typedOrd = ord as Order
        setOrder(typedOrd)
        setPhase((typedOrd.status as TripPhase) ?? 'picking_up')

        const [{ data: pc }, { data: cust }] = await Promise.all([
          (supabase
            .from('pricing_config')
            .select('*')
            .eq('service_type', typedOrd.service_type)
            .single() as any),
          (supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', typedOrd.customer_id)
            .single() as any),
        ])
        if (pc) setPricing(pc as PricingConfig)
        if (cust) setCustomer(cust as CustomerInfo)
      }
    }
    init()
  }, [orderId])

  const { lat, lng } = useDriverLocation({ driverId, isOnline: true })

  useEffect(() => {
    if (phase !== 'on_trip' || !lat || !lng) return

    if (prevCoordsRef.current) {
      const distMeters = haversineDistance(
        prevCoordsRef.current.lat,
        prevCoordsRef.current.lng,
        lat,
        lng
      )
      setDistanceTraveled((prev) => {
        const next = prev + distMeters
        if (pricing) setCurrentPrice(calculatePrice(next, pricing))
        return next
      })

      if (orderId) {
        ;(supabase.from('order_tracking') as any).insert({
          order_id: orderId,
          driver_lat: lat,
          driver_lng: lng,
        })
      }
    }

    prevCoordsRef.current = { lat, lng }
  }, [lat, lng, phase])

  const handleArrived = async () => {
    if (!order) return
    setLoading(true)
    await (supabase.from('orders') as any).update({ status: 'picking_up' }).eq('id', order.id)
    setPhase('on_trip')
    toast.success('Kamu sudah tiba! Mulai perjalanan.')
    setLoading(false)
  }

  const handleStartTrip = async () => {
    if (!order) return
    setLoading(true)
    prevCoordsRef.current = null
    setDistanceTraveled(0)
    await (supabase.from('orders') as any).update({ status: 'on_trip' }).eq('id', order.id)
    setPhase('on_trip')
    toast.success('Perjalanan dimulai!')
    setLoading(false)
  }

  const handleCompleteTrip = () => {
    setPhase('completing')
    setShowPayment(true)
  }

  const handleConfirmPayment = async (method: 'cash' | 'qris' | 'transfer') => {
    if (!order || !driverId) return
    setLoading(true)

    const finalPrice = currentPrice || order.estimated_price || 0

    await Promise.all([
      (supabase.from('orders') as any).update({
        status: 'completed',
        final_price: finalPrice,
        distance_meters: Math.round(distanceTraveled),
        payment_method: method,
        payment_status: 'paid',
      }).eq('id', order.id),
      (supabase.from('transactions') as any).insert({
        order_id: order.id,
        customer_id: order.customer_id,
        driver_id: driverId,
        amount: finalPrice,
        payment_method: method,
        status: 'paid',
      }),
    ])

    toast.success(`Pembayaran ${method.toUpperCase()} diterima! 🎉`)
    setLoading(false)
    router.push('/driver')
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-uti-maroon border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Memuat pesanan...</p>
        </div>
      </div>
    )
  }

  const driverCoords: [number, number] | null = lat && lng ? [lng, lat] : null
  const pickupCoords: [number, number] = [order.pickup_lng ?? 0, order.pickup_lat ?? 0]
  const dropoffCoords: [number, number] | null =
    order.dropoff_lng && order.dropoff_lat ? [order.dropoff_lng, order.dropoff_lat] : null

  const phaseLabel =
    phase === 'picking_up' ? '🛵 Menuju Lokasi Jemput' :
    phase === 'on_trip' ? '🏁 Sedang Mengantar' : '✅ Selesaikan Trip'

  return (
    <div className="fixed inset-0 flex flex-col" style={{ maxWidth: '28rem', margin: '0 auto' }}>
      {/* MAP — top portion */}
      <div className="relative" style={{ height: '55vh', minHeight: '300px' }}>
        <LiveMap
          pickupCoords={pickupCoords}
          dropoffCoords={dropoffCoords ?? undefined}
          driverCoords={driverCoords ?? undefined}
          height="100%"
        />
        {/* Overlay header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-3 px-4 pt-10 pb-4 bg-gradient-to-b from-black/50 to-transparent">
          <button
            onClick={() => router.push('/driver')}
            className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md flex-shrink-0"
            id="btn-nav-back"
          >
            <ArrowLeftIcon className="w-4 h-4 text-gray-700" />
          </button>
          <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">{getServiceIcon(order.service_type)}</span>
              <span className="font-bold text-xs text-gray-900">{getServiceLabel(order.service_type)}</span>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
        {/* Phase banner */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-uti-maroon text-white rounded-2xl px-4 py-2 text-center text-sm font-bold shadow-lg">
            {phaseLabel}
          </div>
        </div>
      </div>

      {/* BOTTOM PANEL — scrollable */}
      <div className="flex-1 bg-white rounded-t-3xl shadow-2xl overflow-y-auto">
        <div className="px-5 pt-4 pb-8">
          {/* Trip meter (on_trip) */}
          {phase === 'on_trip' && (
            <div className="flex items-center justify-between bg-uti-maroon-50 border border-uti-maroon-100 rounded-2xl px-4 py-3 mb-4">
              <div>
                <p className="text-xs text-uti-maroon-700 font-medium">Jarak Ditempuh</p>
                <p className="text-uti-maroon font-black text-xl">{formatDistance(Math.round(distanceTraveled))}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-uti-maroon-700 font-medium">Harga Saat Ini</p>
                <p className="font-black text-uti-maroon text-xl">{formatCurrency(currentPrice)}</p>
              </div>
            </div>
          )}

          {/* Customer info */}
          {customer && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-uti-maroon-100 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-5 h-5 text-uti-maroon" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{customer.full_name || 'Customer'}</p>
                {customer.phone && (
                  <p className="text-xs text-gray-500 truncate">{customer.phone}</p>
                )}
              </div>
              {customer.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"
                  id="btn-call-customer"
                >
                  <PhoneIcon className="w-4 h-4 text-green-600" />
                </a>
              )}
            </div>
          )}

          {/* Route info */}
          <div className="space-y-2 mb-5">
            <div className="flex items-start gap-3">
              <MapPinIcon className="w-4 h-4 text-uti-maroon mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Jemput</p>
                <p className="text-sm text-gray-800 font-medium leading-snug">{order.pickup_address}</p>
              </div>
            </div>
            {order.dropoff_address && (
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 flex-shrink-0 mt-0.5 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Antar</p>
                  <p className="text-sm text-gray-800 font-medium leading-snug">{order.dropoff_address}</p>
                </div>
              </div>
            )}
            {order.order_notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 ml-7">
                <p className="text-xs text-amber-700">📝 {order.order_notes}</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            {phase === 'picking_up' && (
              <>
                <Button fullWidth size="lg" onClick={handleArrived} loading={loading} id="btn-arrived">
                  ✅ Sudah Tiba di Lokasi Jemput
                </Button>
                <Button fullWidth variant="secondary" onClick={handleStartTrip} loading={loading} id="btn-start-trip">
                  🚀 Mulai Perjalanan Langsung
                </Button>
              </>
            )}
            {phase === 'on_trip' && (
              <Button fullWidth size="lg" onClick={handleCompleteTrip} id="btn-complete-trip">
                <CheckCircleIcon className="w-5 h-5" />
                Selesaikan Perjalanan
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Payment modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ maxWidth: '28rem', margin: '0 auto' }}>
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowPayment(false)} />
          <div className="relative w-full bg-white rounded-t-3xl p-6 animate-slide-up">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="font-black text-gray-900 text-xl mb-1">Pilih Metode Bayar</h3>
            <p className="text-gray-400 text-sm mb-1">Total yang harus dibayar</p>
            <p className="text-uti-maroon font-black text-3xl mb-6">
              {formatCurrency(currentPrice || order.estimated_price || 0)}
            </p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { method: 'cash' as const, icon: '💵', label: 'Tunai' },
                { method: 'qris' as const, icon: '📱', label: 'QRIS' },
                { method: 'transfer' as const, icon: '🏦', label: 'Transfer' },
              ].map(({ method, icon, label }) => (
                <button
                  key={method}
                  onClick={() => handleConfirmPayment(method)}
                  disabled={loading}
                  id={`btn-pay-${method}`}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100 hover:border-uti-maroon hover:bg-uti-maroon-50 transition-all active:scale-95 disabled:opacity-50"
                >
                  <span className="text-3xl">{icon}</span>
                  <span className="text-xs font-bold text-gray-700">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
