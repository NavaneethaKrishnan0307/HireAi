import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UploadCloud, 
  FileUp, 
  Search, 
  Database, 
  Star, 
  FileText, 
  ShieldCheck, 
  Eye,
  X,
  Download,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Save,
  Edit3,
  Sparkles
} from 'lucide-react';
import { CandidateAPI } from '../services/api';
import { COUNTRY_CODES, parsePhoneNumber } from '../constants/countryCodes';
import CustomSearchableDropdown from '../components/CustomSearchableDropdown';

export default function UploadResumePage() {
  const getUserProfileKey = () => {
    try {
      const user = JSON.parse(localStorage.getItem('candidate_user') || '{}');
      return user?.id ? `candidate_profile_cache_${user.id}` : 'candidate_profile_cache';
    } catch {
      return 'candidate_profile_cache';
    }
  };

  const getCachedProfile = () => {
    try {
      const cached = localStorage.getItem(getUserProfileKey());
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const cachedData = getCachedProfile();
  const initialPhoneParsed = parsePhoneNumber(cachedData?.phone);

  const [profile, setProfile] = useState(cachedData);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Candidate Details State (Instant LocalStorage Hydration + Auto-fetched & Editable)
  const [candidateName, setCandidateName] = useState(cachedData?.full_name || '');
  const [candidateEmail, setCandidateEmail] = useState(cachedData?.email || '');
  const [selectedCountryCode, setSelectedCountryCode] = useState(initialPhoneParsed.dialCode);
  const [candidatePhoneNum, setCandidatePhoneNum] = useState(initialPhoneParsed.number);
  const [candidatePhone, setCandidatePhone] = useState(cachedData?.phone || '');
  const [candidateTitle, setCandidateTitle] = useState(cachedData?.current_title || '');
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSavedMsg, setDetailsSavedMsg] = useState('');

  // Uploaded Document Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  // Listen for Escape key to dismiss preview modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showPreviewModal) {
        handleClosePreview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPreviewModal, previewBlobUrl]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewBlobUrl && previewBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  const handlePreviewUploadedResume = async () => {
    setShowPreviewModal(true);
    setPreviewError(null);

    if (previewBlobUrl) {
      return;
    }

    try {
      setPreviewLoading(true);
      const blob = await CandidateAPI.getResumeFileBlob();
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
    } catch (err) {
      console.warn('Direct resume blob fetch failed, checking fallback:', err);
      if (profile?.resume_url && profile.resume_url.startsWith('http')) {
        setPreviewBlobUrl(profile.resume_url);
      } else if (profile?.resume_filename) {
        setPreviewBlobUrl(`http://localhost:8000/uploads/resumes/${profile.resume_filename}`);
      } else {
        setPreviewError('Unable to stream document preview. Please verify file upload or try downloading.');
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    setShowPreviewModal(false);
    if (previewBlobUrl && previewBlobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewBlobUrl(null);
    setPreviewError(null);
  };

  const loadProfile = async () => {
    try {
      const p = await CandidateAPI.getProfile();
      if (p) {
        setProfile(p);
        localStorage.setItem(getUserProfileKey(), JSON.stringify(p));
        if (p.full_name) setCandidateName(p.full_name);
        if (p.email) setCandidateEmail(p.email);
        if (p.phone) {
          setCandidatePhone(p.phone);
          const parsed = parsePhoneNumber(p.phone);
          setSelectedCountryCode(parsed.dialCode);
          setCandidatePhoneNum(parsed.number);
        }
        if (p.current_title) setCandidateTitle(p.current_title);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  };

  const countryCodeOptions = COUNTRY_CODES.map((c, idx) => {
    const dial = c.dialCode || c.code;
    return {
      value: dial,
      label: `${dial} ${c.name}`,
      flag: c.flag,
      sublabel: dial
    };
  });

  const handleCountryCodeChange = (val) => {
    const code = typeof val === 'object' ? val.target.value : val;
    setSelectedCountryCode(code);
    const combined = candidatePhoneNum.trim() ? `${code} ${candidatePhoneNum.trim()}` : '';
    setCandidatePhone(combined);
  };

  const handlePhoneNumChange = (e) => {
    const num = e.target.value;
    setCandidatePhoneNum(num);
    const combined = num.trim() ? `${selectedCountryCode} ${num.trim()}` : '';
    setCandidatePhone(combined);
  };

  const handleUpdateDetails = async (e) => {
    e?.preventDefault();
    if (!candidateName.trim() || !candidateEmail.trim() || !candidatePhoneNum.trim() || !candidateTitle.trim()) {
      setError('Compulsory details missing: Full Name, Email, Phone Number, and Job Title are all strictly required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(candidateEmail.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    try {
      setSavingDetails(true);
      setError(null);
      const finalPhone = candidatePhoneNum.trim() ? `${selectedCountryCode} ${candidatePhoneNum.trim()}` : '';
      const currentCache = getCachedProfile() || {};
      const updatePayload = {
        ...currentCache,
        ...profile,
        full_name: candidateName.trim(),
        email: candidateEmail.trim().toLowerCase(),
        phone: finalPhone,
        current_title: candidateTitle.trim()
      };

      // Instantly cache in localStorage so refresh and profile navigation never wipe details
      localStorage.setItem(getUserProfileKey(), JSON.stringify(updatePayload));

      await CandidateAPI.updateProfile(updatePayload);
      setDetailsSavedMsg('Profile details successfully saved and updated in system!');
      setTimeout(() => setDetailsSavedMsg(''), 3500);
      await loadProfile();
    } catch (err) {
      setError(err.message || 'Failed to update candidate details');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    const nameLower = (file.name || '').toLowerCase();
    if (!nameLower.endsWith('.pdf') && !nameLower.endsWith('.docx') && !nameLower.endsWith('.doc')) {
      setError('Please upload a valid PDF, DOC, or DOCX resume document.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setUploadProgress('Uploading and verifying resume document structure with Explainable AI...');
      
      const res = await CandidateAPI.uploadResume(file, candidateTitle);
      const docVal = res?.parsed_info?.document_validation;
      const parsedName = res?.parsed_info?.name;
      const parsedTitle = res?.parsed_info?.current_title;

      // Immediately synchronize and hydrate profile cache
      if (res?.profile) {
        setProfile(res.profile);
        localStorage.setItem(getUserProfileKey(), JSON.stringify(res.profile));
        if (res.profile.full_name) setCandidateName(res.profile.full_name);
        if (res.profile.email) setCandidateEmail(res.profile.email);
        if (res.profile.phone) {
          setCandidatePhone(res.profile.phone);
          const parsed = parsePhoneNumber(res.profile.phone);
          setSelectedCountryCode(parsed.dialCode);
          setCandidatePhoneNum(parsed.number);
        }
        if (res.profile.current_title) {
          setCandidateTitle(res.profile.current_title);
        } else if (parsedTitle && !candidateTitle) {
          setCandidateTitle(parsedTitle);
        }
      }

      if (docVal && !docVal.is_valid) {
        setError(`Authenticity Warning: ${docVal.reason || 'Document does not appear to have standard resume structure.'}`);
      }

      if (parsedName && parsedName !== 'Candidate Profile' && parsedName.toLowerCase() !== (candidateName || '').toLowerCase()) {
        setUploadProgress(`Resume parsed for "${parsedName}"! Click 'Save Details' or view report to verify your profile.`);
      } else {
        setUploadProgress('Resume successfully parsed, validated and synchronized to your Profile!');
      }

      // Invalidate any previously cached preview blob for the new file
      if (previewBlobUrl && previewBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewBlobUrl);
      }
      setPreviewBlobUrl(null);

      await loadProfile();
      setTimeout(() => setUploadProgress(null), 5000);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const hasResume = Boolean(profile?.resume_filename);
  const recentFilename = profile?.resume_filename || '';
  const recentStatus = profile?.resume_status === 'processed' ? 'Processed' : 'Processing';

  return (
    <div className="content-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
        <div>
          <h2 className="page-title" style={{ margin: 0 }}>Upload Your Resume</h2>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
            Upload your resume in PDF or DOCX format and get matched with suitable job opportunities.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link 
            to="/profile" 
            className="choose-btn" 
            style={{ margin: 0, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#2563eb' }}
          >
            <Edit3 size={15} /> Modify Profile
          </Link>
          <Link 
            to="/report" 
            className="choose-btn" 
            style={{ margin: 0, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#0f172a' }}
          >
            <Sparkles size={15} /> View AI Report
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {detailsSavedMsg && (
        <div style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <CheckCircle2 size={16} />
          <span>{detailsSavedMsg}</span>
        </div>
      )}

      {uploadProgress && (
        <div style={{ backgroundColor: '#f0fdf4', color: '#15803d', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <CheckCircle2 size={16} />
          <span>{uploadProgress}</span>
        </div>
      )}

      {/* Candidate Profile Details (Auto-fetched, Editable & Cached) */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="#2563eb" /> Candidate Information (Auto-Fetched & Editable)
          </h3>
          <Link to="/profile" style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Edit3 size={13} /> Edit Full Profile & Skills
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12px' }}>Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={candidateName} 
              onChange={(e) => setCandidateName(e.target.value)} 
              placeholder="Candidate Name" 
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12px' }}>Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              value={candidateEmail} 
              onChange={(e) => setCandidateEmail(e.target.value)} 
              placeholder="candidate@example.com" 
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12px' }}>Phone Number</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ flex: '0 0 145px' }}>
                <CustomSearchableDropdown
                  value={selectedCountryCode}
                  onChange={handleCountryCodeChange}
                  options={countryCodeOptions}
                  placeholder="Code"
                  searchPlaceholder="Search..."
                  dropdownWidth="240px"
                />
              </div>
              <input 
                type="tel" 
                className="form-input" 
                style={{ flex: 1 }}
                value={candidatePhoneNum} 
                onChange={handlePhoneNumChange} 
                placeholder="98765 43210" 
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12px' }}>Target Role / Title</label>
            <input 
              type="text" 
              className="form-input" 
              value={candidateTitle} 
              onChange={(e) => setCandidateTitle(e.target.value)} 
              placeholder="e.g. Cybersecurity Intern" 
            />
          </div>
          <button 
            type="button" 
            className="choose-btn" 
            disabled={savingDetails} 
            onClick={handleUpdateDetails}
            style={{ margin: 0, height: '42px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Save size={16} />
            {savingDetails ? 'Saving...' : 'Save Details'}
          </button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div 
        className={`dropzone-container ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
          onChange={(e) => handleFileSelect(e.target.files[0])}
        />
        <div className="cloud-icon-circle">
          <UploadCloud size={36} />
        </div>
        <p className="dropzone-text">Drag & Drop your resume here</p>
        <span className="dropzone-or">or</span>
        <button 
          type="button" 
          className="choose-btn" 
          disabled={loading}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          {loading ? 'Processing...' : 'Choose File'}
        </button>
        <p className="supported-text">Supported formats: PDF, DOCX, DOC</p>
      </div>

      {/* How it Works Section */}
      <section className="how-it-works-section">
        <h3 className="section-heading">How it Works</h3>
        <div className="steps-flow">
          <div className="step-card">
            <div className="step-icon-bubble bubble-blue">
              <FileUp size={22} />
            </div>
            <h4 className="step-title">1. Upload Resume</h4>
            <p className="step-desc">Upload your resume file</p>
          </div>

          <ArrowRight size={18} className="step-arrow" />

          <div className="step-card">
            <div className="step-icon-bubble bubble-purple">
              <Search size={22} />
            </div>
            <h4 className="step-title">2. Extract Information</h4>
            <p className="step-desc">We extract and parse your data</p>
          </div>

          <ArrowRight size={18} className="step-arrow" />

          <div className="step-card">
            <div className="step-icon-bubble bubble-green">
              <Database size={22} />
            </div>
            <h4 className="step-title">3. Stored Securely</h4>
            <p className="step-desc">Your data is stored in our database</p>
          </div>

          <ArrowRight size={18} className="step-arrow" />

          <div className="step-card">
            <div className="step-icon-bubble bubble-orange">
              <Star size={22} />
            </div>
            <h4 className="step-title">4. Get Matched</h4>
            <p className="step-desc">We match you with relevant jobs</p>
          </div>
        </div>
      </section>

      {/* Recent Uploads Section */}
      <section className="recent-uploads-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 className="section-heading" style={{ margin: 0 }}>Recent Uploads</h3>
        </div>
        {hasResume ? (
          <div className="upload-file-card">
            <div className="file-info-group">
              <FileText size={32} className="file-icon" />
              <div>
                <h4 className="filename-title">{recentFilename}</h4>
                <p className="file-date">Processed & Ready for Matching</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="badge-processed">{recentStatus}</span>
              <button
                type="button"
                onClick={handlePreviewUploadedResume}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  color: '#475569',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                  e.currentTarget.style.color = '#2563eb';
                  e.currentTarget.style.borderColor = '#93c5fd';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.color = '#475569';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                title="Preview uploaded resume"
                aria-label="Preview uploaded resume"
              >
                <Eye size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            No resume uploaded yet. Select or drop a file above to parse your skills and get matched.
          </div>
        )}
      </section>

      {/* Safe Data Banner */}
      <div className="safe-banner">
        <ShieldCheck size={28} className="safe-icon" />
        <div>
          <h4 className="safe-title">Your Data is Safe</h4>
          <p className="safe-subtitle">We ensure the security and privacy of your data.</p>
        </div>
      </div>

      {/* Uploaded Document Preview Modal ("just preview") */}
      {showPreviewModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={handleClosePreview}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '920px',
              height: '88vh',
              maxHeight: '850px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 0 0 1px #dbeafe'
                }}>
                  <FileText size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                    {recentFilename || 'Uploaded Resume Document'}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Uploaded Document Preview • Ready for AI Matching
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {previewBlobUrl && (
                  <a
                    href={previewBlobUrl}
                    download={recentFilename || 'resume.pdf'}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: '#ffffff',
                      color: '#2563eb',
                      textDecoration: 'none',
                      border: '1px solid #bfdbfe',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      cursor: 'pointer'
                    }}
                    title="Download uploaded resume file"
                  >
                    <Download size={14} /> Download
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleClosePreview}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  title="Close preview"
                  aria-label="Close preview"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body / Viewer */}
            <div style={{
              padding: '16px',
              overflowY: 'auto',
              flex: 1,
              backgroundColor: '#f1f5f9',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {previewLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', margin: 'auto' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    border: '3px solid #e2e8f0',
                    borderTopColor: '#2563eb',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 16px auto'
                  }} />
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#334155', margin: 0 }}>
                    Loading uploaded document preview...
                  </p>
                </div>
              ) : previewError ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', margin: 'auto' }}>
                  <AlertCircle size={40} color="#f59e0b" style={{ margin: '0 auto 12px auto' }} />
                  <h4 style={{ fontSize: '15px', color: '#334155', margin: '0 0 6px 0' }}>Preview Stream Unavailable</h4>
                  <p style={{ fontSize: '13px', margin: '0 0 16px 0' }}>{previewError}</p>
                  <button
                    type="button"
                    onClick={handlePreviewUploadedResume}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Retry Preview
                  </button>
                </div>
              ) : previewBlobUrl ? (
                recentFilename.toLowerCase().match(/\.(png|jpg|jpeg)$/) ? (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#0f172a',
                    borderRadius: '10px',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={previewBlobUrl}
                      alt="Uploaded Resume"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backgroundColor: '#ffffff',
                    boxShadow: 'inset 0 0 4px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {recentFilename.toLowerCase().endsWith('.docx') && (
                      <div style={{
                        padding: '10px 16px',
                        backgroundColor: '#eff6ff',
                        borderBottom: '1px solid #dbeafe',
                        fontSize: '12px',
                        color: '#1e40af'
                      }}>
                        Word Document (.docx) format detected. If inline viewer does not render, use Download above to view locally.
                      </div>
                    )}
                    <iframe
                      src={previewBlobUrl}
                      title="Uploaded Resume Preview"
                      width="100%"
                      height="100%"
                      style={{ border: 'none', flex: 1 }}
                    />
                  </div>
                )
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', margin: 'auto' }}>
                  <AlertCircle size={40} color="#f59e0b" style={{ margin: '0 auto 12px auto' }} />
                  <h4 style={{ fontSize: '15px', color: '#334155', margin: '0 0 6px 0' }}>Preview Stream Unavailable</h4>
                  <p style={{ fontSize: '13px' }}>The document cannot be rendered inline.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
