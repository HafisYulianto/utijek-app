'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  ClipboardDocumentListIcon as ClipboardSolid,
} from '@heroicons/react/24/solid'
import { clsx } from 'clsx'

const navItems = [
  { href: '/driver', label: 'Dashboard', icon: HomeIcon, iconActive: HomeIconSolid },
  { href: '/driver/orders', label: 'Riwayat', icon: ClipboardDocumentListIcon, iconActive: ClipboardSolid },
]

export default function DriverBottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-bottom" style={{ maxWidth: '28rem', margin: '0 auto' }}>
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = isActive ? item.iconActive : item.icon
          return (
            <Link key={item.href} href={item.href} className={clsx('nav-item flex-1', isActive && 'nav-item-active')} id={`nav-driver-${item.label.toLowerCase()}`}>
              <Icon className="w-6 h-6" />
              <span className={clsx('text-[10px] font-semibold', isActive ? 'text-uti-maroon' : 'text-gray-400')}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
