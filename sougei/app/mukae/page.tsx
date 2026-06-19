'use client'

import { useRouter } from 'next/navigation'

const font = "'Hanken Grotesk', 'Noto Sans JP', sans-serif"

export default function MukaePage() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#fff',
      fontFamily: font,
      color: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: 110,
    }}>
      {/* Header */}
      <div style={{
        padding: '52px 20px 14px',
        borderBottom: '1px solid #f0f0f0',
        flexShrink: 0,
      }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#8a8a8a', letterSpacing: '.04em' }}>
          CLUB LUMINA
        </p>
        <h1 style={{ margin: '2px 0 0', fontSize: 26, fontWeight: 800, letterSpacing: '-.01em', lineHeight: 1 }}>
          迎え
        </h1>
      </div>

      {/* Empty state */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 32px',
        textAlign: 'center',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: '#f4f4f4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#c0c0c0" strokeWidth="1.8" />
            <path d="M12 7v5l3 3" stroke="#c0c0c0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-.01em' }}>
          迎え機能
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: '#9a9a9a', lineHeight: 1.7, fontWeight: 500 }}>
          準備中です。<br />しばらくお待ちください。
        </p>
      </div>

      <BoyNav active="mukae" />
    </div>
  )
}

function BoyNav({ active }: { active: 'home' | 'mukae' | 'status' | 'manage' }) {
  const router = useRouter()
  return (
    <div
      style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 390,
        background: '#fff', borderTop: '1px solid #efefef',
        padding: '10px 14px 28px',
        display: 'flex', justifyContent: 'space-around',
        zIndex: 40, boxSizing: 'border-box',
      }}
    >
      <NavBtn onClick={() => router.push('/boy')} active={active === 'home'} label="配車">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l1.6-4.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.5L19 13m-14 0h14v4a1 1 0 0 1-1 1h-1.2a1.8 1.8 0 1 1-3.6 0H9.8a1.8 1.8 0 1 1-3.6 0H5a1 1 0 0 1-1-1v-4h1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </NavBtn>
      <NavBtn onClick={() => router.push('/mukae')} active={active === 'mukae'} label="迎え">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </NavBtn>
      <NavBtn onClick={() => router.push('/boy/status')} active={active === 'status'} label="送迎状況">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M9 20 3 17V4l6 3m0 13 6-3m-6 3V7m6 10 6 3V7l-6-3m0 13V4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      </NavBtn>
      <NavBtn onClick={() => router.push('/masters/drivers')} active={active === 'manage'} label="管理">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3 20c0-4 2.7-6 6-6s6 2 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 11h6m-3-3v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </NavBtn>
    </div>
  )
}

function NavBtn({
  onClick, active, label, children,
}: {
  onClick: () => void
  active?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      onClick={onClick}
      role="button"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: active ? '#0a0a0a' : '#b5b5b5' }}
    >
      {children}
      <span style={{ fontSize: 10.5, fontWeight: 700 }}>{label}</span>
    </div>
  )
}
