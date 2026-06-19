'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type TripGirl = { name: string; addr: string; done: boolean; current: boolean; dropNo: number }

type TripDetail = {
  area: string
  status: string
  departTime: string
  driverName: string
  driverInitial: string
  girls: TripGirl[]
  dropsDone: number
}

export default function BoyStatusPage() {
  const router = useRouter()
  const [trip, setTrip] = useState<TripDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrip()
    const t = setInterval(fetchTrip, 5000)
    return () => clearInterval(t)
  }, [])

  async function fetchTrip() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('dispatches')
      .select('id, destination, status, scheduled_time, drivers(name), dispatch_girls(girls(name, address, area))')
      .eq('date', today)
      .in('status', ['待機', '移動中'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) {
      const driverName = (data.drivers as any)?.name || '未定'
      const girls: TripGirl[] = ((data.dispatch_girls as any[]) || []).map((dg, i) => {
        const g = dg.girls || {}
        return {
          name: g.name || '?',
          addr: g.address || g.area || '住所未登録',
          done: false,
          current: i === 0 && data.status === '移動中',
          dropNo: i + 1,
        }
      })
      setTrip({
        area: data.destination || '—',
        status: data.status === '移動中' ? '移動中' : '承諾待ち',
        departTime: data.scheduled_time || '—',
        driverName,
        driverInitial: driverName[0] || '?',
        girls,
        dropsDone: 0,
      })
    } else {
      setTrip(null)
    }
    setLoading(false)
  }

  const pct =
    trip && trip.girls.length > 0
      ? Math.round((trip.dropsDone / trip.girls.length) * 100) + '%'
      : '0%'

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#fff',
        fontFamily: "'Hanken Grotesk','Noto Sans JP',sans-serif",
        color: '#0a0a0a',
        paddingBottom: 110,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '52px 14px 14px' }}>
        <button
          onClick={() => router.push('/boy')}
          style={{
            width: 38, height: 38, borderRadius: 11, background: '#f4f4f4',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="9" height="15" viewBox="0 0 9 15">
            <path d="M8 1 2 7.5 8 14" stroke="#0a0a0a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.01em' }}>送迎状況</h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9a9a9a', fontSize: 14 }}>読み込み中...</div>
        ) : !trip ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9a9a9a', fontSize: 14 }}>本日の便はありません</div>
        ) : (
          <>
            <div style={{ background: '#0a0a0a', borderRadius: 18, padding: 18, color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: '#a8a8a8', fontWeight: 600 }}>{trip.area}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 22, fontWeight: 800, letterSpacing: '-.01em' }}>{trip.status}</p>
                </div>
                <span
                  style={{ width: 10, height: 10, borderRadius: '50%', background: '#06c167', display: 'block' }}
                />
              </div>
              <div
                style={{
                  marginTop: 16, display: 'flex', alignItems: 'center', gap: 12,
                  background: '#1a1a1a', borderRadius: 13, padding: 12,
                }}
              >
                <div
                  style={{
                    width: 42, height: 42, borderRadius: '50%', background: '#333', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16,
                  }}
                >
                  {trip.driverInitial}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{trip.driverName}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 12, color: '#9a9a9a' }}>{trip.departTime} 出発予定</p>
                </div>
              </div>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#2a2a2a', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#06c167', borderRadius: 3, width: pct }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#cfcfcf' }}>
                  降車 {trip.dropsDone}/{trip.girls.length}
                </span>
              </div>
            </div>

            <p style={{ margin: '24px 4px 10px', fontSize: 13, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>
              降車ルート
            </p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {trip.girls.map((g, i) => (
                <div key={i} style={{ display: 'flex', gap: 13 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
                    {g.done ? (
                      <div
                        style={{
                          width: 24, height: 24, borderRadius: '50%', background: '#06c167',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24">
                          <path d="m5 12 4 4 10-10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    ) : g.current ? (
                      <div
                        style={{
                          width: 24, height: 24, borderRadius: '50%', background: '#0a0a0a',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
                        }}
                      >
                        {g.dropNo}
                      </div>
                    ) : (
                      <div
                        style={{
                          width: 24, height: 24, borderRadius: '50%', background: '#fff',
                          border: '2px solid #e0e0e0',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#b0b0b0', fontSize: 12, fontWeight: 700, flexShrink: 0,
                        }}
                      >
                        {g.dropNo}
                      </div>
                    )}
                    {i < trip.girls.length - 1 && (
                      <div style={{ width: 2, flex: 1, background: '#eee', minHeight: 18 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{g.name}</span>
                      {g.done && <span style={{ fontSize: 11, fontWeight: 700, color: '#06c167' }}>降車済み</span>}
                      {g.current && <span style={{ fontSize: 11, fontWeight: 700, color: '#0a0a0a' }}>次の降車</span>}
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9a9a9a' }}>{g.addr}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <BoyNav active="status" />
    </div>
  )
}

function BoyNav({ active }: { active: 'home' | 'edit' | 'status' }) {
  const router = useRouter()
  return (
    <div
      style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 390,
        background: '#fff', borderTop: '1px solid #efefef',
        padding: '10px 14px 28px',
        display: 'flex', justifyContent: 'space-around',
        zIndex: 40, boxSizing: 'border-box',
      }}
    >
      <NavBtn onClick={() => router.push('/boy')} active={active === 'home'} label="配車">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l1.6-4.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.5L19 13m-14 0h14v4a1 1 0 0 1-1 1h-1.2a1.8 1.8 0 1 1-3.6 0H9.8a1.8 1.8 0 1 1-3.6 0H5a1 1 0 0 1-1-1v-4h1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </NavBtn>
      <NavBtn onClick={() => router.push('/dispatch')} active={active === 'edit'} label="便を編集">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M9 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-3 0-5 1.7-5 4v2h7m6-9 2 2-6 6H11v-2l6-6Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </NavBtn>
      <NavBtn onClick={() => router.push('/boy/status')} active={active === 'status'} label="送迎状況">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M6 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 0h6a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h3m6 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </NavBtn>
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
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: active ? '#0a0a0a' : '#b5b5b5' }}
    >
      {children}
      <span style={{ fontSize: 10.5, fontWeight: 700 }}>{label}</span>
    </div>
  )
}
