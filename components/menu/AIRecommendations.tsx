'use client'
import { useState } from 'react'
import { toast } from 'sonner'

interface Recommendation {
  dish: string
  reason: string
}

interface Props {
  userId?: string
}

export default function AIRecommendations({ userId }: Props) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [shown, setShown] = useState(false)

  const getRecommendations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      setRecommendations(data.recommendations || [])
      setShown(true)
    } catch {
      toast.error('Could not get recommendations')
    } finally {
      setLoading(false)
    }
  }

  if (shown && recommendations.length > 0) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🤖</span>
          <h3 className="font-bold text-gray-900">AI Picks For You</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="bg-white rounded-xl p-4 border border-purple-100">
              <p className="font-semibold text-gray-900 text-sm">{rec.dish}</p>
              <p className="text-xs text-gray-500 mt-1">{rec.reason}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={getRecommendations}
      disabled={loading}
      className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-60 text-white font-semibold py-3 rounded-2xl transition-all mb-6 flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          AI is thinking...
        </>
      ) : (
        <>✨ Get AI-Powered Recommendations</>
      )}
    </button>
  )
}