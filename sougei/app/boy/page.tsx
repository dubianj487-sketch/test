'use client'

import { rem } from '@/lib/rem'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const font = "'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif"
const BG = '#f5f5f5'

type Screen = 'home' | 'new' | 'driver-select' | 'status' | 'admin' |
  'admin-girl-detail' | 'admin-girl-form' | 'admin-driver-detail' | 'admin-driver-form'

type GirlRow = { id: string; name: string; area: string | null; address: string | null; color: string | null; dist: number | null; note: string | null }
type DriverRow = { id: string; name: string; status: string; note: string | null; capacity: number; car: string | null; car_color: string | null; plate: string | null }
type DispatchGirl = { id: string; girl_id: string; girls: { name: string; area: string | null; address: string | null; color: string | null; dist: number | null } | null }
type DispatchRow = {
  id: string; driver_id: string | null; scheduled_time: string | null; urgency: string; status: string; date: string; created_at: string;
  last_trip: boolean; completed: number; arrived: boolean; boarded: boolean;
  drivers: { name: string; status: string } | null;
  dispatch_girls: DispatchGirl[]
}

const GIRL_COLORS = ['#F5A623', '#7B61FF', '#06C167', '#E84855', '#276EF1', '#00A8B5', '#FF7A45', '#FF6B9C', '#9B59B6', '#E74C3C']

function calcReturnTime(scheduledTime: string | null, girls: Array<{ dist: number | null }>): string {
  const totalDist = girls.reduce((s, g) => s + (g.dist || 0), 0)
  const estMin = Math.round(totalDist * 4 + 10)
  let h: number, m: number
  if (!scheduledTime) { const now = new Date(); h = now.getHours(); m = now.getMinutes() }
  else [h, m] = scheduledTime.split(':').map(Number)
  const tot = h * 60 + m + estMin
  return String(Math.floor(tot / 60) % 24).padStart(2, '0') + ':' + String(tot % 60).padStart(2, '0')
}

function makeTripLabel(girls: Array<{ area: string | null; dist: number | null }>): string {
  const sorted = [...girls].sort((a, b) => (a.dist || 0) - (b.dist || 0))
  const areas = sorted.map(g => (g.area || '').replace(/（.*）/, '')).filter(Boolean)
  if (areas.length === 0) return '送迎便'
  if (areas.length === 1) return areas[0] + '方面'
  if (areas.length === 2) return areas[0] + '・' + areas[1] + '方面'
  return areas[0] + '・' + areas[1] + ' ほか方面'
}

function getDispatchBadge(d: DispatchRow): { label: string; color: string; bg: string } {
  if (!d.driver_id) return { label: '未割当', color: '#9a9a9a', bg: '#f4f4f4' }
  if (d.status === '移動中') return { label: '送迎中', color: '#fff', bg: '#F5A623' }
  if (d.arrived) return { label: '乗車待機', color: '#fff', bg: '#F5A623' }
  return { label: '配車確認中', color: '#fff', bg: '#3478f6' }
}

