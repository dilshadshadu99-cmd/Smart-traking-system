export default function AdminLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      <header style={{ background: 'var(--bg-primary)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '600' }}>School Admin Portal</h1>
        <button className="btn-secondary" style={{ padding: '8px 16px', width: 'auto', fontSize: '14px' }}>Sign out</button>
      </header>
      <main style={{ flex: 1, padding: '20px' }}>
        {children}
      </main>
    </div>
  );
}
