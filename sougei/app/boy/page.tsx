'use client'

import { rem } from '@/lib/rem'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const font = "'Hanken Grotesk', 'Noto Sans JP', sans-serif"
const PALETTE = ['#F5A623', '#7B61FF', '#06C167', '#E84855', '#276EF1', '#00A8B5', '#FF7A45', '#FF6B9C', '#9B59B6', '#2ECC71']
function strColor(id: string) { return PALETTE[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length] }

type Screen = 'home' | 'new' | 'edit' | 'driver-select' | 'status' | 'admin' | 'girl-detail' | 'driver-detail' | 'girl-form' | 'driver-form'
type GirlRow = { id: string; name: string; area: string | null; address: string | null; color: string | null; dist: number | null; note: string | null }
type DriverRow = { id: string; name: string; status: string; note: string | null; capacity: number; car: string | null; car_color: string | null; plate: string | null }
type DispatchGirl = { id: string; girl_id: string }
type DispatchRow = { id: string; driver_id: string | null; urgency: string; scheduled_time: string | null; status: string; date: string; created_at: string; dispatch_girls: DispatchGirl[] }

const DRV_STATUS_CONFIG: Record<string, { color: string; available: boolean }> = {
  '待機': { color: '#1a9e50', available: true },
  'お店前': { color: '#8b5cf6', available: true },
  '移動中': { color: '#c2750a', available: false },
  '終了': { color: '#aeaeb2', available: false },
}

function DeleteOverlay({ name, color, initial, onDelete, onCancel }: { name: string; color: string; initial: string; onDelete: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.6)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ background: '#fff', borderRadius: '26px 26px 0 0', padding: '22px 22px 48px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e0e0e0', margin: '0 auto 24px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(22), flexShrink: 0 }}>{initial}</div>
          <p style={{ margin: 0, fontSize: rem(22), fontWeight: 800, lineHeight: 1.2 }}>{name}を<br />削除しますか？</p>
        </div>
        <p style={{ margin: '0 0 28px', fontSize: rem(14), color: '#8a8a8a', lineHeight: 1.65 }}>削除すると元に戻せません。<br />過去の便の記録には影響しません。</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onDelete} style={{ width: '100%', height: 56, borderRadius: 15, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: rem(16), fontWeight: 700, cursor: 'pointer', fontFamily: font }}>削除する</button>
          <button onClick={onCancel} style={{ width: '100%', height: 52, borderRadius: 15, background: '#f4f4f4', color: '#0a0a0a', border: 'none', fontSize: rem(15), fontWeight: 700, cursor: 'pointer', fontFamily: font }}>キャンセル</button>
        </div>
      </div>
    </div>
  )
}

const GIRL_COLORS = ['#F5A623','#7B61FF','#06C167','#E84855','#276EF1','#00A8B5','#FF7A45','#FF6B9C','#9B59B6','#E74C3C','#2ECC71','#F39C12']
const CAR_COLOR_MAP: Record<string, string> = {
  '白': '#f0f0f0', 'ホワイト': '#f0f0f0', '黒': '#1a1a1a', 'ブラック': '#1a1a1a',
  'シルバー': '#c8c8c8', 'グレー': '#808080', 'ネイビー': '#1e3a5f',
  '赤': '#e74c3c', '青': '#276EF1', 'ブルー': '#276EF1', 'ゴールド': '#F5A623',
}

const BackBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} style={{ width: 38, height: 38, borderRadius: 11, background: '#f4f4f4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <svg width="9" height="15" viewBox="0 0 9 15"><path d="M8 1 2 7.5 8 14" stroke="#0a0a0a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </button>
)

const InfoRow = ({ label, last, children }: { label: string; last?: boolean; children: React.ReactNode }) => (
  <div style={{ padding: '14px 0', borderBottom: last ? 'none' : '1px solid #f0f0f0' }}>
    <p style={{ margin: 0, fontSize: rem(11), fontWeight: 700, color: '#9a9a9a', letterSpacing: '.06em', textTransform: 'uppercase' as const }}>{label}</p>
    <div style={{ marginTop: 4 }}>{children}</div>
  </div>
)

const fieldInput: React.CSSProperties = { height: 54, width: '100%', borderRadius: 14, background: '#fafafa', border: '1.5px solid #e8e8e8', color: '#0a0a0a', padding: '0 16px', fontSize: rem(18), fontWeight: 600, fontFamily: font, outline: 'none', boxSizing: 'border-box' }
const fieldLabel: React.CSSProperties = { margin: '0 0 8px 2px', fontSize: rem(11), fontWeight: 700, color: '#8a8a8a', letterSpacing: '.08em', textTransform: 'uppercase' as const, display: 'block' }

export default function BoyPage() {
  const router = useRouter()
  const [girls, setGirls] = useState<GirlRow[]>([])
  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [dispatches, setDispatches] = useState<DispatchRow[]>([])
  const [screen, setScreen] = useState<Screen>('home')
  const [tripDraftIds, setTripDraftIds] = useState<string[]>([])
  const [draftDriverKey, setDraftDriverKey] = useState<string | null>(null)
  const [draftDepartNow, setDraftDepartNow] = useState(true)
  const [draftDepartHour, setDraftDepartHour] = useState(1)
  const [draftDepartMin, setDraftDepartMin] = useState(0)
  const [viewDispatchId, setViewDispatchId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [formGirlId, setFormGirlId] = useState<string | null>(null)
  const [fGName, setFGName] = useState('')
  const [fGArea, setFGArea] = useState('')
  const [fGDist, setFGDist] = useState('')
  const [fGAddr, setFGAddr] = useState('')
  const [fGColor, setFGColor] = useState(GIRL_COLORS[0])
  const [formDrvId, setFormDrvId] = useState<string | null>(null)
  const [fDName, setFDName] = useState('')
  const [fDCar, setFDCar] = useState('')
  const [fDCarColor, setFDCarColor] = useState('')
  const [fDPlate, setFDPlate] = useState('')
  const [selectedGirlId, setSelectedGirlId] = useState<string | null>(null)
  const [selectedDrvId, setSelectedDrvId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const loadData = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    const [{ data: gData }, { data: dData }, { data: dpData }] = await Promise.all([
      supabase.from('girls').select('*').order('name'),
      supabase.from('drivers').select('*').order('name'),
      supabase.from('dispatches').select('*, dispatch_girls(id, girl_id)').eq('date', today).order('created_at'),
    ])
    if (gData) setGirls(gData as GirlRow[])
    if (dData) setDrivers(dData as DriverRow[])
    if (dpData) setDispatches(dpData as DispatchRow[])
  }, [])

  useEffect(() => {
    const role = localStorage.getItem('lm_role')
    if (role !== 'boy') { router.push('/'); return }
    loadData().then(() => setLoading(false))
    const ch = supabase.channel('boy-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatches' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_girls' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'girls' }, () => loadData())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [router, loadData])

  const girlMap = useMemo(() => Object.fromEntries(girls.map(g => [g.id, g])) as Record<string, GirlRow>, [girls])
  const driverMap = useMemo(() => Object.fromEntries(drivers.map(d => [d.id, d])) as Record<string, DriverRow>, [drivers])
  const sortedGirls = useMemo(() => [...girls].sort((a, b) => (a.dist || 0) - (b.dist || 0)), [girls])

  const activeGirlIds = useMemo(() => new Set(
    dispatches.filter(dp => dp.status !== '完了').flatMap(dp => dp.dispatch_girls.map(dg => dg.girl_id))
  ), [dispatches])

  const tripsList = useMemo(() => dispatches.map((dp, idx) => {
    const drv = dp.driver_id ? driverMap[dp.driver_id] : null
    const dispGirls = dp.dispatch_girls.map(dg => girlMap[dg.girl_id]).filter((g): g is GirlRow => !!g)
    const status = dp.status === '完了' ? '完了' : dp.status === '移動中' ? '送迎中' : dp.driver_id ? '承諾待ち' : '待機中'
    const tot = dispGirls.length
    const done = dp.status === '完了' ? tot : 0
    return {
      id: dp.id,
      label: '便 #' + (idx + 1),
      departTime: dp.urgency === '今すぐ' ? '今すぐ' : (dp.scheduled_time || '未定'),
      assignedCount: tot,
      driverName: drv ? drv.name : '未定',
      status,
      progressPct: tot > 0 ? Math.round(done / tot * 100) + '%' : '0%',
      dropsDone: done,
      dropsTotal: tot,
      castObjs: dispGirls.map(g => ({ id: g.id, initial: g.name[0], color: g.color || strColor(g.id) })),
    }
  }), [dispatches, girlMap, driverMap])

  const viewDispatch = useMemo(() => dispatches.find(dp => dp.id === viewDispatchId) || null, [dispatches, viewDispatchId])

  const vDispGirls = useMemo(() => {
    if (!viewDispatch) return []
    return viewDispatch.dispatch_girls
      .map(dg => girlMap[dg.girl_id])
      .filter((g): g is GirlRow => !!g)
      .sort((a, b) => (a.dist || 0) - (b.dist || 0))
  }, [viewDispatch, girlMap])

  const vObjs = useMemo(() => vDispGirls.map((g, i) => ({
    id: g.id,
    name: g.name,
    area: g.area || '',
    addr: g.address || '',
    dist: g.dist || 0,
    color: g.color || strColor(g.id),
    initial: g.name[0],
    dropNo: i + 1,
    distLabel: '店から' + (g.dist || 0).toFixed(1) + 'km',
    done: viewDispatch?.status === '完了',
    current: viewDispatch?.status === '移動中' && i === 0,
  })), [vDispGirls, viewDispatch])

  const suggestions = useMemo(() => girls
    .filter(g => !viewDispatch?.dispatch_girls.some(dg => dg.girl_id === g.id))
    .map(g => ({ id: g.id, name: g.name, area: g.area || '', dist: g.dist || 0, color: g.color || strColor(g.id), initial: g.name[0], distLabel: '店から' + (g.dist || 0).toFixed(1) + 'km' }))
    .sort((a, b) => a.dist - b.dist)
  , [girls, viewDispatch])

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#fff', padding: '58px 20px 0', boxSizing: 'border-box', fontFamily: font }}>
        {([38, 26, 56, 11, 88, 88, 88] as number[]).map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: i < 3 ? 16 : 18, background: 'linear-gradient(90deg,#f0f0f0 25%,#e6e6e6 50%,#f0f0f0 75%)', backgroundSize: '300% 100%', animation: `sk-shimmer 1.3s ease infinite ${i * 0.07}s`, marginBottom: i === 0 ? 9 : i === 1 ? 24 : i === 2 ? 22 : i === 3 ? 12 : 10, width: i === 0 ? '38%' : i === 1 ? '54%' : '100%' }} />
        ))}
      </div>
    )
  }

  const vTotal = vDispGirls.length
  const vDone = viewDispatch?.status === '完了' ? vTotal : 0
  const vDrv = viewDispatch?.driver_id ? driverMap[viewDispatch.driver_id] : null
  const vStatus = !viewDispatch ? '' : !viewDispatch.driver_id ? 'ドライバー確定待ち' : viewDispatch.status === '待機' ? '承諾待ち' : viewDispatch.status === '移動中' ? '送迎中' : '送迎完了'
  const vLabel = viewDispatch ? '便 #' + (dispatches.findIndex(dp => dp.id === viewDispatch.id) + 1) : ''
  const draftDepartStr = draftDepartNow ? '今すぐ' : String(draftDepartHour).padStart(2, '0') + ':' + String(draftDepartMin).padStart(2, '0')
  const isAdminScreen = ['admin', 'girl-detail', 'driver-detail', 'girl-form', 'driver-form'].includes(screen)

  function go(s: Screen) { setScreen(s) }
  function logout() { localStorage.removeItem('lm_role'); router.push('/') }

  function addMinutes(delta: number) {
    let total = draftDepartHour * 60 + draftDepartMin + delta
    total = ((total % 1440) + 1440) % 1440
    setDraftDepartHour(Math.floor(total / 60))
    setDraftDepartMin(total % 60)
    setDraftDepartNow(false)
  }

  function toggleCastSelect(id: string) {
    setTripDraftIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function confirmTrip() {
    if (!tripDraftIds.length) return
    go('driver-select')
  }

  async function finalizeTrip() {
    if (!tripDraftIds.length) return
    const today = new Date().toISOString().split('T')[0]
    const { data: dp, error } = await supabase.from('dispatches').insert({
      driver_id: draftDriverKey || null,
      urgency: draftDepartNow ? '今すぐ' : '時間指定',
      scheduled_time: draftDepartNow ? null : draftDepartStr,
      status: '待機',
      date: today,
      destination: null,
    }).select().single()
    if (error || !dp) return
    const sorted = [...tripDraftIds].sort((a, b) => (girlMap[a]?.dist || 0) - (girlMap[b]?.dist || 0))
    await supabase.from('dispatch_girls').insert(sorted.map(gid => ({ dispatch_id: dp.id, girl_id: gid })))
    setViewDispatchId(dp.id)
    setTripDraftIds([])
    setDraftDriverKey(null)
    setDraftDepartNow(true)
    setDraftDepartHour(1)
    setDraftDepartMin(0)
    await loadData()
    go('home')
  }

  async function removeGirlFromTrip(dispatchId: string, girlId: string) {
    await supabase.from('dispatch_girls').delete().eq('dispatch_id', dispatchId).eq('girl_id', girlId)
    await loadData()
  }

  async function addGirlToTrip(dispatchId: string | null, girlId: string) {
    if (!dispatchId) return
    await supabase.from('dispatch_girls').insert({ dispatch_id: dispatchId, girl_id: girlId })
    await loadData()
  }

  async function assignDriver(dispatchId: string, driverId: string) {
    await supabase.from('dispatches').update({ driver_id: driverId }).eq('id', dispatchId)
    await loadData()
  }

  async function unassignDriver(dispatchId: string) {
    await supabase.from('dispatches').update({ driver_id: null }).eq('id', dispatchId)
    await loadData()
  }

  function openGirlForm(id: string | null) {
    if (id) {
      const g = girlMap[id]
      if (g) { setFGName(g.name); setFGArea(g.area || ''); setFGDist(String(g.dist ?? '')); setFGAddr(g.address || ''); setFGColor(g.color || GIRL_COLORS[0]) }
    } else {
      setFGName(''); setFGArea(''); setFGDist(''); setFGAddr(''); setFGColor(GIRL_COLORS[0])
    }
    setFormGirlId(id)
    go('girl-form')
  }

  async function saveGirl() {
    if (!fGName.trim()) return
    const data = { name: fGName.trim(), area: fGArea.trim() || null, address: fGAddr.trim() || null, dist: parseFloat(fGDist) || 0, color: fGColor }
    if (formGirlId) {
      await supabase.from('girls').update(data).eq('id', formGirlId)
      go('girl-detail')
    } else {
      await supabase.from('girls').insert(data)
      go('admin')
    }
    await loadData()
  }

  async function doDeleteGirl() {
    if (!selectedGirlId) return
    const id = selectedGirlId
    setShowDeleteConfirm(false)
    await supabase.from('girls').delete().eq('id', id)
    await loadData()
    go('admin')
  }

  function openDriverForm(id: string | null) {
    if (id) {
      const d = driverMap[id]
      if (d) { setFDName(d.name); setFDCar(d.car || ''); setFDCarColor(d.car_color || ''); setFDPlate(d.plate || '') }
    } else {
      setFDName(''); setFDCar(''); setFDCarColor(''); setFDPlate('')
    }
    setFormDrvId(id)
    go('driver-form')
  }

  async function saveDriver() {
    if (!fDName.trim()) return
    const data = { name: fDName.trim(), car: fDCar.trim() || null, car_color: fDCarColor.trim() || null, plate: fDPlate.trim() || null }
    if (formDrvId) {
      await supabase.from('drivers').update(data).eq('id', formDrvId)
      go('driver-detail')
    } else {
      await supabase.from('drivers').insert({ ...data, status: '待機', capacity: 5 })
      go('admin')
    }
    await loadData()
  }

  async function doDeleteDriver() {
    if (!selectedDrvId) return
    const id = selectedDrvId
    setShowDeleteConfirm(false)
    await supabase.from('drivers').delete().eq('id', id)
    await loadData()
    go('admin')
  }

  const nav = (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, zIndex: 40, background: '#ffffff', borderTop: '1px solid #efefef', padding: '10px 14px max(10px, env(safe-area-inset-bottom))', display: 'flex', justifyContent: 'space-around', boxSizing: 'border-box' }}>
      <div onClick={() => go('home')} role="button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: !isAdminScreen ? '#0a0a0a' : '#b5b5b5', flex: 1 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l1.6-4.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.5L19 13m-14 0h14v4a1 1 0 0 1-1 1h-1.2a1.8 1.8 0 1 1-3.6 0H9.8a1.8 1.8 0 1 1-3.6 0H5a1 1 0 0 1-1-1v-4h1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        <span style={{ fontSize: rem(10.5), fontWeight: 700 }}>配車</span>
      </div>
      <div onClick={() => go('admin')} role="button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: isAdminScreen ? '#0a0a0a' : '#b5b5b5', flex: 1 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" /><rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" /><rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" /><rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" /></svg>
        <span style={{ fontSize: rem(10.5), fontWeight: 700 }}>管理</span>
      </div>
    </div>
  )

  /* ====== HOME ====== */
  if (screen === 'home') return (
    <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '0 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 14px' }}>
        <div>
          <p style={{ margin: 0, fontSize: rem(12), fontWeight: 600, color: '#8a8a8a', letterSpacing: '.04em' }}>CLUB VENUS・KING ・ ボーイ</p>
          <h1 style={{ margin: '2px 0 0', fontSize: rem(30), fontWeight: 800, letterSpacing: '-.02em' }}>配車</h1>
        </div>
        <button onClick={logout} style={{ height: 38, padding: '0 14px', borderRadius: 10, background: '#f4f4f4', border: 'none', color: '#5a5a5a', fontSize: rem(13), fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>ログアウト</button>
      </div>

      <div style={{ padding: '0 20px' }}>
        <button onClick={() => go('new')} style={{ width: '100%', height: 58, borderRadius: 16, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: rem(16), fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: '0 8px 20px -8px rgba(0,0,0,.5)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /></svg>
          配車を依頼する
        </button>

        <p style={{ margin: '26px 4px 10px', fontSize: rem(13), fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>本日の便</p>

        {tripsList.length > 0 ? tripsList.map(trip => (
          <div key={trip.id} onClick={() => { setViewDispatchId(trip.id); go('status') }} role="button" style={{ border: '1px solid #ededed', borderRadius: 18, padding: 16, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,.04)', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06c167', animation: 'lm-pulse 1.6s infinite', flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontSize: rem(15), fontWeight: 700, whiteSpace: 'nowrap' }}>{trip.label}</span>
              </div>
              <span style={{ fontSize: rem(12), fontWeight: 700, color: '#fff', background: '#0a0a0a', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>{trip.status}</span>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
              <div><p style={{ margin: 0, fontSize: rem(10), color: '#9a9a9a', fontWeight: 600 }}>出発</p><p style={{ margin: '2px 0 0', fontSize: rem(15), fontWeight: 700 }}>{trip.departTime}</p></div>
              <div style={{ width: 1, background: '#eee' }} />
              <div><p style={{ margin: 0, fontSize: rem(10), color: '#9a9a9a', fontWeight: 600 }}>乗車</p><p style={{ margin: '2px 0 0', fontSize: rem(15), fontWeight: 700 }}>{trip.assignedCount}名</p></div>
              <div style={{ width: 1, background: '#eee' }} />
              <div style={{ minWidth: 0, flex: 1 }}><p style={{ margin: 0, fontSize: rem(10), color: '#9a9a9a', fontWeight: 600 }}>ドライバー</p><p style={{ margin: '2px 0 0', fontSize: rem(15), fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.driverName}</p></div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {trip.castObjs.map((co, i) => <div key={co.id} style={{ width: 28, height: 28, borderRadius: '50%', background: co.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(11), border: '2px solid #fff', marginLeft: i === 0 ? 0 : -6, flexShrink: 0 }}>{co.initial}</div>)}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden' }}><div style={{ height: '100%', background: '#0a0a0a', borderRadius: 3, width: trip.progressPct }} /></div>
                <span style={{ fontSize: rem(11), fontWeight: 700, color: '#6a6a6a', whiteSpace: 'nowrap' }}>{trip.dropsDone}/{trip.dropsTotal}</span>
              </div>
            </div>
          </div>
        )) : (
          <div style={{ border: '1px solid #ededed', borderRadius: 18, padding: 28, textAlign: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 10, opacity: .3 }}><path d="M5 13l1.6-4.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.5L19 13m-14 0h14v4a1 1 0 0 1-1 1h-1.2a1.8 1.8 0 1 1-3.6 0H9.8a1.8 1.8 0 1 1-3.6 0H5a1 1 0 0 1-1-1v-4h1Z" stroke="#0a0a0a" strokeWidth="1.8" strokeLinejoin="round" /></svg>
            <p style={{ margin: 0, fontSize: rem(14), color: '#b0b0b0', fontWeight: 600 }}>まだ配車依頼がありません</p>
            <p style={{ margin: '6px 0 0', fontSize: rem(12), color: '#c8c8c8' }}>上の「配車を依頼する」から作成してください</p>
          </div>
        )}
      </div>
      {nav}
    </div>
  )

  /* ====== NEW ====== */
  if (screen === 'new') return (
    <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '0 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
      <div style={{ height: 4, background: '#f0f0f0' }}><div style={{ height: '100%', width: '50%', background: '#0a0a0a', borderRadius: '0 2px 2px 0' }} /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 14px' }}>
        <BackBtn onClick={() => go('home')} />
        <h1 style={{ margin: 0, fontSize: rem(22), fontWeight: 800, letterSpacing: '-.01em' }}>配車依頼</h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        <p style={{ margin: '8px 4px 8px', fontSize: rem(12), fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>乗車するキャストを選択</p>

        {sortedGirls.length > 0 ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedGirls.map(g => {
                const selected = tripDraftIds.includes(g.id)
                const onTrip = activeGirlIds.has(g.id)
                return (
                  <div key={g.id} onClick={() => toggleCastSelect(g.id)} role="button" style={{ borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', border: selected ? '2px solid #0a0a0a' : '1px solid #ededed' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: g.color || strColor(g.id), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(16), flexShrink: 0 }}>{g.name[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: rem(15), fontWeight: 700 }}>{g.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: rem(12), color: '#9a9a9a' }}>{g.area || '—'} ・ 店から {(g.dist || 0).toFixed(1)}km</p>
                    </div>
                    {onTrip && <span style={{ fontSize: rem(11), fontWeight: 700, color: '#06c167', whiteSpace: 'nowrap', flexShrink: 0 }}>乗車中</span>}
                    {selected
                      ? <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="13" height="13" viewBox="0 0 24 24"><path d="m5 12 4 4 10-10" stroke="#fff" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                      : <div style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid #e0e0e0', flexShrink: 0 }} />}
                  </div>
                )
              })}
            </div>
            <p style={{ margin: '10px 4px 0', fontSize: rem(12.5), color: '#9a9a9a' }}>{tripDraftIds.length}名を選択中　・　お店から近い順に降車ルートを自動設定します</p>
          </>
        ) : (
          <div style={{ border: '1px solid #ededed', borderRadius: 14, padding: 24, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: rem(14), color: '#b0b0b0', fontWeight: 600 }}>キャストが登録されていません</p>
            <p style={{ margin: '6px 0 0', fontSize: rem(12), color: '#c8c8c8' }}>管理タブからキャストを追加してください</p>
          </div>
        )}

        <p style={{ margin: '24px 4px 10px', fontSize: rem(12), fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>出発予定時刻</p>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: rem(52), fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1, color: '#0a0a0a' }}>{draftDepartStr}</span>
            {draftDepartNow
              ? <span onClick={() => setDraftDepartNow(false)} role="button" style={{ fontSize: rem(13), fontWeight: 700, color: '#0a0a0a', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, whiteSpace: 'nowrap', flexShrink: 0 }}>時間を指定する</span>
              : <span onClick={() => setDraftDepartNow(true)} role="button" style={{ fontSize: rem(13), fontWeight: 600, color: '#9a9a9a', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, whiteSpace: 'nowrap', flexShrink: 0 }}>今すぐに戻す</span>}
          </div>
          <div style={{ height: 1, background: '#efefef', margin: '14px 0' }} />
          {draftDepartNow
            ? <p style={{ margin: 0, fontSize: rem(12.5), color: '#c0c0c0', fontWeight: 500 }}>出発準備ができ次第すぐに出発します</p>
            : <div style={{ display: 'flex', gap: 8 }}>
              {([[-15, '−15分'], [-5, '−5分'], [5, '+5分'], [15, '+15分']] as [number, string][]).map(([d, l]) => (
                <button key={l} onClick={() => addMinutes(d)} style={{ flex: 1, height: 40, borderRadius: 999, background: '#f2f2f2', border: 'none', fontSize: rem(13), fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#3a3a3a' }}>{l}</button>
              ))}
            </div>}
        </div>

        <button onClick={confirmTrip} style={{ marginTop: 28, width: '100%', height: 56, borderRadius: 15, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: rem(16), fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span>ドライバーを選ぶ</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      {nav}
    </div>
  )

  /* ====== DRIVER SELECT ====== */
  if (screen === 'driver-select') {
    const orderedDraft = tripDraftIds
      .map(id => { const g = girlMap[id]; return g ? { id, name: g.name, area: g.area || '', dist: g.dist || 0, color: g.color || strColor(id), initial: g.name[0] } : null })
      .filter((x): x is { id: string; name: string; area: string; dist: number; color: string; initial: string } => !!x)
      .sort((a, b) => a.dist - b.dist)
    return (
      <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '0 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
        <div style={{ height: 4, background: '#f0f0f0' }}><div style={{ height: '100%', width: '100%', background: '#0a0a0a' }} /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 14px' }}>
          <BackBtn onClick={() => go('new')} />
          <h1 style={{ margin: 0, fontSize: rem(22), fontWeight: 800, letterSpacing: '-.01em' }}>ドライバーを指定</h1>
        </div>

        <div style={{ padding: '0 20px' }}>
          <div style={{ background: '#f7f7f7', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ margin: 0, fontSize: rem(12), color: '#9a9a9a', fontWeight: 600 }}>作成した便</p>
              <p style={{ margin: '2px 0 0', fontSize: rem(18), fontWeight: 800 }}>{orderedDraft.length ? orderedDraft.map(g => (g.area.split('（')[0] || g.name)).join('・') : '（未選択）'}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {orderedDraft.map((g, i) => <div key={g.id} style={{ width: 32, height: 32, borderRadius: '50%', background: g.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(13), border: '2px solid #f7f7f7', marginLeft: i === 0 ? 0 : -7 }}>{g.initial}</div>)}
              <span style={{ marginLeft: 10, fontSize: rem(13), fontWeight: 700, color: '#5a5a5a' }}>{orderedDraft.length}名</span>
            </div>
          </div>

          <p style={{ margin: '0 4px 12px', fontSize: rem(12), fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>担当ドライバーを選んでください</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {drivers.map(drv => {
              const cfg = DRV_STATUS_CONFIG[drv.status] || DRV_STATUS_CONFIG['待機']
              const isCurrent = draftDriverKey === drv.id
              const canAssign = cfg.available
              return (
                <div key={drv.id} onClick={() => { if (canAssign) setDraftDriverKey(drv.id) }} role="button" style={{ borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 14, cursor: canAssign ? 'pointer' : 'not-allowed', border: isCurrent ? '2px solid #0a0a0a' : '1px solid #ededed', background: !canAssign ? '#f9f9f9' : '#fff', opacity: !canAssign ? 0.55 : 1 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1a1a1a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(18), flexShrink: 0 }}>{drv.name[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: rem(16), fontWeight: 700 }}>{drv.name}</p>
                    <p style={{ margin: '3px 0 0', fontSize: rem(12.5), color: '#9a9a9a' }}>{drv.car}{drv.car_color ? `（${drv.car_color}）` : ''}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: rem(12), fontWeight: 700, color: cfg.color }}>{drv.status}</span>
                      {!canAssign && <span style={{ fontSize: rem(11), color: '#b0b0b0' }}>・ 依頼不可</span>}
                    </div>
                  </div>
                  {isCurrent
                    ? <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="14" height="14" viewBox="0 0 24 24"><path d="m5 12 4 4 10-10" stroke="#fff" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                    : canAssign
                      ? <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #e0e0e0', flexShrink: 0 }} />
                      : <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#d0d0d0" strokeWidth="1.6" /><path d="M8 8l8 8M16 8l-8 8" stroke="#d0d0d0" strokeWidth="1.6" strokeLinecap="round" /></svg>}
                </div>
              )
            })}
          </div>

          <button onClick={finalizeTrip} style={{ marginTop: 20, width: '100%', height: 56, borderRadius: 15, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: rem(16), fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m5 12 4 4 10-10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            配車依頼を確定する
          </button>
          <p style={{ margin: '10px 4px 0', fontSize: rem(12), color: '#a0a0a0', textAlign: 'center' }}>ドライバー未選択でも確定できます。あとで変更可能。</p>
        </div>
        {nav}
      </div>
    )
  }

  /* ====== STATUS ====== */
  if (screen === 'status') return (
    <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '0 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 14px' }}>
        <BackBtn onClick={() => go('home')} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: rem(11), fontWeight: 600, color: '#9a9a9a' }}>{vLabel}</p>
          <h1 style={{ margin: 0, fontSize: rem(22), fontWeight: 800, letterSpacing: '-.01em' }}>便の詳細</h1>
        </div>
        <button onClick={() => go('edit')} style={{ height: 36, padding: '0 14px', borderRadius: 10, background: '#f4f4f4', border: 'none', fontSize: rem(13), fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7m-1.5-9.5a2.1 2.1 0 0 1 3 3L12 16l-4 1 1-4 8.5-8.5Z" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          編集
        </button>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ background: '#0a0a0a', borderRadius: 18, padding: 18, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: rem(12), color: '#a8a8a8', fontWeight: 600 }}>{vLabel}</p>
              <p style={{ margin: '3px 0 0', fontSize: rem(22), fontWeight: 800, letterSpacing: '-.01em' }}>{vStatus}</p>
            </div>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#06c167', animation: 'lm-pulse 1.6s infinite', display: 'inline-block' }} />
          </div>
          {vDrv ? (
            <div style={{ marginTop: 16, background: '#1a1a1a', borderRadius: 13, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#333', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(16) }}>{vDrv.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}><p style={{ margin: 0, fontSize: rem(14), fontWeight: 700 }}>{vDrv.name}</p><p style={{ margin: '1px 0 0', fontSize: rem(12), color: '#9a9a9a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vDrv.car}{vDrv.car_color ? `（${vDrv.car_color}）` : ''} ・ {vDrv.plate}</p></div>
                <span onClick={() => viewDispatch && unassignDriver(viewDispatch.id)} role="button" style={{ fontSize: rem(11.5), color: '#6e6e6e', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, whiteSpace: 'nowrap', flexShrink: 0 }}>変更</span>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 16, background: '#1a1a1a', borderRadius: 13, padding: 12 }}>
              <p style={{ margin: '0 0 10px', fontSize: rem(12), fontWeight: 700, color: '#9a9a9a', letterSpacing: '.04em' }}>ドライバーを指定</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {drivers.map(drv => {
                  const cfg = DRV_STATUS_CONFIG[drv.status] || DRV_STATUS_CONFIG['待機']
                  const canAssign = cfg.available
                  return (
                    <div key={drv.id} onClick={() => { if (canAssign && viewDispatch) assignDriver(viewDispatch.id, drv.id) }} role="button" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: '#252525', cursor: canAssign ? 'pointer' : 'not-allowed', border: '1px solid #333', opacity: canAssign ? 1 : 0.5 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#3a3a3a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(14), flexShrink: 0 }}>{drv.name[0]}</div>
                      <div style={{ flex: 1, minWidth: 0 }}><p style={{ margin: 0, fontSize: rem(14), fontWeight: 700, color: '#fff' }}>{drv.name}</p><p style={{ margin: '1px 0 0', fontSize: rem(11.5), color: '#9a9a9a' }}>{drv.car || '—'}</p></div>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #444' }} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#2a2a2a', overflow: 'hidden' }}><div style={{ height: '100%', background: '#06c167', borderRadius: 3, width: vTotal ? Math.round(vDone / vTotal * 100) + '%' : '0%' }} /></div>
            <span style={{ fontSize: rem(12), fontWeight: 700, color: '#cfcfcf' }}>降車 {vDone}/{vTotal}</span>
          </div>
        </div>

        <p style={{ margin: '24px 4px 10px', fontSize: rem(13), fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>降車ルート</p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {vObjs.map((g, i) => (
            <div key={g.id} style={{ display: 'flex', gap: 13 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
                {g.done
                  ? <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#06c167', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="12" height="12" viewBox="0 0 24 24"><path d="m5 12 4 4 10-10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                  : g.current
                    ? <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: rem(12), fontWeight: 700, flexShrink: 0, animation: 'lm-pulse 1.4s infinite' }}>{g.dropNo}</div>
                    : <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#fff', border: '2px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b0b0b0', fontSize: rem(12), fontWeight: 700, flexShrink: 0 }}>{g.dropNo}</div>}
                {i < vObjs.length - 1 && <div style={{ width: 2, flex: 1, background: '#eee', minHeight: 18 }} />}
              </div>
              <div style={{ flex: 1, paddingBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: rem(15), fontWeight: 700 }}>{g.name}</span>
                  {g.done && <span style={{ fontSize: rem(11), fontWeight: 700, color: '#06c167' }}>降車済み</span>}
                  {g.current && <span style={{ fontSize: rem(11), fontWeight: 700, color: '#0a0a0a' }}>次の降車</span>}
                </div>
                <p style={{ margin: '2px 0 0', fontSize: rem(12.5), color: '#9a9a9a' }}>{g.addr}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {nav}
    </div>
  )

  /* ====== EDIT ====== */
  if (screen === 'edit') return (
    <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '0 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 14px' }}>
        <BackBtn onClick={() => go('status')} />
        <h1 style={{ margin: 0, fontSize: rem(22), fontWeight: 800, letterSpacing: '-.01em' }}>便を編集</h1>
      </div>

      {dispatches.length > 0 && (
        <div style={{ padding: '0 20px', display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
          {dispatches.map((dp, idx) => {
            const isActive = viewDispatchId === dp.id
            const deptTime = dp.urgency === '今すぐ' ? '今すぐ' : (dp.scheduled_time || '未定')
            return (
              <div key={dp.id} onClick={() => setViewDispatchId(dp.id)} role="button" style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 999, cursor: 'pointer', border: isActive ? '2px solid #0a0a0a' : '1px solid #e0e0e0', background: isActive ? '#0a0a0a' : '#fff', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: rem(13.5), fontWeight: 700, color: isActive ? '#fff' : '#3a3a3a' }}>{'便 #' + (idx + 1)}</span>
                <span style={{ fontSize: rem(11.5), fontWeight: 600, color: isActive ? '#a8a8a8' : '#b0b0b0' }}>{deptTime}</span>
              </div>
            )
          })}
        </div>
      )}

      {dispatches.length === 0 && (
        <div style={{ margin: '0 20px 16px', border: '1px solid #ededed', borderRadius: 14, padding: 20, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: rem(14), color: '#b0b0b0', fontWeight: 600 }}>まだ便がありません</p>
          <p style={{ margin: '6px 0 0', fontSize: rem(12), color: '#c8c8c8' }}>配車タブから便を作成してください</p>
        </div>
      )}

      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '6px 0 10px' }}>
          <p style={{ margin: '0 4px', fontSize: rem(12), fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>降車順（{vTotal}名）</p>
          <span style={{ fontSize: rem(11.5), fontWeight: 700, color: '#06c167', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="m5 12 4 4 10-10" stroke="#06c167" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            近い順 適用済み
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {vObjs.map(g => (
            <div key={g.id} style={{ border: '1px solid #ededed', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 24, height: 24, borderRadius: 8, background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: rem(13), fontWeight: 700, flexShrink: 0 }}>{g.dropNo}</span>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: g.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(15), flexShrink: 0 }}>{g.initial}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: rem(15), fontWeight: 700 }}>{g.name}</p>
                <p style={{ margin: '1px 0 0', fontSize: rem(12), color: '#9a9a9a', fontWeight: 500 }}>{g.area} ・ 店から {g.dist.toFixed(1)}km</p>
              </div>
              <button onClick={() => viewDispatch && removeGirlFromTrip(viewDispatch.id, g.id)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#f4f4f4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="#8a8a8a" strokeWidth="2.2" strokeLinecap="round" /></svg>
              </button>
            </div>
          ))}
        </div>

        {suggestions.length > 0 && (
          <div style={{ marginTop: 22, background: '#0a0a0a', borderRadius: 18, padding: 16, color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-13.2-1.4 1.4m-10 10-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
              <span style={{ fontSize: rem(14), fontWeight: 700 }}>自動提案</span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: rem(12), color: '#a8a8a8', lineHeight: 1.5 }}>同じ方面・お店から近いキャストの同乗をおすすめします。</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {suggestions.slice(0, 3).map(s => (
                <div key={s.id} style={{ background: '#1a1a1a', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(14), flexShrink: 0 }}>{s.initial}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: rem(14), fontWeight: 700 }}>{s.name}</p>
                    <p style={{ margin: '1px 0 0', fontSize: rem(11.5), color: '#9a9a9a' }}>{s.area} ・ {s.distLabel}</p>
                  </div>
                  <button onClick={() => addGirlToTrip(viewDispatchId, s.id)} style={{ height: 34, padding: '0 14px', borderRadius: 999, background: '#fff', color: '#0a0a0a', border: 'none', fontSize: rem(13), fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>＋ 追加</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => go('status')} style={{ marginTop: 24, width: '100%', height: 56, borderRadius: 15, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: rem(16), fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>編集を完了</button>
      </div>
      {nav}
    </div>
  )

  /* ====== GIRL DETAIL ====== */
  if (screen === 'girl-detail') {
    const g = selectedGirlId ? girlMap[selectedGirlId] : null
    if (!g || !selectedGirlId) return null
    const onTrip = activeGirlIds.has(selectedGirlId)
    return (
      <div style={{ position: 'relative', minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '0 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 14px' }}>
          <BackBtn onClick={() => go('admin')} />
          <h1 style={{ margin: 0, fontSize: rem(22), fontWeight: 800, letterSpacing: '-.01em' }}>キャスト詳細</h1>
        </div>
        <div style={{ padding: '0 20px' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: g.color || strColor(g.id), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(28), flexShrink: 0 }}>{g.name[0]}</div>
              <div>
                <p style={{ margin: 0, fontSize: rem(36), fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1 }}>{g.name}</p>
                <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', background: onTrip ? '#0a0a0a' : '#f0f0f0', padding: '5px 13px', borderRadius: 999 }}>
                  <span style={{ fontSize: rem(12), fontWeight: 700, color: onTrip ? '#fff' : '#8a8a8a' }}>{onTrip ? '乗車中' : '待機中'}</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #f0f0f0' }}>
            <InfoRow label="エリア"><p style={{ margin: 0, fontSize: rem(18), fontWeight: 700 }}>{g.area || '未登録'}</p></InfoRow>
            <InfoRow label="店からの距離"><p style={{ margin: 0, fontSize: rem(18), fontWeight: 700 }}>{(g.dist || 0).toFixed(1)} <span style={{ fontSize: rem(14), fontWeight: 600, color: '#6a6a6a' }}>km</span></p></InfoRow>
            <InfoRow label="住所" last><p style={{ margin: 0, fontSize: rem(16), fontWeight: 600, lineHeight: 1.55 }}>{g.address || '未登録'}</p></InfoRow>
          </div>
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => openGirlForm(selectedGirlId)} style={{ width: '100%', height: 56, borderRadius: 15, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: rem(16), fontWeight: 700, cursor: 'pointer', fontFamily: font, boxShadow: '0 8px 20px -8px rgba(0,0,0,.5)' }}>編集する</button>
            <button onClick={() => setShowDeleteConfirm(true)} style={{ width: '100%', height: 48, borderRadius: 15, background: '#fff', color: '#9a9a9a', border: 'none', fontSize: rem(14), fontWeight: 600, cursor: 'pointer', fontFamily: font, textDecoration: 'underline', textUnderlineOffset: 3 }}>削除する</button>
          </div>
        </div>
        {showDeleteConfirm && <DeleteOverlay name={g.name} color={g.color || strColor(g.id)} initial={g.name[0]} onDelete={doDeleteGirl} onCancel={() => setShowDeleteConfirm(false)} />}
        {nav}
      </div>
    )
  }

  /* ====== DRIVER DETAIL ====== */
  if (screen === 'driver-detail') {
    const d = selectedDrvId ? driverMap[selectedDrvId] : null
    if (!d || !selectedDrvId) return null
    const dCfg = DRV_STATUS_CONFIG[d.status] || DRV_STATUS_CONFIG['待機']
    const isActive = !dCfg.available
    const colorCSS = d.car_color ? (CAR_COLOR_MAP[d.car_color] || '#d0d0d0') : null
    return (
      <div style={{ position: 'relative', minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '0 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 14px' }}>
          <BackBtn onClick={() => go('admin')} />
          <h1 style={{ margin: 0, fontSize: rem(22), fontWeight: 800, letterSpacing: '-.01em' }}>ドライバー詳細</h1>
        </div>
        <div style={{ padding: '0 20px' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#1a1a1a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(28), flexShrink: 0 }}>{d.name[0]}</div>
              <div>
                <p style={{ margin: 0, fontSize: rem(36), fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1 }}>{d.name}</p>
                <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: dCfg.color, display: 'inline-block', animation: isActive ? 'lm-pulse 1.6s infinite' : 'none' }} />
                  <span style={{ fontSize: rem(13), fontWeight: 700, color: dCfg.color }}>{d.status}</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #f0f0f0' }}>
            <InfoRow label="車種"><p style={{ margin: 0, fontSize: rem(20), fontWeight: 700 }}>{d.car || '未登録'}</p></InfoRow>
            {d.car_color ? (
              <InfoRow label="車の色">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {colorCSS && <div style={{ width: 24, height: 24, borderRadius: '50%', background: colorCSS, border: '1.5px solid #ddd', flexShrink: 0 }} />}
                  <p style={{ margin: 0, fontSize: rem(20), fontWeight: 700 }}>{d.car_color}</p>
                </div>
              </InfoRow>
            ) : null}
            <InfoRow label="ナンバープレート" last><p style={{ margin: 0, fontSize: rem(22), fontWeight: 800, letterSpacing: '.04em' }}>{d.plate || '未登録'}</p></InfoRow>
          </div>
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => openDriverForm(selectedDrvId)} style={{ width: '100%', height: 56, borderRadius: 15, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: rem(16), fontWeight: 700, cursor: 'pointer', fontFamily: font, boxShadow: '0 8px 20px -8px rgba(0,0,0,.5)' }}>編集する</button>
            <button onClick={() => { if (!isActive) setShowDeleteConfirm(true) }} disabled={isActive} style={{ width: '100%', height: 48, borderRadius: 15, background: '#fff', color: isActive ? '#c8c8c8' : '#9a9a9a', border: 'none', fontSize: rem(14), fontWeight: 600, cursor: isActive ? 'not-allowed' : 'pointer', fontFamily: font, textDecoration: isActive ? 'none' : 'underline', textUnderlineOffset: 3 }}>
              {isActive ? '削除する（運行中のため不可）' : '削除する'}
            </button>
          </div>
        </div>
        {showDeleteConfirm && <DeleteOverlay name={d.name} color="#1a1a1a" initial={d.name[0]} onDelete={doDeleteDriver} onCancel={() => setShowDeleteConfirm(false)} />}
        {nav}
      </div>
    )
  }

  /* ====== GIRL FORM ====== */
  if (screen === 'girl-form') return (
    <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '0 0 48px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 14px' }}>
        <BackBtn onClick={() => { if (formGirlId) { go('girl-detail') } else { go('admin') } }} />
        <h1 style={{ margin: 0, fontSize: rem(22), fontWeight: 800 }}>{formGirlId ? `${girlMap[formGirlId]?.name || ''}を編集` : 'キャストを追加'}</h1>
      </div>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <label style={fieldLabel}>ニックネーム</label>
          <input value={fGName} onChange={e => setFGName(e.target.value)} placeholder="ことね" style={fieldInput} />
        </div>
        <div>
          <label style={fieldLabel}>エリア（地区）</label>
          <input value={fGArea} onChange={e => setFGArea(e.target.value)} placeholder="古町（中央区）" style={fieldInput} />
        </div>
        <div>
          <label style={fieldLabel}>自宅住所</label>
          <textarea value={fGAddr} onChange={e => setFGAddr(e.target.value)} placeholder="新潟市中央区..." style={{ ...fieldInput, height: 80, padding: '14px 16px', lineHeight: 1.5, resize: 'none' as const }} />
          <p style={{ margin: '8px 2px 0', fontSize: rem(12), color: '#b0b0b0', lineHeight: 1.5 }}>住所はドライバーへの案内・距離計算に使用します</p>
        </div>
        <div>
          <label style={fieldLabel}>お店からの距離（km）</label>
          <input value={fGDist} onChange={e => setFGDist(e.target.value)} placeholder="1.5" type="number" step="0.1" min="0" style={fieldInput} />
        </div>
        <div>
          <label style={fieldLabel}>カラー</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {GIRL_COLORS.map(c => (
              <div key={c} onClick={() => setFGColor(c)} style={{ width: 38, height: 38, borderRadius: '50%', background: c, border: fGColor === c ? '3px solid #0a0a0a' : '3px solid transparent', cursor: 'pointer', boxSizing: 'border-box', outline: fGColor === c ? '2px solid #fff' : 'none', outlineOffset: '-5px' }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f7f7f7', borderRadius: 14, padding: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: fGColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(18), flexShrink: 0 }}>{fGName[0] || '?'}</div>
          <div>
            <p style={{ margin: 0, fontSize: rem(15), fontWeight: 700 }}>{fGName || '（名前未入力）'}</p>
            <p style={{ margin: '2px 0 0', fontSize: rem(12), color: '#9a9a9a' }}>{fGArea || '（エリア未入力）'} ・ {fGDist || '0'}km</p>
          </div>
        </div>
        <button onClick={saveGirl} style={{ height: 56, borderRadius: 15, background: fGName.trim() ? '#0a0a0a' : '#d0d0d0', color: '#fff', border: 'none', fontSize: rem(16), fontWeight: 700, cursor: fGName.trim() ? 'pointer' : 'default', fontFamily: font }}>
          {formGirlId ? '変更を保存' : 'キャストを追加'}
        </button>
      </div>
    </div>
  )

  /* ====== DRIVER FORM ====== */
  if (screen === 'driver-form') return (
    <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '0 0 48px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 14px' }}>
        <BackBtn onClick={() => { if (formDrvId) { go('driver-detail') } else { go('admin') } }} />
        <h1 style={{ margin: 0, fontSize: rem(22), fontWeight: 800 }}>{formDrvId ? `${driverMap[formDrvId]?.name || ''}を編集` : 'ドライバーを追加'}</h1>
      </div>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <label style={fieldLabel}>名前</label>
          <input value={fDName} onChange={e => setFDName(e.target.value)} placeholder="例：田中 誠" style={fieldInput} />
        </div>
        <div>
          <label style={fieldLabel}>車種</label>
          <input value={fDCar} onChange={e => setFDCar(e.target.value)} placeholder="例：アルファード" style={fieldInput} />
        </div>
        <div>
          <label style={fieldLabel}>車の色</label>
          <input value={fDCarColor} onChange={e => setFDCarColor(e.target.value)} placeholder="例：白" style={fieldInput} />
        </div>
        <div>
          <label style={fieldLabel}>ナンバープレート</label>
          <input value={fDPlate} onChange={e => setFDPlate(e.target.value)} placeholder="例：新潟 300 あ 12-34" style={fieldInput} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f7f7f7', borderRadius: 14, padding: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#2a2a2a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(18), flexShrink: 0 }}>{fDName[0] || '?'}</div>
          <div>
            <p style={{ margin: 0, fontSize: rem(15), fontWeight: 700 }}>{fDName || '（名前未入力）'}</p>
            <p style={{ margin: '2px 0 0', fontSize: rem(12), color: '#9a9a9a' }}>{fDCar || '（車種未入力）'}{fDCarColor ? `（${fDCarColor}）` : ''}</p>
          </div>
        </div>
        <button onClick={saveDriver} style={{ height: 56, borderRadius: 15, background: fDName.trim() ? '#0a0a0a' : '#d0d0d0', color: '#fff', border: 'none', fontSize: rem(16), fontWeight: 700, cursor: fDName.trim() ? 'pointer' : 'not-allowed', fontFamily: font }}>
          {formDrvId ? '変更を保存' : '登録する'}
        </button>
      </div>
    </div>
  )

  /* ====== ADMIN ====== */
  const avatarGirls = girls.slice(0, 4).map(g => ({ id: g.id, color: g.color || strColor(g.id), initial: g.name[0] }))

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '0 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 16px' }}>
        <div>
          <p style={{ margin: 0, fontSize: rem(12), fontWeight: 600, color: '#8a8a8a', letterSpacing: '.04em' }}>CLUB VENUS・KING・ボーイ</p>
          <h1 style={{ margin: '2px 0 0', fontSize: rem(30), fontWeight: 800, letterSpacing: '-.02em' }}>管理</h1>
        </div>
        <button onClick={logout} style={{ height: 38, padding: '0 14px', borderRadius: 10, background: '#f4f4f4', border: 'none', color: '#5a5a5a', fontSize: rem(13), fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>ログアウト</button>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ background: '#0a0a0a', borderRadius: 16, padding: '16px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: rem(12), fontWeight: 600, color: '#666' }}>本日の在籍</p>
            <p style={{ margin: '4px 0 0', fontSize: rem(20), fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>キャスト {girls.length}名 · ドライバー {drivers.length}名</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {avatarGirls.map((g, i) => (
              <div key={g.id} style={{ width: 28, height: 28, borderRadius: '50%', background: g.color, border: '2px solid #0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: rem(10), fontWeight: 700, color: '#fff', marginLeft: i === 0 ? 0 : -6 }}>{g.initial}</div>
            ))}
            {girls.length > 4 && <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2a2a2a', border: '2px solid #0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: rem(10), fontWeight: 700, color: '#9a9a9a', marginLeft: -6 }}>…</div>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ margin: 0, fontSize: rem(13), fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>キャスト一覧</p>
          <button onClick={() => openGirlForm(null)} style={{ height: 30, padding: '0 12px', borderRadius: 999, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: rem(12), fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" /></svg>
            追加
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {girls.map(g => {
            const onTrip = activeGirlIds.has(g.id)
            return (
              <div key={g.id} onClick={() => { setSelectedGirlId(g.id); setShowDeleteConfirm(false); go('girl-detail') }} role="button" style={{ border: '1px solid #ededed', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: g.color || strColor(g.id), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(15), flexShrink: 0 }}>{g.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: rem(15), fontWeight: 700 }}>{g.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: rem(12), color: '#9a9a9a' }}>{g.area || '—'} ・ 店から {(g.dist || 0).toFixed(1)}km</p>
                </div>
                {onTrip
                  ? <span style={{ fontSize: rem(11.5), fontWeight: 700, color: '#fff', background: '#0a0a0a', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>乗車中</span>
                  : <span style={{ fontSize: rem(11.5), fontWeight: 700, color: '#b0b0b0', whiteSpace: 'nowrap', flexShrink: 0 }}>待機中</span>}
                <svg width="7" height="12" viewBox="0 0 7 12"><path d="M1 1l5 5-5 5" stroke="#c0c0c0" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ margin: 0, fontSize: rem(13), fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>ドライバー一覧</p>
          <button onClick={() => openDriverForm(null)} style={{ height: 30, padding: '0 12px', borderRadius: 999, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: rem(12), fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" /></svg>
            追加
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {drivers.map(d => {
            const cfg = DRV_STATUS_CONFIG[d.status] || DRV_STATUS_CONFIG['待機']
            const isActive = !cfg.available
            return (
              <div key={d.id} onClick={() => { setSelectedDrvId(d.id); setShowDeleteConfirm(false); go('driver-detail') }} role="button" style={{ border: '1px solid #ededed', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#2a2a2a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(15), flexShrink: 0 }}>{d.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: rem(15), fontWeight: 700 }}>{d.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: rem(12), color: '#9a9a9a' }}>{d.car}{d.car_color ? `（${d.car_color}）` : ''}</p>
                  <p style={{ margin: '1px 0 0', fontSize: rem(12), color: '#9a9a9a' }}>{d.plate}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  {isActive && <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, display: 'inline-block', animation: 'lm-pulse 1.6s infinite' }} />}
                  <span style={{ fontSize: rem(11.5), fontWeight: 700, color: isActive ? cfg.color : '#b0b0b0', whiteSpace: 'nowrap' }}>{isActive ? d.status : '待機中'}</span>
                </div>
                <svg width="7" height="12" viewBox="0 0 7 12"><path d="M1 1l5 5-5 5" stroke="#c0c0c0" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            )
          })}
        </div>
      </div>
      {nav}
    </div>
  )
}
