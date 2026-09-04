import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import DriverBottomNav from '@/components/driver/DriverBottomNav'

export default async function DriverLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as any)

  if (profile?.role !== 'driver') redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
      <main className="pb-24">{children}</main>
      <DriverBottomNav />
    </div>
  )
}
