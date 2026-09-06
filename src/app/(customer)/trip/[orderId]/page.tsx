'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils/formatters'
import { getServiceIcon, getServiceLabel } from '@/lib/utils/pricing'
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders'
import LiveChatDrawer from '@/components/customer/LiveChatDrawer'
import type { Order } from '@/types/database.types'
import {
  ArrowLeftIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid'

const LiveMap = dynamic(() => import('@/components/map/LiveMap'), { ssr: false })

interface DriverInfo {
  full_name: string | null
  phone: string | null
  vehicle_type: string
  vehicle_plate: string
  vehicle_color: string | null
}

export default function TripTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string
  const supabase = createClient()

  const [order, setOrder] = useState<Order | null>(null)
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null)
  const [driverCoords, setDriverCoords] = useState<[number, number] | null>(null)
  const [userId, setUserId] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: ord } = await (supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single() as any)

      if (!ord) { router.push('/orders'); return }
      setOrder(ord as Order)
      setLoading(false)

      // Fetch driver info if driver is assigned
      if (ord.driver_id) {
        fetchDriverInfo(ord.driver_id)
      }
    }
    init()
  }, [orderId])

  const fetchDriverInfo = async (driverId: string) => {
    const [{ data: prof }, { data: dp }] = await Promise.all([
      (supabase.from('profiles').select('full_name, phone').eq('id', driverId).single() as any),
      (supabase.from('driver_profiles').select('vehicle_type, vehicle_plate, vehicle_color').eq('id', driverId).single() as any),
    ])
    if (prof && dp) setDriverInfo({ ...prof, ...dp })
  }

  // Realtime order status updates
  useRealtimeOrders({
    role: 'customer',
    customerId: userId,
    onOrderUpdate: async (updated) => {
      if (updated.id !== orderId) return
      setOrder(updated)
      if (updated.status === 'accepted' && updated.driver_id) {
        toast.success('Driver ditemukan! Sedang menuju lokasi Anda.')
        fetchDriverInfo(updated.driver_id)
      }
      if (updated.status === 'on_trip') {
        toast('Driver sedang dalam perjalanan mengantar Anda! 🏁', { icon: '🛵' })
      }
      if (updated.status === 'completed') {
        toast.success('Perjalanan selesai! Terima kasih telah menggunakan UTIJEK 🎉')
        setTimeout(() => router.push('/orders'), 2500)
      }
      if (updated.status === 'cancelled') {
        toast.error('Pesanan dibatalkan.')
        setTimeout(() => router.push('/orders'), 2000)
      }
    },
  })

  // Track driver location in realtime
  useEffect(() => {
    if (!order?.driver_id) return
    const channel = supabase
      .channel(`trip-driver-loc-${order.driver_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_profiles',
          filter: `id=eq.${order.driver_id}`,
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
  }, [order?.driver_id])

  const handleCancel = async () => {
    if (!order || !['pending', 'accepted'].includes(order.status)) return
    setCancelling(true)
    const { error } = await (supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId) as any)
    if (!error) {
      toast.success('Pesanan dibatalkan.')
      router.push('/orders')
    } else {
      toast.error('Gagal membatalkan pesanan.')
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-uti-maroon border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Memuat status trip...</p>
        </div>
      </div>
    )
  }

  if (!order) return null

  const pickupCoords: [number, number] = [order.pickup_lng ?? 0, order.pickup_lat ?? 0]
  const dropoffCoords: [number, number] | null =
    order.dropoff_lng && order.dropoff_lat ? [order.dropoff_lng, order.dropoff_lat] : null

  const canCancel = ['pending', 'accepted'].includes(order.status)
  const isCompleted = ['completed', 'cancelled'].includes(order.status)

  const statusMessage: Record<string, string> = {
    pending: '🔍 Mencari driver terdekat...',
    accepted: '🛵 Driver sedang menuju lokasi jemput',
    picking_up: '📍 Driver sudah tiba, menunggu Anda',
    on_trip: '🏁 Perjalanan sedang berlangsung',
    completed: '✅ Perjalanan selesai',
    cancelled: '❌ Pesanan dibatalkan',
  }

  return (
    <div className="fixed inset-0 flex flex-col" style={{ maxWidth: '28rem', margin: '0 auto' }}>
      {/* MAP */}
      <div className="relative" style={{ height: '55vh', minHeight: '280px' }}>
        <LiveMap
          pickupCoords={pickupCoords}
          dropoffCoords={dropoffCoords ?? undefined}
          driverCoords={driverCoords ?? undefined}
          height="100%"
        />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-3 px-4 pt-10 pb-4 bg-gradient-to-b from-black/50 to-transparent">
          <button
            onClick={() => router.push('/orders')}
            className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md flex-shrink-0"
            id="btn-back-to-orders"
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

        {/* Status banner */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className={`rounded-2xl px-4 py-2.5 text-center text-sm font-bold shadow-lg text-white ${
            isCompleted ? 'bg-gray-600' : 'bg-uti-maroon'
          }`}>
            {statusMessage[order.status] ?? order.status}
          </div>
        </div>
      </div>

      {/* BOTTOM PANEL */}
      <div className="flex-1 bg-white rounded-t-3xl shadow-2xl scroll-panel min-h-0">
        <div className="px-5 pt-4 pb-8 space-y-4">

          {/* Driver info — shown when driver assigned */}
          {driverInfo ? (
            <div className="bg-uti-maroon-50 border border-uti-maroon-100 rounded-2xl px-4 py-3">
              <p className="text-[10px] text-uti-maroon-700 font-bold uppercase tracking-wide mb-2">Driver Kamu</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-uti-maroon flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-black text-lg">
                    {driverInfo.full_name?.charAt(0)?.toUpperCase() || 'D'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 text-base truncate">{driverInfo.full_name || 'Driver'}</p>
                  <p className="text-xs text-gray-500">
                    {driverInfo.vehicle_color ? `${driverInfo.vehicle_color} · ` : ''}
                    {driverInfo.vehicle_type} ·{' '}
                    <span className="font-bold text-uti-maroon">{driverInfo.vehicle_plate}</span>
                  </p>
                </div>
                {driverInfo.phone && (
                  <a
                    href={`tel:${driverInfo.phone}`}
                    className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"
                    id="btn-call-driver-trip"
                  >
                    <PhoneIcon className="w-5 h-5 text-green-600" />
                  </a>
                )}
              </div>
            </div>
          ) : order.status === 'pending' ? (
            <div className="flex items-center gap-4 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-4">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-uti-maroon-50 flex items-center justify-center">
                  <span className="text-2xl">🛵</span>
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-uti-maroon animate-ping opacity-30" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Mencari Driver...</p>
                <p className="text-xs text-gray-500">Harap tunggu, driver sedang dicari di sekitar lokasi kamu</p>
              </div>
            </div>
          ) : null}

          {/* Route info */}
          <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100">
            <div className="flex items-start gap-3 px-4 py-3">
              <span className="text-uti-maroon text-base mt-0.5">📍</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Titik Jemput</p>
                <p className="text-sm text-gray-800 font-medium leading-snug">{order.pickup_address}</p>
              </div>
            </div>
            {order.dropoff_address && (
              <div className="flex items-start gap-3 px-4 py-3">
                <span className="text-blue-500 text-base mt-0.5">🏁</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Tujuan Antar</p>
                  <p className="text-sm text-gray-800 font-medium leading-snug">{order.dropoff_address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Price */}
          {(order.estimated_price || order.final_price) && (
            <div className="flex justify-between items-center bg-gray-50 rounded-2xl px-4 py-3">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">
                  {order.final_price ? 'Total Biaya' : 'Estimasi Biaya'}
                </p>
                <p className="font-black text-uti-maroon text-lg">
                  {formatCurrency(order.final_price ?? order.estimated_price ?? 0)}
                </p>
              </div>
              {order.payment_method && (
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-lg font-semibold uppercase">
                  {order.payment_method}
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            {/* Chat button — for all active orders */}
            {!isCompleted && order.driver_id && (
              <button
                onClick={() => setChatOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-uti-maroon text-uti-maroon font-bold text-sm transition-all hover:bg-uti-maroon hover:text-white active:scale-95"
                id="btn-chat-driver"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                Chat dengan Driver
              </button>
            )}

            {/* Cancel button — only if cancellable */}
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-red-200 text-red-500 font-bold text-sm transition-all hover:bg-red-50 active:scale-95 disabled:opacity-50"
                id="btn-cancel-trip"
              >
                <XCircleIcon className="w-5 h-5" />
                {cancelling ? 'Membatalkan...' : 'Batalkan Pesanan'}
              </button>
            )}
          </div>

          {/* Notes */}
          {order.order_notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-[10px] text-amber-600 font-bold uppercase mb-1">Catatan</p>
              <p className="text-xs text-amber-800">{order.order_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat drawer */}
      {chatOpen && (
        <LiveChatDrawer
          orderId={orderId}
          userId={userId}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  )
}
