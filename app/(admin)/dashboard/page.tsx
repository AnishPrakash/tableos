'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { toast } from 'sonner'
import Link from 'next/link'

interface Analytics {
  totalRevenue: number
  totalOrders: number
  activeOrders: number
  queueCount: number
  avgOrderValue: number
  lowStock: { name: string; quantity_available: number; reorder_threshold: number; unit: string }[]
  topItems: { name: string; count: number }[]
  weeklyRevenue: { date: string; day: string; revenue: number }[]
  tableStats: { total: number; available: number; occupied: number }
}

interface AIInsight {
  title: string
  insight: string
  action: string
  priority: 'high' | 'medium' | 'low'
}

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [loadingAI, setLoadingAI] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'ai'>('overview')

  useEffect(() => {
    if (!authLoading && profile && profile.role !== 'admin') {
      router.push('/login')
    }
  }, [profile, authLoading, router])

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics')
      const data = await res.json()
      setAnalytics(data)
    } catch {
      toast.error('Failed to load analytics')
    } finally {
      setLoadingAnalytics(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 60000) // refresh every minute
    return () => clearInterval(interval)
  }, [fetchAnalytics])

  const generateAIInsights = async () => {
    setLoadingAI(true)
    try {
      const res = await fetch('/api/ai/insights', { method: 'POST' })
      const data = await res.json()
      setAiInsights(data.insights || [])
      toast.success('AI insights generated!')
    } catch {
      toast.error('Failed to generate AI insights')
    } finally {
      setLoadingAI(false)
    }
  }

  if (authLoading || loadingAnalytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const priorityColors = {
    high: 'bg-red-50 border-red-200 text-red-800',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    low: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center font-bold text-white">T</div>
            <div>
              <h1 className="font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-400">Welcome, {profile?.full_name}</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            {[
              { tab: 'overview', label: '📊 Overview' },
              { tab: 'inventory', label: '📦 Inventory' },
              { tab: 'ai', label: '🤖 AI Insights' },
            ].map((item) => (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab as typeof activeTab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.tab
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
            <Link href="/kds" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              🍳 KDS
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && analytics && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Today's Revenue", value: formatCurrency(analytics.totalRevenue), icon: '💰', color: 'bg-green-50 border-green-200', textColor: 'text-green-700' },
                { label: 'Total Orders', value: analytics.totalOrders.toString(), icon: '🧾', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700' },
                { label: 'Active Orders', value: analytics.activeOrders.toString(), icon: '⚡', color: 'bg-orange-50 border-orange-200', textColor: 'text-orange-700' },
                { label: 'Queue Size', value: analytics.queueCount.toString(), icon: '👥', color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-700' },
              ].map((kpi) => (
                <div key={kpi.label} className={`${kpi.color} border rounded-2xl p-5`}>
                  <div className="text-2xl mb-2">{kpi.icon}</div>
                  <div className={`text-3xl font-black ${kpi.textColor}`}>{kpi.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Table Status */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Table Status</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-red-400 h-full rounded-full transition-all"
                    style={{ width: `${(analytics.tableStats.occupied / analytics.tableStats.total) * 100}%` }}
                  />
                </div>
                <div className="flex gap-4 text-sm shrink-0">
                  <span className="text-green-600 font-medium">{analytics.tableStats.available} available</span>
                  <span className="text-red-600 font-medium">{analytics.tableStats.occupied} occupied</span>
                  <span className="text-gray-500">{analytics.tableStats.total} total</span>
                </div>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">7-Day Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.weeklyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Items */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Top Selling Items (7 days)</h3>
                <div className="space-y-3">
                  {analytics.topItems.map((item, idx) => {
                    const maxCount = analytics.topItems[0]?.count || 1
                    return (
                      <div key={item.name} className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-400 w-5">#{idx + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-800">{item.name}</span>
                            <span className="text-gray-500">{item.count} orders</span>
                          </div>
                          <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-orange-400 to-amber-400 h-full rounded-full"
                              style={{ width: `${(item.count / maxCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {analytics.topItems.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-8">No order data yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Low Stock Alert */}
            {analytics.lowStock.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <h3 className="font-bold text-red-800 mb-4">⚠️ Low Stock Alerts ({analytics.lowStock.length} items)</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {analytics.lowStock.map((item) => (
                    <div key={item.name} className="bg-white border border-red-200 rounded-xl p-4">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-red-600">
                        {item.quantity_available} {item.unit} remaining
                        <span className="text-gray-400"> (threshold: {item.reorder_threshold})</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && <InventoryTab />}

        {/* AI Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">🤖</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Operations Assistant</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Powered by OpenRouter AI. Analyzes your restaurant&apos;s data and generates actionable business insights.
              </p>
              <button
                onClick={generateAIInsights}
                disabled={loadingAI}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold px-8 py-4 rounded-xl transition-all"
              >
                {loadingAI ? '🤔 Analyzing your data...' : '✨ Generate AI Insights'}
              </button>
            </div>

            {aiInsights.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 text-lg">AI Recommendations</h3>
                {aiInsights.map((insight, idx) => (
                  <div key={idx} className={`${priorityColors[insight.priority]} border rounded-2xl p-6`}>
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-bold text-lg">{insight.title}</h4>
                      <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${priorityColors[insight.priority]}`}>
                        {insight.priority} priority
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{insight.insight}</p>
                    <div className="bg-white/60 rounded-xl p-3">
                      <p className="text-sm font-semibold text-gray-800">📋 Recommended Action:</p>
                      <p className="text-sm text-gray-700 mt-1">{insight.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// Inventory sub-component
function InventoryTab() {
  const [inventory, setInventory] = useState<{
    id: number; name: string; unit: string
    quantity_available: number; reorder_threshold: number; cost_per_unit: number; supplier?: string
  }[]>([])
  const [loading, setLoading] = useState(true)
  const { supabase: _s } = { supabase: null } // just to avoid lint warning

  useEffect(() => {
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.from('inventory').select('*').order('name').then(({ data }) => {
        if (data) setInventory(data)
        setLoading(false)
      })
    })
  }, [])

  if (loading) return <div className="text-center py-12 text-gray-400">Loading inventory...</div>

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-lg">📦 Inventory Management</h3>
        <span className="text-sm text-gray-500">{inventory.length} items</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Item', 'Available', 'Threshold', 'Status', 'Cost/Unit'].map((h) => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inventory.map((item) => {
              const ratio = item.quantity_available / item.reorder_threshold
              const status = ratio > 3 ? 'good' : ratio > 1 ? 'low' : 'critical'
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.supplier && <p className="text-xs text-gray-400">{item.supplier}</p>}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700">{item.quantity_available} {item.unit}</td>
                  <td className="px-6 py-4 text-gray-500">{item.reorder_threshold} {item.unit}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      status === 'good' ? 'bg-green-100 text-green-700' :
                      status === 'low' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {status === 'good' ? '✅ Good' : status === 'low' ? '⚠️ Low' : '🚨 Critical'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">₹{item.cost_per_unit}/{item.unit}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}