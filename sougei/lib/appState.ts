export type GirlKey = string
export type DriverKey = string

export type Trip = {
  id: number
  assignedIds: string[]
  departTime: string
  driverKey: string | null
  lastTrip: boolean
  boarded: boolean
  completed: number
}

export type TodayRequest = {
  place: string
  reason: string
  status: '承認待ち' | '承認済み'
}

export type Girl = {
  name: string
  area: string
  dist: number
  addr: string
  color: string
}

export type DriverInfo = { name: string; initial: string; car: string; plate: string }

export type AppState = {
  girls: Record<string, Girl>
  drivers: Record<string, DriverInfo>
  trips: Trip[]
  nextTripId: number
  rideRequests: Partial<Record<string, 'approved'>>
  todayRequests: Partial<Record<string, TodayRequest>>
  driverStatuses: Record<string, string>
  castDrops: Record<string, string>
}

export const DEFAULT_CAST_DROPS: Record<string, string> = {
  kotone: '新潟市中央区古町通8番町1477 サンライズ古町 7F',
  miki:   '新潟市中央区万代1-6-3 万代マンション 402',
  yuna:   '新潟市中央区女池神明4-5-9 メゾン女池 203',
  ai:     '新潟市西区小針3-1-14 小針フラット 506',
  rena:   '新潟市西区内野町4-2-6 コーポ内野 102',
  saki:   '新潟市西区坂井東1-8-2 坂井ハウス 301',
  marin:  '新潟市西区黒埼4-22-11 黒埼レジデンス 404',
}

export const GIRLS: Record<string, Girl> = {
  kotone: { name: 'ことね', area: '古町（中央区）', dist: 0.8,  addr: '新潟市中央区古町通8番町1477 サンライズ古町 7F', color: '#F5A623' },
  miki:   { name: 'みき',   area: '万代（中央区）', dist: 1.5,  addr: '新潟市中央区万代1-6-3 万代マンション 402',      color: '#7B61FF' },
  yuna:   { name: 'ゆな',   area: '女池（中央区）', dist: 3.2,  addr: '新潟市中央区女池神明4-5-9 メゾン女池 203',     color: '#06C167' },
  ai:     { name: 'あい',   area: '小針（西区）',   dist: 5.8,  addr: '新潟市西区小針3-1-14 小針フラット 506',        color: '#E84855' },
  rena:   { name: 'れな',   area: '内野（西区）',   dist: 8.2,  addr: '新潟市西区内野町4-2-6 コーポ内野 102',         color: '#276EF1' },
  saki:   { name: 'さき',   area: '坂井東（西区）', dist: 9.5,  addr: '新潟市西区坂井東1-8-2 坂井ハウス 301',         color: '#00A8B5' },
  marin:  { name: 'まりん', area: '黒埼（西区）',   dist: 10.3, addr: '新潟市西区黒埼4-22-11 黒埼レジデンス 404',     color: '#FF7A45' },
}

export const DRIVERS: Record<string, DriverInfo> = {
  sato:   { name: '佐藤 健', initial: '佐', car: 'アルファード（白）',   plate: '新潟 300 あ 12-34' },
  tanaka: { name: '田中 誠', initial: '田', car: 'ヴェルファイア（黒）', plate: '新潟 500 い 56-78' },
}

export const DEFAULT_APP_STATE: AppState = {
  girls: { ...GIRLS },
  drivers: { ...DRIVERS },
  trips: [],
  nextTripId: 1,
  rideRequests: {},
  todayRequests: {},
  driverStatuses: { sato: '待機中', tanaka: '待機中' },
  castDrops: { ...DEFAULT_CAST_DROPS },
}

export function loadAppState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_APP_STATE
  try {
    const raw = localStorage.getItem('lm_appState')
    if (!raw) return { ...DEFAULT_APP_STATE, girls: { ...GIRLS }, drivers: { ...DRIVERS }, castDrops: { ...DEFAULT_CAST_DROPS } }
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      ...DEFAULT_APP_STATE,
      ...parsed,
      girls: parsed.girls || { ...GIRLS },
      drivers: parsed.drivers || { ...DRIVERS },
      driverStatuses: { ...DEFAULT_APP_STATE.driverStatuses, ...parsed.driverStatuses },
      castDrops: { ...DEFAULT_CAST_DROPS, ...parsed.castDrops },
    }
  } catch {
    return { ...DEFAULT_APP_STATE, girls: { ...GIRLS }, drivers: { ...DRIVERS }, castDrops: { ...DEFAULT_CAST_DROPS } }
  }
}

export function saveAppState(state: AppState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('lm_appState', JSON.stringify(state))
}

export type DriverStatusConfig = { available: boolean; color: string; sub: string }
export const DRIVER_STATUS_CONFIG: Record<string, DriverStatusConfig> = {
  '待機中':   { available: true,  color: '#06c167', sub: '近場の待機' },
  'お店前':   { available: true,  color: '#276EF1', sub: '店前待機' },
  '乗車待機': { available: false, color: '#F5A623', sub: 'お迎え待ち' },
  '移動中':   { available: false, color: '#9a9a9a', sub: '依頼不可' },
  '終了':     { available: false, color: '#6a6a6a', sub: '依頼不可' },
}

export function buildTripObjs(trip: Trip, girls: Record<string, Girl>, completed?: number) {
  const done = completed ?? trip.completed ?? 0
  const objs = trip.assignedIds
    .map(id => ({ id, ...(girls[id] || { name: '(削除済み)', area: '', dist: 0, addr: '', color: '#aaa' }) }))
    .sort((a, b) => a.dist - b.dist)
  const total = objs.length
  return objs.map((o, i) => {
    const isDone = i < done
    const isCurr = i === done && trip.boarded && done < total
    return {
      ...o,
      initial: o.name[0],
      distLabel: '店から' + o.dist.toFixed(1) + 'km',
      dropNo: i + 1,
      boardNo: total - i,
      done: isDone,
      current: isCurr,
      pending: !isDone && !isCurr,
      addr: girls[o.id]?.addr || '',
    }
  })
}
