'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, update, set } from 'firebase/database';

export default function DriverDashboard() {
  const [tripActive, setTripActive] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);

  const busId = "bus_101"; // In real scenario, fetched from authenticated user's profile

  // Automatically fetch exact location dynamically via browser API
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setTripActive(true);
    setError(null);

    // Watch location continuously
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const payload = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speed: position.coords.speed || 0,
          timestamp: Date.now()
        };
        setLocation(payload);
        
        // Push exact live location to Firebase Realtime Database
        update(ref(database, `buses/${busId}`), {
          lastLocation: payload,
          status: 'in_transit',
          updatedAt: payload.timestamp
        }).catch(err => setError("Failed to sync location to map"));
      },
      (err) => {
        setError(`Location access denied. Please allow location tracking. (${err.message})`);
        setTripActive(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );
    setWatchId(id);
  };

  const stopTracking = () => {
    setTripActive(false);
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    // Update DB status to idle
    update(ref(database, `buses/${busId}`), {
      status: 'idle',
      updatedAt: Date.now()
    }).catch(err => console.error(err));
  };

  const triggerEmergencyAlert = async () => {
    if (window.confirm("Are you sure you want to trigger an emergency alert?")) {
      await update(ref(database, `buses/${busId}`), {
        status: 'emergency',
        updatedAt: Date.now()
      });
      alert('Emergency alert sent to parents and admins.');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="glass-card fade-in" style={{ backgroundColor: 'var(--bg-primary)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>Bus Focus: {busId}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                height: '10px', width: '10px', borderRadius: '50%', 
                backgroundColor: tripActive ? 'var(--success)' : 'var(--text-secondary)' 
              }}></span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {tripActive ? 'Currently Transmitting live' : 'Trip not started'}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
           <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
             Current Coordinates
           </h3>
           <div style={{ display: 'flex', gap: '16px', fontFamily: 'monospace', fontSize: '16px' }}>
             <div>
               <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>LATITUDE</div>
               <div>{location ? location.lat.toFixed(6) : '--.------'}</div>
             </div>
             <div>
               <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>LONGITUDE</div>
               <div>{location ? location.lng.toFixed(6) : '--.------'}</div>
             </div>
           </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!tripActive ? (
            <button onClick={startTracking} className="btn-primary" style={{ padding: '18px' }}>
               Start Trip & Share Location
            </button>
          ) : (
            <button onClick={stopTracking} className="btn-secondary" style={{ padding: '18px', color: 'var(--error)', borderColor: 'var(--error)' }}>
               End Trip
            </button>
          )}

          <button 
             onClick={triggerEmergencyAlert}
             className="btn-secondary" 
             style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.05)', color: 'var(--error)', border: '1px solid transparent' }}
          >
             🚨 Trigger Emergency Alert
          </button>
        </div>

      </div>
    </div>
  );
}
