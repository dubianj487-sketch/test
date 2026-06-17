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

export default function DashboardPage() {
  const [drivers, setDrivers] = useState<DriverWithDispatch[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    fetchDrivers()
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  async function fetchDrivers() {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: true })
    if (!error && data) {
      setDrivers(data)
    }
    setLoading(false)
  }

  const days = ['日', '月', '火', '水', '木', '金', '土']
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日（${days[now.getDay()]}）`

  const availableCount = drivers.filter(d => d.status === '待機').length
  const movingCount = drivers.filter(d => d.status === '移動中').length
  const doneCount = drivers.filter(d => d.status === '終了').length

  const statusOrder: Record<string, number> = { '移動中': 0, '待機': 1, '終了': 2 }
  const sorted = [...drivers].sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3))

  function getAvatarStyle(status: string) {
    const bg =
      status === '移動中' ? 'rgba(194,117,10,0.12)' :
      status === '待機' ? 'rgba(26,158,80,0.12)' :
      'rgba(0,0,0,0.05)'
    const color =
      status === '移動中' ? '#c2750a' :
      status === '待機' ? '#1a9e50' :
      '#aeaeb2'
    return { background: bg, color }
  }

  function getBadgeStyle(status: string) {
    const bg =
      status === '移動中' ? '#c2750a' :
      status === '待機' ? '#1a9e50' :
      '#e5e5ea'
    const color =
      status === '移動中' || status === '待機' ? '#ffffff' : '#8e8e93'
    return { background: bg, color }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5', fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", color: '#1c1c1e', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#ffffff', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.02em', lineHeight: 1 }}>送迎</div>
          <div style={{ fontSize: 12, color: '#8e8e93', fontWeight: 400, marginTop: 2 }}>{dateStr}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/masters/drivers" style={{ fontSize: 12, color: '#8e8e93', textDecoration: 'none', padding: '4px 8px' }}>管理</Link>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e5e5ea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7.5" r="3.5" fill="#8e8e93" />
              <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#8e8e93" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '12px 16px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1a9e50', boxShadow: '0 0 6px rgba(26,158,80,0.6)' }} className="animate-live-pulse" />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#1a9e50', letterSpacing: '0.08em' }}>稼働中</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '4px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 4 }}>待機</div>
            <div style={{ fontSize: 40, fontWeight: 700, color: '#1a9e50', lineHeight: 1, fontFamily: "'SF Mono', Menlo, monospace" }}>{availableCount}</div>
          </div>
          <div style={{ width: 1, height: 48, background: 'rgba(0,0,0,0.07)' }} />
          <div style={{ flex: 1, textAlign: 'center', padding: '4px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 4 }}>移動中</div>
            <div style={{ fontSize: 40, fontWeight: 700, color: '#c2750a', lineHeight: 1, fontFamily: "'SF Mono', Menlo, monospace" }}>{movingCount}</div>
          </div>
          <div style={{ width: 1, height: 48, background: 'rgba(0,0,0,0.07)' }} />
          <div style={{ flex: 1, textAlign: 'center', padding: '4px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 4 }}>終了</div>
            <div style={{ fontSize: 40, fontWeight: 700, color: '#c7c7cc', lineHeight: 1, fontFamily: "'SF Mono', Menlo, monospace" }}>{doneCount}</div>
          </div>
        </div>
      </div>

      {/* Driver list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 100px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 2 }}>ドライバー</div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#aeaeb2', fontSize: 14 }}>読み込み中...</div>
        )}

        {!loading && sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#aeaeb2', fontSize: 14 }}>
            ドライバーが登録されていません
          </div>
        )}

        {sorted.map(driver => {
          const isMoving = driver.status === '移動中'
          const isAvail = driver.status === '待機'
          const isDone = driver.status === '終了'
          const avatarStyle = getAvatarStyle(driver.status)
          const badgeStyle = getBadgeStyle(driver.status)
          const destination = driver.currentDispatch?.destination || null
          const estimatedReturn = driver.currentDispatch?.estimated_return || null

          return (
            <div
              key={driver.id}
              style={{
                background: '#ffffff',
                borderRadius: 14,
                padding: '12px 14px',
                marginBottom: 8,
                border: '1.5px solid rgba(0,0,0,0.1)',
                opacity: isDone ? 0.55 : 1,
                transition: 'opacity 0.3s',
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: avatarStyle.background,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: 12, fontWeight: 700, color: avatarStyle.color,
                  }}>
                    {driver.name.charAt(0)}
                  </div>
                  <span style={{ fontSize: 17, fontWeight: 700, color: isDone ? '#aeaeb2' : '#1c1c1e', letterSpacing: '-0.01em' }}>
                    {driver.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      background: badgeStyle.background,
                      color: badgeStyle.color,
                      borderRadius: 20,
                      padding: '4px 11px',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                    className={isMoving ? 'animate-badge-pulse' : ''}
                  >
                    {driver.status}
                  </div>
                  <span style={{ fontSize: 18, color: '#d1d1d6', lineHeight: 1 }}>›</span>
                </div>
              </div>

              {/* Bottom row - destination */}
              {(isMoving || isDone) && destination && (
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.06em', marginBottom: 3 }}>送り先</div>
                    <div style={{ fontSize: 17, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isDone ? '#aeaeb2' : '#1c1c1e' }}>
                      {destination}
                    </div>
                  </div>
                  {isMoving && estimatedReturn && (
                    <div style={{ flexShrink: 0, textAlign: 'right', paddingLeft: 20 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.06em', marginBottom: 3 }}>店戻り</div>
                      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'SF Mono', Menlo, monospace", letterSpacing: '-0.03em', lineHeight: 1, color: '#1c1c1e' }}>
                        {estimatedReturn}
                      </div>
                    </div>
                  )}
                  {isDone && estimatedReturn && (
                    <div style={{ flexShrink: 0, textAlign: 'right', paddingLeft: 20 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.06em', marginBottom: 3 }}>店戻り</div>
                      <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'SF Mono', Menlo, monospace", letterSpacing: '-0.03em', lineHeight: 1, color: '#8e8e93' }}>
                        {estimatedReturn}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom buttons */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '8px 14px 28px', background: 'linear-gradient(0deg, #f5f5f5 60%, rgba(245,245,245,0))', zIndex: 100, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
          <button
            style={{ flex: 1, padding: 15, background: '#1a9e50', border: 'none', borderRadius: 14, color: '#ffffff', fontSize: 15, fontWeight: 600, fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", cursor: 'pointer' }}
          >
            迎え管理
          </button>
          <Link
            href="/dispatch"
            style={{ flex: 1, padding: 15, background: '#1c1c1e', border: 'none', borderRadius: 14, color: '#ffffff', fontSize: 15, fontWeight: 700, fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            送り配車
          </Link>
        </div>
      </div>
    </div>
  )
}
