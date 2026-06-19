'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [loginCode, setLoginCode] = useState('')
  const [loginErr, setLoginErr] = useState('')

  function doLogin() {
    const c = loginCode.trim().toLowerCase()
    if (c === 'boy') router.push('/boy')
    else if (c === 'driver') router.push('/driver')
    else if (c === 'cast') router.push('/cast')
    else setLoginErr(loginCode ? '招待コードが正しくありません' : '招待コードを入力してください')
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0a0a0a',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '0 28px 40px',
      boxSizing: 'border-box',
      fontFamily: "'Hanken Grotesk', 'Noto Sans JP', sans-serif",
    }}>
      <div className="animate-lm-fade">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 13l2-5h14l2 5M5 13h14v4a1 1 0 0 1-1 1h-1a2 2 0 1 1-4 0H11a2 2 0 1 1-4 0H6a1 1 0 0 1-1-1v-4Z"
                stroke="#0a0a0a" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.18em', color: '#8a8a8a' }}>
            送迎管理システム
          </span>
        </div>

        <h1 style={{
          fontFamily: "'Hanken Grotesk', sans-serif",
          fontSize: 46, fontWeight: 800,
          letterSpacing: '-.02em',
          margin: '0 0 4px',
          lineHeight: 1,
        }}>
          LUMINA
        </h1>
        <p style={{ margin: '0 0 34px', color: '#9a9a9a', fontSize: 15, fontWeight: 500 }}>
          CLUB LUMINA ・ 送迎オペレーション
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <input
              value={loginCode}
              onChange={e => { setLoginCode(e.target.value); setLoginErr('') }}
              onKeyDown={e => e.key === 'Enter' && doLogin()}
              placeholder="招待コード"
              autoComplete="off"
              style={{
                height: 54, borderRadius: 14,
                background: '#161616',
                border: `1px solid ${loginErr ? '#ff6b6b' : '#2a2a2a'}`,
                color: '#fff', padding: '0 16px',
                fontSize: 16, fontFamily: 'inherit', outline: 'none',
                boxSizing: 'border-box', width: '100%',
              }}
            />
            {loginErr && (
              <p style={{ margin: '8px 4px 0', fontSize: 13, color: '#ff6b6b', fontWeight: 600 }}>
                {loginErr}
              </p>
            )}
            <p style={{ margin: '8px 4px 0', fontSize: 12.5, color: '#6e6e6e', lineHeight: 1.5 }}>
              招待コードで利用者の種類が切り替わります：
              <span style={{ color: '#cfcfcf', fontWeight: 600 }}> boy / driver / cast</span>
            </p>
          </div>

          <button
            onClick={doLogin}
            style={{
              marginTop: 6, height: 56, borderRadius: 14,
              background: '#fff', color: '#0a0a0a',
              fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            ログイン
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14m-6-6 6 6-6 6" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div style={{ marginTop: 30, borderTop: '1px solid #1f1f1f', paddingTop: 18 }}>
          <p style={{ margin: '0 0 10px', fontSize: 11.5, letterSpacing: '.1em', color: '#6e6e6e', fontWeight: 600 }}>
            DEMO ── タップで各画面へ
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['ボーイ', 'ドライバー', 'キャスト'] as const).map((label, i) => {
              const hrefs = ['/boy', '/driver', '/cast']
              return (
                <button
                  key={label}
                  onClick={() => router.push(hrefs[i])}
                  style={{
                    flex: 1, height: 44, borderRadius: 11,
                    background: '#161616', border: '1px solid #2a2a2a',
                    color: '#fff', fontSize: 13.5, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
