'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: ChartBarIcon, exact: true },
  { href: '/admin/drivers', label: 'Kelola Driver', icon: UsersIcon, exact: false },
  { href: '/admin/pricing', label: 'Manajemen Tarif', icon: CurrencyDollarIcon, exact: false },
  { href: '/admin/transactions', label: 'Transaksi', icon: DocumentTextIcon, exact: false },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-uti-maroon px-4 py-3 flex items-center justify-between shadow-md">
        <Image
          src="/logo_teks.png"
          alt="UTIJEK"
          width={110}
          height={32}
          priority
          className="h-6 w-auto object-contain brightness-0 invert"
        />
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white/90 font-bold bg-white/15 px-2.5 py-0.5 rounded-full">Admin</span>
          <button
            onClick={handleLogout}
            id="btn-admin-mobile-logout"
            className="text-[11px] font-semibold text-white/90 bg-black/20 hover:bg-black/40 border border-white/20 px-2 py-0.5 rounded-full transition-all"
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx('flex flex-col items-center flex-1 py-1', isActive ? 'text-uti-maroon font-bold' : 'text-gray-400')}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 flex-col bg-white border-r border-gray-100 shadow-sm z-40">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex flex-col gap-1">
            <Image
              src="/logo_teks.png"
              alt="UTIJEK"
              width={160}
              height={50}
              priority
              className="h-9 w-auto object-contain"
            />
            <span className="text-[10px] uppercase tracking-wider text-uti-maroon font-bold pl-0.5">
              Admin Superuser
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`admin-nav-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-uti-maroon text-white shadow-maroon'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            id="btn-admin-logout"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </aside>
    </>
  )
}
