'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function ParentDashboard() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [busData, setBusData] = useState(null);
  const [lastUpdatedText, setLastUpdatedText] = useState('Updating...');
  const [isOffline, setIsOffline] = useState(false);

  const busId = "bus_101";

  // Check network status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && !map) {
      const initialMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 0, lng: 0 },
        zoom: 2,
        disableDefaultUI: true, // Premium clean look
        styles: [ 
          // Optional: SnazzyMaps style for a dark premium look or custom color scheme
          { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
          { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
        ]
      });
      setMap(initialMap);

      const initialMarker = new window.google.maps.Marker({
        map: initialMap,
        title: "School Bus",
        icon: {
           url: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png', // Premium bus icon pointer
           scaledSize: new window.google.maps.Size(40, 40)
        }
      });
      setMarker(initialMarker);
    }
  }, [map]);

  // Sync Firebase Data
  useEffect(() => {
    const busRef = ref(database, `buses/${busId}`);
    
    // Load from LocalStorage while waiting to feel instant
    const cachedData = localStorage.getItem(`bus_${busId}_cache`);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      setBusData(parsed);
      updateMapPosition(parsed.lastLocation.lat, parsed.lastLocation.lng);
    }

    const unsubscribe = onValue(busRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setBusData(data);
        localStorage.setItem(`bus_${busId}_cache`, JSON.stringify(data));

        if (data.lastLocation) {
          updateMapPosition(data.lastLocation.lat, data.lastLocation.lng);
        }
      }
    });

    return () => unsubscribe();
  }, [map, marker]);

  // Update map marker
  const updateMapPosition = useCallback((lat, lng) => {
    if (map && marker) {
      const pos = { lat, lng };
      marker.setPosition(pos);
      map.panTo(pos);
      map.setZoom(16);
    }
  }, [map, marker]);

  // Update "Last updated X mins ago" interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (!busData || !busData.updatedAt) return;
      const secondsPast = Math.floor((Date.now() - busData.updatedAt) / 1000);
      
      if (secondsPast < 10) setLastUpdatedText("Just now");
      else if (secondsPast < 60) setLastUpdatedText(`${secondsPast} seconds ago`);
      else setLastUpdatedText(`${Math.floor(secondsPast / 60)} mins ago`);
      
    }, 5000);
    return () => clearInterval(interval);
  }, [busData]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      
      {/* MAP CONTAINER */}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* OVERLAY UI */}
      <div style={{ position: 'absolute', bottom: '40px', left: '0', right: '0', padding: '0 20px', zIndex: 10 }}>
        <div className="glass-card fade-in" style={{ backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Route: Morning Pickup</h2>
            {busData?.status === 'emergency' && (
              <span style={{ backgroundColor: 'var(--error)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>
                EMERGENCY ALERT
              </span>
            )}
            {isOffline && (
              <span style={{ backgroundColor: 'var(--warning)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                OFFLINE MODE
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Status: <span style={{ color: busData?.status === 'in_transit' ? 'var(--success)' : 'var(--text-primary)', fontWeight: '500', textTransform: 'capitalize' }}>
                {busData?.status?.replace('_', ' ') || 'Unknown'}
              </span>
            </div>
            
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: busData?.status === 'in_transit' ? 'var(--success)' : 'var(--text-secondary)' }}></div>
              Updated {lastUpdatedText}
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
