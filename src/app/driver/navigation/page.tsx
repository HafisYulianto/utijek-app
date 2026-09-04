'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDistance } from '@/lib/utils/formatters'
import { calculatePrice } from '@/lib/utils/pricing'
import { useDriverLocation } from '@/hooks/useDriverLocation'
import type { Order, PricingConfig } from '@/types/database.types'
import { MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/solid'

const LiveMap = dynamic(() => import('@/components/map/LiveMap'), { ssr: false })

type TripPhase = 'picking_up' | 'on_trip' | 'completing'

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

        const { data: pc } = await (supabase
          .from('pricing_config')
          .select('*')
          .eq('service_type', typedOrd.service_type)
          .single() as any)
        if (pc) setPricing(pc as PricingConfig)
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Memuat pesanan...</p>
      </div>
    )
  }

  const driverCoords: [number, number] | null = lat && lng ? [lng, lat] : null
  const pickupCoords: [number, number] = [order.pickup_lng ?? 0, order.pickup_lat ?? 0]
  const dropoffCoords: [number, number] | null =
    order.dropoff_lng && order.dropoff_lat ? [order.dropoff_lng, order.dropoff_lat] : null

  return (
    <div className="fixed inset-0 flex flex-col max-w-md mx-auto">
      <div className="flex-1 relative" style={{ height: '60vh' }}>
        <LiveMap
          pickupCoords={pickupCoords}
          dropoffCoords={dropoffCoords ?? undefined}
          driverCoords={driverCoords ?? undefined}
          height="100%"
        />
        <div className="absolute top-4 left-4">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <div className="bg-white rounded-t-3xl px-5 py-5 shadow-2xl">
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

        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2">
            <MapPinIcon className="w-4 h-4 text-uti-maroon mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 truncate">{order.pickup_address}</p>
          </div>
          {order.dropoff_address && (
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 flex-shrink-0 mt-0.5 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              </div>
              <p className="text-sm text-gray-700 truncate">{order.dropoff_address}</p>
            </div>
          )}
        </div>

        {phase === 'picking_up' && (
          <div className="space-y-2">
            <Button fullWidth size="lg" onClick={handleArrived} loading={loading} id="btn-arrived">
              Sudah Tiba di Lokasi Jemput
            </Button>
            <Button fullWidth variant="secondary" onClick={handleStartTrip} loading={loading} id="btn-start-trip">
              Mulai Perjalanan Langsung
            </Button>
          </div>
        )}

        {phase === 'on_trip' && (
          <Button fullWidth size="lg" onClick={handleCompleteTrip} id="btn-complete-trip">
            <CheckCircleIcon className="w-5 h-5" />
            Selesaikan Perjalanan
          </Button>
        )}
      </div>

      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-end justify-center max-w-md mx-auto">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-full bg-white rounded-t-3xl p-6 animate-slide-up">
            <h3 className="font-black text-gray-900 text-xl mb-1">Pilih Metode Bayar</h3>
            <p className="text-gray-500 text-sm mb-1">Total Akhir</p>
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
