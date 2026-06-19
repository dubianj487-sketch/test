'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CastRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [castId, setCastId] = useState<string | null>(null)
  const [reqPlace, setReqPlace] = useState('')
  const [reqReason, setReqReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    params.then(({ id }) => setCastId(id))
  }, [params])

  async function handleSubmit() {
    if (!castId || !reqPlace.trim()) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('girl_daily_overrides').upsert(
      { girl_id: castId, date: today, use_usual: false, today_destination: reqPlace.trim() },
      { onConflict: 'girl_id,date' }
    )
    setSaving(false)
    router.push(`/cast/${castId}`)
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
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.01em' }}>本日のみ変更申請</h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div
          style={{
            background: '#0a0a0a', borderRadius: 16, padding: 16,
            color: '#fff', display: 'flex', gap: 12, alignItems: 'flex-start',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.7" />
            <path d="M12 7v5l3 2" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: '#dcdcdc' }}>
            今日だけ、いつもと違う場所で降りたいときに申請できます。ボーイが確認後に降車ルートへ反映されます。
          </p>
        </div>

        <p style={{ margin: '22px 4px 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>
          本日の降車場所
        </p>
        <input
          value={reqPlace}
          onChange={(e) => setReqPlace(e.target.value)}
          placeholder="例：渋谷駅 ハチ公前"
          style={{
            height: 54, width: '100%', borderRadius: 14,
            background: '#f7f7f7', border: '1px solid #e6e6e6',
            color: '#0a0a0a', padding: '0 16px',
            fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
          }}
        />

        <p style={{ margin: '18px 4px 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>
          理由（任意）
        </p>
        <textarea
          value={reqReason}
          onChange={(e) => setReqReason(e.target.value)}
          placeholder="例：友人と待ち合わせのため"
          style={{
            width: '100%', height: 90, borderRadius: 14,
            background: '#f7f7f7', border: '1px solid #e6e6e6',
            color: '#0a0a0a', padding: '14px 16px',
            fontSize: 15, fontFamily: 'inherit', lineHeight: 1.6,
            outline: 'none', boxSizing: 'border-box', resize: 'none',
          }}
        />

        <button
          onClick={handleSubmit}
          disabled={!reqPlace.trim() || saving}
          style={{
            marginTop: 24, width: '100%', height: 56, borderRadius: 15,
            background: reqPlace.trim() ? '#0a0a0a' : '#f4f4f4',
            color: reqPlace.trim() ? '#fff' : '#9a9a9a',
            border: 'none', fontSize: 16, fontWeight: 700,
            cursor: reqPlace.trim() && !saving ? 'pointer' : 'default',
            fontFamily: 'inherit',
          }}
        >
          {saving ? '申請中...' : 'この内容で申請する'}
        </button>
        <p style={{ margin: '12px 4px 0', fontSize: 12, color: '#a0a0a0', textAlign: 'center' }}>
          申請は本日の送迎のみに適用されます。
        </p>
      </div>

      <CastNav castId={castId || ''} active="request" />
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
