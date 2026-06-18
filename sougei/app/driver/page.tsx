'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Driver } from '@/lib/supabase'

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

  const statusColor: Record<string, string> = {
    '待機': '#1a9e50',
    'お店前': '#5856d6',
    '移動中': '#c2750a',
    '終了': '#aeaeb2',
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5', fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", color: '#1c1c1e', display: 'flex', flexDirection: 'column' }}>

      <div style={{ background: '#ffffff', padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.02em', lineHeight: 1 }}>送迎</div>
        <div style={{ fontSize: 12, color: '#8e8e93', fontWeight: 400, marginTop: 2 }}>ドライバーを選択</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 40px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 10, paddingLeft: 2 }}>
          あなたはどちらですか？
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#aeaeb2', fontSize: 14 }}>読み込み中...</div>
        )}

        {!loading && drivers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#aeaeb2', fontSize: 14 }}>
            ドライバーが登録されていません
          </div>
        )}

        {drivers.map(d => {
          const color = statusColor[d.status] || '#aeaeb2'
          return (
            <button
              key={d.id}
              onClick={() => router.push(`/driver/${d.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                background: '#ffffff',
                borderRadius: 14,
                border: '1.5px solid rgba(0,0,0,0.1)',
                padding: '14px 14px',
                marginBottom: 8,
                cursor: 'pointer',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
                gap: 12,
                textAlign: 'left',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: `${color}1a`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, color, flexShrink: 0,
              }}>
                {d.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.01em' }}>{d.name}</div>
                {d.note && <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>{d.note}</div>}
              </div>
              <div style={{
                background: color,
                color: '#ffffff',
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
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
