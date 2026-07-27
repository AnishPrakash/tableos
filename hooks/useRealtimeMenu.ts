'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { MenuItem, Category } from '@/types'

export function useRealtimeMenu() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMenu = async () => {
    const [menuRes, catRes] = await Promise.all([
      supabase
        .from('menu_items')
        .select('*, category:categories(*)')
        .order('popularity_score', { ascending: false }),
      supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order'),
    ])
    if (menuRes.data) setItems(menuRes.data)
    if (catRes.data) setCategories(catRes.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchMenu()

    // Real-time subscription — items become unavailable when ingredients run low
    const channel = supabase
      .channel('menu_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'menu_items',
      }, () => fetchMenu())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return { items, categories, loading, refetch: fetchMenu }
}