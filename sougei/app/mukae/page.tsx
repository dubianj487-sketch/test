'use client'

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
      paddingBottom: 80,
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
    </div>
  )
}
