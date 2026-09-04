import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import AnalyticsChart from '@/components/admin/AnalyticsChart'
import Card from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils/formatters'

export const metadata: Metadata = { title: 'Dashboard | Admin UTIJEK' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalOrders },
    { count: totalDrivers },
    { count: totalCustomers },
    { data: todayTxns },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }) as any,
    (supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'driver') as any),
    (supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer') as any),
    (supabase
      .from('transactions')
      .select('amount')
      .eq('status', 'paid')
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()) as any),
    (supabase
      .from('orders')
      .select('id, service_type, status, estimated_price, final_price, created_at, pickup_address, customer:profiles!customer_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(10) as any),
  ])

  const todayRevenue = (todayTxns as any[])?.reduce((s: number, t: any) => s + (t.amount ?? 0), 0) ?? 0

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: chartData } = await (supabase
    .from('orders')
    .select('created_at, final_price, status')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .eq('status', 'completed')
    .order('created_at') as any)

  const statsCards = [
    { label: 'Pendapatan Hari Ini', value: formatCurrency(todayRevenue), icon: '💰', color: 'text-uti-maroon' },
    { label: 'Total Pesanan', value: totalOrders ?? 0, icon: '📋', color: 'text-blue-600' },
    { label: 'Total Driver', value: totalDrivers ?? 0, icon: '🛵', color: 'text-green-600' },
    { label: 'Total Customer', value: totalCustomers ?? 0, icon: '👥', color: 'text-purple-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Dashboard Analitik</h1>
        <p className="text-sm text-gray-500 mt-1">Overview bisnis UTIJEK secara real-time</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.label} padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card padding="lg">
        <h2 className="font-bold text-gray-900 mb-4">Grafik Pesanan (30 Hari Terakhir)</h2>
        <AnalyticsChart data={chartData ?? []} />
      </Card>

      <Card padding="lg">
        <h2 className="font-bold text-gray-900 mb-4">Pesanan Terbaru</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Customer', 'Layanan', 'Lokasi Jemput', 'Harga', 'Status'].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(recentOrders as any[])?.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3 font-medium text-gray-900">{order.customer?.full_name ?? '-'}</td>
                  <td className="py-3 px-3 uppercase text-xs font-bold text-uti-maroon">{order.service_type}</td>
                  <td className="py-3 px-3 text-gray-500 max-w-[200px] truncate">{order.pickup_address}</td>
                  <td className="py-3 px-3 font-semibold">
                    {order.final_price ? formatCurrency(order.final_price) : order.estimated_price ? `~${formatCurrency(order.estimated_price)}` : '-'}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{order.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
