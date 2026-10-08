import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  Briefcase, 
  Building, 
  MapPin, 
  ChevronRight, 
  Download, 
  FileText, 
  Code, 
  Layers, 
  Cloud, 
  Check, 
  X,
  TrendingUp,
  ShieldCheck,
  User,
  Eye
} from 'lucide-react';
import { CandidateAPI } from '../services/api';
import ReportPreviewModal from '../components/ReportPreviewModal';
import { exportReportToPdf } from '../utils/pdfExport';

  const getUserReportKey = () => {
    try {
      const user = JSON.parse(localStorage.getItem('candidate_user') || '{}');
      return user?.id ? `candidate_resume_report_cache_${user.id}` : 'candidate_resume_report_cache';
    } catch {
      return 'candidate_resume_report_cache';
    }
  };

  const getCachedReport = () => {
    try {
      const cached = localStorage.getItem(getUserReportKey());
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

export default function ResumeAnalyzerPage() {
  const initialReport = getCachedReport();
  const [report, setReport] = useState(initialReport);
  const [loading, setLoading] = useState(!initialReport);
  const [error, setError] = useState(null);
  const [syncingName, setSyncingName] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [downloadingDirect, setDownloadingDirect] = useState(false);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      if (!report) setLoading(true);
      setError(null);
      const data = await CandidateAPI.getResumeReport();
      if (data) {
        setReport(data);
        localStorage.setItem(getUserReportKey(), JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Could not refresh resume report from server:', err);
      // Clean up stale cache so another candidate's old report is never shown
      localStorage.removeItem(getUserReportKey());
      localStorage.removeItem('candidate_resume_report_cache');
      setReport(null);
      setError(err.message || 'Please upload your resume to generate your personalized report.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectDownload = async () => {
    try {
      setDownloadingDirect(true);
      await exportReportToPdf('analyzer-report-content', report?.candidate_name || 'Candidate');
    } catch (err) {
      console.error('Direct download error:', err);
      alert('Failed to generate PDF download: ' + (err.message || 'unknown error'));
    } finally {
      setDownloadingDirect(false);
    }
  };

  const handleExport = () => {
    const reportElem = document.getElementById('analyzer-report-content');
    if (!reportElem) {
      window.print();
      return;
    }

    // Isolate report into a dedicated iframe to export ONLY the report without UI chrome
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    const candidateName = report?.candidate_name || 'Candidate';
    const reportTitle = `Resume_Analyzer_Report_${candidateName.replace(/\s+/g, '_')}`;
    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    // Capture all existing document stylesheets so typography, badges, and colors match exactly
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('\n');

    // Deep clone the report container and strip out interactive navigation & action buttons
    const clone = reportElem.cloneNode(true);
    clone.querySelectorAll('button, .choose-btn, a.choose-btn, .no-print').forEach(el => el.remove());

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>${reportTitle}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 14mm;
            }
            body {
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .export-header {
              border-bottom: 2px solid #2563eb;
              padding-bottom: 12px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .export-header-title {
              font-size: 20px;
              font-weight: 800;
              color: #1e3a8a;
              margin: 0;
            }
            .export-header-sub {
              font-size: 12px;
              color: #64748b;
              margin-top: 4px;
            }
            .export-header-meta {
              font-size: 11px;
              color: #64748b;
              text-align: right;
            }
            .card {
              box-shadow: none !important;
              border: 1px solid #e2e8f0 !important;
              page-break-inside: avoid;
              break-inside: avoid;
              margin-bottom: 16px !important;
            }
            /* Expand line inspection so full document annotations print */
            div[style*="max-height"], div[style*="maxHeight"], div[style*="overflow-y"], div[style*="overflowY"] {
              max-height: none !important;
              overflow: visible !important;
            }
            button, .choose-btn, a.choose-btn {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="export-header">
            <div>
              <div style="font-size: 10px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">
                HireAI Intelligent Hiring Platform • Official Career Audit
              </div>
              <h1 class="export-header-title">Resume Analyzer & ATS Audit Report</h1>
              <div class="export-header-sub">Candidate: <strong>${candidateName}</strong></div>
            </div>
            <div class="export-header-meta">
              <div>Audit Date: <strong>${formattedDate}</strong></div>
              <div>System Status: <strong style="color: #059669;">Verified Authentic</strong></div>
            </div>
          </div>
          <div class="export-content">
            ${clone.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error('Export print error:', e);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 400);
  };

  const handleSyncProfileName = async (newName) => {
    if (!newName) return;
    try {
      setSyncingName(true);
      await CandidateAPI.updateProfile({ full_name: newName });
      const cached = localStorage.getItem('candidate_profile_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          localStorage.setItem('candidate_profile_cache', JSON.stringify({ ...parsed, full_name: newName }));
        } catch {}
      }
      setSyncSuccess(`Profile name successfully updated to '${newName}'!`);
      setTimeout(() => setSyncSuccess(''), 3500);
      await loadReport();
    } catch (err) {
      alert(err.message || 'Failed to update profile name');
    } finally {
      setSyncingName(false);
    }
  };

  if (loading && !report) {
    return (
      <div className="content-area" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Sparkles size={40} color="#2563eb" style={{ animation: 'spin 2s linear infinite', margin: '0 auto 16px auto' }} />
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Generating AI Resume Audit & Report...</h3>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>Evaluating ATS compliance, skill taxonomy, and open platform job compatibility.</p>
      </div>
    );
  }

  if ((error && !report) || (!report && !loading)) {
    return (
      <div className="content-area">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Unable to Generate Audit Report</h3>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '8px 0 16px 0' }}>{error || 'Please upload your resume to generate your personalized report.'}</p>
          <Link to="/upload" className="choose-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Upload Resume Now
          </Link>
        </div>
      </div>
    );
  }

  const atsScore = report.ats_health_score || 75;
  const scoreColor = atsScore >= 80 ? '#10b981' : atsScore >= 60 ? '#f59e0b' : '#ef4444';
  const scoreBg = atsScore >= 80 ? '#ecfdf5' : atsScore >= 60 ? '#fffbeb' : '#fef2f2';

  const skillTax = report.skill_taxonomy || {};
  const strengths = report.strengths || [];
  const weaknesses = report.weaknesses || [];
  const recommendations = report.recommendations || [];
  const jobMatrix = report.job_matrix || [];
  const lineAnalysis = report.line_analysis || [];
  const lineSummary = report.line_metrics_summary || { metric_lines: 0, action_verbs: 0, passive_phrases: 0 };
  const authVerif = report.authenticity_verification || {};

  return (
    <div className="content-area print-area">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>
            <Sparkles size={14} /> Open Source Platform AI Audit & Verification Engine
          </div>
          <h2 className="page-title" style={{ margin: 0 }}>Resume Analyzer & Career Report</h2>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
            In-depth ATS evaluation, document authenticity check, identity verification, and multi-company job fit matrix.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link 
            to="/profile" 
            className="choose-btn" 
            style={{ margin: 0, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb' }}
          >
            <User size={16} /> Modify Profile
          </Link>

          <button 
            type="button"
            onClick={handleDirectDownload}
            disabled={downloadingDirect}
            className="choose-btn" 
            style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#16a34a' }}
            title="Download PDF directly to your device"
          >
            <Download size={16} /> {downloadingDirect ? 'Generating...' : 'Download PDF'}
          </button>

          <button 
            type="button"
            onClick={() => setShowPreview(true)}
            className="choose-btn" 
            style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a' }}
            title="Preview report document and download"
          >
            <Eye size={16} /> Preview & Download
          </button>
        </div>
      </div>

      {syncSuccess && (
        <div style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <CheckCircle2 size={16} />
          <span>{syncSuccess}</span>
        </div>
      )}

      {/* Report Printable Content Container (Isolated from App UI Chrome) */}
      <div id="analyzer-report-content" className="analyzer-report-container">
        {/* Authenticity & Identity Verification Banner */}
      {authVerif && (
        <div style={{ marginBottom: '20px' }}>
          {authVerif.name_mismatch && (
            <div style={{ 
              backgroundColor: '#fffbeb', 
              border: '1px solid #fde68a', 
              borderRadius: '12px', 
              padding: '16px 20px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: '14px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: '280px' }}>
                <AlertTriangle size={22} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#92400e', margin: '0 0 4px 0' }}>
                    Identity Discrepancy Flagged
                  </h4>
                  <p style={{ fontSize: '13px', color: '#b45309', margin: 0, lineHeight: 1.4 }}>
                    Resume document header states candidate name <strong>"{authVerif.resume_name}"</strong>, but your logged-in profile name is <strong>"{authVerif.profile_name}"</strong>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="choose-btn"
                disabled={syncingName}
                onClick={() => handleSyncProfileName(authVerif.resume_name)}
                style={{ margin: 0, padding: '8px 16px', fontSize: '12px', backgroundColor: '#d97706', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckCircle2 size={14} />
                {syncingName ? 'Updating...' : `Sync Profile Name to "${authVerif.resume_name}"`}
              </button>
            </div>
          )}

          {authVerif.is_valid_resume === false && (
            <div style={{ 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '12px', 
              padding: '16px 20px', 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '12px' 
            }}>
              <AlertTriangle size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#991b1b', margin: '0 0 4px 0' }}>
                  Invalid / Non-Resume Document Detected
                </h4>
                <p style={{ fontSize: '13px', color: '#b91c1c', margin: 0, lineHeight: 1.4 }}>
                  The uploaded file lacks standard career sections (skills, work experience, or contact credentials). Automated applicant tracking filters will reject this document structure.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Banner: Score & Candidate Profile */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1e293b, #0f172a)', 
        borderRadius: '16px', 
        padding: '28px', 
        color: '#fff', 
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)'
      }}>
        <div>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: '700' }}>Candidate Audit Profile</span>
          <h3 style={{ fontSize: '24px', fontWeight: '800', marginTop: '4px', marginBottom: '8px' }}>
            {report.candidate_name || 'Candidate'}
            {report.resume_name && report.resume_name !== report.candidate_name && (
              <span style={{ fontSize: '14px', fontWeight: '400', color: '#94a3b8', marginLeft: '10px' }}>
                (Resume: {report.resume_name})
              </span>
            )}
          </h3>
          <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '14px' }}>
            {report.email || ''} {report.phone ? `• ${report.phone}` : ''}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
              🎯 {report.seniority_level || 'Software Developer'}
            </span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
              ⏳ {report.experience_years || 0} Years Experience
            </span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
              🎓 {report.education || 'Graduate'}
            </span>
          </div>
        </div>

        {/* ATS Quality Gauge */}
        <div style={{ 
          backgroundColor: 'rgba(255,255,255,0.05)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '14px', 
          padding: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px' 
        }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            border: `6px solid ${scoreColor}`, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: scoreBg,
            color: scoreColor,
            flexShrink: 0
          }}>
            <span style={{ fontSize: '22px', fontWeight: '900', lineHeight: 1 }}>{atsScore}%</span>
            <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase' }}>ATS Score</span>
          </div>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>
              {atsScore >= 80 ? 'Excellent Match Health' : atsScore >= 60 ? 'Good Standard Profile' : 'Needs Optimization'}
            </h4>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
              {authVerif.is_valid_resume === false 
                ? 'Non-resume document structure detected. Upload a standard resume format.' 
                : 'Deterministic multi-pillar applicant tracking system audit.'}
            </p>
          </div>
        </div>
      </div>

      {/* 5 Core ATS Pillar Methodology Gauges */}
      {report.ats_pillars && (
        <div className="card" style={{ marginBottom: '24px', padding: '22px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#2563eb" /> 5-Pillar ATS Methodology Evaluation
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { key: 'format_parsability', label: '1. Format & Parsability', desc: 'Section headings & contact data', val: report.ats_pillars.format_parsability },
              { key: 'keyword_density', label: '2. Keyword Density', desc: 'Skill taxonomy & stack coverage', val: report.ats_pillars.keyword_density },
              { key: 'action_impact', label: '3. Action & Metrics', desc: 'Power verbs & quantified impact', val: report.ats_pillars.action_impact },
              { key: 'brevity_readability', label: '4. Brevity & Readability', desc: 'Length & layout clarity', val: report.ats_pillars.brevity_readability },
              { key: 'authenticity_integrity', label: '5. Authenticity Integrity', desc: 'Document structure & identity match', val: report.ats_pillars.authenticity_integrity }
            ].map(p => {
              const pScore = p.val || 50;
              const pColor = pScore >= 80 ? '#10b981' : pScore >= 60 ? '#2563eb' : pScore >= 40 ? '#f59e0b' : '#ef4444';
              return (
                <div key={p.key} style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>{p.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: pColor }}>{pScore}%</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
                    <div style={{ height: '100%', width: `${pScore}%`, backgroundColor: pColor, borderRadius: '3px', transition: 'width 0.5s ease-in-out' }} />
                  </div>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Line-by-Line Document Inspector */}
      {lineAnalysis.length > 0 && (
        <div className="card" style={{ marginBottom: '24px', padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#7c3aed" /> Line-by-Line Document Inspection
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Live annotation of every bullet point. Identifies passive phrasing, metrics, and power verbs.
              </p>
            </div>
            {lineSummary && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                  ✓ {lineSummary.metric_lines || 0} Metric Statements
                </span>
                <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                  ⚡ {lineSummary.action_verbs || 0} Power Verbs
                </span>
                {(lineSummary.passive_phrases || 0) > 0 && (
                  <span style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                    ⚠️ {lineSummary.passive_phrases} Passive Phrasings
                  </span>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
            {lineAnalysis.map((line, idx) => {
              if (line.category === 'SECTION_HEADER') {
                return (
                  <div key={idx} style={{ backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', fontWeight: '800', fontSize: '12px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: idx > 0 ? '8px' : '0' }}>
                    § {line.text}
                  </div>
                );
              }

              const badgeBg = line.badge_color === 'green' ? '#ecfdf5' : line.badge_color === 'blue' ? '#eff6ff' : line.badge_color === 'red' ? '#fef2f2' : line.badge_color === 'cyan' ? '#ecfeff' : '#f8fafc';
              const badgeTextColor = line.badge_color === 'green' ? '#047857' : line.badge_color === 'blue' ? '#1d4ed8' : line.badge_color === 'red' ? '#b91c1c' : line.badge_color === 'cyan' ? '#0e7490' : '#64748b';
              const borderColor = line.badge_color === 'green' ? '#a7f3d0' : line.badge_color === 'blue' ? '#bfdbfe' : line.badge_color === 'red' ? '#fecaca' : '#e2e8f0';

              return (
                <div key={idx} style={{ border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '10px 14px', backgroundColor: line.badge_color === 'red' ? '#fffbfb' : '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '4px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#1e293b', fontWeight: '500', lineHeight: 1.4 }}>
                      <span style={{ color: '#94a3b8', fontSize: '11px', marginRight: '6px' }}>L{line.line_number}</span>
                      {line.text}
                    </p>
                    <span style={{ backgroundColor: badgeBg, color: badgeTextColor, border: `1px solid ${borderColor}`, padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {line.badge}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{line.feedback}</span>
                    {line.suggestion && (
                      <span style={{ fontSize: '11px', color: '#b91c1c', backgroundColor: '#fef2f2', padding: '2px 6px', borderRadius: '4px', fontStyle: 'italic' }}>
                        💡 Suggestion: {line.suggestion}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Strengths */}
        <div className="card" style={{ padding: '22px', borderLeft: '4px solid #10b981' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="#10b981" /> Key Competitive Strengths
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {strengths.map((str, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#334155' }}>
                <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{str}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Improvement Areas */}
        <div className="card" style={{ padding: '22px', borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#f59e0b" /> Growth & Improvement Areas
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {weaknesses.map((weak, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#334155' }}>
                <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{weak}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categorized Technical Skill Taxonomy */}
      <div className="card" style={{ marginBottom: '24px', padding: '22px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="#2563eb" /> Extracted Skill Taxonomy ({report.total_skills_count || 0} Skills Verified)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {/* Cybersecurity & InfoSec */}
          {skillTax.cybersecurity_and_networking && skillTax.cybersecurity_and_networking.length > 0 && (
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #fed7aa' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#c2410c', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} color="#ea580c" /> Cybersecurity & Networking
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {skillTax.cybersecurity_and_networking.map(s => (
                  <span key={s} className="skill-tag" style={{ backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5' }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Code size={14} color="#2563eb" /> Programming Languages
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {skillTax.languages && skillTax.languages.length > 0 ? (
                skillTax.languages.map(s => (
                  <span key={s} className="skill-tag" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>{s}</span>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>None detected</span>
              )}
            </div>
          </div>

          {/* Frameworks */}
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} color="#7c3aed" /> Frameworks & Libraries
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {skillTax.frameworks && skillTax.frameworks.length > 0 ? (
                skillTax.frameworks.map(s => (
                  <span key={s} className="skill-tag" style={{ backgroundColor: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>{s}</span>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>None detected</span>
              )}
            </div>
          </div>

          {/* Cloud & Data */}
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cloud size={14} color="#059669" /> Cloud, DevOps & Databases
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {skillTax.databases_and_cloud && skillTax.databases_and_cloud.length > 0 ? (
                skillTax.databases_and_cloud.map(s => (
                  <span key={s} className="skill-tag" style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>{s}</span>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>None detected</span>
              )}
            </div>
          </div>

          {/* AI / Machine Learning */}
          {skillTax.ai_and_data && skillTax.ai_and_data.length > 0 && (
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="#0891b2" /> AI & Data Science
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {skillTax.ai_and_data.map(s => (
                  <span key={s} className="skill-tag" style={{ backgroundColor: '#ecfeff', color: '#0e7490', border: '1px solid #a5f3fc' }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Other Tools */}
          {skillTax.other_tools && skillTax.other_tools.length > 0 && (
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} color="#64748b" /> Additional Tools & Protocols
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {skillTax.other_tools.map(s => (
                  <span key={s} className="skill-tag" style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="card" style={{ marginBottom: '24px', padding: '22px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lightbulb size={18} color="#eab308" /> Actionable Hireability Roadmap
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recommendations.map((rec, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {idx + 1}
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#1e293b' }}>{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Company Job Fit Matrix */}
      <div className="card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
              Open Platform Job Compatibility Matrix
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Deterministic compatibility scores across active positions posted by multiple companies.
            </p>
          </div>
          <Link to="/jobs" style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Browse All Openings <ChevronRight size={16} />
          </Link>
        </div>

        {jobMatrix.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '13px' }}>No active job openings currently found on the platform.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {jobMatrix.map(job => (
              <div key={job.job_id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', backgroundColor: job.is_domain_mismatch ? '#fafafa' : '#fff' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{job.title}</h4>
                    <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', padding: '2px 8px', borderRadius: '8px', fontWeight: '600' }}>
                      {job.domain}
                    </span>
                    {job.is_domain_mismatch && (
                      <span style={{ backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', fontSize: '11px', padding: '2px 8px', borderRadius: '8px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={12} color="#d97706" /> {job.domain_status}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span><Building size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> {job.company}</span>
                    <span><MapPin size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> {job.location}</span>
                  </p>

                  {job.domain_warning && (
                    <p style={{ fontSize: '12px', color: '#b45309', margin: '0 0 8px 0', fontStyle: 'italic' }}>
                      {job.domain_warning}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(job.matched_skills || []).map(s => (
                      <span key={s} style={{ backgroundColor: '#ecfdf5', color: '#059669', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Check size={10} /> {s}
                      </span>
                    ))}
                    {(job.missing_skills || []).map(s => (
                      <span key={s} style={{ backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <X size={10} /> {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: job.match_score >= 80 ? '#10b981' : job.match_score >= 60 ? '#2563eb' : job.match_score >= 35 ? '#f59e0b' : '#ef4444' }}>
                      {job.match_score}%
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>
                      {job.is_domain_mismatch ? 'Incompatible' : 'Match Rating'}
                    </div>
                  </div>

                  <Link 
                    to="/jobs" 
                    className="choose-btn" 
                    style={{ margin: 0, padding: '8px 16px', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    Apply <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    <ReportPreviewModal
      isOpen={showPreview}
      onClose={() => setShowPreview(false)}
      report={report}
      candidateName={report?.candidate_name}
    />
  </div>
);
}
