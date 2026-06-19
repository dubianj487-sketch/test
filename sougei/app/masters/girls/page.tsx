'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, type Girl } from '@/lib/supabase'

type View = 'list' | 'form'

const font = "'Hanken Grotesk', 'Noto Sans JP', sans-serif"

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
  const headerSub = view === 'list' ? '女の子管理' : isEditing ? '編集' : '追加'

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
              href="/masters/drivers"
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
              {girls.length}人登録中
            </p>
            {girls.map(g => (
              <div key={g.id} style={{
                background: '#fff', borderRadius: 18,
                padding: '14px 16px', marginBottom: 10,
                border: '1px solid #ededed',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: '#fdf4ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 800, color: '#a855f7', flexShrink: 0,
                  }}>
                    {g.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#0a0a0a', letterSpacing: '-.01em' }}>
                      {g.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#9a9a9a', marginTop: 2, fontWeight: 500 }}>
                      {g.area || '—'}
                    </div>
                  </div>
                  {g.note && g.note.trim().length > 0 && (
                    <div style={{
                      fontSize: 11, color: '#9a9a9a',
                      background: '#f4f4f4', borderRadius: 8,
                      padding: '3px 8px', maxWidth: 90,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      {g.note}
                    </div>
                  )}
                  <button
                    onClick={() => openEditForm(g)}
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
            {girls.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9a9a9a', fontSize: 14 }}>
                女の子が登録されていません
              </div>
            )}
          </div>
        )}

        {/* Form */}
        {view === 'form' && (
          <div className="animate-fade-in">
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>名前（源氏名）</p>
            <div style={{
              background: '#f7f7f7', borderRadius: 14,
              border: '1px solid #e6e6e6',
              padding: '14px 16px', marginBottom: 16,
            }}>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="例：さくら"
                style={{
                  width: '100%', border: 'none', outline: 'none',
                  fontSize: 18, fontWeight: 700, color: '#0a0a0a',
                  fontFamily: font, background: 'transparent', padding: 0,
                }}
              />
            </div>

            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>自宅エリア</p>
            <div style={{
              background: '#f7f7f7', borderRadius: 14,
              border: '1px solid #e6e6e6',
              padding: '14px 16px', marginBottom: 16,
            }}>
              <input
                type="text"
                value={formArea}
                onChange={e => setFormArea(e.target.value)}
                placeholder="例：女池、駅前、新発田"
                style={{
                  width: '100%', border: 'none', outline: 'none',
                  fontSize: 18, fontWeight: 700, color: '#0a0a0a',
                  fontFamily: font, background: 'transparent', padding: 0,
                }}
              />
            </div>

            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>
              自宅住所 <span style={{ fontWeight: 400 }}>（任意）</span>
            </p>
            <div style={{
              background: '#f7f7f7', borderRadius: 14,
              border: '1px solid #e6e6e6',
              padding: '14px 16px', marginBottom: 16,
            }}>
              <input
                type="text"
                value={formAddress}
                onChange={e => setFormAddress(e.target.value)}
                placeholder="例：新潟市中央区女池1-2-3"
                style={{
                  width: '100%', border: 'none', outline: 'none',
                  fontSize: 16, fontWeight: 500, color: '#0a0a0a',
                  fontFamily: font, background: 'transparent', padding: 0,
                }}
              />
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
                placeholder="例：終電注意、送り先2箇所あり"
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
