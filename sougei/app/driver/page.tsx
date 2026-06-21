'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DriverPage() {
  const router = useRouter()
  useEffect(() => {
    const id = localStorage.getItem('lm_driver_id')
    if (!id) { router.replace('/'); return }
    router.replace(`/driver/${id}`)
  }, [router])
  return null
}
