import Script from 'next/script';

export default function ParentLayout({ children }) {
  return (
    <>
      <Script 
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`} 
        strategy="beforeInteractive" 
      />
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
        <header style={{ background: 'var(--bg-primary)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', zIndex: 10 }}>
          <h1 style={{ fontSize: '18px', fontWeight: '600' }}>Live Tracking</h1>
          <button className="btn-secondary" style={{ padding: '8px 16px', width: 'auto', fontSize: '14px' }}>Sign out</button>
        </header>
        <main style={{ flex: 1, position: 'relative' }}>
          {children}
        </main>
      </div>
    </>
  );
}
