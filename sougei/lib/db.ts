import { supabase } from './supabase'
import type {
  Girl,
  Driver,
  Trip,
  GirlMap,
  DriverMap,
  RideReqMap,
  DriverStatusMap,
} from './types'

export type Snapshot = {
  girls: GirlMap
  drivers: DriverMap
  girlOrder: string[]
  driverOrder: string[]
  trips: Trip[]
  rideRequests: RideReqMap
  driverStatuses: DriverStatusMap
}

export async function loadSnapshot(): Promise<Snapshot> {
  const [girlsR, driversR, tripsR, rideR, statusR] = await Promise.all([
    supabase.from('girls').select('*').order('sort'),
    supabase.from('drivers').select('*').order('sort'),
    supabase.from('trips').select('*').order('id'),
    supabase.from('ride_requests').select('*'),
    supabase.from('driver_status').select('*'),
  ])

  const girls: GirlMap = {}
  const girlOrder: string[] = []
  ;(girlsR.data || []).forEach((g: Girl) => {
    girls[g.id] = g
    girlOrder.push(g.id)
  })

  const drivers: DriverMap = {}
  const driverOrder: string[] = []
  ;(driversR.data || []).forEach((d: Driver) => {
    drivers[d.key] = d
    driverOrder.push(d.key)
  })

  const rideRequests: RideReqMap = {}
  ;(rideR.data || []).forEach((r: { girl_id: string; status: string }) => {
    rideRequests[r.girl_id] = r.status
  })

  const driverStatuses: DriverStatusMap = {}
  ;(statusR.data || []).forEach((s: { driver_key: string; status: string }) => {
    driverStatuses[s.driver_key] = s.status
  })

  return {
    girls,
    drivers,
    girlOrder,
    driverOrder,
    trips: (tripsR.data || []) as Trip[],
    rideRequests,
    driverStatuses,
  }
}

// ===== ミューテーション =====

export async function setDriverStatus(key: string, status: string) {
  await supabase
    .from('driver_status')
    .upsert({ driver_key: key, status, updated_at: new Date().toISOString() })
}

export async function createTrip(
  assignedIds: string[],
  departTime: string,
  driverKey: string | null,
  lastTrip: boolean,
  arrived: boolean
): Promise<number | null> {
  const { data } = await supabase
    .from('trips')
    .insert({
      assigned_ids: assignedIds,
      depart_time: departTime,
      driver_key: driverKey,
      last_trip: lastTrip,
      boarded: false,
      completed: 0,
      arrived,
      changed: false,
    })
    .select('id')
    .single()
  // 乗車リクエストを承認済みに
  for (const id of assignedIds) {
    await supabase.from('ride_requests').upsert({ girl_id: id, status: 'approved' })
  }
  if (driverKey) {
    await setDriverStatus(driverKey, arrived ? '乗車待機' : '移動中')
  }
  return data?.id ?? null
}

export async function deleteTrip(trip: Trip) {
  await supabase.from('trips').delete().eq('id', trip.id)
  if (trip.driver_key) await setDriverStatus(trip.driver_key, '待機中')
}

export async function setTripAssigned(tripId: number, assignedIds: string[]) {
  await supabase.from('trips').update({ assigned_ids: assignedIds }).eq('id', tripId)
}

export async function assignDriver(tripId: number, driverKey: string) {
  await supabase.from('trips').update({ driver_key: driverKey }).eq('id', tripId)
  await setDriverStatus(driverKey, '乗車待機')
}

export async function unassignDriver(trip: Trip) {
  await supabase.from('trips').update({ driver_key: null }).eq('id', trip.id)
  if (trip.driver_key) await setDriverStatus(trip.driver_key, '待機中')
}

export async function toggleLastTrip(tripId: number, value: boolean) {
  await supabase.from('trips').update({ last_trip: value }).eq('id', tripId)
}

export async function boardTrip(trip: Trip) {
  await supabase.from('trips').update({ boarded: true }).eq('id', trip.id)
  if (trip.driver_key) await setDriverStatus(trip.driver_key, '移動中')
}

export async function markArrived(trip: Trip) {
  await supabase.from('trips').update({ arrived: true }).eq('id', trip.id)
  if (trip.driver_key) await setDriverStatus(trip.driver_key, '乗車待機')
}

export async function setTripChanged(tripId: number, value: boolean) {
  await supabase.from('trips').update({ changed: value }).eq('id', tripId)
}

export async function completeStop(trip: Trip) {
  const total = trip.assigned_ids.length
  const next = Math.min((trip.completed || 0) + 1, total)
  await supabase.from('trips').update({ completed: next }).eq('id', trip.id)
  if (next >= total && trip.driver_key) {
    await setDriverStatus(trip.driver_key, trip.last_trip ? '終了' : '待機中')
  }
}

export async function sendRideRequest(girlId: string) {
  await supabase.from('ride_requests').upsert({ girl_id: girlId, status: 'approved' })
}

export async function saveDrop(girlId: string, address: string) {
  await supabase.from('girls').update({ drop_address: address }).eq('id', girlId)
}
