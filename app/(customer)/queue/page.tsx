'use client'
import { useState } from 'react'
import { useQueue } from '@/hooks/useQueue'
import { supabase } from '@/lib/supabase'
import { computeQueueWait } from '@/lib/erlang'
import { toast } from 'sonner'
import Link from 'next/link'

export default function QueuePage() {
  const { queue, loading } = useQueue()
  const [form, setForm] = useState({ name: '', phone: '', party_size: 2, notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [joined, setJoined] = useState<{ position: number; wait: number; id: string } | null>(null)

  // Compute wait time with Erlang-C
  const getWaitEstimate = (position: number) => {
    return computeQueueWait(
      position,
      3, // assume 3 available tables (demo)
      45,
      form.party_size,
      10
    )
  }

  const joinQueue = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const position = queue.length + 1
      const waitResult = getWaitEstimate(position)

      const { data, error } = await supabase
        .from('queue')
        .insert({
          customer_name: form.name,
          customer_phone: form.phone,
          party_size: form.party_size,
          notes: form.notes,
          status: 'waiting',
          estimated_wait_minutes: waitResult.estimatedWaitMinutes,
        })
        .select('id')
        .single()

      if (error) throw error

      setJoined({
        position,
        wait: waitResult.estimatedWaitMinutes,
        id: data.id,
      })
      toast.success("You've joined the queue!")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to join queue')
    } finally {
      setSubmitting(false)
    }
  }

  const currentWait = getWaitEstimate(queue.length)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">T</div>
            <span className="font-bold">TableOS</span>
          </Link>
          <Link href="/menu" className="text-orange-500 font-medium text-sm">Browse Menu</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Live Queue Status */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <h2 className="font-bold text-gray-900 text-lg">Live Queue Status</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <div className="text-3xl font-black text-orange-600">{queue.length}</div>
              <div className="text-sm text-gray-500 mt-1">Parties Waiting</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-3xl font-black text-blue-600">{currentWait.estimatedWaitMinutes}</div>
              <div className="text-sm text-gray-500 mt-1">Est. Wait (min)</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-3xl font-black text-green-600">
                {queue.length === 0 ? '✓' : Math.round(currentWait.utilization * 100) + '%'}
              </div>
              <div className="text-sm text-gray-500 mt-1">{queue.length === 0 ? 'Available Now' : 'Occupancy'}</div>
            </div>
          </div>

          {/* Erlang explainer */}
          <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-500 flex items-start gap-2">
            <span>🧮</span>
            <span>
              Wait times are calculated using the <strong>Erlang-C queueing model</strong> — 
              a mathematical formula used in enterprise call centers and airport management.
              Estimated: <strong>{currentWait.recommended_action}</strong>
            </span>
          </div>
        </div>

        {/* Current Queue List */}
        {queue.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h3 className="font-bold mb-4">Current Queue</h3>
            <div className="space-y-3">
              {queue.map((entry, index) => (
                <div key={entry.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{entry.customer_name}</p>
                    <p className="text-sm text-gray-500">Party of {entry.party_size} • {entry.estimated_wait_minutes}min wait</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(entry.joined_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Join Queue Form / Confirmation */}
        {joined ? (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re in the queue!</h2>
            <div className="text-5xl font-black text-orange-600 my-4">#{joined.position}</div>
            <p className="text-gray-600 mb-2">Estimated wait: <strong>{joined.wait} minutes</strong></p>
            <p className="text-sm text-gray-500 mb-6">We&apos;ll seat you as soon as your table is ready</p>
            <div className="flex gap-3 justify-center">
              <Link href="/menu" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                Browse Menu →
              </Link>
              <button onClick={() => setJoined(null)} className="bg-white border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                Join Again
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-6">Join the Queue</h3>
            <form onSubmit={joinQueue} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Enter your name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Party Size *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm({ ...form, party_size: n })}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${
                        form.party_size === n
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Window seat, high chair needed, etc."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 text-sm"
                />
              </div>

              {/* Preview estimated wait */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm">
                <p className="font-medium text-orange-800">If you join now:</p>
                <p className="text-orange-700">Position #{queue.length + 1} • Est. wait: {getWaitEstimate(queue.length + 1).estimatedWaitMinutes} minutes</p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all"
              >
                {submitting ? 'Joining...' : 'Join Queue →'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}