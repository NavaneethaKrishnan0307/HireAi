import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Lock, Mail, AlertCircle, Eye, EyeOff, KeyRound, CheckCircle2, X } from 'lucide-react';
import { CandidateAPI } from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: verify email, 2: set new password, 3: success
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(null);

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

  const handleVerifyForgotEmail = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your registered email address.');
      return;
    }
    try {
      setForgotLoading(true);
      setForgotError(null);
      await CandidateAPI.forgotPassword(forgotEmail);
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || 'No registered candidate account found with this email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (forgotNewPassword.length < 6) {
      setForgotError('New password must be at least 6 characters.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }
    try {
      setForgotLoading(true);
      setForgotError(null);
      await CandidateAPI.resetPassword(forgotEmail, forgotNewPassword);
      setForgotSuccess('Your password has been successfully reset in Supabase! You can now sign in.');
      setForgotStep(3);
      // Pre-fill login credentials
      setEmail(forgotEmail);
      setPassword(forgotNewPassword);
    } catch (err) {
      setForgotError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setForgotLoading(false);
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
            <div className="input-icon-wrapper" style={{ position: 'relative' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotStep(1);
                  setForgotEmail(email || '');
                  setForgotError(null);
                  setForgotSuccess(null);
                }}
                style={{ background: 'none', border: 'none', color: '#1d68f6', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: 0 }}
              >
                Forgot Password?
              </button>
            </div>
            <div className="input-icon-wrapper" style={{ position: 'relative' }}>
              <Lock size={18} className="input-icon-left" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-input" 
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '40px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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
              onClick={() => { setEmail('sam@example.com'); setPassword('password123'); }}
              style={{ padding: '6px 10px', fontSize: '12px', fontWeight: '600', color: '#1d4ed8', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
            >
              👤 Fill: <strong>Sam</strong> (sam@example.com / password123)
            </button>
            <button
              type="button"
              onClick={() => { setEmail('ram@example.com'); setPassword('password123'); }}
              style={{ padding: '6px 10px', fontSize: '12px', fontWeight: '600', color: '#047857', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
            >
              👤 Fill: <strong>Ram</strong> (ram@example.com / password123)
            </button>
            <button
              type="button"
              onClick={() => { setEmail('joe@example.com'); setPassword('password123'); }}
              style={{ padding: '6px 10px', fontSize: '12px', fontWeight: '600', color: '#475569', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
            >
              👤 Fill: <strong>Joe</strong> (joe@example.com / password123)
            </button>
            <button
              type="button"
              onClick={() => { setEmail('rahul.sharma@email.com'); setPassword('password123'); }}
              style={{ padding: '6px 10px', fontSize: '12px', fontWeight: '600', color: '#475569', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
            >
              👤 Fill: <strong>Rahul Sharma</strong> (rahul.sharma@email.com / password123)
            </button>
          </div>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#1d68f6', fontWeight: '600' }}>Register here</Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            padding: '28px',
            border: '1px solid #e2e8f0',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#1d68f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Reset Password</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Candidate Account Recovery</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {forgotError && (
              <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{forgotError}</span>
              </div>
            )}

            {/* Step 1: Verify Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleVerifyForgotEmail}>
                <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px', lineHeight: '1.5' }}>
                  Enter the email address registered with your Candidate profile. We will verify your account to allow a secure password reset.
                </p>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Registered Email</label>
                  <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                    <Mail size={18} className="input-icon-left" />
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. rahul.sharma@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="choose-btn"
                  style={{ width: '100%', padding: '11px', fontSize: '14px' }}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? 'Verifying Account...' : 'Continue to Reset Password'}
                </button>
              </form>
            )}

            {/* Step 2: Set New Password */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPasswordSubmit}>
                <div style={{ backgroundColor: '#f1f5f9', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: '#475569' }}>
                  Account verified for: <strong>{forgotEmail}</strong>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">New Password</label>
                  <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                    <Lock size={18} className="input-icon-left" />
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="At least 6 characters"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      style={{ paddingRight: '40px' }}
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                      title={showForgotNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showForgotNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '22px' }}>
                  <label className="form-label">Confirm New Password</label>
                  <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                    <Lock size={18} className="input-icon-left" />
                    <input
                      type={showForgotConfirmPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Re-enter new password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      style={{ paddingRight: '40px' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                      title={showForgotConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showForgotConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => { setForgotStep(1); setForgotError(null); }}
                    style={{ flex: 1, padding: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="choose-btn"
                    style={{ flex: 2, padding: '11px', fontSize: '14px' }}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Updating in Supabase...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Success State */}
            {forgotStep === 3 && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto' }}>
                  <CheckCircle2 size={28} />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Password Successfully Updated!</h4>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
                  {forgotSuccess}
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="choose-btn"
                  style={{ width: '100%', padding: '11px', fontSize: '14px' }}
                >
                  Proceed to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
