'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const font = "'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif"

type DriverRow = { id: string; name: string; status: string; note: string | null; car: string | null; plate: string | null }
type DispatchRow = {
  id: string; driver_id: string | null; scheduled_time: string | null; status: string; last_trip: boolean;
  arrived: boolean; boarded: boolean; completed: number; created_at: string;
  dispatch_girls: { girl_id: string; girls: { name: string; area: string | null; color: string | null; dist: number | null } | null }[]
}

export default function DriverOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [driverId, setDriverId] = useState<string | null>(null)
  const [driver, setDriver] = useState<DriverRow | null>(null)
  const [dispatches, setDispatches] = useState<DispatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    params.then(({ id }) => setDriverId(id))
  }, [params])

  useEffect(() => {
    if (!driverId) return
    fetchData()
    const ch = supabase.channel('driver-offer-' + driverId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatches' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_girls' }, fetchData)
      .subscribe()
    channelRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [driverId])

  async function fetchData() {
    if (!driverId) return
    const today = new Date().toISOString().split('T')[0]
    const [drvRes, dpRes] = await Promise.all([
      supabase.from('drivers').select('*').eq('id', driverId).single(),
      supabase.from('dispatches')
        .select('id, driver_id, scheduled_time, status, last_trip, arrived, boarded, completed, created_at, dispatch_girls(girl_id, girls(name, area, color, dist))')
        .eq('driver_id', driverId)
        .eq('date', today)
        .neq('status', '完了')
        .order('created_at'),
    ])
    if (drvRes.data) setDriver(drvRes.data as DriverRow)
    setDispatches((dpRes.data as unknown as DispatchRow[]) || [])
    setLoading(false)

    // Auto-redirect if in a trip (dispatch.status='移動中')
    const activeTrip = (dpRes.data as unknown as DispatchRow[])?.find(d => d.status === '移動中')
    if (activeTrip) {
      router.push(`/driver/${driverId}/trip`)
    }
  }

  async function markArrived(dispatchId: string) {
    await supabase.from('dispatches').update({ arrived: true }).eq('id', dispatchId)
    setDispatches(prev => prev.map(d => d.id === dispatchId ? { ...d, arrived: true } : d))
  }

  async function boardAll(dispatchId: string) {
    await Promise.all([
      supabase.from('dispatches').update({ boarded: true, status: '移動中' }).eq('id', dispatchId),
      supabase.from('drivers').update({ status: '移動中' }).eq('id', driverId!),
    ])
    router.push(`/driver/${driverId}/trip`)
  }

  async function toggleStatus(newStatus: '待機' | 'お店前') {
    if (!driverId || !driver) return
    // Only allow toggling when no active dispatch
    if (dispatches.length > 0) return
    setStatusMenuOpen(false)
    await supabase.from('drivers').update({ status: newStatus }).eq('id', driverId)
    setDriver(d => d ? { ...d, status: newStatus } : d)
  }

  async function logout() {
    setSettingsOpen(false)
    router.push('/')
  }

  if (loading) return <Loader />

  const pendingDispatches = dispatches.filter(d => d.status === '待機')
  const myStatus = driver?.status || '待機'
  const statusLabel = myStatus === '待機' ? '待機中' : myStatus === 'お店前' ? 'お店前' : myStatus === '移動中' ? '移動中' : '終了'
  const statusColor = myStatus === '待機' ? '#06c167' : myStatus === 'お店前' ? '#276EF1' : myStatus === '移動中' ? '#F5A623' : '#6a6a6a'

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', fontFamily: font, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 18px' }}>
        <p style={{ margin: '0 0 3px', fontSize: 12, fontWeight: 700, color: '#6e6e6e', letterSpacing: '.06em' }}>DRIVER</p>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.1 }}>{driver?.name || 'ドライバー'}</h1>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* Status cards */}
        {pendingDispatches.length === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <StatusCard
              label="待機中"
              sub="近場の待機"
              active={myStatus === '待機'}
              color="#06c167"
              onClick={() => toggleStatus('待機')}
            />
            <StatusCard
              label="お店前"
              sub="お店前の待機"
              active={myStatus === 'お店前'}
              color="#276EF1"
              onClick={() => toggleStatus('お店前')}
            />
          </div>
        )}

        {/* Trip cards */}
        {pendingDispatches.length > 0 && (
          <>
            <div style={{ height: 1, background: '#1f1f1f', marginBottom: 18 }} />
            <p style={{ margin: '0 2px 12px', fontSize: 11, fontWeight: 700, color: '#6a6a6a', letterSpacing: '.08em' }}>担当便</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingDispatches.map(d => (
                <TripCard
                  key={d.id}
                  dispatch={d}
                  onArrived={() => markArrived(d.id)}
                  onBoard={() => boardAll(d.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* No dispatch + 終了 state */}
        {pendingDispatches.length === 0 && myStatus === '終了' && (
          <div style={{ background: '#141414', border: '1px solid #262626', borderRadius: 20, padding: '24px 20px', textAlign: 'center', marginTop: 4 }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>本日の送迎終了</p>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7a7a7a' }}>お疲れ様でした</p>
          </div>
        )}

        {/* No dispatch + free state */}
        {pendingDispatches.length === 0 && (myStatus === '待機' || myStatus === 'お店前') && (
          <div style={{ marginTop: 4, background: '#141414', border: '1px solid #262626', borderRadius: 18, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, display: 'block', flexShrink: 0, animation: 'lm-pulse 2s infinite' }} />
              <span style={{ fontSize: 14, fontWeight: 700 }}>{statusLabel}</span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7a7a7a', lineHeight: 1.5 }}>配車依頼が届くまでお待ちください</p>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#0a0a0a', borderTop: '1px solid #1f1f1f', padding: '10px 14px 28px', display: 'flex', justifyContent: 'space-around', zIndex: 40, boxSizing: 'border-box' }}>
        <DriverNavBtn onClick={() => {}} active label="ホーム">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 11 12 4l8 7m-14-1v8a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </DriverNavBtn>
        <DriverNavBtn onClick={() => setSettingsOpen(true)} label="設定">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </DriverNavBtn>
      </div>

      {/* Settings sheet */}
      {settingsOpen && (
        <div onClick={() => setSettingsOpen(false)} role="button" style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.55)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', animation: 'lm-fade .2s ease both' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#161616', borderRadius: '24px 24px 0 0', padding: '12px 20px 40px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#3a3a3a', margin: '0 auto 20px' }} />
            <p style={{ margin: '0 0 14px 2px', fontSize: 13, fontWeight: 700, color: '#7a7a7a', letterSpacing: '.04em' }}>設定</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 2px 18px', borderBottom: '1px solid #242424', marginBottom: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>{(driver?.name || '?')[0]}</div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{driver?.name || 'ドライバー'}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#7a7a7a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{driver?.car || '—'}{driver?.plate ? ' ・ ' + driver.plate : ''}</p>
              </div>
            </div>
            <button onClick={logout} style={{ width: '100%', height: 54, borderRadius: 14, background: '#1f1f1f', border: '1px solid #2c2c2c', color: '#ff5a5a', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>ログアウト</button>
          </div>
        </div>
      )}
    </div>
  )
}

function TripCard({ dispatch, onArrived, onBoard }: { dispatch: DispatchRow; onArrived: () => void; onBoard: () => void }) {
  const sortedGirls = [...dispatch.dispatch_girls].sort((a, b) => (a.girls?.dist || 0) - (b.girls?.dist || 0))
  const total = sortedGirls.length
  const areas = sortedGirls.map(dg => (dg.girls?.area || '').replace(/（.*）/, '')).filter(Boolean)
  const tripLabel = areas.length === 0 ? '便' : areas.length === 1 ? areas[0] + '方面' : areas.length === 2 ? areas[0] + '・' + areas[1] + '方面' : areas[0] + '・' + areas[1] + ' ほか方面'

  return (
    <div style={{ background: '#141414', border: '1px solid #262626', borderRadius: 22, overflow: 'hidden' }}>
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#9a9a9a', letterSpacing: '.04em' }}>{tripLabel} ・ {total}名</span>
          {dispatch.last_trip && <span style={{ fontSize: 11, fontWeight: 700, background: '#1f1f1f', color: '#9a9a9a', padding: '3px 10px', borderRadius: 99 }}>最後の便</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 14 }}>
          <span style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: '-.03em' }}>{dispatch.scheduled_time || '今すぐ'}</span>
          {dispatch.scheduled_time && <span style={{ fontSize: 14, fontWeight: 600, color: '#7a7a7a', paddingBottom: 8 }}>出発</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {sortedGirls.slice(0, 6).map(dg => (
            <div key={dg.girl_id} style={{ width: 30, height: 30, borderRadius: '50%', background: dg.girls?.color || '#7B61FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#fff', flexShrink: 0 }}>
              {(dg.girls?.name || '?')[0]}
            </div>
          ))}
        </div>
      </div>

      {/* Action area */}
      {!dispatch.arrived ? (
        <div style={{ borderTop: '1px solid #1f1f1f', padding: '14px 20px' }}>
          <button
            onClick={onArrived}
            style={{ width: '100%', height: 52, borderRadius: 14, background: '#06c167', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: font }}
          >
            店に到着しました
          </button>
          <p style={{ margin: '8px 0 0', fontSize: 11.5, color: '#6a6a6a', textAlign: 'center' }}>ボーイに乗車OKを知らせる</p>
        </div>
      ) : (
        <div style={{ borderTop: '1px solid #1f1f1f', padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F5A623', display: 'block', animation: 'lm-pulse 1.6s infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F5A623' }}>お店前で待機中</span>
          </div>
          <button
            onClick={onBoard}
            style={{ width: '100%', height: 52, borderRadius: 14, background: '#fff', color: '#0a0a0a', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: font }}
          >
            全員の乗車を確認
          </button>
        </div>
      )}
    </div>
  )
}

function StatusCard({ label, sub, active, color, onClick }: { label: string; sub: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ padding: '16px 14px', borderRadius: 16, background: active ? '#141414' : '#0f0f0f', border: `1px solid ${active ? color + '44' : '#262626'}`, cursor: active ? 'default' : 'pointer', fontFamily: font, textAlign: 'left' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'block', flexShrink: 0, animation: active ? 'lm-pulse 2s infinite' : 'none' }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: active ? '#fff' : '#5a5a5a' }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 11, color: active ? '#7a7a7a' : '#3a3a3a' }}>{sub}</p>
    </button>
  )
}

function DriverNavBtn({ onClick, active, label, children }: { onClick: () => void; active?: boolean; label: string; children: React.ReactNode }) {
  return (
    <div onClick={onClick} role="button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: active ? '#fff' : '#6e6e6e', flex: 1 }}>
      {children}
      <span style={{ fontSize: 10.5, fontWeight: 700 }}>{label}</span>
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
