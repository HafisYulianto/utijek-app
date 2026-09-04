export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} menit`
  const hours = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  return `${hours} jam ${remainingMins} menit`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function formatShortDate(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function formatTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return 'Baru saja'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mnt lalu`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`
  return `${Math.floor(diffSec / 86400)} hari lalu`
}

export function truncateAddress(address: string, maxLen = 35): string {
  if (address.length <= maxLen) return address
  return address.substring(0, maxLen) + '...'
}

export function getInitials(name: string | null): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}
