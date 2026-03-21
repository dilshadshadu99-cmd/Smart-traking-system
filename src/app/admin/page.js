'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminDashboard() {
  const [locations, setLocations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [alertType, setAlertType] = useState('info');
  const [alertMsg, setAlertMsg] = useState('');

  // Fetch initial data
  useEffect(() => {
    const fetchLocations = async () => {
      // Subquery to get latest location per bus
      const { data } = await supabase.from('bus_locations').select('*').order('updated_at', { ascending: false }).limit(50);
      // Deduplicate by bus_id logically on client side for simplicity
      if (data) {
         const unique = [];
         const map = new Map();
         for (const item of data) {
           if(!map.has(item.bus_id)){
             map.set(item.bus_id, true);
             unique.push(item);
           }
         }
         setLocations(unique);
      }
    };
    
    const fetchNotifications = async () => {
      const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(10);
      if (data) setNotifications(data);
    };

    fetchLocations();
    fetchNotifications();

    // Realtime Subscriptions
    const locChannel = supabase.channel('admin_locations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bus_locations' }, (payload) => {
         setLocations((prev) => {
           const next = [payload.new, ...prev.filter(b => b.bus_id !== payload.new.bus_id)];
           return next;
         });
      }).subscribe();

    const notifChannel = supabase.channel('admin_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
         setNotifications((prev) => [payload.new, ...prev].slice(0, 10)); // Keep last 10
      }).subscribe();

    return () => {
      supabase.removeChannel(locChannel);
      supabase.removeChannel(notifChannel);
    };
  }, []);

  const handleDispatchAlert = async (e) => {
    e.preventDefault();
    if (!alertMsg) return;
    
    const { error } = await supabase.from('notifications').insert({
      bus_id: null, // Null means broadcast to all
      message: alertMsg,
      type: alertType
    });

    if (error) {
      alert("Failed to send alert: " + error.message);
    } else {
      setAlertMsg('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT COL: ACTIVE FLEET OVERVIEW */}
      <div className="lg:col-span-2 space-y-6">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Active Fleet Monitor</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.length === 0 && (
            <div className="col-span-2 text-gray-500 py-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
              No active buses transmitting locations right now.
            </div>
          )}

          {locations.map((loc) => {
            const isStale = (Date.now() - new Date(loc.updated_at).getTime()) > 300000; // 5 mins
            return (
              <div key={loc.bus_id} className={`p-6 rounded-2xl border transition-all ${
                isStale ? 'bg-gray-50 border-gray-200 dark:bg-zinc-900/50 dark:border-zinc-800' : 'bg-white border-emerald-100 dark:bg-[#111] dark:border-emerald-900/30'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{loc.bus_id}</h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Last ping: {new Date(loc.updated_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wide ${
                    isStale ? 'bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:text-gray-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  }`}>
                    {isStale ? 'Offline' : 'Active'}
                  </span>
                </div>

                <div className="flex gap-4 font-mono text-sm">
                  <div>
                    <div className="text-[10px] text-gray-400 mb-0.5 tracking-wider">LATITUDE</div>
                    <div>{loc.latitude.toFixed(5)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 mb-0.5 tracking-wider">LONGITUDE</div>
                    <div>{loc.longitude.toFixed(5)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COL: ALERT DISPATCHER & LOG */}
      <div className="flex flex-col gap-6">
        <div className="glass-card">
          <h2 className="text-xl font-bold tracking-tight mb-4">Broadcast Alert</h2>
          <form onSubmit={handleDispatchAlert} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Alert Type</label>
              <select 
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111] focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none appearance-none"
              >
                <option value="info">General Info</option>
                <option value="delay">Bus Delay</option>
                <option value="arrival">Destination Arrival</option>
                <option value="emergency">Emergency / Critical</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Message</label>
              <textarea 
                rows="3"
                value={alertMsg}
                onChange={(e) => setAlertMsg(e.target.value)}
                placeholder="Type push message here..."
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111] focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none resize-none"
              />
            </div>
            
            <button type="submit" className={`py-3 px-6 rounded-xl font-semibold transition-all text-white ${
              alertType === 'emergency' ? 'bg-red-500 hover:bg-red-600' : 'bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200'
            }`}>
              {alertType === 'emergency' ? '🚨 Push Emergency Sound' : 'Dispatch Push Alert'}
            </button>
          </form>
        </div>

        <div className="glass-card flex-1">
          <h2 className="text-lg font-bold tracking-tight mb-4">Recent Network Events</h2>
          <div className="flex flex-col gap-3">
            {notifications.length === 0 && <p className="text-sm text-gray-500">No events logged.</p>}
            {notifications.map(notif => (
              <div key={notif.id} className="text-sm pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${
                    notif.type === 'emergency' ? 'bg-red-500 animate-pulse' : 
                    notif.type === 'delay' ? 'bg-amber-500' : 
                    notif.type === 'arrival' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}></span>
                  <span className="font-semibold text-xs tracking-wider uppercase text-gray-500">
                    {notif.type} • {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <p className="text-gray-800 dark:text-gray-200">{notif.message}</p>
                {notif.bus_id && <p className="text-xs text-gray-400 mt-0.5">Focus: {notif.bus_id}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
