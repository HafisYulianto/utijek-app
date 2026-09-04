'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/types/database.types'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeOrdersOptions {
  role: 'driver' | 'customer'
  driverId?: string
  customerId?: string
  onNewOrder?: (order: Order) => void
  onOrderUpdate?: (order: Order) => void
}

export function useRealtimeOrders({
  role,
  driverId,
  customerId,
  onNewOrder,
  onOrderUpdate,
}: UseRealtimeOrdersOptions) {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const supabase = createClient()

  useEffect(() => {
    let channel: RealtimeChannel

    if (role === 'driver') {
      // Driver: subscribe to all pending orders
      channel = supabase
        .channel('driver-orders')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `status=eq.pending`,
          },
          (payload) => {
            const newOrder = payload.new as Order
            setPendingOrders((prev) => [newOrder, ...prev])
            onNewOrder?.(newOrder)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
          },
          (payload) => {
            const updated = payload.new as Order
            // Remove from pending if no longer pending
            if (updated.status !== 'pending') {
              setPendingOrders((prev) => prev.filter((o) => o.id !== updated.id))
            }
            onOrderUpdate?.(updated)
          }
        )
        .subscribe()
    } else if (role === 'customer' && customerId) {
      // Customer: subscribe to their own order updates
      channel = supabase
        .channel(`customer-order-${customerId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `customer_id=eq.${customerId}`,
          },
          (payload) => {
            onOrderUpdate?.(payload.new as Order)
          }
        )
        .subscribe()
    }

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [role, driverId, customerId])

  return { pendingOrders }
}
