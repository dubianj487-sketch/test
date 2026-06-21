'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CastPage() {
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem('lm_role')
    const id = localStorage.getItem('lm_girl_id')
    if (role !== 'cast' || !id) {
      router.replace('/')
    } else {
      router.replace(`/cast/${id}`)
    }
  }, [router])

  return null
}
