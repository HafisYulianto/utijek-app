import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await (supabase.from('profiles').select('role').eq('id', user.id).single() as any)
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { full_name, phone, email, password, vehicle_type, vehicle_plate, vehicle_color } = body

  if (!email || !password || !full_name || !vehicle_plate) {
    return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
  }

  const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: 'driver' },
  })

  if (authError || !newUser.user) {
    return NextResponse.json({ error: authError?.message ?? 'Gagal membuat user' }, { status: 500 })
  }

  const driverId = newUser.user.id

  await (supabaseAdmin.from('profiles') as any).upsert({
    id: driverId,
    full_name,
    phone,
    role: 'driver',
  })

  const { error: dpError } = await (supabaseAdmin.from('driver_profiles') as any).insert({
    id: driverId,
    vehicle_type,
    vehicle_plate,
    vehicle_color,
  })

  if (dpError) {
    await supabaseAdmin.auth.admin.deleteUser(driverId)
    return NextResponse.json({ error: 'Gagal membuat profil driver' }, { status: 500 })
  }

  return NextResponse.json({ success: true, driverId })
}
