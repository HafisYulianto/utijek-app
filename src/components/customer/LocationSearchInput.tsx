'use client'

import { useState, useEffect, useRef } from 'react'
import { POPULAR_LOCATIONS, type LocationItem } from '@/lib/data/lampungLocations'
import {
  MapPinIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  GlobeAsiaAustraliaIcon,
  CheckIcon,
} from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

interface LocationSearchInputProps {
  label: string
  type: 'pickup' | 'dropoff'
  value: string
  coords: [number, number] | null
  onSelect: (item: { name: string; address: string; coords: [number, number] }) => void
  onClear: () => void
  onManualMapPick?: () => void
  isManualMapActive?: boolean
  placeholder?: string
}

export default function LocationSearchInput({
  label,
  type,
  value,
  coords,
  onSelect,
  onClear,
  onManualMapPick,
  isManualMapActive,
  placeholder,
}: LocationSearchInputProps) {
  const [query, setQuery] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<LocationItem[]>([])
  const [isSearchingOnline, setIsSearchingOnline] = useState(false)
  const [isGettingGps, setIsGettingGps] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Sync internal query if parent value changes
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter local & online places when query changes
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      // If empty and open, show top popular places
      setSuggestions(POPULAR_LOCATIONS.slice(0, 6))
      return
    }

    // 1. Search local curated places first
    const qLower = trimmed.toLowerCase()
    const localMatches = POPULAR_LOCATIONS.filter(
      (item) =>
        item.name.toLowerCase().includes(qLower) ||
        item.address.toLowerCase().includes(qLower)
    )

    setSuggestions(localMatches)

    // 2. Concurrently search Mapbox if query has at least 3 chars
    const timer = setTimeout(async () => {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      if (!token || trimmed.length < 3) return

      try {
        setIsSearchingOnline(true)
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            trimmed
          )}.json?country=id&proximity=105.2577,-5.3818&language=id&limit=5&access_token=${token}`
        )
        const data = await res.json()
        if (data?.features?.length) {
          const mapboxMatches: LocationItem[] = data.features.map((f: any) => ({
            name: f.text || f.place_name.split(',')[0],
            address: f.place_name,
            coords: f.center,
            category: 'public',
            icon: '📍',
          }))

          // Merge without exact duplicates
          setSuggestions((prev) => {
            const existingNames = new Set(prev.map((p) => p.name.toLowerCase()))
            const newOnes = mapboxMatches.filter(
              (m) => !existingNames.has(m.name.toLowerCase())
            )
            return [...prev, ...newOnes]
          })
        }
      } catch (err) {
        console.error('Online geocoding error:', err)
      } finally {
        setIsSearchingOnline(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelectItem = (item: LocationItem) => {
    setQuery(item.name)
    onSelect({
      name: item.name,
      address: item.address,
      coords: item.coords,
    })
    setIsOpen(false)
  }

  // Handle Current Location (GPS)
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Perangkat Anda tidak mendukung GPS')
      return
    }

    setIsGettingGps(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const coords: [number, number] = [longitude, latitude]

        // Reverse geocode to get friendly street address
        try {
          const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&language=id&limit=1`
          )
          const data = await res.json()
          const placeName = data.features?.[0]?.place_name || 'Lokasi Saya Saat Ini'
          const shortName = data.features?.[0]?.text || 'Lokasi Saya'

          setQuery(shortName)
          onSelect({
            name: shortName,
            address: placeName,
            coords,
          })
          toast.success('📍 Lokasi GPS berhasil ditemukan!')
        } catch {
          const fallback = `Lokasi GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
          setQuery(fallback)
          onSelect({
            name: fallback,
            address: fallback,
            coords,
          })
        } finally {
          setIsGettingGps(false)
          setIsOpen(false)
        }
      },
      (err) => {
        setIsGettingGps(false)
        toast.error('Gagal mengambil lokasi GPS. Pastikan izin lokasi aktif.')
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const isPickup = type === 'pickup'

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isPickup ? 'bg-uti-maroon' : 'bg-blue-600'
            }`}
          />
          {label}
        </label>
        {coords && (
          <span className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
            <CheckIcon className="w-3 h-3" /> Titik terpasang
          </span>
        )}
      </div>

      <div className="relative flex items-center">
        <div className="absolute left-3 text-gray-400 pointer-events-none">
          {isPickup ? (
            <MapPinIcon className="w-5 h-5 text-uti-maroon" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          placeholder={
            placeholder ||
            (isPickup
              ? 'Ketik lokasi jemput (cth: Teknokrat, MBK...)'
              : 'Ketik lokasi tujuan antar...')
          }
          className="w-full pl-10 pr-16 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-uti-maroon/20 focus:border-uti-maroon shadow-sm transition-all"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                onClear()
              }}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              title="Hapus"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          ) : (
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 mr-2" />
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-72 overflow-y-auto">
          {/* Action options header */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/70 space-y-1">
            {/* GPS Current Location */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isGettingGps}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-uti-maroon hover:bg-uti-maroon-50 rounded-xl transition-colors text-left"
            >
              <span className="w-6 h-6 rounded-full bg-uti-maroon-100 flex items-center justify-center shrink-0">
                {isGettingGps ? (
                  <span className="animate-spin text-xs">⏳</span>
                ) : (
                  '🎯'
                )}
              </span>
              <div className="flex-1 min-w-0">
                <span className="block truncate">
                  {isGettingGps
                    ? 'Mencari koordinat GPS...'
                    : 'Gunakan Lokasi Saya Saat Ini'}
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  Akurasi GPS perangkat otomatis
                </span>
              </div>
            </button>

            {/* Manual Pin on Map Option */}
            {onManualMapPick && (
              <button
                type="button"
                onClick={() => {
                  onManualMapPick()
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl transition-colors text-left ${
                  isManualMapActive
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  🗺️
                </span>
                <div className="flex-1 min-w-0">
                  <span className="block truncate">
                    {isManualMapActive
                      ? '✓ Mode Pilih di Peta Sedang Aktif'
                      : 'Pilih Titik Manual Lewat Peta'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    Geser atau ketuk peta jika tempat tidak ditemukan
                  </span>
                </div>
              </button>
            )}
          </div>

          {/* Place suggestions */}
          <div className="p-1">
            <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {query.trim()
                ? 'Hasil Pencarian Tempat'
                : 'Lokasi Populer di Bandar Lampung & Kampus UTI'}
            </p>

            {suggestions.length === 0 ? (
              <div className="py-6 px-4 text-center">
                <p className="text-xs text-gray-500 font-medium">
                  Tempat "{query}" tidak ditemukan
                </p>
                {onManualMapPick && (
                  <button
                    type="button"
                    onClick={() => {
                      onManualMapPick()
                      setIsOpen(false)
                    }}
                    className="mt-2 text-xs text-uti-maroon font-bold underline"
                  >
                    Tentukan titik langsung di peta &rarr;
                  </button>
                )}
              </div>
            ) : (
              suggestions.map((item, idx) => (
                <button
                  key={`${item.name}-${idx}`}
                  type="button"
                  onClick={() => handleSelectItem(item)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-left transition-colors group"
                >
                  <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 group-hover:text-uti-maroon truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-gray-500 line-clamp-1">
                      {item.address}
                    </p>
                  </div>
                </button>
              ))
            )}

            {isSearchingOnline && (
              <div className="p-2 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <span className="animate-spin text-sm">⏳</span> Memuat saran online...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
