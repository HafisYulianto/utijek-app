'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import { OrderStatusBadge } from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatDistance } from '@/lib/utils/formatters'
import { calculatePrice, getServiceLabel, getServiceIcon } from '@/lib/utils/pricing'
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders'
import type { ServiceType, PricingConfig, Order } from '@/types/database.types'
import LiveChatDrawer from '@/components/customer/LiveChatDrawer'
import LocationSearchInput from '@/components/customer/LocationSearchInput'
import { POPULAR_LOCATIONS } from '@/lib/data/lampungLocations'
import {
  MapPinIcon,
  ArrowRightIcon,
  ChevronUpIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid'

const LiveMap = dynamic(() => import('@/components/map/LiveMap'), { ssr: false })

type BookingStep = 'input' | 'confirming' | 'searching' | 'active'

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const serviceType = params.service as ServiceType
  const supabase = createClient()

  const [step, setStep] = useState<BookingStep>('input')
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null)
  const [pickupAddress, setPickupAddress] = useState('')
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null)
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [selectingFor, setSelectingFor] = useState<'pickup' | 'dropoff'>('pickup')
  const [notes, setNotes] = useState('')
  const [pricing, setPricing] = useState<PricingConfig | null>(null)
  const [distance, setDistance] = useState<number>(0)
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [driverCoords, setDriverCoords] = useState<[number, number] | null>(null)
  const [loading, setLoading] = useState(false)
  const [sheetExpanded, setSheetExpanded] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [itemDetails, setItemDetails] = useState('')

  const isUTIBASING = serviceType === 'utibasing'
  const needsDropoff = serviceType !== 'utibasing'

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  // Load pricing config
  useEffect(() => {
    ;(supabase
      .from('pricing_config')
      .select('*')
      .eq('service_type', serviceType)
      .single() as any)
      .then(({ data }: any) => { if (data) setPricing(data) })
  }, [serviceType])

  // Calculate distance when both coords set
  useEffect(() => {
    if (!pickupCoords || !dropoffCoords || isUTIBASING) return
    const fetchRoute = async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupCoords[0]},${pickupCoords[1]};${dropoffCoords[0]},${dropoffCoords[1]}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
        )
        const data = await res.json()
        const distMeters = Math.round(data.routes?.[0]?.distance ?? 0)
        setDistance(distMeters)
        if (pricing) setEstimatedPrice(calculatePrice(distMeters, pricing))
      } catch {}
    }
    fetchRoute()
  }, [pickupCoords, dropoffCoords, pricing])

  // Realtime: track order status
  useRealtimeOrders({
    role: 'customer',
    customerId: userId,
    onOrderUpdate: (order) => {
      setCurrentOrder(order)
      if (order.status === 'accepted') {
        setStep('active')
        toast.success('Driver ditemukan! Sedang menuju lokasi Anda.')
      }
      if (order.status === 'completed') {
        toast.success('Perjalanan selesai! Terima kasih.')
        setTimeout(() => router.push('/orders'), 2000)
      }
    },
  })

  // Track driver location for active order
  useEffect(() => {
    if (!currentOrder?.driver_id) return
    const channel = supabase
      .channel(`driver-loc-${currentOrder.driver_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_profiles',
          filter: `id=eq.${currentOrder.driver_id}`,
        },
        (payload) => {
          const dp = payload.new
          if (dp.current_lat && dp.current_lng) {
            setDriverCoords([dp.current_lng, dp.current_lat])
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentOrder?.driver_id])

  const [manualMapTarget, setManualMapTarget] = useState<'pickup' | 'dropoff' | null>(null)

  const handleMapClick = useCallback(
    (coords: [number, number], address: string) => {
      // If manual map mode is not explicitly enabled, do nothing to prevent accidental clicks
      if (!manualMapTarget) return

      if (manualMapTarget === 'pickup') {
        setPickupCoords(coords)
        setPickupAddress(address)
        toast.success('📍 Titik jemput dipilih dari peta')
        setManualMapTarget(needsDropoff && !dropoffCoords ? 'dropoff' : null)
      } else {
        setDropoffCoords(coords)
        setDropoffAddress(address)
        toast.success('🏁 Titik antar dipilih dari peta')
        setManualMapTarget(null)
      }
    },
    [manualMapTarget, needsDropoff, dropoffCoords]
  )

  const handleSubmitOrder = async () => {
    if (!pickupCoords || !pickupAddress) {
      toast.error('Pilih titik jemput di peta')
      return
    }
    if (needsDropoff && (!dropoffCoords || !dropoffAddress)) {
      toast.error('Pilih titik antar di peta')
      return
    }

    setLoading(true)
    const { data: order, error } = await (supabase.from('orders') as any)
      .insert({
        customer_id: userId,
        service_type: serviceType,
        status: 'pending',
        pickup_lat: pickupCoords[1],
        pickup_lng: pickupCoords[0],
        pickup_address: pickupAddress,
        dropoff_lat: dropoffCoords?.[1] ?? null,
        dropoff_lng: dropoffCoords?.[0] ?? null,
        dropoff_address: dropoffAddress || null,
        distance_meters: distance || null,
        estimated_price: estimatedPrice || null,
        order_notes: notes || null,
        item_details: itemDetails ? { description: itemDetails } : null,
      })
      .select()
      .single()

    setLoading(false)
    if (error || !order) {
      toast.error('Gagal membuat pesanan. Coba lagi.')
      return
    }

    setCurrentOrder(order)
    setStep('searching')
    toast.loading('Mencari driver terdekat...', { id: 'searching' })
  }

  const handleCancelOrder = async () => {
    if (!currentOrder) return
    await (supabase.from('orders') as any)
      .update({ status: 'cancelled' })
      .eq('id', currentOrder.id)
    toast.dismiss('searching')
    toast.success('Pesanan dibatalkan')
    setStep('input')
    setCurrentOrder(null)
  }

  return (
    <div className="fixed inset-0 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-3 px-4 pt-safe-top py-3 bg-gradient-to-b from-black/40 to-transparent">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md"
          id="btn-back"
        >
          <XMarkIcon className="w-4 h-4 text-gray-700" />
        </button>
        <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-md">
          <span className="text-lg">{getServiceIcon(serviceType)}</span>
          <span className="font-bold text-sm text-gray-900">{getServiceLabel(serviceType)}</span>
        </div>
        {currentOrder && <OrderStatusBadge status={currentOrder.status} />}
      </div>

      {/* MAP — top half */}
      <div
        className="flex-1 relative"
        style={{ height: sheetExpanded ? '50vh' : '75vh' }}
      >
        <LiveMap
          pickupCoords={pickupCoords}
          dropoffCoords={dropoffCoords}
          driverCoords={driverCoords}
          onMapClick={step === 'input' ? handleMapClick : undefined}
          height="100%"
        />

        {/* Manual map mode banner */}
        {manualMapTarget && (
          <div className="absolute top-16 left-4 right-4 z-20 bg-amber-500/95 text-white px-4 py-2.5 rounded-2xl shadow-lg flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">🗺️</span>
              <p className="text-xs font-bold">
                Ketuk di peta untuk Titik {manualMapTarget === 'pickup' ? 'Jemput' : 'Antar'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setManualMapTarget(null)}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[11px] font-bold"
            >
              Selesai
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM SHEET */}
      <div
        className={`bottom-sheet transition-all duration-300 ${
          sheetExpanded ? '' : 'translate-y-[calc(100%-5rem)]'
        }`}
      >
        {/* Drag handle */}
        <button
          className="w-full flex flex-col items-center pt-3 pb-2"
          onClick={() => setSheetExpanded(!sheetExpanded)}
          id="btn-toggle-sheet"
        >
          <div className="bottom-sheet-handle" />
          <ChevronUpIcon
            className={`w-4 h-4 text-gray-400 transition-transform ${sheetExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        <div className="px-5 pb-8 max-h-[55vh] overflow-y-auto scrollbar-hide">
          {/* INPUT STEP */}
          {step === 'input' && (
            <div className="space-y-4">
              {/* Pickup location search */}
              <LocationSearchInput
                label="Titik Jemput"
                type="pickup"
                value={pickupAddress}
                coords={pickupCoords}
                onSelect={(item) => {
                  setPickupAddress(item.name)
                  setPickupCoords(item.coords)
                  setManualMapTarget(null)
                }}
                onClear={() => {
                  setPickupAddress('')
                  setPickupCoords(null)
                }}
                onManualMapPick={() => {
                  setManualMapTarget('pickup')
                  toast('Silakan ketuk titik di peta untuk jemput', { icon: '📍' })
                }}
                isManualMapActive={manualMapTarget === 'pickup'}
                placeholder="Ketik nama tempat jemput (cth: Teknokrat...)"
              />

              {/* Dropoff location search */}
              {needsDropoff && (
                <LocationSearchInput
                  label="Titik Antar (Tujuan)"
                  type="dropoff"
                  value={dropoffAddress}
                  coords={dropoffCoords}
                  onSelect={(item) => {
                    setDropoffAddress(item.name)
                    setDropoffCoords(item.coords)
                    setManualMapTarget(null)
                  }}
                  onClear={() => {
                    setDropoffAddress('')
                    setDropoffCoords(null)
                  }}
                  onManualMapPick={() => {
                    setManualMapTarget('dropoff')
                    toast('Silakan ketuk titik di peta untuk tujuan antar', { icon: '🏁' })
                  }}
                  isManualMapActive={manualMapTarget === 'dropoff'}
                  placeholder="Ketik nama tujuan antar (cth: MBK, Unila...)"
                />
              )}

              {/* Quick Popular Chips */}
              <div className="pt-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-bold text-gray-500">Paling Sering Dituju:</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {POPULAR_LOCATIONS.slice(0, 6).map((loc) => (
                    <button
                      key={loc.name}
                      type="button"
                      onClick={() => {
                        if (!pickupCoords) {
                          setPickupAddress(loc.name)
                          setPickupCoords(loc.coords)
                          toast.success(`📍 Jemput: ${loc.name.split('(')[0].trim()}`)
                        } else if (needsDropoff && !dropoffCoords) {
                          setDropoffAddress(loc.name)
                          setDropoffCoords(loc.coords)
                          toast.success(`🏁 Antar: ${loc.name.split('(')[0].trim()}`)
                        } else {
                          setDropoffAddress(loc.name)
                          setDropoffCoords(loc.coords)
                          toast.success(`🏁 Antar diubah: ${loc.name.split('(')[0].trim()}`)
                        }
                      }}
                      className="shrink-0 px-3 py-1.5 bg-gray-100 hover:bg-uti-maroon-50 hover:text-uti-maroon text-gray-700 text-xs font-semibold rounded-full border border-gray-200 transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <span>{loc.icon}</span>
                      <span>{loc.name.split('(')[0].trim()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Item details for UTIKAN/UTITIP */}
              {(serviceType === 'utikan' || serviceType === 'utitip') && (
                <div>
                  <label className="label">Detail {serviceType === 'utikan' ? 'Pesanan' : 'Barang'}</label>
                  <textarea
                    className="input-field resize-none h-20"
                    placeholder={serviceType === 'utikan' ? 'Contoh: Nasi goreng 2 porsi + es teh...' : 'Contoh: Dokumen A4, 500gr...'}
                    value={itemDetails}
                    onChange={(e) => setItemDetails(e.target.value)}
                    id="input-item-details"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="label">Catatan (opsional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: Depan warung, pakai helm hitam..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  id="input-order-notes"
                />
              </div>

              {/* Price estimation */}
              {distance > 0 && pricing && (
                <div className="flex items-center justify-between bg-uti-maroon-50 border border-uti-maroon-100 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-xs text-uti-maroon-700 font-medium">Estimasi Harga</p>
                    <p className="text-uti-maroon font-black text-lg">{formatCurrency(estimatedPrice)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Jarak</p>
                    <p className="text-sm font-bold text-gray-700">{formatDistance(distance)}</p>
                  </div>
                </div>
              )}

              {/* UTIBASING note */}
              {isUTIBASING && (
                <div className="flex items-start gap-2 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                  <span className="text-lg">💬</span>
                  <p className="text-xs text-purple-700">
                    <strong>UTIBASING</strong> adalah layanan kustom. Setelah pesanan diterima driver, Anda bisa chat langsung untuk negosiasi detail dan harga.
                  </p>
                </div>
              )}

              <Button
                fullWidth
                size="lg"
                onClick={handleSubmitOrder}
                loading={loading}
                disabled={!pickupAddress || (needsDropoff && !dropoffAddress)}
                id="btn-submit-order"
              >
                <ArrowRightIcon className="w-5 h-5" />
                {isUTIBASING ? 'Cari Driver' : 'Pesan Sekarang'}
              </Button>
            </div>
          )}

          {/* SEARCHING STEP */}
          {step === 'searching' && (
            <div className="text-center py-6">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-uti-maroon-50 flex items-center justify-center">
                    <span className="text-3xl">🛵</span>
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-uti-maroon animate-ping opacity-30" />
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Mencari Driver...</h3>
              <p className="text-sm text-gray-500 mb-6">Mohon tunggu, driver sedang dicari</p>
              <button
                onClick={handleCancelOrder}
                className="text-sm text-red-500 underline"
                id="btn-cancel-order"
              >
                Batalkan Pesanan
              </button>
            </div>
          )}

          {/* ACTIVE ORDER STEP */}
          {step === 'active' && currentOrder && (
            <div className="space-y-4">
              <OrderStatusBadge status={currentOrder.status} />

              <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                <div className="flex items-center gap-3 px-3 py-3">
                  <MapPinIcon className="w-4 h-4 text-uti-maroon flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{currentOrder.pickup_address}</span>
                </div>
                {currentOrder.dropoff_address && (
                  <div className="flex items-center gap-3 px-3 py-3">
                    <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    </div>
                    <span className="text-sm text-gray-700 truncate">{currentOrder.dropoff_address}</span>
                  </div>
                )}
              </div>

              {currentOrder.estimated_price && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Estimasi Harga</span>
                  <span className="font-bold text-uti-maroon">{formatCurrency(currentOrder.estimated_price)}</span>
                </div>
              )}

              {/* Chat button for UTIBASING */}
              {isUTIBASING && (
                <Button fullWidth variant="outline" onClick={() => setChatOpen(true)} id="btn-open-chat">
                  💬 Chat dengan Driver
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* UTIBASING Chat Drawer */}
      {chatOpen && currentOrder && (
        <LiveChatDrawer
          orderId={currentOrder.id}
          userId={userId}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  )
}
