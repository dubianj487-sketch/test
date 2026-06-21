'use client'

import { rem } from '@/lib/rem'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type TripGirl = {
  name: string
  addr: string
  dropNo: number
  done: boolean
  current: boolean
}

type TripData = {
  dispatchId: string
  area: string
  girls: TripGirl[]
  dropsDone: number
}

export default function DriverTripPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [driverId, setDriverId] = useState<string | null>(null)
  const [trip, setTrip] = useState<TripData | null>(null)
  const [boarded, setBoarded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(0)
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    params.then(({ id }) => setDriverId(id))
  }, [params])

  useEffect(() => {
    if (!driverId) return
    fetchTrip()
    const t = setInterval(() => fetchTrip(false), 5000)
    return () => clearInterval(t)
  }, [driverId])

  async function fetchTrip(showLoading = true) {
    if (!driverId) return
    if (showLoading) setLoading(true)

    const { data } = await supabase
      .from('dispatches')
      .select('id, destination, status, dispatch_girls(girls(name, address, area))')
      .eq('driver_id', driverId)
      .eq('status', '移動中')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) {
      const girls: TripGirl[] = ((data.dispatch_girls as any[]) || []).map((dg, i) => {
        const g = dg.girls || {}
        return {
          name: g.name || '?',
          addr: g.address || g.area || '住所未登録',
          dropNo: i + 1,
          done: false,
          current: false,
        }
      })
      setTrip({ dispatchId: data.id, area: data.destination || '—', girls, dropsDone: 0 })
    } else {
      setTrip(null)
    }
    setLoading(false)
  }

  async function handleComplete() {
    if (!trip || !driverId) return
    const nextCompleted = completed + 1
    setCompleted(nextCompleted)
    if (nextCompleted >= trip.girls.length) {
      setFinishing(true)
      await supabase.from('dispatches').update({ status: '完了' }).eq('id', trip.dispatchId)
      await supabase.from('drivers').update({ status: '終了' }).eq('id', driverId)
    }
  }

  const girls = (trip?.girls || []).map((g, i) => ({
    ...g,
    done: i < completed,
    current: i === completed && boarded && completed < (trip?.girls.length || 0),
  }))

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100dvh', background: '#0a0a0a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Hanken Grotesk','Noto Sans JP',sans-serif",
        }}
      >
        <div style={{ color: '#6e6e6e', fontSize: rem(14) }}>読み込み中...</div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#0a0a0a',
        color: '#fff',
        fontFamily: "'Hanken Grotesk','Noto Sans JP',sans-serif",
        paddingBottom: 110,
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '52px 20px 14px',
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: rem(12), fontWeight: 700, color: '#06c167', letterSpacing: '.04em' }}>運行中</p>
          <h1 style={{ margin: '2px 0 0', fontSize: rem(24), fontWeight: 800, letterSpacing: '-.01em', whiteSpace: 'nowrap' }}>
            {trip?.area || '—'}
          </h1>
        </div>
        <span
          style={{
            fontSize: rem(13), fontWeight: 700, color: '#fff',
            background: '#1a1a1a', border: '1px solid #2a2a2a',
            padding: '7px 12px', borderRadius: 999,
          }}
        >
          降車 {completed}/{trip?.girls.length || 0}
        </span>
      </div>

      <div style={{ padding: '0 20px' }}>
        {!trip ? (
          <div
            style={{
              background: '#141414', border: '1px solid #262626', borderRadius: 18,
              padding: 28, textAlign: 'center',
            }}
          >
            <p style={{ margin: 0, fontSize: rem(16), fontWeight: 700, color: '#6e6e6e' }}>現在移動中の便はありません</p>
            <p style={{ margin: '8px 0 0', fontSize: rem(13), color: '#4a4a4a' }}>依頼タブから承諾してください</p>
          </div>
        ) : (
          <>
            {/* Boarding card */}
            <div style={{ border: '1px solid #262626', borderRadius: 18, padding: 16, background: '#141414' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke="#06c167" strokeWidth="1.8" strokeLinejoin="round" />
                    <circle cx="12" cy="10" r="2.2" fill="#06c167" />
                  </svg>
                  <span style={{ fontSize: rem(15), fontWeight: 700 }}>店前で乗車</span>
                </div>
                {boarded && <span style={{ fontSize: rem(11.5), fontWeight: 700, color: '#06c167' }}>乗車済み</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 12 }}>
                {trip.girls.map((g, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 20, height: 20, borderRadius: 6, background: '#222', color: '#cfcfcf',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: rem(11), fontWeight: 700, flexShrink: 0,
                      }}
                    >
                      {trip.girls.length - i}
                    </span>
                    <span style={{ fontSize: rem(14), fontWeight: 600 }}>{g.name}</span>
                  </div>
                ))}
              </div>
              {!boarded && (
                <button
                  onClick={() => setBoarded(true)}
                  style={{
                    marginTop: 14, width: '100%', height: 48, borderRadius: 13,
                    background: '#fff', color: '#0a0a0a', border: 'none',
                    fontSize: rem(14.5), fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  全員の乗車を確認
                </button>
              )}
            </div>

            <p style={{ margin: '24px 4px 12px', fontSize: rem(13), fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>
              降車順
            </p>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {girls.map((g, i) => (
                <div key={i} style={{ display: 'flex', gap: 13 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 26 }}>
                    {g.done ? (
                      <div
                        style={{
                          width: 26, height: 26, borderRadius: '50%', background: '#06c167',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24">
                          <path d="m5 12 4 4 10-10" stroke="#0a0a0a" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    ) : g.current ? (
                      <div
                        style={{
                          width: 26, height: 26, borderRadius: '50%', background: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#0a0a0a', fontSize: rem(13), fontWeight: 800, flexShrink: 0,
                        }}
                      >
                        {g.dropNo}
                      </div>
                    ) : (
                      <div
                        style={{
                          width: 26, height: 26, borderRadius: '50%', background: '#141414',
                          border: '2px solid #2c2c2c',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#6e6e6e', fontSize: rem(13), fontWeight: 700, flexShrink: 0,
                        }}
                      >
                        {g.dropNo}
                      </div>
                    )}
                    {i < girls.length - 1 && (
                      <div style={{ width: 2, flex: 1, background: '#222', minHeight: 24 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 20, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: rem(16), fontWeight: 700 }}>{g.name}</span>
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: rem(13), color: '#bdbdbd', lineHeight: 1.4 }}>{g.addr}</p>
                    {g.current && (
                      <button
                        onClick={handleComplete}
                        style={{
                          marginTop: 10, width: '100%', height: 46, borderRadius: 12,
                          background: '#06c167', color: '#fff', border: 'none',
                          fontSize: rem(14.5), fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24">
                          <path d="m5 12 4 4 10-10" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        到着・降車完了
                      </button>
                    )}
                    {g.done && (
                      <span style={{ display: 'inline-block', marginTop: 4, fontSize: rem(11.5), fontWeight: 700, color: '#06c167' }}>
                        降車完了
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {finishing && (
              <div
                style={{
                  marginTop: 8, textAlign: 'center', background: '#141414',
                  border: '1px solid #262626', borderRadius: 18, padding: 24,
                }}
              >
                <div
                  style={{
                    width: 54, height: 54, borderRadius: '50%', background: '#06c167',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
                  }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24">
                    <path d="m5 12 4 4 10-10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p style={{ margin: 0, fontSize: rem(19), fontWeight: 800 }}>全員の送迎が完了しました</p>
                <button
                  onClick={() => driverId && router.push(`/driver/${driverId}`)}
                  style={{
                    marginTop: 18, height: 48, padding: '0 24px', borderRadius: 13,
                    background: '#fff', color: '#0a0a0a', border: 'none',
                    fontSize: rem(14), fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  依頼一覧に戻る
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Driver nav */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 390,
          background: '#0a0a0a', borderTop: '1px solid #1f1f1f',
          padding: '10px 14px 28px',
          display: 'flex', justifyContent: 'space-around',
          zIndex: 40, boxSizing: 'border-box',
        }}
      >
        <NavBtn onClick={() => driverId && router.push(`/driver/${driverId}`)} label="依頼">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 3v4m8-4v4M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </NavBtn>
        <NavBtn onClick={() => {}} active label="運行">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 20 3 17V4l6 3m0 13 6-3m-6 3V7m6 10 6 3V7l-6-3m0 13V4m0 0L9 7" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          </svg>
        </NavBtn>
      </div>
    </div>
  )
}

function NavBtn({
  onClick, active, label, children,
}: {
  onClick: () => void
  active?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      onClick={onClick}
      role="button"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: active ? '#fff' : '#6e6e6e' }}
    >
      {children}
      <span style={{ fontSize: rem(10.5), fontWeight: 700 }}>{label}</span>
    </div>
  )
}
