'use client'
import { useState, useEffect } from 'react'
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { formatCurrency, getTimeElapsed } from '@/lib/utils'
import { toast } from 'sonner'

export default function WaiterOrdersPage() {
  const { orders, loading } = useRealtimeOrders()
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tables, setTables] = useState<{ id: number; table_number: number; status: string; current_session_id?: string }[]>([])

  useEffect(() => {
    if (!authLoading && profile && !['waiter', 'admin'].includes(profile.role)) {
      router.push('/login')
    }
  }, [profile, authLoading, router])

  useEffect(() => {
    const fetchTables = async () => {
      const { data } = await supabase.from('restaurant_tables').select('*').order('table_number')
      if (data) setTables(data)
    }
    fetchTables()

    const channel = supabase
      .channel('tables_waiter')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_tables' }, fetchTables)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const markServed = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'served', served_at: new Date().toISOString() } as never)
      .eq('id', orderId)
    if (error) toast.error('Failed to update')
    else toast.success('Marked as served')
  }

  const readyOrders = orders.filter((o) => o.status === 'ready')
  const activeOrders = orders.filter((o) => !['served', 'cancelled'].includes(o.status))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center font-bold text-white">T</div>
          <div>
            <h1 className="font-bold text-gray-900">Waiter Panel</h1>
            <p className="text-xs text-gray-400">{profile?.full_name} • {readyOrders.length} orders ready to serve</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Ready to Serve Alert */}
        {readyOrders.length > 0 && (
          <div className="bg-green-50 border border-green-300 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <h2 className="font-bold text-green-800">🍽️ {readyOrders.length} Order(s) Ready to Serve!</h2>
            </div>
            <div className="space-y-2">
              {readyOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-green-200">
                  <div>
                    <p className="font-semibold text-gray-900">{order.menu_items?.name} × {order.quantity}</p>
                    <p className="text-sm text-gray-500">Ready {getTimeElapsed(order.ordered_at)}</p>
                  </div>
                  <button
                    onClick={() => markServed(order.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    ✓ Served
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Table Grid */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Tables Overview</h3>
            <div className="grid grid-cols-5 gap-3">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`rounded-xl p-3 text-center border transition-all cursor-pointer ${
                    table.status === 'available'
                      ? 'bg-green-50 border-green-200 hover:border-green-400'
                      : table.status === 'occupied'
                      ? 'bg-red-50 border-red-200'
                      : table.status === 'reserved'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="font-bold text-gray-900 text-sm">T{table.table_number}</div>
                  <div className={`text-xs mt-1 font-medium ${
                    table.status === 'available' ? 'text-green-600' :
                    table.status === 'occupied' ? 'text-red-600' :
                    'text-gray-500'
                  }`}>
                    {table.status === 'available' ? '✓ Free' :
                     table.status === 'occupied' ? '● Busy' :
                     table.status === 'reserved' ? '📅 Rsv' : '🧹 Clean'}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full" /> Available</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full" /> Occupied</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded-full" /> Reserved</span>
            </div>
          </div>

          {/* Active Orders */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Active Orders ({activeOrders.length})</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activeOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{order.menu_items?.name}</p>
                    <p className="text-xs text-gray-400">Qty: {order.quantity} • {getTimeElapsed(order.ordered_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      order.status === 'ready' ? 'bg-green-100 text-green-700' :
                      order.status === 'preparing' ? 'bg-orange-100 text-orange-700' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                    <span className="font-semibold text-gray-700 text-sm">{formatCurrency(order.total_price)}</span>
                  </div>
                </div>
              ))}
              {activeOrders.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-sm">All orders served!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}