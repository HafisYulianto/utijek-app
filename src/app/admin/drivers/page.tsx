'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import type { Profile, DriverProfile } from '@/types/database.types'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid'

type DriverWithProfile = DriverProfile & { profiles: Profile }

interface DriverFormData {
  full_name: string; phone: string; email: string; password: string
  vehicle_type: string; vehicle_plate: string; vehicle_color: string
}

const defaultForm: DriverFormData = {
  full_name: '', phone: '', email: '', password: '',
  vehicle_type: 'Motor', vehicle_plate: '', vehicle_color: '',
}

export default function AdminDriversPage() {
  const supabase = createClient()
  const [drivers, setDrivers] = useState<DriverWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<DriverFormData>(defaultForm)
  const [saving, setSaving] = useState(false)

  const fetchDrivers = async () => {
    const { data } = await (supabase
      .from('driver_profiles')
      .select('*, profiles(*)') as any)
    if (data) setDrivers(data as DriverWithProfile[])
    setLoading(false)
  }

  useEffect(() => { fetchDrivers() }, [])

  const handleSave = async () => {
    if (!form.full_name || !form.vehicle_plate) {
      toast.error('Nama dan plat kendaraan wajib diisi'); return
    }
    setSaving(true)

    if (editingId) {
      await (supabase.from('driver_profiles') as any)
        .update({ vehicle_type: form.vehicle_type, vehicle_plate: form.vehicle_plate, vehicle_color: form.vehicle_color })
        .eq('id', editingId)
      await (supabase.from('profiles') as any)
        .update({ full_name: form.full_name, phone: form.phone })
        .eq('id', editingId)
      toast.success('Data driver diperbarui')
    } else {
      const res = await fetch('/api/admin/create-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error ?? 'Gagal membuat akun driver'); setSaving(false); return }
      toast.success('Akun driver berhasil dibuat!')
    }

    setSaving(false); setShowModal(false); setForm(defaultForm); setEditingId(null); fetchDrivers()
  }

  const handleEdit = (driver: DriverWithProfile) => {
    setEditingId(driver.id)
    setForm({
      full_name: driver.profiles?.full_name ?? '',
      phone: driver.profiles?.phone ?? '',
      email: '', password: '',
      vehicle_type: driver.vehicle_type,
      vehicle_plate: driver.vehicle_plate,
      vehicle_color: driver.vehicle_color ?? '',
    })
    setShowModal(true)
  }

  const handleDelete = async (driverId: string) => {
    if (!confirm('Hapus akun driver ini?')) return
    const res = await fetch('/api/admin/delete-driver', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId }),
    })
    if (res.ok) { toast.success('Driver dihapus'); fetchDrivers() }
    else toast.error('Gagal menghapus driver')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Kelola Driver</h1>
          <p className="text-sm text-gray-500 mt-1">{drivers.length} driver terdaftar</p>
        </div>
        <Button onClick={() => { setForm(defaultForm); setEditingId(null); setShowModal(true) }} id="btn-add-driver">
          <PlusIcon className="w-4 h-4" /> Tambah Driver
        </Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Driver', 'Kendaraan', 'Plat', 'Status', 'Total Trip', 'Rating', 'Aksi'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Memuat...</td></tr>
              ) : drivers.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Belum ada driver</td></tr>
              ) : (
                drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900">{driver.profiles?.full_name ?? '-'}</p>
                      <p className="text-xs text-gray-400">{driver.profiles?.phone ?? '-'}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{driver.vehicle_type}</td>
                    <td className="py-3 px-4 font-mono text-xs font-bold">{driver.vehicle_plate}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${driver.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${driver.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {driver.is_online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold">{driver.total_trips}</td>
                    <td className="py-3 px-4">⭐ {driver.rating?.toFixed(1)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(driver)} id={`btn-edit-${driver.id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-uti-maroon hover:bg-uti-maroon-50 transition-colors">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(driver.id)} id={`btn-delete-${driver.id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Driver' : 'Tambah Driver Baru'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nama Lengkap</label>
              <input className="input-field" value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} placeholder="Budi Santoso" id="input-driver-name" />
            </div>
            <div>
              <label className="label">No. Telepon</label>
              <input className="input-field" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="08xx..." id="input-driver-phone" />
            </div>
          </div>
          {!editingId && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Email</label>
                <input type="email" className="input-field" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="driver@mail.com" id="input-driver-email" />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" className="input-field" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="Min. 8 karakter" id="input-driver-pass" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Kendaraan</label>
              <select className="input-field" value={form.vehicle_type} onChange={e => setForm(f => ({...f, vehicle_type: e.target.value}))} id="input-vehicle-type">
                <option>Motor</option><option>Mobil</option><option>Pickup</option>
              </select>
            </div>
            <div>
              <label className="label">Plat Nomor</label>
              <input className="input-field uppercase" value={form.vehicle_plate} onChange={e => setForm(f => ({...f, vehicle_plate: e.target.value.toUpperCase()}))} placeholder="AB 1234 CD" id="input-plate" />
            </div>
          </div>
          <div>
            <label className="label">Warna Kendaraan</label>
            <input className="input-field" value={form.vehicle_color} onChange={e => setForm(f => ({...f, vehicle_color: e.target.value}))} placeholder="Hitam" id="input-color" />
          </div>
          <Button fullWidth onClick={handleSave} loading={saving} id="btn-save-driver">
            {editingId ? 'Simpan Perubahan' : 'Buat Akun Driver'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
