'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DriverPage() {
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem('lm_role')
    const id = localStorage.getItem('lm_driver_id')
    if (role !== 'driver' || !id) {
      router.replace('/')
    } else {
      router.replace(`/driver/${id}`)
    }
  }, [router])

  return null
}
