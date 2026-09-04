'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

interface LiveMapProps {
  pickupCoords?: [number, number] | null
  dropoffCoords?: [number, number] | null
  driverCoords?: [number, number] | null
  onMapClick?: (coords: [number, number], address: string) => void
  height?: string
}

export default function LiveMap({
  pickupCoords,
  dropoffCoords,
  driverCoords,
  onMapClick,
  height = '100%',
}: LiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const dropoffMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return

    const initialCenter: [number, number] = pickupCoords || [105.257723, -5.381786]

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter, // Auto-center to user's pickup or UTI
      zoom: pickupCoords ? 16 : 15,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    )

    map.on('load', () => setMapLoaded(true))

    if (onMapClick) {
      map.on('click', async (e) => {
        const { lng, lat } = e.lngLat
        // Reverse geocode with Mapbox
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&language=id&limit=1`
          )
          const data = await res.json()
          const address = data.features?.[0]?.place_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
          onMapClick([lng, lat], address)
        } catch {
          onMapClick([lng, lat], `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
        }
      })
    }

    mapRef.current = map
    return () => map.remove()
  }, [])

  // Pickup marker
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    if (pickupMarkerRef.current) pickupMarkerRef.current.remove()
    if (!pickupCoords) return

    const el = document.createElement('div')
    el.innerHTML = `
      <div style="width:32px;height:32px;background:#7B1113;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(123,17,19,0.4)"></div>
    `
    pickupMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(pickupCoords)
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Titik Jemput'))
      .addTo(mapRef.current)

    mapRef.current.flyTo({ center: pickupCoords, zoom: 15, duration: 1000 })
  }, [pickupCoords, mapLoaded])

  // Dropoff marker
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    if (dropoffMarkerRef.current) dropoffMarkerRef.current.remove()
    if (!dropoffCoords) return

    const el = document.createElement('div')
    el.innerHTML = `
      <div style="width:32px;height:32px;background:#1d4ed8;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(29,78,216,0.4)"></div>
    `
    dropoffMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(dropoffCoords)
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Titik Antar'))
      .addTo(mapRef.current)

    // Draw route if both coords exist
    if (pickupCoords && mapRef.current.isStyleLoaded()) {
      drawRoute(mapRef.current, pickupCoords, dropoffCoords)
    }

    // Fit bounds
    if (pickupCoords) {
      const bounds = new mapboxgl.LngLatBounds()
      bounds.extend(pickupCoords)
      bounds.extend(dropoffCoords)
      mapRef.current.fitBounds(bounds, { padding: 80, duration: 1200 })
    }
  }, [dropoffCoords, mapLoaded])

  // Driver marker
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    if (!driverCoords) return

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat(driverCoords)
    } else {
      const el = document.createElement('div')
      el.innerHTML = `
        <div style="width:40px;height:40px;background:#059669;border-radius:50%;border:3px solid white;
                    display:flex;align-items:center;justify-content:center;font-size:18px;
                    box-shadow:0 4px 16px rgba(5,150,105,0.5)">🛵</div>
      `
      driverMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat(driverCoords)
        .addTo(mapRef.current)
    }
  }, [driverCoords, mapLoaded])

  const handleRecenter = () => {
    if (!mapRef.current) return
    if (pickupCoords) {
      mapRef.current.flyTo({ center: pickupCoords, zoom: 16, duration: 1000 })
    } else if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude]
        mapRef.current?.flyTo({ center: coords, zoom: 16, duration: 1000 })
      })
    }
  }

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} className="mapbox-container" />
      {/* Floating GPS re-center button */}
      <button
        type="button"
        onClick={handleRecenter}
        title="Pusatkan ke posisi saya"
        className="absolute bottom-16 right-3 z-10 w-10 h-10 rounded-full bg-white text-uti-maroon shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
      >
        <span className="text-lg">🎯</span>
      </button>
    </div>
  )
}

async function drawRoute(
  map: mapboxgl.Map,
  from: [number, number],
  to: [number, number]
) {
  try {
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`
    )
    const data = await res.json()
    const route = data.routes?.[0]?.geometry

    if (!route) return

    if (map.getSource('route')) {
      (map.getSource('route') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: route,
      })
    } else {
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: route },
      })
      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#7B1113',
          'line-width': 4,
          'line-opacity': 0.8,
        },
      })
    }
  } catch (err) {
    console.error('Route draw error:', err)
  }
}
