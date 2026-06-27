// ===== ドメイン型 =====
export type Girl = {
  id: string
  name: string
  area: string
  dist: number
  addr: string
  color: string
  drop_address: string | null
  sort: number
}

export type Driver = {
  key: string
  name: string
  initial: string
  car: string
  plate: string
  sort: number
}

export type Trip = {
  id: number
  assigned_ids: string[]
  depart_time: string
  driver_key: string | null
  last_trip: boolean
  boarded: boolean
  completed: number
  arrived: boolean
  changed: boolean
  manual_order: boolean
  confirmed: boolean
  pending_at_store: boolean
  created_at: string | null
}

// ===== 営業日（正午締め） =====
// ナイトの営業は深夜をまたぐため、誰も送迎していない正午で1営業日を区切る。
// 正午より前なら前日正午が起点、正午以降なら当日正午が起点。
export function businessDayStart(now: Date = new Date()): number {
  const noon = new Date(now)
  noon.setHours(12, 0, 0, 0)
  if (now.getTime() < noon.getTime()) noon.setDate(noon.getDate() - 1)
  return noon.getTime()
}

export function inCurrentBusinessDay(t: Trip, startMs: number): boolean {
  if (!t.created_at) return true
  return new Date(t.created_at).getTime() >= startMs
}

export type RideReqMap = Record<string, string> // girl_id -> status
export type DriverStatusMap = Record<string, string> // driver_key -> status

export type GirlMap = Record<string, Girl>
export type DriverMap = Record<string, Driver>

// ===== ドライバー稼働ステータス定義 =====
export const driverStatusConfig: Record<
  string,
  { available: boolean; color: string; bg: string; border: string; label: string; sub: string }
> = {
  待機中: { available: true, color: '#06c167', bg: '#eafaf0', border: '#bdeccf', label: '待機中', sub: '近場の待機' },
  お店前: { available: true, color: '#276EF1', bg: '#eef3ff', border: '#c3d4fb', label: 'お店前', sub: 'お店前の待機' },
  乗車待機: { available: false, color: '#F5A623', bg: '#fff8ed', border: '#ffe3b8', label: '乗車待機', sub: 'お迎え待ち' },
  移動中: { available: false, color: '#9a9a9a', bg: '#f4f4f4', border: '#e0e0e0', label: '移動中', sub: '依頼不可' },
  終了: { available: false, color: '#6a6a6a', bg: '#f0f0f0', border: '#dcdcdc', label: '終了', sub: '依頼不可' },
}

// ===== 純粋ヘルパー（プロトタイプ移植） =====
export function sumDist(ids: string[], girls: GirlMap): number {
  return ids.reduce((s, id) => s + (girls[id]?.dist || 0), 0)
}

export function estMinNum(ids: string[], girls: GirlMap): number {
  return Math.round(sumDist(ids, girls) * 4 + 10)
}

export function estMinLabel(ids: string[], girls: GirlMap): string {
  return ids.length ? estMinNum(ids, girls) + '分' : '-'
}

export function calcReturnTime(departTimeStr: string, ids: string[], girls: GirlMap): string {
  const est = estMinNum(ids, girls)
  let h: number, m: number
  if (departTimeStr === '今すぐ') {
    const now = new Date()
    h = now.getHours()
    m = now.getMinutes()
  } else {
    ;[h, m] = departTimeStr.split(':').map(Number)
  }
  const tot = h * 60 + m + est
  return (
    String(Math.floor(tot / 60) % 24).padStart(2, '0') + ':' + String(tot % 60).padStart(2, '0')
  )
}

export function makeTripLabel(ids: string[], girls: GirlMap): string {
  const sorted = [...ids].sort((a, b) => (girls[a]?.dist || 0) - (girls[b]?.dist || 0))
  const areas = sorted.map((id) => (girls[id]?.area || '').replace(/（.*）/, ''))
  if (areas.length === 0) return '便'
  if (areas.length === 1) return areas[0]
  if (areas.length === 2) return areas[0] + '・' + areas[1]
  return areas[0] + '・' + areas[1] + ' ほか'
}

export function tripDotColor(t: Trip): string {
  const tot = t.assigned_ids.length
  const dn = t.completed || 0
  if (t.boarded && dn >= tot) return '#c0c0c0'
  if (t.boarded) return '#F5A623'
  if (t.arrived) return '#06c167'
  return '#c0c0c0'
}

export type DropObj = Girl & {
  initial: string
  distLabel: string
  kmShort: string
  dropNo: number
  boardNo: number
  done: boolean
  current: boolean
  pending: boolean
  canMoveUp: boolean
  canMoveDown: boolean
}

// 便の降車順オブジェクトを構築（manual_orderなら保存順、そうでなければ近い順）
export function buildTripObjs(t: Trip, girls: GirlMap): DropObj[] {
  const ids = t.assigned_ids || []
  const list = ids.map((id) => girls[id]).filter(Boolean)
  const objs = t.manual_order ? list : list.slice().sort((a, b) => a.dist - b.dist)
  const total = objs.length
  const done = t.completed || 0
  return objs.map((o, i) => {
    const isDone = i < done
    const isCurr = i === done && t.boarded && done < total
    return {
      ...o,
      initial: o.name[0],
      distLabel: '店から' + o.dist.toFixed(1) + 'km',
      kmShort: o.dist.toFixed(1) + 'km',
      dropNo: i + 1,
      boardNo: total - i,
      done: isDone,
      current: isCurr,
      pending: !isDone && !isCurr,
      canMoveUp: i > done,
      canMoveDown: i >= done && i < total - 1 && !isDone,
    }
  })
}
