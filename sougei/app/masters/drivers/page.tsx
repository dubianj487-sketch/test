'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, type Driver } from '@/lib/supabase'

type View = 'list' | 'form'

const font = "'Hanken Grotesk', 'Noto Sans JP', sans-serif"

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
  const headerSub = view === 'list' ? 'ドライバー管理' : isEditing ? '編集' : '追加'

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
        background: '#fff',
        padding: '52px 20px 14px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {view === 'form' ? (
            <button
              onClick={() => setView('list')}
              style={{
                width: 38, height: 38, borderRadius: 11,
                background: '#f4f4f4', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
                <path d="M8 1 2 7.5 8 14" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <Link
              href="/boy"
              style={{
                width: 38, height: 38, borderRadius: 11,
                background: '#f4f4f4', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, textDecoration: 'none',
              }}
            >
              <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
                <path d="M8 1 2 7.5 8 14" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#8a8a8a', letterSpacing: '.04em' }}>管理</p>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.01em', lineHeight: 1 }}>
              {headerSub}
            </h1>
          </div>
        </div>
        {view === 'list' && (
          <button
            onClick={openAddForm}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px',
              background: '#0a0a0a', border: 'none', borderRadius: 999,
              color: '#fff', fontSize: 13, fontWeight: 700,
              fontFamily: font, cursor: 'pointer',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
            追加
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 120px' }}>

        {/* List */}
        {view === 'list' && (
          <div className="animate-fade-in">
            <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>
              {drivers.length}人登録中
            </p>
            {drivers.map(d => (
              <div key={d.id} style={{
                background: '#fff', borderRadius: 18,
                padding: '14px 16px', marginBottom: 10,
                border: '1px solid #ededed',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: '#f0fdf4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 800, color: '#06c167', flexShrink: 0,
                  }}>
                    {d.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#0a0a0a', letterSpacing: '-.01em' }}>
                      {d.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#9a9a9a', marginTop: 2, fontWeight: 500 }}>
                      {d.capacity}人乗り
                    </div>
                  </div>
                  {d.note && d.note.trim().length > 0 && (
                    <div style={{
                      fontSize: 11, color: '#9a9a9a',
                      background: '#f4f4f4', borderRadius: 8,
                      padding: '3px 8px', maxWidth: 90,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      {d.note}
                    </div>
                  )}
                  {d.status !== '待機' && d.status !== 'お店前' && (
                    <button
                      onClick={() => resetStatus(d.id)}
                      style={{
                        padding: '5px 10px', borderRadius: 999,
                        background: '#fff7ed', border: 'none',
                        color: '#c77700', fontSize: 11, fontWeight: 700,
                        cursor: 'pointer', flexShrink: 0, fontFamily: font,
                      }}
                    >
                      待機に戻す
                    </button>
                  )}
                  <button
                    onClick={() => openEditForm(d)}
                    style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: '#f4f4f4', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
                      <path d="M1 1l6 6.5L1 14" stroke="#9a9a9a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            {drivers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9a9a9a', fontSize: 14 }}>
                ドライバーが登録されていません
              </div>
            )}
            <div style={{ marginTop: 24, padding: '0 2px' }}>
              <Link href="/masters/girls" style={{ fontSize: 13, color: '#9a9a9a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                女の子管理 →
              </Link>
            </div>
          </div>
        )}

        {/* Form */}
        {view === 'form' && (
          <div className="animate-fade-in">
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>名前</p>
            <div style={{
              background: '#f7f7f7', borderRadius: 14,
              border: '1px solid #e6e6e6',
              padding: '14px 16px', marginBottom: 16,
            }}>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="例：田中"
                style={{
                  width: '100%', border: 'none', outline: 'none',
                  fontSize: 18, fontWeight: 700, color: '#0a0a0a',
                  fontFamily: font, background: 'transparent', padding: 0,
                }}
              />
            </div>

            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>車の定員</p>
            <div style={{
              background: '#f7f7f7', borderRadius: 14,
              border: '1px solid #e6e6e6',
              padding: '12px 16px', marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#0a0a0a' }}>{formCapacity} 人乗り</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => setFormCapacity(v => Math.max(v - 1, 1))}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#e8e8e8', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <svg width="14" height="3" viewBox="0 0 14 3" fill="none">
                    <path d="M1 1.5h12" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                <div style={{
                  width: 44, textAlign: 'center',
                  fontSize: 22, fontWeight: 800, color: '#0a0a0a',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {formCapacity}
                </div>
                <button
                  onClick={() => setFormCapacity(v => Math.min(v + 1, 10))}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#e8e8e8', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v12M1 7h12" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>
              メモ <span style={{ fontWeight: 400 }}>（任意）</span>
            </p>
            <div style={{
              background: '#f7f7f7', borderRadius: 14,
              border: '1px solid #e6e6e6',
              padding: '14px 16px', marginBottom: 28,
            }}>
              <textarea
                value={formNote}
                onChange={e => setFormNote(e.target.value)}
                placeholder="例：軽自動車・白"
                rows={3}
                style={{
                  width: '100%', border: 'none', outline: 'none',
                  fontSize: 15, color: '#0a0a0a',
                  fontFamily: font, background: 'transparent',
                  padding: 0, resize: 'none', lineHeight: 1.6,
                }}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              style={{
                width: '100%', height: 56, borderRadius: 15,
                background: canSave ? '#06c167' : '#f0f0f0',
                border: 'none',
                color: canSave ? '#fff' : '#b0b0b0',
                fontSize: 17, fontWeight: 700, fontFamily: font,
                cursor: canSave ? 'pointer' : 'default',
                transition: 'all 0.2s',
                boxShadow: canSave ? '0 8px 20px -8px rgba(6,193,103,.6)' : 'none',
              }}
            >
              {saving ? '保存中...' : '保存する'}
            </button>
            <button
              onClick={() => setView('list')}
              style={{
                width: '100%', padding: 12, background: 'transparent',
                border: 'none', color: '#9a9a9a', fontSize: 14, fontWeight: 500,
                fontFamily: font, cursor: 'pointer', marginTop: 4,
              }}
            >
              キャンセル
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
