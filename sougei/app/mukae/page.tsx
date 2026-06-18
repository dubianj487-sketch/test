'use client'

export default function MukaePage() {
  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5', fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif", color: '#1c1c1e', display: 'flex', flexDirection: 'column', paddingBottom: 56 }}>

      <div style={{ background: '#ffffff', padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.02em', lineHeight: 1 }}>送迎</div>
        <div style={{ fontSize: 12, color: '#8e8e93', fontWeight: 400, marginTop: 2 }}>迎え</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚗</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.02em', marginBottom: 10 }}>迎え機能</div>
        <div style={{ fontSize: 15, color: '#8e8e93', lineHeight: 1.6 }}>
          準備中です。
          <br />
          しばらくお待ちください。
        </div>
      </div>
    </div>
  )
}
