'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function AdminDashboard() {
  const [buses, setBuses] = useState({});
  const [alertTitle, setAlertTitle] = useState('');
  const [alertBody, setAlertBody] = useState('');

  // Fetch all buses globally
  useEffect(() => {
    const busesRef = ref(database, 'buses');
    const unsubscribe = onValue(busesRef, (snapshot) => {
      if (snapshot.exists()) {
        setBuses(snapshot.val());
      } else {
        setBuses({});
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSendAlert = async (e) => {
    e.preventDefault();
    if (!alertTitle || !alertBody) return;
    
    // Using a mock API endpoint. In a real application, you would create an 
    // API Route in Next.js (e.g. /api/send-alert) that triggers Firebase Admin SDK.
    // Given the serverless nature of Vercel, this is the proper backend approach.
    try {
      alert(`Broadcasting alert to parents globally!\n\n${alertTitle}: ${alertBody}`);
      setAlertTitle('');
      setAlertBody('');
    } catch (err) {
      alert("Failed to send alert.");
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'revert', gap: '24px' }}>
      
      {/* GLOBAL FLEET OVERVIEW */}
      <div className="glass-card" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Active Fleet Overview</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {Object.entries(buses).length === 0 && (
            <p style={{ color: 'var(--text-secondary)' }}>No buses are actively being tracked.</p>
          )}

          {Object.entries(buses).map(([id, data]) => {
            const isEmergency = data.status === 'emergency';
            const isActive = data.status === 'in_transit';

            return (
              <div key={id} style={{ 
                border: '1px solid var(--border)', 
                borderRadius: '12px', 
                padding: '16px',
                backgroundColor: isEmergency ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-primary)',
                borderColor: isEmergency ? 'var(--error)' : 'var(--border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{id.toUpperCase()}</h3>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    backgroundColor: isEmergency ? 'var(--error)' : (isActive ? 'var(--success)' : 'var(--border)'),
                    color: isEmergency || isActive ? 'white' : 'var(--text-primary)',
                  }}>
                    {data.status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>

                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {data.lastLocation ? (
                    <>
                      <div>Lat: {data.lastLocation.lat.toFixed(4)}</div>
                      <div>Lng: {data.lastLocation.lng.toFixed(4)}</div>
                      <div style={{ marginTop: '8px', fontSize: '12px' }}>
                        Updated: {new Date(data.updatedAt).toLocaleTimeString()}
                      </div>
                    </>
                  ) : (
                    <p>No location data available</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PUSH NOTIFICATIONS / ALERTS */}
      <div className="glass-card fade-in" style={{ backgroundColor: 'var(--bg-primary)', marginTop: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Global Alert System</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
          Send a push notification to all parent devices. For web applications, users must have accepted notification permissions.
        </p>
        
        <form onSubmit={handleSendAlert} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Alert Title</label>
            <input 
              type="text" 
              placeholder="e.g. Weather Delay" 
              value={alertTitle} 
              onChange={(e) => setAlertTitle(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Message Body</label>
            <textarea 
              rows="4" 
              placeholder="Provide details about the delay or emergency..." 
              value={alertBody} 
              onChange={(e) => setAlertBody(e.target.value)} 
              required 
              style={{ padding: '12px 16px', width: '100%', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'none' }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
            Broadcast Alert
          </button>
        </form>
      </div>

    </div>
  );
}
