'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useGeolocation } from './useGeolocation'

interface UseDriverLocationOptions {
  driverId: string
  isOnline: boolean
  intervalMs?: number
}

export function useDriverLocation({
  driverId,
  isOnline,
  intervalMs = 5000,
}: UseDriverLocationOptions) {
  const supabase = createClient()
  const { lat, lng } = useGeolocation(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const broadcastLocation = useCallback(async () => {
    if (!lat || !lng || !isOnline) return

    await (supabase
      .from('driver_profiles') as any)
      .update({
        current_lat: lat,
        current_lng: lng,
        last_seen: new Date().toISOString(),
      })
      .eq('id', driverId)
  }, [lat, lng, isOnline, driverId, supabase])

  useEffect(() => {
    if (!isOnline) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Broadcast immediately
    broadcastLocation()

    // Then every intervalMs
    intervalRef.current = setInterval(broadcastLocation, intervalMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isOnline, broadcastLocation, intervalMs])

  return { lat, lng }
}
