'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { QueueEntry } from '@/types'

export function useQueue() {
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchQueue = async () => {
    const { data } = await supabase
      .from('queue')
      .select('*')
      .eq('status', 'waiting')
      .order('joined_at', { ascending: true })
    if (data) setQueue(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchQueue()
    const channel = supabase
      .channel('queue_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue' }, () => fetchQueue())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return { queue, loading, refetch: fetchQueue }
}