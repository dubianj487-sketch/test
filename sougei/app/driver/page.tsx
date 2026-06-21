'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { loadAppState, saveAppState, DRIVER_STATUS_CONFIG, buildTripObjs, type AppState, type DriverKey } from '@/lib/appState'

const font = "'Hanken Grotesk', 'Noto Sans JP', sans-serif"
type Screen = 'offer' | 'trip'

export default function DriverPage() {
  const router = useRouter()
  const [driverKey, setDriverKey] = useState<DriverKey>('sato')
  const [app, setAppRaw] = useState<AppState | null>(null)
  const [screen, setScreen] = useState<Screen>('offer')
  const [activeTripId, setActiveTripId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const role = localStorage.getItem('lm_role')
    if (role !== 'driver') { router.push('/'); return }
    const key = (localStorage.getItem('lm_driverKey') || 'sato') as DriverKey
    setDriverKey(key)
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

  function logout() {
    localStorage.removeItem('lm_role')
    router.push('/')
  }

  function setMyStatus(status: string) {
    setApp(s => ({ ...s, driverStatuses: { ...s.driverStatuses, [driverKey]: status } as Record<DriverKey, string> }))
  }

  function boardTrip(tripId: number) {
    setApp(s => {
      const trip = s.trips.find(t => t.id === tripId)
      const newStatuses = trip?.driverKey ? { ...s.driverStatuses, [trip.driverKey]: '移動中' } : s.driverStatuses
      return { ...s, trips: s.trips.map(t => t.id === tripId ? { ...t, boarded: true } : t), driverStatuses: newStatuses as Record<DriverKey, string> }
    })
    setActiveTripId(tripId)
    setScreen('trip')
  }

  function completeStop(tripId: number) {
    setApp(s => {
      const trip = s.trips.find(t => t.id === tripId)
      if (!trip) return s
      const newCompleted = Math.min((trip.completed || 0) + 1, trip.assignedIds.length)
      const isAllDone = newCompleted >= trip.assignedIds.length
      let newStatuses = s.driverStatuses
      if (isAllDone && trip.driverKey) {
        newStatuses = { ...s.driverStatuses, [trip.driverKey]: trip.lastTrip ? '終了' : '待機中' } as Record<DriverKey, string>
      }
      return { ...s, trips: s.trips.map(t => t.id !== tripId ? t : { ...t, completed: newCompleted }), driverStatuses: newStatuses }
    })
  }

  if (loading || !app) {
    return (
      <div style={{ minHeight: '100dvh', background: '#0a0a0a', padding: '58px 20px 0', boxSizing: 'border-box', fontFamily: font }}>
        <div style={{ height: 13, width: '38%', borderRadius: 7, background: 'linear-gradient(90deg,#1a1a1a 25%,#262626 50%,#1a1a1a 75%)', backgroundSize: '300% 100%', animation: 'sk-shimmer 1.3s ease infinite', marginBottom: 9 }} />
        <div style={{ height: 26, width: '54%', borderRadius: 10, background: 'linear-gradient(90deg,#1a1a1a 25%,#262626 50%,#1a1a1a 75%)', backgroundSize: '300% 100%', animation: 'sk-shimmer 1.3s ease infinite .07s', marginBottom: 20 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[0, 1].map(i => <div key={i} style={{ height: 72, borderRadius: 12, background: 'linear-gradient(90deg,#1a1a1a 25%,#262626 50%,#1a1a1a 75%)', backgroundSize: '300% 100%', animation: `sk-shimmer 1.3s ease infinite ${(i + 2) * 0.07}s` }} />)}
        </div>
        <div style={{ height: 160, borderRadius: 20, background: 'linear-gradient(90deg,#1a1a1a 25%,#262626 50%,#1a1a1a 75%)', backgroundSize: '300% 100%', animation: 'sk-shimmer 1.3s ease infinite .34s' }} />
      </div>
    )
  }

  const myDrv = app.drivers[driverKey] || app.drivers['sato']
  const myTrips = app.trips.filter(t => t.driverKey === driverKey)
  const myStatus = app.driverStatuses[driverKey] || '待機中'
  const myStatusCfg = DRIVER_STATUS_CONFIG[myStatus] || DRIVER_STATUS_CONFIG['待機中']

  const activeT = (activeTripId ? myTrips.find(t => t.id === activeTripId) : myTrips.find(t => (t.completed || 0) < t.assignedIds.length)) || myTrips[0] || null
  const aObjs = activeT ? buildTripObjs(activeT, app.girls) : []
  const aTotal = aObjs.length
  const aDone = activeT ? (activeT.completed || 0) : 0
  const aBoardOrder = [...aObjs].sort((a, b) => b.boardNo - a.boardNo)

  const myAssignedTrips = myTrips.map(t => {
    const tot = t.assignedIds.length, dn = t.completed || 0
    const estKm = Math.round(t.assignedIds.reduce((s, id) => s + (app.girls[id]?.dist || 0), 0) + 5)
    const st = !t.boarded ? '出発前' : (dn < tot ? '送迎中' : '完了')
    return { id: t.id, label: '便 #' + t.id, departTime: t.departTime, assignedCount: tot, dropsTotal: tot, estimatedDist: '約' + estKm + 'km', status: st, castObjs: t.assignedIds.map(id => { const g = app.girls[id] || { name: '?', area: '', dist: 0, addr: '', color: '#aaa' }; return { ...g, initial: g.name[0] } }) }
  })

  const allStatuses = ['待機中', 'お店前'].map(st => {
    const cfg = DRIVER_STATUS_CONFIG[st]
    return { label: st, color: cfg.color, sub: cfg.sub, isActive: myStatus === st, onSelect: () => setMyStatus(st) }
  })

  const nav = (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, zIndex: 40, background: '#0a0a0a', borderTop: '1px solid #1f1f1f', padding: '10px 14px 24px', display: 'flex', justifyContent: 'space-around', boxSizing: 'border-box' }}>
      <div onClick={() => setScreen('offer')} role="button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: screen === 'offer' ? '#fff' : '#6e6e6e' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M8 3v4m8-4v4M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        <span style={{ fontSize: 10.5, fontWeight: 700 }}>依頼</span>
      </div>
      <div onClick={() => setScreen('trip')} role="button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: screen === 'trip' ? '#fff' : '#6e6e6e' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 20 3 17V4l6 3m0 13 6-3m-6 3V7m6 10 6 3V7l-6-3m0 13V4m0 0L9 7" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
        <span style={{ fontSize: 10.5, fontWeight: 700 }}>運行</span>
      </div>
    </div>
  )

  /* ====== OFFER ====== */
  if (screen === 'offer') return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', padding: '0 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
      <div style={{ background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 14px' }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#6e6e6e', letterSpacing: '.04em' }}>{myDrv.name}</p>
          <h1 style={{ margin: '2px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: '-.02em' }}>配車依頼</h1>
        </div>
        <button onClick={logout} style={{ height: 38, padding: '0 14px', borderRadius: 10, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#9a9a9a', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>ログアウト</button>
      </div>

      <div style={{ padding: '0 20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: '#6e6e6e', letterSpacing: '.06em' }}>自分のステータス</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: myStatusCfg.color, display: 'inline-block' }} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: myStatusCfg.color }}>現在：{myStatus}</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {allStatuses.map(st => (
            <div key={st.label} onClick={st.onSelect} role="button" style={{ borderRadius: 12, padding: '11px 12px', cursor: 'pointer', border: st.isActive ? '2px solid ' + st.color : '1px solid #262626', background: st.isActive ? '#1c1c1c' : '#111' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: st.color, display: 'inline-block' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: st.isActive ? st.color : '#7a7a7a' }}>{st.label}</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#6e6e6e' }}>{st.sub}</p>
            </div>
          ))}
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 11, color: '#5a5a5a', lineHeight: 1.5 }}>「移動中」は乗車確認時に自動変更。「終了」は最後の便の送迎完了時に自動変更されます。</p>
      </div>
      <div style={{ height: 1, background: '#1f1f1f', margin: '0 20px 18px' }} />

      <div style={{ padding: '0 20px' }}>
        {myAssignedTrips.length === 0 ? (
          <div style={{ marginTop: 60, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 13l1.6-4.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.5L19 13m-14 0h14v4a1 1 0 0 1-1 1h-1.2a1.8 1.8 0 1 1-3.6 0H9.8a1.8 1.8 0 1 1-3.6 0H5a1 1 0 0 1-1-1v-4h1Z" stroke="#6e6e6e" strokeWidth="1.8" strokeLinejoin="round" /></svg>
            </div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>待機中</p>
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#8a8a8a' }}>ボーイからの配車指示をお待ちください。</p>
          </div>
        ) : myAssignedTrips.map(trip => (
          <div key={trip.id} style={{ border: '1px solid #262626', borderRadius: 22, overflow: 'hidden', background: '#141414', marginBottom: 16 }}>
            <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid #222' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', color: '#06c167' }}>担当便</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: '#222', padding: '4px 11px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>{trip.departTime} 出発</span>
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 26, fontWeight: 800, letterSpacing: '-.01em' }}>{trip.label}</p>
              <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#9a9a9a' }}>店前で乗車 ・ {trip.assignedCount}名 ・ {trip.status}</p>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', gap: 18 }}>
              <div><p style={{ margin: 0, fontSize: 11, color: '#8a8a8a', fontWeight: 600 }}>乗車</p><p style={{ margin: '3px 0 0', fontSize: 18, fontWeight: 800, whiteSpace: 'nowrap' }}>{trip.assignedCount} 名</p></div>
              <div style={{ width: 1, background: '#262626' }} />
              <div><p style={{ margin: 0, fontSize: 11, color: '#8a8a8a', fontWeight: 600 }}>降車地</p><p style={{ margin: '3px 0 0', fontSize: 18, fontWeight: 800, whiteSpace: 'nowrap' }}>{trip.dropsTotal} 箇所</p></div>
              <div style={{ width: 1, background: '#262626' }} />
              <div><p style={{ margin: 0, fontSize: 11, color: '#8a8a8a', fontWeight: 600 }}>推定距離</p><p style={{ margin: '3px 0 0', fontSize: 18, fontWeight: 800, whiteSpace: 'nowrap' }}>{trip.estimatedDist}</p></div>
            </div>
            <div style={{ padding: '0 18px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                {trip.castObjs.map((oc, i) => <div key={i} style={{ width: 34, height: 34, borderRadius: '50%', background: oc.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, border: '2px solid #141414', marginLeft: i === 0 ? 0 : -6 }}>{oc.initial}</div>)}
              </div>
              <button onClick={() => boardTrip(trip.id)} style={{ width: '100%', height: 52, borderRadius: 14, background: '#06c167', color: '#fff', border: 'none', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 20px -8px rgba(6,193,103,.7)' }}>運行を開始する</button>
            </div>
          </div>
        ))}
      </div>
      {nav}
    </div>
  )

  /* ====== TRIP ====== */
  const driverFinished = !!(activeT && activeT.boarded && aDone >= aTotal && aTotal > 0)

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', padding: '0 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
      <div style={{ background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 10px' }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#06c167', letterSpacing: '.04em' }}>{activeT ? '運行中' : '運行'}</p>
          <h1 style={{ margin: '2px 0 0', fontSize: 24, fontWeight: 800, letterSpacing: '-.01em', whiteSpace: 'nowrap' }}>{activeT ? '便 #' + activeT.id : '担当便なし'}</h1>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '7px 12px', borderRadius: 999, whiteSpace: 'nowrap' }}>降車 {aDone}/{aTotal}</span>
      </div>

      {myTrips.length > 1 && (
        <div style={{ padding: '0 20px 12px', display: 'flex', gap: 8, overflowX: 'auto' }}>
          {myTrips.map(t => {
            const dn = t.completed || 0, tot = t.assignedIds.length
            const st = !t.boarded ? '出発前' : (dn < tot ? '送迎中' : '完了')
            const isActive = activeT?.id === t.id
            return (
              <div key={t.id} onClick={() => setActiveTripId(t.id)} role="button" style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 999, cursor: 'pointer', border: isActive ? '2px solid #06c167' : '1px solid #2a2a2a', background: isActive ? '#1a1a1a' : '#111', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: isActive ? '#06c167' : '#7a7a7a' }}>便 #{t.id}</span>
                <span style={{ fontSize: 11.5, color: '#5a5a5a' }}>{t.departTime} ・ {st}</span>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ padding: '0 20px' }}>
        <div style={{ border: '1px solid #262626', borderRadius: 18, padding: 16, background: '#141414' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke="#06c167" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="12" cy="10" r="2.2" fill="#06c167" /></svg>
              <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' }}>店前で乗車</span>
            </div>
            {activeT?.boarded && <span style={{ fontSize: 11.5, fontWeight: 700, color: '#06c167' }}>乗車済み</span>}
          </div>
          <p style={{ margin: '8px 0 12px 27px', fontSize: 12.5, color: '#9a9a9a' }}>乗車順（奥詰め）：番号順に着席</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingLeft: 27 }}>
            {aBoardOrder.map(g => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 20, height: 20, borderRadius: 6, background: '#222', color: '#cfcfcf', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{g.boardNo}</span>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: g.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{g.initial}</div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{g.name}</span>
                <span style={{ fontSize: 11.5, color: '#7a7a7a', marginLeft: 'auto' }}>{g.area}</span>
              </div>
            ))}
          </div>
          {!activeT?.boarded && activeT && (
            <button onClick={() => boardTrip(activeT.id)} style={{ marginTop: 14, width: '100%', height: 48, borderRadius: 13, background: '#fff', color: '#0a0a0a', border: 'none', fontSize: 14.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>全員の乗車を確認</button>
          )}
        </div>

        <p style={{ margin: '24px 4px 12px', fontSize: 13, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>降車順（お店から近い順）</p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {aObjs.map((g, i) => (
            <div key={g.id} style={{ display: 'flex', gap: 13 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 26 }}>
                {g.done ? <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#06c167', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="13" height="13" viewBox="0 0 24 24"><path d="m5 12 4 4 10-10" stroke="#0a0a0a" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                  : g.current ? <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a0a', fontSize: 13, fontWeight: 800, flexShrink: 0, animation: 'lm-pulse 1.3s infinite' }}>{g.dropNo}</div>
                  : <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#141414', border: '2px solid #2c2c2c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6e6e6e', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{g.dropNo}</div>}
                {i < aObjs.length - 1 && <div style={{ width: 2, flex: 1, background: '#222', minHeight: 24 }} />}
              </div>
              <div style={{ flex: 1, paddingBottom: 20, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{g.name}</span>
                  <span style={{ fontSize: 11.5, color: '#7a7a7a' }}>{g.area} ・ {g.distLabel}</span>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: '#bdbdbd', lineHeight: 1.4 }}>{g.addr}</p>
                {g.current && (
                  <button onClick={() => activeT && completeStop(activeT.id)} style={{ marginTop: 10, width: '100%', height: 46, borderRadius: 12, background: '#06c167', color: '#fff', border: 'none', fontSize: 14.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24"><path d="m5 12 4 4 10-10" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    到着・降車完了
                  </button>
                )}
                {g.done && <span style={{ display: 'inline-block', marginTop: 4, fontSize: 11.5, fontWeight: 700, color: '#06c167' }}>降車完了</span>}
              </div>
            </div>
          ))}
        </div>

        {driverFinished && (
          <div style={{ marginTop: 8, textAlign: 'center', background: '#141414', border: '1px solid #262626', borderRadius: 18, padding: 24 }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#06c167', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24"><path d="m5 12 4 4 10-10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <p style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>全員の送迎が完了しました</p>
            <button onClick={() => setScreen('offer')} style={{ marginTop: 18, height: 48, padding: '0 24px', borderRadius: 13, background: '#fff', color: '#0a0a0a', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>依頼一覧に戻る</button>
          </div>
        )}
      </div>
      {nav}
    </div>
  )
}
