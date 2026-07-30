'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  total_price: number
  status: string
  special_instructions?: string
  menu_items: { name: string } | null
}

interface Session {
  id: string
  total_amount: number | null
  created_at: string
}

export default function BillPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showPayModal, setShowPayModal] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [paymentDone, setPaymentDone] = useState(false)
  const [paying, setPaying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetchBill()
  }, [user])

  const fetchBill = async () => {
    setLoading(true)
    try {
      const { data: sessionData } = await supabase
        .from('order_sessions')
        .select('id, total_amount, created_at')
        .eq('status', 'active')
        .eq('table_id', 1)
        .single<Session>()

      if (!sessionData) {
        setSession(null)
        setLoading(false)
        return
      }

      setSession(sessionData)

      const { data: orderData } = await supabase
        .from('orders')
        .select('id, quantity, unit_price, total_price, status, special_instructions, menu_items(name)')
        .eq('session_id', sessionData.id)
        .order('created_at', { ascending: true })

      setOrders((orderData as unknown as OrderItem[]) ?? [])
    } catch {
      toast.error('Could not load your bill')
    } finally {
      setLoading(false)
    }
  }

  const subtotal = orders.reduce((sum, o) => sum + o.total_price, 0)
  const gst = subtotal * 0.05
  const total = subtotal + gst

  const startPayment = () => {
    setShowPayModal(true)
    setCountdown(5)
    setPaymentDone(false)
    setPaying(true)

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          confirmPayment()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const confirmPayment = async () => {
    try {
      if (!session) return

      // Mark session as completed
      await supabase
        .from('order_sessions')
        .update({ status: 'completed', total_amount: total } as never)
        .eq('id', session.id)

      // Free up the table
      await supabase
        .from('restaurant_tables')
        .update({ status: 'available', current_session_id: null } as never)
        .eq('current_session_id', session.id)

      setPaymentDone(true)
      setPaying(false)
      toast.success('Payment confirmed! Thank you for dining with us.')
    } catch {
      toast.error('Payment failed. Please try again.')
      setPaying(false)
    }
  }

  const handleModalClose = () => {
    if (paymentDone) {
      setShowPayModal(false)
      router.push('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF5EC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#FAF5EC] flex flex-col items-center justify-center gap-4 text-center p-6">
        <div className="text-5xl">🍽️</div>
        <h2 className="text-2xl font-bold text-stone-900">No active order found</h2>
        <p className="text-stone-500">Place an order from the menu first.</p>
        <Link href="/menu" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
          Go to Menu
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF5EC]">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/menu" className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors">
            <span className="text-lg">←</span>
            <span className="text-sm font-medium">Back to Menu</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-orange-600 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">T</div>
            <span className="font-bold text-stone-900">TableOS</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-stone-900 mb-1">Your Bill</h1>
        <p className="text-stone-500 text-sm mb-8">Table 1 · Session started {new Date(session.created_at).toLocaleTimeString()}</p>

        {/* Order Items */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-stone-100 bg-stone-50">
            <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide">Order Summary</h2>
          </div>
          <div className="divide-y divide-stone-100">
            {orders.map((order) => (
              <div key={order.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-stone-900">{order.menu_items?.name ?? 'Item'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      order.status === 'served' ? 'bg-green-100 text-green-700' :
                      order.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'preparing' ? 'bg-orange-100 text-orange-700' :
                      'bg-stone-100 text-stone-500'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  {order.special_instructions && (
                    <p className="text-xs text-stone-400 mt-0.5">Note: {order.special_instructions}</p>
                  )}
                  <p className="text-sm text-stone-500 mt-0.5">
                    {formatCurrency(order.unit_price)} × {order.quantity}
                  </p>
                </div>
                <span className="font-semibold text-stone-900">{formatCurrency(order.total_price)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>GST (5%)</span>
              <span>{formatCurrency(gst)}</span>
            </div>
            <div className="border-t border-stone-200 pt-3 flex justify-between text-xl font-bold text-stone-900">
              <span>Total</span>
              <span className="text-orange-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={startPayment}
          disabled={orders.length === 0}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-lg transition-all shadow-md hover:shadow-lg"
        >
          Pay {formatCurrency(total)} →
        </button>
      </main>

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
            {!paymentDone ? (
              <>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">💳</span>
                </div>
                <h2 className="text-2xl font-bold text-stone-900 mb-2">Processing Payment</h2>
                <p className="text-stone-500 mb-8">Please do not close this window</p>

                {/* Countdown ring */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                    <circle
                      cx="48" cy="48" r="40"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (countdown / 5)}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-orange-500">{countdown}</span>
                  </div>
                </div>

                <p className="text-stone-400 text-sm">Confirming with payment gateway...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">✅</span>
                </div>
                <h2 className="text-2xl font-bold text-stone-900 mb-2">Payment Confirmed!</h2>
                <p className="text-stone-500 mb-2">Thank you for dining with us.</p>
                <p className="text-2xl font-bold text-orange-600 mb-8">{formatCurrency(total)}</p>
                <button
                  onClick={handleModalClose}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}