'use client'

import { rem } from '@/lib/rem'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const font = "'Hanken Grotesk', 'Noto Sans JP', sans-serif"
type Step = 'role' | 'pick-driver' | 'pick-cast'
type DriverItem = { id: string; name: string; status: string; note: string | null }
type GirlItem = { id: string; name: string; area: string | null }

const PALETTE = ['#F5A623', '#7B61FF', '#06C167', '#E84855', '#276EF1', '#00A8B5', '#FF7A45', '#FF6B9C', '#9B59B6', '#2ECC71']
function strColor(s: string) { return PALETTE[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length] }
const DRV_COLOR: Record<string, string> = { '待機': '#1a9e50', '移動中': '#c2750a', '終了': '#aeaeb2', 'お店前': '#8b5cf6' }

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('role')
  const [drivers, setDrivers] = useState<DriverItem[]>([])
  const [girls, setGirls] = useState<GirlItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('drivers').select('id, name, status, note').order('name'),
      supabase.from('girls').select('id, name, area').order('name'),
    ]).then(([{ data: drvs }, { data: gls }]) => {
      setDrivers((drvs as DriverItem[]) || [])
      setGirls((gls as GirlItem[]) || [])
      setLoading(false)
    })
  }, [])

  function loginBoy() {
    localStorage.setItem('lm_role', 'boy')
    router.push('/boy')
  }
  function loginDriver(d: DriverItem) {
    localStorage.setItem('lm_role', 'driver')
    localStorage.setItem('lm_driver_id', d.id)
    router.push(`/driver/${d.id}`)
  }
  function loginGirl(g: GirlItem) {
    localStorage.setItem('lm_role', 'cast')
    localStorage.setItem('lm_girl_id', g.id)
    router.push(`/cast/${g.id}`)
  }

  const backBtn = (
    <button
      onClick={() => setStep('role')}
      style={{ height: 38, padding: '0 14px', borderRadius: 11, background: 'rgba(255,255,255,.08)', border: 'none', color: '#9a9a9a', fontSize: rem(14), fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28 }}
    >
      <svg width="8" height="14" viewBox="0 0 9 15"><path d="M8 1 2 7.5 8 14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      戻る
    </button>
  )

  if (step === 'pick-driver') return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', padding: '60px 24px max(40px, env(safe-area-inset-bottom))', boxSizing: 'border-box', fontFamily: font }}>
      {backBtn}
      <p style={{ margin: '0 0 6px', fontSize: rem(12), fontWeight: 600, letterSpacing: '.14em', color: '#5a5a5a' }}>DRIVER</p>
      <h2 style={{ margin: '0 0 24px', fontSize: rem(28), fontWeight: 800, letterSpacing: '-.02em' }}>ドライバーを選択</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {drivers.map(d => (
          <button key={d.id} onClick={() => loginDriver(d)} style={{ height: 68, borderRadius: 16, background: '#161616', border: '1px solid #2a2a2a', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', textAlign: 'left' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: DRV_COLOR[d.status] || '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: rem(17), color: '#fff', flexShrink: 0 }}>{d.name[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: rem(16), fontWeight: 700 }}>{d.name}</p>
              {d.note && <p style={{ margin: '2px 0 0', fontSize: rem(12), color: '#6e6e6e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.note}</p>}
            </div>
            <span style={{ fontSize: rem(12), fontWeight: 700, color: DRV_COLOR[d.status] || '#888', flexShrink: 0 }}>{d.status}</span>
          </button>
        ))}
        {!loading && drivers.length === 0 && (
          <p style={{ color: '#5a5a5a', fontSize: rem(14), textAlign: 'center', marginTop: 40 }}>ドライバーが登録されていません</p>
        )}
      </div>
    </div>
  )

  if (step === 'pick-cast') return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', padding: '60px 24px max(40px, env(safe-area-inset-bottom))', boxSizing: 'border-box', fontFamily: font }}>
      {backBtn}
      <p style={{ margin: '0 0 6px', fontSize: rem(12), fontWeight: 600, letterSpacing: '.14em', color: '#5a5a5a' }}>CAST</p>
      <h2 style={{ margin: '0 0 24px', fontSize: rem(28), fontWeight: 800, letterSpacing: '-.02em' }}>名前を選択</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {girls.map(g => (
          <button key={g.id} onClick={() => loginGirl(g)} style={{ height: 68, borderRadius: 16, background: '#161616', border: '1px solid #2a2a2a', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', textAlign: 'left' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: strColor(g.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: rem(17), color: '#fff', flexShrink: 0 }}>{g.name[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: rem(16), fontWeight: 700 }}>{g.name}</p>
              {g.area && <p style={{ margin: '2px 0 0', fontSize: rem(12), color: '#6e6e6e' }}>{g.area}</p>}
            </div>
            <svg width="7" height="13" viewBox="0 0 9 15"><path d="M1 1l6 6.5L1 14" stroke="#4a4a4a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        ))}
        {!loading && girls.length === 0 && (
          <p style={{ color: '#5a5a5a', fontSize: rem(14), textAlign: 'center', marginTop: 40 }}>キャストが登録されていません</p>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px max(40px, env(safe-area-inset-bottom))', boxSizing: 'border-box', fontFamily: font }}>
      <div style={{ animation: 'lm-fade .4s ease both' }}>
        <span style={{ fontSize: rem(12), fontWeight: 600, letterSpacing: '.18em', color: '#5a5a5a' }}>送迎管理システム</span>
        <div style={{ margin: '10px 0 36px' }}>
          <h1 style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: rem(42), fontWeight: 800, letterSpacing: '-.02em', margin: 0, lineHeight: 1.1 }}>CLUB Venus</h1>
          <h1 style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: rem(42), fontWeight: 800, letterSpacing: '-.02em', margin: 0, lineHeight: 1.1, color: '#7a7a7a' }}>CLUB KING</h1>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: rem(12), fontWeight: 600, color: '#5a5a5a', letterSpacing: '.1em' }}>ログインする役割を選択</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={loginBoy} style={{ height: 64, borderRadius: 16, background: '#fff', color: '#0a0a0a', border: 'none', fontSize: rem(17), fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 13l1.6-4.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.5L19 13m-14 0h14v4a1 1 0 0 1-1 1h-1.2a1.8 1.8 0 1 1-3.6 0H9.8a1.8 1.8 0 1 1-3.6 0H5a1 1 0 0 1-1-1v-4h1Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" /></svg>
              </div>
              ボーイ
            </div>
            <svg width="7" height="13" viewBox="0 0 9 15"><path d="M1 1l6 6.5L1 14" stroke="#0a0a0a" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button onClick={() => setStep('pick-driver')} disabled={loading} style={{ height: 64, borderRadius: 16, background: '#161616', color: '#fff', border: '1px solid #2a2a2a', fontSize: rem(17), fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', opacity: loading ? 0.5 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="1.8" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </div>
              ドライバー
            </div>
            <svg width="7" height="13" viewBox="0 0 9 15"><path d="M1 1l6 6.5L1 14" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button onClick={() => setStep('pick-cast')} disabled={loading} style={{ height: 64, borderRadius: 16, background: '#161616', color: '#fff', border: '1px solid #2a2a2a', fontSize: rem(17), fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', opacity: loading ? 0.5 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /><circle cx="9" cy="7" r="4" stroke="#fff" strokeWidth="1.8" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </div>
              キャスト
            </div>
            <svg width="7" height="13" viewBox="0 0 9 15"><path d="M1 1l6 6.5L1 14" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
