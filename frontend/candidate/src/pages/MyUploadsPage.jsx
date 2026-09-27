import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CandidateAPI } from '../services/api';
import { FileText, Eye, UploadCloud, CheckCircle2, FileUp, ExternalLink } from 'lucide-react';

export default function MyUploadsPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await CandidateAPI.getProfile();
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const hasResume = Boolean(profile?.resume_filename);
  const filename = profile?.resume_filename || '';
  const skills = profile?.parsed_skills || [];
  const resumeUrl = profile?.resume_url ? `http://localhost:8000${profile.resume_url}` : null;

  const handleViewResume = () => {
    if (resumeUrl) {
      window.open(resumeUrl, '_blank');
    } else {
      alert(`Viewing ${filename}: Document is indexed in database.`);
    }
  };

  if (loading) {
    return (
      <div className="content-area">
        <p style={{ color: '#64748b' }}>Loading uploaded resumes...</p>
      </div>
    );
  }

  return (
    <div className="content-area">
      <h2 className="page-title">My Uploads</h2>
      <p className="page-subtitle">View and inspect your uploaded resume documents and extracted metadata.</p>

      {!hasResume ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
          <UploadCloud size={48} color="#94a3b8" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>No Resumes Uploaded Yet</h3>
          <p style={{ fontSize: '13px', marginBottom: '20px' }}>Upload your resume in PDF or DOCX format to have our system extract your skills and match you with jobs.</p>
          <Link to="/upload" className="choose-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <FileUp size={16} />
            Upload Your Resume Now
          </Link>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                <FileText size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{filename}</h3>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Status: <span style={{ color: '#059669', fontWeight: '600' }}>Processed & Indexed</span></p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge-processed">Processed</span>
              <button 
                type="button"
                onClick={handleViewResume}
                title="View Uploaded Resume"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#ffffff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
              >
                <Eye size={16} />
                <span>View Resume</span>
              </button>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Extracted Skills ({skills.length}):</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {skills.length > 0 ? (
                skills.map(s => (
                  <span key={s} className="skill-tag">{s}</span>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>No specific skills extracted</span>
              )}
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Detected Experience:</span>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{profile?.years_of_experience || 0} Years</p>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Detected Qualification:</span>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{profile?.education || 'Graduate'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
