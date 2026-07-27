'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Order } from '@/types'

export function useRealtimeOrders(sessionId?: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    let query = supabase
      .from('orders')
      .select('*, menu_items(*)')
      .order('ordered_at', { ascending: false })

    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    const { data } = await query
    if (data) setOrders(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel('orders_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        ...(sessionId ? { filter: `session_id=eq.${sessionId}` } : {}),
      }, () => fetchOrders())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  return { orders, loading, refetch: fetchOrders }
}