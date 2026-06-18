'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Girl } from '@/lib/supabase'

export default function CastSelectPage() {
  const router = useRouter()
  const [girls, setGirls] = useState<Girl[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('girls').select('*').order('created_at', { ascending: true }).then(({ data }) => {
      if (data) setGirls(data)
      setLoading(false)
    })
  }, [])

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5', fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", color: '#1c1c1e', display: 'flex', flexDirection: 'column' }}>

      <div style={{ background: '#ffffff', padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.02em', lineHeight: 1 }}>送迎</div>
        <div style={{ fontSize: 12, color: '#8e8e93', fontWeight: 400, marginTop: 2 }}>キャストを選択</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 40px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 10, paddingLeft: 2 }}>
          あなたはどちらですか？
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#aeaeb2', fontSize: 14 }}>読み込み中...</div>
        )}

        {!loading && girls.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#aeaeb2', fontSize: 14 }}>
            キャストが登録されていません
          </div>
        )}

        {girls.map(g => (
          <button
            key={g.id}
            onClick={() => router.push(`/cast/${g.id}`)}
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
              background: 'rgba(52,120,246,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: '#3478f6', flexShrink: 0,
            }}>
              {g.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.01em' }}>{g.name}</div>
              {g.area && <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>{g.area}</div>}
            </div>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M1 1l6 6-6 6" stroke="#d1d1d6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
