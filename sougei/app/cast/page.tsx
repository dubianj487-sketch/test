'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CastPage() {
  const router = useRouter()
  useEffect(() => {
    const id = localStorage.getItem('lm_girl_id')
    if (!id) { router.replace('/'); return }
    router.replace(`/cast/${id}`)
  }, [router])
  return null
}
