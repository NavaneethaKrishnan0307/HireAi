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
  MoreVertical,
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
  const getCachedProfile = () => {
    try {
      const cached = localStorage.getItem('candidate_profile_cache');
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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const p = await CandidateAPI.getProfile();
      if (p) {
        setProfile(p);
        localStorage.setItem('candidate_profile_cache', JSON.stringify(p));
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
      const updatePayload = {
        full_name: candidateName.trim(),
        email: candidateEmail.trim().toLowerCase(),
        phone: finalPhone,
        current_title: candidateTitle.trim()
      };

      // Instantly cache in localStorage so refresh never wipes typed inputs
      const currentCache = getCachedProfile() || {};
      localStorage.setItem('candidate_profile_cache', JSON.stringify({ ...currentCache, ...updatePayload }));

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
      
      const res = await CandidateAPI.uploadResume(file);
      const docVal = res?.parsed_info?.document_validation;
      const parsedName = res?.parsed_info?.name;

      if (docVal && !docVal.is_valid) {
        setError(`Authenticity Warning: ${docVal.reason || 'Document does not appear to have standard resume structure.'}`);
      }

      if (parsedName && parsedName !== 'Candidate Profile' && parsedName.toLowerCase() !== (candidateName || '').toLowerCase()) {
        setUploadProgress(`Resume parsed for "${parsedName}"! Click 'Save Details' or view report to verify your profile.`);
      } else {
        setUploadProgress('Resume successfully parsed, validated and saved!');
      }

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
          {hasResume && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/profile" className="choose-btn" style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Edit3 size={13} /> Modify Profile
              </Link>
              <Link to="/report" className="choose-btn" style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#0f172a' }}>
                <Sparkles size={13} /> View Report
              </Link>
            </div>
          )}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span className="badge-processed">{recentStatus}</span>
              <MoreVertical size={18} color="#94a3b8" style={{ cursor: 'pointer' }} />
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
    </div>
  );
}
