import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { BellIcon } from '@heroicons/react/24/outline'
import ServiceCard from '@/components/customer/ServiceCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Beranda | UTIJEK',
  description: 'Pilih layanan antar jemput UTIJEK',
}

const SERVICES = [
  { id: 'utijek', icon: '🛵', title: 'UTIJEK', description: 'Antar jemput orang', color: 'from-uti-maroon to-uti-maroon-800' },
  { id: 'utikan', icon: '🍱', title: 'UTIKAN', description: 'Pesan antar makanan', color: 'from-orange-500 to-red-500' },
  { id: 'utitip', icon: '📦', title: 'UTITIP', description: 'Antar jemput barang', color: 'from-blue-500 to-indigo-600' },
  { id: 'utibasing', icon: '💬', title: 'UTIBASING', description: 'Layanan kustom', color: 'from-purple-500 to-violet-600' },
] as const

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await (supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user!.id)
    .single() as any) as { data: { full_name: string; avatar_url: string } | null }

  const { data: activeOrder } = await (supabase
    .from('orders')
    .select('id, status, service_type')
    .eq('customer_id', user!.id)
    .in('status', ['pending', 'accepted', 'picking_up', 'on_trip'])
    .single() as any) as { data: { id: string; status: string } | null }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Kamu'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-maroon-gradient px-5 pt-10 pb-8 safe-top">
        <div className="flex items-center justify-between mb-4">
          <Image
            src="/logo_teks.png"
            alt="UTIJEK"
            width={130}
            height={42}
            priority
            className="h-8 w-auto object-contain brightness-0 invert"
          />
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors" id="btn-notifications">
              <BellIcon className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden border-2 border-white/30">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="Avatar" width={40} height={40} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                  {firstName[0]}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-uti-maroon-200 text-xs font-medium">Selamat datang,</p>
          <h1 className="text-white text-xl font-bold">{firstName} 👋</h1>
        </div>

        <Link
          href="/book/utijek"
          className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-maroon"
          id="btn-quick-book"
        >
          <div className="w-2 h-2 rounded-full bg-uti-maroon" />
          <span className="text-gray-400 text-sm">Mau ke mana hari ini?</span>
        </Link>
      </header>

      {/* Active Order Banner */}
      {activeOrder && (
        <Link
          href={`/orders/${activeOrder.id}`}
          className="mx-4 -mt-2 mb-0 flex items-center gap-3 bg-green-600 text-white px-4 py-3 rounded-2xl shadow-lg"
          id="btn-active-order"
        >
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-sm font-semibold">Pesanan aktif • Ketuk untuk detail</span>
        </Link>
      )}

      {/* Services Grid */}
      <section className="px-5 pt-6 pb-4">
        <h2 className="section-title mb-4">Layanan Kami</h2>
        <div className="grid grid-cols-2 gap-3">
          {SERVICES.map((service) => (
            <ServiceCard
              key={service.id}
              id={service.id}
              icon={service.icon}
              title={service.title}
              description={service.description}
              gradient={service.color}
            />
          ))}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="px-5 pb-6">
        <div className="relative overflow-hidden bg-maroon-gradient rounded-2xl p-5 shadow-maroon">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -right-2 -bottom-6 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative">
            <span className="text-uti-maroon-200 text-xs font-semibold uppercase tracking-wider">Promo Hari Ini</span>
            <p className="text-white text-lg font-bold mt-1">Gratis Ongkir</p>
            <p className="text-uti-maroon-200 text-xs mt-0.5">Untuk 3 km pertama setiap hari</p>
          </div>
        </div>
      </section>
    </div>
  )
}
