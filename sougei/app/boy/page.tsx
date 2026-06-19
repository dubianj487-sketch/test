'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, type Driver } from '@/lib/supabase'

type DriverWithDispatch = Driver & {
  currentDispatch?: {
    destination: string | null
    estimated_return: string | null
    status: string
  }
}

export default function BoyHomePage() {
  const [drivers, setDrivers] = useState<DriverWithDispatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDrivers()
    const timer = setInterval(() => fetchDrivers(false), 5000)
    return () => clearInterval(timer)
  }, [])

  async function fetchDrivers(showLoading = true) {
    if (showLoading) setLoading(true)
    const { data, error } = await supabase
      .from('drivers')
      .select('*, dispatches(destination, estimated_return, status)')
      .order('created_at', { ascending: true })
    if (!error && data) {
      const withDispatch = data.map((d: Driver & { dispatches?: { destination: string | null, estimated_return: string | null, status: string }[] }) => {
        const active = d.dispatches?.find(dp => dp.status === '移動中')
        const pending = d.dispatches?.find(dp => dp.status === '待機')
        return { ...d, currentDispatch: active || pending || undefined }
      })
      setDrivers(withDispatch)
    }
    setLoading(false)
  }

  const getDisplayStatus = (d: DriverWithDispatch) => {
    const ds = d.currentDispatch?.status
    return ds === '待機' ? '承諾待ち' : d.status
  }

  const statusOrder: Record<string, number> = { '移動中': 0, '承諾待ち': 1, 'お店前': 2, '待機': 3, '終了': 4 }
  const sorted = [...drivers].sort((a, b) => (statusOrder[getDisplayStatus(a)] ?? 4) - (statusOrder[getDisplayStatus(b)] ?? 4))

  function getStatusColor(status: string): string {
    switch (status) {
      case '移動中': return '#c77700'
      case '待機': return '#06c167'
      case '承諾待ち': return '#3478f6'
      case 'お店前': return '#8b5cf6'
      default: return '#9a9a9a'
    }
  }

  function getStatusBg(status: string): string {
    switch (status) {
      case '移動中': return '#fff7ed'
      case '待機': return '#f0fdf4'
      case '承諾待ち': return '#eff6ff'
      case 'お店前': return '#f5f3ff'
      default: return '#f4f4f4'
    }
  }

  const availableCount = drivers.filter(d => d.status === '待機' || d.status === 'お店前').length
  const movingCount = drivers.filter(d => d.status === '移動中').length
  const doneCount = drivers.filter(d => d.status === '終了').length

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#fff',
      fontFamily: "'Hanken Grotesk', 'Noto Sans JP', sans-serif",
      color: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: '52px 20px 14px',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#8a8a8a', letterSpacing: '.04em' }}>
            CLUB LUMINA ・ ボーイ
          </p>
          <h1 style={{ margin: '2px 0 0', fontSize: 30, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1 }}>
            配車
          </h1>
        </div>
        <Link
          href="/"
          style={{
            height: 38, padding: '0 14px', borderRadius: 10,
            background: '#f4f4f4', border: 'none',
            color: '#5a5a5a', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', textDecoration: 'none',
            display: 'flex', alignItems: 'center',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          ログアウト
        </Link>
      </div>

      {/* Dispatch CTA */}
      <div style={{ padding: '0 20px 16px' }}>
        <Link
          href="/dispatch"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            width: '100%', height: 58, borderRadius: 16,
            background: '#0a0a0a', color: '#fff',
            fontSize: 16, fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 8px 20px -8px rgba(0,0,0,.5)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          配車を依頼する
        </Link>
      </div>

      {/* Stats */}
      <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
        <div style={{
          flex: 1, background: '#f0fdf4', borderRadius: 14,
          padding: '12px 14px', border: '1px solid #bbf7d0',
        }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#16a34a', letterSpacing: '.04em' }}>待機中</p>
          <p style={{ margin: '2px 0 0', fontSize: 30, fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>{availableCount}</p>
        </div>
        <div style={{
          flex: 1, background: '#fff7ed', borderRadius: 14,
          padding: '12px 14px', border: '1px solid #fed7aa',
        }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#c77700', letterSpacing: '.04em' }}>移動中</p>
          <p style={{ margin: '2px 0 0', fontSize: 30, fontWeight: 800, color: '#c77700', lineHeight: 1 }}>{movingCount}</p>
        </div>
        <div style={{
          flex: 1, background: '#f7f7f7', borderRadius: 14,
          padding: '12px 14px', border: '1px solid #e5e5e5',
        }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#9a9a9a', letterSpacing: '.04em' }}>終了</p>
          <p style={{ margin: '2px 0 0', fontSize: 30, fontWeight: 800, color: '#9a9a9a', lineHeight: 1 }}>{doneCount}</p>
        </div>
      </div>

      {/* Driver list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 120px' }}>
        <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>
          ドライバー一覧
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9a9a9a', fontSize: 14 }}>
            読み込み中...
          </div>
        )}

        {!loading && sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9a9a9a', fontSize: 14 }}>
            ドライバーが登録されていません
          </div>
        )}

        {sorted.map(driver => {
          const displayStatus = getDisplayStatus(driver)
          const statusColor = getStatusColor(displayStatus)
          const statusBg = getStatusBg(displayStatus)
          const isDone = driver.status === '終了'
          const isMoving = driver.status === '移動中'
          const isPending = displayStatus === '承諾待ち'
          const destination = driver.currentDispatch?.destination || null
          const estimatedReturnRaw = driver.currentDispatch?.estimated_return || null
          const estimatedReturn = estimatedReturnRaw
            ? (() => {
                const d = new Date(estimatedReturnRaw)
                return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
              })()
            : null

          return (
            <div
              key={driver.id}
              style={{
                borderRadius: 18,
                padding: '14px 16px',
                marginBottom: 10,
                border: '1px solid #ededed',
                opacity: isDone ? 0.55 : 1,
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: isDone ? '#f4f4f4' : statusBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800,
                  color: isDone ? '#9a9a9a' : statusColor,
                  flexShrink: 0,
                }}>
                  {driver.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: isDone ? '#9a9a9a' : '#0a0a0a', letterSpacing: '-.01em' }}>
                    {driver.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#9a9a9a', marginTop: 2, fontWeight: 500 }}>
                    {driver.capacity}人乗り
                  </div>
                </div>
                <div
                  style={{
                    background: statusBg,
                    color: statusColor,
                    border: `1px solid ${statusColor}40`,
                    borderRadius: 999,
                    padding: '5px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                  className={(isMoving || isPending) ? 'animate-badge-pulse' : ''}
                >
                  {displayStatus}
                </div>
              </div>

              {(isMoving || isDone || isPending) && destination && (
                <div style={{
                  display: 'flex', alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  marginTop: 12, paddingTop: 12,
                  borderTop: '1px solid #f0f0f0',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9a9a9a', letterSpacing: '.06em', marginBottom: 3 }}>
                      送り先
                    </div>
                    <div style={{
                      fontSize: 15, fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: isDone ? '#9a9a9a' : '#0a0a0a',
                    }}>
                      {destination}
                    </div>
                  </div>
                  {(isMoving || isDone) && estimatedReturn && (
                    <div style={{ flexShrink: 0, textAlign: 'right', paddingLeft: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#9a9a9a', letterSpacing: '.06em', marginBottom: 2 }}>
                        戻り
                      </div>
                      <div style={{
                        fontSize: 26, fontWeight: 800,
                        letterSpacing: '-.02em', lineHeight: 1,
                        color: isDone ? '#9a9a9a' : '#0a0a0a',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {estimatedReturn}
                      </div>
                    </div>
                  )}
                  {isPending && (
                    <div style={{ flexShrink: 0, textAlign: 'right', paddingLeft: 16 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 700, color: '#3478f6',
                        background: '#eff6ff', borderRadius: 8, padding: '4px 10px',
                      }}>
                        未承諾
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
