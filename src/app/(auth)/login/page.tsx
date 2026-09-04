'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

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
      toast.error('Gagal login. Coba lagi.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-uti-maroon-50 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-uti-maroon-50 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image
              src="/logo_teks.png"
              alt="UTIJEK"
              width={260}
              height={90}
              priority
              className="h-20 w-auto object-contain drop-shadow-md"
            />
          </div>
          <p className="text-gray-500 text-sm">
            Layanan antar jemput lokal terpercaya
          </p>
        </div>

        {/* Services Preview */}
        <div className="grid grid-cols-4 gap-3 mb-10">
          {[
            { icon: '🛵', label: 'UTIJEK' },
            { icon: '🍱', label: 'UTIKAN' },
            { icon: '📦', label: 'UTITIP' },
            { icon: '💬', label: 'UTIBASING' },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-2xl shadow-card"
            >
              <span className="text-2xl">{s.icon}</span>
              <span className="text-[9px] font-bold text-uti-maroon text-center leading-tight">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-card-hover p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1.5">Masuk ke Akun</h2>
          <p className="text-sm text-gray-500 mb-6">
            Gunakan akun Google untuk melanjutkan
          </p>

          <Button
            fullWidth
            size="lg"
            onClick={handleGoogleLogin}
            loading={loading}
            id="btn-google-login"
            className="gap-3"
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

          <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed">
            Dengan masuk, Anda menyetujui{' '}
            <span className="text-uti-maroon font-semibold">Syarat & Ketentuan</span>{' '}
            layanan UTIJEK.
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Driver? Hubungi admin untuk mendapatkan akses.
        </p>
      </div>
    </main>
  )
}
