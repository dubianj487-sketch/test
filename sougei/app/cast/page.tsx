'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { loadAppState, saveAppState, buildTripObjs, type AppState, type GirlKey } from '@/lib/appState'

const font = "'Hanken Grotesk', 'Noto Sans JP', sans-serif"
type Screen = 'home' | 'place' | 'request'

const BackBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} style={{ width: 38, height: 38, borderRadius: 11, background: '#f4f4f4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <svg width="9" height="15" viewBox="0 0 9 15"><path d="M8 1 2 7.5 8 14" stroke="#0a0a0a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </button>
)

export default function CastPage() {
  const router = useRouter()
  const [castId, setCastId] = useState<GirlKey>('miki')
  const [app, setAppRaw] = useState<AppState | null>(null)
  const [screen, setScreen] = useState<Screen>('home')
  const [dropDraft, setDropDraft] = useState('')
  const [dropSaved, setDropSaved] = useState(false)
  const [reqPlace, setReqPlace] = useState('')
  const [reqReason, setReqReason] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const role = localStorage.getItem('lm_role')
    if (role !== 'cast') { router.push('/'); return }
    const id = (localStorage.getItem('lm_castId') || 'miki') as GirlKey
    setCastId(id)
    const state = loadAppState()
    setDropDraft(state.castDrops[id] || state.girls[id]?.addr || '')
    setAppRaw(state)
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

  if (loading || !app) {
    return (
      <div style={{ minHeight: '100dvh', background: '#fff', padding: '58px 20px 0', boxSizing: 'border-box', fontFamily: font }}>
        {[38, 26, 56, 88, 56].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: 16, background: 'linear-gradient(90deg,#f0f0f0 25%,#e6e6e6 50%,#f0f0f0 75%)', backgroundSize: '300% 100%', animation: `sk-shimmer 1.3s ease infinite ${i * 0.07}s`, marginBottom: i === 0 ? 9 : i === 1 ? 24 : 14, width: i === 0 ? '50%' : '100%' }} />
        ))}
      </div>
    )
  }

  const castGirl = app.girls[castId] || Object.values(app.girls)[0]
  const castDrop = app.castDrops[castId] || castGirl?.addr || ''
  const castTrip = app.trips.find(t => t.assignedIds.includes(castId)) || null
  const castObjs = castTrip ? buildTripObjs(castTrip, app.girls) : []
  const castEntry = castObjs.find(o => o.id === castId)
  const castDrv = castTrip?.driverKey ? app.drivers[castTrip.driverKey] : null
  const castTodayReq = app.todayRequests[castId]
  const castTripStatus = !castTrip ? '' : (!castTrip.driverKey ? 'ドライバー確定待ち' : (!castTrip.boarded ? '乗車前' : '送迎中'))

  function sendRideRequest() {
    setApp(s => ({ ...s, rideRequests: { ...s.rideRequests, [castId]: 'approved' } }))
  }

  function saveDrop() {
    setApp(s => ({ ...s, castDrops: { ...s.castDrops, [castId]: dropDraft } }))
    setDropSaved(true)
  }

  function submitToday() {
    if (!reqPlace.trim()) return
    setApp(s => ({ ...s, todayRequests: { ...s.todayRequests, [castId]: { place: reqPlace, reason: reqReason, status: '承認待ち' } } }))
    setReqPlace('')
    setReqReason('')
    setScreen('home')
  }

  const nav = (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, zIndex: 40, background: '#ffffff', borderTop: '1px solid #efefef', padding: '10px 14px 24px', display: 'flex', justifyContent: 'space-around', boxSizing: 'border-box' }}>
      <div onClick={() => setScreen('home')} role="button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: screen === 'home' ? '#0a0a0a' : '#b5b5b5' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 11 12 4l8 7m-14-1v8a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span style={{ fontSize: 10.5, fontWeight: 700 }}>ホーム</span>
      </div>
      <div onClick={() => setScreen('place')} role="button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: screen === 'place' ? '#0a0a0a' : '#b5b5b5' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" /></svg>
        <span style={{ fontSize: 10.5, fontWeight: 700 }}>降車場所</span>
      </div>
      <div onClick={() => setScreen('request')} role="button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: screen === 'request' ? '#0a0a0a' : '#b5b5b5' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 4h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8m0-16-4 4m4-4v16m0 0-4-4M9 9h6M9 13h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span style={{ fontSize: 10.5, fontWeight: 700 }}>申請</span>
      </div>
    </div>
  )

  /* ====== HOME ====== */
  if (screen === 'home') return (
    <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '52px 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 14px' }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#8a8a8a' }}>CLUB VENUS・KING</p>
          <h1 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>こんばんは、{castGirl.name}さん</h1>
        </div>
        <button onClick={logout} style={{ height: 38, padding: '0 14px', borderRadius: 10, background: '#f4f4f4', border: 'none', color: '#5a5a5a', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>ログアウト</button>
      </div>

      <div style={{ padding: '0 20px' }}>
        {castEntry ? (
          <div style={{ background: '#0a0a0a', borderRadius: 20, padding: 20, color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06c167', animation: 'lm-pulse 1.6s infinite', display: 'inline-block' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#cfcfcf' }}>本日の帰り便 ・ {castTripStatus}</span>
            </div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em' }}>{castEntry.dropNo}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#a8a8a8', paddingBottom: 6 }}>/ {castTrip?.assignedIds.length} 番目に降車</span>
            </div>
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12, background: '#1a1a1a', borderRadius: 13, padding: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>{castDrv?.initial || '−'}</div>
              <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{castDrv?.name || '未定'}</p><p style={{ margin: '1px 0 0', fontSize: 12, color: '#9a9a9a' }}>{castDrv?.car || '−'}</p></div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#06c167', whiteSpace: 'nowrap', flexShrink: 0 }}>{castTrip?.departTime} 出発</span>
            </div>
          </div>
        ) : (
          <div style={{ background: '#f7f7f7', borderRadius: 18, padding: 20 }}>
            <p style={{ margin: '0 0 14px', fontSize: 14, color: '#8a8a8a', textAlign: 'center' }}>本日の帰り便にはまだ登録されていません。</p>
            {app.rideRequests[castId] === 'approved' ? (
              <div style={{ background: '#eafaf0', border: '1px solid #bdeccf', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><path d="m5 12 4 4 10-10" stroke="#06c167" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0a7a3f' }}>今日の送迎をリクエストしました</p>
                </div>
                <p style={{ margin: '6px 0 0 28px', fontSize: 12, color: '#3a8a5a', lineHeight: 1.5 }}>乗車情報が確定したらこちらに表示されます。</p>
              </div>
            ) : (
              <button onClick={sendRideRequest} style={{ width: '100%', height: 52, borderRadius: 13, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /></svg>
                今日の送迎をリクエスト
              </button>
            )}
          </div>
        )}

        {castTodayReq && castTodayReq.status !== '承認済み' && (
          <div style={{ marginTop: 12, background: '#fff8ed', border: '1px solid #ffe3b8', borderRadius: 14, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#c77700' }}>本日のみ降車場所を変更</span>
              <span style={{ fontSize: 11, fontWeight: 700, background: '#ffe3b8', color: '#8a5a00', padding: '2px 8px', borderRadius: 999 }}>{castTodayReq.status}</span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 13.5, fontWeight: 600, color: '#8a5a00' }}>{castTodayReq.place}</p>
          </div>
        )}

        <p style={{ margin: '24px 4px 10px', fontSize: 13, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>降車場所</p>
        <div onClick={() => setScreen('place')} role="button" style={{ border: '1px solid #ededed', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke="#0a0a0a" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="12" cy="10" r="2.4" stroke="#0a0a0a" strokeWidth="1.8" /></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#9a9a9a', fontWeight: 600 }}>登録済みの降車場所</p>
            <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{castDrop}</p>
          </div>
          <svg width="9" height="15" viewBox="0 0 9 15" style={{ flexShrink: 0 }}><path d="M1 1l6 6.5L1 14" stroke="#bdbdbd" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>

        <button onClick={() => setScreen('request')} style={{ marginTop: 14, width: '100%', height: 56, borderRadius: 15, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 15.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" /><path d="M12 8v4m-2-2h4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>
          今日だけ違う場所に！
        </button>
      </div>
      {nav}
    </div>
  )

  /* ====== PLACE ====== */
  if (screen === 'place') return (
    <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '52px 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 14px' }}>
        <BackBtn onClick={() => setScreen('home')} />
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.01em' }}>降車場所の登録</h1>
      </div>
      <div style={{ padding: '0 20px' }}>
        <p style={{ margin: '6px 4px 16px', fontSize: 13.5, color: '#7a7a7a', lineHeight: 1.6 }}>普段、帰りに降りる場所を登録します。送迎の降車ルートはこの住所をもとに組まれます。</p>
        <p style={{ margin: '0 4px 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>住所・目印</p>
        <textarea
          value={dropDraft}
          onChange={e => { setDropDraft(e.target.value); setDropSaved(false) }}
          placeholder="例：新潟市中央区万代1-6-3 ○○マンション402"
          style={{ width: '100%', height: 120, borderRadius: 14, background: '#f7f7f7', border: '1px solid #e6e6e6', color: '#0a0a0a', padding: '14px 16px', fontSize: 15, fontFamily: 'inherit', lineHeight: 1.6, outline: 'none', boxSizing: 'border-box', resize: 'none' }}
        />
        <p style={{ margin: '10px 4px 0', fontSize: 12, color: '#a0a0a0', lineHeight: 1.5 }}>※ マンション名・部屋番号・近くの目印まで入れると、ドライバーが迷いません。</p>

        {dropSaved && (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, background: '#eafaf0', border: '1px solid #bdeccf', borderRadius: 13, padding: '12px 14px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="m5 12 4 4 10-10" stroke="#06c167" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0a7a3f' }}>降車場所を保存しました</span>
          </div>
        )}

        <button onClick={saveDrop} style={{ marginTop: 24, width: '100%', height: 56, borderRadius: 15, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>この場所を保存</button>
      </div>
      {nav}
    </div>
  )

  /* ====== REQUEST ====== */
  return (
    <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '52px 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 14px' }}>
        <BackBtn onClick={() => setScreen('home')} />
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.01em' }}>本日のみ変更申請</h1>
      </div>
      <div style={{ padding: '0 20px' }}>
        <div style={{ background: '#0a0a0a', borderRadius: 16, padding: 16, color: '#fff', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.7" /><path d="M12 7v5l3 2" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" /></svg>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: '#dcdcdc' }}>今日だけ、いつもと違う場所で降りたいときに申請できます。ボーイが確認後に降車ルートへ反映されます。</p>
        </div>

        <p style={{ margin: '22px 4px 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>本日の降車場所</p>
        <input
          value={reqPlace}
          onChange={e => setReqPlace(e.target.value)}
          placeholder="例：新潟駅 南口 タクシー乗り場前"
          style={{ height: 54, width: '100%', borderRadius: 14, background: '#f7f7f7', border: '1px solid #e6e6e6', color: '#0a0a0a', padding: '0 16px', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
        />

        <p style={{ margin: '18px 4px 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>理由（任意）</p>
        <textarea
          value={reqReason}
          onChange={e => setReqReason(e.target.value)}
          placeholder="例：万代で友人と待ち合わせのため"
          style={{ width: '100%', height: 90, borderRadius: 14, background: '#f7f7f7', border: '1px solid #e6e6e6', color: '#0a0a0a', padding: '14px 16px', fontSize: 15, fontFamily: 'inherit', lineHeight: 1.6, outline: 'none', boxSizing: 'border-box', resize: 'none' }}
        />

        <button onClick={submitToday} style={{ marginTop: 24, width: '100%', height: 56, borderRadius: 15, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>この内容で申請する</button>
        <p style={{ margin: '12px 4px 0', fontSize: 12, color: '#a0a0a0', textAlign: 'center' }}>申請は本日の送迎のみに適用されます。</p>
      </div>
      {nav}
    </div>
  )
}
