import { NextResponse } from 'next/server'
import { getOperationalInsights } from '@/lib/openrouter'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    // Gather data for AI
    const { data: sessions } = await supabaseAdmin
      .from('order_sessions')
      .select('total_amount')
      .gte('opened_at', new Date(Date.now() - 7 * 86400000).toISOString())

    const totalRevenue = sessions?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0
    const totalOrders = sessions?.length || 0

    const { data: popularOrders } = await supabaseAdmin
      .from('orders')
      .select('menu_item_id, quantity, menu_items(name)')
      .gte('ordered_at', new Date(Date.now() - 7 * 86400000).toISOString())
      .neq('status', 'cancelled')

    const itemCounts: Record<string, { name: string; count: number }> = {}
    popularOrders?.forEach((o) => {
      const id = String(o.menu_item_id)
      const menuItem = Array.isArray(o.menu_items)?o.menu_items[0]:o.menu_items
      const name = (menuItem as { name: string } | null)?.name || 'Unknown'
      if (!itemCounts[id]) itemCounts[id] = { name, count: 0 }
      itemCounts[id].count += o.quantity
    })
    const topItems = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5).map((i) => i.name)

    const { data: lowStock } = await supabaseAdmin
      .from('inventory')
      .select('name')
      .filter('quantity_available', 'lte', 'reorder_threshold')

    const insights = await getOperationalInsights({
      totalRevenue,
      totalOrders,
      topItems,
      wasteItems: [],
      lowStockItems: (lowStock || []).map((i) => i.name),
      weeklyRevenueTrend: [0, 0, 0, 0, 0, 0, 0], // simplified
    })

    // Save to DB
    if (insights.length > 0) {
      await supabaseAdmin.from('ai_insights').insert(
        insights.map((i) => ({
          insight_type: i.priority,
          title: i.title,
          content: `${i.insight} — Action: ${i.action}`,
          data: i,
        }))
      )
    }

    return NextResponse.json({ insights })
  } catch (err) {
    console.error('AI insights error:', err)
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 })
  }
}