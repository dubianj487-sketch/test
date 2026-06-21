'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const font = "'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif"

type TripGirl = {
  girl_id: string
  name: string
  area: string | null
  address: string | null
  color: string | null
  dist: number
}

type ActiveDispatch = {
  id: string
  scheduled_time: string | null
  last_trip: boolean
  completed: number
  girls: TripGirl[]
}

export default function DriverTripPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [driverId, setDriverId] = useState<string | null>(null)
  const [dispatch, setDispatch] = useState<ActiveDispatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    params.then(({ id }) => setDriverId(id))
  }, [params])

  useEffect(() => {
    if (!driverId) return
    fetchData()
    const ch = supabase.channel('driver-trip-' + driverId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatches' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [driverId])

  async function fetchData() {
    if (!driverId) return
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('dispatches')
      .select('id, scheduled_time, last_trip, completed, dispatch_girls(girl_id, girls(name, area, address, color, dist))')
      .eq('driver_id', driverId)
      .eq('date', today)
      .eq('status', '移動中')
      .order('created_at')
      .limit(1)
      .maybeSingle()

    if (data) {
      const girls: TripGirl[] = ((data.dispatch_girls as any[]) || [])
        .map(dg => ({
          girl_id: dg.girl_id,
          name: dg.girls?.name || '?',
          area: dg.girls?.area || null,
          address: dg.girls?.address || null,
          color: dg.girls?.color || null,
          dist: dg.girls?.dist || 0,
        }))
        .sort((a, b) => a.dist - b.dist)
      setDispatch({ id: data.id, scheduled_time: data.scheduled_time, last_trip: !!data.last_trip, completed: data.completed || 0, girls })
    } else {
      setDispatch(null)
      router.push(`/driver/${driverId}`)
    }
    setLoading(false)
  }

  async function completeStop() {
    if (!dispatch || !driverId || completing) return
    setCompleting(true)
    const nextCompleted = dispatch.completed + 1
    const isAllDone = nextCompleted >= dispatch.girls.length

    if (isAllDone) {
      await Promise.all([
        supabase.from('dispatches').update({ completed: nextCompleted, status: '完了' }).eq('id', dispatch.id),
        supabase.from('drivers').update({ status: dispatch.last_trip ? '終了' : '待機' }).eq('id', driverId),
      ])
      router.push(`/driver/${driverId}`)
    } else {
      await supabase.from('dispatches').update({ completed: nextCompleted }).eq('id', dispatch.id)
      setDispatch(d => d ? { ...d, completed: nextCompleted } : d)
      setCompleting(false)
    }
  }

  if (loading) return <Loader />
  if (!dispatch) return <Loader />

  const { girls, completed } = dispatch
  const total = girls.length
  const currentGirl = completed < total ? girls[completed] : null
  const tripLabel = (() => {
    const areas = girls.map(g => (g.area || '').replace(/（.*）/, '')).filter(Boolean)
    if (areas.length === 0) return '送迎中'
    if (areas.length === 1) return areas[0] + '方面'
    if (areas.length === 2) return areas[0] + '・' + areas[1] + '方面'
    return areas[0] + '・' + areas[1] + ' ほか方面'
  })()

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', fontFamily: font, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 16px' }}>
        <p style={{ margin: '0 0 3px', fontSize: 12, fontWeight: 700, color: '#6e6e6e', letterSpacing: '.06em' }}>送迎中</p>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.2 }}>{tripLabel}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#1f1f1f', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#06c167', borderRadius: 2, width: `${total > 0 ? Math.round(completed / total * 100) : 0}%`, transition: 'width .4s ease' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#9a9a9a', flexShrink: 0 }}>{completed}/{total}</span>
        </div>
      </div>

      {/* Route */}
      <div style={{ padding: '0 16px' }}>
        {/* Store node (top) */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 36, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: '#1f1f1f', border: '2px solid #06c167', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l1.6-4.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.5L19 13m-14 0h14v4a1 1 0 0 1-1 1h-1.2a1.8 1.8 0 1 1-3.6 0H9.8a1.8 1.8 0 1 1-3.6 0H5a1 1 0 0 1-1-1v-4h1Z" stroke="#06c167" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ width: 2, flex: 1, background: '#1f1f1f', minHeight: 18, marginTop: 4 }} />
          </div>
          <div style={{ paddingTop: 7, paddingBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#9a9a9a' }}>CLUB VENUS・KING <span style={{ fontSize: 11, color: '#4a4a4a' }}>出発済み</span></p>
          </div>
        </div>

        {/* Girl nodes */}
        {girls.map((g, i) => {
          const isDone = i < completed
          const isCurrent = i === completed
          const isPending = i > completed

          return (
            <div key={g.girl_id} style={{ display: 'flex', gap: 14, marginBottom: 4 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 36, flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: isDone ? '#1f1f1f' : g.color || '#7B61FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: isDone ? '#4a4a4a' : '#fff', border: isCurrent ? '2px solid #F5A623' : 'none', position: 'relative', flexShrink: 0 }}>
                  {isDone ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="m5 12 4 4 10-10" stroke="#4a4a4a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (g.name[0])}
                  {!isDone && !isCurrent && !isPending && null}
                </div>
                {i < girls.length - 1 && <div style={{ width: 2, flex: 1, background: '#1f1f1f', minHeight: 18, marginTop: 4 }} />}
              </div>

              <div style={{ flex: 1, paddingTop: 5, paddingBottom: 18 }}>
                {isDone ? (
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#4a4a4a' }}>{g.name} <span style={{ fontSize: 11, color: '#3a3a3a' }}>降車完了</span></p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#3a3a3a' }}>{g.area || ''}</p>
                  </div>
                ) : isCurrent ? (
                  <div style={{ background: '#141414', border: '1px solid #F5A62340', borderRadius: 18, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F5A623', display: 'block', animation: 'lm-pulse 1.6s infinite' }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#F5A623', letterSpacing: '.04em' }}>現在の降車先</span>
                    </div>
                    <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 800 }}>{g.name}</p>
                    <p style={{ margin: '0 0 2px', fontSize: 12, color: '#9a9a9a' }}>{g.area || ''}</p>
                    {g.address && <p style={{ margin: '6px 0 12px', fontSize: 12.5, color: '#7a7a7a', lineHeight: 1.55 }}>{g.address}</p>}
                    <button
                      onClick={completeStop}
                      disabled={completing}
                      style={{ width: '100%', height: 48, borderRadius: 13, background: '#fff', color: '#0a0a0a', border: 'none', fontSize: 14, fontWeight: 700, cursor: completing ? 'default' : 'pointer', fontFamily: font, opacity: completing ? 0.7 : 1 }}
                    >
                      {completing ? '処理中...' : '降車を確認'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#4a4a4a' }}>{g.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#3a3a3a' }}>{g.area || ''}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Return node */}
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ width: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: '#0f0f0f', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l1.6-4.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.5L19 13m-14 0h14v4a1 1 0 0 1-1 1h-1.2a1.8 1.8 0 1 1-3.6 0H9.8a1.8 1.8 0 1 1-3.6 0H5a1 1 0 0 1-1-1v-4h1Z" stroke="#4a4a4a" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div style={{ paddingTop: 7 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#4a4a4a' }}>店に戻る {dispatch.last_trip && <span style={{ fontSize: 11, color: '#6a6a6a' }}>（最後の便）</span>}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Loader() {
  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#6e6e6e', fontSize: 14, fontFamily: "'Noto Sans JP',sans-serif" }}>読み込み中...</div>
    </div>
  )
}
