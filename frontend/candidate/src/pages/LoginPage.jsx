import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Lock, Mail, AlertCircle } from 'lucide-react';
import { CandidateAPI } from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Clear any existing session when landing on login page
  useEffect(() => {
    CandidateAPI.logout();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await CandidateAPI.login(email, password);
      navigate('/upload');
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Cannot connect to backend. Please ensure the server is running.');
      } else {
        setError(err.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '36px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ color: '#1d68f6', display: 'flex' }}>
            <FileText size={28} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1a56db' }}>Resume Screener</h1>
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>Candidate Sign In</h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Sign in to upload resumes and view matching job opportunities.</p>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '12px 14px', borderRadius: '8px', marginBottom: '18px', display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', lineHeight: '1.4' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-icon-wrapper">
              <Mail size={18} className="input-icon-left" />
              <input 
                type="email" 
                className="form-input" 
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon-left" />
              <input 
                type="password" 
                className="form-input" 
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="choose-btn" style={{ width: '100%', padding: '12px', fontSize: '15px' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        {/* Quick Demo Sign-in Shortcuts */}
        <div style={{ marginTop: '20px', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', margin: '0 0 8px 0', letterSpacing: '0.05em' }}>
            ⚡ 1-Click Demo Profiles
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              onClick={() => { setEmail('joe@example.com'); setPassword('password123'); }}
              style={{ padding: '6px 10px', fontSize: '12px', fontWeight: '600', color: '#1d4ed8', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
            >
              👤 Fill: <strong>Joe</strong> (joe@example.com / password123)
            </button>
            <button
              type="button"
              onClick={() => { setEmail('rahul.sharma@email.com'); setPassword('password123'); }}
              style={{ padding: '6px 10px', fontSize: '12px', fontWeight: '600', color: '#475569', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
            >
              👤 Fill: <strong>Rahul Sharma</strong> (rahul.sharma@email.com)
            </button>
          </div>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#1d68f6', fontWeight: '600' }}>Register here</Link>
        </div>
      </div>
    </div>
  );
}
