'use client'

import { rem } from '@/lib/rem'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const font = "'Hanken Grotesk', 'Noto Sans JP', sans-serif"

const PALETTE = ['#F5A623', '#7B61FF', '#06C167', '#E84855', '#276EF1', '#00A8B5', '#FF7A45', '#FF6B9C', '#9B59B6', '#2ECC71']
function strColor(id: string) { return PALETTE[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length] }

type DriverItem = { id: string; name: string }
type GirlItem = { id: string; name: string; color: string | null }

export default function LoginPage() {
  const router = useRouter()
  const [drivers, setDrivers] = useState<DriverItem[]>([])
  const [girls, setGirls] = useState<GirlItem[]>([])

  useEffect(() => {
    Promise.all([
      supabase.from('drivers').select('id, name').order('name'),
      supabase.from('girls').select('id, name, color').order('name'),
    ]).then(([{ data: drvs }, { data: gls }]) => {
      setDrivers((drvs as DriverItem[]) || [])
      setGirls((gls as GirlItem[]) || [])
    })
  }, [])

  function loginBoy() {
    localStorage.setItem('lm_role', 'boy')
    router.push('/boy')
  }
  function loginDriver(id: string) {
    localStorage.setItem('lm_role', 'driver')
    localStorage.setItem('lm_driver_id', id)
    router.replace(`/driver/${id}`)
  }
  function loginGirl(id: string) {
    localStorage.setItem('lm_role', 'cast')
    localStorage.setItem('lm_girl_id', id)
    router.replace(`/cast/${id}`)
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px max(40px, env(safe-area-inset-bottom))', boxSizing: 'border-box', fontFamily: font }}>
      <div style={{ animation: 'lm-fade .4s ease both' }}>
        <span style={{ fontSize: rem(12), fontWeight: 600, letterSpacing: '.18em', color: '#5a5a5a' }}>送迎管理システム</span>
        <div style={{ margin: '10px 0 32px' }}>
          <h1 style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: rem(42), fontWeight: 800, letterSpacing: '-.02em', margin: 0, lineHeight: 1.1 }}>CLUB Venus</h1>
          <h1 style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: rem(42), fontWeight: 800, letterSpacing: '-.02em', margin: 0, lineHeight: 1.1, color: '#7a7a7a' }}>CLUB KING</h1>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={loginBoy} style={{ flex: 1, height: 44, borderRadius: 11, background: '#fff', border: 'none', color: '#0a0a0a', fontSize: rem(13.5), fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>ボーイ</button>
          {drivers.map(d => (
            <button key={d.id} onClick={() => loginDriver(d.id)} style={{ flex: 1, height: 44, borderRadius: 11, background: '#161616', border: '1px solid #2a2a2a', color: '#fff', fontSize: rem(13.5), fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{d.name}（D）</button>
          ))}
        </div>

        {girls.length > 0 && (
          <div style={{ borderTop: '1px solid #1f1f1f', paddingTop: 18 }}>
            <p style={{ margin: '0 0 10px', fontSize: rem(11.5), letterSpacing: '.1em', color: '#6e6e6e', fontWeight: 600 }}>キャスト ── 選んでタップ</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {girls.map(g => (
                <button key={g.id} onClick={() => loginGirl(g.id)} style={{ flex: '1 1 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 4px', borderRadius: 13, background: '#161616', border: '1px solid #2a2a2a', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: g.color || strColor(g.id), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: rem(15) }}>{g.name[0]}</div>
                  <span style={{ fontSize: rem(11), fontWeight: 600, color: '#cfcfcf' }}>{g.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
