'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import type { PricingConfig, ServiceType } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils/formatters'
import { getServiceIcon, getServiceLabel } from '@/lib/utils/pricing'

const SERVICE_TYPES: ServiceType[] = ['utijek', 'utikan', 'utitip', 'utibasing']

export default function AdminPricingPage() {
  const supabase = createClient()
  const [configs, setConfigs] = useState<PricingConfig[]>([])
  const [editing, setEditing] = useState<Record<string, Partial<PricingConfig>>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUserId(data.user.id) })
    ;(supabase.from('pricing_config').select('*') as any).then(({ data }: any) => {
      if (data) {
        setConfigs(data)
        const editMap: Record<string, Partial<PricingConfig>> = {}
        data.forEach((c: PricingConfig) => { editMap[c.service_type] = { ...c } })
        setEditing(editMap)
      }
    })
  }, [])

  const handleSave = async (serviceType: ServiceType) => {
    const config = editing[serviceType]
    if (!config) return
    setSaving(serviceType)

    const { error } = await (supabase.from('pricing_config') as any)
      .update({
        price_per_km: Number(config.price_per_km),
        price_per_meter: Number(config.price_per_meter),
        base_fare: Number(config.base_fare),
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('service_type', serviceType)

    setSaving(null)
    if (error) toast.error('Gagal menyimpan tarif')
    else toast.success(`Tarif ${getServiceLabel(serviceType)} berhasil diperbarui!`)
  }

  const updateField = (service: ServiceType, field: string, value: string) => {
    setEditing((prev) => ({
      ...prev,
      [service]: { ...prev[service], [field]: value },
    }))
  }

  const previewPrice = (config: Partial<PricingConfig>) => {
    const km = 3
    return Number(config.base_fare ?? 0) + km * Number(config.price_per_km ?? 0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Manajemen Tarif</h1>
        <p className="text-sm text-gray-500 mt-1">Atur harga dasar dan tarif per km untuk setiap layanan. Perubahan berlaku untuk pesanan berikutnya.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {SERVICE_TYPES.map((service) => {
          const config = editing[service]
          if (!config) return null
          const preview = previewPrice(config)

          return (
            <Card key={service} padding="lg">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-uti-maroon-50 flex items-center justify-center text-2xl">
                  {getServiceIcon(service)}
                </div>
                <div>
                  <h2 className="font-black text-gray-900">{getServiceLabel(service)}</h2>
                  <p className="text-xs text-gray-500">Estimasi 3km: <strong className="text-uti-maroon">{formatCurrency(preview)}</strong></p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="label">Tarif Dasar (Base Fare)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                    <input type="number" className="input-field pl-9" value={config.base_fare ?? ''} onChange={(e) => updateField(service, 'base_fare', e.target.value)} id={`input-base-fare-${service}`} />
                  </div>
                </div>
                <div>
                  <label className="label">Tarif per Kilometer</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                    <input type="number" className="input-field pl-9" value={config.price_per_km ?? ''} onChange={(e) => updateField(service, 'price_per_km', e.target.value)} id={`input-price-km-${service}`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/km</span>
                  </div>
                </div>
                <div>
                  <label className="label">Tarif per Meter</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                    <input type="number" step="0.1" className="input-field pl-9" value={config.price_per_meter ?? ''} onChange={(e) => updateField(service, 'price_per_meter', e.target.value)} id={`input-price-meter-${service}`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/m</span>
                  </div>
                </div>
              </div>

              <Button fullWidth className="mt-5" onClick={() => handleSave(service)} loading={saving === service} id={`btn-save-pricing-${service}`}>
                Simpan Tarif {getServiceLabel(service)}
              </Button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
