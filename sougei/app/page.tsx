'use client'

import { rem } from '@/lib/rem'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const font = "'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif"

type DriverItem = { id: string; name: string }
type GirlItem = { id: string; name: string; color: string | null }

export default function LoginPage() {
  const router = useRouter()
  const [loginCode, setLoginCode] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [drivers, setDrivers] = useState<DriverItem[]>([])
  const [girls, setGirls] = useState<GirlItem[]>([])

  useEffect(() => {
    Promise.all([
      supabase.from('drivers').select('id, name').order('created_at'),
      supabase.from('girls').select('id, name, color').order('created_at'),
    ]).then(([{ data: drvs }, { data: gls }]) => {
      setDrivers((drvs as DriverItem[]) || [])
      setGirls((gls as GirlItem[]) || [])
    })
  }, [])

  function doLogin() {
    const c = loginCode.trim().toLowerCase()
    if (c === 'boy') {
      localStorage.setItem('lm_role', 'boy')
      router.push('/boy')
    } else {
      setLoginErr(loginCode ? '招待コードが正しくありません' : '招待コードを入力してください')
    }
  }

  function quickBoy() {
    localStorage.setItem('lm_role', 'boy')
    router.push('/boy')
  }
  function quickDriver(id: string) {
    localStorage.setItem('lm_role', 'driver')
    localStorage.setItem('lm_driver_id', id)
    router.push(`/driver/${id}`)
  }
  function quickGirl(id: string) {
    localStorage.setItem('lm_role', 'cast')
    localStorage.setItem('lm_girl_id', id)
    router.push(`/cast/${id}`)
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px 48px', boxSizing: 'border-box', fontFamily: font }}>
      <div style={{ animation: 'lm-fade .4s ease both' }}>

        {/* Logo */}
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#161616', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <path d="M5 18l2-7a2.5 2.5 0 0 1 2.4-1.8h11.2a2.5 2.5 0 0 1 2.4 1.8l2 7M5 18h20v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-4Zm4 4a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm12 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM11 10.5V8m8 2.5V8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 style={{ fontSize: rem(36), fontWeight: 800, letterSpacing: '-.02em', margin: '0 0 6px', lineHeight: 1.1 }}>送迎管理</h1>
        <p style={{ margin: '0 0 32px', fontSize: rem(13), color: '#6e6e6e' }}>キャバクラ専用・送迎オペレーションアプリ</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <input
              value={loginCode}
              onChange={e => { setLoginCode(e.target.value); setLoginErr('') }}
              onKeyDown={e => e.key === 'Enter' && doLogin()}
              placeholder="招待コードを入力"
              autoComplete="off"
              style={{ height: 56, width: '100%', borderRadius: 14, background: '#141414', border: `1px solid ${loginErr ? '#ff5a5a' : '#2a2a2a'}`, color: '#fff', padding: '0 16px', fontSize: rem(16), fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
            {loginErr && <p style={{ margin: '8px 4px 0', fontSize: rem(13), color: '#ff5a5a', fontWeight: 600 }}>{loginErr}</p>}
          </div>
          <button
            onClick={doLogin}
            style={{ height: 58, borderRadius: 14, background: '#06C755', color: '#fff', border: 'none', fontSize: rem(16), fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 6px 18px -6px rgba(6,199,85,.55)' }}
          >
            <svg width="24" height="24" viewBox="0 0 40 40">
              <rect width="40" height="40" rx="9" fill="#06C755" />
              <path clipPath="url(#lc)" d="M20 6.5C12.3 6.5 6 11.9 6 18.5c0 5.8 5.1 10.7 12.1 11.5.47.1 1.1.3 1.26.68.15.37.1.94.04 1.32l-.2 1.22c-.06.37-.28 1.45 1.26.78 1.54-.66 8.32-4.9 11.35-8.4C33.6 23.2 34 21.3 34 18.5 34 11.9 27.7 6.5 20 6.5Z" fill="#fff" />
              <defs><clipPath id="lc"><rect width="40" height="40" rx="9" /></clipPath></defs>
            </svg>
            LINEで認証してログイン
          </button>
        </div>

        {/* DEMO */}
        <div style={{ marginTop: 28, borderTop: '1px solid #1f1f1f', paddingTop: 18 }}>
          <p style={{ margin: '0 0 12px', fontSize: rem(11), letterSpacing: '.12em', color: '#5a5a5a', fontWeight: 700 }}>DEMO ── タップで各画面へ</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button onClick={quickBoy} style={{ flex: 1, height: 44, borderRadius: 11, background: '#161616', border: '1px solid #2a2a2a', color: '#fff', fontSize: rem(13.5), fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>ボーイ</button>
            {drivers.slice(0, 2).map(d => (
              <button key={d.id} onClick={() => quickDriver(d.id)} style={{ flex: 1, height: 44, borderRadius: 11, background: '#161616', border: '1px solid #2a2a2a', color: '#fff', fontSize: rem(13), fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{d.name.replace(/\s.*/, '')}D</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {girls.slice(0, 6).map(g => (
              <button key={g.id} onClick={() => quickGirl(g.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 2px', borderRadius: 13, background: '#161616', border: '1px solid #2a2a2a', cursor: 'pointer', fontFamily: 'inherit' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: g.color || '#7B61FF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(15) }}>{g.name[0]}</div>
                <span style={{ fontSize: rem(10), fontWeight: 600, color: '#9a9a9a' }}>{g.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
