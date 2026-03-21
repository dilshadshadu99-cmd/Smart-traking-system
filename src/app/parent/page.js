'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ParentDashboard() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [busData, setBusData] = useState(null);
  const [lastUpdatedText, setLastUpdatedText] = useState('Fetching...');
  const [isOffline, setIsOffline] = useState(false);

  const busId = "bus_101";

  // Check network status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);
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
           url: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
           scaledSize: new window.google.maps.Size(40, 40)
        }
      });
      setMarker(initialMarker);
    }
  }, [map]);

  // Sync Supabase Postgres Changes
  useEffect(() => {
    // Load offline cache for instant UI
    const cachedData = localStorage.getItem(`bus_${busId}_cache`);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      setBusData(parsed);
      updateMapPosition(parsed.latitude, parsed.longitude);
    }

    // Fetch initial latest location from DB
    const fetchLatest = async () => {
      const { data, error } = await supabase
        .from('bus_locations')
        .select('*')
        .eq('bus_id', busId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
        
      if (data) {
        setBusData(data);
        localStorage.setItem(`bus_${busId}_cache`, JSON.stringify(data));
        updateMapPosition(data.latitude, data.longitude);
      }
    };
    fetchLatest();

    // Subscribe to realtime postgres inserts/updates
    const channel = supabase
      .channel('public:bus_locations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bus_locations', filter: `bus_id=eq.${busId}` },
        (payload) => {
          const newData = payload.new;
          setBusData(newData);
          localStorage.setItem(`bus_${busId}_cache`, JSON.stringify(newData));
          updateMapPosition(newData.latitude, newData.longitude);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [map, marker]);

  // Update map marker
  const updateMapPosition = useCallback((lat, lng) => {
    if (map && marker && lat && lng) {
      const pos = { lat, lng };
      marker.setPosition(pos);
      map.panTo(pos);
      map.setZoom(16);
    }
  }, [map, marker]);

  // Update time indicator
  useEffect(() => {
    const interval = setInterval(() => {
      if (!busData || !busData.updated_at) return;
      const secondsPast = Math.floor((Date.now() - new Date(busData.updated_at).getTime()) / 1000);
      
      if (secondsPast < 10) setLastUpdatedText("Just now");
      else if (secondsPast < 60) setLastUpdatedText(`${secondsPast} sec ago`);
      else setLastUpdatedText(`${Math.floor(secondsPast / 60)} min ago`);
    }, 5000);
    return () => clearInterval(interval);
  }, [busData]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full" />

      {/* OVERLAY UI */}
      <div className="absolute bottom-8 left-0 right-0 px-4 md:px-8 z-10">
        <div className="glass-card fade-in max-w-xl mx-auto flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Route: Morning Pickup</h2>
            
            {isOffline && (
              <span className="bg-amber-500 text-white px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                Offline Mode
              </span>
            )}
          </div>

          <div className="flex justify-between items-center mt-2 border-t border-gray-200/20 dark:border-gray-700/50 pt-3">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>Tracking Active</span>
            </div>
            
            <div className="text-xs text-gray-500 font-medium bg-gray-100 dark:bg-zinc-800/80 px-2 py-1 rounded-md">
              Updated {lastUpdatedText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
