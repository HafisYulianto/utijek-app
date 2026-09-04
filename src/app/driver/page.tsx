'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders'
import { useDriverLocation } from '@/hooks/useDriverLocation'
import OnlineToggle from '@/components/driver/OnlineToggle'
import OrderPopup from '@/components/driver/OrderPopup'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils/formatters'
import { getServiceIcon } from '@/lib/utils/pricing'
import type { Order, Profile, DriverProfile } from '@/types/database.types'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Card from '@/components/ui/Card'

export default function DriverDashboardPage() {
  const supabase = createClient()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  const [popupOrder, setPopupOrder] = useState<Order | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [todayEarnings, setTodayEarnings] = useState(0)
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [{ data: prof }, { data: driverProf }] = await Promise.all([
        (supabase.from('profiles').select('*').eq('id', user.id).single() as any),
        (supabase.from('driver_profiles').select('*').eq('id', user.id).single() as any),
      ])

      if (prof) setProfile(prof as Profile)
      if (driverProf) {
        setDriverProfile(driverProf as DriverProfile)
        setIsOnline((driverProf as DriverProfile).is_online)
      }

      const { data: orders } = await (supabase
        .from('orders')
        .select('*')
        .eq('driver_id', user.id)
        .in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(5) as any)

      if (orders) setRecentOrders(orders as Order[])

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { data: txns } = await (supabase
        .from('transactions')
        .select('amount')
        .eq('driver_id', user.id)
        .eq('status', 'paid')
        .gte('created_at', today.toISOString()) as any)

      if (txns) setTodayEarnings((txns as any[]).reduce((sum: number, t: any) => sum + (t.amount ?? 0), 0))
    }
    init()
  }, [])

  useDriverLocation({ driverId: userId, isOnline })

  useRealtimeOrders({
    role: 'driver',
    driverId: userId,
    onNewOrder: (order) => {
      if (isOnline) setPopupOrder(order)
    },
  })

  const handleToggleOnline = async (value: boolean) => {
    const { error } = await (supabase.from('driver_profiles') as any)
      .update({
        is_online: value,
        last_seen: new Date().toISOString(),
        ...(value ? {} : { current_lat: null, current_lng: null }),
      })
      .eq('id', userId)

    if (!error) {
      setIsOnline(value)
      toast.success(value ? '🟢 Kamu sekarang Online!' : '🔴 Kamu Offline')
    }
  }

  const handleAcceptOrder = async (order: Order) => {
    const { error } = await (supabase.from('orders') as any)
      .update({ driver_id: userId, status: 'accepted' })
      .eq('id', order.id)
      .eq('status', 'pending')

    if (error) {
      toast.error('Pesanan sudah diambil driver lain')
      setPopupOrder(null)
      return
    }

    setPopupOrder(null)
    toast.success('Pesanan diterima!')
    router.push(`/driver/navigation?orderId=${order.id}`)
  }

  const handleRejectOrder = () => { setPopupOrder(null) }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Driver'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-maroon-gradient px-5 pt-10 pb-6 safe-top">
        <div className="flex items-center justify-between mb-4">
          <Image
            src="/logo_teks.png"
            alt="UTIJEK"
            width={120}
            height={36}
            priority
            className="h-7 w-auto object-contain brightness-0 invert"
          />
          <span className="text-[11px] font-bold text-white/90 bg-white/15 px-2.5 py-0.5 rounded-full">
            Driver Partner
          </span>
        </div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-uti-maroon-200 text-xs font-medium">Halo,</p>
            <h1 className="text-white text-xl font-bold">{firstName} 👋</h1>
            <p className="text-uti-maroon-200 text-xs mt-0.5">
              {driverProfile?.vehicle_type} • {driverProfile?.vehicle_plate}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 overflow-hidden border-2 border-white/30 flex items-center justify-center">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="Avatar" width={48} height={48} className="object-cover" />
            ) : (
              <span className="text-white font-bold text-lg">{getInitials(profile?.full_name ?? null)}</span>
            )}
          </div>
        </div>
        <OnlineToggle isOnline={isOnline} onToggle={handleToggleOnline} />
      </header>

      <div className="px-5 -mt-2 mb-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Hari Ini', value: formatCurrency(todayEarnings) },
            { label: 'Total Trip', value: driverProfile?.total_trips ?? 0 },
            { label: 'Rating', value: `⭐ ${driverProfile?.rating?.toFixed(1) ?? '5.0'}` },
          ].map((stat) => (
            <Card key={stat.label} padding="sm" className="text-center">
              <p className="text-[11px] text-gray-500">{stat.label}</p>
              <p className="font-black text-gray-900 text-sm mt-0.5">{stat.value}</p>
            </Card>
          ))}
        </div>
      </div>

      <section className="px-5">
        <h2 className="section-title mb-3">Pesanan Terakhir</h2>
        {recentOrders.length === 0 ? (
          <Card className="text-center py-8">
            <span className="text-3xl">🛵</span>
            <p className="text-gray-500 text-sm mt-2">Belum ada pesanan</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <Card key={order.id} padding="sm" className="flex items-center gap-3">
                <span className="text-2xl">{getServiceIcon(order.service_type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{order.pickup_address}</p>
                  <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-uti-maroon">
                    {order.final_price ? formatCurrency(order.final_price) : '-'}
                  </p>
                  <OrderStatusBadge status={order.status} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {popupOrder && (
        <OrderPopup order={popupOrder} onAccept={handleAcceptOrder} onReject={handleRejectOrder} />
      )}
    </div>
  )
}
