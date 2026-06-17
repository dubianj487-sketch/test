import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Driver = {
  id: string
  name: string
  capacity: number
  note: string | null
  status: '待機' | '移動中' | '終了' | '承諾待ち'
  created_at: string
}

export type Girl = {
  id: string
  name: string
  area: string | null
  address: string | null
  note: string | null
  created_at: string
}

export type Dispatch = {
  id: string
  driver_id: string | null
  destination: string | null
  urgency: '今すぐ' | '時間指定'
  scheduled_time: string | null
  status: '待機' | '移動中' | '完了' | '承諾待ち'
  estimated_return: string | null
  date: string
  created_at: string
  driver?: Driver
  girls?: Girl[]
}
