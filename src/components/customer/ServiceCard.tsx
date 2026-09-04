'use client'

import Link from 'next/link'
import { clsx } from 'clsx'

interface ServiceCardProps {
  id: string
  icon: string
  title: string
  description: string
  gradient: string
}

export default function ServiceCard({ id, icon, title, description, gradient }: ServiceCardProps) {
  return (
    <Link
      href={`/book/${id}`}
      id={`service-card-${id}`}
      className={clsx(
        'group relative overflow-hidden rounded-2xl bg-gradient-to-br p-4',
        'shadow-card hover:shadow-card-hover transition-all duration-300',
        'hover:-translate-y-0.5 active:scale-95',
        gradient
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full transition-transform duration-300 group-hover:scale-150" />

      <div className="relative">
        <span className="text-3xl block mb-2">{icon}</span>
        <p className="font-black text-white text-sm leading-tight">{title}</p>
        <p className="text-white/70 text-[11px] mt-0.5 leading-tight">{description}</p>
      </div>

      {/* Arrow indicator */}
      <div className="absolute bottom-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
