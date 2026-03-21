'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  // Check ongoing session
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        handleUserRoleRouting(session.user);
      } else {
        setCheckingSession(false);
      }
    };
    checkUser();

    // Listen for magic link completion
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        handleUserRoleRouting(session.user);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
        }
      });
      if (error) throw error;
      setMessage('📬 Check your email for a Magic Link or OTP code!');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleUserRoleRouting = async (user) => {
    // Determine user role from our Postgres 'users' table
    let { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // If user doesn't exist in our custom users table yet, create a default 'parent' profile
      await supabase.from('users').insert({ id: user.id, role: 'parent' });
      router.push('/parent');
      return;
    }

    const role = data?.role || 'parent';
    
    if (role === 'admin') router.push('/admin');
    else if (role === 'driver') router.push('/driver');
    else router.push('/parent');
  };

  const bypassLogin = (role) => {
    // Only for DEV testing without setting up email SMTP bounds
    router.push(`/${role}`);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="animate-pulse text-gray-500">Checking session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="glass-card w-full max-w-md mx-auto fade-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome Back</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to track your school bus</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg text-sm mb-6">
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input 
              id="email"
              type="email" 
              placeholder="parent@school.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all placeholder:text-gray-400"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Magic Link / OTP'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-center text-gray-400 font-medium tracking-wider mb-4 uppercase">
            For Demo / Development Only
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={() => bypassLogin('parent')} className="btn-secondary py-2 text-sm">Quick Login: Parent</button>
            <button onClick={() => bypassLogin('driver')} className="btn-secondary py-2 text-sm">Quick Login: Driver</button>
            <button onClick={() => bypassLogin('admin')} className="btn-secondary py-2 text-sm">Quick Login: Admin</button>
          </div>
        </div>
      </div>
    </div>
  );
}
