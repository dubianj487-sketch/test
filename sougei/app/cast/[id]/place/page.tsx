'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Girl } from '@/lib/supabase'

export default function CastPlacePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [castId, setCastId] = useState<string | null>(null)
  const [girl, setGirl] = useState<Girl | null>(null)
  const [draft, setDraft] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(({ id }) => setCastId(id))
  }, [params])

  useEffect(() => {
    if (!castId) return
    supabase
      .from('girls')
      .select('*')
      .eq('id', castId)
      .single()
      .then(({ data }) => {
        if (data) {
          setGirl(data)
          setDraft(data.address || '')
        }
        setLoading(false)
      })
  }, [castId])

  async function handleSave() {
    if (!castId || !draft.trim()) return
    setSaving(true)
    await supabase.from('girls').update({ address: draft.trim() }).eq('id', castId)
    setGirl((g) => g ? { ...g, address: draft.trim() } : g)
    setSaved(true)
    setSaving(false)
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100dvh', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Hanken Grotesk','Noto Sans JP',sans-serif",
        }}
      >
        <div style={{ color: '#9a9a9a', fontSize: 14 }}>読み込み中...</div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#fff',
        fontFamily: "'Hanken Grotesk','Noto Sans JP',sans-serif",
        color: '#0a0a0a',
        paddingBottom: 110,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '52px 14px 14px' }}>
        <button
          onClick={() => castId && router.push(`/cast/${castId}`)}
          style={{
            width: 38, height: 38, borderRadius: 11, background: '#f4f4f4',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="9" height="15" viewBox="0 0 9 15">
            <path d="M8 1 2 7.5 8 14" stroke="#0a0a0a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.01em' }}>降車場所の登録</h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        <p style={{ margin: '6px 4px 16px', fontSize: 13.5, color: '#7a7a7a', lineHeight: 1.6 }}>
          普段、帰りに降りる場所を登録します。送迎の降車ルートはこの住所をもとに組まれます。
        </p>

        <p style={{ margin: '0 4px 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>
          住所・目印
        </p>
        <textarea
          value={draft}
          onChange={(e) => { setDraft(e.target.value); setSaved(false) }}
          placeholder="例：新宿区西新宿3-12-7 ○○マンション402"
          style={{
            width: '100%', height: 120, borderRadius: 14,
            background: '#f7f7f7', border: '1px solid #e6e6e6',
            color: '#0a0a0a', padding: '14px 16px',
            fontSize: 15, fontFamily: 'inherit', lineHeight: 1.6,
            outline: 'none', boxSizing: 'border-box', resize: 'none',
          }}
        />
        <p style={{ margin: '10px 4px 0', fontSize: 12, color: '#a0a0a0', lineHeight: 1.5 }}>
          ※ マンション名・部屋番号・近くの目印まで入れると、ドライバーが迷いません。
        </p>

        {saved && (
          <div
            style={{
              marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
              background: '#eafaf0', border: '1px solid #bdeccf',
              borderRadius: 13, padding: '12px 14px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="m5 12 4 4 10-10" stroke="#06c167" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0a7a3f' }}>降車場所を保存しました</span>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!draft.trim() || saving}
          style={{
            marginTop: 24, width: '100%', height: 56, borderRadius: 15,
            background: saved ? '#f0fdf4' : draft.trim() ? '#0a0a0a' : '#f4f4f4',
            color: saved ? '#06c167' : draft.trim() ? '#fff' : '#9a9a9a',
            border: 'none', fontSize: 16, fontWeight: 700,
            cursor: draft.trim() && !saving ? 'pointer' : 'default',
            fontFamily: 'inherit',
          }}
        >
          {saving ? '保存中...' : saved ? '保存済み ✓' : 'この場所を保存'}
        </button>
      </div>

      <CastNav castId={castId || ''} active="place" />
    </div>
  )
}

function CastNav({ castId, active }: { castId: string; active: 'home' | 'place' | 'request' }) {
  const router = useRouter()
  return (
    <div
      style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 390,
        background: '#fff', borderTop: '1px solid #efefef',
        padding: '10px 14px 28px',
        display: 'flex', justifyContent: 'space-around',
        zIndex: 40, boxSizing: 'border-box',
      }}
    >
      <NavBtn onClick={() => router.push(`/cast/${castId}`)} active={active === 'home'} label="ホーム">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M4 11 12 4l8 7m-14-1v8a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </NavBtn>
      <NavBtn onClick={() => router.push(`/cast/${castId}/place`)} active={active === 'place'} label="降車場所">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </NavBtn>
      <NavBtn onClick={() => router.push(`/cast/${castId}/request`)} active={active === 'request'} label="申請">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M8 4h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8m0-16-4 4m4-4v16m0 0-4-4M9 9h6M9 13h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </NavBtn>
    </div>
  )
}

function NavBtn({
  onClick, active, label, children,
}: {
  onClick: () => void
  active?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      onClick={onClick}
      role="button"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: active ? '#0a0a0a' : '#b5b5b5' }}
    >
      {children}
      <span style={{ fontSize: 10.5, fontWeight: 700 }}>{label}</span>
    </div>
  )
}
