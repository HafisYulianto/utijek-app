-- ============================================================
-- FIX: Driver RLS policies for accepting orders
-- ============================================================

-- Fix 1: Allow drivers to UPDATE (accept) pending orders
-- Previously missing: driver_id IS NULL condition for pending order acceptance
DROP POLICY IF EXISTS "orders_update" ON orders;
CREATE POLICY "orders_update" ON orders FOR UPDATE
  USING (
    customer_id = auth.uid() OR
    driver_id = auth.uid() OR
    get_user_role() = 'admin' OR
    (get_user_role() = 'driver' AND status = 'pending' AND driver_id IS NULL)
  );

-- Fix 2: Enable FULL replica identity on orders so Supabase Realtime
-- can broadcast complete row data on INSERT and UPDATE events
ALTER TABLE public.orders REPLICA IDENTITY FULL;
