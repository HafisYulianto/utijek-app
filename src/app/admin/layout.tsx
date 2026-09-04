import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as any)

  if (profile?.role !== 'admin') redirect('/login')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6 max-w-6xl">
        {children}
      </main>
    </div>
  )
}
