'use client'

import { useEffect, useRef, useState } from 'react'
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

  // Use refs for callbacks so they're always fresh inside the subscription closure
  const onNewOrderRef = useRef(onNewOrder)
  const onOrderUpdateRef = useRef(onOrderUpdate)
  useEffect(() => { onNewOrderRef.current = onNewOrder }, [onNewOrder])
  useEffect(() => { onOrderUpdateRef.current = onOrderUpdate }, [onOrderUpdate])

  useEffect(() => {
    let channel: RealtimeChannel

    if (role === 'driver') {
      // Driver: subscribe to ALL order inserts — filter client-side
      // (Supabase Realtime does NOT reliably support column filters on INSERT)
      channel = supabase
        .channel('driver-orders-global')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
          },
          (payload) => {
            const newOrder = payload.new as Order
            // Only show if order is pending (no driver yet)
            if (newOrder.status === 'pending' && !newOrder.driver_id) {
              setPendingOrders((prev) => {
                // Avoid duplicates
                if (prev.find((o) => o.id === newOrder.id)) return prev
                return [newOrder, ...prev]
              })
              onNewOrderRef.current?.(newOrder)
            }
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
            // Remove from pending list if taken/cancelled
            if (updated.status !== 'pending' || updated.driver_id) {
              setPendingOrders((prev) => prev.filter((o) => o.id !== updated.id))
            }
            onOrderUpdateRef.current?.(updated)
          }
        )
        .subscribe((status) => {
          console.log('[Realtime] Driver channel status:', status)
        })

    } else if (role === 'customer' && customerId) {
      // Customer: subscribe to their own order status updates
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
            onOrderUpdateRef.current?.(payload.new as Order)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `customer_id=eq.${customerId}`,
          },
          (payload) => {
            onOrderUpdateRef.current?.(payload.new as Order)
          }
        )
        .subscribe((status) => {
          console.log('[Realtime] Customer channel status:', status)
        })
    }

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [role, driverId, customerId])

  return { pendingOrders }
}
