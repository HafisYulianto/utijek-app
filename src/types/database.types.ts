export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'driver' | 'customer'
export type ServiceType = 'utijek' | 'utikan' | 'utitip' | 'utibasing'
export type OrderStatus = 'pending' | 'accepted' | 'picking_up' | 'on_trip' | 'completed' | 'cancelled'
export type PaymentMethod = 'cash' | 'qris' | 'transfer'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface DriverProfile {
  id: string
  vehicle_type: string
  vehicle_plate: string
  vehicle_color: string | null
  is_online: boolean
  current_lat: number | null
  current_lng: number | null
  last_seen: string | null
  rating: number
  total_trips: number
  profiles?: Profile
}

export interface PricingConfig {
  id: string
  service_type: ServiceType
  price_per_km: number
  price_per_meter: number
  base_fare: number
  updated_by: string | null
  updated_at: string
}

export interface Order {
  id: string
  customer_id: string
  driver_id: string | null
  service_type: ServiceType
  status: OrderStatus
  pickup_lat: number
  pickup_lng: number
  pickup_address: string
  dropoff_lat: number | null
  dropoff_lng: number | null
  dropoff_address: string | null
  distance_meters: number | null
  estimated_price: number | null
  final_price: number | null
  order_notes: string | null
  item_details: Json | null
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus
  rated_by_customer: boolean
  created_at: string
  updated_at: string
  // Joins
  customer?: Profile
  driver?: Profile
}

export interface OrderTracking {
  id: string
  order_id: string
  driver_lat: number
  driver_lng: number
  recorded_at: string
}

export interface ChatMessage {
  id: string
  order_id: string
  sender_id: string
  message: string
  is_read: boolean
  created_at: string
  sender?: Profile
}

export interface Transaction {
  id: string
  order_id: string
  customer_id: string
  driver_id: string | null
  amount: number
  payment_method: PaymentMethod | null
  status: PaymentStatus
  created_at: string
  updated_at: string
  order?: Order
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string }
        Update: Partial<Profile>
      }
      driver_profiles: {
        Row: DriverProfile
        Insert: Partial<DriverProfile> & { id: string; vehicle_plate: string }
        Update: Partial<DriverProfile>
      }
      pricing_config: {
        Row: PricingConfig
        Insert: Partial<PricingConfig> & { service_type: ServiceType }
        Update: Partial<PricingConfig>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Order>
      }
      order_tracking: {
        Row: OrderTracking
        Insert: Omit<OrderTracking, 'id' | 'recorded_at'>
        Update: Partial<OrderTracking>
      }
      chat_messages: {
        Row: ChatMessage
        Insert: Omit<ChatMessage, 'id' | 'created_at'>
        Update: Partial<ChatMessage>
      }
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Transaction>
      }
    }
  }
}
