'use client'

import { useEffect, useState } from 'react'
import { supabase, type Dispatch, type Driver } from '@/lib/supabase'

type View = 'request' | 'moving' | 'done' | 'none'

export default function DriverNotificationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [driverId, setDriverId] = useState<string | null>(null)
  const [driver, setDriver] = useState<Driver | null>(null)
  const [dispatch, setDispatch] = useState<Dispatch | null>(null)
  const [view, setView] = useState<View>('none')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(({ id }) => {
      setDriverId(id)
    })
  }, [params])

  useEffect(() => {
    if (!driverId) return
    fetchData()
    const timer = setInterval(() => fetchData(false), 5000)
    return () => clearInterval(timer)
  }, [driverId])

  async function fetchData(showLoading = true) {
    if (!driverId) return
    if (showLoading) setLoading(true)

    const [driverRes, dispatchRes] = await Promise.all([
      supabase.from('drivers').select('*').eq('id', driverId).single(),
      supabase
        .from('dispatches')
        .select('*')
        .eq('driver_id', driverId)
        .in('status', ['承諾待ち', '移動中'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (driverRes.data) setDriver(driverRes.data)
    if (dispatchRes.data) {
      setDispatch(dispatchRes.data)
      setView(dispatchRes.data.status === '移動中' ? 'moving' : 'request')
    } else {
      setView('none')
    }
    setLoading(false)
  }

  async function handleAccept() {
    if (!dispatch) return
    await supabase.from('dispatches').update({ status: '移動中' }).eq('id', dispatch.id)
    await supabase.from('drivers').update({ status: '移動中' }).eq('id', driverId!)
    setDispatch(d => d ? { ...d, status: '移動中' } : d)
    setView('moving')
  }

  async function handleDecline() {
    if (!dispatch) return
    await supabase.from('dispatches').update({ status: '完了', driver_id: null }).eq('id', dispatch.id)
    await supabase.from('drivers').update({ status: '待機' }).eq('id', driverId!)
    setView('none')
    setDispatch(null)
  }

  async function handleComplete() {
    if (!dispatch) return
    await supabase.from('dispatches').update({ status: '完了' }).eq('id', dispatch.id)
    await supabase.from('drivers').update({ status: '終了' }).eq('id', driverId!)
    setView('done')
  }

  const isRequest = view === 'request'
  const isMoving = view === 'moving'
  const isDone = view === 'done'

  const headerDotStyle: React.CSSProperties = {
    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
    background: isMoving ? '#c2750a' : '#d03030',
    boxShadow: isMoving ? '0 0 6px rgba(194,117,10,0.6)' : '0 0 6px rgba(208,48,48,0.6)',
  }

  const urgencyLabel = dispatch?.urgency === '今すぐ'
    ? '今すぐ'
    : dispatch?.scheduled_time
      ? `${dispatch.scheduled_time} 上がり予定`
      : '—'

  const isUrgentNow = dispatch?.urgency === '今すぐ'

  const urgencyBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 18px',
    borderRadius: 30,
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: '-0.01em',
    background: isUrgentNow ? 'rgba(208,48,48,0.08)' : 'rgba(28,28,30,0.06)',
    color: isUrgentNow ? '#d03030' : '#1c1c1e',
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif" }}>
        <div style={{ color: '#aeaeb2', fontSize: 14 }}>読み込み中...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5', fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", color: '#1c1c1e', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#ffffff', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {(isRequest || isMoving) && (
            <div style={headerDotStyle} className="animate-live-pulse" />
          )}
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.02em', lineHeight: 1 }}>送迎</div>
            <div style={{ fontSize: 12, color: '#8e8e93', fontWeight: 400, marginTop: 2 }}>
              {isRequest ? 'ドライバー通知' : isMoving ? '移動中' : isDone ? '完了' : driver?.name || 'ドライバー'}
            </div>
          </div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e5e5ea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="7.5" r="3.5" fill="#8e8e93" />
            <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#8e8e93" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 16px 120px' }}>

        {/* Request state */}
        {isRequest && dispatch && (
          <div className="animate-slide-up" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d03030', boxShadow: '0 0 6px rgba(208,48,48,0.6)' }} className="animate-live-pulse" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#d03030', letterSpacing: '0.04em' }}>新しい配車依頼</span>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 18, border: '1.5px solid rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: 14 }}>
              {/* Girls */}
              <div style={{ padding: '22px 20px 18px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 8 }}>担当</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {dispatch.destination || '—'}
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '0 20px' }} />

              {/* Destination */}
              <div style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 8 }}>送り先</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                    <circle cx="8" cy="7.5" r="4" stroke="#1c1c1e" strokeWidth="1.8" />
                    <path d="M8 11.5C8 11.5 2 16 2 19h12c0-3-6-7.5-6-7.5z" stroke="#1c1c1e" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
                  </svg>
                  <span style={{ fontSize: 26, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {dispatch.destination || '—'}
                  </span>
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '0 20px' }} />

              {/* Urgency */}
              <div style={{ padding: '16px 20px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 10 }}>緊急度</div>
                <div style={urgencyBadgeStyle} className={isUrgentNow ? 'animate-urgent-pulse' : ''}>
                  {urgencyLabel}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Moving state */}
        {isMoving && dispatch && (
          <div className="animate-slide-up" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c2750a', boxShadow: '0 0 6px rgba(194,117,10,0.6)' }} className="animate-live-pulse" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#c2750a', letterSpacing: '0.04em' }}>移動中</span>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 18, border: '1.5px solid rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: 14 }}>
              {/* Girls */}
              <div style={{ padding: '22px 20px 18px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 8 }}>担当</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {dispatch.destination || '—'}
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '0 20px' }} />

              {/* Destination */}
              <div style={{ padding: '16px 20px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 8 }}>送り先</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                    <circle cx="8" cy="7.5" r="4" stroke="#1c1c1e" strokeWidth="1.8" />
                    <path d="M8 11.5C8 11.5 2 16 2 19h12c0-3-6-7.5-6-7.5z" stroke="#1c1c1e" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
                  </svg>
                  <span style={{ fontSize: 26, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {dispatch.destination || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Done state */}
        {isDone && (
          <div className="animate-slide-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1c1c1e', marginBottom: 8 }}>送迎完了</div>
            <div style={{ fontSize: 14, color: '#8e8e93' }}>お疲れ様でした</div>
          </div>
        )}

        {/* No dispatch state */}
        {view === 'none' && !loading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 14, color: '#aeaeb2', textAlign: 'center' }}>
              現在、配車依頼はありません
              {driver && <div style={{ marginTop: 8, fontSize: 17, fontWeight: 700, color: '#1c1c1e' }}>{driver.name}</div>}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {isRequest && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '8px 16px 36px', background: 'linear-gradient(0deg, #f5f5f5 60%, rgba(245,245,245,0))', zIndex: 100 }}>
          <button
            onClick={handleAccept}
            style={{ width: '100%', padding: 18, background: '#1a9e50', border: 'none', borderRadius: 14, color: '#ffffff', fontSize: 18, fontWeight: 700, fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", cursor: 'pointer', letterSpacing: '-0.01em', marginBottom: 10 }}
          >
            了解する
          </button>
          <button
            onClick={handleDecline}
            style={{ width: '100%', padding: 10, background: 'transparent', border: 'none', color: '#aeaeb2', fontSize: 14, fontWeight: 500, fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", cursor: 'pointer' }}
          >
            対応できない
          </button>
        </div>
      )}

      {isMoving && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '8px 16px 36px', background: 'linear-gradient(0deg, #f5f5f5 60%, rgba(245,245,245,0))', zIndex: 100 }}>
          <button
            onClick={handleComplete}
            style={{ width: '100%', padding: 18, background: '#1c1c1e', border: 'none', borderRadius: 14, color: '#ffffff', fontSize: 18, fontWeight: 700, fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", cursor: 'pointer', letterSpacing: '-0.01em' }}
          >
            完了する
          </button>
        </div>
      )}
    </div>
  )
}
