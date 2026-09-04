'use client'

import Link from 'next/link'
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
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-uti-maroon px-4 py-3 flex items-center justify-between">
        <span className="font-black text-white text-lg">UTIJEK Admin</span>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 flex-col bg-white border-r border-gray-100 shadow-sm z-40">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-maroon-gradient flex items-center justify-center">
              <span className="font-black text-white text-lg">U</span>
            </div>
            <div>
              <p className="font-black text-gray-900">UTIJEK</p>
              <p className="text-xs text-uti-maroon font-semibold">Admin Panel</p>
            </div>
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
