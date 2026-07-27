import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Today's sessions
    const { data: todaySessions } = await supabaseAdmin
      .from('order_sessions')
      .select('total_amount, status')
      .gte('opened_at', today)

    const totalRevenue = todaySessions?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0
    const totalOrders = todaySessions?.length || 0

    // Active orders count
    const { count: activeOrders } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])

    // Queue count
    const { count: queueCount } = await supabaseAdmin
      .from('queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'waiting')

    // Low stock items
    const { data: lowStock } = await supabaseAdmin
      .from('inventory')
      .select('name, quantity_available, reorder_threshold, unit')
      .filter('quantity_available', 'lte', 'reorder_threshold')

    // Popular items
    const { data: popularOrders } = await supabaseAdmin
      .from('orders')
      .select('menu_item_id, quantity, menu_items(name)')
      .gte('ordered_at', sevenDaysAgo)
      .neq('status', 'cancelled')

    // Aggregate popular items
    const itemCounts: Record<string, { name: string; count: number }> = {}
    popularOrders?.forEach((o) => {
      const id = String(o.menu_item_id)
      const name = (o.menu_items as { name: string } | null)?.name || 'Unknown'
      if (!itemCounts[id]) itemCounts[id] = { name, count: 0 }
      itemCounts[id].count += o.quantity
    })
    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Weekly revenue (last 7 days)
    const weeklyRevenue = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayStart = d.toISOString().split('T')[0]
      const dayEnd = new Date(d.getTime() + 86400000).toISOString().split('T')[0]

      const { data: daySessions } = await supabaseAdmin
        .from('order_sessions')
        .select('total_amount')
        .gte('opened_at', dayStart)
        .lt('opened_at', dayEnd)
        .eq('payment_status', 'paid')

      weeklyRevenue.push({
        date: dayStart,
        day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        revenue: daySessions?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0,
      })
    }

    // Table status
    const { data: tables } = await supabaseAdmin
      .from('restaurant_tables')
      .select('status')

    const tableStats = {
      total: tables?.length || 0,
      available: tables?.filter((t) => t.status === 'available').length || 0,
      occupied: tables?.filter((t) => t.status === 'occupied').length || 0,
    }

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      activeOrders: activeOrders || 0,
      queueCount: queueCount || 0,
      lowStock: lowStock || [],
      topItems,
      weeklyRevenue,
      tableStats,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    })
  } catch (err) {
    console.error('Analytics error:', err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}