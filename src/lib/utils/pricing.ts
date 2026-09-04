import type { PricingConfig, ServiceType } from '@/types/database.types'

export function calculatePrice(
  distanceMeters: number,
  pricing: PricingConfig
): number {
  const distanceKm = distanceMeters / 1000
  const distanceCharge = distanceKm * pricing.price_per_km
  const total = pricing.base_fare + distanceCharge
  return Math.round(total)
}

export function getServiceLabel(service: ServiceType): string {
  const labels: Record<ServiceType, string> = {
    utijek: 'UTIJEK',
    utikan: 'UTIKAN',
    utitip: 'UTITIP',
    utibasing: 'UTIBASING',
  }
  return labels[service]
}

export function getServiceDescription(service: ServiceType): string {
  const desc: Record<ServiceType, string> = {
    utijek: 'Antar jemput orang',
    utikan: 'Pesan antar makanan',
    utitip: 'Antar jemput barang',
    utibasing: 'Layanan kustom',
  }
  return desc[service]
}

export function getServiceIcon(service: ServiceType): string {
  const icons: Record<ServiceType, string> = {
    utijek: '🛵',
    utikan: '🍱',
    utitip: '📦',
    utibasing: '💬',
  }
  return icons[service]
}

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
