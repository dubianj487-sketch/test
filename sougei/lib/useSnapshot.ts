'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import { loadSnapshot, type Snapshot } from './db'

const EMPTY: Snapshot = {
  girls: {},
  drivers: {},
  girlOrder: [],
  driverOrder: [],
  trips: [],
  rideRequests: {},
  todayRequests: {},
  driverStatuses: {},
}

// 全共有データを読み込み、Supabase Realtime で全テーブルの変更を購読する
export function useSnapshot() {
  const [snap, setSnap] = useState<Snapshot>(EMPTY)
  const [ready, setReady] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reload = useCallback(async () => {
    const s = await loadSnapshot()
    setSnap(s)
    setReady(true)
  }, [])

  // 短時間に複数の変更が来ても1回にまとめて再読込
  const scheduleReload = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(reload, 120)
  }, [reload])

  useEffect(() => {
    reload()
    const channel = supabase
      .channel('sougei-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_requests' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'today_requests' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_status' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'girls' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, scheduleReload)
      .subscribe()
    return () => {
      if (timer.current) clearTimeout(timer.current)
      supabase.removeChannel(channel)
    }
  }, [reload, scheduleReload])

  return { snap, ready, reload }
}
