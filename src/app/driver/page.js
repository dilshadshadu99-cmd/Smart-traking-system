'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DriverDashboard() {
  const [tripActive, setTripActive] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);

  // In production, fetch bus_id based on the driver's assignment
  const busId = "bus_101"; 

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    setTripActive(true);
    setError(null);

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const payload = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speed: position.coords.speed || 0,
        };
        setLocation(payload);
        
        // Push exact live location to Supabase DB (Upsert on bus_id)
        // Note: The schema defines bus_id as UNIQUE or we can just insert and let 
        // real-time subscribers grab the latest insert. We will insert for historical tracking,
        // or upsert if we made bus_id unique in bus_locations.
        // Assuming bus_locations is an append-only log or we just upsert the latest block.
        // Wait, the schema from earlier: `bus_locations` has a UUID id and bus_id. So it's an append log if we insert.
        // But for "live tracking," we usually update a single row to avoid massive DB growth, or just insert.
        // I will do an INSERT so admins can see history, and parents listen to the latest.
        const { error: dbError } = await supabase
          .from('bus_locations')
          .insert({
            bus_id: busId,
            latitude: payload.lat,
            longitude: payload.lng,
          });
          
        if (dbError) setError("Failed to sync location: " + dbError.message);
      },
      (err) => {
        setError(`Location access denied. (${err.message})`);
        setTripActive(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    setWatchId(id);
  };

  const stopTracking = () => {
    setTripActive(false);
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    supabase.from('notifications').insert({
      bus_id: busId,
      message: 'Bus has ended its trip natively',
      type: 'info'
    });
  };

  const triggerEmergencyAlert = async () => {
    if (window.confirm("Are you sure you want to trigger an emergency alert?")) {
      const { error } = await supabase.from('notifications').insert({
        bus_id: busId,
        message: '🚨 EMERGENCY ALERT TRIGGERED BY DRIVER',
        type: 'emergency',
      });
      if (error) setError(error.message);
      else alert('Emergency alert pushed immediately.');
    }
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  return (
    <div className="glass-card fade-in">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold mb-1">Bus Focus: {busId}</h2>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${tripActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
            <span className="text-sm font-medium text-gray-500">
              {tripActive ? 'Transmitting Live' : 'Trip Idle'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm mb-6">
          {error}
        </div>
      )}

      <div className="bg-gray-50 dark:bg-[#111] p-5 rounded-2xl mb-8 border border-gray-100 dark:border-gray-800">
         <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
           Current Coordinates
         </h3>
         <div className="flex gap-8 font-mono text-lg">
           <div>
             <div className="text-[10px] text-gray-500 tracking-widest mb-1">LATITUDE</div>
             <div className="font-medium">{location ? location.lat.toFixed(6) : '--.------'}</div>
           </div>
           <div>
             <div className="text-[10px] text-gray-500 tracking-widest mb-1">LONGITUDE</div>
             <div className="font-medium">{location ? location.lng.toFixed(6) : '--.------'}</div>
           </div>
         </div>
      </div>

      <div className="flex flex-col gap-3">
        {!tripActive ? (
          <button onClick={startTracking} className="btn-primary py-4 text-lg">
             Start Trip & Share Location
          </button>
        ) : (
          <button onClick={stopTracking} className="w-full bg-red-50 dark:bg-red-500/10 text-red-600 font-bold py-4 rounded-xl transition-all hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20">
             End Trip
          </button>
        )}

        <button 
           onClick={triggerEmergencyAlert}
           className="w-full bg-transparent border border-red-200 dark:border-red-900 text-red-500 font-bold py-4 rounded-xl transition-all hover:bg-red-50 dark:hover:bg-red-900/20 mt-4"
        >
           🚨 Trigger Emergency
        </button>
      </div>

    </div>
  );
}
