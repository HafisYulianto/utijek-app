import { createClient } from '@/lib/supabase/server'
import Card from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { OrderStatusBadge } from '@/components/ui/Badge'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Transaksi | Admin UTIJEK' }

interface SearchParams { driver?: string; service?: string; period?: string }

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()

  const { data: drivers } = await (supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'driver')
    .order('full_name') as any)

  let query = (supabase
    .from('orders')
    .select(`
      id, service_type, status, final_price, estimated_price, 
      payment_method, payment_status, created_at,
      customer:profiles!customer_id(full_name),
      driver:profiles!driver_id(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100) as any)

  if (searchParams.driver) query = query.eq('driver_id', searchParams.driver)
  if (searchParams.service) query = query.eq('service_type', searchParams.service)
  if (searchParams.period) {
    const now = new Date()
    let from: Date
    if (searchParams.period === 'today') from = new Date(now.setHours(0, 0, 0, 0))
    else if (searchParams.period === 'week') from = new Date(now.setDate(now.getDate() - 7))
    else if (searchParams.period === 'month') from = new Date(now.setMonth(now.getMonth() - 1))
    else from = new Date(now.setFullYear(now.getFullYear() - 1))
    query = query.gte('created_at', from.toISOString())
  }

  const { data: orders } = await query

  const orderList = (orders as any[]) ?? []
  const totalRevenue = orderList.reduce((s: number, o: any) => s + ((o.final_price ?? o.estimated_price) ?? 0), 0)
  const completedCount = orderList.filter((o: any) => o.status === 'completed').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Riwayat Transaksi</h1>
        <p className="text-sm text-gray-500 mt-1">{orderList.length} pesanan ditemukan</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card padding="md"><p className="text-xs text-gray-500">Total Pesanan</p><p className="text-2xl font-black text-gray-900">{orderList.length}</p></Card>
        <Card padding="md"><p className="text-xs text-gray-500">Selesai</p><p className="text-2xl font-black text-green-600">{completedCount}</p></Card>
        <Card padding="md"><p className="text-xs text-gray-500">Total Pendapatan</p><p className="text-2xl font-black text-uti-maroon">{formatCurrency(totalRevenue)}</p></Card>
      </div>

      <Card padding="md">
        <form className="flex flex-wrap gap-3" method="GET">
          <div>
            <label className="label">Filter Driver</label>
            <select name="driver" defaultValue={searchParams.driver ?? ''} className="input-field w-48" id="filter-driver">
              <option value="">Semua Driver</option>
              {(drivers as any[])?.map((d: any) => (
                <option key={d.id} value={d.id}>{d.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Layanan</label>
            <select name="service" defaultValue={searchParams.service ?? ''} className="input-field w-36" id="filter-service">
              <option value="">Semua</option>
              {['utijek', 'utikan', 'utitip', 'utibasing'].map((s) => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Periode</label>
            <select name="period" defaultValue={searchParams.period ?? ''} className="input-field w-36" id="filter-period">
              <option value="">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="week">7 Hari</option>
              <option value="month">30 Hari</option>
              <option value="year">1 Tahun</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="px-4 py-3 bg-uti-maroon text-white text-sm font-semibold rounded-xl hover:bg-uti-maroon-800 transition-colors" id="btn-filter">
              Terapkan Filter
            </button>
          </div>
        </form>
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Tanggal', 'Customer', 'Driver', 'Layanan', 'Harga', 'Pembayaran', 'Status'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!orderList.length ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Tidak ada data transaksi</td></tr>
              ) : (
                orderList.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">{formatDate(order.created_at)}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{order.customer?.full_name ?? '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{order.driver?.full_name ?? 'Belum ada'}</td>
                    <td className="py-3 px-4"><span className="uppercase text-xs font-bold text-uti-maroon">{order.service_type}</span></td>
                    <td className="py-3 px-4 font-semibold">
                      {order.final_price ? formatCurrency(order.final_price) : order.estimated_price ? `~${formatCurrency(order.estimated_price)}` : '-'}
                    </td>
                    <td className="py-3 px-4">{order.payment_method ? <span className="text-xs font-semibold uppercase text-gray-600">{order.payment_method}</span> : '-'}</td>
                    <td className="py-3 px-4"><OrderStatusBadge status={order.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
