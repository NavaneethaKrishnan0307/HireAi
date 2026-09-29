import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CandidateAPI } from '../services/api';
import { 
  FileText, 
  Eye, 
  UploadCloud, 
  CheckCircle2, 
  FileUp, 
  ExternalLink, 
  X, 
  Download, 
  Sparkles, 
  ShieldCheck, 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  User, 
  Mail, 
  Phone 
} from 'lucide-react';

export default function MyUploadsPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTab, setPreviewTab] = useState('parsed'); // 'parsed' or 'frame'

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

  const hasResume = Boolean(profile?.resume_filename || profile?.resume_url);
  const filename = profile?.resume_filename || 'Uploaded_Resume.pdf';
  const skills = profile?.parsed_skills || [];
  const rawParsed = profile?.parsed_data || {};
  const resumeUrl = profile?.resume_url ? (profile.resume_url.startsWith('http') ? profile.resume_url : `http://localhost:8000${profile.resume_url}`) : null;

  const parsedName = rawParsed?.name || rawParsed?.resume_name || profile?.full_name || 'Candidate';
  const parsedEmail = rawParsed?.email || profile?.email || 'N/A';
  const parsedPhone = rawParsed?.phone || profile?.phone || 'N/A';
  const parsedExp = profile?.years_of_experience ?? rawParsed?.years_of_experience ?? 0;
  const parsedEdu = profile?.education || rawParsed?.education || 'Graduate';
  const parsedTitle = profile?.current_title || rawParsed?.current_title || 'Software Professional';
  const docValidation = rawParsed?.document_validation || {};

  const handleOpenPreview = () => {
    setShowPreviewModal(true);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="page-title" style={{ margin: 0 }}>My Uploads</h2>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
            View, inspect, and preview your uploaded resume documents and extracted FOAI credentials.
          </p>
        </div>
        {hasResume && (
          <Link to="/upload" className="choose-btn" style={{ margin: 0, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <FileUp size={15} /> Upload Replacement Resume
          </Link>
        )}
      </div>

      {!hasResume ? (
        <div className="card" style={{ textAlign: 'center', padding: '56px 24px', color: '#64748b' }}>
          <UploadCloud size={52} color="#94a3b8" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>No Resumes Uploaded Yet</h3>
          <p style={{ fontSize: '14px', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
            Upload your resume in PDF or DOCX format to verify your identity, calculate your ATS match rating, and unlock 1-click job applications.
          </p>
          <Link to="/upload" className="choose-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', padding: '12px 28px' }}>
            <FileUp size={17} />
            Upload Your Resume Now
          </Link>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '18px', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0, border: '1px solid #bfdbfe' }}>
                <FileText size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>{filename}</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Owner: <strong>{parsedName}</strong></span>
                  <span>•</span>
                  <span style={{ color: '#059669', fontWeight: '600' }}>✓ Processed & Cloud Verified</span>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                type="button"
                onClick={handleOpenPreview}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                }}
              >
                <Eye size={16} />
                <span>Preview Document</span>
              </button>

              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#f8fafc',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                >
                  <ExternalLink size={15} />
                  <span>Open URL</span>
                </a>
              )}
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={13} /> Extracted Name
              </span>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '4px 0 0 0' }}>{parsedName}</p>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Briefcase size={13} /> Current Designation
              </span>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '4px 0 0 0' }}>{parsedTitle}</p>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} /> Work Experience
              </span>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '4px 0 0 0' }}>{parsedExp} Years</p>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <GraduationCap size={13} /> Education
              </span>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '4px 0 0 0' }}>{parsedEdu}</p>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
              Extracted Technical Skills ({skills.length}):
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {skills.length > 0 ? (
                skills.map(s => (
                  <span key={s} className="skill-tag" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }}>
                    ✓ {s}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>No specific skills extracted</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Document Preview Modal */}
      {showPreviewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '860px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={22} color="#2563eb" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                    Document Preview: {filename}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                    ✓ Authenticated Document • Candidate: {parsedName}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tab Switcher */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff', padding: '0 24px' }}>
              <button
                type="button"
                onClick={() => setPreviewTab('parsed')}
                style={{
                  padding: '12px 18px',
                  border: 'none',
                  background: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: previewTab === 'parsed' ? '#2563eb' : '#64748b',
                  borderBottom: previewTab === 'parsed' ? '2px solid #2563eb' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Structured AI Content Preview
              </button>
              {resumeUrl && (
                <button
                  type="button"
                  onClick={() => setPreviewTab('frame')}
                  style={{
                    padding: '12px 18px',
                    border: 'none',
                    background: 'none',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: previewTab === 'frame' ? '#2563eb' : '#64748b',
                    borderBottom: previewTab === 'frame' ? '2px solid #2563eb' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  Direct Document View
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {previewTab === 'frame' && resumeUrl ? (
                <div style={{ width: '100%', height: '520px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <iframe 
                    src={resumeUrl} 
                    title="Resume Document Viewer" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 'none' }}
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Candidate Identity Header */}
                  <div style={{ background: 'linear-gradient(135deg, #eff6ff, #f8fafc)', padding: '18px 20px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: '#1e3a8a' }}>
                          {parsedName}
                        </h3>
                        <p style={{ margin: 0, fontSize: '13px', color: '#3b82f6', fontWeight: '600' }}>
                          {parsedTitle}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '14px', fontSize: '13px', color: '#475569', flexWrap: 'wrap' }}>
                        <span><Mail size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> {parsedEmail}</span>
                        <span><Phone size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> {parsedPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Experience Level</span>
                      <h4 style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#0f172a' }}>{parsedExp} Years</h4>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Education / Credential</span>
                      <h4 style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#0f172a' }}>{parsedEdu}</h4>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Identified Skill Count</span>
                      <h4 style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#2563eb' }}>{skills.length} Skills</h4>
                    </div>
                  </div>

                  {/* Verified Skills */}
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                      Verified Technical Competencies:
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {skills.map(s => (
                        <span key={s} className="skill-tag" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534', fontWeight: '600' }}>
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Document Text Snippet Preview */}
                  {rawParsed?.raw_text && (
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                        Extracted Document Text Content:
                      </h4>
                      <div style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '16px',
                        fontSize: '13px',
                        color: '#334155',
                        lineHeight: 1.6,
                        maxHeight: '220px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace'
                      }}>
                        {rawParsed.raw_text}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <Link to="/report" style={{ fontSize: '13px', color: '#2563eb', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={14} /> View Complete AI Career Audit
              </Link>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="choose-btn"
                  style={{ margin: 0, padding: '8px 20px', backgroundColor: '#475569' }}
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
