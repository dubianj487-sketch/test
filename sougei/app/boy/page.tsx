'use client'

import { rem } from '@/lib/rem'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const font = "'Hanken Grotesk', 'Noto Sans JP', sans-serif"
type Screen = 'home' | 'detail' | 'admin'

type DriverRow = { id: string; name: string; status: string; note: string | null; capacity: number }
type GirlRow = { id: string; name: string; area: string | null }
type DispatchRow = {
  id: string; driver_id: string | null; destination: string | null
  urgency: string; scheduled_time: string | null; status: string
  date: string; created_at: string
  drivers: DriverRow | null
  dispatch_girls: { girls: GirlRow | null }[]
}

const PALETTE = ['#F5A623', '#7B61FF', '#06C167', '#E84855', '#276EF1', '#00A8B5', '#FF7A45', '#FF6B9C', '#9B59B6', '#2ECC71']
function strColor(id: string) { return PALETTE[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length] }

const DRV_COLOR: Record<string, string> = { '待機': '#1a9e50', '移動中': '#c2750a', '終了': '#aeaeb2', 'お店前': '#8b5cf6' }
const DRV_BG: Record<string, string> = { '待機': '#f0fdf4', '移動中': '#fff7ed', '終了': '#f4f4f4', 'お店前': '#f5f3ff' }
const DISP_LABEL: Record<string, string> = { '待機': '承諾待ち', '移動中': '移動中', '完了': '完了' }
const DISP_COLOR: Record<string, string> = { '待機': '#3478f6', '移動中': '#c2750a', '完了': '#aeaeb2' }

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: 38, height: 38, borderRadius: 11, background: '#f4f4f4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="9" height="15" viewBox="0 0 9 15"><path d="M8 1 2 7.5 8 14" stroke="#0a0a0a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  )
}

