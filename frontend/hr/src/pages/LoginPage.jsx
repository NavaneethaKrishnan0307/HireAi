import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, Lock, Mail, AlertCircle } from 'lucide-react';
import { HRAPI } from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Clear any existing session when landing on login page
  useEffect(() => {
    HRAPI.logout();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await HRAPI.login(email, password);
      navigate('/job-find');
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Cannot connect to backend. Please ensure the server is running.');
      } else {
        setError(err.message || 'Invalid HR credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '36px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ color: '#10b981', display: 'flex' }}>
            <Users size={28} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>HR Dashboard</h1>
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>Recruiter Portal Sign In</h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Access talent pools, automated rule-based ranking, and job management.</p>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '12px 14px', borderRadius: '8px', marginBottom: '18px', display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', lineHeight: '1.4' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Recruiter Work Email</label>
            <div className="input-icon-wrapper">
              <Mail size={18} className="input-icon-left" />
              <input 
                type="email" 
                className="form-input" 
                placeholder="Enter recruiter email"
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
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="find-candidates-btn" style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '15px' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In as HR'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          Don't have an HR account?{' '}
          <Link to="/register" style={{ color: '#10b981', fontWeight: '700' }}>Create Recruiter Account</Link>
        </div>
      </div>
    </div>
  );
}
