/**
 * Type-safe Supabase query helpers.
 * Wraps supabase client with explicit return types to avoid `never` inference issues.
 */
import type {
  Profile, DriverProfile, PricingConfig, Order,
  OrderTracking, ChatMessage, Transaction
} from '@/types/database.types'

export type TableName = keyof {
  profiles: Profile
  driver_profiles: DriverProfile
  pricing_config: PricingConfig
  orders: Order
  order_tracking: OrderTracking
  chat_messages: ChatMessage
  transactions: Transaction
}

/**
 * Cast any Supabase query builder to avoid `never[]` inference issues
 * that occur when the Database type isn't fully registered with the client.
 */
export function typed<T>(query: any): Promise<{ data: T | null; error: any }> {
  return query
}
