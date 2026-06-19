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
      <div style={{
        minHeight: '100dvh', background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Hanken Grotesk', 'Noto Sans JP', sans-serif",
      }}>
        <div style={{ color: '#9a9a9a', fontSize: 14 }}>読み込み中...</div>
      </div>
    )
  }

  if (!girl) {
    return (
      <div style={{
        minHeight: '100dvh', background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Hanken Grotesk', 'Noto Sans JP', sans-serif",
      }}>
        <div style={{ color: '#9a9a9a', fontSize: 14 }}>見つかりませんでした</div>
      </div>
    )
  }

  const effectiveDest = girl.address || girl.area || '未登録'
  const canSave = choice === 'usual' || (choice === 'different' && customDest.trim().length > 0)

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#fff',
      fontFamily: "'Hanken Grotesk', 'Noto Sans JP', sans-serif",
      color: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: '52px 20px 14px',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#8a8a8a' }}>
            CLUB LUMINA
          </p>
          <h1 style={{ margin: '2px 0 0', fontSize: 24, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1 }}>
            こんばんは、{girl.name}さん
          </h1>
        </div>
        <button
          onClick={() => router.push('/cast')}
          style={{
            height: 38, padding: '0 14px', borderRadius: 10,
            background: '#f4f4f4', border: 'none',
            color: '#5a5a5a', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          戻る
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 40px' }}>

        {/* Today override alert */}
        {saved && override && !override.use_usual && override.today_destination && (
          <div style={{
            marginBottom: 16,
            background: '#fff8ed', border: '1px solid #ffe3b8',
            borderRadius: 16, padding: '14px 16px',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M12 8v5m0 3h.01M10.3 3.9 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                stroke="#c77700" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#c77700', letterSpacing: '.04em' }}>
                本日のみ降車場所を変更
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 600, color: '#8a5a00' }}>
                {override.today_destination}
              </p>
            </div>
          </div>
        )}

        {/* Registered address */}
        <div
          role="button"
          style={{
            border: '1px solid #ededed', borderRadius: 18,
            padding: 16, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
          }}
        >
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: '#f4f4f4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"
                stroke="#0a0a0a" strokeWidth="1.8" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.4" stroke="#0a0a0a" strokeWidth="1.8" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#9a9a9a', fontWeight: 600 }}>登録済みの降車場所</p>
            <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: '#0a0a0a' }}>
              {effectiveDest}
            </p>
          </div>
          <svg width="9" height="15" viewBox="0 0 9 15" style={{ flexShrink: 0 }}>
            <path d="M1 1l6 6.5L1 14" stroke="#bdbdbd" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Today choice */}
        <p style={{ margin: '0 4px 12px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>
          今日の降車場所
        </p>

        <button
          onClick={() => { setChoice('usual'); setSaved(false) }}
          style={{
            display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left',
            background: '#fff',
            borderRadius: 16,
            border: choice === 'usual' ? '2px solid #0a0a0a' : '1px solid #ededed',
            padding: '16px 16px',
            marginBottom: 10,
            cursor: 'pointer',
            gap: 14,
            fontFamily: 'inherit',
          }}
        >
          <div style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            background: choice === 'usual' ? '#0a0a0a' : '#e5e5ea',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {choice === 'usual' && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0a' }}>今日もいつも通り</div>
            <div style={{ fontSize: 13, color: '#8a8a8a', marginTop: 2 }}>{effectiveDest}</div>
          </div>
        </button>

        <button
          onClick={() => { setChoice('different'); setSaved(false) }}
          style={{
            display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left',
            background: '#fff',
            borderRadius: 16,
            border: choice === 'different' ? '2px solid #0a0a0a' : '1px solid #ededed',
            padding: '16px 16px',
            marginBottom: 10,
            cursor: 'pointer',
            gap: 14,
            fontFamily: 'inherit',
          }}
        >
          <div style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            background: choice === 'different' ? '#0a0a0a' : '#e5e5ea',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {choice === 'different' && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0a' }}>今日は違う場所</div>
            <div style={{ fontSize: 13, color: '#8a8a8a', marginTop: 2 }}>住所を入力する</div>
          </div>
        </button>

        {choice === 'different' && (
          <div style={{
            background: '#f7f7f7',
            borderRadius: 14, border: '1px solid #e6e6e6',
            padding: '14px 16px', marginBottom: 16,
          }} className="animate-fade-in">
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>
              本日の降車場所
            </p>
            <input
              type="text"
              value={customDest}
              onChange={e => { setCustomDest(e.target.value); setSaved(false) }}
              placeholder="例：新潟市中央区○○ ×× マンション 101"
              autoFocus
              style={{
                width: '100%', border: 'none', outline: 'none',
                fontSize: 15, fontWeight: 600, color: '#0a0a0a',
                fontFamily: 'inherit',
                background: 'transparent', padding: 0,
              }}
            />
          </div>
        )}

        {saved && (
          <div style={{
            marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#eafaf0', border: '1px solid #bdeccf',
            borderRadius: 13, padding: '12px 14px',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="m5 12 4 4 10-10" stroke="#06c167" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0a7a3f' }}>
              {choice === 'usual' ? 'いつも通りで保存しました' : '今日の降車場所を保存しました'}
            </span>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!canSave || saving || saved}
          style={{
            width: '100%', height: 56, borderRadius: 15,
            background: saved ? '#f0fdf4' : canSave ? '#0a0a0a' : '#f4f4f4',
            border: 'none',
            color: saved ? '#06c167' : canSave ? '#fff' : '#9a9a9a',
            fontSize: 16, fontWeight: 700,
            fontFamily: 'inherit',
            cursor: canSave && !saved ? 'pointer' : 'default',
            transition: 'all 0.2s',
          }}
        >
          {saving ? '保存中...' : saved ? '保存済み ✓' : 'この内容で保存'}
        </button>
      </div>
    </div>
  )
}
