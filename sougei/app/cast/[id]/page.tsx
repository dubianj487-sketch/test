'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Girl, type GirlDailyOverride } from '@/lib/supabase'

export default function CastPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [castId, setCastId] = useState<string | null>(null)
  const [girl, setGirl] = useState<Girl | null>(null)
  const [override, setOverride] = useState<GirlDailyOverride | null>(null)
  const [choice, setChoice] = useState<'usual' | 'different' | null>(null)
  const [customDest, setCustomDest] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(({ id }) => setCastId(id))
  }, [params])

  useEffect(() => {
    if (!castId) return
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      supabase.from('girls').select('*').eq('id', castId).single(),
      supabase.from('girl_daily_overrides').select('*').eq('girl_id', castId).eq('date', today).maybeSingle(),
    ]).then(([girlRes, overrideRes]) => {
      if (girlRes.data) setGirl(girlRes.data)
      if (overrideRes.data) {
        setOverride(overrideRes.data)
        setChoice(overrideRes.data.use_usual ? 'usual' : 'different')
        if (!overrideRes.data.use_usual && overrideRes.data.today_destination) {
          setCustomDest(overrideRes.data.today_destination)
        }
        setSaved(true)
      }
      setLoading(false)
    })
  }, [castId])

  async function handleSave() {
    if (!castId || !choice) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const payload = {
      girl_id: castId,
      date: today,
      use_usual: choice === 'usual',
      today_destination: choice === 'different' ? customDest.trim() || null : null,
    }
    await supabase.from('girl_daily_overrides').upsert(payload, { onConflict: 'girl_id,date' })
    setSaved(true)
    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif" }}>
        <div style={{ color: '#aeaeb2', fontSize: 14 }}>読み込み中...</div>
      </div>
    )
  }

  if (!girl) {
    return (
      <div style={{ minHeight: '100dvh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif" }}>
        <div style={{ color: '#aeaeb2', fontSize: 14 }}>見つかりませんでした</div>
      </div>
    )
  }

  const effectiveDest = girl.address || girl.area || '未登録'
  const canSave = choice === 'usual' || (choice === 'different' && customDest.trim().length > 0)

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5', fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", color: '#1c1c1e', display: 'flex', flexDirection: 'column' }}>

      <div style={{ background: '#ffffff', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => router.push('/cast')}
            style={{ width: 30, height: 30, borderRadius: '50%', background: '#f5f5f5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="#1c1c1e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.02em', lineHeight: 1 }}>送迎</div>
            <div style={{ fontSize: 12, color: '#8e8e93', fontWeight: 400, marginTop: 2 }}>{girl.name}</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 14px 40px' }}>

        {/* Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#ffffff', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.1)', padding: '16px 16px', marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(52,120,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#3478f6', flexShrink: 0 }}>
            {girl.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.01em' }}>{girl.name}</div>
            <div style={{ fontSize: 13, color: '#8e8e93', marginTop: 3 }}>いつもの送り先：{effectiveDest}</div>
          </div>
        </div>

        {/* Choice */}
        <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 10, paddingLeft: 2 }}>
          今日の送り先
        </div>

        <button
          onClick={() => { setChoice('usual'); setSaved(false) }}
          style={{
            display: 'flex', alignItems: 'center', width: '100%',
            background: '#ffffff',
            borderRadius: 14,
            border: choice === 'usual' ? '2px solid #1a9e50' : '1.5px solid rgba(0,0,0,0.1)',
            padding: '16px 16px',
            marginBottom: 8,
            cursor: 'pointer',
            gap: 14,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
            textAlign: 'left',
          }}
        >
          <div style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            background: choice === 'usual' ? '#1a9e50' : '#e5e5ea',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {choice === 'usual' && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1c1c1e' }}>今日もいつも通り</div>
            <div style={{ fontSize: 13, color: '#8e8e93', marginTop: 2 }}>{effectiveDest}</div>
          </div>
        </button>

        <button
          onClick={() => { setChoice('different'); setSaved(false) }}
          style={{
            display: 'flex', alignItems: 'center', width: '100%',
            background: '#ffffff',
            borderRadius: 14,
            border: choice === 'different' ? '2px solid #3478f6' : '1.5px solid rgba(0,0,0,0.1)',
            padding: '16px 16px',
            marginBottom: 8,
            cursor: 'pointer',
            gap: 14,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
            textAlign: 'left',
          }}
        >
          <div style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            background: choice === 'different' ? '#3478f6' : '#e5e5ea',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {choice === 'different' && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1c1c1e' }}>今日は違う場所</div>
            <div style={{ fontSize: 13, color: '#8e8e93', marginTop: 2 }}>住所を入力する</div>
          </div>
        </button>

        {choice === 'different' && (
          <div style={{ background: '#ffffff', borderRadius: 14, border: '1.5px solid rgba(52,120,246,0.3)', padding: '14px 16px', marginBottom: 8 }} className="animate-fade-in">
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 8 }}>送り先住所</div>
            <input
              type="text"
              value={customDest}
              onChange={e => { setCustomDest(e.target.value); setSaved(false) }}
              placeholder="例：新宿区○○ ×× マンション 101"
              autoFocus
              style={{
                width: '100%', border: 'none', outline: 'none',
                fontSize: 16, fontWeight: 600, color: '#1c1c1e',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
                background: 'transparent', padding: 0,
              }}
            />
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!canSave || saving || saved}
          style={{
            width: '100%', padding: 17, marginTop: 8,
            background: saved ? 'rgba(26,158,80,0.1)' : canSave ? '#1a9e50' : '#e5e5ea',
            border: 'none', borderRadius: 14,
            color: saved ? '#1a9e50' : canSave ? '#ffffff' : '#aeaeb2',
            fontSize: 17, fontWeight: 700,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
            cursor: canSave && !saved ? 'pointer' : 'default',
            transition: 'all 0.2s',
          }}
        >
          {saving ? '保存中...' : saved ? '保存済み ✓' : '保存する'}
        </button>
      </div>
    </div>
  )
}
