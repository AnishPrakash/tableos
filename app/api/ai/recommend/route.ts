import { NextRequest, NextResponse } from 'next/server'
import { getMenuRecommendations } from '@/lib/openrouter'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    // Get customer order history
    const { data: history } = await supabaseAdmin
      .from('orders')
      .select('menu_items(name)')
      .eq('session_id', userId || '')
      .limit(10)

    const orderHistory = history?.map((o) => {
      const menuItem = Array.isArray(o.menu_items) ? o.menu_items[0] : o.menu_items
      return (menuItem as { name: string } | null)?.name || 'Unknown'
    })
    // Get available items
    const { data: available } = await supabaseAdmin
      .from('menu_items')
      .select('name')
      .eq('is_available', true)
      .limit(20)

    const availableItems = available?.map((i) => i.name) || []

    // Get overstocked items (for AI to prioritize)
    const { data: inventory } = await supabaseAdmin
      .from('inventory')
      .select('name, quantity_available, reorder_threshold')
      .filter('quantity_available', 'gt', 'reorder_threshold * 3')

    const overstockedItems = inventory?.map((i) => i.name) || []

    const recommendations = await getMenuRecommendations(orderHistory ?? [], availableItems, overstockedItems)
    return NextResponse.json({ recommendations })
  } catch (err) {
    console.error('Recommendations error:', err)
    return NextResponse.json({ recommendations: [] }, { status: 500 })
  }
}