import React, { useState, useRef, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { CandidateAPI } from '../services/api';

export default function UploadResumePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const p = await CandidateAPI.getProfile();
      setProfile(p);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      setError('Please upload a valid PDF or DOCX resume document.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setUploadProgress('Uploading and parsing resume with Explainable AI...');
      
      const res = await CandidateAPI.uploadResume(file);
      setUploadProgress('Resume successfully parsed and saved!');
      await loadProfile();
      setTimeout(() => setUploadProgress(null), 4000);
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
      <h2 className="page-title">Upload Your Resume</h2>
      <p className="page-subtitle">
        Upload your resume in PDF or DOCX format and get matched with suitable job opportunities.
      </p>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {uploadProgress && (
        <div style={{ backgroundColor: '#f0fdf4', color: '#15803d', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <CheckCircle2 size={16} />
          <span>{uploadProgress}</span>
        </div>
      )}

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
          accept=".pdf,.docx"
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
        <p className="supported-text">Supported formats: PDF, DOCX</p>
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
        <h3 className="section-heading">Recent Uploads</h3>
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
