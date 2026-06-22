'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSnapshot } from '@/lib/useSnapshot'
import * as db from '@/lib/db'
import {
  buildTripObjs,
  calcReturnTime,
  makeTripLabel,
  estMinLabel,
  tripDotColor,
  driverStatusConfig,
  type Trip,
} from '@/lib/types'

/* ============================ アイコン ============================ */
type IP = { size?: number; w?: number; h?: number; color?: string; sw?: number }
const Check = ({ size = 16, color = '#fff', sw = 2.6 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="m5 12 4 4 10-10" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Plus = ({ size = 18, color = '#fff', sw = 2.2 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke={color} strokeWidth={sw} strokeLinecap="round" />
  </svg>
)
const ArrowR = ({ size = 18, color = '#fff', sw = 2 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14m-6-6 6 6-6 6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Back = ({ color = '#0a0a0a' }: IP) => (
  <svg width="9" height="15" viewBox="0 0 9 15">
    <path d="M8 1 2 7.5 8 14" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const ChevR = ({ color = '#c0c0c0' }: IP) => (
  <svg width="7" height="12" viewBox="0 0 7 12" style={{ flexShrink: 0 }}>
    <path d="M1 1l5 5-5 5" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Caret = ({ up = false, color = '#9a9a9a' }: { up?: boolean; color?: string }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" style={{ marginLeft: 'auto' }}>
    <path d={up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Car = ({ size = 24, color = '#0a0a0a', sw = 1.8 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 13l1.6-4.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.5L19 13m-14 0h14v4a1 1 0 0 1-1 1h-1.2a1.8 1.8 0 1 1-3.6 0H9.8a1.8 1.8 0 1 1-3.6 0H5a1 1 0 0 1-1-1v-4h1Z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
  </svg>
)
const Spark = ({ size = 17, color = '#fff' }: IP) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-13.2-1.4 1.4m-10 10-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)
const Clock = ({ size = 16, color = '#9a9a9a', sw = 1.8 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={sw} />
    <path d="M12 7.5V12l3 2" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Pin = ({ size = 20, color = '#0a0a0a', sw = 1.8 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
    <circle cx="12" cy="10" r="2.4" stroke={color} strokeWidth={sw} />
  </svg>
)
const Edit = ({ size = 14, color = '#0a0a0a', sw = 1.8 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7m-1.5-9.5a2.1 2.1 0 0 1 3 3L12 16l-4 1 1-4 8.5-8.5Z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const X = ({ size = 12, color = '#8a8a8a', sw = 2.2 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M6 6l12 12M18 6 6 18" stroke={color} strokeWidth={sw} strokeLinecap="round" />
  </svg>
)
const Flag = ({ size = 20, color = '#0a0a0a', sw = 1.9 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ marginTop: 2, flexShrink: 0 }}>
    <path d="M4 4v16m0-12h12l-3 4 3 4H4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Warn = ({ size = 18, color = '#c77700', sw = 1.8 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 8v5m0 3h.01M10.3 3.9 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const HomeIcon = ({ color = 'currentColor' }: IP) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M4 11 12 4l8 7m-14-1v8a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Gear = ({ color = 'currentColor' }: IP) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth="1.8" />
    <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
const Grid = ({ color = 'currentColor' }: IP) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="8" height="8" rx="2" stroke={color} strokeWidth="1.8" />
    <rect x="13" y="3" width="8" height="8" rx="2" stroke={color} strokeWidth="1.8" />
    <rect x="3" y="13" width="8" height="8" rx="2" stroke={color} strokeWidth="1.8" />
    <rect x="13" y="13" width="8" height="8" rx="2" stroke={color} strokeWidth="1.8" />
  </svg>
)
const Doc = ({ color = 'currentColor' }: IP) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M8 4h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8m0-16-4 4m4-4v16m0 0-4-4M9 9h6M9 13h4" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* ============================ 共通部品 ============================ */
function Avatar({ bg, label, size = 40, fs = 16, border }: { bg: string; label: string; size?: number; fs?: number; border?: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: fs, flexShrink: 0, border }}>
      {label}
    </div>
  )
}

const BackBtn = ({ onClick, dark = false }: { onClick: () => void; dark?: boolean }) => (
  <button onClick={onClick} style={{ width: 38, height: 38, borderRadius: 11, background: dark ? '#1a1a1a' : '#f4f4f4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <Back color={dark ? '#fff' : '#0a0a0a'} />
  </button>
)

const dark0 = '#0a0a0a'

/* ============================ メイン ============================ */
export default function App() {
  const { snap, ready, reload } = useSnapshot()
  const { girls, drivers, girlOrder, driverOrder, trips, rideRequests, todayRequests, driverStatuses } = snap

  // ローカル（セッション）状態
  const [role, setRole] = useState('')
  const [screen, setScreen] = useState('login')
  const [loginCode, setLoginCode] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [castId, setCastId] = useState('miki')
  const [driverKey, setDriverKey] = useState('sato')
  const [loading, setLoading] = useState(false)

  const [tripDraftIds, setTripDraftIds] = useState<string[]>([])
  const [draftDriverKey, setDraftDriverKey] = useState<string | null>(null)
  const [draftLastTrip, setDraftLastTrip] = useState(false)
  const [draftDepartNow, setDraftDepartNow] = useState(true)
  const [draftDepartHour, setDraftDepartHour] = useState(1)
  const [draftDepartMin, setDraftDepartMin] = useState(0)

  const [viewingTripId, setViewingTripId] = useState<number | null>(null)
  const [driverActiveTripId, setDriverActiveTripId] = useState<number | null>(null)
  const [selectedCastId, setSelectedCastId] = useState<string | null>(null)
  const [selectedDriverKey, setSelectedDriverKey] = useState<string | null>(null)
  const [adminDeleteType, setAdminDeleteType] = useState<'cast' | 'driver' | null>(null)

  const [justCreatedTripId, setJustCreatedTripId] = useState<number | null>(null)
  const [countdownActive, setCountdownActive] = useState(false)
  const [countdownRemaining, setCountdownRemaining] = useState(10)

  const [suggestOpenNew, setSuggestOpenNew] = useState(false)
  const [suggestOpenEdit, setSuggestOpenEdit] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)

  const [dropDraft, setDropDraft] = useState('')
  const [dropSaved, setDropSaved] = useState(false)
  const [reqPlace, setReqPlace] = useState('')
  const [reqReason, setReqReason] = useState('')

  const darkUI = role === 'driver' || screen === 'login'

  // 画面遷移（軽いスケルトン演出）
  const go = (s: string) => {
    setScreen(s)
    setLoading(true)
    setTimeout(() => setLoading(false), 350)
  }

  // カウントダウン
  useEffect(() => {
    if (!countdownActive) return
    if (countdownRemaining <= 0) {
      setCountdownActive(false)
      return
    }
    const t = setTimeout(() => setCountdownRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [countdownActive, countdownRemaining])

  // 画面のテーマ（ダーク/ライト）に土台（html/body）とSafariのバー色を同期させる
  const themeBg = !ready ? '#ffffff' : darkUI ? '#0a0a0a' : '#ffffff'
  useEffect(() => {
    document.documentElement.style.backgroundColor = themeBg
    document.body.style.backgroundColor = themeBg
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = themeBg
  }, [themeBg])

  const act = async (fn: () => Promise<unknown>) => {
    await fn()
    reload()
  }

  /* ---------- ログイン ---------- */
  const doLogin = () => {
    const c = loginCode.trim().toLowerCase()
    const map: Record<string, [string, string]> = {
      boy: ['boy', 'boy-home'],
      cast: ['cast', 'cast-home'],
      driver: ['driver', 'driver-offer'],
    }
    if (map[c]) {
      setRole(map[c][0])
      go(map[c][1])
      setLoginErr('')
    } else {
      setLoginErr(loginCode ? '招待コードが正しくありません' : '招待コードを入力してください')
    }
  }
  const quickBoy = () => {
    setRole('boy')
    go('boy-home')
  }
  const quickDriverAs = (key: string) => {
    setDriverKey(key)
    setRole('driver')
    go('driver-offer')
  }
  const quickCastAs = (id: string) => {
    setCastId(id)
    const g = girls[id]
    setDropDraft(g?.drop_address || g?.addr || '')
    setDropSaved(false)
    setRole('cast')
    go('cast-home')
  }
  const logout = () => {
    setRole('')
    setScreen('login')
    setLoginCode('')
    setLoginErr('')
    setCountdownActive(false)
  }

  /* ---------- 派生値 ---------- */
  const approvedSet = useMemo(() => new Set(trips.flatMap((t) => t.assigned_ids)), [trips])

  const pendingRequests = useMemo(() => {
    return Object.keys(rideRequests)
      .filter((id) => rideRequests[id] === 'approved' && !approvedSet.has(id) && girls[id])
      .map((id) => {
        const g = girls[id]
        const sel = tripDraftIds.includes(id)
        return { ...g, initial: g.name[0], distLabel: g.dist.toFixed(1) + 'km', selected: sel }
      })
      .sort((a, b) => a.dist - b.dist)
  }, [rideRequests, approvedSet, girls, tripDraftIds])

  const draftSuggestions = useMemo(() => {
    const pendingIds = new Set(pendingRequests.map((r) => r.id))
    return girlOrder
      .filter((id) => !pendingIds.has(id) && !approvedSet.has(id))
      .map((id) => {
        const g = girls[id]
        const sel = tripDraftIds.includes(id)
        return { ...g, initial: g.name[0], distLabel: g.dist.toFixed(1) + 'km', selected: sel }
      })
      .sort((a, b) => a.dist - b.dist)
  }, [girlOrder, girls, approvedSet, pendingRequests, tripDraftIds])

  const tripsList = useMemo(
    () =>
      trips.map((t) => {
        const drv = t.driver_key ? drivers[t.driver_key] : null
        const tot = t.assigned_ids.length
        const dn = t.completed || 0
        const status = !t.driver_key ? '待機中' : !t.boarded ? '出発前' : dn < tot ? '送迎中' : '完了'
        return {
          t,
          label: makeTripLabel(t.assigned_ids, girls),
          departTime: t.depart_time,
          assignedCount: tot,
          driverName: drv ? drv.name : '未定',
          status,
          progressPct: tot ? Math.round((dn / tot) * 100) + '%' : '0%',
          dropsDone: dn,
          dropsTotal: tot,
          returnTime: calcReturnTime(t.depart_time, t.assigned_ids, girls),
          isLastTrip: !!t.last_trip,
          estMin: estMinLabel(t.assigned_ids, girls),
          showArrived: !!t.arrived && !t.boarded,
          showWaiting: !!t.driver_key && !t.arrived && !t.boarded,
          waitingName: (drv ? drv.name : 'ドライバー') + ' がお店に向かっています',
          dotColor: tripDotColor(t),
          castObjs: t.assigned_ids.map((id) => girls[id]).filter(Boolean),
        }
      }),
    [trips, drivers, girls]
  )

  const viewT = trips.find((t) => t.id === viewingTripId) || null
  const vObjs = viewT ? buildTripObjs(viewT, girls) : []
  const vTotal = vObjs.length
  const vDone = viewT ? viewT.completed || 0 : 0
  const vDrv = viewT?.driver_key ? drivers[viewT.driver_key] : null
  const vStatus = !viewT ? '' : !viewT.driver_key ? 'ドライバー確定待ち' : !viewT.boarded ? '乗車前' : vDone < vTotal ? '送迎中' : '送迎完了'
  const vTodayCastId = viewT ? viewT.assigned_ids.find((id) => todayRequests[id]?.status === '承認待ち') : null
  const vTodayReq = vTodayCastId ? todayRequests[vTodayCastId] : null

  const suggestions = useMemo(() => {
    if (!viewT) return []
    return girlOrder
      .filter((id) => !viewT.assigned_ids.includes(id))
      .map((id) => {
        const g = girls[id]
        return { ...g, initial: g.name[0], distLabel: '店から' + g.dist.toFixed(1) + 'km' }
      })
      .sort((a, b) => a.dist - b.dist)
  }, [viewT, girlOrder, girls])

  const todayReqList = Object.entries(todayRequests)
    .filter(([, v]) => v.status === '承認待ち')
    .map(([id, v]) => ({ id, name: girls[id]?.name || id, place: v.place, status: v.status, color: girls[id]?.color || '#888', initial: (girls[id]?.name || '?')[0], reason: v.reason }))

  // ドライバー
  const myAssignedTrips = trips
    .filter((t) => t.driver_key === driverKey)
    .map((t) => {
      const tot = t.assigned_ids.length
      const dn = t.completed || 0
      return {
        t,
        label: makeTripLabel(t.assigned_ids, girls),
        departTime: t.depart_time,
        assignedCount: tot,
        estMin: estMinLabel(t.assigned_ids, girls),
        arrived: !!t.arrived,
        castObjs: t.assigned_ids.map((id) => girls[id]).filter(Boolean),
      }
    })
  const myTrips = trips.filter((t) => t.driver_key === driverKey)
  const activeT =
    (driverActiveTripId ? myTrips.find((t) => t.id === driverActiveTripId) : myTrips.find((t) => (t.completed || 0) < t.assigned_ids.length)) ||
    myTrips[0] ||
    null
  const aObjs = activeT ? buildTripObjs(activeT, girls) : []
  const aTotal = aObjs.length
  const aDone = activeT ? activeT.completed || 0 : 0
  const aBoardOrder = aObjs.slice().sort((a, b) => a.boardNo - b.boardNo)
  const myDrv = drivers[driverKey] || drivers[driverOrder[0]]

  // キャスト
  const castG = girls[castId] || girls[girlOrder[0]]
  const castDrop = castG ? castG.drop_address || castG.addr : ''
  const castTrip = trips.find((t) => t.assigned_ids.includes(castId)) || null
  const castObjs2 = castTrip ? buildTripObjs(castTrip, girls) : []
  const castEntry = castObjs2.find((o) => o.id === castId)
  const castDrv = castTrip?.driver_key ? drivers[castTrip.driver_key] : null
  const castTodayReq = todayRequests[castId]
  const castTripStatus = !castTrip ? '' : !castTrip.driver_key ? 'ドライバー確定待ち' : !castTrip.boarded ? '乗車前' : '送迎中'

  /* ---------- 配車フロー ---------- */
  const toggleTripSelect = (id: string) =>
    setTripDraftIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  const confirmTrip = () => {
    if (!tripDraftIds.length) return
    go('boy-driver-select')
  }

  const finalizeTrip = async () => {
    if (!tripDraftIds.length) return
    const sorted = [...tripDraftIds].sort((a, b) => girls[a].dist - girls[b].dist)
    const deptStr = draftDepartNow ? '今すぐ' : String(draftDepartHour).padStart(2, '0') + ':' + String(draftDepartMin).padStart(2, '0')
    const wasAtStore = !!(draftDriverKey && driverStatuses[draftDriverKey] === 'お店前')
    const newId = await db.createTrip(sorted, deptStr, draftDriverKey, draftLastTrip, wasAtStore)
    setTripDraftIds([])
    setDraftDriverKey(null)
    setDraftLastTrip(false)
    setDraftDepartNow(true)
    setDraftDepartHour(1)
    setDraftDepartMin(0)
    if (newId != null) {
      setViewingTripId(newId)
      setJustCreatedTripId(newId)
      setCountdownActive(true)
      setCountdownRemaining(10)
    }
    go('boy-status')
    reload()
  }

  const cancelTrip = async () => {
    const tid = justCreatedTripId
    const trip = trips.find((t) => t.id === tid)
    setCountdownActive(false)
    setJustCreatedTripId(null)
    if (trip) {
      await db.deleteTrip(trip)
      setTripDraftIds(trip.assigned_ids)
      setDraftDriverKey(trip.driver_key || null)
      reload()
    }
    go('boy-driver-select')
  }

  const addMinutes = (delta: number) => {
    let total = draftDepartHour * 60 + draftDepartMin + delta
    total = ((total % 1440) + 1440) % 1440
    setDraftDepartHour(Math.floor(total / 60))
    setDraftDepartMin(total % 60)
    setDraftDepartNow(false)
  }

  const openCastDetail = (id: string) => {
    setSelectedCastId(id)
    go('boy-admin-cast-detail')
  }
  const openDriverDetail = (key: string) => {
    setSelectedDriverKey(key)
    go('boy-admin-driver-detail')
  }
  const goDeleteConfirm = () => {
    setAdminDeleteType(screen.includes('cast') ? 'cast' : 'driver')
    go('boy-admin-delete-confirm')
  }
  const goDeleteBack = () => go(adminDeleteType === 'cast' ? 'boy-admin-cast-detail' : 'boy-admin-driver-detail')

  /* ============================ レンダリング ============================ */
  if (!ready) {
    return (
      <div style={{ minHeight: '100dvh', background: '#fff', padding: '58px 20px 0' }}>
        {[38, 54, 0, 0, 0].map((_, i) => (
          <div key={i} style={{ height: i < 2 ? (i === 0 ? 13 : 26) : i === 2 ? 56 : 88, width: i === 0 ? '38%' : i === 1 ? '54%' : '100%', borderRadius: i < 2 ? 8 : 18, margin: '0 0 16px', background: 'linear-gradient(90deg,#f0f0f0 25%,#e6e6e6 50%,#f0f0f0 75%)', backgroundSize: '300% 100%', animation: 'sk-shimmer 1.3s ease infinite' }} />
        ))}
      </div>
    )
  }

  const screenBase: React.CSSProperties = {
    minHeight: '100dvh',
    padding: '52px 0 110px',
    boxSizing: 'border-box',
    animation: 'lm-fade .3s ease both',
  }
  const lightScreen: React.CSSProperties = { ...screenBase, background: '#fff', color: '#0a0a0a' }
  const darkScreen: React.CSSProperties = { ...screenBase, background: '#0a0a0a', color: '#fff' }
  const headerRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 14px' }
  const h1: React.CSSProperties = { margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.01em' }
  const blackBtn: React.CSSProperties = { width: '100%', height: 56, borderRadius: 15, background: dark0, color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }
  const sectionLabel: React.CSSProperties = { margin: '24px 4px 10px', fontSize: 13, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }

  /* ---------- ログイン ---------- */
  const renderLogin = () => (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '60px 28px 44px', boxSizing: 'border-box' }}>
      <div style={{ animation: 'lm-fade .4s ease both', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ marginBottom: 56, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Car size={28} color="#0a0a0a" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.1 }}>送迎管理</p>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6e6e6e', fontWeight: 500 }}>キャバクラ専用・送迎オペレーションアプリ</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <input value={loginCode} onChange={(e) => setLoginCode(e.target.value)} placeholder="招待コード（boy / cast / driver）" style={{ height: 54, width: '100%', borderRadius: 14, background: '#161616', border: '1px solid #2a2a2a', color: '#fff', padding: '0 16px', fontSize: 16, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            <p style={{ margin: '8px 4px 0', fontSize: 12.5, color: '#6e6e6e', lineHeight: 1.5 }}>店舗から発行された招待コードを入力してください</p>
            {loginErr && <p style={{ margin: '8px 4px 0', fontSize: 13, color: '#ff6b6b', fontWeight: 600 }}>{loginErr}</p>}
          </div>
          <button onClick={doLogin} style={{ marginTop: 6, height: 58, borderRadius: 14, background: '#06C755', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 6px 18px -6px rgba(6,199,85,.55)' }}>
            コードでログイン
          </button>
        </div>
        <div style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: '#1f1f1f' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', color: '#3a3a3a' }}>DEMO</span>
            <div style={{ flex: 1, height: 1, background: '#1f1f1f' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={quickBoy} style={demoPill}>ボーイ</button>
            {driverOrder.map((k) => (
              <button key={k} onClick={() => quickDriverAs(k)} style={demoPill}>{drivers[k].name} D</button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
            {girlOrder.slice(0, 5).map((id) => (
              <button key={id} onClick={() => quickCastAs(id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '8px 0', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <Avatar bg={girls[id].color} label={girls[id].name[0]} size={34} fs={14} />
                <span style={{ fontSize: 10, fontWeight: 600, color: '#4a4a4a' }}>{girls[id].name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 11, color: '#3a3a3a', fontWeight: 600, letterSpacing: '.08em', textAlign: 'center' }}>CLUB VENUS &nbsp;·&nbsp; CLUB KING</p>
    </div>
  )

  const demoPill: React.CSSProperties = { flex: 1, height: 40, borderRadius: 999, background: 'transparent', border: '1px solid #2a2a2a', color: '#9a9a9a', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }

  /* ---------- ボーイ：ホーム（配車） ---------- */
  const renderBoyHome = () => (
    <div style={lightScreen}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 14px' }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#8a8a8a', letterSpacing: '.04em' }}>CLUB VENUS・KING ・ ボーイ</p>
          <h1 style={{ margin: '2px 0 0', fontSize: 30, fontWeight: 800, letterSpacing: '-.02em' }}>配車</h1>
        </div>
        <div onClick={() => go('boy-settings')} role="button" style={{ width: 40, height: 40, borderRadius: '50%', background: dark0, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>B</div>
      </div>
      <div style={{ padding: '0 20px' }}>
        <button onClick={() => go('boy-new')} style={{ width: '100%', height: 58, borderRadius: 16, background: dark0, color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: '0 8px 20px -8px rgba(0,0,0,.5)' }}>
          <Plus size={20} /> 配車を依頼する
        </button>
        <p style={{ margin: '26px 4px 10px', fontSize: 13, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>本日の便</p>
        {tripsList.length === 0 ? (
          <div style={{ border: '1px solid #ededed', borderRadius: 18, padding: 28, textAlign: 'center' }}>
            <div style={{ marginBottom: 10, opacity: 0.3, display: 'flex', justifyContent: 'center' }}><Car size={32} /></div>
            <p style={{ margin: 0, fontSize: 14, color: '#b0b0b0', fontWeight: 600 }}>まだ配車依頼がありません</p>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#c8c8c8' }}>今夜の配車依頼がここに表示されます</p>
          </div>
        ) : (
          tripsList.map((tr) => (
            <div key={tr.t.id} onClick={() => { setViewingTripId(tr.t.id); go('boy-status') }} role="button" style={{ border: '1px solid #ededed', borderRadius: 18, padding: 16, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,.04)', marginBottom: 10 }}>
              {tr.showArrived && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#eafaf0', borderRadius: 11, padding: '9px 12px', marginBottom: 12 }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#06c167', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={11} /></span>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0a7a3f' }}>ドライバーが到着しました</span>
                </div>
              )}
              {tr.showWaiting && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f6f6f6', borderRadius: 11, padding: '9px 12px', marginBottom: 12 }}>
                  <Clock size={15} color="#a8a8a8" />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#8a8a8a' }}>{tr.waitingName}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: tr.dotColor, animation: 'lm-pulse 1.6s infinite', flexShrink: 0 }} />
                  <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' }}>{tr.label}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: dark0, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>{tr.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
                <Stat label="出発" value={tr.departTime} />
                <Div />
                <Stat label="所要" value={tr.estMin} />
                <Div />
                <Stat label="乗車" value={tr.assignedCount + '名'} />
                <Div />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={statK}>ドライバー</p>
                  <p style={{ ...statV, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tr.driverName}</p>
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {tr.castObjs.map((co) => (
                    <Avatar key={co.id} bg={co.color} label={co.name[0]} size={28} fs={11} border="2px solid #fff" />
                  ))}
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden' }}><div style={{ height: '100%', background: dark0, borderRadius: 3, width: tr.progressPct }} /></div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6a6a6a', whiteSpace: 'nowrap' }}>{tr.dropsDone}/{tr.dropsTotal}</span>
                </div>
              </div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {tr.isLastTrip ? (
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#b0b0b0' }}>最終便 — 終了</span>
                ) : (
                  <>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#9a9a9a' }}>帰店予定</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a' }}>{tr.returnTime}</span>
                  </>
                )}
              </div>
            </div>
          ))
        )}
        {/* 本日のみ変更申請（承認） */}
        {todayReqList.map((req) => (
          <div key={req.id} style={{ marginTop: 10, border: '1px solid #ffe3b8', background: '#fff8ed', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar bg={req.color} label={req.initial} size={32} fs={13} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#8a5a00' }}>{req.name} ：{req.place}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#c77700' }}>{req.status}</p>
            </div>
            <button onClick={() => act(() => db.approveTodayRequest(req.id, { place: req.place, reason: req.reason }))} style={{ height: 32, padding: '0 12px', borderRadius: 999, background: dark0, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>承認</button>
          </div>
        ))}
        {/* 乗車リクエスト */}
        {pendingRequests.length > 0 && (
          <div style={{ marginTop: 12, background: dark0, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>{pendingRequests.length}名の乗車リクエスト</p>
              <button onClick={() => go('boy-new')} style={{ height: 32, padding: '0 13px', borderRadius: 999, background: '#fff', color: '#0a0a0a', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>配車を作成 →</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {pendingRequests.map((r) => (
                  <Avatar key={r.id} bg={r.color} label={r.initial} size={28} fs={12} border="2px solid #0a0a0a" />
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#9a9a9a', lineHeight: 1.4 }}>配車依頼作成時に選択できます</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  /* ---------- ボーイ：配車依頼（キャスト選択 + 時刻） ---------- */
  const renderBoyNew = () => (
    <div style={lightScreen}>
      <div style={{ height: 4, background: '#f0f0f0' }}><div style={{ height: '100%', width: '50%', background: dark0, borderRadius: '0 2px 2px 0' }} /></div>
      <div style={{ ...headerRow, padding: '8px 14px 14px' }}>
        <BackBtn onClick={() => go('boy-home')} />
        <h1 style={h1}>配車依頼</h1>
      </div>
      <div style={{ padding: '0 20px' }}>
        <p style={{ margin: '8px 4px 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>乗車するキャストを選択</p>
        {pendingRequests.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, margin: '0 4px 8px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#06c167', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>リクエスト送信済み</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingRequests.map((r) => (
                <SelectRow key={r.id} g={r} selected={r.selected} onToggle={() => toggleTripSelect(r.id)} />
              ))}
            </div>
          </>
        )}
        {draftSuggestions.length > 0 && (
          <div style={{ marginTop: 18, background: dark0, borderRadius: 18, padding: 16, color: '#fff' }}>
            <div onClick={() => setSuggestOpenNew((v) => !v)} role="button" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Spark />
              <span style={{ fontSize: 14, fontWeight: 700 }}>自動提案</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#7a7a7a' }}>{draftSuggestions.length}名</span>
              <Caret up={suggestOpenNew} />
            </div>
            {suggestOpenNew && (
              <>
                <p style={{ margin: '10px 0 12px', fontSize: 12, color: '#a8a8a8', lineHeight: 1.5 }}>お店から近いキャストの同乗をおすすめします。</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {draftSuggestions.map((r) => (
                    <DarkSelectRow key={r.id} g={r} selected={r.selected} onToggle={() => toggleTripSelect(r.id)} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        <p style={{ margin: '10px 4px 0', fontSize: 12.5, color: '#9a9a9a' }}>{tripDraftIds.length}名を選択中　・　お店から近い順に降車ルートを自動設定します</p>

        <p style={{ margin: '24px 4px 10px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>出発予定時刻</p>
        <div style={{ padding: '4px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1, color: '#0a0a0a' }}>{draftDepartNow ? '今すぐ' : String(draftDepartHour).padStart(2, '0') + ':' + String(draftDepartMin).padStart(2, '0')}</span>
            {draftDepartNow ? (
              <span onClick={() => setDraftDepartNow(false)} role="button" style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, whiteSpace: 'nowrap', flexShrink: 0 }}>時間を指定する</span>
            ) : (
              <span onClick={() => setDraftDepartNow(true)} role="button" style={{ fontSize: 13, fontWeight: 600, color: '#9a9a9a', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, whiteSpace: 'nowrap', flexShrink: 0 }}>今すぐに戻す</span>
            )}
          </div>
          <div style={{ height: 1, background: '#efefef', margin: '14px 0' }} />
          {!draftDepartNow ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {[['−15分', -15], ['−5分', -5], ['+5分', 5], ['+15分', 15]].map(([lbl, d]) => (
                <button key={lbl as string} onClick={() => addMinutes(d as number)} style={{ flex: 1, height: 40, borderRadius: 999, background: '#f2f2f2', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#3a3a3a' }}>{lbl}</button>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 12.5, color: '#c0c0c0', fontWeight: 500 }}>出発準備ができ次第すぐに出発します</p>
          )}
        </div>
        <button onClick={confirmTrip} style={{ ...blackBtn, marginTop: 28, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span>ドライバーを選ぶ</span>
          <ArrowR />
        </button>
      </div>
    </div>
  )

  /* ---------- ボーイ：ドライバー指定（新規便） ---------- */
  const renderBoyDriverSelect = () => {
    const draftCount = tripDraftIds.length
    const draftEst = estMinLabel(tripDraftIds, girls)
    return (
      <div style={lightScreen}>
        <div style={{ height: 4, background: '#f0f0f0' }}><div style={{ height: '100%', width: '100%', background: dark0 }} /></div>
        <div style={{ ...headerRow }}>
          <BackBtn onClick={() => go('boy-new')} />
          <h1 style={h1}>ドライバーを指定</h1>
        </div>
        <div style={{ padding: '0 20px' }}>
          <div style={{ background: dark0, borderRadius: 18, padding: '20px 20px 18px', marginBottom: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#4a4a4a', letterSpacing: '.1em', textTransform: 'uppercase' }}>出発</p>
              {draftDepartNow ? (
                <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-.02em', lineHeight: 1 }}>今すぐ</p>
              ) : (
                <p style={{ margin: 0, fontSize: 48, fontWeight: 800, color: '#fff', letterSpacing: '-.03em', lineHeight: 1 }}>{String(draftDepartHour).padStart(2, '0') + ':' + String(draftDepartMin).padStart(2, '0')}</p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {tripDraftIds.map((id) => girls[id] && <Avatar key={id} bg={girls[id].color} label={girls[id].name[0]} size={28} fs={12} border="2px solid #0a0a0a" />)}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#9a9a9a' }}>{draftCount}名乗車</span>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#4a4a4a', letterSpacing: '.06em' }}>推定所要時間</p>
                <p style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: '#fff' }}>{draftEst}</p>
              </div>
            </div>
          </div>
          <p style={{ margin: '0 4px 12px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>担当ドライバーを選んでください</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {driverOrder.map((key) => {
              const st = driverStatuses[key] || '待機中'
              const cfg = driverStatusConfig[st]
              const isCurrent = draftDriverKey === key
              const canAssign = cfg.available
              return (
                <div key={key} onClick={() => { if (canAssign) setDraftDriverKey((k) => (k === key ? null : key)) }} role="button" style={{ borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 14, cursor: canAssign ? 'pointer' : 'not-allowed', border: isCurrent ? '2px solid #0a0a0a' : '1px solid #ededed', background: canAssign ? '#fff' : '#f9f9f9', opacity: canAssign ? 1 : 0.55 }}>
                  <Avatar bg="#1a1a1a" label={drivers[key].initial} size={48} fs={18} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{drivers[key].name}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#9a9a9a' }}>{drivers[key].car}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{st}</span>
                      {!canAssign && <span style={{ fontSize: 11, color: '#b0b0b0' }}>・ 依頼不可</span>}
                    </div>
                  </div>
                  {isCurrent ? (
                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: dark0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={14} /></span>
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #e0e0e0', flexShrink: 0 }} />
                  )}
                </div>
              )
            })}
          </div>
          <div onClick={() => setDraftLastTrip((v) => !v)} role="button" style={{ marginTop: 20, borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, cursor: 'pointer', border: draftLastTrip ? '2px solid #0a0a0a' : '1px solid #ededed', background: draftLastTrip ? '#fafafa' : '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Flag color={draftLastTrip ? '#0a0a0a' : '#c0c0c0'} />
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>最後の便にする</p>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9a9a9a' }}>以降の便を担当しない場合にオンにしてください</p>
              </div>
            </div>
            <div style={{ width: 44, height: 26, borderRadius: 999, background: draftLastTrip ? '#0a0a0a' : '#e0e0e0', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: draftLastTrip ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff' }} />
            </div>
          </div>
          <button onClick={finalizeTrip} style={{ ...blackBtn, marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Check size={18} sw={2.4} /> 配車依頼を確定する
          </button>
          <p style={{ margin: '10px 4px 0', fontSize: 12, color: '#a0a0a0', textAlign: 'center' }}>ドライバーはあとから変更できます</p>
        </div>
      </div>
    )
  }

  /* ---------- ボーイ：便を編集 ---------- */
  const renderBoyEdit = () => (
    <div style={lightScreen}>
      <div style={{ ...headerRow }}>
        <BackBtn onClick={() => go('boy-home')} />
        <h1 style={h1}>便を編集</h1>
      </div>
      {trips.length > 0 ? (
        <div style={{ padding: '0 20px 4px', display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
          {trips.map((t) => {
            const isActive = viewingTripId === t.id
            return (
              <div key={t.id} onClick={() => setViewingTripId(t.id)} role="button" style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 999, cursor: 'pointer', border: isActive ? '2px solid #0a0a0a' : '1px solid #e0e0e0', background: isActive ? '#0a0a0a' : '#fff', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: isActive ? '#fff' : '#3a3a3a' }}>{makeTripLabel(t.assigned_ids, girls)}</span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: isActive ? '#a8a8a8' : '#b0b0b0' }}>{t.depart_time}</span>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ margin: '0 20px 16px', border: '1px solid #ededed', borderRadius: 14, padding: 20, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, color: '#b0b0b0', fontWeight: 600 }}>まだ便がありません</p>
        </div>
      )}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '6px 0 10px' }}>
          <p style={{ margin: '0 4px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>降車順（{vTotal}名）</p>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#06c167', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={13} color="#06c167" sw={2.4} />近い順 適用済み</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {vObjs.map((g) => (
            <div key={g.id} style={{ border: '1px solid #ededed', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 24, height: 24, borderRadius: 8, background: dark0, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{g.dropNo}</span>
              <Avatar bg={g.color} label={g.initial} size={38} fs={15} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{g.name}</p>
                <p style={{ margin: '1px 0 0', fontSize: 12, color: '#9a9a9a', fontWeight: 500 }}>{g.area} ・ {g.distLabel}</p>
              </div>
              <button onClick={() => viewT && act(() => db.setTripAssigned(viewT.id, viewT.assigned_ids.filter((x) => x !== g.id)))} style={{ width: 30, height: 30, borderRadius: '50%', background: '#f4f4f4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><X /></button>
            </div>
          ))}
        </div>
        {suggestions.length > 0 && (
          <div style={{ marginTop: 22, background: dark0, borderRadius: 18, padding: 16, color: '#fff' }}>
            <div onClick={() => setSuggestOpenEdit((v) => !v)} role="button" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Spark /><span style={{ fontSize: 14, fontWeight: 700 }}>自動提案</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#7a7a7a' }}>{suggestions.length}名</span>
              <Caret up={suggestOpenEdit} />
            </div>
            {suggestOpenEdit && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {suggestions.map((s) => (
                  <div key={s.id} style={{ background: '#1a1a1a', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 11 }}>
                    <Avatar bg={s.color} label={s.initial} size={36} fs={14} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{s.name}</p>
                      <p style={{ margin: '1px 0 0', fontSize: 11.5, color: '#9a9a9a' }}>{s.area} ・ {s.distLabel}</p>
                    </div>
                    <button onClick={() => viewT && act(() => db.setTripAssigned(viewT.id, [...viewT.assigned_ids, s.id].sort((a, b) => girls[a].dist - girls[b].dist)))} style={{ height: 34, padding: '0 14px', borderRadius: 999, background: '#fff', color: '#0a0a0a', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>＋ 追加</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <button onClick={() => go('boy-status')} style={{ ...blackBtn, marginTop: 24 }}>編集を完了</button>
      </div>
    </div>
  )

  /* ---------- ボーイ：便の詳細（送迎状況） ---------- */
  const renderBoyStatus = () => {
    const showCountdown = countdownActive && justCreatedTripId === viewingTripId
    const justCreated = !countdownActive && justCreatedTripId === viewingTripId && !(viewT && viewT.arrived)
    const viewWaiting = !!(viewT && viewT.driver_key && !viewT.arrived && !viewT.boarded) && !countdownActive && justCreatedTripId !== viewingTripId
    const viewArrived = !!(viewT && viewT.arrived && !viewT.boarded) && !countdownActive
    return (
      <div style={lightScreen}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 14px' }}>
          <BackBtn onClick={() => { setCountdownActive(false); setJustCreatedTripId(null); go('boy-home') }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#9a9a9a' }}>{viewT ? makeTripLabel(viewT.assigned_ids, girls) : ''}</p>
            <h1 style={h1}>便の詳細</h1>
          </div>
          <button onClick={() => go('boy-edit')} style={{ height: 36, padding: '0 14px', borderRadius: 10, background: '#f4f4f4', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, color: '#0a0a0a' }}><Edit />編集</button>
        </div>
        <div style={{ padding: '0 20px' }}>
          {showCountdown && (
            <div style={{ background: dark0, borderRadius: 14, padding: '16px 18px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>{countdownRemaining}秒以内であれば取り消せます</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6e6e6e' }}>そのままお待ちいただくと確定されます</p>
                </div>
                <button onClick={cancelTrip} style={{ height: 38, padding: '0 16px', borderRadius: 999, background: '#fff', color: '#0a0a0a', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>取り消す</button>
              </div>
              <div style={{ height: 4, background: '#2a2a2a', borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ height: '100%', background: '#06c167', borderRadius: 2, transition: 'width 1s linear', width: Math.round((countdownRemaining / 10) * 100) + '%' }} />
              </div>
              <button onClick={() => { setCountdownActive(false); setCountdownRemaining(0) }} style={{ width: '100%', height: 44, borderRadius: 11, background: '#1e1e1e', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>今すぐ確定する</button>
            </div>
          )}
          {justCreated && (
            <div style={{ background: '#eafaf0', borderRadius: 14, padding: '14px 16px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#06c167', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={15} /></span>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0a7a3f' }}>配車依頼が確定しました</p>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#3a8a5a', lineHeight: 1.5 }}>{vDrv ? vDrv.name : 'ドライバー'} に通知しました。到着までお待ちください。</p>
              </div>
            </div>
          )}
          {viewWaiting && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#f4f4f4', borderRadius: 14, padding: '13px 16px', marginBottom: 14 }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#e4e4e4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Clock size={16} /></span>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#6a6a6a' }}>ドライバーの到着をお待ちください</p>
                <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#9a9a9a', lineHeight: 1.5 }}>到着すると、ここでお知らせします。</p>
              </div>
            </div>
          )}
          {viewArrived && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#eafaf0', borderRadius: 14, padding: '13px 16px', marginBottom: 14 }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#06c167', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={15} /></span>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0a7a3f' }}>ドライバーが到着しました</p>
                <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#3a8a5a', lineHeight: 1.5 }}>キャストを担当車両に乗車させてください。</p>
              </div>
            </div>
          )}

          <div style={{ background: dark0, borderRadius: 18, padding: 18, color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: '#a8a8a8', fontWeight: 600 }}>{viewT ? makeTripLabel(viewT.assigned_ids, girls) : ''}</p>
                <p style={{ margin: '3px 0 0', fontSize: 22, fontWeight: 800, letterSpacing: '-.01em' }}>{vStatus}</p>
              </div>
              {!showCountdown && <span style={{ width: 10, height: 10, borderRadius: '50%', background: viewT ? tripDotColor(viewT) : '#c0c0c0', animation: 'lm-pulse 1.6s infinite' }} />}
            </div>
            {viewT?.driver_key ? (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: 9 }}>
                <Avatar bg="#333" label={vDrv?.initial || '−'} size={26} fs={12} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{vDrv?.name}</span>
                <span style={{ fontSize: 12, color: '#5a5a5a', flex: 1 }}>{vDrv?.car}</span>
                <span onClick={() => viewT && act(() => db.unassignDriver(viewT))} role="button" style={{ fontSize: 11.5, color: '#5a5a5a', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, whiteSpace: 'nowrap', flexShrink: 0 }}>変更</span>
              </div>
            ) : (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #1e1e1e' }}>
                <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#9a9a9a', letterSpacing: '.04em' }}>ドライバーを指定</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {driverOrder.map((key) => {
                    const st = driverStatuses[key] || '待機中'
                    const cfg = driverStatusConfig[st]
                    return (
                      <div key={key} onClick={() => { if (cfg.available && viewT) act(() => db.assignDriver(viewT.id, key)) }} role="button" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: '#151515', cursor: cfg.available ? 'pointer' : 'not-allowed', border: '1px solid #2a2a2a', opacity: cfg.available ? 1 : 0.5 }}>
                        <Avatar bg="#2a2a2a" label={drivers[key].initial} size={34} fs={14} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>{drivers[key].name}</p>
                          <p style={{ margin: '1px 0 0', fontSize: 11.5, color: '#9a9a9a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{drivers[key].car} ・ {st}</p>
                        </div>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #333' }} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#2a2a2a', overflow: 'hidden' }}><div style={{ height: '100%', background: '#06c167', borderRadius: 3, width: vTotal ? Math.round((vDone / vTotal) * 100) + '%' : '0%' }} /></div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#7a7a7a', whiteSpace: 'nowrap' }}>{vDone}/{vTotal}名</span>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#4a4a4a' }}>帰店予定</p>
                <p style={{ margin: '1px 0 0', fontSize: 14, fontWeight: 800, color: '#fff' }}>{viewT ? (viewT.last_trip ? '最終便' : calcReturnTime(viewT.depart_time, viewT.assigned_ids, girls)) : '-'}</p>
              </div>
            </div>
          </div>

          {vTodayReq && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, background: '#fff8ed', border: '1px solid #ffe3b8', borderRadius: 14, padding: '12px 14px' }}>
              <Warn />
              <p style={{ margin: 0, fontSize: 13, color: '#8a5a00', lineHeight: 1.4, flex: 1 }}><b>{girls[vTodayCastId!]?.name}</b>：本日のみ「{vTodayReq.place}」へ変更申請（{vTodayReq.status}）</p>
              {vTodayReq.status === '承認待ち' && <button onClick={() => vTodayCastId && act(() => db.approveTodayRequest(vTodayCastId, vTodayReq))} style={{ height: 30, padding: '0 12px', borderRadius: 999, background: dark0, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>承認</button>}
            </div>
          )}

          <p style={sectionLabel}>降車ルート</p>
          <RouteList objs={vObjs} storeName="CLUB VENUS・KING" boarded={!!viewT?.boarded} departTime={viewT?.depart_time || ''} isLast={!!viewT?.last_trip} returnTime={viewT ? calcReturnTime(viewT.depart_time, viewT.assigned_ids, girls) : '-'} />
        </div>
      </div>
    )
  }

  /* ---------- ボーイ：管理 ---------- */
  const renderBoyAdmin = () => (
    <div style={lightScreen}>
      <div style={{ padding: '8px 20px 14px' }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#8a8a8a', letterSpacing: '.04em' }}>CLUB VENUS · KING · ボーイ</p>
        <h1 style={{ margin: '2px 0 0', fontSize: 30, fontWeight: 800, letterSpacing: '-.02em' }}>管理</h1>
      </div>
      <div style={{ padding: '0 20px' }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>キャスト一覧</p>
        <div style={{ marginBottom: 24 }}>
          {girlOrder.map((id) => {
            const g = girls[id]
            const onTrip = approvedSet.has(id)
            return (
              <div key={id} onClick={() => openCastDetail(id)} role="button" style={{ padding: '11px 0', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                <Avatar bg={g.color} label={g.name[0]} size={40} fs={16} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{g.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9a9a9a' }}>{g.area} ・ 店から{g.dist.toFixed(1)}km</p>
                </div>
                {onTrip ? <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', background: dark0, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>乗車中</span> : <span style={{ fontSize: 11.5, fontWeight: 700, color: '#b0b0b0', whiteSpace: 'nowrap', flexShrink: 0 }}>待機中</span>}
                <ChevR />
              </div>
            )
          })}
        </div>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>ドライバー一覧</p>
        <div>
          {driverOrder.map((key) => {
            const d = drivers[key]
            const onTrip = !!trips.find((t) => t.driver_key === key && (t.completed || 0) < t.assigned_ids.length)
            return (
              <div key={key} onClick={() => openDriverDetail(key)} role="button" style={{ padding: '11px 0', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                <Avatar bg="#2a2a2a" label={d.initial} size={40} fs={15} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{d.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9a9a9a' }}>{d.car}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 12, color: '#9a9a9a' }}>{d.plate}</p>
                </div>
                {onTrip ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#06c167', animation: 'lm-pulse 1.6s infinite' }} /><span style={{ fontSize: 11.5, fontWeight: 700, color: '#06c167', whiteSpace: 'nowrap' }}>運行中</span></div> : <span style={{ fontSize: 11.5, fontWeight: 700, color: '#b0b0b0', whiteSpace: 'nowrap', flexShrink: 0 }}>待機中</span>}
                <ChevR />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  /* ---------- ボーイ：キャスト詳細 ---------- */
  const renderCastDetail = () => {
    const g = selectedCastId ? girls[selectedCastId] : null
    if (!g) return null
    const onTrip = !!(selectedCastId && approvedSet.has(selectedCastId))
    return (
      <div style={lightScreen}>
        <div style={headerRow}><BackBtn onClick={() => go('boy-admin')} /><h1 style={h1}>キャスト詳細</h1></div>
        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <Avatar bg={g.color} label={g.name[0]} size={68} fs={28} />
            <div>
              <p style={{ margin: 0, fontSize: 36, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1 }}>{g.name}</p>
              <div style={{ marginTop: 8, display: 'inline-flex', background: onTrip ? '#0a0a0a' : '#f4f4f4', padding: '5px 13px', borderRadius: 999 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: onTrip ? '#fff' : '#8a8a8a' }}>{onTrip ? '乗車中' : '待機中'}</span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #f0f0f0' }}>
            <DetailRow label="エリア" value={g.area} />
            <DetailRow label="店からの距離" value={'店から' + g.dist.toFixed(1) + 'km'} />
            <DetailRow label="住所" value={g.drop_address || g.addr} last />
          </div>
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => go('boy-admin-cast-edit')} style={{ ...blackBtn, boxShadow: '0 8px 20px -8px rgba(0,0,0,.5)' }}>編集する</button>
            <button onClick={goDeleteConfirm} style={{ width: '100%', height: 48, borderRadius: 15, background: '#fff', color: '#9a9a9a', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}>削除する</button>
          </div>
        </div>
      </div>
    )
  }

  /* ---------- ボーイ：キャスト編集（表示のみ） ---------- */
  const renderCastEdit = () => {
    const g = selectedCastId ? girls[selectedCastId] : null
    if (!g) return null
    return (
      <div style={lightScreen}>
        <div style={headerRow}><BackBtn onClick={() => go('boy-admin-cast-detail')} /><h1 style={h1}>{g.name}を編集</h1></div>
        <div style={{ padding: '0 20px' }}>
          <FieldView label="ニックネーム" value={g.name} />
          <FieldView label="エリア（地区）" value={g.area} />
          <FieldView label="自宅住所" value={g.drop_address || g.addr} multiline />
          <p style={{ margin: '0 0 32px 2px', fontSize: 12, color: '#b0b0b0', lineHeight: 1.5 }}>住所はドライバーへの案内・距離計算に使用します</p>
          <button onClick={() => go('boy-admin')} style={{ ...blackBtn, boxShadow: '0 8px 20px -8px rgba(0,0,0,.5)' }}>変更を保存</button>
        </div>
      </div>
    )
  }

  /* ---------- ボーイ：ドライバー詳細 ---------- */
  const renderDriverDetail = () => {
    const d = selectedDriverKey ? drivers[selectedDriverKey] : null
    if (!d) return null
    const onTrip = !!(selectedDriverKey && trips.find((t) => t.driver_key === selectedDriverKey && (t.completed || 0) < t.assigned_ids.length))
    return (
      <div style={lightScreen}>
        <div style={headerRow}><BackBtn onClick={() => go('boy-admin')} /><h1 style={h1}>ドライバー詳細</h1></div>
        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <Avatar bg="#1a1a1a" label={d.initial} size={68} fs={28} />
            <div>
              <p style={{ margin: 0, fontSize: 36, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1 }}>{d.name}</p>
              {onTrip ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06c167', animation: 'lm-pulse 1.6s infinite' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#06c167' }}>運行中</span></div>
              ) : (
                <div style={{ marginTop: 8, display: 'inline-flex', background: '#f4f4f4', padding: '5px 13px', borderRadius: 999 }}><span style={{ fontSize: 12, fontWeight: 700, color: '#8a8a8a' }}>待機中</span></div>
              )}
            </div>
          </div>
          <div style={{ borderTop: '1px solid #f0f0f0' }}>
            <DetailRow label="車種・車の色" value={d.car} />
            <DetailRow label="ナンバープレート" value={d.plate} last />
          </div>
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button style={{ ...blackBtn, boxShadow: '0 8px 20px -8px rgba(0,0,0,.5)' }}>編集する</button>
            {onTrip ? <p style={{ margin: '4px 0 0', fontSize: 12, color: '#b0b0b0', textAlign: 'center' }}>運行中のドライバーは削除できません</p> : <button onClick={goDeleteConfirm} style={{ width: '100%', height: 48, borderRadius: 15, background: '#fff', color: '#9a9a9a', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}>削除する</button>}
          </div>
        </div>
      </div>
    )
  }

  /* ---------- ボーイ：ドライバー追加（表示のみ） ---------- */
  const renderDriverAdd = () => (
    <div style={lightScreen}>
      <div style={headerRow}><BackBtn onClick={() => go('boy-admin')} /><h1 style={h1}>ドライバーを追加</h1></div>
      <div style={{ padding: '0 20px' }}>
        <FieldView label="名前" value="例：田中 誠" placeholder />
        <FieldView label="車種" value="例：アルファード" placeholder />
        <FieldView label="車の色" value="例：白" placeholder />
        <FieldView label="ナンバープレート" value="例：新潟 300 あ 12-34" placeholder />
        <p style={{ margin: '0 0 32px 2px', fontSize: 12, color: '#b0b0b0', lineHeight: 1.5 }}>全項目を入力すると登録できます</p>
        <button onClick={() => go('boy-admin')} style={{ ...blackBtn, background: '#d8d8d8' }}>登録する</button>
      </div>
    </div>
  )

  /* ---------- ボーイ：削除確認 ---------- */
  const renderDeleteConfirm = () => {
    const isCast = adminDeleteType === 'cast'
    const name = isCast ? (selectedCastId ? girls[selectedCastId].name : '') : selectedDriverKey ? drivers[selectedDriverKey].name : ''
    const initial = isCast ? (selectedCastId ? girls[selectedCastId].name[0] : '') : selectedDriverKey ? drivers[selectedDriverKey].initial : ''
    const color = isCast ? (selectedCastId ? girls[selectedCastId].color : '#ccc') : '#1a1a1a'
    return (
      <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '52px 0 0', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }} />
        <div style={{ background: '#fff', borderRadius: '26px 26px 0 0', padding: '22px 22px 44px', boxShadow: '0 -8px 32px rgba(0,0,0,.1)' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e0e0e0', margin: '0 auto 22px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <Avatar bg={color} label={initial} size={52} fs={22} />
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{name}を<br />削除しますか？</p>
          </div>
          <p style={{ margin: '0 0 28px', fontSize: 14, color: '#8a8a8a', lineHeight: 1.65 }}>削除すると元に戻せません。<br />過去の便の記録には影響しません。</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => go('boy-admin')} style={{ ...blackBtn, boxShadow: '0 8px 20px -8px rgba(0,0,0,.5)' }}>削除する</button>
            <button onClick={goDeleteBack} style={{ width: '100%', height: 52, borderRadius: 15, background: '#f4f4f4', color: '#0a0a0a', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>キャンセル</button>
          </div>
        </div>
      </div>
    )
  }

  /* ---------- キャスト：ホーム ---------- */
  const renderCastHome = () => (
    <div style={lightScreen}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 14px' }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#8a8a8a' }}>CLUB VENUS・KING</p>
          <h1 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>こんばんは、{castG?.name}さん</h1>
        </div>
        <div onClick={() => go('cast-settings')} role="button" style={{ cursor: 'pointer' }}><Avatar bg={castG?.color || '#888'} label={castG?.name[0] || '?'} size={40} fs={16} /></div>
      </div>
      <div style={{ padding: '0 20px' }}>
        {castEntry ? (
          <div style={{ background: dark0, borderRadius: 20, padding: 20, color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06c167', animation: 'lm-pulse 1.6s infinite' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#cfcfcf' }}>本日の帰り便 ・ {castTripStatus}</span>
            </div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em' }}>{castEntry.dropNo}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#a8a8a8', paddingBottom: 6 }}>/ {castTrip?.assigned_ids.length} 番目に降車</span>
            </div>
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12, background: '#1a1a1a', borderRadius: 13, padding: 12 }}>
              <Avatar bg="#333" label={castDrv?.initial || '−'} size={40} fs={15} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{castDrv?.name || '未定'}</p>
                <p style={{ margin: '1px 0 0', fontSize: 12, color: '#9a9a9a' }}>{castDrv?.car || '−'}</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#06c167', whiteSpace: 'nowrap', flexShrink: 0 }}>{castTrip?.depart_time} 出発</span>
            </div>
          </div>
        ) : (
          <div style={{ background: '#f7f7f7', borderRadius: 18, padding: 20 }}>
            <p style={{ margin: '0 0 14px', fontSize: 14, color: '#8a8a8a', textAlign: 'center' }}>本日の帰り便にはまだ登録されていません。</p>
            {rideRequests[castId] === 'approved' ? (
              <div style={{ background: '#eafaf0', border: '1px solid #bdeccf', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Check size={18} color="#06c167" /><p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0a7a3f' }}>今日の送迎をリクエストしました</p></div>
                <p style={{ margin: '6px 0 0 28px', fontSize: 12, color: '#3a8a5a', lineHeight: 1.5 }}>乗車情報が確定したらこちらに表示されます。</p>
              </div>
            ) : (
              <button onClick={() => act(() => db.sendRideRequest(castId))} style={{ width: '100%', height: 52, borderRadius: 13, background: dark0, color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Plus size={18} /> 今日の送迎をリクエスト</button>
            )}
          </div>
        )}

        {castTodayReq && castTodayReq.status !== '承認済み' && (
          <div style={{ marginTop: 12, background: '#fff8ed', border: '1px solid #ffe3b8', borderRadius: 14, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 12, fontWeight: 700, color: '#c77700' }}>本日のみ降車場所を変更</span><span style={{ fontSize: 11, fontWeight: 700, background: '#ffe3b8', color: '#8a5a00', padding: '2px 8px', borderRadius: 999 }}>{castTodayReq.status}</span></div>
            <p style={{ margin: '6px 0 0', fontSize: 13.5, fontWeight: 600, color: '#8a5a00' }}>{castTodayReq.place}</p>
          </div>
        )}

        <p style={sectionLabel}>降車場所</p>
        <div onClick={() => go('cast-place')} role="button" style={{ border: '1px solid #ededed', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Pin /></div>
          <div style={{ flex: 1, minWidth: 0 }}><p style={{ margin: 0, fontSize: 12, color: '#9a9a9a', fontWeight: 600 }}>登録済みの降車場所</p><p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{castDrop}</p></div>
          <ChevR color="#bdbdbd" />
        </div>
        <button onClick={() => go('cast-request')} style={{ marginTop: 14, width: '100%', height: 56, borderRadius: 15, background: dark0, color: '#fff', border: 'none', fontSize: 15.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Pin size={19} color="#fff" /> 今日だけ違う場所に！
        </button>
      </div>
    </div>
  )

  /* ---------- キャスト：降車場所登録 ---------- */
  const renderCastPlace = () => (
    <div style={lightScreen}>
      <div style={headerRow}><BackBtn onClick={() => go('cast-home')} /><h1 style={h1}>降車場所の登録</h1></div>
      <div style={{ padding: '0 20px' }}>
        <p style={{ margin: '6px 4px 16px', fontSize: 13.5, color: '#7a7a7a', lineHeight: 1.6 }}>普段、帰りに降りる場所を登録します。送迎の降車ルートはこの住所をもとに組まれます。</p>
        <p style={{ margin: '0 4px 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>住所・目印</p>
        <textarea value={dropDraft} onChange={(e) => { setDropDraft(e.target.value); setDropSaved(false) }} placeholder="例：新潟市中央区万代1-6-3 ○○マンション402" style={{ width: '100%', height: 120, borderRadius: 14, background: '#f7f7f7', border: '1px solid #e6e6e6', color: '#0a0a0a', padding: '14px 16px', fontSize: 15, fontFamily: 'inherit', lineHeight: 1.6, outline: 'none', boxSizing: 'border-box', resize: 'none' }} />
        <p style={{ margin: '10px 4px 0', fontSize: 12, color: '#a0a0a0', lineHeight: 1.5 }}>※ マンション名・部屋番号・近くの目印まで入れると、ドライバーが迷いません。</p>
        {dropSaved && (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, background: '#eafaf0', border: '1px solid #bdeccf', borderRadius: 13, padding: '12px 14px' }}>
            <Check size={18} color="#06c167" /><span style={{ fontSize: 13.5, fontWeight: 700, color: '#0a7a3f' }}>降車場所を保存しました</span>
          </div>
        )}
        <button onClick={() => act(async () => { await db.saveDrop(castId, dropDraft); setDropSaved(true) })} style={{ ...blackBtn, marginTop: 24 }}>この場所を保存</button>
      </div>
    </div>
  )

  /* ---------- キャスト：本日のみ変更申請 ---------- */
  const renderCastRequest = () => (
    <div style={lightScreen}>
      <div style={headerRow}><BackBtn onClick={() => go('cast-home')} /><h1 style={h1}>本日のみ変更申請</h1></div>
      <div style={{ padding: '0 20px' }}>
        <div style={{ background: dark0, borderRadius: 16, padding: 16, color: '#fff', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Clock size={22} color="#fff" sw={1.7} />
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: '#dcdcdc' }}>今日だけ、いつもと違う場所で降りたいときに申請できます。ボーイが確認後に降車ルートへ反映されます。</p>
        </div>
        <p style={{ margin: '22px 4px 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>本日の降車場所</p>
        <input value={reqPlace} onChange={(e) => setReqPlace(e.target.value)} placeholder="例：新潟駅 南口 タクシー乗り場前" style={{ height: 54, width: '100%', borderRadius: 14, background: '#f7f7f7', border: '1px solid #e6e6e6', color: '#0a0a0a', padding: '0 16px', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        <p style={{ margin: '18px 4px 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>理由（任意）</p>
        <textarea value={reqReason} onChange={(e) => setReqReason(e.target.value)} placeholder="例：万代で友人と待ち合わせのため" style={{ width: '100%', height: 90, borderRadius: 14, background: '#f7f7f7', border: '1px solid #e6e6e6', color: '#0a0a0a', padding: '14px 16px', fontSize: 15, fontFamily: 'inherit', lineHeight: 1.6, outline: 'none', boxSizing: 'border-box', resize: 'none' }} />
        <button onClick={() => act(async () => { await db.submitTodayRequest(castId, reqPlace, reqReason); setReqPlace(''); setReqReason('') }).then(() => go('cast-home'))} style={{ ...blackBtn, marginTop: 24 }}>この内容で申請する</button>
        <p style={{ margin: '12px 4px 0', fontSize: 12, color: '#a0a0a0', textAlign: 'center' }}>申請は本日の送迎のみに適用されます。</p>
      </div>
    </div>
  )

  /* ---------- ドライバー：配車依頼（ホーム） ---------- */
  const renderDriverOffer = () => {
    const myStatus = driverStatuses[driverKey] || '待機中'
    const busy = trips.some((t) => t.driver_key === driverKey && (t.completed || 0) < t.assigned_ids.length)
    return (
      <div style={darkScreen}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '8px 20px 14px' }}>
          <div>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 7 }}>
              <div onClick={() => !busy && setStatusMenuOpen((v) => !v)} role="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: busy ? 'default' : 'pointer', padding: '4px 10px 4px 8px', borderRadius: 999, background: '#1a1a1a' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: driverStatusConfig[myStatus].color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{myDrv?.name}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#7a7a7a' }}>{myStatus}</span>
                {!busy && <svg width="9" height="9" viewBox="0 0 12 12" style={{ marginLeft: 1 }}><path d="M2 4l4 4 4-4" stroke="#7a7a7a" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              {statusMenuOpen && !busy && (
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, background: '#1c1c1c', border: '1px solid #2c2c2c', borderRadius: 14, padding: 6, zIndex: 30, minWidth: 210, boxShadow: '0 16px 40px -8px rgba(0,0,0,.7)' }}>
                  {['待機中', 'お店前'].map((st) => {
                    const cfg = driverStatusConfig[st]
                    const isActive = myStatus === st
                    return (
                      <div key={st} onClick={() => act(() => db.setDriverStatus(driverKey, st)).then(() => setStatusMenuOpen(false))} role="button" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: isActive ? '#262626' : 'transparent' }}>
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}><p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>{cfg.label}</p><p style={{ margin: '1px 0 0', fontSize: 11, color: '#6e6e6e' }}>{cfg.sub}</p></div>
                        {isActive && <Check size={15} />}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-.02em' }}>配車依頼</h1>
          </div>
          <div onClick={() => go('driver-settings')} role="button" style={{ cursor: 'pointer' }}><Avatar bg="#2a2a2a" label={myDrv?.initial || '?'} size={40} fs={16} /></div>
        </div>
        <div style={{ height: 1, background: '#1f1f1f', margin: '0 20px 18px' }} />
        <div style={{ padding: '0 20px' }}>
          {myAssignedTrips.length === 0 ? (
            <div style={{ marginTop: 60, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}><Car size={28} color="#6e6e6e" /></div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>待機中</p>
              <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#8a8a8a' }}>ボーイからの配車指示をお待ちください。</p>
            </div>
          ) : (
            myAssignedTrips.map((tr) => (
              <div key={tr.t.id} style={{ background: dark0, borderRadius: 18, padding: 20, marginBottom: 16, color: '#fff', border: '1px solid #1e1e1e' }}>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#4a4a4a', letterSpacing: '.1em', textTransform: 'uppercase' }}>出発</p>
                  <p style={{ margin: 0, fontSize: 48, fontWeight: 800, color: '#fff', letterSpacing: '-.03em', lineHeight: 1 }}>{tr.departTime}</p>
                </div>
                <div style={{ paddingTop: 16, borderTop: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                  <div><p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#4a4a4a' }}>目的地</p><p style={{ margin: '3px 0 0', fontSize: 18, fontWeight: 800, letterSpacing: '-.01em' }}>{tr.label}</p></div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}><p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#4a4a4a' }}>推定所要時間</p><p style={{ margin: '3px 0 0', fontSize: 18, fontWeight: 800 }}>{tr.estMin}</p></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>{tr.castObjs.map((oc) => <Avatar key={oc.id} bg={oc.color} label={oc.name[0]} size={28} fs={12} border="2px solid #0a0a0a" />)}</div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#9a9a9a' }}>{tr.assignedCount}名乗車</span>
                </div>
                {!tr.arrived ? (
                  <button onClick={() => act(() => db.markArrived(tr.t))} style={{ width: '100%', height: 56, borderRadius: 14, background: '#06c167', color: '#fff', border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 20px -8px rgba(6,193,103,.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, lineHeight: 1.2 }}>店に到着しました<span style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>ボーイに乗車OKを知らせる</span></button>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#11271a', borderRadius: 12, padding: '11px 14px', marginBottom: 10 }}><Check size={16} color="#06c167" /><span style={{ fontSize: 13, fontWeight: 700, color: '#06c167' }}>乗車OKを通知しました</span></div>
                    <button onClick={() => { setDriverActiveTripId(tr.t.id); go('driver-trip') }} style={{ width: '100%', height: 52, borderRadius: 14, background: '#06c167', color: '#fff', border: 'none', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 20px -8px rgba(6,193,103,.7)' }}>運行を開始する</button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  /* ---------- ドライバー：運行中 ---------- */
  const renderDriverTrip = () => {
    const finished = !!(activeT && activeT.boarded && aDone >= aTotal && aTotal > 0)
    return (
      <div style={darkScreen}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 10px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeT ? tripDotColor(activeT) : '#c0c0c0', flexShrink: 0, animation: 'lm-pulse 1.6s infinite' }} />
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#9a9a9a', letterSpacing: '.04em' }}>{activeT ? '運行中' : '運行'}</p>
            </div>
            <h1 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 800, letterSpacing: '-.01em', whiteSpace: 'nowrap' }}>{activeT ? makeTripLabel(activeT.assigned_ids, girls) : '担当便なし'}</h1>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '7px 12px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>降車 {aDone}/{aTotal}</span>
        </div>
        {myTrips.length > 1 && (
          <div style={{ padding: '0 20px 12px', display: 'flex', gap: 8, overflowX: 'auto' }}>
            {myTrips.map((t) => {
              const isActive = activeT?.id === t.id
              const dn = t.completed || 0
              const st = !t.boarded ? '出発前' : dn < t.assigned_ids.length ? '送迎中' : '完了'
              return (
                <div key={t.id} onClick={() => setDriverActiveTripId(t.id)} role="button" style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 999, cursor: 'pointer', border: isActive ? '2px solid #06c167' : '1px solid #2a2a2a', background: isActive ? '#1a1a1a' : '#111', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: isActive ? '#06c167' : '#7a7a7a' }}>便 #{t.id}</span>
                  <span style={{ fontSize: 11.5, color: '#5a5a5a' }}>{t.depart_time} ・ {st}</span>
                </div>
              )
            })}
          </div>
        )}
        <div style={{ padding: '0 20px' }}>
          <div style={{ background: '#141414', borderRadius: 18, padding: '18px 18px 16px', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div><p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#4a4a4a', letterSpacing: '.1em', textTransform: 'uppercase' }}>出発</p><p style={{ margin: '3px 0 0', fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-.02em', lineHeight: 1 }}>{activeT ? activeT.depart_time : '-'}</p></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}><p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#4a4a4a' }}>所要</p><p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800, color: '#fff' }}>{activeT ? estMinLabel(activeT.assigned_ids, girls) : '-'}</p></div>
                <div style={{ width: 1, height: 28, background: '#262626' }} />
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#4a4a4a' }}>{activeT?.last_trip ? '便区分' : '帰店予定'}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800, color: '#fff' }}>{activeT ? (activeT.last_trip ? '最終便' : calcReturnTime(activeT.depart_time, activeT.assigned_ids, girls)) : '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 乗車ノード */}
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 26, flexShrink: 0 }}>
                {activeT?.boarded ? <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#06c167', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={13} color="#0a0a0a" sw={3} /></span> : <div style={{ width: 26, height: 26, borderRadius: 8, background: '#1a1a1a', border: '2px solid #2c2c2c', flexShrink: 0 }} />}
                <div style={{ width: 2, flex: 1, background: '#222', minHeight: 18 }} />
              </div>
              <div style={{ flex: 1, paddingBottom: 18, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>CLUB VENUS・KING</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: activeT?.boarded ? '#06c167' : '#7a7a7a', flexShrink: 0 }}>{activeT?.boarded ? '乗車済み' : 'お店前で乗車'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 11 }}>
                  {aBoardOrder.map((g) => (
                    <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ width: 18, height: 18, borderRadius: 5, background: '#222', color: '#cfcfcf', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, flexShrink: 0 }}>{g.boardNo}</span>
                      <Avatar bg={g.color} label={g.initial} size={28} fs={12} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#e8e8e8' }}>{g.name}</span>
                      <span style={{ fontSize: 11.5, color: '#6e6e6e', marginLeft: 'auto' }}>{g.area}</span>
                    </div>
                  ))}
                </div>
                {!activeT?.boarded && activeT && <button onClick={() => act(() => db.boardTrip(activeT))} style={{ marginTop: 14, width: '100%', height: 48, borderRadius: 13, background: '#fff', color: '#0a0a0a', border: 'none', fontSize: 14.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>全員の乗車を確認</button>}
              </div>
            </div>

            {aObjs.map((g) => (
              <div key={g.id} style={{ display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 26, flexShrink: 0 }}>
                  {g.done ? <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#06c167', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={13} color="#0a0a0a" sw={3} /></span> : g.current ? <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a0a', fontSize: 13, fontWeight: 800, flexShrink: 0, animation: 'lm-pulse 1.3s infinite' }}>{g.dropNo}</div> : <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#141414', border: '2px solid #2c2c2c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6e6e6e', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{g.dropNo}</div>}
                  <div style={{ width: 2, flex: 1, background: '#222', minHeight: 24 }} />
                </div>
                <div style={{ flex: 1, paddingBottom: 20, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 16, fontWeight: 700 }}>{g.name}</span><span style={{ fontSize: 11.5, color: '#7a7a7a' }}>{g.area} ・ {g.distLabel}</span></div>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: '#bdbdbd', lineHeight: 1.4 }}>{g.drop_address || g.addr}</p>
                  {g.current && activeT && <button onClick={() => act(() => db.completeStop(activeT))} style={{ marginTop: 10, width: '100%', height: 46, borderRadius: 12, background: '#06c167', color: '#fff', border: 'none', fontSize: 14.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}><Check size={16} /> 到着・降車完了</button>}
                  {g.done && <span style={{ display: 'inline-block', marginTop: 4, fontSize: 11.5, fontWeight: 700, color: '#06c167' }}>降車完了</span>}
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 26, flexShrink: 0 }}><div style={{ width: 26, height: 26, borderRadius: 8, background: '#141414', border: '2px solid #2c2c2c', flexShrink: 0 }} /></div>
              <div style={{ flex: 1, paddingBottom: 4 }}>
                {activeT?.last_trip ? <p style={{ margin: '3px 0 0', fontSize: 15, fontWeight: 700, color: '#5a5a5a' }}>終了</p> : <><p style={{ margin: '3px 0 2px', fontSize: 15, fontWeight: 700, color: '#7a7a7a' }}>帰店予定</p><p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#7a7a7a' }}>{activeT ? calcReturnTime(activeT.depart_time, activeT.assigned_ids, girls) : '-'}</p></>}
              </div>
            </div>
          </div>

          {finished && (
            <div style={{ marginTop: 12, textAlign: 'center', background: '#141414', borderRadius: 18, padding: '28px 24px' }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#06c167', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Check size={26} sw={3} /></div>
              <p style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>全員の送迎が完了しました</p>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#8a8a8a' }}>{activeT?.last_trip ? '本日の運行は終了です。お疲れ様でした。' : 'お店へお戻りください（予定 ' + (activeT ? calcReturnTime(activeT.depart_time, activeT.assigned_ids, girls) : '') + '）'}</p>
              <button onClick={() => { setDriverActiveTripId(null); go('driver-offer') }} style={{ marginTop: 18, height: 48, padding: '0 24px', borderRadius: 13, background: '#fff', color: '#0a0a0a', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>ホームに戻る</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ---------- 設定 ---------- */
  const renderSettings = (kind: 'boy' | 'cast' | 'driver') => {
    const dark = kind === 'driver'
    let avatarBg = '#0a0a0a', initial = 'B', name = 'ボーイ', sub = 'CLUB VENUS・KING'
    if (kind === 'cast') { avatarBg = castG?.color || '#888'; initial = castG?.name[0] || '?'; name = castG?.name || ''; sub = castG?.area || '' }
    if (kind === 'driver') { avatarBg = '#2a2a2a'; initial = myDrv?.initial || '?'; name = myDrv?.name || ''; sub = (myDrv?.car || '') + ' ・ ' + (myDrv?.plate || '') }
    return (
      <div style={dark ? darkScreen : lightScreen}>
        <div style={{ padding: '8px 20px 14px' }}><h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: '-.02em' }}>設定</h1></div>
        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 2px 20px', borderBottom: dark ? '1px solid #1f1f1f' : '1px solid #f0f0f0', marginBottom: 18 }}>
            <Avatar bg={avatarBg} label={initial} size={52} fs={20} />
            <div style={{ minWidth: 0 }}><p style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{name}</p><p style={{ margin: '2px 0 0', fontSize: 13, color: dark ? '#7a7a7a' : '#9a9a9a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</p></div>
          </div>
          <button onClick={logout} style={{ width: '100%', height: 54, borderRadius: 14, background: dark ? '#1f1f1f' : '#fff', border: dark ? '1px solid #2c2c2c' : '1px solid #ededed', color: dark ? '#ff5a5a' : '#e8473f', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>ログアウト</button>
        </div>
      </div>
    )
  }

  /* ---------- 画面ディスパッチ ---------- */
  const renderScreen = () => {
    switch (screen) {
      case 'login': return renderLogin()
      case 'boy-home': return renderBoyHome()
      case 'boy-new': return renderBoyNew()
      case 'boy-driver-select': return renderBoyDriverSelect()
      case 'boy-edit': return renderBoyEdit()
      case 'boy-status': return renderBoyStatus()
      case 'boy-admin': return renderBoyAdmin()
      case 'boy-admin-cast-detail': return renderCastDetail()
      case 'boy-admin-cast-edit': return renderCastEdit()
      case 'boy-admin-driver-detail': return renderDriverDetail()
      case 'boy-admin-driver-add': return renderDriverAdd()
      case 'boy-admin-delete-confirm': return renderDeleteConfirm()
      case 'boy-settings': return renderSettings('boy')
      case 'cast-home': return renderCastHome()
      case 'cast-place': return renderCastPlace()
      case 'cast-request': return renderCastRequest()
      case 'cast-settings': return renderSettings('cast')
      case 'driver-offer': return renderDriverOffer()
      case 'driver-trip': return renderDriverTrip()
      case 'driver-settings': return renderSettings('driver')
      default: return renderLogin()
    }
  }

  const inAdmin = ['boy-admin', 'boy-admin-cast-detail', 'boy-admin-cast-edit', 'boy-admin-driver-detail', 'boy-admin-driver-add', 'boy-admin-delete-confirm'].includes(screen)
  const inDispatch = ['boy-home', 'boy-new', 'boy-driver-select', 'boy-status', 'boy-edit'].includes(screen)
  const active = darkUI ? '#fff' : '#0a0a0a'
  const inact = darkUI ? '#6e6e6e' : '#b5b5b5'

  return (
    <div style={{ position: 'relative', minHeight: '100dvh', background: darkUI ? '#0a0a0a' : '#fff' }}>
      {renderScreen()}

      {/* ボトムナビ */}
      {role === 'boy' && (
        <BottomNav dark={false}>
          <NavItem color={inDispatch ? active : inact} onClick={() => go('boy-home')} icon={<Car color="currentColor" />} label="配車" />
          <NavItem color={inAdmin ? active : inact} onClick={() => go('boy-admin')} icon={<Grid />} label="管理" />
          <NavItem color={screen === 'boy-settings' ? active : inact} onClick={() => go('boy-settings')} icon={<Gear />} label="設定" />
        </BottomNav>
      )}
      {role === 'cast' && (
        <BottomNav dark={false}>
          <NavItem color={screen === 'cast-home' ? active : inact} onClick={() => go('cast-home')} icon={<HomeIcon />} label="ホーム" />
          <NavItem color={screen === 'cast-place' ? active : inact} onClick={() => go('cast-place')} icon={<Pin color="currentColor" />} label="降車場所" />
          <NavItem color={screen === 'cast-request' ? active : inact} onClick={() => go('cast-request')} icon={<Doc />} label="申請" />
          <NavItem color={screen === 'cast-settings' ? active : inact} onClick={() => go('cast-settings')} icon={<Gear />} label="設定" />
        </BottomNav>
      )}
      {role === 'driver' && (
        <BottomNav dark>
          <NavItem color={screen === 'driver-offer' || screen === 'driver-trip' ? active : inact} onClick={() => { const r = trips.find((t) => t.driver_key === driverKey && t.boarded && (t.completed || 0) < t.assigned_ids.length); go(r ? 'driver-trip' : 'driver-offer') }} icon={<HomeIcon />} label="ホーム" />
          <NavItem color={screen === 'driver-settings' ? active : inact} onClick={() => go('driver-settings')} icon={<Gear />} label="設定" />
        </BottomNav>
      )}

      {loading && role !== '' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 35, background: darkUI ? '#0a0a0a' : '#fff', overflow: 'hidden', padding: '58px 20px 0', boxSizing: 'border-box' }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: i === 0 ? 26 : 80, width: i === 0 ? '54%' : '100%', borderRadius: i === 0 ? 10 : 18, marginBottom: 14, background: darkUI ? 'linear-gradient(90deg,#1a1a1a 25%,#262626 50%,#1a1a1a 75%)' : 'linear-gradient(90deg,#f0f0f0 25%,#e6e6e6 50%,#f0f0f0 75%)', backgroundSize: '300% 100%', animation: 'sk-shimmer 1.3s ease infinite' }} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================ 小コンポーネント ============================ */
const statK: React.CSSProperties = { margin: 0, fontSize: 10, color: '#9a9a9a', fontWeight: 600 }
const statV: React.CSSProperties = { margin: '2px 0 0', fontSize: 15, fontWeight: 700 }
const Stat = ({ label, value }: { label: string; value: string }) => (
  <div><p style={statK}>{label}</p><p style={statV}>{value}</p></div>
)
const Div = () => <div style={{ width: 1, background: '#eee' }} />

function SelectRow({ g, selected, onToggle }: { g: { color: string; initial: string; name: string; area: string; distLabel: string }; selected: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} role="button" style={{ borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', border: selected ? '2px solid #0a0a0a' : '1px solid #ededed' }}>
      <Avatar bg={g.color} label={g.initial} size={40} fs={16} />
      <div style={{ flex: 1, minWidth: 0 }}><p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{g.name}</p><p style={{ margin: '2px 0 0', fontSize: 12, color: '#9a9a9a' }}>{g.area} ・ {g.distLabel}</p></div>
      {selected ? <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={13} sw={2.8} /></span> : <div style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid #e0e0e0', flexShrink: 0 }} />}
    </div>
  )
}

function DarkSelectRow({ g, selected, onToggle }: { g: { color: string; initial: string; name: string; area: string; distLabel: string }; selected: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} role="button" style={{ borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer', background: selected ? '#252525' : '#1a1a1a', border: selected ? '2px solid #fff' : '2px solid transparent' }}>
      <Avatar bg={g.color} label={g.initial} size={36} fs={14} />
      <div style={{ flex: 1, minWidth: 0 }}><p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>{g.name}</p><p style={{ margin: '1px 0 0', fontSize: 11.5, color: '#9a9a9a' }}>{g.area} ・ 店から {g.distLabel}</p></div>
      {selected ? <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={12} color="#0a0a0a" sw={3} /></span> : <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #3a3a3a', flexShrink: 0 }} />}
    </div>
  )
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ padding: '14px 0', borderBottom: last ? 'none' : '1px solid #f0f0f0' }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#9a9a9a', letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 600, lineHeight: 1.5 }}>{value}</p>
    </div>
  )
}

function FieldView({ label, value, multiline, placeholder }: { label: string; value: string; multiline?: boolean; placeholder?: boolean }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</p>
      <div style={{ minHeight: multiline ? 72 : 54, border: '1.5px solid #e8e8e8', borderRadius: 14, padding: multiline ? '14px 16px' : '0 16px', display: 'flex', alignItems: multiline ? 'flex-start' : 'center', background: '#fafafa' }}>
        <span style={{ fontSize: multiline ? 16 : 18, fontWeight: placeholder ? 500 : 600, color: placeholder ? '#c8c8c8' : '#0a0a0a', lineHeight: 1.55 }}>{value}</span>
      </div>
    </div>
  )
}

function RouteList({ objs, storeName, boarded, departTime, isLast, returnTime }: { objs: ReturnType<typeof buildTripObjs>; storeName: string; boarded: boolean; departTime: string; isLast: boolean; returnTime: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 13 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
          <div style={{ width: 24, height: 24, borderRadius: 8, background: '#f4f4f4', border: '2px solid #e8e8e8', flexShrink: 0 }} />
          <div style={{ width: 2, flex: 1, background: '#eee', minHeight: 18 }} />
        </div>
        <div style={{ flex: 1, paddingBottom: 18 }}>
          <p style={{ margin: '3px 0 2px', fontSize: 14, fontWeight: 700, color: '#b0b0b0' }}>{storeName}</p>
          <span style={{ fontSize: 12, fontWeight: 700, color: boarded ? '#06c167' : '#b0b0b0' }}>{boarded ? '出発済み' : departTime + ' 出発'}</span>
        </div>
      </div>
      {objs.map((g) => (
        <div key={g.id} style={{ display: 'flex', gap: 13, margin: '0 -12px', padding: '0 12px', borderRadius: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
            {g.done ? <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#06c167', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={12} sw={3} /></span> : g.current ? <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0, animation: 'lm-pulse 1.4s infinite' }}>{g.dropNo}</div> : <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#fff', border: '2px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b0b0b0', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{g.dropNo}</div>}
            <div style={{ width: 2, flex: 1, background: '#eee', minHeight: 18 }} />
          </div>
          <div style={{ flex: 1, paddingBottom: 18, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 15, fontWeight: 700 }}>{g.name}</span>{g.done && <span style={{ fontSize: 11, fontWeight: 700, color: '#06c167' }}>降車済み</span>}{g.current && <span style={{ fontSize: 11, fontWeight: 700, color: '#0a0a0a' }}>次の降車</span>}</div>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#9a9a9a' }}>{g.drop_address || g.addr}</p>
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 13 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}><div style={{ width: 24, height: 24, borderRadius: 8, background: '#f4f4f4', border: '2px solid #e8e8e8', flexShrink: 0 }} /></div>
        <div style={{ flex: 1, paddingBottom: 8 }}>
          {isLast ? <p style={{ margin: '3px 0 0', fontSize: 14, fontWeight: 700, color: '#b0b0b0' }}>終了</p> : <><p style={{ margin: '3px 0 2px', fontSize: 14, fontWeight: 700, color: '#b0b0b0' }}>帰店予定</p><p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#b0b0b0' }}>{returnTime}</p></>}
        </div>
      </div>
    </div>
  )
}

function BottomNav({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  return (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, zIndex: 40, background: dark ? '#0a0a0a' : '#fff', borderTop: dark ? '1px solid #1f1f1f' : '1px solid #efefef', padding: '10px 14px calc(env(safe-area-inset-bottom) + 14px)', display: 'flex', justifyContent: 'space-around' }}>
      {children}
    </div>
  )
}

function NavItem({ color, onClick, icon, label }: { color: string; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <div onClick={onClick} role="button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color, flex: 1 }}>
      {icon}
      <span style={{ fontSize: 10.5, fontWeight: 700 }}>{label}</span>
    </div>
  )
}
