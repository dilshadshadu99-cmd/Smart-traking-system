'use client';

import Script from 'next/script';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ParentLayout({ children }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <>
      <Script 
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`} 
        strategy="beforeInteractive" 
      />
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden relative">
        <header className="absolute top-0 left-0 right-0 bg-white/80 dark:bg-black/70 backdrop-blur-md px-6 py-4 flex justify-between items-center z-50 shadow-sm border-b border-gray-200/50 dark:border-gray-800/50">
          <h1 className="text-lg font-bold tracking-tight">Live Tracking</h1>
          <button onClick={handleSignOut} className="text-sm font-medium text-gray-500 hover:text-black dark:hover:text-white transition-colors">Sign out</button>
        </header>
        <main className="flex-1 w-full h-full relative">
          {children}
        </main>
      </div>
    </>
  );
}
