import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Role-based redirect after OAuth
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single() as any

      const role = profile?.role as string | undefined

      if (role === 'admin') return NextResponse.redirect(`${origin}/admin`)
      if (role === 'driver') return NextResponse.redirect(`${origin}/driver`)
      return NextResponse.redirect(`${origin}/home`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