function Avatar({ name, color, size = 36 }: { name: string; color: string | null; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color || '#7B61FF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.44, flexShrink: 0 }}>
      {name[0]}
    </div>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: 38, height: 38, borderRadius: 11, background: '#f0f0f0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="9" height="15" viewBox="0 0 9 15"><path d="M8 1 2 7.5 8 14" stroke="#0a0a0a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  )
}

export default function BoyPage() {
  const [girls, setGirls] = useState<GirlRow[]>([])
  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [dispatches, setDispatches] = useState<DispatchRow[]>([])
  const [rideRequestIds, setRideRequestIds] = useState<Set<string>>(new Set())
  const [screen, setScreen] = useState<Screen>('home')
  const [tripDraftIds, setTripDraftIds] = useState<string[]>([])
  const [draftDriverId, setDraftDriverId] = useState<string | null>(null)
  const [draftDepartNow, setDraftDepartNow] = useState(true)
  const [draftDepartHour, setDraftDepartHour] = useState(23)
  const [draftDepartMin, setDraftDepartMin] = useState(30)
  const [draftLastTrip, setDraftLastTrip] = useState(false)
  const [viewDispatchId, setViewDispatchId] = useState<string | null>(null)
  const [countdownActive, setCountdownActive] = useState(false)
  const [countdownRemaining, setCountdownRemaining] = useState(10)
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedGirlId, setSelectedGirlId] = useState<string | null>(null)
  const [selectedDrvId, setSelectedDrvId] = useState<string | null>(null)
  const [adminTab, setAdminTab] = useState<'girl' | 'driver'>('girl')
  const [showDelete, setShowDelete] = useState(false)
  // Girl form
  const [fGName, setFGName] = useState(''); const [fGArea, setFGArea] = useState(''); const [fGDist, setFGDist] = useState('')
  const [fGAddr, setFGAddr] = useState(''); const [fGColor, setFGColor] = useState(GIRL_COLORS[0])
  // Driver form
  const [fDName, setFDName] = useState(''); const [fDCar, setFDCar] = useState(''); const [fDPlate, setFDPlate] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadData = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    const [{ data: gData }, { data: dData }, { data: dpData }, { data: rrData }] = await Promise.all([
      supabase.from('girls').select('*').order('dist', { ascending: true, nullsFirst: false }),
      supabase.from('drivers').select('*').order('name'),
      supabase.from('dispatches')
        .select('id, driver_id, scheduled_time, urgency, status, date, created_at, last_trip, completed, arrived, boarded, drivers(name, status), dispatch_girls(id, girl_id, girls(name, area, address, color, dist))')
        .eq('date', today)
        .neq('status', '完了')
        .order('created_at'),
      supabase.from('ride_requests').select('girl_id').eq('date', today),
    ])
    setGirls((gData as GirlRow[]) || [])
    setDrivers((dData as DriverRow[]) || [])
    setDispatches((dpData as unknown as DispatchRow[]) || [])
    setRideRequestIds(new Set(((rrData as any[]) || []).map((r: any) => r.girl_id)))
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    const ch = supabase.channel('boy-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatches' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_girls' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_requests' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, loadData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [loadData])

  function startCountdown() {
    if (timerRef.current) clearInterval(timerRef.current)
    setCountdownActive(true)
    setCountdownRemaining(10)
    timerRef.current = setInterval(() => {
      setCountdownRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          timerRef.current = null
          setCountdownActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function stopCountdown() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setCountdownActive(false)
  }

  async function createDispatch() {
    if (!tripDraftIds.length || saving) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const scheduledTime = draftDepartNow ? null : `${String(draftDepartHour).padStart(2, '0')}:${String(draftDepartMin).padStart(2, '0')}`
    const sortedGirlIds = [...tripDraftIds].sort((a, b) => {
      const ga = girls.find(g => g.id === a); const gb = girls.find(g => g.id === b)
      return (ga?.dist || 0) - (gb?.dist || 0)
    })
    const tripLabel = makeTripLabel(sortedGirlIds.map(id => girls.find(g => g.id === id)!).filter(Boolean))
    const { data: dp } = await supabase.from('dispatches').insert({
      driver_id: draftDriverId || null,
      scheduled_time: scheduledTime,
      urgency: draftDepartNow ? '今すぐ' : '時間指定',
      destination: tripLabel,
      status: '待機',
      date: today,
      last_trip: draftLastTrip,
      completed: 0,
      arrived: false,
      boarded: false,
    }).select().single()
    if (!dp) { setSaving(false); return }
    await supabase.from('dispatch_girls').insert(sortedGirlIds.map(gId => ({ dispatch_id: dp.id, girl_id: gId })))
    if (draftDriverId) {
      await supabase.from('drivers').update({ status: '移動中' }).eq('id', draftDriverId)
    }
    setJustCreatedId(dp.id)
    setViewDispatchId(dp.id)
    setTripDraftIds([])
    setDraftDriverId(null)
    setDraftLastTrip(false)
    setDraftDepartNow(true)
    setSaving(false)
    await loadData()
    setScreen('status')
    startCountdown()
  }

  async function cancelDispatch() {
    if (!justCreatedId) return
    stopCountdown()
    const dp = dispatches.find(d => d.id === justCreatedId)
    if (dp?.driver_id) {
      await supabase.from('drivers').update({ status: '待機' }).eq('id', dp.driver_id)
    }
    await supabase.from('dispatch_girls').delete().eq('dispatch_id', justCreatedId)
    await supabase.from('dispatches').delete().eq('id', justCreatedId)
    setJustCreatedId(null)
    await loadData()
    setScreen('driver-select')
  }

  async function boardAll(dispatchId: string, driverId: string | null) {
    await supabase.from('dispatches').update({ boarded: true, status: '移動中' }).eq('id', dispatchId)
    if (driverId) await supabase.from('drivers').update({ status: '移動中' }).eq('id', driverId)
    await loadData()
  }

  async function deleteGirl(id: string) {
    await supabase.from('girls').delete().eq('id', id)
    setShowDelete(false)
    await loadData()
    setScreen('admin')
    setAdminTab('girl')
  }

  async function deleteDriver(id: string) {
    await supabase.from('drivers').delete().eq('id', id)
    setShowDelete(false)
    await loadData()
    setScreen('admin')
    setAdminTab('driver')
  }

  async function saveGirl() {
    if (!fGName.trim() || saving) return
    setSaving(true)
    const payload = { name: fGName.trim(), area: fGArea.trim() || null, dist: fGDist ? parseFloat(fGDist) : null, address: fGAddr.trim() || null, color: fGColor }
    if (selectedGirlId) await supabase.from('girls').update(payload).eq('id', selectedGirlId)
    else await supabase.from('girls').insert(payload)
    setSaving(false)
    await loadData()
    setScreen(selectedGirlId ? 'admin-girl-detail' : 'admin')
  }

  async function saveDriver() {
    if (!fDName.trim() || saving) return
    setSaving(true)
    const payload = { name: fDName.trim(), car: fDCar.trim() || null, plate: fDPlate.trim() || null, status: '待機', capacity: 5 }
    if (selectedDrvId) await supabase.from('drivers').update(payload).eq('id', selectedDrvId)
    else await supabase.from('drivers').insert(payload)
    setSaving(false)
    await loadData()
    setScreen('admin')
    setAdminTab('driver')
  }

  function adjustTime(delta: number) {
    setDraftDepartNow(false)
    let total = draftDepartHour * 60 + draftDepartMin + delta
    total = ((total % 1440) + 1440) % 1440
    setDraftDepartHour(Math.floor(total / 60))
    setDraftDepartMin(total % 60)
  }

  const dispatchedGirlIds = new Set(dispatches.flatMap(d => d.dispatch_girls.map(dg => dg.girl_id)))
  const pendingRequests = girls.filter(g => rideRequestIds.has(g.id) && !dispatchedGirlIds.has(g.id))
  const viewDispatch = dispatches.find(d => d.id === viewDispatchId) || null
  const viewGirls = viewDispatch
    ? [...viewDispatch.dispatch_girls]
        .filter(dg => dg.girls)
        .sort((a, b) => (a.girls!.dist || 0) - (b.girls!.dist || 0))
    : []
  const draftGirls = tripDraftIds.map(id => girls.find(g => g.id === id)!).filter(Boolean)
  const draftEstMin = draftGirls.reduce((s, g) => s + (g.dist || 0), 0) * 4 + 10 | 0
  const selectedGirl = girls.find(g => g.id === selectedGirlId) || null
  const selectedDrv = drivers.find(d => d.id === selectedDrvId) || null
  const isAdminScreen = screen.startsWith('admin')
  const isHomeGroup = !isAdminScreen

  // ── HOME ──
  function renderHome() {
    const today = new Date()
    const dateStr = `${today.getMonth() + 1}月${today.getDate()}日（${'日月火水木金土'[today.getDay()]}）`
    return (
      <div style={{ minHeight: '100dvh', background: BG, paddingBottom: 100 }}>
        <div style={{ background: '#fff', padding: '52px 20px 16px' }}>
          <p style={{ margin: '0 0 3px', fontSize: 12, fontWeight: 600, color: '#9a9a9a' }}>{dateStr}</p>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-.02em' }}>配車ダッシュボード</h1>
        </div>
        <div style={{ padding: '16px 16px 0' }}>
          {/* Pending ride requests */}
          {pendingRequests.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.06em' }}>乗車リクエスト ({pendingRequests.length}件)</p>
                <button onClick={() => setScreen('new')} style={{ fontSize: 12, fontWeight: 700, color: '#3478f6', background: 'none', border: 'none', cursor: 'pointer', fontFamily: font }}>便を作る →</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingRequests.map(g => (
                  <div key={g.id} style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar name={g.name} color={g.color} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{g.name}</p>
                      <p style={{ margin: '1px 0 0', fontSize: 12, color: '#9a9a9a' }}>{g.area || '—'}{g.dist ? ` ・ ${g.dist.toFixed(1)}km` : ''}</p>
                    </div>
                    <button
                      onClick={() => {
                        setTripDraftIds(prev => prev.includes(g.id) ? prev.filter(x => x !== g.id) : [...prev, g.id])
                      }}
                      style={{ height: 32, padding: '0 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: font, background: tripDraftIds.includes(g.id) ? '#0a0a0a' : '#f0f0f0', color: tripDraftIds.includes(g.id) ? '#fff' : '#6a6a6a' }}
                    >
                      {tripDraftIds.includes(g.id) ? '選択中' : '選ぶ'}
                    </button>
                  </div>
                ))}
              </div>
              {tripDraftIds.length > 0 && (
                <button
                  onClick={() => setScreen('driver-select')}
                  style={{ marginTop: 12, width: '100%', height: 52, borderRadius: 14, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: font }}
                >
                  ドライバーを選ぶ（{tripDraftIds.length}名）
                </button>
              )}
            </div>
          )}

          {/* Active dispatches */}
          {dispatches.length > 0 && (
            <div>
              <p style={{ margin: '0 2px 10px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.06em' }}>今日の便</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {dispatches.map(d => {
                  const badge = getDispatchBadge(d)
                  const dGirls = d.dispatch_girls.filter(dg => dg.girls).map(dg => dg.girls!)
                  const tripLabel = makeTripLabel(dGirls)
                  const returnTime = calcReturnTime(d.scheduled_time, dGirls)
                  const estMin = Math.round(dGirls.reduce((s, g) => s + (g.dist || 0), 0) * 4 + 10)
                  const driverName = d.drivers?.name || '未定'
                  return (
                    <div key={d.id} onClick={() => { setViewDispatchId(d.id); setScreen('status') }} role="button" style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 18, padding: '16px 16px 14px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color, padding: '2px 9px', borderRadius: 999 }}>{badge.label}</span>
                            {d.last_trip && <span style={{ fontSize: 10, fontWeight: 700, background: '#f0f0f0', color: '#6a6a6a', padding: '2px 8px', borderRadius: 999 }}>最後の便</span>}
                          </div>
                          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '-.01em' }}>{tripLabel}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>{d.scheduled_time || '今すぐ'}</p>
                        </div>
                      </div>
                      {d.arrived && !d.boarded ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#eafaf0', borderRadius: 10, padding: '8px 12px', marginBottom: 10 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#06c167', display: 'block', animation: 'lm-pulse 1.6s infinite' }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#0a7a3f' }}>{driverName}がお店前で待機中</span>
                        </div>
                      ) : !d.arrived && d.driver_id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#f4f4f4', borderRadius: 10, padding: '8px 12px', marginBottom: 10 }}>
                          <span style={{ fontSize: 12, color: '#6a6a6a', fontWeight: 600 }}>{driverName}がお店に向かっています</span>
                        </div>
                      ) : null}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#6a6a6a', flexShrink: 0 }}>{driverName[0]}</div>
                        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{driverName}</span>
                        <span style={{ fontSize: 12, color: '#9a9a9a' }}>約{estMin}分 ・ {returnTime}着</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {dispatches.length === 0 && pendingRequests.length === 0 && (
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.06)', borderRadius: 20, padding: '28px 20px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#3a3a3a' }}>今日の便はまだありません</p>
              <p style={{ margin: 0, fontSize: 13, color: '#9a9a9a', lineHeight: 1.6 }}>キャストから乗車リクエストが届くと<br />ここに表示されます</p>
            </div>
          )}
        </div>

        {/* FAB */}
        {pendingRequests.length > 0 && tripDraftIds.length === 0 && (
          <button
            onClick={() => setScreen('new')}
            style={{ position: 'fixed', bottom: 90, right: 20, width: 54, height: 54, borderRadius: '50%', background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,.3)', zIndex: 30 }}
          >
            +
          </button>
        )}
      </div>
    )
  }

  // ── NEW (ride request girl selection) ──
  function renderNew() {
    return (
      <div style={{ minHeight: '100dvh', background: BG, paddingBottom: 100 }}>
        <div style={{ background: '#fff', padding: '52px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackBtn onClick={() => setScreen('home')} />
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#9a9a9a', fontWeight: 600 }}>送迎便の作成</p>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>乗車リクエスト</h1>
          </div>
        </div>
        <div style={{ padding: '16px 16px 0' }}>
          {pendingRequests.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 18, padding: '24px 20px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#6a6a6a' }}>リクエストはありません</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingRequests.map(g => {
                const sel = tripDraftIds.includes(g.id)
                return (
                  <div
                    key={g.id}
                    onClick={() => setTripDraftIds(prev => prev.includes(g.id) ? prev.filter(x => x !== g.id) : [...prev, g.id])}
                    role="button"
                    style={{ background: '#fff', border: `2px solid ${sel ? '#0a0a0a' : 'rgba(0,0,0,.07)'}`, borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                  >
                    <Avatar name={g.name} color={g.color} size={42} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{g.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9a9a9a' }}>{g.area || '—'}{g.dist ? ` ・ 店から${g.dist.toFixed(1)}km` : ''}</p>
                    </div>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${sel ? '#0a0a0a' : '#dedede'}`, background: sel ? '#0a0a0a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {sel && <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="m5 12 4 4 10-10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        {tripDraftIds.length > 0 && (
          <div style={{ position: 'fixed', bottom: 90, left: 0, right: 0, padding: '0 16px', zIndex: 30 }}>
            <button onClick={() => setScreen('driver-select')} style={{ width: '100%', height: 56, borderRadius: 16, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: font, boxShadow: '0 4px 20px rgba(0,0,0,.25)' }}>
              ドライバーを選ぶ（{tripDraftIds.length}名）
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── DRIVER SELECT ──
  function renderDriverSelect() {
    const draftLabel = makeTripLabel(draftGirls)
    const scheduledTimeStr = `${String(draftDepartHour).padStart(2, '0')}:${String(draftDepartMin).padStart(2, '0')}`
    return (
      <div style={{ minHeight: '100dvh', background: BG, paddingBottom: 120 }}>
        <div style={{ background: '#fff', padding: '52px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackBtn onClick={() => setScreen('new')} />
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#9a9a9a', fontWeight: 600 }}>送迎便の作成</p>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>ドライバーと出発時刻</h1>
          </div>
        </div>
        <div style={{ padding: '16px 16px 0' }}>
          {/* Dark summary card */}
          <div style={{ background: '#0a0a0a', borderRadius: 22, padding: '18px 20px', color: '#fff', marginBottom: 16 }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#7a7a7a' }}>{draftLabel} ・ {draftGirls.length}名</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 14 }}>
              <span style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: '-.03em' }}>
                {draftDepartNow ? '今すぐ' : scheduledTimeStr}
              </span>
              {!draftDepartNow && <span style={{ fontSize: 14, fontWeight: 600, color: '#7a7a7a', paddingBottom: 8 }}>出発</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {draftGirls.map(g => <Avatar key={g.id} name={g.name} color={g.color} size={32} />)}
            </div>
            {/* Time chips */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <button onClick={() => setDraftDepartNow(true)} style={{ flex: 1, height: 36, borderRadius: 10, background: draftDepartNow ? '#fff' : '#1a1a1a', color: draftDepartNow ? '#0a0a0a' : '#6a6a6a', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>今すぐ</button>
              <button onClick={() => setDraftDepartNow(false)} style={{ flex: 1, height: 36, borderRadius: 10, background: !draftDepartNow ? '#fff' : '#1a1a1a', color: !draftDepartNow ? '#0a0a0a' : '#6a6a6a', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>時間指定</button>
            </div>
            {!draftDepartNow && (
              <div style={{ display: 'flex', gap: 6 }}>
                {([-15, -5, 5, 15] as const).map(delta => (
                  <button key={delta} onClick={() => adjustTime(delta)} style={{ flex: 1, height: 34, borderRadius: 10, background: '#1a1a1a', border: 'none', color: '#cfcfcf', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>
                    {delta > 0 ? '+' : ''}{delta}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Last trip toggle */}
          <div style={{ background: '#fff', border: draftLastTrip ? '2px solid #0a0a0a' : '1px solid rgba(0,0,0,.07)', borderRadius: 18, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setDraftLastTrip(v => !v)} role="button">
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700 }}>最後の便にする</p>
              <p style={{ margin: 0, fontSize: 12, color: '#9a9a9a' }}>完了後にドライバーの状態が「終了」になります</p>
            </div>
            <div style={{ width: 44, height: 26, borderRadius: 13, background: draftLastTrip ? '#0a0a0a' : '#e0e0e0', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
              <div style={{ position: 'absolute', top: 3, left: draftLastTrip ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
            </div>
          </div>

          {/* Est min info */}
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.06)', borderRadius: 14, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#9a9a9a" strokeWidth="1.7"/><path d="M12 7v5l3 2" stroke="#9a9a9a" strokeWidth="1.7" strokeLinecap="round"/></svg>
            <span style={{ fontSize: 13, color: '#6a6a6a' }}>所要時間の目安 <strong style={{ color: '#0a0a0a' }}>約{draftEstMin}分</strong></span>
          </div>

          {/* Drivers */}
          <p style={{ margin: '0 2px 10px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.06em' }}>ドライバー</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {drivers.map(drv => {
              const hasActiveDispatch = dispatches.some(d => d.driver_id === drv.id)
              let statusLabel = '待機中', statusColor = '#06c167', available = true
              if (drv.status === 'お店前') { statusLabel = 'お店前'; statusColor = '#276EF1' }
              else if (drv.status === '終了') { statusLabel = '終了'; statusColor = '#6a6a6a'; available = false }
              if (hasActiveDispatch) {
                available = false
                const activeD = dispatches.find(d => d.driver_id === drv.id)
                if (activeD?.arrived && !activeD?.boarded) { statusLabel = '乗車待機'; statusColor = '#F5A623' }
                else { statusLabel = '移動中'; statusColor = '#9a9a9a' }
              }
              const isSelected = draftDriverId === drv.id
              return (
                <div
                  key={drv.id}
                  onClick={() => available && setDraftDriverId(prev => prev === drv.id ? null : drv.id)}
                  role="button"
                  style={{ background: '#fff', border: `2px solid ${isSelected ? '#0a0a0a' : 'rgba(0,0,0,.07)'}`, borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: available ? 'pointer' : 'default', opacity: available ? 1 : 0.55 }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{drv.name[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{drv.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'block' }} />
                      <span style={{ fontSize: 12, color: '#7a7a7a', fontWeight: 600 }}>{statusLabel}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="m5 12 4 4 10-10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Confirm button */}
        <div style={{ position: 'fixed', bottom: 90, left: 0, right: 0, padding: '0 16px', zIndex: 30 }}>
          <button
            onClick={createDispatch}
            disabled={saving}
            style={{ width: '100%', height: 56, borderRadius: 16, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: saving ? 'default' : 'pointer', fontFamily: font, opacity: saving ? 0.7 : 1, boxShadow: '0 4px 20px rgba(0,0,0,.25)' }}
          >
            {saving ? '配車中...' : `配車を確定する${draftDriverId ? '' : '（ドライバー未定）'}`}
          </button>
        </div>
      </div>
    )
  }

  // ── STATUS ──
  function renderStatus() {
    if (!viewDispatch) return <div style={{ minHeight: '100dvh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#9a9a9a' }}>便が見つかりません</p></div>
    const isJustCreated = justCreatedId === viewDispatch.id
    const showCountdown = isJustCreated && countdownActive
    const showCreatedBanner = isJustCreated && !countdownActive && !viewDispatch.arrived
    const showArrived = viewDispatch.arrived && !viewDispatch.boarded && !showCountdown
    const showWaiting = viewDispatch.driver_id && !viewDispatch.arrived && !showCountdown && !showCreatedBanner
    const driverName = viewDispatch.drivers?.name || 'ドライバー'
    const tripLabel = makeTripLabel(viewGirls.map(dg => dg.girls!))
    const returnTime = calcReturnTime(viewDispatch.scheduled_time, viewGirls.map(dg => dg.girls!))
    const RADIUS = 38; const CIRC = 2 * Math.PI * RADIUS
    const offset = CIRC * (1 - countdownRemaining / 10)

    return (
      <div style={{ minHeight: '100dvh', background: BG, paddingBottom: 100 }}>
        <div style={{ background: '#fff', padding: '52px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackBtn onClick={() => { stopCountdown(); setJustCreatedId(null); setScreen('home') }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#9a9a9a', fontWeight: 600 }}>{tripLabel}</p>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>{viewDispatch.scheduled_time || '今すぐ'} 出発</h1>
          </div>
          {viewDispatch.last_trip && <span style={{ fontSize: 11, fontWeight: 700, background: '#f0f0f0', color: '#6a6a6a', padding: '4px 10px', borderRadius: 999, flexShrink: 0 }}>最後の便</span>}
        </div>
        <div style={{ padding: '16px 16px 0' }}>
          {/* Countdown */}
          {showCountdown && (
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 22, padding: '24px 20px', marginBottom: 16, textAlign: 'center' }}>
              <p style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#3a3a3a' }}>配車を確定しますか？</p>
              <svg width="90" height="90" viewBox="0 0 90 90" style={{ marginBottom: 14 }}>
                <circle cx="45" cy="45" r={RADIUS} stroke="#f0f0f0" strokeWidth="4" fill="none" />
                <circle cx="45" cy="45" r={RADIUS} stroke="#0a0a0a" strokeWidth="4" fill="none"
                  strokeDasharray={CIRC} strokeDashoffset={offset}
                  strokeLinecap="round" transform="rotate(-90 45 45)"
                  style={{ transition: 'stroke-dashoffset 1s linear' }} />
                <text x="45" y="53" textAnchor="middle" fontSize="26" fontWeight="800" fill="#0a0a0a" fontFamily={font}>{countdownRemaining}</text>
              </svg>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={cancelDispatch} style={{ flex: 1, height: 48, borderRadius: 13, background: '#f4f4f4', color: '#0a0a0a', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>キャンセル</button>
                <button onClick={() => { stopCountdown(); setJustCreatedId(null) }} style={{ flex: 1, height: 48, borderRadius: 13, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>すぐに確定</button>
              </div>
            </div>
          )}

          {/* Created banner */}
          {showCreatedBanner && (
            <div style={{ background: '#f0f4ff', border: '1.5px solid #c3d4fb', borderRadius: 16, padding: '13px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3478f6', display: 'block', flexShrink: 0, animation: 'lm-pulse 1.6s infinite' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1a50c8' }}>ドライバーへのリクエスト送信済み</span>
            </div>
          )}

          {/* Waiting banner */}
          {showWaiting && (
            <div style={{ background: '#f4f4f4', borderRadius: 14, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ display: 'flex', gap: 3 }}>
                {[0, 1, 2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#9a9a9a', display: 'block', animation: `lm-pulse 1.4s ${i * 0.2}s infinite` }} />)}
              </span>
              <span style={{ fontSize: 13, color: '#6a6a6a', fontWeight: 600 }}>{driverName}がお店に向かっています</span>
            </div>
          )}

          {/* Arrived banner + board button */}
          {showArrived && (
            <div style={{ background: '#eafaf0', border: '1.5px solid #bdeccf', borderRadius: 16, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#06c167', display: 'block', animation: 'lm-pulse 1.6s infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0d8a4a' }}>{driverName}が到着済み</span>
              </div>
              <button
                onClick={() => boardAll(viewDispatch.id, viewDispatch.driver_id)}
                style={{ width: '100%', height: 48, borderRadius: 13, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font }}
              >
                全員の乗車を確認
              </button>
            </div>
          )}

          {/* Route timeline */}
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 20, padding: '16px 16px' }}>
            <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#9a9a9a', letterSpacing: '.06em' }}>送迎ルート</p>

            {/* Store node */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 4 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 36, flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0f0f0', border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 13l1.6-4.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.5L19 13m-14 0h14v4a1 1 0 0 1-1 1h-1.2a1.8 1.8 0 1 1-3.6 0H9.8a1.8 1.8 0 1 1-3.6 0H5a1 1 0 0 1-1-1v-4h1Z" stroke="#0a0a0a" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                </div>
                <div style={{ width: 2, flex: 1, background: '#ededed', minHeight: 18, marginTop: 4 }} />
              </div>
              <div style={{ paddingTop: 7, paddingBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>CLUB VENUS・KING</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9a9a9a' }}>{viewGirls.length}名が乗車</p>
              </div>
            </div>

            {/* Girl nodes */}
            {viewGirls.map((dg, i) => {
              const g = dg.girls!
              const isDone = i < viewDispatch.completed
              const isCurrent = i === viewDispatch.completed && viewDispatch.boarded
              const isLast = i === viewGirls.length - 1
              return (
                <div key={dg.girl_id} style={{ display: 'flex', gap: 14, marginBottom: 4 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 36, flexShrink: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: isDone ? '#f0f0f0' : (g.color || '#7B61FF'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: isDone ? '#9a9a9a' : '#fff', border: isCurrent ? '2.5px solid #F5A623' : 'none', flexShrink: 0 }}>
                      {isDone ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="m5 12 4 4 10-10" stroke="#9a9a9a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg> : g.name[0]}
                    </div>
                    {!isLast && <div style={{ width: 2, flex: 1, background: '#ededed', minHeight: 18, marginTop: 4 }} />}
                  </div>
                  <div style={{ flex: 1, paddingTop: 6, paddingBottom: 14, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: isDone ? '#9a9a9a' : '#0a0a0a' }}>{g.name}</p>
                        <p style={{ margin: '1px 0 0', fontSize: 12, color: '#9a9a9a' }}>{g.area || ''}{g.dist ? ` ・ ${g.dist.toFixed(1)}km` : ''}</p>
                        {g.address && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7a7a7a', lineHeight: 1.5 }}>{g.address}</p>}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#bdbdbd', flexShrink: 0 }}>降 {i + 1}</span>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Return node */}
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f8f8f8', border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l1.6-4.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.5L19 13m-14 0h14v4a1 1 0 0 1-1 1h-1.2a1.8 1.8 0 1 1-3.6 0H9.8a1.8 1.8 0 1 1-3.6 0H5a1 1 0 0 1-1-1v-4h1Z" stroke="#c0c0c0" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                </div>
              </div>
              <div style={{ paddingTop: 4 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#9a9a9a', fontWeight: 600 }}>帰店 予定 {returnTime}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── ADMIN ──
  function renderAdmin() {
    return (
      <div style={{ minHeight: '100dvh', background: BG, paddingBottom: 100 }}>
        <div style={{ background: '#fff', padding: '52px 20px 16px' }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-.02em' }}>管理</h1>
        </div>
        {/* Tab bar */}
        <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #efefef', padding: '0 16px' }}>
          {(['キャスト', 'ドライバー'] as const).map((tab, i) => {
            const key = i === 0 ? 'girl' : 'driver'
            const active = adminTab === key
            return (
              <button key={tab} onClick={() => setAdminTab(key as 'girl' | 'driver')} style={{ flex: 1, height: 44, background: 'none', border: 'none', borderBottom: active ? '2.5px solid #0a0a0a' : '2.5px solid transparent', fontSize: 14, fontWeight: active ? 700 : 500, color: active ? '#0a0a0a' : '#9a9a9a', cursor: 'pointer', fontFamily: font }}>
                {tab}
              </button>
            )
          })}
        </div>
        <div style={{ padding: '16px 16px 0' }}>
          {adminTab === 'girl' ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 18, overflow: 'hidden', marginBottom: 12 }}>
                {girls.map((g, i) => (
                  <div key={g.id} onClick={() => { setSelectedGirlId(g.id); setScreen('admin-girl-detail') }} role="button" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer', borderBottom: i < girls.length - 1 ? '1px solid #f4f4f4' : 'none' }}>
                    <Avatar name={g.name} color={g.color} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{g.name}</p>
                      <p style={{ margin: '1px 0 0', fontSize: 12, color: '#9a9a9a' }}>{g.area || '—'}{g.dist ? ` ・ ${g.dist.toFixed(1)}km` : ''}</p>
                    </div>
                    <svg width="7" height="12" viewBox="0 0 7 12"><path d="M1 1l5 5-5 5" stroke="#d0d0d0" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                ))}
              </div>
              <button onClick={() => { setSelectedGirlId(null); setFGName(''); setFGArea(''); setFGDist(''); setFGAddr(''); setFGColor(GIRL_COLORS[0]); setScreen('admin-girl-form') }} style={{ width: '100%', height: 48, borderRadius: 14, background: '#fff', border: '1.5px dashed #d0d0d0', color: '#6a6a6a', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>
                + キャストを追加
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 18, overflow: 'hidden', marginBottom: 12 }}>
                {drivers.map((drv, i) => {
                  const statusColor = drv.status === '待機' ? '#06c167' : drv.status === 'お店前' ? '#276EF1' : drv.status === '移動中' ? '#F5A623' : '#9a9a9a'
                  const statusLabel = drv.status === '待機' ? '待機中' : drv.status
                  return (
                    <div key={drv.id} onClick={() => { setSelectedDrvId(drv.id); setScreen('admin-driver-detail') }} role="button" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer', borderBottom: i < drivers.length - 1 ? '1px solid #f4f4f4' : 'none' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{drv.name[0]}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{drv.name}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'block' }} />
                          <span style={{ fontSize: 12, color: '#9a9a9a', fontWeight: 600 }}>{statusLabel}</span>
                          {drv.car && <span style={{ fontSize: 12, color: '#bdbdbd' }}>・ {drv.car}</span>}
                        </div>
                      </div>
                      <svg width="7" height="12" viewBox="0 0 7 12"><path d="M1 1l5 5-5 5" stroke="#d0d0d0" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  )
                })}
              </div>
              <button onClick={() => { setSelectedDrvId(null); setFDName(''); setFDCar(''); setFDPlate(''); setScreen('admin-driver-form') }} style={{ width: '100%', height: 48, borderRadius: 14, background: '#fff', border: '1.5px dashed #d0d0d0', color: '#6a6a6a', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>
                + ドライバーを追加
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── ADMIN GIRL DETAIL ──
  function renderAdminGirlDetail() {
    if (!selectedGirl) return null
    const onTrip = dispatchedGirlIds.has(selectedGirl.id)
    return (
      <div style={{ minHeight: '100dvh', background: BG, paddingBottom: 100 }}>
        <div style={{ background: '#fff', padding: '52px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackBtn onClick={() => setScreen('admin')} />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{selectedGirl.name}</h1>
        </div>
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 20, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ padding: '18px 18px 16px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid #f4f4f4' }}>
              <Avatar name={selectedGirl.name} color={selectedGirl.color} size={52} />
              <div>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{selectedGirl.name}</p>
                {onTrip && <span style={{ fontSize: 11, fontWeight: 700, background: '#F5A62320', color: '#F5A623', padding: '3px 10px', borderRadius: 999 }}>送迎中</span>}
              </div>
            </div>
            {[
              { label: 'エリア', val: selectedGirl.area },
              { label: '距離', val: selectedGirl.dist ? `${selectedGirl.dist.toFixed(1)} km` : null },
              { label: '住所', val: selectedGirl.address },
              { label: 'メモ', val: selectedGirl.note },
            ].map(row => row.val ? (
              <div key={row.label} style={{ padding: '12px 18px', borderBottom: '1px solid #f4f4f4' }}>
                <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: '#9a9a9a', letterSpacing: '.06em' }}>{row.label}</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{row.val}</p>
              </div>
            ) : null)}
          </div>
          <button onClick={() => { setFGName(selectedGirl.name); setFGArea(selectedGirl.area || ''); setFGDist(selectedGirl.dist?.toString() || ''); setFGAddr(selectedGirl.address || ''); setFGColor(selectedGirl.color || GIRL_COLORS[0]); setScreen('admin-girl-form') }} style={{ width: '100%', height: 50, borderRadius: 14, background: '#fff', border: '1.5px solid #e0e0e0', color: '#0a0a0a', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: font, marginBottom: 10 }}>編集する</button>
          <button onClick={() => setShowDelete(true)} style={{ width: '100%', height: 50, borderRadius: 14, background: '#fff', border: '1.5px solid #ffe0e0', color: '#ff4444', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>削除する</button>
        </div>
        {showDelete && <DeleteSheet name={selectedGirl.name} onConfirm={() => deleteGirl(selectedGirl.id)} onCancel={() => setShowDelete(false)} />}
      </div>
    )
  }

  // ── ADMIN GIRL FORM ──
  function renderAdminGirlForm() {
    const isEdit = !!selectedGirlId
    return (
      <div style={{ minHeight: '100dvh', background: BG, paddingBottom: 120 }}>
        <div style={{ background: '#fff', padding: '52px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackBtn onClick={() => setScreen(isEdit ? 'admin-girl-detail' : 'admin')} />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{isEdit ? 'キャスト編集' : 'キャスト追加'}</h1>
        </div>
        <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="名前 *"><input value={fGName} onChange={e => setFGName(e.target.value)} placeholder="例：みく" style={inputStyle} /></Field>
          <Field label="エリア"><input value={fGArea} onChange={e => setFGArea(e.target.value)} placeholder="例：万代（中央区）" style={inputStyle} /></Field>
          <Field label="距離（km）"><input value={fGDist} onChange={e => setFGDist(e.target.value)} type="number" step="0.1" placeholder="例：2.5" style={inputStyle} /></Field>
          <Field label="住所"><input value={fGAddr} onChange={e => setFGAddr(e.target.value)} placeholder="例：新潟市中央区万代1-6-3 万代マンション 402" style={inputStyle} /></Field>
          <Field label="カラー">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {GIRL_COLORS.map(c => (
                <div key={c} onClick={() => setFGColor(c)} role="button" style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: fGColor === c ? '3px solid #0a0a0a' : '3px solid transparent', cursor: 'pointer', boxSizing: 'border-box' }} />
              ))}
            </div>
          </Field>
        </div>
        <div style={{ position: 'fixed', bottom: 90, left: 0, right: 0, padding: '0 16px', zIndex: 30 }}>
          <button onClick={saveGirl} disabled={!fGName.trim() || saving} style={{ width: '100%', height: 56, borderRadius: 16, background: fGName.trim() ? '#0a0a0a' : '#f0f0f0', color: fGName.trim() ? '#fff' : '#9a9a9a', border: 'none', fontSize: 16, fontWeight: 700, cursor: fGName.trim() && !saving ? 'pointer' : 'default', fontFamily: font }}>
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    )
  }

  // ── ADMIN DRIVER DETAIL ──
  function renderAdminDriverDetail() {
    if (!selectedDrv) return null
    const activeDispatch = dispatches.find(d => d.driver_id === selectedDrv.id)
    const statusLabel = selectedDrv.status === '待機' ? '待機中' : selectedDrv.status
    const statusColor = selectedDrv.status === '待機' ? '#06c167' : selectedDrv.status === 'お店前' ? '#276EF1' : selectedDrv.status === '移動中' ? '#F5A623' : '#9a9a9a'
    return (
      <div style={{ minHeight: '100dvh', background: BG, paddingBottom: 100 }}>
        <div style={{ background: '#fff', padding: '52px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackBtn onClick={() => setScreen('admin')} />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{selectedDrv.name}</h1>
        </div>
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 20, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ padding: '18px 18px 16px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid #f4f4f4' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22 }}>{selectedDrv.name[0]}</div>
              <div>
                <p style={{ margin: '0 0 3px', fontSize: 20, fontWeight: 800 }}>{selectedDrv.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, display: 'block' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: statusColor }}>{statusLabel}</span>
                </div>
              </div>
            </div>
            {[
              { label: '車種', val: selectedDrv.car },
              { label: 'ナンバー', val: selectedDrv.plate },
              { label: 'メモ', val: selectedDrv.note },
              { label: '担当便', val: activeDispatch ? `便 #${activeDispatch.id.slice(0, 6)}` : null },
            ].map(row => row.val ? (
              <div key={row.label} style={{ padding: '12px 18px', borderBottom: '1px solid #f4f4f4' }}>
                <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: '#9a9a9a', letterSpacing: '.06em' }}>{row.label}</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{row.val}</p>
              </div>
            ) : null)}
          </div>
          <button onClick={() => { setFDName(selectedDrv.name); setFDCar(selectedDrv.car || ''); setFDPlate(selectedDrv.plate || ''); setScreen('admin-driver-form') }} style={{ width: '100%', height: 50, borderRadius: 14, background: '#fff', border: '1.5px solid #e0e0e0', color: '#0a0a0a', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: font, marginBottom: 10 }}>編集する</button>
          <button onClick={() => setShowDelete(true)} style={{ width: '100%', height: 50, borderRadius: 14, background: '#fff', border: '1.5px solid #ffe0e0', color: '#ff4444', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>削除する</button>
        </div>
        {showDelete && <DeleteSheet name={selectedDrv.name} onConfirm={() => deleteDriver(selectedDrv.id)} onCancel={() => setShowDelete(false)} />}
      </div>
    )
  }

  // ── ADMIN DRIVER FORM ──
  function renderAdminDriverForm() {
    const isEdit = !!selectedDrvId
    return (
      <div style={{ minHeight: '100dvh', background: BG, paddingBottom: 120 }}>
        <div style={{ background: '#fff', padding: '52px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackBtn onClick={() => setScreen(isEdit ? 'admin-driver-detail' : 'admin')} />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{isEdit ? 'ドライバー編集' : 'ドライバー追加'}</h1>
        </div>
        <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="名前 *"><input value={fDName} onChange={e => setFDName(e.target.value)} placeholder="例：田中 誠" style={inputStyle} /></Field>
          <Field label="車種"><input value={fDCar} onChange={e => setFDCar(e.target.value)} placeholder="例：アルファード（白）" style={inputStyle} /></Field>
          <Field label="ナンバー"><input value={fDPlate} onChange={e => setFDPlate(e.target.value)} placeholder="例：新潟 300 あ 12-34" style={inputStyle} /></Field>
        </div>
        <div style={{ position: 'fixed', bottom: 90, left: 0, right: 0, padding: '0 16px', zIndex: 30 }}>
          <button onClick={saveDriver} disabled={!fDName.trim() || saving} style={{ width: '100%', height: 56, borderRadius: 16, background: fDName.trim() ? '#0a0a0a' : '#f0f0f0', color: fDName.trim() ? '#fff' : '#9a9a9a', border: 'none', fontSize: 16, fontWeight: 700, cursor: fDName.trim() && !saving ? 'pointer' : 'default', fontFamily: font }}>
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font }}>
        <div style={{ color: '#9a9a9a', fontSize: 14 }}>読み込み中...</div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: font, maxWidth: 430, margin: '0 auto', position: 'relative' }}>
      {screen === 'home' && renderHome()}
      {screen === 'new' && renderNew()}
      {screen === 'driver-select' && renderDriverSelect()}
      {screen === 'status' && renderStatus()}
      {screen === 'admin' && renderAdmin()}
      {screen === 'admin-girl-detail' && renderAdminGirlDetail()}
      {screen === 'admin-girl-form' && renderAdminGirlForm()}
      {screen === 'admin-driver-detail' && renderAdminDriverDetail()}
      {screen === 'admin-driver-form' && renderAdminDriverForm()}

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#fff', borderTop: '1px solid #efefef', padding: '10px 14px 28px', display: 'flex', justifyContent: 'space-around', zIndex: 40, boxSizing: 'border-box' }}>
        <BoyNavBtn onClick={() => setScreen('home')} active={isHomeGroup} label="配車">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l1.6-4.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.5L19 13m-14 0h14v4a1 1 0 0 1-1 1h-1.2a1.8 1.8 0 1 1-3.6 0H9.8a1.8 1.8 0 1 1-3.6 0H5a1 1 0 0 1-1-1v-4h1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        </BoyNavBtn>
        <BoyNavBtn onClick={() => setScreen('admin')} active={isAdminScreen} label="管理">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" /><rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" /><rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" /><rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" /></svg>
        </BoyNavBtn>
      </div>
    </div>
  )
}

function BoyNavBtn({ onClick, active, label, children }: { onClick: () => void; active: boolean; label: string; children: React.ReactNode }) {
  return (
    <div onClick={onClick} role="button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: active ? '#0a0a0a' : '#b5b5b5', flex: 1 }}>
      {children}
      <span style={{ fontSize: 10.5, fontWeight: 700 }}>{label}</span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ margin: '0 0 7px 2px', fontSize: 11, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.08em' }}>{label}</p>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  height: 52, width: '100%', borderRadius: 14, background: '#fff', border: '1.5px solid #e8e8e8',
  color: '#0a0a0a', padding: '0 16px', fontSize: 16, fontFamily: font, outline: 'none', boxSizing: 'border-box',
}

function DeleteSheet({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.5)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '22px 20px 48px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e0e0e0', margin: '0 auto 24px' }} />
        <p style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 800, lineHeight: 1.3 }}>「{name}」を<br />削除しますか？</p>
        <p style={{ margin: '0 0 24px', fontSize: 13.5, color: '#8a8a8a', lineHeight: 1.65 }}>削除すると元に戻せません。</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onConfirm} style={{ width: '100%', height: 56, borderRadius: 15, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>削除する</button>
          <button onClick={onCancel} style={{ width: '100%', height: 52, borderRadius: 15, background: '#f4f4f4', color: '#0a0a0a', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>キャンセル</button>
        </div>
      </div>
    </div>
  )
}
