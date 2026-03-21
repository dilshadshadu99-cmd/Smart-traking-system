'use client';

import { useState, useEffect } from 'react';
import { auth, database } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState('otp'); // 'otp' or 'magic_link'
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Magic link check on load
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let emailForSignIn = window.localStorage.getItem('emailForSignIn');
      if (!emailForSignIn) {
        emailForSignIn = window.prompt('Please provide your email for confirmation');
      }
      setLoading(true);
      signInWithEmailLink(auth, emailForSignIn, window.location.href)
        .then(async (result) => {
          window.localStorage.removeItem('emailForSignIn');
          await handleUserRoleRouting(result.user);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [router]);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setMessage('OTP sent successfully!');
    } catch (err) {
      setError(err.message);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setError('');
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      await handleUserRoleRouting(result.user);
    } catch (err) {
      setError('Invalid OTP code. Try again.');
      setLoading(false);
    }
  };

  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const actionCodeSettings = {
        url: window.location.origin + '/login',
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setMessage('Magic link sent! Check your inbox.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserRoleRouting = async (user) => {
    // Determine role (mocked or fetching from Realtime DB)
    // To implement DB fetching:
    const userRef = ref(database, `users/${user.uid}`);
    let snapshot = await get(userRef);
    let role = 'parent'; // default role
    
    if (snapshot.exists()) {
      role = snapshot.val().role;
    } else {
      // Create user profile on first login
      await set(userRef, { role: 'parent', phone: user.phoneNumber || null, email: user.email || null, uid: user.uid });
    }

    if (role === 'admin') router.push('/admin');
    else if (role === 'driver') router.push('/driver');
    else router.push('/parent');
  };

  // Skip Login for demo (Bypassing auth)
  const bypassLogin = (role) => {
    router.push(`/${role}`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{ marginBottom: '8px', fontSize: '24px', fontWeight: '600', textAlign: 'center' }}>Welcome Back</h1>
        <p style={{ marginBottom: '24px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '14px' }}>Sign in to track your school bus</p>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button 
            className="btn-secondary" 
            style={{ padding: '8px', fontSize: '14px', flex: 1, backgroundColor: method === 'otp' ? 'var(--bg-secondary)' : 'transparent' }}
            onClick={() => setMethod('otp')}
          >
            Use SMS OTP
          </button>
          <button 
            className="btn-secondary" 
            style={{ padding: '8px', fontSize: '14px', flex: 1, backgroundColor: method === 'magic_link' ? 'var(--bg-secondary)' : 'transparent' }}
            onClick={() => setMethod('magic_link')}
          >
            Use Email
          </button>
        </div>

        {error && <div style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
        {message && <div style={{ color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{message}</div>}

        <div id="recaptcha-container"></div>

        {method === 'otp' ? (
          <div>
            {!confirmationResult ? (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input 
                  type="tel" 
                  placeholder="Phone Number (e.g. +1234567890)" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  required 
                />
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input 
                  type="text" 
                  placeholder="Enter 6-digit OTP" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  required 
                />
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
                <button type="button" onClick={() => setConfirmationResult(null)} style={{ background: 'none', color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                  Change phone number
                </button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleSendMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="email" 
              placeholder="Email address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>FOR DEMO / DEVELOPMENT ONLY</p>
          <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
            <button onClick={() => bypassLogin('parent')} className="btn-secondary" style={{ padding: '8px' }}>Quick Login: Parent</button>
            <button onClick={() => bypassLogin('driver')} className="btn-secondary" style={{ padding: '8px' }}>Quick Login: Driver</button>
            <button onClick={() => bypassLogin('admin')} className="btn-secondary" style={{ padding: '8px' }}>Quick Login: Admin</button>
          </div>
        </div>
      </div>
    </div>
  );
}
