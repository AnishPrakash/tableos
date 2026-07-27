'use client'
import { useState, useEffect } from 'react'
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { getTimeElapsed, getStatusColor } from '@/lib/utils'
import { toast } from 'sonner'
import type { Order } from '@/types'

const KDS_STATUSES = ['pending', 'confirmed', 'preparing', 'ready'] as const
type KDSStatus = typeof KDS_STATUSES[number]

export default function KDSPage() {
  const { orders, loading } = useRealtimeOrders()
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!authLoading && profile && !['kitchen', 'admin'].includes(profile.role)) {
      router.push('/login')
    }
  }, [profile, authLoading, router])

  const activeOrders = orders.filter((o) => !['served', 'cancelled'].includes(o.status))

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId)
    const { error } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        ...(newStatus === 'ready' ? { prepared_at: new Date().toISOString() } : {}),
      } as never)
      .eq('id', orderId)

    if (error) toast.error('Failed to update order')
    else toast.success(`Order marked as ${newStatus}`)
    setUpdating(null)
  }

  const getNextStatus = (current: string): string | null => {
    const flow = ['pending', 'confirmed', 'preparing', 'ready', 'served']
    const idx = flow.indexOf(current)
    return idx < flow.length - 1 ? flow[idx + 1] : null
  }

  const getUrgencyLevel = (orderedAt: string): 'normal' | 'warning' | 'critical' => {
    const minutesElapsed = (now.getTime() - new Date(orderedAt).getTime()) / 60000
    if (minutesElapsed > 25) return 'critical'
    if (minutesElapsed > 15) return 'warning'
    return 'normal'
  }

  const columns: Record<KDSStatus, Order[]> = {
    pending: activeOrders.filter((o) => o.status === 'pending'),
    confirmed: activeOrders.filter((o) => o.status === 'confirmed'),
    preparing: activeOrders.filter((o) => o.status === 'preparing'),
    ready: activeOrders.filter((o) => o.status === 'ready'),
  }

  const columnConfig = {
    pending: { label: 'New Orders', color: 'border-t-yellow-400', bg: 'bg-yellow-50', count: columns.pending.length },
    confirmed: { label: 'Confirmed', color: 'border-t-blue-400', bg: 'bg-blue-50', count: columns.confirmed.length },
    preparing: { label: 'Preparing', color: 'border-t-orange-400', bg: 'bg-orange-50', count: columns.preparing.length },
    ready: { label: 'Ready to Serve', color: 'border-t-green-400', bg: 'bg-green-50', count: columns.ready.length },
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* KDS Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center font-bold">T</div>
            <div>
              <h1 className="font-bold text-lg">Kitchen Display System</h1>
              <p className="text-gray-400 text-sm">{now.toLocaleTimeString('en-IN')} • {activeOrders.length} active orders</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-gray-300">Live</span>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="bg-yellow-900/50 text-yellow-400 border border-yellow-800 px-3 py-1 rounded-full">
                {columns.pending.length} New
              </span>
              <span className="bg-orange-900/50 text-orange-400 border border-orange-800 px-3 py-1 rounded-full">
                {columns.preparing.length} Cooking
              </span>
              <span className="bg-green-900/50 text-green-400 border border-green-800 px-3 py-1 rounded-full">
                {columns.ready.length} Ready
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* KDS Board */}
      <div className="grid grid-cols-4 gap-4 p-4 h-[calc(100vh-80px)]">
        {(Object.keys(columns) as KDSStatus[]).map((status) => {
          const config = columnConfig[status]
          return (
            <div key={status} className="flex flex-col">
              <div className={`flex items-center justify-between mb-3 pb-3 border-b border-gray-700`}>
                <h2 className="font-bold text-gray-200">{config.label}</h2>
                {config.count > 0 && (
                  <span className="bg-gray-700 text-gray-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {config.count}
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {columns[status].map((order) => {
                  const urgency = getUrgencyLevel(order.ordered_at)
                  const nextStatus = getNextStatus(order.status)
                  return (
                    <div
                      key={order.id}
                      className={`bg-gray-800 rounded-xl border-t-4 p-4 transition-all ${
                        urgency === 'critical' ? 'border-t-red-500 ring-1 ring-red-500/30 animate-pulse' :
                        urgency === 'warning' ? 'border-t-yellow-500' :
                        config.color
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-white">{order.menu_items?.name}</p>
                          <p className="text-gray-400 text-xs">Qty: {order.quantity}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold ${
                            urgency === 'critical' ? 'text-red-400' :
                            urgency === 'warning' ? 'text-yellow-400' :
                            'text-gray-400'
                          }`}>
                            {getTimeElapsed(order.ordered_at)}
                          </span>
                          {urgency === 'critical' && (
                            <p className="text-red-400 text-xs font-bold">⚠️ URGENT</p>
                          )}
                        </div>
                      </div>

                      {order.special_instructions && (
                        <div className="bg-yellow-900/30 border border-yellow-800/50 rounded-lg p-2 mb-3">
                          <p className="text-yellow-400 text-xs">📝 {order.special_instructions}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          ⏱️ {order.menu_items?.prep_time_minutes}min prep
                        </span>
                      </div>

                      {nextStatus && (
                        <button
                          onClick={() => updateOrderStatus(order.id, nextStatus)}
                          disabled={updating === order.id}
                          className={`w-full mt-3 py-2 rounded-lg text-sm font-bold transition-all ${
                            nextStatus === 'ready'
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : nextStatus === 'preparing'
                              ? 'bg-orange-600 hover:bg-orange-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          } disabled:opacity-50`}
                        >
                          {updating === order.id ? '...' : `→ Mark ${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}`}
                        </button>
                      )}

                      {status === 'ready' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'served')}
                          disabled={updating === order.id}
                          className="w-full mt-2 py-2 rounded-lg text-sm font-bold bg-gray-600 hover:bg-gray-700 text-white transition-all disabled:opacity-50"
                        >
                          ✓ Served
                        </button>
                      )}
                    </div>
                  )
                })}

                {columns[status].length === 0 && (
                  <div className="text-center py-12 text-gray-600">
                    <div className="text-3xl mb-2">
                      {status === 'pending' ? '🕐' : status === 'confirmed' ? '👍' : status === 'preparing' ? '🔥' : '✅'}
                    </div>
                    <p className="text-sm">No orders</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}