export default function BoyPage() {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>('home')
  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [dispatches, setDispatches] = useState<DispatchRow[]>([])
  const [viewDispatch, setViewDispatch] = useState<DispatchRow | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const [drvRes, dspRes] = await Promise.all([
      supabase.from('drivers').select('*').order('name'),
      supabase
        .from('dispatches')
        .select('*, drivers(*), dispatch_girls(girls(id, name, area))')
        .eq('date', today)
        .order('created_at', { ascending: false }),
    ])
    setDrivers((drvRes.data as DriverRow[]) || [])
    const dsps = (dspRes.data as DispatchRow[]) || []
    setDispatches(dsps)
    setViewDispatch(prev => prev ? (dsps.find(d => d.id === prev.id) ?? prev) : null)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (localStorage.getItem('lm_role') !== 'boy') { router.push('/'); return }
    loadData()
  }, [loadData, router])

  useEffect(() => {
    const ch = supabase.channel('boy-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatches' }, () => loadData(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => loadData(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_girls' }, () => loadData(false))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [loadData])

  function logout() {
    localStorage.removeItem('lm_role')
    router.push('/')
  }

  const activeDispatches = dispatches.filter(d => d.status !== '完了')
  const completedDispatches = dispatches.filter(d => d.status === '完了')

  const nav = (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, zIndex: 40, background: '#ffffff', borderTop: '1px solid #efefef', padding: '10px 14px max(10px, env(safe-area-inset-bottom))', display: 'flex', justifyContent: 'space-around', boxSizing: 'border-box' }}>
      <div onClick={() => setScreen('home')} role="button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: screen !== 'admin' ? '#0a0a0a' : '#b5b5b5', flex: 1 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l1.6-4.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.5L19 13m-14 0h14v4a1 1 0 0 1-1 1h-1.2a1.8 1.8 0 1 1-3.6 0H9.8a1.8 1.8 0 1 1-3.6 0H5a1 1 0 0 1-1-1v-4h1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        <span style={{ fontSize: rem(10.5), fontWeight: 700 }}>配車</span>
      </div>
      <div onClick={() => setScreen('admin')} role="button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: screen === 'admin' ? '#0a0a0a' : '#b5b5b5', flex: 1 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" /><rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" /><rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" /><rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" /></svg>
        <span style={{ fontSize: rem(10.5), fontWeight: 700 }}>管理</span>
      </div>
    </div>
  )

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: '#fff', padding: '58px 20px 0', boxSizing: 'border-box', fontFamily: font }}>
      {([38, 26, 56, 72, 72, 88, 88] as number[]).map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: i < 3 ? 16 : 18, background: 'linear-gradient(90deg,#f0f0f0 25%,#e6e6e6 50%,#f0f0f0 75%)', backgroundSize: '300% 100%', animation: `sk-shimmer 1.3s ease infinite ${i * .07}s`, marginBottom: i === 0 ? 9 : i === 1 ? 24 : i === 2 ? 22 : 10, width: i === 0 ? '38%' : i === 1 ? '54%' : '100%' }} />
      ))}
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
        <button onClick={() => router.push('/dispatch')} style={{ width: '100%', height: 58, borderRadius: 16, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: rem(16), fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: '0 8px 20px -8px rgba(0,0,0,.5)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /></svg>
          配車を依頼する
        </button>

        {drivers.length > 0 && (
          <>
            <p style={{ margin: '24px 4px 10px', fontSize: rem(12), fontWeight: 700, color: '#8a8a8a', letterSpacing: '.06em' }}>ドライバー</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {drivers.map(d => (
                <div key={d.id} style={{ borderRadius: 14, padding: '12px 14px', background: DRV_BG[d.status] || '#f4f4f4', border: `1.5px solid ${DRV_COLOR[d.status] || '#ccc'}22` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: DRV_COLOR[d.status] || '#888', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: rem(14), flexShrink: 0 }}>{d.name[0]}</div>
                    <p style={{ margin: 0, fontSize: rem(14), fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</p>
                  </div>
                  <span style={{ display: 'inline-block', fontSize: rem(11.5), fontWeight: 700, color: DRV_COLOR[d.status] || '#888', background: '#fff', padding: '3px 8px', borderRadius: 6 }}>{d.status}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <p style={{ margin: '26px 4px 10px', fontSize: rem(13), fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>本日の便</p>

        {activeDispatches.length > 0 ? activeDispatches.map(d => {
          const girlList = (d.dispatch_girls || []).map(dg => dg.girls).filter((g): g is GirlRow => g !== null)
          const label = DISP_LABEL[d.status] || d.status
          const color = DISP_COLOR[d.status] || '#888'
          return (
            <div key={d.id} onClick={() => { setViewDispatch(d); setScreen('detail') }} role="button" style={{ border: '1px solid #ededed', borderRadius: 18, padding: 16, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,.04)', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, animation: 'lm-pulse 1.6s infinite', flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: rem(15), fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.destination || '目的地未設定'}</span>
                </div>
                <span style={{ fontSize: rem(12), fontWeight: 700, color: '#fff', background: color, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
                {d.scheduled_time && (
                  <>
                    <div><p style={{ margin: 0, fontSize: rem(10), color: '#9a9a9a', fontWeight: 600 }}>出発</p><p style={{ margin: '2px 0 0', fontSize: rem(15), fontWeight: 700 }}>{d.scheduled_time}</p></div>
                    <div style={{ width: 1, background: '#eee' }} />
                  </>
                )}
                <div><p style={{ margin: 0, fontSize: rem(10), color: '#9a9a9a', fontWeight: 600 }}>乗車</p><p style={{ margin: '2px 0 0', fontSize: rem(15), fontWeight: 700 }}>{girlList.length}名</p></div>
                <div style={{ width: 1, background: '#eee' }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ margin: 0, fontSize: rem(10), color: '#9a9a9a', fontWeight: 600 }}>ドライバー</p>
                  <p style={{ margin: '2px 0 0', fontSize: rem(15), fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(d.drivers as DriverRow | null)?.name || '未定'}</p>
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex' }}>
                {girlList.map((g, i) => (
                  <div key={g.id} style={{ width: 28, height: 28, borderRadius: '50%', background: strColor(g.id), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(11), border: '2px solid #fff', marginLeft: i === 0 ? 0 : -6, flexShrink: 0 }}>{g.name[0]}</div>
                ))}
              </div>
            </div>
          )
        }) : (
          <div style={{ border: '1px solid #ededed', borderRadius: 18, padding: 28, textAlign: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 10, opacity: .3 }}><path d="M5 13l1.6-4.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.5L19 13m-14 0h14v4a1 1 0 0 1-1 1h-1.2a1.8 1.8 0 1 1-3.6 0H9.8a1.8 1.8 0 1 1-3.6 0H5a1 1 0 0 1-1-1v-4h1Z" stroke="#0a0a0a" strokeWidth="1.8" strokeLinejoin="round" /></svg>
            <p style={{ margin: 0, fontSize: rem(14), color: '#b0b0b0', fontWeight: 600 }}>本日の配車はありません</p>
            <p style={{ margin: '6px 0 0', fontSize: rem(12), color: '#c8c8c8' }}>「配車を依頼する」から作成してください</p>
          </div>
        )}

        {completedDispatches.length > 0 && (
          <>
            <p style={{ margin: '24px 4px 10px', fontSize: rem(12), fontWeight: 700, color: '#c0c0c0', letterSpacing: '.04em' }}>完了</p>
            {completedDispatches.map(d => {
              const girlList = (d.dispatch_girls || []).map(dg => dg.girls).filter((g): g is GirlRow => g !== null)
              return (
                <div key={d.id} onClick={() => { setViewDispatch(d); setScreen('detail') }} role="button" style={{ border: '1px solid #f0f0f0', borderRadius: 18, padding: 16, cursor: 'pointer', marginBottom: 10, opacity: 0.65 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: rem(15), fontWeight: 700, color: '#8a8a8a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.destination || '目的地未設定'}</span>
                    <span style={{ fontSize: rem(12), fontWeight: 700, color: '#aeaeb2', background: '#f4f4f4', padding: '4px 10px', borderRadius: 999, flexShrink: 0 }}>完了</span>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {girlList.map((g, i) => (
                      <div key={g.id} style={{ width: 24, height: 24, borderRadius: '50%', background: strColor(g.id), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(10), border: '2px solid #fff', marginLeft: i === 0 ? 0 : -5, flexShrink: 0 }}>{g.name[0]}</div>
                    ))}
                    {(d.drivers as DriverRow | null)?.name && <span style={{ marginLeft: 8, fontSize: rem(12), color: '#9a9a9a' }}>{(d.drivers as DriverRow).name}</span>}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
      {nav}
    </div>
  )

  /* ====== DISPATCH DETAIL ====== */
  if (screen === 'detail' && viewDispatch) {
    const d = viewDispatch
    const girlList = (d.dispatch_girls || []).map(dg => dg.girls).filter((g): g is GirlRow => g !== null)
    const label = DISP_LABEL[d.status] || d.status
    const color = DISP_COLOR[d.status] || '#888'
    const drv = d.drivers as DriverRow | null
    return (
      <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '0 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 20px 14px' }}>
          <BackBtn onClick={() => setScreen('home')} />
          <div>
            <p style={{ margin: 0, fontSize: rem(12), fontWeight: 600, color: '#8a8a8a' }}>配車詳細</p>
            <h1 style={{ margin: 0, fontSize: rem(22), fontWeight: 800, letterSpacing: '-.01em' }}>{d.destination || '目的地未設定'}</h1>
          </div>
        </div>

        <div style={{ padding: '0 20px' }}>
          <div style={{ borderRadius: 18, padding: '16px 18px', background: color + '14', border: `1.5px solid ${color}33`, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {d.status !== '完了' && <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, animation: 'lm-pulse 1.6s infinite', display: 'inline-block', flexShrink: 0 }} />}
              <span style={{ fontSize: rem(20), fontWeight: 800, color }}>{label}</span>
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
              {d.scheduled_time && (
                <div>
                  <p style={{ margin: 0, fontSize: rem(10), color: '#9a9a9a', fontWeight: 600 }}>出発予定</p>
                  <p style={{ margin: '2px 0 0', fontSize: rem(17), fontWeight: 700 }}>{d.scheduled_time}</p>
                </div>
              )}
              <div>
                <p style={{ margin: 0, fontSize: rem(10), color: '#9a9a9a', fontWeight: 600 }}>種別</p>
                <p style={{ margin: '2px 0 0', fontSize: rem(17), fontWeight: 700 }}>{d.urgency}</p>
              </div>
            </div>
          </div>

          {drv && (
            <div style={{ borderRadius: 18, padding: '14px 16px', border: '1.5px solid #ededed', marginBottom: 16 }}>
              <p style={{ margin: '0 0 10px', fontSize: rem(11), fontWeight: 700, color: '#9a9a9a', letterSpacing: '.06em' }}>ドライバー</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: DRV_COLOR[drv.status] || '#888', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: rem(19), flexShrink: 0 }}>{drv.name[0]}</div>
                <div>
                  <p style={{ margin: 0, fontSize: rem(17), fontWeight: 700 }}>{drv.name}</p>
                  <span style={{ fontSize: rem(12), fontWeight: 700, color: DRV_COLOR[drv.status] || '#888' }}>{drv.status}</span>
                </div>
              </div>
            </div>
          )}

          <p style={{ margin: '0 4px 10px', fontSize: rem(11), fontWeight: 700, color: '#9a9a9a', letterSpacing: '.06em' }}>乗車キャスト　{girlList.length}名</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {girlList.map((g, i) => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, border: '1px solid #f0f0f0' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: strColor(g.id), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(15), flexShrink: 0 }}>{g.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: rem(15), fontWeight: 700 }}>{g.name}</p>
                  {g.area && <p style={{ margin: '2px 0 0', fontSize: rem(12), color: '#9a9a9a' }}>{g.area}</p>}
                </div>
                <span style={{ fontSize: rem(12), fontWeight: 700, color: '#d0d0d0' }}>#{i + 1}</span>
              </div>
            ))}
            {girlList.length === 0 && (
              <p style={{ fontSize: rem(13), color: '#c0c0c0', textAlign: 'center', padding: '12px 0' }}>キャスト未設定</p>
            )}
          </div>
        </div>
        {nav}
      </div>
    )
  }

  /* ====== ADMIN ====== */
  return (
    <div style={{ minHeight: '100dvh', background: '#fff', color: '#0a0a0a', padding: '0 0 110px', boxSizing: 'border-box', animation: 'lm-fade .3s ease both', fontFamily: font }}>
      <div style={{ padding: '8px 20px 14px' }}>
        <p style={{ margin: 0, fontSize: rem(12), fontWeight: 600, color: '#8a8a8a', letterSpacing: '.04em' }}>CLUB VENUS・KING ・ ボーイ</p>
        <h1 style={{ margin: '2px 0 0', fontSize: rem(30), fontWeight: 800, letterSpacing: '-.02em' }}>管理</h1>
      </div>
      <div style={{ padding: '0 20px' }}>
        {([
          {
            label: '女の子管理', sub: '登録・編集・削除', path: '/masters/girls', bg: '#fff0f5',
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#E84855" strokeWidth="1.8" strokeLinecap="round" /><circle cx="9" cy="7" r="4" stroke="#E84855" strokeWidth="1.8" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#E84855" strokeWidth="1.8" strokeLinecap="round" /></svg>,
          },
          {
            label: 'ドライバー管理', sub: '登録・編集・削除', path: '/masters/drivers', bg: '#f0f7ff',
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 13l1.6-4.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.5L19 13m-14 0h14v4a1 1 0 0 1-1 1h-1.2a1.8 1.8 0 1 1-3.6 0H9.8a1.8 1.8 0 1 1-3.6 0H5a1 1 0 0 1-1-1v-4h1Z" stroke="#276EF1" strokeWidth="1.8" strokeLinejoin="round" /></svg>,
          },
          {
            label: '配車ウィザード', sub: '3ステップで配車を作成', path: '/dispatch', bg: '#f0fdf4',
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#06C167" strokeWidth="2.2" strokeLinecap="round" /></svg>,
          },
        ] as { label: string; sub: string; path: string; bg: string; icon: React.ReactNode }[]).map(item => (
          <button key={item.path} onClick={() => router.push(item.path)} style={{ width: '100%', borderRadius: 18, padding: '18px 20px', background: '#fff', border: '1.5px solid rgba(0,0,0,.1)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, textAlign: 'left' }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: rem(17), fontWeight: 700 }}>{item.label}</p>
              <p style={{ margin: '2px 0 0', fontSize: rem(12), color: '#9a9a9a' }}>{item.sub}</p>
            </div>
            <svg width="7" height="13" viewBox="0 0 9 15"><path d="M1 1l6 6.5L1 14" stroke="#c0c0c0" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        ))}
      </div>
      {nav}
    </div>
  )
}
