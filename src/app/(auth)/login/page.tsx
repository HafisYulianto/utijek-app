'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import {
  ShieldCheckIcon,
  TruckIcon,
  UserIcon,
  KeyIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline'

type LoginMode = 'google' | 'email'

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    setLoading(true)
    const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/api/auth/callback`,
      },
    })
    if (error) {
      toast.error('Gagal login via Google. Coba lagi.')
      setLoading(false)
    }
  }

  // Email & Password Login (Admin, Driver, or Customer)
  const handleEmailLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault()
    const targetEmail = customEmail || email
    const targetPass = customPass || password

    if (!targetEmail || !targetPass) {
      toast.error('Masukkan email dan kata sandi')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: targetPass,
    })

    if (error || !data.user) {
      toast.error(error?.message || 'Email atau kata sandi salah')
      setLoading(false)
      return
    }

    // Fetch user role for immediate redirect
    const { data: profile } = await (supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', data.user.id)
      .single() as any)

    const role = profile?.role || 'customer'
    toast.success(`Selamat datang, ${profile?.full_name || 'Pengguna'}!`)

    if (role === 'admin') {
      router.push('/admin')
    } else if (role === 'driver') {
      router.push('/driver')
    } else {
      router.push('/home')
    }
  }

  // 1-Click Quick Demo Login
  const handleQuickLogin = (demoRole: 'admin' | 'driver' | 'customer') => {
    const creds = {
      admin: { email: 'admin@utijek.com', pass: 'admin123' },
      driver: { email: 'driver@utijek.com', pass: 'driver123' },
      customer: { email: 'customer@utijek.com', pass: 'customer123' },
    }[demoRole]

    setEmail(creds.email)
    setPassword(creds.pass)
    handleEmailLogin(undefined, creds.email, creds.pass)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-uti-maroon-50 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-uti-maroon-50 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <Image
              src="/logo_teks.png"
              alt="UTIJEK"
              width={240}
              height={80}
              priority
              className="h-16 w-auto object-contain drop-shadow-sm"
            />
          </div>
          <p className="text-gray-500 text-xs font-medium">
            Platform Ride-Hailing Lokal Modern
          </p>
        </div>

        {/* Services Badges */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { icon: '🛵', label: 'UTIJEK' },
            { icon: '🍱', label: 'UTIKAN' },
            { icon: '📦', label: 'UTITIP' },
            { icon: '💬', label: 'UTIBASING' },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1 p-2 bg-white rounded-2xl shadow-card border border-gray-100"
            >
              <span className="text-xl">{s.icon}</span>
              <span className="text-[9px] font-bold text-uti-maroon text-center leading-tight">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-3xl shadow-card-hover p-6 border border-gray-100">
          {/* Mode Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => setMode('email')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'email'
                  ? 'bg-white text-uti-maroon shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Email & Sandi
            </button>
            <button
              type="button"
              onClick={() => setMode('google')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'google'
                  ? 'bg-white text-uti-maroon shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Google
            </button>
          </div>

          {mode === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                  Email Akun
                </label>
                <div className="relative">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-uti-maroon/20 focus:border-uti-maroon transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                  Kata Sandi
                </label>
                <div className="relative">
                  <KeyIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-uti-maroon/20 focus:border-uti-maroon transition-all"
                  />
                </div>
              </div>

              <Button
                fullWidth
                size="lg"
                type="submit"
                loading={loading}
                className="mt-2 font-bold shadow-md"
              >
                Masuk Sekarang
              </Button>
            </form>
          ) : (
            <div className="space-y-4 py-2">
              <p className="text-xs text-gray-500 text-center mb-4">
                Masuk langsung menggunakan akun Google Anda
              </p>
              <Button
                fullWidth
                size="lg"
                onClick={handleGoogleLogin}
                loading={loading}
                className="gap-3 shadow-md"
              >
                {!loading && (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="white"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="white"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="white"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="white"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Lanjutkan dengan Google
              </Button>
            </div>
          )}

          {/* Quick 1-Click Role Login Section */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center mb-2.5">
              ⚡ Akses Cepat Demo (1-Click)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                disabled={loading}
                className="flex flex-col items-center gap-1 p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-uti-maroon rounded-xl transition-all shadow-sm active:scale-95"
              >
                <ShieldCheckIcon className="w-5 h-5 text-uti-maroon" />
                <span className="text-[10px] font-black leading-tight">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('driver')}
                disabled={loading}
                className="flex flex-col items-center gap-1 p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl transition-all shadow-sm active:scale-95"
              >
                <TruckIcon className="w-5 h-5 text-emerald-700" />
                <span className="text-[10px] font-black leading-tight">Driver</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('customer')}
                disabled={loading}
                className="flex flex-col items-center gap-1 p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-xl transition-all shadow-sm active:scale-95"
              >
                <UserIcon className="w-5 h-5 text-blue-700" />
                <span className="text-[10px] font-black leading-tight">Customer</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
          Platform Ride-Hailing UTIJEK &bull; 3 Role Terintegrasi
        </p>
      </div>
    </main>
  )
}
