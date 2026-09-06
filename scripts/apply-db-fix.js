const fs = require('fs')

const env = fs.readFileSync('.env.local', 'utf8')
const url = (env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] || '').trim()
const svcKey = (env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1] || '').trim()
const projectRef = url.replace('https://', '').split('.')[0]

console.log('\n=== SQL TO RUN IN SUPABASE DASHBOARD ===')
console.log('Dashboard URL: https://supabase.com/dashboard/project/' + projectRef + '/sql/new')
console.log('\nCopy and run this SQL:\n')
console.log(`-- Fix 1: Allow drivers to accept (UPDATE) pending orders
DROP POLICY IF EXISTS "orders_update" ON orders;

CREATE POLICY "orders_update" ON orders FOR UPDATE
  USING (
    customer_id = auth.uid() OR
    driver_id = auth.uid() OR
    get_user_role() = 'admin' OR
    (get_user_role() = 'driver' AND status = 'pending' AND driver_id IS NULL)
  );

-- Fix 2: Full replica identity for Realtime to work properly on INSERT
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Fix 3: Cancel stale pending orders older than 10 minutes (clean up)
UPDATE orders SET status = 'cancelled' 
WHERE status = 'pending' AND driver_id IS NULL 
  AND created_at < NOW() - INTERVAL '10 minutes';
`)
console.log('=========================================\n')
