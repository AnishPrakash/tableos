import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id, quantity, unit_price, total_price, status, special_instructions, menu_items(name)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ orders: data })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { items, session_id } = body

  if (!items || !session_id) {
    return NextResponse.json({ error: 'items and session_id required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .insert(items.map((item: {
      menu_item_id: number
      quantity: number
      unit_price: number
      total_price: number
      special_instructions?: string
    }) => ({
      session_id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      status: 'pending',
      special_instructions: item.special_instructions,
    })))
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ orders: data })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { session_id, total_amount } = body

  if (!session_id) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 })
  }

  // Mark session completed
  const { error: sessionError } = await supabaseAdmin
    .from('order_sessions')
    .update({ status: 'completed', total_amount })
    .eq('id', session_id)

  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 })

  // Free the table
  const { error: tableError } = await supabaseAdmin
    .from('restaurant_tables')
    .update({ status: 'available', current_session_id: null })
    .eq('current_session_id', session_id)

  if (tableError) return NextResponse.json({ error: tableError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}