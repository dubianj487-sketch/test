'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  loadAppState, saveAppState,
  DRIVER_STATUS_CONFIG, buildTripObjs,
  type AppState, type Girl, type DriverInfo, type Trip,
} from '@/lib/appState'

const font = "'Hanken Grotesk', 'Noto Sans JP', sans-serif"
type Screen = 'home' | 'new' | 'edit' | 'driver-select' | 'status' | 'admin' | 'girl-detail' | 'driver-detail' | 'girl-form' | 'driver-form'

function DeleteOverlay({ name, color, initial, onDelete, onCancel }: { name: string; color: string; initial: string; onDelete: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.6)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ background: '#fff', borderRadius: '26px 26px 0 0', padding: '22px 22px 48px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e0e0e0', margin: '0 auto 24px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, flexShrink: 0 }}>{initial}</div>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{name}を<br />削除しますか？</p>
        </div>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: '#8a8a8a', lineHeight: 1.65 }}>削除すると元に戻せません。<br />過去の便の記録には影響しません。</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onDelete} style={{ width: '100%', height: 56, borderRadius: 15, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>削除する</button>
          <button onClick={onCancel} style={{ width: '100%', height: 52, borderRadius: 15, background: '#f4f4f4', color: '#0a0a0a', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>キャンセル</button>
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
    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#9a9a9a', letterSpacing: '.06em', textTransform: 'uppercase' as const }}>{label}</p>
    <div style={{ marginTop: 4 }}>{children}</div>
  </div>
)

const fieldInput: React.CSSProperties = { height: 54, width: '100%', borderRadius: 14, background: '#fafafa', border: '1.5px solid #e8e8e8', color: '#0a0a0a', padding: '0 16px', fontSize: 18, fontWeight: 600, fontFamily: font, outline: 'none', boxSizing: 'border-box' }
const fieldLabel: React.CSSProperties = { margin: '0 0 8px 2px', fontSize: 11, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.08em', textTransform: 'uppercase' as const, display: 'block' }

export default function BoyPage() {
  const router = useRouter()
  const [app, setAppRaw] = useState<AppState | null>(null)
  const [screen, setScreen] = useState<Screen>('home')
  const [tripDraftIds, setTripDraftIds] = useState<string[]>([])
  const [draftDriverKey, setDraftDriverKey] = useState<string | null>(null)
  const [draftLastTrip, setDraftLastTrip] = useState(false)
  const [draftDepartNow, setDraftDepartNow] = useState(true)
  const [draftDepartHour, setDraftDepartHour] = useState(1)
  const [draftDepartMin, setDraftDepartMin] = useState(0)
  const [viewingTripId, setViewingTripId] = useState<number | null>(null)
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

  useEffect(() => {
    const role = localStorage.getItem('lm_role')
    if (role !== 'boy') { router.push('/'); return }
    setAppRaw(loadAppState())
    setLoading(false)
  }, [router])

  const setApp = useCallback((updater: (s: AppState) => AppState) => {
    setAppRaw(prev => {
      if (!prev) return prev
      const next = updater(prev)
      saveAppState(next)
      return next
    })
  }, [])

  const go = (s: Screen) => setScreen(s)

  function logout() {
    localStorage.removeItem('lm_role')
    router.push('/')
  }

  if (loading || !app) {
    return (
      <div style={{ minHeight: '100dvh', background: '#fff', padding: '58px 20px 0', boxSizing: 'border-box', fontFamily: font }}>
        {([38, 26, 56, 11, 88, 88, 88] as number[]).map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: i < 3 ? 16 : 18, background: 'linear-gradient(90deg,#f0f0f0 25%,#e6e6e6 50%,#f0f0f0 75%)', backgroundSize: '300% 100%', animation: `sk-shimmer 1.3s ease infinite ${i * 0.07}s`, marginBottom: i === 0 ? 9 : i === 1 ? 24 : i === 2 ? 22 : i === 3 ? 12 : 10, width: i === 0 ? '38%' : i === 1 ? '54%' : '100%' }} />
        ))}
      </div>
    )
  }

  const girls = app.girls
  const drivers = app.drivers

  const approvedSet = new Set(app.trips.flatMap(t => t.assignedIds))
  const pendingRequests = Object.keys(app.rideRequests)
    .filter(id => app.rideRequests[id] === 'approved' && !approvedSet.has(id))
    .map(id => { const g = girls[id]; if (!g) return null; const sel = tripDraftIds.includes(id); return { id, ...g, initial: g.name[0], distLabel: g.dist.toFixed(1) + 'km', selected: sel } })
    .filter(Boolean) as { id: string; name: string; area: string; dist: number; addr: string; color: string; initial: string; distLabel: string; selected: boolean }[]
  pendingRequests.sort((a, b) => a.dist - b.dist)

  const tripsList = app.trips.map(t => {
    const drv = t.driverKey ? drivers[t.driverKey] : null
    const tot = t.assignedIds.length, dn = t.completed || 0
    const status = !t.driverKey ? '待機中' : (!t.boarded ? '出発前' : (dn < tot ? '送迎中' : '完了'))
    return { id: t.id, label: '便 #' + t.id, departTime: t.departTime, assignedCount: tot, driverName: drv ? drv.name : '未定', status, progressPct: tot ? Math.round(dn / tot * 100) + '%' : '0%', dropsDone: dn, dropsTotal: tot, castObjs: t.assignedIds.map(id => { const g = girls[id] || { name: '?', area: '', dist: 0, addr: '', color: '#aaa' }; return { ...g, id, initial: g.name[0] } }) }
  })

  const viewT = app.trips.find(t => t.id === viewingTripId) || null
  const vObjs = viewT ? buildTripObjs(viewT, girls) : []
  const vTotal = vObjs.length, vDone = viewT ? (viewT.completed || 0) : 0
  const vDrv = viewT?.driverKey ? drivers[viewT.driverKey] : null
  const vStatus = !viewT ? '' : (!viewT.driverKey ? 'ドライバー確定待ち' : (!viewT.boarded ? '乗車前' : (vDone < vTotal ? '送迎中' : '送迎完了')))
  const vTodayCastId = viewT ? viewT.assignedIds.find(id => app.todayRequests[id]?.status === '承認待ち') : undefined
  const vTodayReq = vTodayCastId ? app.todayRequests[vTodayCastId] : undefined
  const todayReqList = Object.entries(app.todayRequests)
    .filter(([, v]) => v?.status === '承認待ち')
    .map(([id, v]) => ({ castId: id, castName: girls[id]?.name || id, place: v!.place, status: v!.status, color: girls[id]?.color || '#888', initial: (girls[id]?.name || '?')[0] }))
  const suggestions = Object.keys(girls)
    .filter(id => !viewT?.assignedIds.includes(id))
    .map(id => { const g = girls[id]; return { id, ...g, initial: g.name[0], distLabel: '店から' + g.dist.toFixed(1) + 'km' } })
    .sort((a, b) => a.dist - b.dist)
  const draftDepartStr = draftDepartNow ? '今すぐ' : String(draftDepartHour).padStart(2, '0') + ':' + String(draftDepartMin).padStart(2, '0')

  function addMinutes(delta: number) {
    let total = draftDepartHour * 60 + draftDepartMin + delta
    total = ((total % 1440) + 1440) % 1440
    setDraftDepartHour(Math.floor(total / 60))
    setDraftDepartMin(total % 60)
    setDraftDepartNow(false)
  }

  function confirmTrip() {
    if (!tripDraftIds.length) return
    go('driver-select')
  }

  function finalizeTrip() {
    if (!tripDraftIds.length || !app) return
    const sorted = [...tripDraftIds].sort((a, b) => (girls[a]?.dist || 0) - (girls[b]?.dist || 0))
    const deptStr = draftDepartNow ? '今すぐ' : String(draftDepartHour).padStart(2, '0') + ':' + String(draftDepartMin).padStart(2, '0')
    const newId = app.nextTripId
    setApp(s => {
      const newReqs = { ...s.rideRequests }
      tripDraftIds.forEach(rid => { newReqs[rid] = 'approved' })
      const newTrip: Trip = { id: newId, assignedIds: sorted, departTime: deptStr, driverKey: draftDriverKey, lastTrip: draftLastTrip, boarded: false, completed: 0 }
      const newStatuses = draftDriverKey ? { ...s.driverStatuses, [draftDriverKey]: '乗車待機' } : s.driverStatuses
      return { ...s, trips: [...s.trips, newTrip], nextTripId: newId + 1, rideRequests: newReqs, driverStatuses: newStatuses }
    })
    setViewingTripId(newId)
    setTripDraftIds([])
    setDraftDriverKey(null)
    setDraftLastTrip(false)
    setDraftDepartNow(true)
    setDraftDepartHour(1)
    setDraftDepartMin(0)
    go('home')
  }

  function toggleCastSelect(id: string) {
    setTripDraftIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function removeGirlFromTrip(tripId: number, castId: string) {
    setApp(s => ({ ...s, trips: s.trips.map(t => t.id === tripId ? { ...t, assignedIds: t.assignedIds.filter(x => x !== castId) } : t) }))
  }

  function addGirlToTrip(tripId: number | null, castId: string) {
    if (!tripId) return
    setApp(s => ({ ...s, trips: s.trips.map(t => t.id !== tripId || t.assignedIds.includes(castId) ? t : { ...t, assignedIds: [...t.assignedIds, castId].sort((a, b) => (s.girls[a]?.dist || 0) - (s.girls[b]?.dist || 0)) }) }))
  }

  function assignDriver(tripId: number, driverKey: string) {
    setApp(s => ({ ...s, trips: s.trips.map(t => t.id === tripId ? { ...t, driverKey } : t), driverStatuses: { ...s.driverStatuses, [driverKey]: '乗車待機' } }))
  }

  function unassignDriver(tripId: number) {
    if (!app) return
    const trip = app.trips.find(t => t.id === tripId)
    setApp(s => {
      const newSt = trip?.driverKey ? { ...s.driverStatuses, [trip.driverKey]: '待機中' } : s.driverStatuses
      return { ...s, trips: s.trips.map(t => t.id === tripId ? { ...t, driverKey: null } : t), driverStatuses: newSt }
    })
  }

  function approveTodayReq(castId: string) {
    setApp(s => ({ ...s, todayRequests: { ...s.todayRequests, [castId]: { ...s.todayRequests[castId]!, status: '承認済み' } } }))
  }

  function applySort() {
    if (!viewT) return
    setApp(s => ({ ...s, trips: s.trips.map(t => t.id === viewT.id ? { ...t, assignedIds: [...t.assignedIds].sort((a, b) => (s.girls[a]?.dist || 0) - (s.girls[b]?.dist || 0)) } : t) }))
  }

  function openGirlForm(id: string | null) {
    if (id) {
      const g = girls[id]
      setFGName(g.name); setFGArea(g.area); setFGDist(String(g.dist)); setFGAddr(g.addr); setFGColor(g.color)
    } else {
      setFGName(''); setFGArea(''); setFGDist(''); setFGAddr(''); setFGColor(GIRL_COLORS[0])
    }
    setFormGirlId(id)
    go('girl-form')
  }

  function saveGirl() {
    if (!fGName.trim()) return
    const id = formGirlId || Date.now().toString(36)
    const g: Girl = { name: fGName.trim(), area: fGArea.trim(), dist: parseFloat(fGDist) || 0, addr: fGAddr.trim(), color: fGColor }
    setApp(s => ({ ...s, girls: { ...s.girls, [id]: g }, castDrops: formGirlId ? s.castDrops : { ...s.castDrops, [id]: g.addr } }))
    if (formGirlId) { go('girl-detail') } else { go('admin') }
  }

  function doDeleteGirl() {
    if (!selectedGirlId) return
    const id = selectedGirlId
    setShowDeleteConfirm(false)
    setApp(s => {
      const newGirls = { ...s.girls }; delete newGirls[id]
      const newReqs = { ...s.rideRequests }; delete newReqs[id]
      const newToday = { ...s.todayRequests }; delete newToday[id]
      const newDrops = { ...s.castDrops }; delete newDrops[id]
      return { ...s, girls: newGirls, rideRequests: newReqs, todayRequests: newToday, castDrops: newDrops, trips: s.trips.map(t => ({ ...t, assignedIds: t.assignedIds.filter(x => x !== id) })) }
    })
    go('admin')
  }

  function openDriverForm(id: string | null) {
    if (id) {
      const d = drivers[id]
      setFDName(d.name); setFDCar(d.car); setFDCarColor(d.carColor || ''); setFDPlate(d.plate)
    } else {
      setFDName(''); setFDCar(''); setFDCarColor(''); setFDPlate('')
    }
    setFormDrvId(id)
    go('driver-form')
  }

  function saveDriver() {
    if (!fDName.trim()) return
    const id = formDrvId || Date.now().toString(36)
    const d: DriverInfo = { name: fDName.trim(), initial: fDName.trim()[0] || '?', car: fDCar.trim(), carColor: fDCarColor.trim() || undefined, plate: fDPlate.trim() }
    setApp(s => ({ ...s, drivers: { ...s.drivers, [id]: d }, driverStatuses: formDrvId ? s.driverStatuses : { ...s.driverStatuses, [id]: '待機中' } }))
    if (formDrvId) { go('driver-detail') } else { go('admin') }
  }

  function doDeleteDriver() {
    if (!selectedDrvId) return
    const id = selectedDrvId
    setShowDeleteConfirm(false)
    setApp(s => {
      const newDrivers = { ...s.drivers }; delete newDrivers[id]
      const newSt = { ...s.driverStatuses }; delete newSt[id]
      return { ...s, drivers: newDrivers, driverStatuses: newSt, trips: s.trips.map(t => t.driverKey === id ? { ...t, driverKey: null } : t) }
    })
    go('admin')
  }

  const isAdminScreen = ['admin', 'girl-detail', 'driver-detail', 'girl-form', 'driver-form'].includes(screen)

  const nav = (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, zIndex: 40, background: '#ffffff', borderTop: '1px solid #efefef', padding: '10px 14px 24px', display: 'flex', justifyContent: 'space-around', boxSizing: 'border-box' }}>
      <div onClick={() => go('home')} role="button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: !isAdminScreen ? '#0a0a0a' : '#b5b5b5', flex: 1 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l1.6-4.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.5L19 13m-14 0h14v4a1 1 0 0 1-1 1h-1.2a1.8 1.8 0 1 1-3.6 0H9.8a1.8 1.8 0 1 1-3.6 0H5a1 1 0 0 1-1-1v-4h1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        <span style={{ fontSize: 10.5, fontWeight: 700 }}>配車</span>
      </div>
      <div onClick={() => go('admin')} role="button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: isAdminScreen ? '#0a0a0a' : '#b5b5b5', flex: 1 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" /><rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" /><rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" /><rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" /></svg>
        <span style={{ fontSize: 10.5, fontWeight: 700 }}>管理</span>
      </div>
    </div>
  )

  /* ====== HOME ====== */
  if (screen === 'home') return (
    <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '52px 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 14px' }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#8a8a8a', letterSpacing: '.04em' }}>CLUB VENUS・KING ・ ボーイ</p>
          <h1 style={{ margin: '2px 0 0', fontSize: 30, fontWeight: 800, letterSpacing: '-.02em' }}>配車</h1>
        </div>
        <button onClick={logout} style={{ height: 38, padding: '0 14px', borderRadius: 10, background: '#f4f4f4', border: 'none', color: '#5a5a5a', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>ログアウト</button>
      </div>

      <div style={{ padding: '0 20px' }}>
        <button onClick={() => go('new')} style={{ width: '100%', height: 58, borderRadius: 16, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: '0 8px 20px -8px rgba(0,0,0,.5)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /></svg>
          配車を依頼する
        </button>

        <p style={{ margin: '26px 4px 10px', fontSize: 13, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>本日の便</p>

        {tripsList.length > 0 ? tripsList.map(trip => (
          <div key={trip.id} onClick={() => { setViewingTripId(trip.id); go('status') }} role="button" style={{ border: '1px solid #ededed', borderRadius: 18, padding: 16, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,.04)', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06c167', animation: 'lm-pulse 1.6s infinite', flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' }}>{trip.label}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#0a0a0a', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>{trip.status}</span>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
              <div><p style={{ margin: 0, fontSize: 10, color: '#9a9a9a', fontWeight: 600 }}>出発</p><p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700 }}>{trip.departTime}</p></div>
              <div style={{ width: 1, background: '#eee' }} />
              <div><p style={{ margin: 0, fontSize: 10, color: '#9a9a9a', fontWeight: 600 }}>乗車</p><p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700 }}>{trip.assignedCount}名</p></div>
              <div style={{ width: 1, background: '#eee' }} />
              <div style={{ minWidth: 0, flex: 1 }}><p style={{ margin: 0, fontSize: 10, color: '#9a9a9a', fontWeight: 600 }}>ドライバー</p><p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.driverName}</p></div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {trip.castObjs.map((co, i) => <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: co.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, border: '2px solid #fff', marginLeft: i === 0 ? 0 : -6, flexShrink: 0 }}>{co.initial}</div>)}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden' }}><div style={{ height: '100%', background: '#0a0a0a', borderRadius: 3, width: trip.progressPct }} /></div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6a6a6a', whiteSpace: 'nowrap' }}>{trip.dropsDone}/{trip.dropsTotal}</span>
              </div>
            </div>
          </div>
        )) : (
          <div style={{ border: '1px solid #ededed', borderRadius: 18, padding: 28, textAlign: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 10, opacity: .3 }}><path d="M5 13l1.6-4.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.5L19 13m-14 0h14v4a1 1 0 0 1-1 1h-1.2a1.8 1.8 0 1 1-3.6 0H9.8a1.8 1.8 0 1 1-3.6 0H5a1 1 0 0 1-1-1v-4h1Z" stroke="#0a0a0a" strokeWidth="1.8" strokeLinejoin="round" /></svg>
            <p style={{ margin: 0, fontSize: 14, color: '#b0b0b0', fontWeight: 600 }}>まだ配車依頼がありません</p>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#c8c8c8' }}>上の「配車を依頼する」から作成してください</p>
          </div>
        )}

        {todayReqList.map(req => (
          <div key={req.castId} style={{ marginTop: 10, border: '1px solid #ffe3b8', background: '#fff8ed', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: req.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{req.initial}</div>
            <div style={{ flex: 1, minWidth: 0 }}><p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#8a5a00' }}>{req.castName} ：{req.place}</p><p style={{ margin: '2px 0 0', fontSize: 11, color: '#c77700' }}>{req.status}</p></div>
            <button onClick={() => approveTodayReq(req.castId)} style={{ height: 32, padding: '0 12px', borderRadius: 999, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>承認</button>
          </div>
        ))}

        {pendingRequests.length > 0 && (
          <div style={{ marginTop: 12, background: '#0a0a0a', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>{pendingRequests.length}名の乗車リクエスト</p>
              <button onClick={() => go('new')} style={{ height: 32, padding: '0 13px', borderRadius: 999, background: '#fff', color: '#0a0a0a', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>配車を作成 →</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {pendingRequests.map((r, i) => <div key={r.id} style={{ width: 28, height: 28, borderRadius: '50%', background: r.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, border: '2px solid #0a0a0a', marginLeft: i === 0 ? 0 : -5 }}>{r.initial}</div>)}
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#9a9a9a', lineHeight: 1.4 }}>配車依頼作成時に選択できます</p>
            </div>
          </div>
        )}
      </div>
      {nav}
    </div>
  )

  /* ====== NEW ====== */
  if (screen === 'new') return (
    <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '52px 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
      <div style={{ height: 4, background: '#f0f0f0' }}><div style={{ height: '100%', width: '50%', background: '#0a0a0a', borderRadius: '0 2px 2px 0' }} /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 14px' }}>
        <BackBtn onClick={() => go('home')} />
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.01em' }}>配車依頼</h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        <p style={{ margin: '8px 4px 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>乗車するキャストを選択</p>

        {pendingRequests.length > 0 ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingRequests.map(r => (
                <div key={r.id} onClick={() => toggleCastSelect(r.id)} role="button" style={{ borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', border: r.selected ? '2px solid #0a0a0a' : '1px solid #ededed' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: r.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{r.initial}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{r.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9a9a9a' }}>{r.area} ・ {r.distLabel}</p>
                  </div>
                  {r.selected
                    ? <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="13" height="13" viewBox="0 0 24 24"><path d="m5 12 4 4 10-10" stroke="#fff" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                    : <div style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid #e0e0e0', flexShrink: 0 }} />}
                </div>
              ))}
            </div>
            <p style={{ margin: '10px 4px 0', fontSize: 12.5, color: '#9a9a9a' }}>{tripDraftIds.length}名を選択中　・　お店から近い順に降車ルートを自動設定します</p>
          </>
        ) : (
          <div style={{ border: '1px solid #ededed', borderRadius: 14, padding: 24, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, color: '#b0b0b0', fontWeight: 600 }}>乗車リクエストがありません</p>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#c8c8c8' }}>キャストがリクエストを送ると<br />ここに表示されます</p>
          </div>
        )}

        <p style={{ margin: '24px 4px 10px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>出発予定時刻</p>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1, color: '#0a0a0a' }}>{draftDepartStr}</span>
            {draftDepartNow
              ? <span onClick={() => setDraftDepartNow(false)} role="button" style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, whiteSpace: 'nowrap', flexShrink: 0 }}>時間を指定する</span>
              : <span onClick={() => setDraftDepartNow(true)} role="button" style={{ fontSize: 13, fontWeight: 600, color: '#9a9a9a', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, whiteSpace: 'nowrap', flexShrink: 0 }}>今すぐに戻す</span>}
          </div>
          <div style={{ height: 1, background: '#efefef', margin: '14px 0' }} />
          {draftDepartNow
            ? <p style={{ margin: 0, fontSize: 12.5, color: '#c0c0c0', fontWeight: 500 }}>出発準備ができ次第すぐに出発します</p>
            : <div style={{ display: 'flex', gap: 8 }}>
              {([[-15, '−15分'], [-5, '−5分'], [5, '+5分'], [15, '+15分']] as [number, string][]).map(([d, l]) => (
                <button key={l} onClick={() => addMinutes(d)} style={{ flex: 1, height: 40, borderRadius: 999, background: '#f2f2f2', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#3a3a3a' }}>{l}</button>
              ))}
            </div>}
        </div>

        <button onClick={confirmTrip} style={{ marginTop: 28, width: '100%', height: 56, borderRadius: 15, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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
      .map(id => { const g = girls[id] || { name: '?', area: '', dist: 0, addr: '', color: '#aaa' }; return { id, ...g, initial: g.name[0] } })
      .sort((a, b) => a.dist - b.dist)
    return (
      <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '52px 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
        <div style={{ height: 4, background: '#f0f0f0' }}><div style={{ height: '100%', width: '100%', background: '#0a0a0a' }} /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 14px' }}>
          <BackBtn onClick={() => go('new')} />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.01em' }}>ドライバーを指定</h1>
        </div>

        <div style={{ padding: '0 20px' }}>
          <div style={{ background: '#f7f7f7', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#9a9a9a', fontWeight: 600 }}>作成した便</p>
              <p style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800 }}>{orderedDraft.length ? orderedDraft.map(g => g.area.split('（')[0]).join('・') : '（未選択）'}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {orderedDraft.map((g, i) => <div key={g.id} style={{ width: 32, height: 32, borderRadius: '50%', background: g.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, border: '2px solid #f7f7f7', marginLeft: i === 0 ? 0 : -7 }}>{g.initial}</div>)}
              <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 700, color: '#5a5a5a' }}>{orderedDraft.length}名</span>
            </div>
          </div>

          <p style={{ margin: '0 4px 12px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>担当ドライバーを選んでください</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.keys(drivers).map(key => {
              const drv = drivers[key]; const st = app.driverStatuses[key] || '待機中'; const cfg = DRIVER_STATUS_CONFIG[st] || DRIVER_STATUS_CONFIG['待機中']; const isCurrent = draftDriverKey === key; const canAssign = cfg.available
              return (
                <div key={key} onClick={() => { if (canAssign) setDraftDriverKey(key) }} role="button" style={{ borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 14, cursor: canAssign ? 'pointer' : 'not-allowed', border: isCurrent ? '2px solid #0a0a0a' : '1px solid #ededed', background: !canAssign ? '#f9f9f9' : '#fff', opacity: !canAssign ? 0.55 : 1 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1a1a1a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>{drv.initial}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{drv.name}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#9a9a9a' }}>{drv.car}{drv.carColor ? `（${drv.carColor}）` : ''}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{st}</span>
                      {!canAssign && <span style={{ fontSize: 11, color: '#b0b0b0' }}>・ 依頼不可</span>}
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

          <div onClick={() => setDraftLastTrip(v => !v)} role="button" style={{ marginTop: 20, borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, cursor: 'pointer', border: draftLastTrip ? '2px solid #0a0a0a' : '1px solid #ededed', background: draftLastTrip ? '#fafafa' : '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginTop: 2, flexShrink: 0 }}><path d="M4 4v16m0-12h12l-3 4 3 4H4" stroke={draftLastTrip ? '#0a0a0a' : '#c0c0c0'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>最後の便にする</p>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9a9a9a' }}>送迎完了後、ドライバーを自動で「終了」に変更します</p>
              </div>
            </div>
            <div style={{ width: 44, height: 26, borderRadius: 999, background: draftLastTrip ? '#0a0a0a' : '#e0e0e0', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: draftLastTrip ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
            </div>
          </div>

          <button onClick={finalizeTrip} style={{ marginTop: 20, width: '100%', height: 56, borderRadius: 15, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m5 12 4 4 10-10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            配車依頼を確定する
          </button>
          <p style={{ margin: '10px 4px 0', fontSize: 12, color: '#a0a0a0', textAlign: 'center' }}>ドライバー未選択でも確定できます。あとで変更可能。</p>
        </div>
        {nav}
      </div>
    )
  }

  /* ====== STATUS ====== */
  if (screen === 'status') return (
    <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '52px 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 14px' }}>
        <BackBtn onClick={() => go('home')} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#9a9a9a' }}>{viewT ? '便 #' + viewT.id : ''}</p>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.01em' }}>便の詳細</h1>
        </div>
        <button onClick={() => go('edit')} style={{ height: 36, padding: '0 14px', borderRadius: 10, background: '#f4f4f4', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7m-1.5-9.5a2.1 2.1 0 0 1 3 3L12 16l-4 1 1-4 8.5-8.5Z" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          編集
        </button>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ background: '#0a0a0a', borderRadius: 18, padding: 18, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#a8a8a8', fontWeight: 600 }}>{viewT ? '便 #' + viewT.id : ''}</p>
              <p style={{ margin: '3px 0 0', fontSize: 22, fontWeight: 800, letterSpacing: '-.01em' }}>{vStatus}</p>
            </div>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#06c167', animation: 'lm-pulse 1.6s infinite', display: 'inline-block' }} />
          </div>
          {vDrv ? (
            <div style={{ marginTop: 16, background: '#1a1a1a', borderRadius: 13, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#333', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>{vDrv.initial}</div>
                <div style={{ flex: 1, minWidth: 0 }}><p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{vDrv.name}</p><p style={{ margin: '1px 0 0', fontSize: 12, color: '#9a9a9a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vDrv.car}{vDrv.carColor ? `（${vDrv.carColor}）` : ''} ・ {vDrv.plate}</p></div>
                <span onClick={() => viewT && unassignDriver(viewT.id)} role="button" style={{ fontSize: 11.5, color: '#6e6e6e', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, whiteSpace: 'nowrap', flexShrink: 0 }}>変更</span>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 16, background: '#1a1a1a', borderRadius: 13, padding: 12 }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#9a9a9a', letterSpacing: '.04em' }}>ドライバーを指定</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.keys(drivers).map(key => {
                  const drv = drivers[key]; const st = app.driverStatuses[key] || '待機中'; const cfg = DRIVER_STATUS_CONFIG[st] || DRIVER_STATUS_CONFIG['待機中']; const isCurrent = viewT?.driverKey === key; const canAssign = cfg.available
                  return (
                    <div key={key} onClick={() => { if (canAssign && viewT) assignDriver(viewT.id, key) }} role="button" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: '#252525', cursor: 'pointer', border: isCurrent ? '2px solid #06c167' : '1px solid #333' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#3a3a3a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{drv.initial}</div>
                      <div style={{ flex: 1, minWidth: 0 }}><p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>{drv.name}</p><p style={{ margin: '1px 0 0', fontSize: 11.5, color: '#9a9a9a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{drv.car}</p></div>
                      {isCurrent ? <svg width="16" height="16" viewBox="0 0 24 24"><path d="m5 12 4 4 10-10" stroke="#06c167" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #444' }} />}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#2a2a2a', overflow: 'hidden' }}><div style={{ height: '100%', background: '#06c167', borderRadius: 3, width: vTotal ? Math.round(vDone / vTotal * 100) + '%' : '0%' }} /></div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#cfcfcf' }}>降車 {vDone}/{vTotal}</span>
          </div>
        </div>

        {vTodayReq && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, background: '#fff8ed', border: '1px solid #ffe3b8', borderRadius: 14, padding: '12px 14px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 8v5m0 3h.01M10.3 3.9 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke="#c77700" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <p style={{ margin: 0, fontSize: 13, color: '#8a5a00', lineHeight: 1.4, flex: 1 }}><b>{vTodayCastId ? girls[vTodayCastId]?.name : ''}</b>：本日のみ「{vTodayReq.place}」へ変更申請（{vTodayReq.status}）</p>
          </div>
        )}

        <p style={{ margin: '24px 4px 10px', fontSize: 13, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>降車ルート</p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {vObjs.map((g, i) => (
            <div key={g.id} style={{ display: 'flex', gap: 13 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
                {g.done ? <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#06c167', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="12" height="12" viewBox="0 0 24 24"><path d="m5 12 4 4 10-10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                  : g.current ? <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0, animation: 'lm-pulse 1.4s infinite' }}>{g.dropNo}</div>
                  : <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#fff', border: '2px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b0b0b0', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{g.dropNo}</div>}
                {i < vObjs.length - 1 && <div style={{ width: 2, flex: 1, background: '#eee', minHeight: 18 }} />}
              </div>
              <div style={{ flex: 1, paddingBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{g.name}</span>
                  {g.done && <span style={{ fontSize: 11, fontWeight: 700, color: '#06c167' }}>降車済み</span>}
                  {g.current && <span style={{ fontSize: 11, fontWeight: 700, color: '#0a0a0a' }}>次の降車</span>}
                </div>
                <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#9a9a9a' }}>{g.addr}</p>
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
    <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '52px 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 14px' }}>
        <BackBtn onClick={() => go('status')} />
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.01em' }}>便を編集</h1>
      </div>

      {app.trips.length > 0 && (
        <div style={{ padding: '0 20px', display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
          {app.trips.map(t => {
            const isActive = viewingTripId === t.id
            return (
              <div key={t.id} onClick={() => setViewingTripId(t.id)} role="button" style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 999, cursor: 'pointer', border: isActive ? '2px solid #0a0a0a' : '1px solid #e0e0e0', background: isActive ? '#0a0a0a' : '#fff', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: isActive ? '#fff' : '#3a3a3a' }}>便 #{t.id}</span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: isActive ? '#a8a8a8' : '#b0b0b0' }}>{t.departTime}</span>
              </div>
            )
          })}
        </div>
      )}

      {app.trips.length === 0 && (
        <div style={{ margin: '0 20px 16px', border: '1px solid #ededed', borderRadius: 14, padding: 20, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, color: '#b0b0b0', fontWeight: 600 }}>まだ便がありません</p>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#c8c8c8' }}>配車タブから便を作成してください</p>
        </div>
      )}

      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '6px 0 10px' }}>
          <p style={{ margin: '0 4px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>降車順（{vTotal}名）</p>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#06c167', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="m5 12 4 4 10-10" stroke="#06c167" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            近い順 適用済み
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {vObjs.map(g => (
            <div key={g.id} style={{ border: '1px solid #ededed', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 24, height: 24, borderRadius: 8, background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{g.dropNo}</span>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: g.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>{g.initial}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{g.name}</p>
                <p style={{ margin: '1px 0 0', fontSize: 12, color: '#9a9a9a', fontWeight: 500 }}>{g.area} ・ 店から {g.dist.toFixed(1)}km</p>
              </div>
              <button onClick={() => viewT && removeGirlFromTrip(viewT.id, g.id)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#f4f4f4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="#8a8a8a" strokeWidth="2.2" strokeLinecap="round" /></svg>
              </button>
            </div>
          ))}
        </div>

        <button onClick={applySort} style={{ marginTop: 12, width: '100%', height: 48, borderRadius: 13, background: '#f4f4f4', border: 'none', color: '#0a0a0a', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 7h13M3 12h9M3 17h5m11-9v11m0 0 3-3m-3 3-3-3" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          お店から近い順に自動で並び替え
        </button>

        {suggestions.length > 0 && (
          <div style={{ marginTop: 22, background: '#0a0a0a', borderRadius: 18, padding: 16, color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-13.2-1.4 1.4m-10 10-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
              <span style={{ fontSize: 14, fontWeight: 700 }}>自動提案</span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#a8a8a8', lineHeight: 1.5 }}>同じ方面・お店から近いキャストの同乗をおすすめします。</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {suggestions.slice(0, 3).map(s => (
                <div key={s.id} style={{ background: '#1a1a1a', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{s.initial}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{s.name}</p>
                    <p style={{ margin: '1px 0 0', fontSize: 11.5, color: '#9a9a9a' }}>{s.area} ・ {s.distLabel}</p>
                  </div>
                  <button onClick={() => addGirlToTrip(viewT?.id ?? null, s.id)} style={{ height: 34, padding: '0 14px', borderRadius: 999, background: '#fff', color: '#0a0a0a', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>＋ 追加</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => go('status')} style={{ marginTop: 24, width: '100%', height: 56, borderRadius: 15, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>編集を完了</button>
      </div>
      {nav}
    </div>
  )

  /* ====== GIRL DETAIL ====== */
  if (screen === 'girl-detail') {
    const g = selectedGirlId ? girls[selectedGirlId] : null
    if (!g || !selectedGirlId) return null
    const onTrip = approvedSet.has(selectedGirlId)
    return (
      <div style={{ position: 'relative', minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '0 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 14px' }}>
          <BackBtn onClick={() => go('admin')} />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.01em' }}>キャスト詳細</h1>
        </div>
        <div style={{ padding: '0 20px' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: g.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 28, flexShrink: 0 }}>{g.name[0]}</div>
              <div>
                <p style={{ margin: 0, fontSize: 36, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1 }}>{g.name}</p>
                <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', background: onTrip ? '#0a0a0a' : '#f0f0f0', padding: '5px 13px', borderRadius: 999 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: onTrip ? '#fff' : '#8a8a8a' }}>{onTrip ? '乗車中' : '待機中'}</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #f0f0f0' }}>
            <InfoRow label="エリア"><p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{g.area || '未登録'}</p></InfoRow>
            <InfoRow label="店からの距離"><p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{g.dist.toFixed(1)} <span style={{ fontSize: 14, fontWeight: 600, color: '#6a6a6a' }}>km</span></p></InfoRow>
            <InfoRow label="住所" last><p style={{ margin: 0, fontSize: 16, fontWeight: 600, lineHeight: 1.55 }}>{g.addr || '未登録'}</p></InfoRow>
          </div>
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => openGirlForm(selectedGirlId)} style={{ width: '100%', height: 56, borderRadius: 15, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: font, boxShadow: '0 8px 20px -8px rgba(0,0,0,.5)' }}>編集する</button>
            <button onClick={() => setShowDeleteConfirm(true)} style={{ width: '100%', height: 48, borderRadius: 15, background: '#fff', color: '#9a9a9a', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: font, textDecoration: 'underline', textUnderlineOffset: 3 }}>削除する</button>
          </div>
        </div>
        {showDeleteConfirm && <DeleteOverlay name={g.name} color={g.color} initial={g.name[0]} onDelete={doDeleteGirl} onCancel={() => setShowDeleteConfirm(false)} />}
        {nav}
      </div>
    )
  }

  /* ====== DRIVER DETAIL ====== */
  if (screen === 'driver-detail') {
    const d = selectedDrvId ? drivers[selectedDrvId] : null
    if (!d || !selectedDrvId) return null
    const dSt = app.driverStatuses[selectedDrvId] || '待機中'
    const dCfg = DRIVER_STATUS_CONFIG[dSt] || DRIVER_STATUS_CONFIG['待機中']
    const isActive = !dCfg.available
    const colorCSS = d.carColor ? (CAR_COLOR_MAP[d.carColor] || '#d0d0d0') : null
    return (
      <div style={{ position: 'relative', minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '0 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 14px' }}>
          <BackBtn onClick={() => go('admin')} />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.01em' }}>ドライバー詳細</h1>
        </div>
        <div style={{ padding: '0 20px' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#1a1a1a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 28, flexShrink: 0 }}>{d.initial}</div>
              <div>
                <p style={{ margin: 0, fontSize: 36, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1 }}>{d.name}</p>
                <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: dCfg.color, display: 'inline-block', animation: isActive ? 'lm-pulse 1.6s infinite' : 'none' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: dCfg.color }}>{dSt}</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #f0f0f0' }}>
            <InfoRow label="車種"><p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{d.car || '未登録'}</p></InfoRow>
            {d.carColor ? (
              <InfoRow label="車の色">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {colorCSS && <div style={{ width: 24, height: 24, borderRadius: '50%', background: colorCSS, border: '1.5px solid #ddd', flexShrink: 0 }} />}
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{d.carColor}</p>
                </div>
              </InfoRow>
            ) : null}
            <InfoRow label="ナンバープレート" last><p style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '.04em' }}>{d.plate || '未登録'}</p></InfoRow>
          </div>
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => openDriverForm(selectedDrvId)} style={{ width: '100%', height: 56, borderRadius: 15, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: font, boxShadow: '0 8px 20px -8px rgba(0,0,0,.5)' }}>編集する</button>
            <button onClick={() => { if (!isActive) setShowDeleteConfirm(true) }} disabled={isActive} style={{ width: '100%', height: 48, borderRadius: 15, background: '#fff', color: isActive ? '#c8c8c8' : '#9a9a9a', border: 'none', fontSize: 14, fontWeight: 600, cursor: isActive ? 'not-allowed' : 'pointer', fontFamily: font, textDecoration: isActive ? 'none' : 'underline', textUnderlineOffset: 3 }}>
              {isActive ? '削除する（運行中のため不可）' : '削除する'}
            </button>
          </div>
        </div>
        {showDeleteConfirm && <DeleteOverlay name={d.name} color="#1a1a1a" initial={d.initial} onDelete={doDeleteDriver} onCancel={() => setShowDeleteConfirm(false)} />}
        {nav}
      </div>
    )
  }

  /* ====== GIRL FORM ====== */
  if (screen === 'girl-form') return (
    <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '0 0 48px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 14px' }}>
        <BackBtn onClick={() => { if (formGirlId) { go('girl-detail') } else { go('admin') } }} />
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{formGirlId ? `${girls[formGirlId]?.name || ''}を編集` : 'キャストを追加'}</h1>
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
          <p style={{ margin: '8px 2px 0', fontSize: 12, color: '#b0b0b0', lineHeight: 1.5 }}>住所はドライバーへの案内・距離計算に使用します</p>
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
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: fGColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>{fGName[0] || '?'}</div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{fGName || '（名前未入力）'}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9a9a9a' }}>{fGArea || '（エリア未入力）'} ・ {fGDist || '0'}km</p>
          </div>
        </div>
        <button onClick={saveGirl} style={{ height: 56, borderRadius: 15, background: fGName.trim() ? '#0a0a0a' : '#d0d0d0', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: fGName.trim() ? 'pointer' : 'default', fontFamily: font }}>
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
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{formDrvId ? `${drivers[formDrvId]?.name || ''}を編集` : 'ドライバーを追加'}</h1>
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
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#2a2a2a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>{fDName[0] || '?'}</div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{fDName || '（名前未入力）'}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9a9a9a' }}>{fDCar || '（車種未入力）'}{fDCarColor ? `（${fDCarColor}）` : ''}</p>
          </div>
        </div>
        <button onClick={saveDriver} style={{ height: 56, borderRadius: 15, background: fDName.trim() ? '#0a0a0a' : '#d0d0d0', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: fDName.trim() ? 'pointer' : 'not-allowed', fontFamily: font }}>
          {formDrvId ? '変更を保存' : '登録する'}
        </button>
      </div>
    </div>
  )

  /* ====== ADMIN ====== */
  const girlKeys = Object.keys(girls)
  const driverKeys = Object.keys(drivers)
  const avatarGirls = girlKeys.slice(0, 4).map(id => ({ id, color: girls[id].color, initial: girls[id].name[0] }))

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '0 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 16px' }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#8a8a8a', letterSpacing: '.04em' }}>CLUB VENUS・KING・ボーイ</p>
          <h1 style={{ margin: '2px 0 0', fontSize: 30, fontWeight: 800, letterSpacing: '-.02em' }}>管理</h1>
        </div>
        <button onClick={logout} style={{ height: 38, padding: '0 14px', borderRadius: 10, background: '#f4f4f4', border: 'none', color: '#5a5a5a', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>ログアウト</button>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ background: '#0a0a0a', borderRadius: 16, padding: '16px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#666' }}>本日の在籍</p>
            <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>キャスト {girlKeys.length}名 · ドライバー {driverKeys.length}名</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {avatarGirls.map((g, i) => (
              <div key={g.id} style={{ width: 28, height: 28, borderRadius: '50%', background: g.color, border: '2px solid #0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', marginLeft: i === 0 ? 0 : -6 }}>{g.initial}</div>
            ))}
            {girlKeys.length > 4 && <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2a2a2a', border: '2px solid #0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#9a9a9a', marginLeft: -6 }}>…</div>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>キャスト一覧</p>
          <button onClick={() => openGirlForm(null)} style={{ height: 30, padding: '0 12px', borderRadius: 999, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" /></svg>
            追加
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {girlKeys.map(id => {
            const g = girls[id]; const onTrip = approvedSet.has(id)
            return (
              <div key={id} onClick={() => { setSelectedGirlId(id); setShowDeleteConfirm(false); go('girl-detail') }} role="button" style={{ border: '1px solid #ededed', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: g.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>{g.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{g.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9a9a9a' }}>{g.area} ・ 店から {g.dist.toFixed(1)}km</p>
                </div>
                {onTrip
                  ? <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', background: '#0a0a0a', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>乗車中</span>
                  : <span style={{ fontSize: 11.5, fontWeight: 700, color: '#b0b0b0', whiteSpace: 'nowrap', flexShrink: 0 }}>待機中</span>}
                <svg width="7" height="12" viewBox="0 0 7 12"><path d="M1 1l5 5-5 5" stroke="#c0c0c0" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>ドライバー一覧</p>
          <button onClick={() => openDriverForm(null)} style={{ height: 30, padding: '0 12px', borderRadius: 999, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" /></svg>
            追加
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {driverKeys.map(key => {
            const d = drivers[key]; const st = app.driverStatuses[key] || '待機中'; const cfg = DRIVER_STATUS_CONFIG[st] || DRIVER_STATUS_CONFIG['待機中']; const isActive = !cfg.available
            return (
              <div key={key} onClick={() => { setSelectedDrvId(key); setShowDeleteConfirm(false); go('driver-detail') }} role="button" style={{ border: '1px solid #ededed', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#2a2a2a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>{d.initial}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{d.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9a9a9a' }}>{d.car}{d.carColor ? `（${d.carColor}）` : ''}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 12, color: '#9a9a9a' }}>{d.plate}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  {isActive && <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, display: 'inline-block', animation: 'lm-pulse 1.6s infinite' }} />}
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: isActive ? cfg.color : '#b0b0b0', whiteSpace: 'nowrap' }}>{isActive ? '運行中' : '待機中'}</span>
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
