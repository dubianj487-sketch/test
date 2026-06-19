'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Driver } from '@/lib/supabase'

const font = "'Hanken Grotesk', 'Noto Sans JP', sans-serif"

const statusColor: Record<string, string> = {
  '待機': '#06c167',
  'お店前': '#8b5cf6',
  '移動中': '#c77700',
  '終了': '#6a6a6a',
}

const statusBg: Record<string, string> = {
  '待機': 'rgba(6,193,103,.15)',
  'お店前': 'rgba(139,92,246,.15)',
  '移動中': 'rgba(199,119,0,.15)',
  '終了': 'rgba(106,106,106,.15)',
}

export default function DriverSelectPage() {
  const router = useRouter()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('drivers').select('*').order('created_at', { ascending: true }).then(({ data }) => {
      if (data) setDrivers(data)
      setLoading(false)
    })
  }, [])

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0a0a0a',
      fontFamily: font,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '52px 20px 20px',
        flexShrink: 0,
      }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#5a5a5a', letterSpacing: '.08em' }}>
          CLUB LUMINA
        </p>
        <h1 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1 }}>
          ドライバー
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: '#5a5a5a', fontWeight: 500 }}>
          あなたはどちらですか？
        </p>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 60px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#4a4a4a', fontSize: 14 }}>
            読み込み中...
          </div>
        )}

        {!loading && drivers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#4a4a4a', fontSize: 14 }}>
            ドライバーが登録されていません
          </div>
        )}

        {drivers.map(d => {
          const color = statusColor[d.status] || '#6a6a6a'
          const bg = statusBg[d.status] || 'rgba(106,106,106,.15)'
          return (
            <button
              key={d.id}
              onClick={() => router.push(`/driver/${d.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                background: '#141414',
                borderRadius: 18,
                border: '1px solid #262626',
                padding: '16px',
                marginBottom: 10,
                cursor: 'pointer',
                fontFamily: font,
                gap: 14,
                textAlign: 'left',
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 800, color, flexShrink: 0,
              }}>
                {d.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-.01em' }}>
                  {d.name}
                </div>
                {d.note && (
                  <div style={{ fontSize: 12, color: '#5a5a5a', marginTop: 3, fontWeight: 500 }}>
                    {d.note}
                  </div>
                )}
              </div>
              <div style={{
                background: bg,
                color,
                borderRadius: 999,
                padding: '5px 12px',
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
                letterSpacing: '.02em',
              }}>
                {d.status}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
