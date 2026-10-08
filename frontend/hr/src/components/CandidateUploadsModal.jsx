import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Award, 
  Users, 
  FolderOpen, 
  Download, 
  Eye, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  ExternalLink,
  Loader2,
  FileCheck,
  Sparkles
} from 'lucide-react';
import { HRAPI } from '../services/api';

export default function CandidateUploadsModal({ candidateId, candidateName, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('resume'); // 'resume' | 'certifications' | 'referrals' | 'all'

  // Inline Preview State
  const [previewingDoc, setPreviewingDoc] = useState(null); // { title, filename, blobUrl, mimeType }
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    loadUploads();
  }, [candidateId]);

  const loadUploads = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await HRAPI.getCandidateUploads(candidateId);
      setData(res);
    } catch (err) {
      console.error('Failed to load candidate uploads:', err);
      setError(err.message || 'Could not load candidate uploads');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewResume = async () => {
    if (!data?.candidate?.resume_filename) {
      alert('Candidate has not uploaded a resume file yet.');
      return;
    }
    setPreviewLoading(true);
    setPreviewingDoc({
      title: `${data.candidate.full_name}'s Resume`,
      filename: data.candidate.resume_filename,
      mimeType: data.candidate.resume_filename.toLowerCase().endsWith('.docx') 
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        : 'application/pdf',
      blobUrl: null
    });

    try {
      const blob = await HRAPI.getCandidateResumeBlob(candidateId);
      const url = URL.createObjectURL(blob);
      setPreviewingDoc(prev => ({ ...prev, blobUrl: url }));
    } catch (err) {
      console.warn('Direct resume stream failed, attempting static url:', err);
      const fallbackUrl = data.candidate.resume_url?.startsWith('http') 
        ? data.candidate.resume_url 
        : `http://localhost:8000/uploads/resumes/${data.candidate.resume_filename}`;
      setPreviewingDoc(prev => ({ ...prev, blobUrl: fallbackUrl }));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreviewDocument = async (doc) => {
    setPreviewLoading(true);
    setPreviewingDoc({
      title: doc.title || doc.file_name,
      filename: doc.file_name,
      mimeType: doc.mime_type || 'application/pdf',
      blobUrl: null
    });

    try {
      const blob = await HRAPI.getCandidateDocumentBlob(candidateId, doc.id);
      const url = URL.createObjectURL(blob);
      setPreviewingDoc(prev => ({ ...prev, blobUrl: url }));
    } catch (err) {
      console.warn('Direct doc stream failed, attempting static url:', err);
      const fallbackUrl = doc.file_url?.startsWith('http') 
        ? doc.file_url 
        : `http://localhost:8000${doc.file_url || ''}`;
      setPreviewingDoc(prev => ({ ...prev, blobUrl: fallbackUrl }));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadFile = async (url, filename) => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'document.pdf';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  const handleClosePreview = () => {
    if (previewingDoc?.blobUrl && previewingDoc.blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewingDoc.blobUrl);
    }
    setPreviewingDoc(null);
  };

  const cand = data?.candidate || {};
  const documents = data?.documents || [];
  const certs = documents.filter(d => d.document_type === 'certification');
  const referrals = documents.filter(d => d.document_type === 'referral');
  const hasResume = Boolean(cand.resume_filename || cand.resume_url);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '820px', width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderOpen size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {cand.full_name || candidateName || 'Candidate'} — Uploads & Documents
                </h3>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#047857', backgroundColor: '#d1fae5', padding: '2px 8px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={12} /> Verified Vault
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                {cand.email || ''} • {cand.current_title || 'Software Professional'} • {cand.years_of_experience || 0} Yrs Exp
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '6px', borderRadius: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#ffffff', padding: '0 24px', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('resume')}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: activeTab === 'resume' ? '3px solid #0284c7' : '3px solid transparent',
              background: 'none',
              fontWeight: activeTab === 'resume' ? '700' : '500',
              color: activeTab === 'resume' ? '#0284c7' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
          >
            <FileText size={16} /> Resume
            <span style={{ fontSize: '10px', background: hasResume ? '#dcfce7' : '#f1f5f9', color: hasResume ? '#166534' : '#64748b', padding: '1px 6px', borderRadius: '9999px', fontWeight: '700' }}>
              {hasResume ? '1 File' : '0'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('certifications')}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: activeTab === 'certifications' ? '3px solid #0284c7' : '3px solid transparent',
              background: 'none',
              fontWeight: activeTab === 'certifications' ? '700' : '500',
              color: activeTab === 'certifications' ? '#0284c7' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
          >
            <Award size={16} /> Certifications
            <span style={{ fontSize: '10px', background: certs.length > 0 ? '#e0e7ff' : '#f1f5f9', color: certs.length > 0 ? '#3730a3' : '#64748b', padding: '1px 6px', borderRadius: '9999px', fontWeight: '700' }}>
              {certs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('referrals')}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: activeTab === 'referrals' ? '3px solid #0284c7' : '3px solid transparent',
              background: 'none',
              fontWeight: activeTab === 'referrals' ? '700' : '500',
              color: activeTab === 'referrals' ? '#0284c7' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
          >
            <Users size={16} /> Referrals & Recommendations
            <span style={{ fontSize: '10px', background: referrals.length > 0 ? '#fef3c7' : '#f1f5f9', color: referrals.length > 0 ? '#92400e' : '#64748b', padding: '1px 6px', borderRadius: '9999px', fontWeight: '700' }}>
              {referrals.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: activeTab === 'all' ? '3px solid #0284c7' : '3px solid transparent',
              background: 'none',
              fontWeight: activeTab === 'all' ? '700' : '500',
              color: activeTab === 'all' ? '#0284c7' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
          >
            <FileCheck size={16} /> All Files ({documents.length + (hasResume ? 1 : 0)})
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#f8fafc' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <Loader2 size={32} className="spin-animate" style={{ margin: '0 auto 12px auto', color: '#0284c7' }} />
              <p style={{ fontSize: '14px', fontWeight: '600' }}>Loading candidate uploads & verified files...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#dc2626', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
              <p style={{ fontWeight: '700' }}>{error}</p>
            </div>
          ) : (
            <>
              {/* TAB 1: RESUME */}
              {activeTab === 'resume' && (
                <div>
                  <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={26} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>
                            {cand.resume_filename || 'Primary Candidate Resume'}
                          </h4>
                          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={13} /> Active & Processed by HireAI Engine
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={handlePreviewResume}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={14} /> Preview Resume
                        </button>
                        {cand.resume_url && (
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(
                              cand.resume_url.startsWith('http') ? cand.resume_url : `http://localhost:8000${cand.resume_url}`,
                              cand.resume_filename || 'resume.pdf'
                            )}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: '#ffffff',
                              color: '#475569',
                              border: '1px solid #cbd5e1',
                              padding: '8px 14px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            <Download size={14} /> Download
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Extracted Profile Highlights */}
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '12px', color: '#475569' }}>
                      <div>
                        <span style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Role / Headline</span>
                        <strong>{cand.current_title || 'Software Professional'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Total Experience</span>
                        <strong>{cand.years_of_experience || 0} Years</strong>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Education Qualification</span>
                        <strong>{cand.education || 'Graduate'}</strong>
                      </div>
                    </div>

                    {/* Skills */}
                    {cand.parsed_skills && cand.parsed_skills.length > 0 && (
                      <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                          Parsed Resume Skills
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {cand.parsed_skills.map((s, idx) => (
                            <span key={idx} style={{ backgroundColor: '#f1f5f9', color: '#1e293b', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: CERTIFICATIONS */}
              {activeTab === 'certifications' && (
                <div>
                  {certs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', background: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                      <Award size={40} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>No Certifications Uploaded Yet</h4>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Candidate has not added verified credentials to their profile.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                      {certs.map(doc => (
                        <div key={doc.id} style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                              <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Award size={20} />
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#047857', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
                                ✓ Verified
                              </span>
                            </div>
                            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0', lineHeight: '1.4' }}>
                              {doc.title}
                            </h4>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>
                              Issuer: <strong>{doc.issuer_or_referee || 'Verified Organization'}</strong>
                            </p>
                            {doc.issue_date && (
                              <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                                Issued: {doc.issue_date}
                              </p>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                            <button
                              type="button"
                              onClick={() => handlePreviewDocument(doc)}
                              style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                backgroundColor: '#f0f9ff',
                                color: '#0284c7',
                                border: '1px solid #bae6fd',
                                padding: '7px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              <Eye size={13} /> Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(
                                doc.file_url?.startsWith('http') ? doc.file_url : `http://localhost:8000${doc.file_url || ''}`,
                                doc.file_name
                              )}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '7px 10px',
                                backgroundColor: '#ffffff',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                              title="Download certificate"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: REFERRALS */}
              {activeTab === 'referrals' && (
                <div>
                  {referrals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', background: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                      <Users size={40} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>No Referrals Uploaded Yet</h4>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Candidate has not added referral or recommendation letters.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                      {referrals.map(doc => (
                        <div key={doc.id} style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                              <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={20} />
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#047857', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
                                ✓ Verified Referral
                              </span>
                            </div>
                            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0', lineHeight: '1.4' }}>
                              {doc.title}
                            </h4>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>
                              Referee / Org: <strong>{doc.issuer_or_referee || 'Corporate Referee'}</strong>
                            </p>
                            {doc.issue_date && (
                              <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                                Date: {doc.issue_date}
                              </p>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                            <button
                              type="button"
                              onClick={() => handlePreviewDocument(doc)}
                              style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                backgroundColor: '#f0f9ff',
                                color: '#0284c7',
                                border: '1px solid #bae6fd',
                                padding: '7px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              <Eye size={13} /> Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(
                                doc.file_url?.startsWith('http') ? doc.file_url : `http://localhost:8000${doc.file_url || ''}`,
                                doc.file_name
                              )}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '7px 10px',
                                backgroundColor: '#ffffff',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                              title="Download referral letter"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ALL FILES */}
              {activeTab === 'all' && (
                <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ padding: '12px 16px' }}>Document Name</th>
                        <th style={{ padding: '12px 16px' }}>Category</th>
                        <th style={{ padding: '12px 16px' }}>Issuer / Authority</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hasResume && (
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={16} color="#0284c7" /> {cand.resume_filename || 'Candidate_Resume.pdf'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                              Resume
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#64748b' }}>Candidate Self-Declaration</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={handlePreviewResume}
                              style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontWeight: '700', marginRight: '10px' }}
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(
                                cand.resume_url?.startsWith('http') ? cand.resume_url : `http://localhost:8000${cand.resume_url || ''}`,
                                cand.resume_filename || 'resume.pdf'
                              )}
                              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontWeight: '600' }}
                            >
                              Download
                            </button>
                          </td>
                        </tr>
                      )}
                      {documents.map(doc => (
                        <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {doc.document_type === 'certification' ? <Award size={16} color="#6366f1" /> : <Users size={16} color="#d97706" />}
                            {doc.title || doc.file_name}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontSize: '11px',
                              background: doc.document_type === 'certification' ? '#eef2ff' : '#fffbeb',
                              color: doc.document_type === 'certification' ? '#4f46e5' : '#b45309',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: '700',
                              textTransform: 'capitalize'
                            }}>
                              {doc.document_type}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#64748b' }}>{doc.issuer_or_referee || 'N/A'}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handlePreviewDocument(doc)}
                              style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontWeight: '700', marginRight: '10px' }}
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(
                                doc.file_url?.startsWith('http') ? doc.file_url : `http://localhost:8000${doc.file_url || ''}`,
                                doc.file_name
                              )}
                              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontWeight: '600' }}
                            >
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!hasResume && documents.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                            No documents or files uploaded by this candidate.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            className="find-candidates-btn"
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Inline Document Preview Modal */}
      {previewingDoc && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 1200, backgroundColor: 'rgba(15, 23, 42, 0.75)' }}
          onClick={handleClosePreview}
        >
          <div 
            className="modal-card" 
            style={{ maxWidth: '880px', width: '95%', maxHeight: '94vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Eye size={20} color="#0284c7" />
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                    {previewingDoc.title}
                  </h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{previewingDoc.filename}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {previewingDoc.blobUrl && (
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(previewingDoc.blobUrl, previewingDoc.filename)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={13} /> Download File
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClosePreview}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '6px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: '520px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {previewLoading ? (
                <div style={{ textAlign: 'center', color: '#ffffff' }}>
                  <Loader2 size={32} className="spin-animate" style={{ margin: '0 auto 12px auto' }} />
                  <p>Streaming verified document file...</p>
                </div>
              ) : previewingDoc.blobUrl ? (
                previewingDoc.mimeType?.startsWith('image/') || previewingDoc.filename.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                  <img 
                    src={previewingDoc.blobUrl} 
                    alt="Preview" 
                    style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }} 
                  />
                ) : (
                  <iframe 
                    src={previewingDoc.blobUrl} 
                    title="Document Preview" 
                    style={{ width: '100%', height: '75vh', border: 'none', backgroundColor: '#ffffff' }}
                  />
                )
              ) : (
                <div style={{ textAlign: 'center', color: '#ffffff' }}>
                  <p>Document preview could not be rendered directly.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
