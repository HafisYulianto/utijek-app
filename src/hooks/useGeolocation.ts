'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface GeolocationState {
  lat: number | null
  lng: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
}

export function useGeolocation(watchPosition = false) {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    error: null,
    loading: true,
  })

  const watchIdRef = useRef<number | null>(null)

  const success = useCallback((position: GeolocationPosition) => {
    setState({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      loading: false,
    })
  }, [])

  const error = useCallback((err: GeolocationPositionError) => {
    setState((prev) => ({
      ...prev,
      error: err.message,
      loading: false,
    }))
  }, [])

  const options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation tidak didukung browser ini',
        loading: false,
      }))
      return
    }

    if (watchPosition) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        success,
        error,
        options
      )
    } else {
      navigator.geolocation.getCurrentPosition(success, error, options)
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [watchPosition, success, error])

  return state
}
