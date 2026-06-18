'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, type Driver } from '@/lib/supabase'

type View = 'list' | 'form'

export default function DriversPage() {
  const [view, setView] = useState<View>('list')
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formCapacity, setFormCapacity] = useState(5)
  const [formNote, setFormNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDrivers()
  }, [])

  async function fetchDrivers() {
    const { data } = await supabase.from('drivers').select('*').order('created_at', { ascending: true })
    if (data) setDrivers(data)
  }

  async function resetStatus(id: string) {
    await supabase.from('dispatches').update({ status: '完了' }).eq('driver_id', id).eq('status', '移動中')
    await supabase.from('drivers').update({ status: '待機' }).eq('id', id)
    await fetchDrivers()
  }

  function openAddForm() {
    setEditingId(null)
    setFormName('')
    setFormCapacity(5)
    setFormNote('')
    setView('form')
  }

  function openEditForm(d: Driver) {
    setEditingId(d.id)
    setFormName(d.name)
    setFormCapacity(d.capacity)
    setFormNote(d.note || '')
    setView('form')
  }

  async function handleSave() {
    if (!formName.trim()) return
    setSaving(true)
    if (editingId) {
      await supabase.from('drivers').update({
        name: formName.trim(),
        capacity: formCapacity,
        note: formNote,
      }).eq('id', editingId)
    } else {
      await supabase.from('drivers').insert({
        name: formName.trim(),
        capacity: formCapacity,
        note: formNote,
        status: '待機',
      })
    }
    await fetchDrivers()
    setSaving(false)
    setView('list')
  }

  const canSave = formName.trim().length > 0
  const isEditing = editingId !== null
  const headerSub = view === 'list' ? 'ドライバー管理' : isEditing ? 'ドライバーを編集' : 'ドライバーを追加'

  const stepperBtnStyle: React.CSSProperties = {
    width: 36, height: 36, borderRadius: '50%',
    background: 'rgba(0,0,0,0.06)', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5', fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", color: '#1c1c1e', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#ffffff', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {view === 'form' && (
            <button
              onClick={() => setView('list')}
              style={{ width: 30, height: 30, borderRadius: '50%', background: '#f5f5f5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="#1c1c1e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {view === 'list' && (
            <Link href="/" style={{ width: 30, height: 30, borderRadius: '50%', background: '#f5f5f5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, textDecoration: 'none' }}>
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
              {drivers.length}人登録中
            </div>
            {drivers.map(d => (
              <div key={d.id} style={{ background: '#ffffff', borderRadius: 14, padding: '14px 14px', marginBottom: 8, border: '1.5px solid rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: 'rgba(26,158,80,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: '#1a9e50', flexShrink: 0,
                  }}>
                    {d.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.01em' }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2, fontWeight: 400 }}>{d.capacity}人乗り</div>
                  </div>
                  {d.note && d.note.trim().length > 0 && (
                    <div style={{ fontSize: 11, color: '#aeaeb2', background: 'rgba(0,0,0,0.04)', borderRadius: 6, padding: '3px 7px', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.note}
                    </div>
                  )}
                  {d.status !== '待機' && (
                    <button
                      onClick={() => resetStatus(d.id)}
                      style={{ padding: '5px 10px', borderRadius: 20, background: '#fff3e0', border: 'none', color: '#c2750a', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                    >
                      待機に戻す
                    </button>
                  )}
                  <button
                    onClick={() => openEditForm(d)}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: '#f5f5f5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
                      <path d="M2 2l6 5-6 5" stroke="#aeaeb2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            {drivers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#aeaeb2', fontSize: 14 }}>
                ドライバーが登録されていません
              </div>
            )}
            {/* Link to girls management */}
            <div style={{ marginTop: 20, padding: '0 2px' }}>
              <Link href="/masters/girls" style={{ fontSize: 13, color: '#8e8e93', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                女の子管理 →
              </Link>
            </div>
          </div>
        )}

        {/* Form */}
        {view === 'form' && (
          <div className="animate-fade-in">
            {/* Name */}
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 2 }}>名前</div>
            <div style={{ background: '#ffffff', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.1)', padding: '14px 16px', marginBottom: 14 }}>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="例：田中"
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: 18, fontWeight: 600, color: '#1c1c1e', fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", background: 'transparent', padding: 0 }}
              />
            </div>

            {/* Capacity */}
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 2 }}>車の定員</div>
            <div style={{ background: '#ffffff', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.1)', padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#1c1c1e' }}>{formCapacity} 人乗り</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <button
                  onClick={() => setFormCapacity(v => Math.max(v - 1, 1))}
                  style={stepperBtnStyle}
                >
                  <svg width="14" height="3" viewBox="0 0 14 3" fill="none">
                    <path d="M1 1.5h12" stroke="#1c1c1e" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                <div style={{ width: 40, textAlign: 'center', fontSize: 20, fontWeight: 700, fontFamily: "'SF Mono', Menlo, monospace", color: '#1c1c1e' }}>{formCapacity}</div>
                <button
                  onClick={() => setFormCapacity(v => Math.min(v + 1, 10))}
                  style={stepperBtnStyle}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v12M1 7h12" stroke="#1c1c1e" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Note */}
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 2 }}>
              メモ　<span style={{ fontWeight: 400, letterSpacing: 0 }}>（任意）</span>
            </div>
            <div style={{ background: '#ffffff', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.1)', padding: '14px 16px', marginBottom: 28 }}>
              <textarea
                value={formNote}
                onChange={e => setFormNote(e.target.value)}
                placeholder="例：軽自動車・白"
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
