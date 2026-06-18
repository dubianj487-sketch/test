'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, type Girl } from '@/lib/supabase'

type View = 'list' | 'form'

export default function GirlsPage() {
  const [view, setView] = useState<View>('list')
  const [girls, setGirls] = useState<Girl[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formArea, setFormArea] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formNote, setFormNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchGirls()
  }, [])

  async function fetchGirls() {
    const { data } = await supabase.from('girls').select('*').order('created_at', { ascending: true })
    if (data) setGirls(data)
  }

  function openAddForm() {
    setEditingId(null)
    setFormName('')
    setFormArea('')
    setFormAddress('')
    setFormNote('')
    setView('form')
  }

  function openEditForm(g: Girl) {
    setEditingId(g.id)
    setFormName(g.name)
    setFormArea(g.area || '')
    setFormAddress(g.address || '')
    setFormNote(g.note || '')
    setView('form')
  }

  async function handleSave() {
    if (!formName.trim() || !formArea.trim()) return
    setSaving(true)
    if (editingId) {
      await supabase.from('girls').update({
        name: formName.trim(),
        area: formArea.trim(),
        address: formAddress.trim() || null,
        note: formNote || null,
      }).eq('id', editingId)
    } else {
      await supabase.from('girls').insert({
        name: formName.trim(),
        area: formArea.trim(),
        address: formAddress.trim() || null,
        note: formNote || null,
      })
    }
    await fetchGirls()
    setSaving(false)
    setView('list')
  }

  const canSave = formName.trim().length > 0 && formArea.trim().length > 0
  const isEditing = editingId !== null
  const headerSub = view === 'list' ? '女の子管理' : isEditing ? '女の子を編集' : '女の子を追加'

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5', fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", color: '#1c1c1e', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#ffffff', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {view === 'form' ? (
            <button
              onClick={() => setView('list')}
              style={{ width: 30, height: 30, borderRadius: '50%', background: '#f5f5f5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="#1c1c1e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <Link href="/masters/drivers" style={{ width: 30, height: 30, borderRadius: '50%', background: '#f5f5f5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, textDecoration: 'none' }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="#1c1c1e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.02em', lineHeight: 1 }}>送迎</div>
            <div style={{ fontSize: 12, color: '#8e8e93', fontWeight: 400, marginTop: 2 }}>{headerSub}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {view === 'list' && (
            <button
              onClick={openAddForm}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', background: '#1c1c1e', border: 'none', borderRadius: 20, color: '#ffffff', fontSize: 13, fontWeight: 600, fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", cursor: 'pointer' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              </svg>
              追加
            </button>
          )}
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e5e5ea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7.5" r="3.5" fill="#8e8e93" />
              <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#8e8e93" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 96px' }}>

        {/* List */}
        {view === 'list' && (
          <div className="animate-fade-in">
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 10, paddingLeft: 2 }}>
              {girls.length}人登録中
            </div>
            {girls.map(g => (
              <div key={g.id} style={{ background: '#ffffff', borderRadius: 14, padding: 14, marginBottom: 8, border: '1.5px solid rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: 'rgba(194,117,10,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: '#c2750a', flexShrink: 0,
                  }}>
                    {g.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.01em' }}>{g.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                      <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                        <circle cx="5" cy="4.5" r="2.5" stroke="#aeaeb2" strokeWidth="1.3" />
                        <path d="M5 7C5 7 1.5 9.5 1.5 11.5h7C8.5 9.5 5 7 5 7z" stroke="#aeaeb2" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
                      </svg>
                      <span style={{ fontSize: 12, color: '#8e8e93', fontWeight: 400 }}>{g.area || '—'}</span>
                    </div>
                  </div>
                  {g.note && g.note.trim().length > 0 && (
                    <div style={{ fontSize: 11, color: '#aeaeb2', background: 'rgba(0,0,0,0.04)', borderRadius: 6, padding: '3px 7px', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {g.note}
                    </div>
                  )}
                  <button
                    onClick={() => openEditForm(g)}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: '#f5f5f5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
                      <path d="M2 2l6 5-6 5" stroke="#aeaeb2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            {girls.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#aeaeb2', fontSize: 14 }}>
                女の子が登録されていません
              </div>
            )}
          </div>
        )}

        {/* Form */}
        {view === 'form' && (
          <div className="animate-fade-in">
            {/* Name */}
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 2 }}>名前（源氏名）</div>
            <div style={{ background: '#ffffff', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.1)', padding: '14px 16px', marginBottom: 14 }}>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="例：さくら"
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 18, fontWeight: 600, color: '#1c1c1e', fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", background: 'transparent', padding: 0 }}
              />
            </div>

            {/* Area */}
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 2 }}>自宅エリア</div>
            <div style={{ background: '#ffffff', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.1)', padding: '14px 16px', marginBottom: 14 }}>
              <input
                type="text"
                value={formArea}
                onChange={e => setFormArea(e.target.value)}
                placeholder="例：女池、駅前、新発田"
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 18, fontWeight: 600, color: '#1c1c1e', fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", background: 'transparent', padding: 0 }}
              />
            </div>

            {/* Address */}
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 2 }}>
              自宅住所　<span style={{ fontWeight: 400, letterSpacing: 0 }}>（任意）</span>
            </div>
            <div style={{ background: '#ffffff', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.1)', padding: '14px 16px', marginBottom: 14 }}>
              <input
                type="text"
                value={formAddress}
                onChange={e => setFormAddress(e.target.value)}
                placeholder="例：新潟市中央区女池1-2-3"
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 16, fontWeight: 500, color: '#1c1c1e', fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", background: 'transparent', padding: 0 }}
              />
            </div>

            {/* Note */}
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 2 }}>
              メモ　<span style={{ fontWeight: 400, letterSpacing: 0 }}>（任意）</span>
            </div>
            <div style={{ background: '#ffffff', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.1)', padding: '14px 16px', marginBottom: 28 }}>
              <textarea
                value={formNote}
                onChange={e => setFormNote(e.target.value)}
                placeholder="例：終電注意、送り先2箇所あり"
                rows={3}
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 15, color: '#1c1c1e', fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", background: 'transparent', padding: 0, resize: 'none', lineHeight: 1.6 }}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              style={{
                width: '100%', padding: 17,
                background: canSave ? '#1a9e50' : '#e5e5ea',
                border: 'none', borderRadius: 14,
                color: canSave ? '#ffffff' : '#aeaeb2',
                fontSize: 17, fontWeight: 700,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
                cursor: canSave ? 'pointer' : 'default', transition: 'all 0.2s',
              }}
            >
              {saving ? '保存中...' : '保存する'}
            </button>
            <button
              onClick={() => setView('list')}
              style={{ width: '100%', padding: 12, background: 'transparent', border: 'none', color: '#aeaeb2', fontSize: 14, fontWeight: 500, fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", cursor: 'pointer', marginTop: 4 }}
            >
              キャンセル
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
