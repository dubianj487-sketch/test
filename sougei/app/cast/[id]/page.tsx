'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Girl } from '@/lib/supabase'

const font = "'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif"

type DispatchInfo = {
  castDropNo: number
  dropsTotal: number
  driverName: string
  driverInitial: string
  departTime: string
  statusLabel: string
}

export default function CastHomePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [castId, setCastId] = useState<string | null>(null)
  const [girl, setGirl] = useState<Girl | null>(null)
  const [dispatchInfo, setDispatchInfo] = useState<DispatchInfo | null>(null)
  const [hasRideRequest, setHasRideRequest] = useState(false)
  const [requestLoading, setRequestLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(({ id }) => setCastId(id))
  }, [params])

  useEffect(() => {
    if (!castId) return
    fetchData()
    const ch = supabase.channel('cast-' + castId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatches' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_girls' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_requests' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [castId])

  async function fetchData() {
    if (!castId) return
    const today = new Date().toISOString().split('T')[0]

    const [girlRes, dispatchRes, rideReqRes] = await Promise.all([
      supabase.from('girls').select('*').eq('id', castId).single(),
      supabase.from('dispatches')
        .select('id, status, scheduled_time, arrived, boarded, drivers(name), dispatch_girls(girl_id, girls(name, dist))')
        .eq('date', today)
        .in('status', ['待機', '移動中'])
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('ride_requests').select('id').eq('girl_id', castId).eq('date', today).maybeSingle(),
    ])

    if (girlRes.data) setGirl(girlRes.data)
    setHasRideRequest(!!rideReqRes.data)

    const dispatches = (dispatchRes.data as any[]) || []
    const activeDispatch = dispatches.find((d) =>
      (d.dispatch_girls || []).some((dg: any) => dg.girl_id === castId)
    )

    if (activeDispatch) {
      const driverName = (activeDispatch.drivers as any)?.name || '未定'
      const allGirls = [...(activeDispatch.dispatch_girls || [])].sort(
        (a: any, b: any) => (a.girls?.dist || 0) - (b.girls?.dist || 0)
      )
      const myIndex = allGirls.findIndex((dg: any) => dg.girl_id === castId)
      let statusLabel = '配車確認中'
      if (activeDispatch.status === '移動中') statusLabel = '送迎中'
      else if (activeDispatch.arrived) statusLabel = '乗車待機'
      setDispatchInfo({
        castDropNo: myIndex + 1,
        dropsTotal: allGirls.length,
        driverName,
        driverInitial: driverName[0] || '?',
        departTime: activeDispatch.scheduled_time || '今すぐ',
        statusLabel,
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

  if (loading) return <Loader />
  if (!girl) return <NotFound />

  const showPending = hasRideRequest && !dispatchInfo

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5', fontFamily: font, color: '#0a0a0a', paddingBottom: 110 }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '52px 20px 16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#9a9a9a', letterSpacing: '.04em' }}>CLUB VENUS・KING</p>
          <h1 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.2 }}>こんばんは、{girl.name}さん</h1>
        </div>
        <button
          onClick={() => router.push('/')}
          style={{ height: 36, padding: '0 14px', borderRadius: 10, background: '#f4f4f4', border: 'none', color: '#6a6a6a', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
        >
          ログアウト
        </button>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Dispatch info card */}
        {dispatchInfo ? (
          <div style={{ background: '#0a0a0a', borderRadius: 22, padding: '20px 20px 18px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#06c167', display: 'block', flexShrink: 0, animation: 'lm-pulse 1.6s infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#9a9a9a', letterSpacing: '.04em' }}>本日の帰り便 ・ {dispatchInfo.statusLabel}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, margin: '14px 0 16px' }}>
              <span style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: '-.03em' }}>{dispatchInfo.castDropNo}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#9a9a9a', paddingBottom: 8 }}>/ {dispatchInfo.dropsTotal} 番目に降車</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#181818', borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{dispatchInfo.driverInitial}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{dispatchInfo.driverName}</p>
                <p style={{ margin: '1px 0 0', fontSize: 12, color: '#7a7a7a' }}>ドライバー</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#06c167', flexShrink: 0 }}>{dispatchInfo.departTime} 出発</span>
            </div>
          </div>
        ) : showPending ? (
          /* Request sent, awaiting dispatch */
          <div style={{ background: '#fff', border: '1.5px solid #bdeccf', borderRadius: 20, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#06c167', display: 'block', flexShrink: 0, animation: 'lm-pulse 1.6s infinite' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0d8a4a' }}>リクエスト送信済み</span>
            </div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0a0a0a' }}>ボーイが配車を調整中です</p>
            <p style={{ margin: '5px 0 0', fontSize: 13, color: '#7a7a7a', lineHeight: 1.55 }}>配車が確定するとここに便の情報が表示されます</p>
          </div>
        ) : (
          /* No request */
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 20, padding: '18px 20px' }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>今日の送迎をリクエスト</p>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#8a8a8a', lineHeight: 1.55 }}>乗車リクエストを送るとボーイに通知されます。配車が確定したらここで確認できます。</p>
            <button
              onClick={sendRideRequest}
              disabled={requestLoading}
              style={{ width: '100%', height: 52, borderRadius: 14, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: requestLoading ? 'default' : 'pointer', fontFamily: 'inherit', opacity: requestLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              {requestLoading ? '送信中...' : '乗車リクエストを送る'}
            </button>
          </div>
        )}
      </div>

      <CastNav castId={castId || ''} active="home" />
    </div>
  )
}

function Loader() {
  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#9a9a9a', fontSize: 14, fontFamily: "'Noto Sans JP',sans-serif" }}>読み込み中...</div>
    </div>
  )
}

function NotFound() {
  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#9a9a9a', fontSize: 14, fontFamily: "'Noto Sans JP',sans-serif" }}>見つかりませんでした</div>
    </div>
  )
}

export function CastNav({ castId, active }: { castId: string; active: 'home' | 'place' | 'request' }) {
  const router = useRouter()
  return (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#fff', borderTop: '1px solid #efefef', padding: '10px 14px 28px', display: 'flex', justifyContent: 'space-around', zIndex: 40, boxSizing: 'border-box' }}>
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
    <div onClick={onClick} role="button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: active ? '#0a0a0a' : '#b5b5b5', flex: 1 }}>
      {children}
      <span style={{ fontSize: 10.5, fontWeight: 700 }}>{label}</span>
    </div>
  )
}
