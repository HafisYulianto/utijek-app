'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { formatCurrency } from '@/lib/utils/formatters'

interface ChartDataItem {
  created_at: string
  final_price: number | null
  status: string
}

interface Props {
  data: ChartDataItem[]
}

export default function AnalyticsChart({ data }: Props) {
  // Group by day
  const grouped = data.reduce<Record<string, { date: string; revenue: number; trips: number }>>(
    (acc, item) => {
      const day = format(parseISO(item.created_at), 'dd MMM', { locale: id })
      if (!acc[day]) acc[day] = { date: day, revenue: 0, trips: 0 }
      acc[day].revenue += item.final_price ?? 0
      acc[day].trips += 1
      return acc
    },
    {}
  )

  const chartData = Object.values(grouped)

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        Belum ada data pesanan selesai
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Revenue chart */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Pendapatan Harian</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              formatter={((value: any) => [formatCurrency(Number(value)), 'Pendapatan']) as any}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 12 }}
              cursor={{ fill: '#f5e6e6' }}
            />
            <Bar dataKey="revenue" fill="#7B1113" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trips chart */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Jumlah Trip Harian</p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              formatter={((value: any) => [Number(value), 'Trip']) as any}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 12 }}
            />
            <Line type="monotone" dataKey="trips" stroke="#7B1113" strokeWidth={2.5} dot={{ r: 4, fill: '#7B1113' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
