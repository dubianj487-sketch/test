'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const COLORS = ['#F5A623', '#7B61FF', '#06C167', '#E84855', '#276EF1', '#00A8B5', '#FF7A45']

type TripData = {
  area: string
  status: string
  departTime: string
  assignedCount: number
  driverName: string
  dropsDone: number
  girls: { name: string; color: string }[]
}

export default function BoyHomePage() {
  const router = useRouter()
  const [trip, setTrip] = useState<TripData | null>(null)
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
      .select('id, destination, status, scheduled_time, drivers(name), dispatch_girls(girls(name))')
      .eq('date', today)
      .in('status', ['待機', '移動中'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) {
      const girls = ((data.dispatch_girls as any[]) || []).map((dg, i) => ({
        name: dg.girls?.name || '?',
        color: COLORS[i % COLORS.length],
      }))
      setTrip({
        area: data.destination || '—',
        status: data.status === '移動中' ? '移動中' : '承諾待ち',
        departTime: data.scheduled_time || '—',
        assignedCount: girls.length,
        driverName: (data.drivers as any)?.name || '未定',
        dropsDone: 0,
        girls,
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
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          padding: '52px 20px 14px',
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#8a8a8a', letterSpacing: '.04em' }}>
            CLUB LUMINA ・ ボーイ
          </p>
          <h1 style={{ margin: '2px 0 0', fontSize: 30, fontWeight: 800, letterSpacing: '-.02em' }}>配車</h1>
        </div>
        <Link
          href="/"
          style={{
            height: 38, padding: '0 14px', borderRadius: 10,
            background: '#f4f4f4', color: '#5a5a5a',
            fontSize: 13, fontWeight: 600, textDecoration: 'none',
            display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
          }}
        >
          ログアウト
        </Link>
      </div>

      <div style={{ padding: '0 20px' }}>
        <Link
          href="/dispatch"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            width: '100%', height: 58, borderRadius: 16,
            background: '#0a0a0a', color: '#fff',
            fontSize: 16, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 8px 20px -8px rgba(0,0,0,.5)',
            boxSizing: 'border-box',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          配車を依頼する
        </Link>

        <p style={{ margin: '26px 4px 10px', fontSize: 13, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>
          本日の便
        </p>

        {loading ? (
          <div
            style={{
              height: 120, border: '1px solid #ededed', borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#9a9a9a', fontSize: 14,
            }}
          >
            読み込み中...
          </div>
        ) : trip ? (
          <div
            role="button"
            onClick={() => router.push('/boy/status')}
            style={{ border: '1px solid #ededed', borderRadius: 18, padding: 16, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{ width: 8, height: 8, borderRadius: '50%', background: '#06c167', display: 'block' }}
                />
                <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' }}>{trip.area}</span>
              </div>
              <span
                style={{
                  fontSize: 12, fontWeight: 700, color: '#fff',
                  background: '#0a0a0a', padding: '5px 10px', borderRadius: 999, whiteSpace: 'nowrap',
                }}
              >
                {trip.status}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 18, marginTop: 14 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#9a9a9a', fontWeight: 600 }}>出発予定</p>
                <p style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 700 }}>{trip.departTime}</p>
              </div>
              <div style={{ width: 1, background: '#eee' }} />
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#9a9a9a', fontWeight: 600 }}>乗車人数</p>
                <p style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 700 }}>{trip.assignedCount} 名</p>
              </div>
              <div style={{ width: 1, background: '#eee' }} />
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#9a9a9a', fontWeight: 600 }}>ドライバー</p>
                <p style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 700, whiteSpace: 'nowrap' }}>{trip.driverName}</p>
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#0a0a0a', borderRadius: 3, width: pct }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6a6a6a' }}>
                降車 {trip.dropsDone}/{trip.girls.length}
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              border: '1px solid #ededed', borderRadius: 18, padding: '24px 16px',
              textAlign: 'center', color: '#9a9a9a', fontSize: 14,
            }}
          >
            本日の便はありません
          </div>
        )}

        {trip && trip.girls.length > 0 && (
          <>
            <p style={{ margin: '24px 4px 10px', fontSize: 13, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>
              乗車キャスト
            </p>
            <div
              role="button"
              onClick={() => router.push('/dispatch')}
              style={{ border: '1px solid #ededed', borderRadius: 18, padding: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {trip.girls.map((g, i) => (
                  <div
                    key={i}
                    style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: g.color, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 15,
                      border: '2px solid #fff',
                      marginLeft: i === 0 ? 0 : -8,
                    }}
                  >
                    {g.name[0]}
                  </div>
                ))}
                <span style={{ marginLeft: 12, fontSize: 14, fontWeight: 600, color: '#5a5a5a' }}>
                  {trip.assignedCount}名を編集
                </span>
              </div>
              <svg width="9" height="15" viewBox="0 0 9 15">
                <path d="M1 1l6 6.5L1 14" stroke="#bdbdbd" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </>
        )}
      </div>

      <BoyNav active="home" />
    </div>
  )
}

function BoyNav({ active }: { active: 'home' | 'mukae' | 'status' | 'manage' }) {
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
      <NavBtn onClick={() => router.push('/mukae')} active={active === 'mukae'} label="迎え">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </NavBtn>
      <NavBtn onClick={() => router.push('/boy/status')} active={active === 'status'} label="送迎状況">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M9 20 3 17V4l6 3m0 13 6-3m-6 3V7m6 10 6 3V7l-6-3m0 13V4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      </NavBtn>
      <NavBtn onClick={() => router.push('/masters/drivers')} active={active === 'manage'} label="管理">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3 20c0-4 2.7-6 6-6s6 2 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 11h6m-3-3v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
