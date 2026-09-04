'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { OrderStatusBadge } from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { getServiceIcon, getServiceLabel } from '@/lib/utils/pricing'
import type { Order } from '@/types/database.types'
import {
  ClipboardDocumentListIcon,
  MapPinIcon,
  ChevronRightIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

type FilterTab = 'all' | 'completed' | 'cancelled'

export default function DriverOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FilterTab>('all')
  const supabase = createClient()

  const fetchOrders = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await (supabase
      .from('orders')
      .select('*, customer:profiles!customer_id(full_name, phone)')
      .eq('driver_id', user.id)
      .order('created_at', { ascending: false }) as any)

    if (data) setOrders(data as Order[])
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const filteredOrders = orders.filter((order) => {
    if (tab === 'completed') return order.status === 'completed'
    if (tab === 'cancelled') return order.status === 'cancelled'
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white px-5 pt-12 pb-4 border-b border-gray-100 safe-top sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Riwayat Trip Driver</h1>
          <p className="text-xs text-gray-500">Semua pesanan yang telah kamu selesaikan</p>
        </div>
        <button
          onClick={fetchOrders}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          title="Segarkan"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Tabs */}
      <div className="px-5 pt-4">
        <div className="flex bg-gray-200/70 p-1 rounded-xl">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'completed', label: 'Selesai' },
            { id: 'cancelled', label: 'Dibatalkan' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as FilterTab)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                tab === t.id
                  ? 'bg-white text-uti-maroon shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="px-5 pt-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <LoadingSpinner size="lg" />
            <p className="text-xs mt-3">Memuat riwayat trip...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
              <ClipboardDocumentListIcon className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm">Belum Ada Riwayat Trip</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              {tab === 'completed'
                ? 'Belum ada trip yang berhasil diselesaikan.'
                : 'Belum ada riwayat pesanan yang tercatat.'}
            </p>
            <Link
              href="/driver"
              className="mt-4 px-4 py-2 bg-uti-maroon text-white text-xs font-bold rounded-xl shadow-md hover:bg-uti-maroon-600 transition-colors"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        ) : (
          filteredOrders.map((order: any) => {
            const isActive = ['accepted', 'picking_up', 'on_trip'].includes(order.status)
            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getServiceIcon(order.service_type)}</span>
                    <div>
                      <span className="font-bold text-sm text-gray-900 block leading-tight">
                        {getServiceLabel(order.service_type)}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="w-4 h-4 text-uti-maroon shrink-0 mt-0.5" />
                    <span className="text-gray-700 truncate">{order.pickup_address}</span>
                  </div>
                  {order.dropoff_address && (
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 shrink-0 flex items-center justify-center mt-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      </div>
                      <span className="text-gray-700 truncate">{order.dropoff_address}</span>
                    </div>
                  )}
                  {order.customer?.full_name && (
                    <div className="text-[11px] text-gray-500 pt-1 border-t border-gray-200/60">
                      Pelanggan: <strong className="text-gray-700">{order.customer.full_name}</strong>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Pendapatan</span>
                    <span className="text-sm font-black text-uti-maroon">
                      {order.final_price ? formatCurrency(order.final_price) : order.estimated_price ? formatCurrency(order.estimated_price) : '-'}
                    </span>
                  </div>

                  {isActive && (
                    <Link
                      href={`/driver/navigation?orderId=${order.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-green-700 transition-colors"
                    >
                      Lanjut Navigasi
                      <ChevronRightIcon className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
