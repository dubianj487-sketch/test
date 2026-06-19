'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Girl, type Driver, type GirlDailyOverride } from '@/lib/supabase'

type Run = {
  id: number
  girlIds: string[]
  dest: string
  urgency: 'now' | 'scheduled' | null
  scheduledTime: string
  driverId: string | null
}

let nextRunId = 1

function makeRun(girlIds: string[] = []): Run {
  return { id: nextRunId++, girlIds, dest: '', urgency: null, scheduledTime: '23:00', driverId: null }
}

export default function DispatchPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [girls, setGirls] = useState<Girl[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [busyDriverIds, setBusyDriverIds] = useState<string[]>([])
  const [selectedGirls, setSelectedGirls] = useState<string[]>([])
  const [runs, setRuns] = useState<Run[]>([])
  const [overrides, setOverrides] = useState<Record<string, GirlDailyOverride>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const today = new Date().toISOString().split('T')[0]
    const [girlsRes, driversRes, activeRes, overridesRes] = await Promise.all([
      supabase.from('girls').select('*').order('created_at', { ascending: true }),
      supabase.from('drivers').select('*').order('created_at', { ascending: true }),
      supabase.from('dispatches').select('driver_id').in('status', ['待機', '移動中']),
      supabase.from('girl_daily_overrides').select('*').eq('date', today),
    ])
    if (girlsRes.data) setGirls(girlsRes.data)
    if (driversRes.data) setDrivers(driversRes.data)
    if (activeRes.data) setBusyDriverIds(activeRes.data.map(d => d.driver_id).filter(Boolean) as string[])
    if (overridesRes.data) {
      const map: Record<string, GirlDailyOverride> = {}
      overridesRes.data.forEach(o => { map[o.girl_id] = o })
      setOverrides(map)
    }
  }

  function getEffectiveDest(g: Girl): string {
    const ov = overrides[g.id]
    if (ov && !ov.use_usual && ov.today_destination) return ov.today_destination
    return g.address || g.area || ''
  }

  function toggleGirl(id: string) {
    setSelectedGirls(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    )
  }

  function moveGirl(girlId: string, fromRunId: number) {
    setRuns(prev => {
      const fromIdx = prev.findIndex(r => r.id === fromRunId)
      if (fromIdx < 0) return prev

      if (prev.length === 1) {
        const girl = girls.find(g => g.id === girlId)
        const newRun = makeRun([girlId])
        newRun.dest = girl ? getEffectiveDest(girl) : ''
        return [
          { ...prev[0], girlIds: prev[0].girlIds.filter(id => id !== girlId) },
          newRun,
        ]
      }

      const toIdx = (fromIdx + 1) % prev.length
      return prev.map((r, idx) => {
        if (idx === fromIdx) return { ...r, girlIds: r.girlIds.filter(id => id !== girlId) }
        if (idx === toIdx) return { ...r, girlIds: [...r.girlIds, girlId] }
        return r
      })
    })
  }

  function updateRun(runId: number, updates: Partial<Run>) {
    setRuns(prev => prev.map(r => r.id === runId ? { ...r, ...updates } : r))
  }

  function addRun() {
    setRuns(prev => [...prev, makeRun([])])
  }

  async function handleDispatch() {
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    for (const run of runs) {
      if (!run.driverId || !run.urgency) continue
      const girlObjs = run.girlIds.map(id => girls.find(g => g.id === id)).filter(Boolean) as Girl[]
      const dest = run.dest || girlObjs.map(g => getEffectiveDest(g)).filter(Boolean).join('・')

      const estimatedReturn = new Date(Date.now() + 60 * 60 * 1000).toISOString()

      const { data: dispatchData, error } = await supabase.from('dispatches').insert({
        driver_id: run.driverId,
        destination: dest,
        urgency: run.urgency === 'now' ? '今すぐ' : '時間指定',
        scheduled_time: run.urgency === 'scheduled' ? run.scheduledTime : null,
        status: '待機',
        estimated_return: estimatedReturn,
        date: today,
      }).select('id').single()

      if (error) {
        console.error('dispatch insert error:', error)
        continue
      }

      if (dispatchData && run.girlIds.length > 0) {
        await supabase.from('dispatch_girls').insert(
          run.girlIds.map(girlId => ({ dispatch_id: dispatchData.id, girl_id: girlId }))
        )
      }
    }
    setSaving(false)
    router.push('/boy')
  }

  const stepTitles = ['配車依頼　1 / 3', '便を作る　2 / 3', '配車設定　3 / 3']
  const stepTitle = stepTitles[step - 1]

  const canStep1 = selectedGirls.length > 0
  const canStep2 = runs.some(r => r.girlIds.length > 0)
  const allAssignedDriverIds = runs.map(r => r.driverId).filter(Boolean) as string[]
  const canDispatch = step === 3 && runs.every(r => r.driverId !== null && r.urgency !== null)
  const ctaDisabled = step === 1 ? !canStep1 : step === 2 ? !canStep2 : !canDispatch

  const ctaLabel = step === 3
    ? (canDispatch ? `${runs.length}便を配車する` : '全便の設定を完了してください')
    : '次へ'

  function handleCta() {
    if (ctaDisabled) return
    if (step === 1) {
      nextRunId = 1
      const girlObjs = selectedGirls.map(id => girls.find(g => g.id === id)).filter(Boolean) as Girl[]
      const run1 = makeRun([...selectedGirls])
      run1.dest = girlObjs.map(g => getEffectiveDest(g)).filter(Boolean).join('・')
      setRuns([run1])
      setStep(2)
    } else if (step === 2) {
      const nonEmpty = runs.filter(r => r.girlIds.length > 0)
      setRuns(nonEmpty)
      setStep(3)
    } else if (step === 3) {
      handleDispatch()
    }
  }

  function handleBack() {
    if (step > 1) setStep(s => s - 1)
    else router.push('/boy')
  }

  const font = "'Hanken Grotesk', 'Noto Sans JP', sans-serif"

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
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '52px 20px 14px',
      }}>
        <button
          onClick={handleBack}
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
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.01em' }}>
          {stepTitle}
        </h1>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{
              flex: 1, height: 3, borderRadius: 99,
              background: step >= n ? '#0a0a0a' : '#e8e8e8',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 120px' }}>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="animate-fade-in">
            <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>
              乗車キャスト{selectedGirls.length > 0 ? `　${selectedGirls.length}名を選択中` : ''}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {girls.map(g => {
                const sel = selectedGirls.includes(g.id)
                const ov = overrides[g.id]
                const hasTodayDiff = ov && !ov.use_usual && ov.today_destination
                const destLabel = hasTodayDiff ? ov.today_destination! : (g.area || '')
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleGirl(g.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', padding: '14px 8px', borderRadius: 16,
                      border: sel ? '2px solid #0a0a0a' : '1px solid #ededed',
                      background: sel ? '#f4f4f4' : '#fff',
                      cursor: 'pointer', gap: 4,
                      fontFamily: font,
                    }}
                  >
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: sel ? '#0a0a0a' : hasTodayDiff ? '#c77700' : '#e0e0e0',
                      marginBottom: 2,
                    }} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: sel ? '#0a0a0a' : '#3a3a3a', lineHeight: 1.2 }}>
                      {g.name}
                    </span>
                    <span style={{ fontSize: 10, color: '#9a9a9a', fontWeight: 500 }}>{destLabel}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="animate-fade-in">
            <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>
              便を作る — 「›」で次の便へ移動
            </p>
            {runs.map((run, idx) => {
              const girlObjs = run.girlIds.map(id => girls.find(g => g.id === id)).filter(Boolean) as Girl[]
              const autoAreas = girlObjs.map(g => getEffectiveDest(g)).filter(Boolean)
              return (
                <div key={run.id} style={{
                  background: '#fff', borderRadius: 18,
                  padding: 16, marginBottom: 10, border: '1px solid #ededed',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a' }}>便 {idx + 1}</span>
                    <span style={{ fontSize: 12, color: '#9a9a9a', fontWeight: 500 }}>{run.girlIds.length}名</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 36 }}>
                    {girlObjs.map(g => (
                      <div key={g.id} style={{
                        display: 'flex', alignItems: 'center',
                        background: '#f4f4f4', borderRadius: 999,
                        padding: '5px 6px 5px 12px', gap: 6,
                        border: '1px solid #e8e8e8',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{g.name}</span>
                        <button
                          onClick={() => moveGirl(g.id, run.id)}
                          style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: '#e0e0e0', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', padding: 0, flexShrink: 0,
                          }}
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M3 2l3.5 3L3 8" stroke="#7a7a7a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {run.girlIds.length === 0 && (
                      <span style={{ fontSize: 12, color: '#c0c0c0', padding: '7px 0' }}>女の子を移してください</span>
                    )}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0',
                  }}>
                    <svg width="14" height="17" viewBox="0 0 14 17" fill="none">
                      <path d="M7 16s7-5 7-10A7 7 0 0 0 0 6c0 5 7 10 7 10Z" stroke="#9a9a9a" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                      <circle cx="7" cy="6" r="2" stroke="#9a9a9a" strokeWidth="1.5" />
                    </svg>
                    <input
                      type="text"
                      value={run.dest}
                      onChange={e => updateRun(run.id, { dest: e.target.value })}
                      placeholder={autoAreas.join('・') || 'エリアを入力'}
                      style={{
                        flex: 1, border: 'none', outline: 'none',
                        fontSize: 15, fontWeight: 600, color: '#0a0a0a',
                        fontFamily: font, background: 'transparent', padding: 0,
                      }}
                    />
                  </div>
                </div>
              )
            })}
            <button
              onClick={addRun}
              style={{
                width: '100%', padding: 14,
                background: 'transparent', border: '1.5px dashed #d0d0d0',
                borderRadius: 16, color: '#9a9a9a', fontSize: 14, fontWeight: 600,
                fontFamily: font, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>便を追加
            </button>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="animate-fade-in">
            {runs.map((run, idx) => {
              const girlObjs = run.girlIds.map(id => girls.find(g => g.id === id)).filter(Boolean) as Girl[]
              const dest = run.dest || girlObjs.map(g => getEffectiveDest(g)).filter(Boolean).join('・')

              return (
                <div key={run.id} style={{
                  background: '#fff', borderRadius: 18,
                  padding: 16, marginBottom: 12, border: '1px solid #ededed',
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a' }}>便 {idx + 1}</span>
                    <span style={{ fontSize: 12, color: '#9a9a9a', fontWeight: 500 }}>
                      {girlObjs.map(g => g.name).join('・')}
                    </span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0a', marginBottom: 14 }}>{dest}</div>

                  {/* Urgency */}
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>
                    緊急度
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <button
                      onClick={() => updateRun(run.id, { urgency: 'now' })}
                      style={{
                        flex: 1, padding: '14px 8px', borderRadius: 14,
                        background: run.urgency === 'now' ? '#0a0a0a' : '#f4f4f4',
                        border: 'none',
                        color: run.urgency === 'now' ? '#fff' : '#5a5a5a',
                        cursor: 'pointer', fontFamily: font,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      }}
                    >
                      <span style={{ fontSize: 16, fontWeight: 700 }}>今すぐ</span>
                      <span style={{ fontSize: 10, opacity: 0.7 }}>すぐに送る</span>
                    </button>
                    <button
                      onClick={() => updateRun(run.id, { urgency: 'scheduled' })}
                      style={{
                        flex: 1, padding: '14px 8px', borderRadius: 14,
                        background: run.urgency === 'scheduled' ? '#0a0a0a' : '#f4f4f4',
                        border: 'none',
                        color: run.urgency === 'scheduled' ? '#fff' : '#5a5a5a',
                        cursor: 'pointer', fontFamily: font,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      }}
                    >
                      <span style={{ fontSize: 16, fontWeight: 700 }}>時間指定</span>
                      <span style={{ fontSize: 10, opacity: 0.7 }}>上がり時間</span>
                    </button>
                  </div>

                  {run.urgency === 'scheduled' && (
                    <div style={{
                      background: '#f7f7f7', borderRadius: 12,
                      padding: '12px 14px',
                      display: 'flex', alignItems: 'center', gap: 10,
                      marginBottom: 14,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="#9a9a9a" strokeWidth="1.8" />
                        <path d="M12 7v5l3 3" stroke="#9a9a9a" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                      <span style={{ fontSize: 13, color: '#9a9a9a', fontWeight: 600 }}>上がり時間</span>
                      <input
                        type="time"
                        value={run.scheduledTime}
                        onChange={e => updateRun(run.id, { scheduledTime: e.target.value })}
                        style={{
                          marginLeft: 'auto', border: 'none', outline: 'none',
                          fontSize: 20, fontWeight: 800, color: '#0a0a0a',
                          fontFamily: font, background: 'transparent',
                          textAlign: 'right', cursor: 'pointer',
                        }}
                      />
                    </div>
                  )}

                  {/* Driver */}
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#8a8a8a', letterSpacing: '.04em' }}>
                    ドライバー
                  </p>
                  {drivers.map(d => {
                    const isSel = run.driverId === d.id
                    const assignedElsewhere = allAssignedDriverIds.includes(d.id) && !isSel
                    const isBusy = busyDriverIds.includes(d.id)
                    const isAvail = (d.status === '待機' || d.status === 'お店前') && !isBusy
                    const canSelect = isAvail && !assignedElsewhere
                    const statusLabel = isBusy && d.status === '待機' ? '承諾待ち' : d.status

                    return (
                      <button
                        key={d.id}
                        onClick={() => canSelect && updateRun(run.id, { driverId: isSel ? null : d.id })}
                        style={{
                          display: 'flex', alignItems: 'center', width: '100%',
                          background: isSel ? '#f4f4f4' : '#fff',
                          borderRadius: 14,
                          border: isSel ? '2px solid #0a0a0a' : '1px solid #ededed',
                          padding: '12px 14px', marginBottom: 8,
                          cursor: canSelect ? 'pointer' : 'default',
                          opacity: canSelect ? 1 : 0.45,
                          transition: 'all 0.15s',
                          fontFamily: font,
                        }}
                      >
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: isAvail ? '#f0f0f0' : '#f7f7f7',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 700,
                          color: isAvail ? '#0a0a0a' : '#9a9a9a', flexShrink: 0,
                        }}>
                          {d.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, textAlign: 'left', paddingLeft: 12 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: canSelect ? '#0a0a0a' : '#9a9a9a' }}>
                            {d.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#9a9a9a', marginTop: 1 }}>
                            {!canSelect && !assignedElsewhere
                              ? (d.status === '移動中' ? '送迎中' : isBusy ? '承諾待ち' : '終了済み')
                              : assignedElsewhere ? '他の便に割当済み' : '配車可能'}
                          </div>
                        </div>
                        <div style={{
                          background: d.status === 'お店前' ? '#f5f3ff' : isAvail ? '#f0fdf4' : d.status === '移動中' ? '#fff7ed' : isBusy ? '#eff6ff' : '#f4f4f4',
                          color: d.status === 'お店前' ? '#8b5cf6' : isAvail ? '#06c167' : d.status === '移動中' ? '#c77700' : isBusy ? '#3478f6' : '#9a9a9a',
                          borderRadius: 999, padding: '4px 10px',
                          fontSize: 11, fontWeight: 700,
                        }}>
                          {statusLabel}
                        </div>
                        {isSel && (
                          <svg style={{ marginLeft: 8, flexShrink: 0 }} width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="10" fill="#0a0a0a" />
                            <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '12px 20px 32px',
        background: 'linear-gradient(0deg, #fff 60%, rgba(255,255,255,0))',
        zIndex: 100, pointerEvents: 'none',
      }}>
        <button
          onClick={handleCta}
          disabled={ctaDisabled || saving}
          style={{
            width: '100%', height: 56, border: 'none', borderRadius: 15,
            fontSize: 16, fontWeight: 700, fontFamily: font,
            cursor: ctaDisabled ? 'default' : 'pointer',
            pointerEvents: 'auto',
            transition: 'all 0.2s',
            background: ctaDisabled ? '#f0f0f0' : step === 3 ? '#06c167' : '#0a0a0a',
            color: ctaDisabled ? '#b0b0b0' : '#fff',
            boxShadow: ctaDisabled ? 'none' : step === 3 ? '0 8px 20px -8px rgba(6,193,103,.6)' : '0 8px 20px -8px rgba(0,0,0,.5)',
          }}
        >
          {saving ? '配車中...' : ctaLabel}
        </button>
      </div>
    </div>
  )
}
