'use client'

import { rem } from '@/lib/rem'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Driver } from '@/lib/supabase'

type DispatchFull = {
  id: string
  driver_id: string | null
  destination: string | null
  urgency: '今すぐ' | '時間指定'
  scheduled_time: string | null
  status: '待機' | '移動中' | '完了' | '承諾待ち'
  estimated_return: string | null
  date: string
  created_at: string
  dispatch_girls?: { girls: { name: string } | null }[]
}

type View = 'request' | 'moving' | 'done' | 'none'

export default function DriverNotificationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [driverId, setDriverId] = useState<string | null>(null)
  const [driver, setDriver] = useState<Driver | null>(null)
  const [dispatch, setDispatch] = useState<DispatchFull | null>(null)
  const [view, setView] = useState<View>('none')
  const [loading, setLoading] = useState(true)
  const [declining, setDeclining] = useState(false)

  useEffect(() => {
    params.then(({ id }) => setDriverId(id))
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
        .select('*, dispatch_girls(girls(name))')
        .eq('driver_id', driverId)
        .in('status', ['待機', '移動中'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (driverRes.data) setDriver(driverRes.data)
    if (dispatchRes.data) {
      setDispatch(dispatchRes.data as DispatchFull)
      setView(dispatchRes.data.status === '移動中' ? 'moving' : 'request')
    } else {
      setDispatch(null)
      setView('none')
    }
    setLoading(false)
  }

  async function handleAccept() {
    if (!dispatch) return
    await supabase.from('dispatches').update({ status: '移動中' }).eq('id', dispatch.id)
    await supabase.from('drivers').update({ status: '移動中' }).eq('id', driverId!)
    setDispatch((d) => d ? { ...d, status: '移動中' } : d)
    setView('moving')
  }

  async function handleDecline() {
    if (!dispatch) return
    setDeclining(true)
    await supabase.from('dispatches').update({ status: '完了', driver_id: null }).eq('id', dispatch.id)
    setView('none')
    setDispatch(null)
    setDeclining(false)
  }

  async function handleComplete() {
    if (!dispatch) return
    await supabase.from('dispatches').update({ status: '完了' }).eq('id', dispatch.id)
    await supabase.from('drivers').update({ status: '終了' }).eq('id', driverId!)
    setDriver((d) => d ? { ...d, status: '終了' } : d)
    setView('done')
  }

  async function handleOmiseMae() {
    if (!driverId || !driver) return
    const newStatus = driver.status === 'お店前' ? '待機' : 'お店前'
    await supabase.from('drivers').update({ status: newStatus }).eq('id', driverId)
    setDriver((d) => d ? { ...d, status: newStatus } : d)
  }

  const isRequest = view === 'request'
  const isMoving = view === 'moving'
  const isDone = view === 'done'

  const girlNames =
    dispatch?.dispatch_girls
      ?.map((dg) => dg.girls?.name)
      .filter(Boolean)
      .join('・') || null

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
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '52px 20px 14px',
        }}
      >
        <div>
          {isMoving && (
            <p style={{ margin: 0, fontSize: rem(12), fontWeight: 700, color: '#06c167', letterSpacing: '.04em' }}>
              運行中
            </p>
          )}
          <h1
            style={{
              margin: isMoving ? '2px 0 0' : 0,
              fontSize: rem(30), fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1,
            }}
          >
            {isRequest ? '配車依頼' : isMoving ? (dispatch?.destination || '移動中') : isDone ? '完了' : driver?.name || 'ドライバー'}
          </h1>
        </div>
        <button
          onClick={() => router.push('/driver')}
          style={{
            height: 38, padding: '0 14px', borderRadius: 10,
            background: '#1a1a1a', border: '1px solid #2a2a2a',
            color: '#9a9a9a', fontSize: rem(13), fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}
        >
          {isDone ? 'ログアウト' : '戻る'}
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px' }}>

        {/* Request state */}
        {isRequest && dispatch && (
          <>
            <div
              style={{ border: '1px solid #262626', borderRadius: 22, overflow: 'hidden', background: '#141414' }}
            >
              <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid #222' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: rem(12), fontWeight: 700, letterSpacing: '.06em', color: '#06c167' }}>
                    新着の依頼
                  </span>
                  <span
                    style={{
                      fontSize: rem(13), fontWeight: 700, color: '#fff',
                      background: '#222', padding: '4px 11px', borderRadius: 999, whiteSpace: 'nowrap',
                    }}
                  >
                    {dispatch.urgency === '今すぐ' ? '今すぐ' : dispatch.scheduled_time || '—'}
                  </span>
                </div>
                <p style={{ margin: '12px 0 0', fontSize: rem(26), fontWeight: 800, letterSpacing: '-.01em' }}>
                  {dispatch.destination || '—'}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: rem(13.5), color: '#9a9a9a' }}>
                  {girlNames || 'キャスト未定'}
                </p>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <div style={{ fontSize: rem(11), fontWeight: 700, color: '#6a6a6a', letterSpacing: '.06em', marginBottom: 8 }}>
                  緊急度
                </div>
                <div
                  style={{
                    display: 'inline-flex', alignItems: 'center', padding: '8px 18px', borderRadius: 30,
                    fontSize: rem(17), fontWeight: 700,
                    background: dispatch.urgency === '今すぐ' ? 'rgba(255,80,80,0.12)' : '#1a1a1a',
                    color: dispatch.urgency === '今すぐ' ? '#ff6b6b' : '#cfcfcf',
                  }}
                >
                  {dispatch.urgency === '今すぐ' ? '今すぐ' : dispatch.scheduled_time ? `${dispatch.scheduled_time} 上がり予定` : '—'}
                </div>
              </div>
            </div>

            <button
              onClick={handleAccept}
              style={{
                marginTop: 18, width: '100%', height: 58, borderRadius: 16,
                background: '#06c167', color: '#fff', border: 'none',
                fontSize: rem(17), fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 10px 24px -10px rgba(6,193,103,.7)',
              }}
            >
              この依頼を受ける
            </button>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <span
                onClick={declining ? undefined : handleDecline}
                role="button"
                style={{
                  display: 'inline-block', fontSize: rem(13),
                  color: declining ? '#4a4a4a' : '#7a7a7a',
                  cursor: declining ? 'default' : 'pointer',
                  textDecoration: 'underline', textUnderlineOffset: 3,
                }}
              >
                {declining ? 'キャンセル中...' : 'この依頼をキャンセル'}
              </span>
            </div>
          </>
        )}

        {/* Moving state */}
        {isMoving && dispatch && (
          <>
            <div
              style={{
                border: '1px solid #262626', borderRadius: 22, overflow: 'hidden',
                background: '#141414', marginBottom: 14,
              }}
            >
              <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid #222' }}>
                <p style={{ margin: 0, fontSize: rem(12), fontWeight: 700, color: '#9a9a9a', letterSpacing: '.04em' }}>
                  担当キャスト
                </p>
                <p style={{ margin: '6px 0 0', fontSize: rem(28), fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.1 }}>
                  {girlNames || '—'}
                </p>
              </div>
              <div style={{ padding: '14px 18px 18px' }}>
                <p style={{ margin: '0 0 6px', fontSize: rem(12), fontWeight: 700, color: '#9a9a9a', letterSpacing: '.04em' }}>
                  送り先
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
                    <path d="M9 21s8-6.5 8-13a8 8 0 1 0-16 0c0 6.5 8 13 8 13Z" stroke="#06c167" strokeWidth="1.8" strokeLinejoin="round" />
                    <circle cx="9" cy="8" r="2.5" fill="#06c167" />
                  </svg>
                  <span style={{ fontSize: rem(22), fontWeight: 800, color: '#fff', letterSpacing: '-.02em', lineHeight: 1 }}>
                    {dispatch.destination || '—'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleComplete}
              style={{
                width: '100%', height: 58, borderRadius: 16,
                background: '#fff', color: '#0a0a0a', border: 'none',
                fontSize: rem(17), fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              完了する
            </button>
          </>
        )}

        {/* Done state */}
        {isDone && (
          <div
            style={{
              marginTop: 40, textAlign: 'center',
              background: '#141414', border: '1px solid #262626',
              borderRadius: 22, padding: 32,
            }}
          >
            <div
              style={{
                width: 64, height: 64, borderRadius: '50%', background: '#06c167',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 18px',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="m5 12 4 4 10-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: rem(22), fontWeight: 800 }}>全員の送迎が完了</p>
            <p style={{ margin: '8px 0 0', fontSize: rem(14), color: '#8a8a8a' }}>お疲れ様でした</p>
          </div>
        )}

        {/* Waiting state */}
        {view === 'none' && !loading && driver && (
          <>
            {(driver.status === '待機' || driver.status === 'お店前') && (
              <>
                <div
                  style={{
                    background: '#141414', border: '1px solid #262626',
                    borderRadius: 22, padding: '20px 18px', marginBottom: 16,
                  }}
                >
                  <p style={{ margin: '0 0 4px', fontSize: rem(12), fontWeight: 600, color: '#6e6e6e', letterSpacing: '.04em' }}>
                    現在の状態
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: driver.status === 'お店前' ? '#8b5cf6' : '#06c167',
                        display: 'block', flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: rem(24), fontWeight: 800, letterSpacing: '-.01em' }}>
                      {driver.status === 'お店前' ? 'お店前に到着' : '待機中'}
                    </span>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: rem(13), color: '#6e6e6e', lineHeight: 1.5 }}>
                    配車依頼が届くまでお待ちください。
                  </p>
                </div>

                <p style={{ margin: '0 4px 12px', fontSize: rem(12), fontWeight: 700, color: '#6e6e6e', letterSpacing: '.04em' }}>
                  待機場所を変更
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => driver.status !== '待機' && handleOmiseMae()}
                    style={{
                      flex: 1, padding: '16px 10px', borderRadius: 16,
                      background: driver.status === '待機' ? '#06c167' : '#1a1a1a',
                      border: driver.status === '待機' ? 'none' : '1px solid #2a2a2a',
                      cursor: driver.status !== '待機' ? 'pointer' : 'default',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ fontSize: rem(15), fontWeight: 700, color: driver.status === '待機' ? '#fff' : '#6e6e6e' }}>
                      近場待機
                    </div>
                    <div style={{ fontSize: rem(11), color: driver.status === '待機' ? 'rgba(255,255,255,.7)' : '#4a4a4a', marginTop: 3 }}>
                      コンビニ等
                    </div>
                  </button>
                  <button
                    onClick={() => driver.status !== 'お店前' && handleOmiseMae()}
                    style={{
                      flex: 1, padding: '16px 10px', borderRadius: 16,
                      background: driver.status === 'お店前' ? '#8b5cf6' : '#1a1a1a',
                      border: driver.status === 'お店前' ? 'none' : '1px solid #2a2a2a',
                      cursor: driver.status !== 'お店前' ? 'pointer' : 'default',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ fontSize: rem(15), fontWeight: 700, color: driver.status === 'お店前' ? '#fff' : '#6e6e6e' }}>
                      お店前
                    </div>
                    <div style={{ fontSize: rem(11), color: driver.status === 'お店前' ? 'rgba(255,255,255,.7)' : '#4a4a4a', marginTop: 3 }}>
                      到着済み
                    </div>
                  </button>
                </div>
              </>
            )}

            {driver.status === '終了' && (
              <div
                style={{
                  background: '#141414', border: '1px solid #262626',
                  borderRadius: 22, padding: '24px 18px', textAlign: 'center',
                }}
              >
                <p style={{ margin: 0, fontSize: rem(20), fontWeight: 800 }}>本日の送迎終了</p>
                <p style={{ margin: '8px 0 0', fontSize: rem(14), color: '#8a8a8a' }}>お疲れ様でした</p>
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
        <NavBtn onClick={() => {}} active label="依頼">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 3v4m8-4v4M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </NavBtn>
        <NavBtn onClick={() => driverId && router.push(`/driver/${driverId}/trip`)} label="運行">
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
