'use client'

import { useEffect, useState } from 'react'
import type { Order } from '@/types/database.types'
import { formatCurrency, formatDistance } from '@/lib/utils/formatters'
import { getServiceIcon, getServiceLabel } from '@/lib/utils/pricing'
import Button from '@/components/ui/Button'
import { MapPinIcon } from '@heroicons/react/24/solid'
import { createClient } from '@/lib/supabase/client'

interface OrderPopupProps {
  order: Order
  onAccept: (order: Order) => void
  onReject: () => void
}

export default function OrderPopup({ order, onAccept, onReject }: OrderPopupProps) {
  const [accepting, setAccepting] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [customerName, setCustomerName] = useState<string>('Customer')
  const supabase = createClient()

  useEffect(() => {
    // Auto-reject after countdown
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          onReject()
        }
        return c - 1
      })
    }, 1000)

    // Fetch customer name
    ;(supabase
      .from('profiles')
      .select('full_name')
      .eq('id', order.customer_id)
      .single() as any).then(({ data }: any) => {
        if (data?.full_name) setCustomerName(data.full_name)
      })

    return () => clearInterval(timer)
  }, [order.id])

  const handleAccept = async () => {
    setAccepting(true)
    await onAccept(order)
    setAccepting(false)
  }

  const countdownPercent = (countdown / 30) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center max-w-md mx-auto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative w-full bg-white rounded-t-3xl p-5 animate-bounce-in shadow-2xl">
        {/* Countdown Ring */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="4" />
              <circle
                cx="32" cy="32" r="28" fill="none"
                stroke="#7B1113" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - countdownPercent / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full border-2 border-gray-100">
              <span className="font-black text-uti-maroon text-lg">{countdown}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{getServiceIcon(order.service_type)}</span>
            <span className="font-black text-uti-maroon text-lg">{getServiceLabel(order.service_type)}</span>
          </div>
          <p className="text-gray-500 text-sm">Pesanan baru dari <strong className="text-gray-900">{customerName}</strong></p>
        </div>

        {/* Order Details */}
        <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100 mb-5">
          <div className="flex items-start gap-3 px-4 py-3">
            <MapPinIcon className="w-4 h-4 text-uti-maroon mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Jemput</p>
              <p className="text-sm text-gray-900">{order.pickup_address}</p>
            </div>
          </div>
          {order.dropoff_address && (
            <div className="flex items-start gap-3 px-4 py-3">
              <div className="w-4 h-4 flex-shrink-0 mt-0.5 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Antar</p>
                <p className="text-sm text-gray-900">{order.dropoff_address}</p>
              </div>
            </div>
          )}
          {order.item_details && (
            <div className="px-4 py-3">
              <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Detail</p>
              <p className="text-sm text-gray-700">
                {(order.item_details as { description?: string })?.description ?? JSON.stringify(order.item_details)}
              </p>
            </div>
          )}
          {order.order_notes && (
            <div className="px-4 py-3">
              <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Catatan</p>
              <p className="text-sm text-gray-700">{order.order_notes}</p>
            </div>
          )}
        </div>

        {/* Estimates */}
        {(order.distance_meters || order.estimated_price) && (
          <div className="flex items-center justify-between mb-5">
            {order.distance_meters && (
              <div>
                <p className="text-xs text-gray-400">Jarak Estimasi</p>
                <p className="font-bold text-gray-900">{formatDistance(order.distance_meters)}</p>
              </div>
            )}
            {order.estimated_price && (
              <div className="text-right">
                <p className="text-xs text-gray-400">Estimasi Pendapatan</p>
                <p className="font-black text-uti-maroon text-lg">{formatCurrency(order.estimated_price)}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={onReject}
            id="btn-reject-order"
          >
            Tolak
          </Button>
          <Button
            fullWidth
            size="md"
            onClick={handleAccept}
            loading={accepting}
            id="btn-accept-order"
          >
            ✓ Terima
          </Button>
        </div>
      </div>
    </div>
  )
}
