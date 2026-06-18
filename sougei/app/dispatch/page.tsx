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
    router.push('/')
  }

  const stepTitles = ['送り配車　1 / 3', '便を作る　2 / 3', '配車設定　3 / 3']
  const stepTitle = stepTitles[step - 1]

  function stepBarStyle(n: number) {
    return {
      flex: 1, height: 3, borderRadius: 99,
      background: step >= n ? '#1c1c1e' : 'rgba(0,0,0,0.1)',
      transition: 'background 0.3s',
    }
  }

  const canStep1 = selectedGirls.length > 0
  const canStep2 = runs.some(r => r.girlIds.length > 0)
  const allAssignedDriverIds = runs.map(r => r.driverId).filter(Boolean) as string[]
  const canDispatch = step === 3 && runs.every(r => r.driverId !== null && r.urgency !== null)
  const ctaDisabled = step === 1 ? !canStep1 : step === 2 ? !canStep2 : !canDispatch

  const ctaLabel = step === 3
    ? (canDispatch ? `${runs.length}便を配車する` : '全便の設定を完了してください')
    : '次へ　›'

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
    else router.push('/')
  }

  const urgBtnBase: React.CSSProperties = {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '14px 8px', borderRadius: 12,
    border: 'none', cursor: 'pointer', gap: 2,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
    transition: 'all 0.15s',
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5', fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", color: '#1c1c1e', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#ffffff', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleBack}
            style={{ width: 30, height: 30, borderRadius: '50%', background: '#f5f5f5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="#1c1c1e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.02em', lineHeight: 1 }}>送迎</div>
            <div style={{ fontSize: 12, color: '#8e8e93', fontWeight: 400, marginTop: 2 }}>{stepTitle}</div>
          </div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e5e5ea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="7.5" r="3.5" fill="#8e8e93" />
            <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#8e8e93" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#ffffff', padding: '8px 16px 10px', borderBottom: '1px solid rgba(0,0,0,0.05)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={stepBarStyle(1)} />
          <div style={stepBarStyle(2)} />
          <div style={stepBarStyle(3)} />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 110px' }}>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 10, paddingLeft: 2 }}>
              女の子を選択{selectedGirls.length > 0 ? `　${selectedGirls.length}人` : ''}
            </div>
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
                      justifyContent: 'center', padding: '12px 6px', borderRadius: 14,
                      border: sel ? '2px solid #1a9e50' : '1.5px solid rgba(0,0,0,0.1)',
                      background: sel ? 'rgba(26,158,80,0.07)' : '#ffffff',
                      color: sel ? '#1a9e50' : '#1c1c1e',
                      cursor: 'pointer', gap: 3,
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
                    }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: sel ? '#1a9e50' : hasTodayDiff ? '#3478f6' : '#e5e5ea', marginBottom: 2 }} />
                    <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>{g.name}</span>
                    <span style={{ fontSize: 10, opacity: 0.6, marginTop: 1 }}>{destLabel}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 10, paddingLeft: 2 }}>
              便を作る　— 「›」で次の便へ移動
            </div>
            {runs.map((run, idx) => {
              const girlObjs = run.girlIds.map(id => girls.find(g => g.id === id)).filter(Boolean) as Girl[]
              const autoAreas = girlObjs.map(g => getEffectiveDest(g)).filter(Boolean)
              return (
                <div key={run.id} style={{ background: '#ffffff', borderRadius: 14, padding: 14, marginBottom: 8, border: '1.5px solid rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.01em' }}>便 {idx + 1}</span>
                    <span style={{ fontSize: 12, color: '#aeaeb2', fontWeight: 500 }}>{run.girlIds.length}人</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 34 }}>
                    {girlObjs.map(g => (
                      <div key={g.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(26,158,80,0.08)', border: '1.5px solid rgba(26,158,80,0.2)', borderRadius: 20, padding: '5px 6px 5px 11px', gap: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1c1c1e' }}>{g.name}</span>
                        <button
                          onClick={() => moveGirl(g.id, run.id)}
                          style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.07)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M3 2l3.5 3L3 8" stroke="#8e8e93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {run.girlIds.length === 0 && (
                      <span style={{ fontSize: 12, color: '#c7c7cc', padding: '7px 0' }}>女の子を移してください</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <svg width="13" height="16" viewBox="0 0 13 16" fill="none">
                      <circle cx="6.5" cy="6" r="3" stroke="#aeaeb2" strokeWidth="1.5" />
                      <path d="M6.5 9C6.5 9 2 12.5 2 15h9c0-2.5-4.5-6-4.5-6z" stroke="#aeaeb2" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                    </svg>
                    <input
                      type="text"
                      value={run.dest}
                      onChange={e => updateRun(run.id, { dest: e.target.value })}
                      placeholder={autoAreas.join('・') || 'エリアを入力'}
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, color: '#1c1c1e', fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", background: 'transparent', padding: 0 }}
                    />
                  </div>
                </div>
              )
            })}
            <button
              onClick={addRun}
              style={{ width: '100%', padding: 13, background: 'transparent', border: '1.5px dashed rgba(0,0,0,0.14)', borderRadius: 14, color: '#aeaeb2', fontSize: 14, fontWeight: 600, fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 }}
            >
              <span style={{ fontSize: 18, lineHeight: 1, marginRight: 2 }}>+</span>便を追加
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
                <div key={run.id} style={{ background: '#ffffff', borderRadius: 14, padding: 14, marginBottom: 10, border: '1.5px solid rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1c1c1e' }}>便 {idx + 1}</span>
                    <span style={{ fontSize: 12, color: '#aeaeb2', fontWeight: 500 }}>{girlObjs.map(g => g.name).join('・')}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1c1c1e', marginBottom: 12 }}>{dest}</div>

                  {/* Urgency */}
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 8 }}>緊急度</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button
                      onClick={() => updateRun(run.id, { urgency: 'now' })}
                      style={{ ...urgBtnBase, background: run.urgency === 'now' ? '#1c1c1e' : 'rgba(0,0,0,0.04)', color: run.urgency === 'now' ? '#ffffff' : '#1c1c1e' }}
                    >
                      <span style={{ fontSize: 16, fontWeight: 700 }}>今すぐ</span>
                      <span style={{ fontSize: 10, opacity: 0.7 }}>すぐに送る</span>
                    </button>
                    <button
                      onClick={() => updateRun(run.id, { urgency: 'scheduled' })}
                      style={{ ...urgBtnBase, background: run.urgency === 'scheduled' ? '#1c1c1e' : 'rgba(0,0,0,0.04)', color: run.urgency === 'scheduled' ? '#ffffff' : '#1c1c1e' }}
                    >
                      <span style={{ fontSize: 16, fontWeight: 700 }}>時間指定</span>
                      <span style={{ fontSize: 10, opacity: 0.7 }}>上がり時間を指定</span>
                    </button>
                  </div>

                  {run.urgency === 'scheduled' && (
                    <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6.5" stroke="#aeaeb2" strokeWidth="1.5" />
                        <path d="M8 4.5v3.5l2 2" stroke="#aeaeb2" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <span style={{ fontSize: 13, color: '#aeaeb2', fontWeight: 500 }}>上がり時間</span>
                      <input
                        type="time"
                        value={run.scheduledTime}
                        onChange={e => updateRun(run.id, { scheduledTime: e.target.value })}
                        style={{ marginLeft: 'auto', border: 'none', outline: 'none', fontSize: 20, fontWeight: 700, color: '#1c1c1e', fontFamily: "'SF Mono', Menlo, monospace", background: 'transparent', textAlign: 'right', cursor: 'pointer' }}
                      />
                    </div>
                  )}

                  {/* Driver */}
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', letterSpacing: '0.08em', marginBottom: 8 }}>ドライバー</div>
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
                          background: isSel ? 'rgba(26,158,80,0.06)' : '#ffffff',
                          borderRadius: 12,
                          border: isSel ? '2px solid #1a9e50' : '1.5px solid rgba(0,0,0,0.1)',
                          padding: '11px 12px', marginBottom: 6,
                          cursor: canSelect ? 'pointer' : 'default',
                          opacity: canSelect ? 1 : 0.4,
                          transition: 'all 0.15s',
                          fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
                        }}
                      >
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: isAvail ? (d.status === 'お店前' ? 'rgba(88,86,214,0.1)' : 'rgba(26,158,80,0.1)') : 'rgba(0,0,0,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700,
                          color: isAvail ? (d.status === 'お店前' ? '#5856d6' : '#1a9e50') : '#aeaeb2', flexShrink: 0,
                        }}>
                          {d.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, textAlign: 'left', paddingLeft: 10 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: canSelect ? '#1c1c1e' : '#aeaeb2', letterSpacing: '-0.01em' }}>{d.name}</div>
                          <div style={{ fontSize: 11, color: '#aeaeb2', marginTop: 1 }}>
                            {!canSelect && !assignedElsewhere
                              ? (d.status === '移動中' ? '送迎中' : isBusy ? '承諾待ち' : '終了済み')
                              : assignedElsewhere ? '他の便に割当済み' : '配車可能'}
                          </div>
                        </div>
                        <div style={{
                          background: d.status === 'お店前' ? '#5856d6' : isAvail ? '#1a9e50' : d.status === '移動中' ? '#c2750a' : isBusy ? '#3478f6' : '#e5e5ea',
                          color: isAvail || d.status === '移動中' || isBusy || d.status === 'お店前' ? '#ffffff' : '#8e8e93',
                          borderRadius: 20, padding: '3px 10px',
                          fontSize: 11, fontWeight: 700,
                        }}>
                          {statusLabel}
                        </div>
                        {isSel && (
                          <svg style={{ marginLeft: 8, flexShrink: 0 }} width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="10" fill="#1a9e50" />
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
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '8px 14px 28px', background: 'linear-gradient(0deg, #f5f5f5 60%, rgba(245,245,245,0))', zIndex: 100, pointerEvents: 'none' }}>
        <button
          onClick={handleCta}
          disabled={ctaDisabled || saving}
          style={{
            width: '100%', padding: 16, border: 'none', borderRadius: 14,
            fontSize: step === 3 ? 17 : 16, fontWeight: 700,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
            cursor: ctaDisabled ? 'default' : 'pointer',
            pointerEvents: 'auto',
            transition: 'all 0.2s',
            background: ctaDisabled ? '#e5e5ea' : step === 3 ? '#1a9e50' : '#1c1c1e',
            color: ctaDisabled ? '#aeaeb2' : '#ffffff',
            letterSpacing: '-0.01em',
          }}
        >
          {saving ? '配車中...' : ctaLabel}
        </button>
      </div>
    </div>
  )
}
