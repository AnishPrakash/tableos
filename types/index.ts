export type UserRole = 'customer' | 'waiter' | 'kitchen' | 'admin'

export interface Profile {
  id: string
  full_name: string
  phone?: string
  role: UserRole
  avatar_url?: string
  created_at: string
}

export interface Category {
  id: number
  name: string
  description?: string
  icon: string
  display_order: number
  is_active: boolean
}

export interface MenuItem {
  id: number
  name: string
  description?: string
  category_id: number
  base_price: number
  current_price: number
  image_url?: string
  is_available: boolean
  is_vegetarian: boolean
  is_vegan: boolean
  is_spicy: boolean
  prep_time_minutes: number
  calories?: number
  tags: string[]
  popularity_score: number
  category?: Category
}

export interface InventoryItem {
  id: number
  name: string
  unit: string
  quantity_available: number
  reorder_threshold: number
  cost_per_unit: number
  supplier?: string
  last_restocked: string
}

export interface RestaurantTable {
  id: number
  table_number: number
  capacity: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  current_session_id?: string
}

export interface QueueEntry {
  id: string
  customer_name: string
  customer_phone?: string
  customer_id?: string
  party_size: number
  status: 'waiting' | 'seated' | 'cancelled' | 'no_show'
  table_id?: number
  estimated_wait_minutes: number
  notes?: string
  joined_at: string
  seated_at?: string
}

export interface OrderSession {
  id: string
  table_id: number
  customer_id?: string
  waiter_id?: string
  status: 'active' | 'billing' | 'closed' | 'void'
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  payment_method?: string
  payment_status: string
  opened_at: string
  restaurant_tables?: RestaurantTable
}

export interface Order {
  id: string
  session_id: string
  menu_item_id: number
  quantity: number
  unit_price: number
  total_price: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled'
  special_instructions?: string
  kitchen_notes?: string
  ordered_at: string
  menu_items?: MenuItem
}

export interface WasteLog {
  id: number
  inventory_id?: number
  menu_item_id?: number
  quantity_wasted: number
  reason: string
  notes?: string
  logged_at: string
}

export interface AIInsight {
  id: number
  insight_type: string
  title: string
  content: string
  data?: Record<string, unknown>
  is_read: boolean
  generated_at: string
}