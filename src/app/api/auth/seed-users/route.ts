import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  }

  const supabaseAdmin = createAdminClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const demoUsers = [
    {
      email: 'admin@utijek.com',
      password: 'admin123',
      role: 'admin' as const,
      full_name: 'Super Admin UTIJEK',
      phone: '081234567890',
    },
    {
      email: 'driver@utijek.com',
      password: 'driver123',
      role: 'driver' as const,
      full_name: 'Budi Santoso (Driver)',
      phone: '081298765432',
      vehicle_type: 'Honda Vario 160',
      vehicle_plate: 'B 1234 UTI',
      vehicle_color: 'Merah Maroon',
    },
    {
      email: 'customer@utijek.com',
      password: 'customer123',
      role: 'customer' as const,
      full_name: 'Rian Pratama (Customer)',
      phone: '081355566677',
    },
  ]

  const results = []

  for (const u of demoUsers) {
    try {
      // Check if user already exists
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = listData?.users?.find((x) => x.email === u.email)

      let userId = existingUser?.id

      if (!existingUser) {
        const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.full_name, role: u.role },
        })

        if (createError || !created.user) {
          results.push({ email: u.email, status: 'error', message: createError?.message })
          continue
        }
        userId = created.user.id
      } else {
        // Update password & metadata to ensure it matches
        await supabaseAdmin.auth.admin.updateUserById(userId!, {
          password: u.password,
          user_metadata: { full_name: u.full_name, role: u.role },
        })
      }

      // Upsert profile
      await (supabaseAdmin.from('profiles') as any).upsert({
        id: userId,
        full_name: u.full_name,
        phone: u.phone,
        role: u.role,
        updated_at: new Date().toISOString(),
      })

      // If driver, upsert driver profile
      if (u.role === 'driver') {
        await (supabaseAdmin.from('driver_profiles') as any).upsert({
          id: userId,
          vehicle_type: u.vehicle_type || 'Motor',
          vehicle_plate: u.vehicle_plate || 'B 1234 UTI',
          vehicle_color: u.vehicle_color || 'Merah',
          is_online: true,
          current_lat: -6.9175,
          current_lng: 107.6191,
          rating: 4.95,
          total_trips: 128,
        })
      }

      results.push({ email: u.email, role: u.role, status: 'ready' })
    } catch (err: any) {
      results.push({ email: u.email, status: 'error', message: err.message })
    }
  }

  return NextResponse.json({ message: 'Demo accounts configured successfully', results })
}
