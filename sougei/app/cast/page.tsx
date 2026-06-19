'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Girl } from '@/lib/supabase'

const font = "'Hanken Grotesk', 'Noto Sans JP', sans-serif"

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
    <div style={{
      minHeight: '100dvh',
      background: '#fff',
      fontFamily: font,
      color: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '52px 20px 20px',
        borderBottom: '1px solid #f0f0f0',
        flexShrink: 0,
      }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#8a8a8a' }}>
          CLUB LUMINA
        </p>
        <h1 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1 }}>
          キャスト
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: '#8a8a8a', fontWeight: 500 }}>
          あなたはどちらですか？
        </p>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 60px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9a9a9a', fontSize: 14 }}>
            読み込み中...
          </div>
        )}

        {!loading && girls.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9a9a9a', fontSize: 14 }}>
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
              background: '#fff',
              borderRadius: 18,
              border: '1px solid #ededed',
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
              background: '#fdf4ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: '#a855f7', flexShrink: 0,
            }}>
              {g.name.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0a0a0a', letterSpacing: '-.01em' }}>
                {g.name}
              </div>
              {g.area && (
                <div style={{ fontSize: 12, color: '#9a9a9a', marginTop: 3, fontWeight: 500 }}>
                  {g.area}
                </div>
              )}
            </div>
            <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
              <path d="M1 1l6 6.5L1 14" stroke="#d0d0d0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
