'use client';

import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <header className="bg-white dark:bg-[#111] px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
        <h1 className="text-lg font-bold tracking-tight">Admin & Dispatch Center</h1>
        <button onClick={handleSignOut} className="text-sm font-medium text-gray-500 hover:text-black dark:hover:text-white transition-colors">Sign out</button>
      </header>
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
