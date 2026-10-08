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
  Phone,
  Award,
  Users,
  FolderOpen,
  Plus,
  Trash2,
  AlertCircle,
  FileCheck,
  Search,
  Check
} from 'lucide-react';

export default function MyUploadsPage() {
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resume'); // 'resume' | 'certifications' | 'referrals' | 'all'
  
  // Document Preview State
  const [previewItem, setPreviewItem] = useState(null); // { type: 'resume'|'document', title, filename, mimeType, details, docId, fallbackUrl }
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewViewMode, setPreviewViewMode] = useState('document'); // 'document' | 'parsed'

  // Upload Document Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('certification');
  const [docTitle, setDocTitle] = useState('');
  const [docIssuer, setDocIssuer] = useState('');
  const [docDate, setDocDate] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

  // Search filter for all docs
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileData, docsData] = await Promise.all([
        CandidateAPI.getProfile().catch(() => null),
        CandidateAPI.getDocuments().catch(() => ({ documents: [] }))
      ]);
      setProfile(profileData);
      setDocuments(docsData?.documents || []);
    } catch (err) {
      console.error('Failed to load candidate uploads:', err);
    } finally {
      setLoading(false);
    }
  };

  const reloadDocuments = async () => {
    try {
      const docsData = await CandidateAPI.getDocuments();
      setDocuments(docsData?.documents || []);
    } catch (err) {
      console.error('Failed to reload documents:', err);
    }
  };

  const hasResume = Boolean(profile?.resume_filename || profile?.resume_url);
  const filename = profile?.resume_filename || 'Uploaded_Resume.pdf';
  const skills = profile?.parsed_skills || [];
  const rawParsed = profile?.parsed_data || {};

  const parsedName = rawParsed?.name || rawParsed?.resume_name || profile?.full_name || 'Candidate';
  const parsedEmail = rawParsed?.email || profile?.email || 'N/A';
  const parsedPhone = rawParsed?.phone || profile?.phone || 'N/A';
  const parsedExp = profile?.years_of_experience ?? rawParsed?.years_of_experience ?? 0;
  const parsedEdu = profile?.education || rawParsed?.education || 'Graduate';
  const parsedTitle = profile?.current_title || rawParsed?.current_title || 'Software Professional';

  // Handle Opening Document Preview
  const handlePreviewResume = async () => {
    setPreviewItem({
      type: 'resume',
      title: 'Primary Candidate Resume',
      filename: filename,
      mimeType: filename.toLowerCase().endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf',
      parsed: rawParsed
    });
    setPreviewViewMode('document');
    setPreviewBlobUrl(null);
    setPreviewLoading(true);

    try {
      const blob = await CandidateAPI.getResumeFileBlob();
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
    } catch (err) {
      console.warn('Direct blob fetch failed, falling back to static path:', err);
      if (profile?.resume_url && profile.resume_url.startsWith('http')) {
        setPreviewBlobUrl(profile.resume_url);
      } else {
        setPreviewBlobUrl(`http://localhost:8000/uploads/resumes/${filename}`);
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreviewDocument = async (doc) => {
    setPreviewItem({
      type: 'document',
      docId: doc.id,
      title: doc.title,
      filename: doc.file_name,
      mimeType: doc.mime_type || 'application/pdf',
      docRecord: doc
    });
    setPreviewViewMode('document');
    setPreviewBlobUrl(null);
    setPreviewLoading(true);

    try {
      const blob = await CandidateAPI.getDocumentFileBlob(doc.id);
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
    } catch (err) {
      console.warn('Direct doc blob fetch failed, falling back to static url:', err);
      const fallback = doc.file_url?.startsWith('http') ? doc.file_url : `http://localhost:8000${doc.file_url}`;
      setPreviewBlobUrl(fallback);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewBlobUrl && previewBlobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewBlobUrl(null);
    setPreviewItem(null);
  };

  // Handle Document Upload
  const handleOpenUploadModal = (category = 'certification') => {
    setUploadCategory(category);
    setDocTitle('');
    setDocIssuer('');
    setDocDate('');
    setSelectedFile(null);
    setUploadError('');
    setShowUploadModal(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file to upload (PDF, PNG, JPG, or DOCX).');
      return;
    }
    if (!docTitle.trim()) {
      setUploadError('Please provide a descriptive title for this document.');
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      await CandidateAPI.uploadDocument({
        file: selectedFile,
        document_type: uploadCategory,
        title: docTitle.trim(),
        issuer_or_referee: docIssuer.trim(),
        issue_date: docDate.trim()
      });
      setUploadSuccessMsg('Document successfully uploaded and saved to your candidate folder!');
      setShowUploadModal(false);
      await reloadDocuments();
      setTimeout(() => setUploadSuccessMsg(''), 4000);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  // Handle Document Deletion
  const handleDeleteDocument = async (docId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }
    try {
      await CandidateAPI.deleteDocument(docId);
      await reloadDocuments();
    } catch (err) {
      alert(err.message || 'Failed to delete document.');
    }
  };

  // Filtered documents by category
  const certDocs = documents.filter(d => d.document_type === 'certification');
  const referralDocs = documents.filter(d => d.document_type === 'referral');
  const allDocs = documents.filter(d => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (d.title || '').toLowerCase().includes(q) ||
      (d.issuer_or_referee || '').toLowerCase().includes(q) ||
      (d.file_name || '').toLowerCase().includes(q) ||
      (d.document_type || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="content-area">
        <p style={{ color: '#64748b' }}>Loading candidate documents and folder...</p>
      </div>
    );
  }

  return (
    <div className="content-area">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 className="page-title" style={{ margin: 0 }}>My Uploads</h2>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
            Candidate Document Vault: Upload, organize, and preview your resume, professional certifications, and referee documents.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleOpenUploadModal(activeTab === 'referrals' ? 'referral' : 'certification')}
            className="choose-btn"
            style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#10b981', border: 'none', cursor: 'pointer' }}
          >
            <Plus size={16} /> Upload New Document
          </button>
          {hasResume && (
            <Link to="/upload" className="choose-btn" style={{ margin: 0, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FileUp size={15} /> Replace Resume
            </Link>
          )}
        </div>
      </div>

      {uploadSuccessMsg && (
        <div style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600, border: '1px solid #a7f3d0' }}>
          <CheckCircle2 size={18} />
          <span>{uploadSuccessMsg}</span>
        </div>
      )}

      {/* Tabs Navigation Bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '24px',
        backgroundColor: '#ffffff',
        borderRadius: '12px 12px 0 0',
        padding: '6px 12px 0 12px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        gap: '8px',
        overflowX: 'auto'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('resume')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'resume' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'resume' ? '2px solid #2563eb' : '2px solid transparent',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
        >
          <FileText size={16} />
          <span>Resume</span>
          {hasResume && (
            <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '2px 7px', borderRadius: '10px' }}>
              1
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('certifications')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'certifications' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'certifications' ? '2px solid #2563eb' : '2px solid transparent',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
        >
          <Award size={16} />
          <span>Certifications</span>
          <span style={{ fontSize: '11px', background: activeTab === 'certifications' ? '#dbeafe' : '#f1f5f9', color: activeTab === 'certifications' ? '#1e40af' : '#64748b', padding: '2px 7px', borderRadius: '10px' }}>
            {certDocs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('referrals')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'referrals' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'referrals' ? '2px solid #2563eb' : '2px solid transparent',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
        >
          <Users size={16} />
          <span>Referrals & Recommendations</span>
          <span style={{ fontSize: '11px', background: activeTab === 'referrals' ? '#dbeafe' : '#f1f5f9', color: activeTab === 'referrals' ? '#1e40af' : '#64748b', padding: '2px 7px', borderRadius: '10px' }}>
            {referralDocs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'all' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'all' ? '2px solid #2563eb' : '2px solid transparent',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
        >
          <FolderOpen size={16} />
          <span>All Documents Vault</span>
          <span style={{ fontSize: '11px', background: activeTab === 'all' ? '#dbeafe' : '#f1f5f9', color: activeTab === 'all' ? '#1e40af' : '#64748b', padding: '2px 7px', borderRadius: '10px' }}>
            {(hasResume ? 1 : 0) + documents.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RESUME */}
      {/* ========================================================================= */}
      {activeTab === 'resume' && (
        <div>
          {!hasResume ? (
            <div className="card" style={{ textAlign: 'center', padding: '56px 24px', color: '#64748b' }}>
              <UploadCloud size={52} color="#94a3b8" style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>No Resume Uploaded Yet</h3>
              <p style={{ fontSize: '14px', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
                Upload your resume in PDF or DOCX format to verify your identity, calculate your ATS match rating, and unlock 1-click job applications.
              </p>
              <Link to="/upload" className="choose-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', padding: '12px 28px' }}>
                <FileUp size={17} />
                Upload Your Resume Now
              </Link>
            </div>
          ) : (
            <div className="card" style={{ marginBottom: '24px', padding: '26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0, border: '1px solid #bfdbfe' }}>
                    <FileText size={30} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>{filename}</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Candidate: <strong>{parsedName}</strong></span>
                      <span>•</span>
                      <span style={{ color: '#059669', fontWeight: '600' }}>✓ Processed & Cloud Verified</span>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button 
                    type="button"
                    onClick={handlePreviewResume}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Eye size={16} />
                    <span>Preview Resume</span>
                  </button>

                  <a
                    href="http://localhost:8000/api/candidate/resume/file"
                    target="_blank"
                    rel="noreferrer"
                    download={filename}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#f8fafc',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      textDecoration: 'none'
                    }}
                  >
                    <Download size={15} />
                    <span>Download</span>
                  </a>
                </div>
              </div>

              {/* Extracted Details Grid */}
              <div style={{ marginTop: '22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={14} /> Extracted Name
                  </span>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '6px 0 0 0' }}>{parsedName}</p>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Briefcase size={14} /> Current Designation
                  </span>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '6px 0 0 0' }}>{parsedTitle}</p>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={14} /> Work Experience
                  </span>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '6px 0 0 0' }}>{parsedExp} Years</p>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <GraduationCap size={14} /> Education
                  </span>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '6px 0 0 0' }}>{parsedEdu}</p>
                </div>
              </div>

              <div style={{ marginTop: '22px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '10px' }}>
                  Extracted Technical Skills ({skills.length}):
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {skills.length > 0 ? (
                    skills.map(s => (
                      <span key={s} className="skill-tag" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8', padding: '5px 12px', fontSize: '13px' }}>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CERTIFICATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'certifications' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                Professional Certifications ({certDocs.length})
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Add industry certifications (AWS, Cisco, Scrum, Microsoft, etc.) to boost your profile ranking.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenUploadModal('certification')}
              className="choose-btn"
              style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#2563eb' }}
            >
              <Plus size={15} /> Upload Certification
            </button>
          </div>

          {certDocs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
              <Award size={46} color="#cbd5e1" style={{ margin: '0 auto 14px auto' }} />
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>No Certifications Added</h4>
              <p style={{ fontSize: '13px', maxWidth: '440px', margin: '0 auto 20px auto' }}>
                Showcase your technical badges, cloud certificates, and courses. Upload them in PDF or image format.
              </p>
              <button
                type="button"
                onClick={() => handleOpenUploadModal('certification')}
                className="view-all-outline-btn"
                style={{ margin: '0 auto' }}
              >
                + Add Your First Certificate
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {certDocs.map(doc => (
                <div key={doc.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #a7f3d0' }}>
                          <Award size={22} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{doc.title}</h4>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {doc.issuer_or_referee ? `Issued by ${doc.issuer_or_referee}` : 'Verified Credential'}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#475569' }}>
                        {doc.mime_type?.includes('pdf') ? 'PDF' : doc.mime_type?.includes('image') ? 'IMAGE' : 'DOC'}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px', margin: '12px 0' }}>
                      <span><strong>File:</strong> {doc.file_name} ({doc.file_size || 'Document'})</span>
                      {doc.issue_date && <span><strong>Date:</strong> {doc.issue_date}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handlePreviewDocument(doc)}
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      <Eye size={14} /> Preview
                    </button>
                    <a
                      href={`http://localhost:8000/api/candidate/documents/${doc.id}/file`}
                      download={doc.file_name}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f8fafc',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        textDecoration: 'none'
                      }}
                      title="Download Certificate"
                    >
                      <Download size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      title="Delete Certificate"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REFERRALS */}
      {/* ========================================================================= */}
      {activeTab === 'referrals' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                Referrals & Recommendations ({referralDocs.length})
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Letters of recommendation, referee endorsements, and managerial references.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenUploadModal('referral')}
              className="choose-btn"
              style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#2563eb' }}
            >
              <Plus size={15} /> Upload Referral Letter
            </button>
          </div>

          {referralDocs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
              <Users size={46} color="#cbd5e1" style={{ margin: '0 auto 14px auto' }} />
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>No Referrals Uploaded</h4>
              <p style={{ fontSize: '13px', maxWidth: '440px', margin: '0 auto 20px auto' }}>
                Upload written recommendation letters or performance appraisals from past team leads or managers.
              </p>
              <button
                type="button"
                onClick={() => handleOpenUploadModal('referral')}
                className="view-all-outline-btn"
                style={{ margin: '0 auto' }}
              >
                + Add Referral Document
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {referralDocs.map(doc => (
                <div key={doc.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fde68a' }}>
                          <Users size={22} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{doc.title}</h4>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {doc.issuer_or_referee ? `Referee: ${doc.issuer_or_referee}` : 'Recommendation'}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#475569' }}>
                        {doc.mime_type?.includes('pdf') ? 'PDF' : doc.mime_type?.includes('image') ? 'IMAGE' : 'DOC'}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px', margin: '12px 0' }}>
                      <span><strong>File:</strong> {doc.file_name} ({doc.file_size || 'Document'})</span>
                      {doc.issue_date && <span><strong>Date:</strong> {doc.issue_date}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handlePreviewDocument(doc)}
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      <Eye size={14} /> Preview
                    </button>
                    <a
                      href={`http://localhost:8000/api/candidate/documents/${doc.id}/file`}
                      download={doc.file_name}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f8fafc',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        textDecoration: 'none'
                      }}
                      title="Download Referral"
                    >
                      <Download size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      title="Delete Referral"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ALL DOCUMENTS VAULT */}
      {/* ========================================================================= */}
      {activeTab === 'all' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search across all files & credentials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', height: '40px', fontSize: '13px' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>

            <button
              type="button"
              onClick={() => handleOpenUploadModal('other')}
              className="choose-btn"
              style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#2563eb' }}
            >
              <Plus size={15} /> Upload Any Document
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Primary Resume Entry */}
            {hasResume && (
              <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderLeft: '4px solid #2563eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{filename}</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Primary Candidate Resume • Processed</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', background: '#dbeafe', color: '#1d4ed8', padding: '3px 8px', borderRadius: '6px' }}>
                    RESUME
                  </span>
                  <button
                    type="button"
                    onClick={handlePreviewResume}
                    style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      padding: '7px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Eye size={13} /> Preview
                  </button>
                </div>
              </div>
            )}

            {/* Other Uploaded Documents */}
            {allDocs.map(doc => (
              <div key={doc.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderLeft: doc.document_type === 'certification' ? '4px solid #10b981' : doc.document_type === 'referral' ? '4px solid #f59e0b' : '4px solid #64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: doc.document_type === 'certification' ? '#ecfdf5' : doc.document_type === 'referral' ? '#fef3c7' : '#f1f5f9',
                    color: doc.document_type === 'certification' ? '#059669' : doc.document_type === 'referral' ? '#d97706' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {doc.document_type === 'certification' ? <Award size={20} /> : doc.document_type === 'referral' ? <Users size={20} /> : <FileCheck size={20} />}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{doc.title}</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {doc.file_name} • {doc.issuer_or_referee ? `${doc.issuer_or_referee} • ` : ''}{doc.file_size || ''}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: doc.document_type === 'certification' ? '#d1fae5' : doc.document_type === 'referral' ? '#fef3c7' : '#f1f5f9',
                    color: doc.document_type === 'certification' ? '#065f46' : doc.document_type === 'referral' ? '#92400e' : '#475569'
                  }}>
                    {doc.document_type}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePreviewDocument(doc)}
                    style={{
                      background: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      padding: '7px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Eye size={13} /> Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDocument(doc.id, doc.title)}
                    style={{
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {!hasResume && allDocs.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <FolderOpen size={40} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
                <p style={{ fontSize: '13px' }}>Your document vault is currently empty.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UNIVERSAL DOCUMENT PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewItem && (
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
            maxWidth: '920px',
            height: '88vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
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
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                    {previewItem.title}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {previewItem.filename} • {previewItem.mimeType || 'Document'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {previewBlobUrl && (
                  <a
                    href={previewBlobUrl}
                    download={previewItem.filename}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: '#f1f5f9',
                      color: '#334155',
                      textDecoration: 'none',
                      border: '1px solid #cbd5e1'
                    }}
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
                    padding: '6px',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* If Resume: Allow switching between Live PDF Viewer and Structured Summary */}
            {previewItem.type === 'resume' && (
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff', padding: '0 24px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewViewMode('document')}
                  style={{
                    padding: '12px 18px',
                    border: 'none',
                    background: 'none',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: previewViewMode === 'document' ? '#2563eb' : '#64748b',
                    borderBottom: previewViewMode === 'document' ? '2px solid #2563eb' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  Live Document View
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewMode('parsed')}
                  style={{
                    padding: '12px 18px',
                    border: 'none',
                    background: 'none',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: previewViewMode === 'parsed' ? '#2563eb' : '#64748b',
                    borderBottom: previewViewMode === 'parsed' ? '2px solid #2563eb' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  Structured AI Extraction
                </button>
              </div>
            )}

            {/* Modal Body / Viewer */}
            <div style={{ padding: '16px', overflowY: 'auto', flex: 1, backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
              {previewLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', margin: 'auto' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>Streaming high-fidelity document...</p>
                </div>
              ) : previewViewMode === 'parsed' && previewItem.parsed ? (
                <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#1e3a8a' }}>
                    {parsedName} — {parsedTitle}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                    <div><strong>Email:</strong> {parsedEmail}</div>
                    <div><strong>Phone:</strong> {parsedPhone}</div>
                    <div><strong>Experience:</strong> {parsedExp} Years</div>
                    <div><strong>Education:</strong> {parsedEdu}</div>
                  </div>
                  <div>
                    <strong>Extracted Skills ({skills.length}):</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                      {skills.map(s => (
                        <span key={s} className="skill-tag" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : previewBlobUrl ? (
                previewItem.mimeType?.includes('image') || previewItem.filename?.toLowerCase().match(/\.(png|jpg|jpeg)$/) ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', borderRadius: '10px', overflow: 'hidden' }}>
                    <img
                      src={previewBlobUrl}
                      alt={previewItem.title}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '100%', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#ffffff', boxShadow: 'inset 0 0 4px rgba(0,0,0,0.05)' }}>
                    <iframe
                      src={previewBlobUrl}
                      title={previewItem.title}
                      width="100%"
                      height="100%"
                      style={{ border: 'none' }}
                    />
                  </div>
                )
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', margin: 'auto' }}>
                  <AlertCircle size={40} color="#f59e0b" style={{ margin: '0 auto 12px auto' }} />
                  <h4 style={{ fontSize: '15px', color: '#334155', margin: '0 0 6px 0' }}>Preview Stream Unavailable</h4>
                  <p style={{ fontSize: '13px' }}>The document cannot be rendered inline. Please use the Download button above to inspect.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UPLOAD DOCUMENT MODAL */}
      {/* ========================================================================= */}
      {showUploadModal && (
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
            maxWidth: '540px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Plus size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                  Upload Candidate Document
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ padding: '24px' }}>
              {uploadError && (
                <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={15} />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Category selector */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                  Document Category
                </label>
                <select
                  className="form-select"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="certification">Certification / Course Credential</option>
                  <option value="referral">Referral Letter / Recommendation</option>
                  <option value="other">Academic Degree / Transcript / Other</option>
                </select>
              </div>

              {/* Title input */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                  Document Title / Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={uploadCategory === 'certification' ? 'e.g. AWS Certified Solutions Architect' : uploadCategory === 'referral' ? 'e.g. Recommendation from Engineering VP' : 'e.g. B.Tech Degree Certificate'}
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              {/* Issuer / Referee */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                  {uploadCategory === 'certification' ? 'Issuing Organization' : uploadCategory === 'referral' ? 'Referee Name & Title' : 'Issuing Authority / University'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={uploadCategory === 'certification' ? 'e.g. Amazon Web Services' : uploadCategory === 'referral' ? 'e.g. Alex Johnson (Lead Architect)' : 'e.g. Anna University'}
                  value={docIssuer}
                  onChange={(e) => setDocIssuer(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Issue Date */}
              <div style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                  Date / Year (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 2024 or May 2024"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* File selector */}
              <div style={{ marginBottom: '22px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                  Select File (PDF, PNG, JPG, DOCX) *
                </label>
                <div style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '10px',
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer'
                }}
                onClick={() => document.getElementById('candidate-file-input').click()}
                >
                  <input
                    id="candidate-file-input"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.docx"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                  <FileUp size={28} color="#2563eb" style={{ margin: '0 auto 8px auto' }} />
                  {selectedFile ? (
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{selectedFile.name}</p>
                      <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>{(selectedFile.size / 1024).toFixed(1)} KB • Ready to upload</span>
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: '#475569' }}>Click or drop document here</p>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Supported formats: PDF, PNG, JPG, DOCX (Max 10MB)</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="view-all-outline-btn"
                  style={{ height: '42px', padding: '0 18px', borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="choose-btn"
                  style={{ margin: 0, height: '42px', padding: '0 24px', backgroundColor: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {uploading ? 'Uploading...' : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Banner */}
      <div className="safe-banner" style={{ marginTop: '30px' }}>
        <ShieldCheck size={28} className="safe-icon" />
        <div>
          <h4 className="safe-title">Candidate Vault Privacy & Security</h4>
          <p className="safe-subtitle">All uploaded resumes, credentials, and referral records are protected and accessible only to you and authorized recruiters.</p>
        </div>
      </div>
    </div>
  );
}
