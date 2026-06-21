'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Girl, type GirlDailyOverride } from '@/lib/supabase'

type DispatchInfo = {
  tripStatus: string
  castDropNo: number
  dropsTotal: number
  driverName: string
  driverInitial: string
  departTime: string
}

export default function CastHomePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [castId, setCastId] = useState<string | null>(null)
  const [girl, setGirl] = useState<Girl | null>(null)
  const [dispatchInfo, setDispatchInfo] = useState<DispatchInfo | null>(null)
  const [override, setOverride] = useState<GirlDailyOverride | null>(null)
  const [hasRideRequest, setHasRideRequest] = useState(false)
  const [requestLoading, setRequestLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(({ id }) => setCastId(id))
  }, [params])

  useEffect(() => {
    if (!castId) return
    fetchData()
    const ch = supabase.channel('cast-home-' + castId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatches' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_girls' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_requests' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [castId])

  async function fetchData() {
    if (!castId) return
    const today = new Date().toISOString().split('T')[0]

    const [girlRes, overrideRes, dispatchRes, rideReqRes] = await Promise.all([
      supabase.from('girls').select('*').eq('id', castId).single(),
      supabase.from('girl_daily_overrides').select('*').eq('girl_id', castId).eq('date', today).maybeSingle(),
      supabase.from('dispatches')
        .select('id, status, scheduled_time, destination, drivers(name), dispatch_girls(girl_id, created_at)')
        .eq('date', today)
        .in('status', ['待機', '移動中'])
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('ride_requests').select('id').eq('girl_id', castId).eq('date', today).maybeSingle(),
    ])

    if (girlRes.data) setGirl(girlRes.data)
    if (overrideRes.data) setOverride(overrideRes.data)
    setHasRideRequest(!!rideReqRes.data)

    const dispatches = (dispatchRes.data as any[]) || []
    const activeDispatch = dispatches.find((d) =>
      (d.dispatch_girls || []).some((dg: any) => dg.girl_id === castId)
    )

    if (activeDispatch) {
      const allGirls = [...(activeDispatch.dispatch_girls || [])].sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      const myIndex = allGirls.findIndex((dg: any) => dg.girl_id === castId)
      const driverName = (activeDispatch.drivers as any)?.name || '未定'
      setDispatchInfo({
        tripStatus: activeDispatch.status === '移動中' ? '移動中' : '承諾待ち',
        castDropNo: myIndex + 1,
        dropsTotal: allGirls.length,
        driverName,
        driverInitial: driverName[0] || '?',
        departTime: activeDispatch.scheduled_time || '—',
      })
    } else {
      setDispatchInfo(null)
    }

    setLoading(false)
  }

  async function sendRideRequest() {
    if (!castId || requestLoading) return
    setRequestLoading(true)
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('ride_requests').upsert({ girl_id: castId, date: today }, { onConflict: 'girl_id,date' })
    setHasRideRequest(true)
    setRequestLoading(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Hanken Grotesk','Noto Sans JP',sans-serif" }}>
        <div style={{ color: '#9a9a9a', fontSize: 14 }}>読み込み中...</div>
      </div>
    )
  }

  if (!girl) {
    return (
      <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Hanken Grotesk','Noto Sans JP',sans-serif" }}>
        <div style={{ color: '#9a9a9a', fontSize: 14 }}>見つかりませんでした</div>
      </div>
    )
  }

  const effectiveDest = girl.address || girl.area || '未登録'
  const todayChanged = override && !override.use_usual && override.today_destination
  const showRequestPending = hasRideRequest && !dispatchInfo

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', fontFamily: "'Hanken Grotesk','Noto Sans JP',sans-serif", color: '#0a0a0a', paddingBottom: 110 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '52px 20px 14px' }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#8a8a8a' }}>CLUB VENUS・KING</p>
          <h1 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>
            こんばんは、{girl.name}さん
          </h1>
        </div>
        <button
          onClick={() => router.push('/')}
          style={{ height: 38, padding: '0 14px', borderRadius: 10, background: '#f4f4f4', border: 'none', color: '#5a5a5a', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
        >
          ログアウト
        </button>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Dispatch info card */}
        {dispatchInfo ? (
          <div style={{ background: '#0a0a0a', borderRadius: 20, padding: 20, color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06c167', display: 'block', animation: 'lm-pulse 1.6s infinite' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#cfcfcf' }}>本日の帰り便 ・ {dispatchInfo.tripStatus}</span>
            </div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em' }}>{dispatchInfo.castDropNo}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#a8a8a8', paddingBottom: 6 }}>/ {dispatchInfo.dropsTotal} 番目に降車</span>
            </div>
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12, background: '#1a1a1a', borderRadius: 13, padding: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>
                {dispatchInfo.driverInitial}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{dispatchInfo.driverName}</p>
                <p style={{ margin: '1px 0 0', fontSize: 12, color: '#9a9a9a' }}>ドライバー</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#06c167', whiteSpace: 'nowrap', flexShrink: 0 }}>{dispatchInfo.departTime} 出発</span>
            </div>
          </div>
        ) : showRequestPending ? (
          /* Ride request sent, awaiting dispatch */
          <div style={{ background: '#f0fdf4', border: '1.5px solid #6ee7a0', borderRadius: 18, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06c167', display: 'block', animation: 'lm-pulse 1.6s infinite' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>乗車リクエスト送信済み</span>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>ボーイが配車を調整中です</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6e9e85' }}>配車が確定すると便の情報が表示されます</p>
          </div>
        ) : (
          /* No request yet */
          <div style={{ background: '#f7f7f7', borderRadius: 18, padding: 20 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#3a3a3a' }}>本日の帰り便</p>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#9a9a9a', lineHeight: 1.55 }}>まだ配車に登録されていません。<br />乗車リクエストを送るとボーイに通知されます。</p>
            <button
              onClick={sendRideRequest}
              disabled={requestLoading}
              style={{ marginTop: 14, width: '100%', height: 50, borderRadius: 14, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: requestLoading ? 'default' : 'pointer', fontFamily: 'inherit', opacity: requestLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              {requestLoading ? '送信中...' : '乗車リクエストを送る'}
            </button>
          </div>
        )}

        {/* Today request override */}
        {todayChanged && (
          <div style={{ marginTop: 12, background: '#fff8ed', border: '1px solid #ffe3b8', borderRadius: 14, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#c77700' }}>本日のみ降車場所を変更</span>
              <span style={{ fontSize: 11, fontWeight: 700, background: '#ffe3b8', color: '#8a5a00', padding: '2px 8px', borderRadius: 999 }}>承認待ち</span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 13.5, fontWeight: 600, color: '#8a5a00' }}>{override!.today_destination}</p>
          </div>
        )}

        {/* Drop location card */}
        <p style={{ margin: '24px 4px 10px', fontSize: 13, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>降車場所</p>
        <div
          onClick={() => castId && router.push(`/cast/${castId}/place`)}
          role="button"
          style={{ border: '1px solid #ededed', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 11, background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke="#0a0a0a" strokeWidth="1.8" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.4" stroke="#0a0a0a" strokeWidth="1.8" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#9a9a9a', fontWeight: 600 }}>登録済みの降車場所</p>
            <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{effectiveDest}</p>
          </div>
          <svg width="9" height="15" viewBox="0 0 9 15" style={{ flexShrink: 0 }}>
            <path d="M1 1l6 6.5L1 14" stroke="#bdbdbd" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Today only change button */}
        {!todayChanged && (
          <button
            onClick={() => castId && router.push(`/cast/${castId}/request`)}
            style={{ marginTop: 14, width: '100%', height: 56, borderRadius: 15, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 15.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M12 8v4m-2-2h4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            今日だけ違う場所に！
          </button>
        )}
      </div>

      <CastNav castId={castId || ''} active="home" />
    </div>
  )
}

function CastNav({ castId, active }: { castId: string; active: 'home' | 'place' | 'request' }) {
  const router = useRouter()
  return (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, background: '#fff', borderTop: '1px solid #efefef', padding: '10px 14px 28px', display: 'flex', justifyContent: 'space-around', zIndex: 40, boxSizing: 'border-box' }}>
      <NavBtn onClick={() => router.push(`/cast/${castId}`)} active={active === 'home'} label="ホーム">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M4 11 12 4l8 7m-14-1v8a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </NavBtn>
      <NavBtn onClick={() => router.push(`/cast/${castId}/place`)} active={active === 'place'} label="降車場所">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </NavBtn>
      <NavBtn onClick={() => router.push(`/cast/${castId}/request`)} active={active === 'request'} label="申請">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M8 4h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8m0-16-4 4m4-4v16m0 0-4-4M9 9h6M9 13h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </NavBtn>
    </div>
  )
}

function NavBtn({ onClick, active, label, children }: { onClick: () => void; active?: boolean; label: string; children: React.ReactNode }) {
  return (
    <div onClick={onClick} role="button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: active ? '#0a0a0a' : '#b5b5b5' }}>
      {children}
      <span style={{ fontSize: 10.5, fontWeight: 700 }}>{label}</span>
    </div>
  )
}
