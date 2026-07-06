import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertCircle, Loader } from 'lucide-react';

export default function GoogleSignInButton({ onSuccess, onError }) {
  const [clientId, setClientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    // 1. Fetch Google Client ID from Quarkus Backend
    axios.get('/api/v1/auth/google/config')
      .then(res => {
        if (res.data && res.data.clientId) {
          setClientId(res.data.clientId);
        } else {
          setClientId('1234567890-demo-client-id.apps.googleusercontent.com');
        }
      })
      .catch(() => {
        setClientId('1234567890-demo-client-id.apps.googleusercontent.com');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!clientId || loading) return;

    const initializeGsi = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });

          const btnContainer = document.getElementById('googleSignInBtnContainer');
          if (btnContainer) {
            btnContainer.innerHTML = ''; // Clear previous render
            window.google.accounts.id.renderButton(btnContainer, {
              theme: 'outline',
              size: 'large',
              width: '370',
              text: 'signin_with',
              shape: 'pill',
              logo_alignment: 'center'
            });
          }
        } catch (err) {
          console.error('GSI initialization error:', err);
        }
      }
    };

    // Check if script is loaded, retry if not ready yet
    if (window.google && window.google.accounts) {
      initializeGsi();
    } else {
      const timer = setInterval(() => {
        if (window.google && window.google.accounts) {
          clearInterval(timer);
          initializeGsi();
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [clientId, loading]);

  const handleCredentialResponse = async (response) => {
    setErrorMsg(null);
    if (!response || !response.credential) {
      setErrorMsg('Gagal menerima ID Token dari Google.');
      if (onError) onError('Gagal menerima ID Token dari Google.');
      return;
    }

    try {
      // Send ID token to backend for cryptographic verification & session creation
      const res = await axios.post('/api/v1/auth/google/verify-token', {
        credential: response.credential
      });

      if (res.data && res.data.token) {
        if (res.data.userId && !res.data.id) res.data.id = res.data.userId;
        if (res.data.id && !res.data.userId) res.data.userId = res.data.id;
        sessionStorage.setItem('mtx_token', res.data.token);
        sessionStorage.setItem('mtx_user', JSON.stringify(res.data));
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        if (onSuccess) onSuccess(res.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal memverifikasi akun Google dengan Server.';
      setErrorMsg(msg);
      if (onError) onError(msg);
    }
  };

  const handleOAuthRedirect = () => {
    // Standard OAuth 2.0 Authorization Code flow redirect
    window.location.href = '/api/v1/auth/google/login';
  };

  if (loading) {
    return (
      <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <Loader size={16} className="animate-spin" /> Menyiapkan Google Sign-In...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Official Google Identity Services Container */}
      <div id="googleSignInBtnContainer" style={{ minHeight: '40px', width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '10px' }}></div>

      {errorMsg && (
        <div style={{ color: '#ff4d54', fontSize: '0.8rem', marginTop: '6px', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}

      {/* Fallback Redirect Link if GSI Popup is blocked or in mock dev environment */}
      <button
        type="button"
        onClick={handleOAuthRedirect}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: '0.75rem',
          textDecoration: 'underline',
          cursor: 'pointer',
          marginTop: '4px'
        }}
        title="Gunakan alur redirect OAuth 2.0 standar jika tombol di atas tidak muncul"
      >
        Atau klik di sini untuk masuk dengan Google OAuth Consent Screen
      </button>
    </div>
  );
}
