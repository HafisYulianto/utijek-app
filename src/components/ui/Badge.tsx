import { clsx } from 'clsx'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'maroon' | 'info'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

export default function Badge({
  variant = 'default',
  children,
  className,
  dot = false,
}: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    maroon: 'bg-uti-maroon-50 text-uti-maroon-700',
    info: 'bg-blue-100 text-blue-700',
  }

  const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-gray-400',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    maroon: 'bg-uti-maroon',
    info: 'bg-blue-500',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
        variants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])}
        />
      )}
      {children}
    </span>
  )
}

export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'Mencari Driver', variant: 'warning' },
    accepted: { label: 'Driver Ditemukan', variant: 'success' },
    picking_up: { label: 'Menuju Lokasi', variant: 'info' },
    on_trip: { label: 'Dalam Perjalanan', variant: 'maroon' },
    completed: { label: 'Selesai', variant: 'success' },
    cancelled: { label: 'Dibatalkan', variant: 'danger' },
  }

  const config = map[status] ?? { label: status, variant: 'default' }
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  )
}
