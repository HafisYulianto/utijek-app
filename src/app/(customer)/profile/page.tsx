'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { Profile } from '@/types/database.types'
import {
  UserCircleIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setEmail(user.email ?? '')

      const { data } = await (supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single() as any)

      if (data) setProfile(data as Profile)
      setLoading(false)
    }

    loadProfile()
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    toast.success('Berhasil keluar')
    router.push('/login')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U'

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Profile Card */}
      <header className="bg-maroon-gradient px-5 pt-12 pb-8 safe-top text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 overflow-hidden border-2 border-white/40 flex items-center justify-center shrink-0 shadow-md">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Avatar"
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-xl font-black">{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black truncate">{profile?.full_name || 'Pengguna UTIJEK'}</h1>
            <p className="text-xs text-uti-maroon-200 truncate flex items-center gap-1.5 mt-0.5">
              <EnvelopeIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{email || '-'}</span>
            </p>
            <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheckIcon className="w-3 h-3" />
              Role: {profile?.role || 'Customer'}
            </div>
          </div>
        </div>
      </header>

      {/* Profile Details & Options */}
      <div className="px-5 pt-5 space-y-4">
        {/* Account Info Group */}
        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Informasi Akun</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-gray-500 text-xs">Nama Lengkap</span>
              <span className="font-semibold text-gray-800 text-xs">{profile?.full_name || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-gray-500 text-xs">Email</span>
              <span className="font-semibold text-gray-800 text-xs truncate max-w-[180px]">{email || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500 text-xs">Terdaftar Sejak</span>
              <span className="font-semibold text-gray-800 text-xs">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }) : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* General Options */}
        <div className="bg-white rounded-2xl p-2 shadow-card border border-gray-100 divide-y divide-gray-50">
          <a
            href="https://wa.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                <QuestionMarkCircleIcon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">Bantuan & Customer Service</span>
            </div>
            <span className="text-gray-300 text-xs">›</span>
          </a>

          <div className="flex items-center justify-between p-3 text-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <InformationCircleIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block leading-tight">Tentang UTIJEK</span>
                <span className="text-[10px] text-gray-400">Versi 1.0.0 (PWA)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 p-3.5 bg-red-50 text-red-600 rounded-2xl font-bold text-xs hover:bg-red-100 transition-colors shadow-sm"
        >
          {loggingOut ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span>Keluar dari Akun</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
