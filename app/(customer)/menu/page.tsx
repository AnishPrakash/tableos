'use client'
import AIRecommendations from '@/components/menu/AIRecommendations'
import { useState, useMemo } from 'react'
import { useRealtimeMenu } from '@/hooks/useRealtimeMenu'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import type { MenuItem } from '@/types'
import { toast } from 'sonner'
import Link from 'next/link'

interface CartItem extends MenuItem {
  quantity: number
  special_instructions?: string
}

const getCategoryImage = (categoryId: number, name: string) => {
  const nameLower = name.toLowerCase()
  // Specific dish matches first
  if (nameLower.includes('dal') || nameLower.includes('daal')) return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop'
  if (nameLower.includes('paneer')) return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop'
  if (nameLower.includes('biryani')) return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop'
  if (nameLower.includes('naan') || nameLower.includes('roti') || nameLower.includes('bread')) return 'https://images.unsplash.com/photo-1619894991209-9f9694be045a?w=400&h=300&fit=crop'
  if (nameLower.includes('lassi') || nameLower.includes('chai') || nameLower.includes('tea')) return 'https://images.unsplash.com/photo-1561677978-583a7431ef26?w=400&h=300&fit=crop'
  if (nameLower.includes('gulab') || nameLower.includes('kheer') || nameLower.includes('halwa')) return 'https://images.unsplash.com/photo-1666275437782-f0543aec3a8c?w=400&h=300&fit=crop'
  if (nameLower.includes('samosa')) return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop'
  if (nameLower.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop'
  if (nameLower.includes('pizza')) return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop'
  if (nameLower.includes('salad')) return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop'
  if (nameLower.includes('soup')) return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop'
  if (nameLower.includes('chicken')) return 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=300&fit=crop'
  if (nameLower.includes('mutton') || nameLower.includes('lamb')) return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop'
  if (nameLower.includes('rice') || nameLower.includes('pulao')) return 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400&h=300&fit=crop'
  // Category fallbacks
  const categoryImages: Record<number, string> = {
    1: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', // salads/starters
    2: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop', // mains/curry
    3: 'https://images.unsplash.com/photo-1619894991209-9f9694be045a?w=400&h=300&fit=crop', // breads
    4: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop', // drinks
    5: 'https://images.unsplash.com/photo-1666275437782-f0543aec3a8c?w=400&h=300&fit=crop', // desserts
  }
  return categoryImages[categoryId] || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop'
}

export default function MenuPage() {
  const { items, categories, loading } = useRealtimeMenu()
  const { user, profile } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [filter, setFilter] = useState<'all' | 'veg' | 'nonveg'>('all')

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCategory = selectedCategory === null || item.category_id === selectedCategory
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchFilter =
        filter === 'all' ||
        (filter === 'veg' && item.is_vegetarian) ||
        (filter === 'nonveg' && !item.is_vegetarian)
      return matchCategory && matchSearch && matchFilter
    })
  }, [items, selectedCategory, searchQuery, filter])

  const addToCart = (item: MenuItem) => {
    if (!item.is_available) return
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id)
      if (existing) {
        return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
    toast.success(`${item.name} added to cart`)
  }

  const updateCartQty = (itemId: number, delta: number) => {
    setCart((prev) => {
      const updated = prev.map((c) =>
        c.id === itemId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c
      ).filter((c) => c.quantity > 0)
      return updated
    })
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.current_price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const placeOrder = async () => {
    if (cart.length === 0) return
    setPlacingOrder(true)

    try {
      let sessionId: string

      const { data: existingSession } = await supabase
        .from('order_sessions')
        .select('id')
        .eq('status', 'active')
        .eq('table_id', 1)
        .single<{ id: string }>()

      if (existingSession) {
        sessionId = existingSession.id
      } else {
        const { data: newSession, error } = await supabase
          .from('order_sessions')
          .insert({
            table_id: 1,
            customer_id: user?.id,
            status: 'active',
          } as never)
          .select('id')
          .single<{ id: string }>()
        if (error) throw error
        sessionId = newSession.id
      }

      const orderItems = cart.map((item) => ({
        session_id: sessionId,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.current_price,
        total_price: item.current_price * item.quantity,
        status: 'pending',
        special_instructions: item.special_instructions,
      }))

      const { error: ordersError } = await supabase.from('orders').insert(orderItems as never)
      if (ordersError) throw ordersError

      await supabase
        .from('restaurant_tables')
        .update({ status: 'occupied', current_session_id: sessionId } as never)
        .eq('id', 1)

      toast.success('Order placed! The kitchen has been notified.')
      setCart([])
      setShowCart(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setPlacingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">T</div>
            <span className="font-bold text-gray-900">TableOS</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/queue" className="text-sm text-gray-600 hover:text-orange-500">Join Queue</Link>
            {!user ? (
              <Link href="/login" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Sign In
              </Link>
            ) : (
              <span className="text-sm text-gray-600">Hi, {profile?.full_name?.split(' ')[0]}</span>
            )}
            {cartCount > 0 && (
              <button
                onClick={() => setShowCart(true)}
                className="relative bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                🛒 Cart
                <span className="bg-white text-orange-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {cartCount}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="max-w-6xl mx-auto px-4 pb-4 flex items-center gap-3 flex-wrap">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes..."
            className="flex-1 min-w-48 bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-400"
          />
          <div className="flex gap-2">
            {(['all', 'veg', 'nonveg'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All' : f === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Live Status Banner */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-700 font-medium text-sm">
            Live menu — availability updates in real-time as the kitchen prepares orders
          </span>
        </div>

        <AIRecommendations userId={user?.id} />

        <div className="flex gap-6">
          {/* Category Sidebar */}
          <aside className="w-48 shrink-0 hidden md:block">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-32">
              <div className="p-3 bg-gray-50 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Categories</p>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  selectedCategory === null ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                🍽️ All Items
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors border-t border-gray-100 ${
                    selectedCategory === cat.id ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </aside>

          {/* Menu Grid */}
          <div className="flex-1">
            {/* Mobile category scroll */}
            <div className="flex gap-2 overflow-x-auto pb-3 md:hidden mb-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium ${
                  selectedCategory === null ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-700'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium ${
                    selectedCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-700'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-500 mb-4">{filteredItems.length} items</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const cartItem = cart.find((c) => c.id === item.id)
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                      item.is_available
                        ? 'border-gray-200 hover:border-orange-300 hover:shadow-md'
                        : 'border-gray-100 opacity-60'
                    }`}
                  >
                    <div className="h-36 relative overflow-hidden bg-orange-50">
                      <img
                        src={getCategoryImage(item.category_id, item.name)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop'
                        }}
                      />
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-white shadow"
                        style={{ background: item.is_vegetarian ? '#22c55e' : '#ef4444' }}
                        title={item.is_vegetarian ? 'Vegetarian' : 'Non-vegetarian'}
                      />
                      {!item.is_available && (
                        <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            Currently Unavailable
                          </span>
                        </div>
                      )}
                      {item.tags.includes('bestseller') && (
                        <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          ⭐ Bestseller
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h3>
                        {item.is_spicy && <span title="Spicy">🌶️</span>}
                      </div>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="text-xs text-gray-400">⏱️ {item.prep_time_minutes}min</span>
                        {item.calories && <span className="text-xs text-gray-400">🔥 {item.calories} cal</span>}
                        <span className="text-xs text-amber-600">★ {item.popularity_score}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-orange-600 text-lg">{formatCurrency(item.current_price)}</span>
                        {item.current_price !== item.base_price && (
                          <span className="text-xs text-gray-400 line-through">{formatCurrency(item.base_price)}</span>
                        )}
                        {cartItem ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateCartQty(item.id, -1)} className="w-7 h-7 bg-orange-100 text-orange-600 rounded-full font-bold text-lg flex items-center justify-center hover:bg-orange-200">−</button>
                            <span className="font-bold text-gray-900 w-4 text-center">{cartItem.quantity}</span>
                            <button onClick={() => addToCart(item)} className="w-7 h-7 bg-orange-500 text-white rounded-full font-bold text-lg flex items-center justify-center hover:bg-orange-600">+</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            disabled={!item.is_available}
                            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-1.5 rounded-xl transition-colors"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <div className="text-5xl mb-4">🔍</div>
                <p>No dishes found. Try a different search.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold">Your Order</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                    <p className="text-orange-600 text-sm font-semibold">{formatCurrency(item.current_price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateCartQty(item.id, -1)} className="w-7 h-7 bg-gray-100 rounded-full font-bold flex items-center justify-center hover:bg-gray-200">−</button>
                    <span className="w-5 text-center font-bold">{item.quantity}</span>
                    <button onClick={() => addToCart(item)} className="w-7 h-7 bg-orange-500 text-white rounded-full font-bold flex items-center justify-center hover:bg-orange-600">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">GST (5%)</span>
                <span className="font-semibold">{formatCurrency(cartTotal * 0.05)}</span>
              </div>
              <div className="flex justify-between items-center mb-6 text-lg font-bold">
                <span>Total</span>
                <span className="text-orange-600">{formatCurrency(cartTotal * 1.05)}</span>
              </div>
              <button
                onClick={placeOrder}
                disabled={placingOrder || cart.length === 0}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all text-lg"
              >
                {placingOrder ? 'Placing Order...' : 'Place Order →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}