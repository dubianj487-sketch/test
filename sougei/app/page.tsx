'use client'

import { rem } from '@/lib/rem'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const font = "'Hanken Grotesk', 'Noto Sans JP', sans-serif"

const CAST_COLORS: Record<string, string> = {
  miki: '#7B61FF', kotone: '#F5A623', yuna: '#06C167', ai: '#E84855', rena: '#276EF1',
}
const CAST_INITIALS: Record<string, string> = {
  miki: 'み', kotone: 'こ', yuna: 'ゆ', ai: 'あ', rena: 'れ',
}
const CAST_LABELS: Record<string, string> = {
  miki: 'みき', kotone: 'ことね', yuna: 'ゆな', ai: 'あい', rena: 'れな',
}

export default function LoginPage() {
  const router = useRouter()
  const [loginCode, setLoginCode] = useState('')
  const [loginErr, setLoginErr] = useState('')

  function doLogin() {
    const c = loginCode.trim().toLowerCase()
    if (c === 'boy') {
      localStorage.setItem('lm_role', 'boy')
      router.push('/boy')
    } else if (c === 'driver') {
      localStorage.setItem('lm_role', 'driver')
      router.push('/driver')
    } else if (c === 'cast') {
      localStorage.setItem('lm_role', 'cast')
      if (!localStorage.getItem('lm_castId')) localStorage.setItem('lm_castId', 'miki')
      router.push('/cast')
    } else {
      setLoginErr(loginCode ? '招待コードが正しくありません' : '招待コードを入力してください')
    }
  }

  function quickBoy() {
    localStorage.setItem('lm_role', 'boy')
    router.push('/boy')
  }
  function quickDriver(key: string) {
    localStorage.setItem('lm_role', 'driver')
    localStorage.setItem('lm_driverKey', key)
    router.push('/driver')
  }
  function quickCast(id: string) {
    localStorage.setItem('lm_role', 'cast')
    localStorage.setItem('lm_castId', id)
    router.push('/cast')
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px 40px', boxSizing: 'border-box', fontFamily: font }}>
      <div style={{ animation: 'lm-fade .4s ease both' }}>
        <span style={{ fontSize: rem(12), fontWeight: 600, letterSpacing: '.18em', color: '#5a5a5a' }}>送迎管理システム</span>
        <div style={{ margin: '10px 0 32px' }}>
          <h1 style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: rem(42), fontWeight: 800, letterSpacing: '-.02em', margin: 0, lineHeight: 1.1 }}>CLUB Venus</h1>
          <h1 style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: rem(42), fontWeight: 800, letterSpacing: '-.02em', margin: 0, lineHeight: 1.1, color: '#7a7a7a' }}>CLUB KING</h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <input
              value={loginCode}
              onChange={e => { setLoginCode(e.target.value); setLoginErr('') }}
              onKeyDown={e => e.key === 'Enter' && doLogin()}
              placeholder="招待コード"
              autoComplete="off"
              style={{ height: 54, width: '100%', borderRadius: 14, background: '#161616', border: `1px solid ${loginErr ? '#ff6b6b' : '#2a2a2a'}`, color: '#fff', padding: '0 16px', fontSize: rem(16), fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
            {loginErr && <p style={{ margin: '8px 4px 0', fontSize: rem(13), color: '#ff6b6b', fontWeight: 600 }}>{loginErr}</p>}
            <p style={{ margin: '8px 4px 0', fontSize: rem(12.5), color: '#6e6e6e', lineHeight: 1.5 }}>
              招待コードで利用者の種類が切り替わります：<span style={{ color: '#cfcfcf', fontWeight: 600 }}> boy / driver / cast</span>
            </p>
          </div>

          <button
            onClick={doLogin}
            style={{ marginTop: 6, height: 58, borderRadius: 14, background: '#06C755', color: '#fff', border: 'none', fontSize: rem(16), fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 6px 18px -6px rgba(6,199,85,.55)' }}
          >
            <svg width="26" height="26" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="9" fill="#06C755" />
              <path clipPath="url(#lc)" d="M20 6.5C12.3 6.5 6 11.9 6 18.5c0 5.8 5.1 10.7 12.1 11.5.47.1 1.1.3 1.26.68.15.37.1.94.04 1.32l-.2 1.22c-.06.37-.28 1.45 1.26.78 1.54-.66 8.32-4.9 11.35-8.4C33.6 23.2 34 21.3 34 18.5 34 11.9 27.7 6.5 20 6.5Z" fill="#fff" />
              <defs><clipPath id="lc"><rect width="40" height="40" rx="9" /></clipPath></defs>
            </svg>
            LINEで認証してログイン
          </button>
        </div>

        <div style={{ marginTop: 30, borderTop: '1px solid #1f1f1f', paddingTop: 18 }}>
          <p style={{ margin: '0 0 10px', fontSize: rem(11.5), letterSpacing: '.1em', color: '#6e6e6e', fontWeight: 600 }}>DEMO ── タップで各画面へ</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {([['ボーイ', quickBoy], ['佐藤（D）', () => quickDriver('sato')], ['田中（D）', () => quickDriver('tanaka')]] as [string, () => void][]).map(([label, fn]) => (
              <button key={label} onClick={fn} style={{ flex: 1, height: 44, borderRadius: 11, background: '#161616', border: '1px solid #2a2a2a', color: '#fff', fontSize: rem(13.5), fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>
            ))}
          </div>
          <p style={{ margin: '0 0 10px', fontSize: rem(11.5), letterSpacing: '.1em', color: '#6e6e6e', fontWeight: 600 }}>キャスト ── 選んでタップ</p>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
            {(['miki', 'kotone', 'yuna', 'ai', 'rena'] as const).map(id => (
              <button key={id} onClick={() => quickCast(id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 4px', borderRadius: 13, background: '#161616', border: '1px solid #2a2a2a', cursor: 'pointer', fontFamily: 'inherit' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: CAST_COLORS[id], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(15) }}>{CAST_INITIALS[id]}</div>
                <span style={{ fontSize: rem(11), fontWeight: 600, color: '#cfcfcf' }}>{CAST_LABELS[id]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
