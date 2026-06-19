'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  {
    label: '配車',
    href: '/boy',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M5 13l1.5-4h11l1.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2" y="13" width="20" height="6" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="7" cy="19" r="1.5" fill={active ? '#0a0a0a' : '#b5b5b5'} />
        <circle cx="17" cy="19" r="1.5" fill={active ? '#0a0a0a' : '#b5b5b5'} />
      </svg>
    ),
    match: (p: string) => p === '/boy',
  },
  {
    label: '迎え',
    href: '/mukae',
    icon: (_active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    match: (p: string) => p === '/mukae',
  },
  {
    label: '管理',
    href: '/masters/drivers',
    icon: (_active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    match: (p: string) => p.startsWith('/masters'),
  },
]

const SHOW_ON = ['/boy', '/mukae']
const SHOW_PREFIX = ['/masters']

export default function TabBar() {
  const pathname = usePathname()
  const show = SHOW_ON.includes(pathname) || SHOW_PREFIX.some(p => pathname.startsWith(p))
  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 200,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid #efefef',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div style={{
        display: 'flex',
        height: 60,
        alignItems: 'center',
        justifyContent: 'space-around',
        maxWidth: 390,
        margin: '0 auto',
        padding: '8px 14px 0',
      }}>
        {TABS.map(tab => {
          const active = tab.match(pathname)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                textDecoration: 'none',
                color: active ? '#0a0a0a' : '#b5b5b5',
                transition: 'color 0.15s',
              }}
            >
              {tab.icon(active)}
              <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500, letterSpacing: '.02em' }}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
