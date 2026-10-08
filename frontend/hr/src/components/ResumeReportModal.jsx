import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  Building, 
  MapPin, 
  Layers, 
  Code, 
  Cloud, 
  Download, 
  Check, 
  FileText, 
  User,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { HRAPI } from '../services/api';

export default function ResumeReportModal({ candidateId, candidateName, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (candidateId) {
      loadReport();
    }
  }, [candidateId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await HRAPI.getCandidateReport(candidateId);
      setReport(data);
    } catch (err) {
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const reportElem = document.getElementById('hr-analyzer-report-printable');
    if (!reportElem) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    const name = report?.candidate_name || candidateName || 'Candidate';
    const reportTitle = `Resume_Analyzer_Report_${name.replace(/\s+/g, '_')}`;
    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('\n');

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
                HireAI Intelligent Hiring Platform • Official HR Candidate Audit
              </div>
              <h1 class="export-header-title">Candidate Resume Analyzer & ATS Audit Report</h1>
              <div class="export-header-sub">Candidate: <strong>${name}</strong> • HR Review</div>
            </div>
            <div class="export-header-meta">
              <div>Audit Date: <strong>${formattedDate}</strong></div>
              <div>Organization: <strong>${report?.hr_company || 'HireAI Enterprise'}</strong></div>
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

  const atsScore = report?.ats_health_score || 75;
  const scoreColor = atsScore >= 80 ? '#10b981' : atsScore >= 60 ? '#f59e0b' : '#ef4444';
  const scoreBg = atsScore >= 80 ? '#ecfdf5' : atsScore >= 60 ? '#fffbeb' : '#fef2f2';

  const skillTax = report?.skill_taxonomy || {};
  const strengths = report?.strengths || [];
  const weaknesses = report?.weaknesses || [];
  const recommendations = report?.recommendations || [];
  const jobMatrix = report?.job_matrix || [];
  const lineAnalysis = report?.line_analysis || [];
  const lineSummary = report?.line_metrics_summary || { metric_lines: 0, action_verbs: 0, passive_phrases: 0 };
  const authVerif = report?.authenticity_verification || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card print-area" 
        style={{ maxWidth: '880px', maxHeight: '92vh', overflowY: 'auto' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#eff6ff', color: '#2563eb', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>
              <Sparkles size={13} /> Full AI Resume & Career Audit Report
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              {report?.candidate_name || candidateName || 'Candidate Report'}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={handleExport}
              disabled={loading || !report}
              style={{ 
                backgroundColor: '#0f172a', 
                color: '#ffffff', 
                border: 'none', 
                padding: '8px 14px', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontSize: '12px', 
                fontWeight: '700' 
              }}
              title="Export Clean PDF Report"
            >
              <Download size={14} /> Export Report
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Sparkles size={38} color="#2563eb" style={{ animation: 'spin 2s linear infinite', margin: '0 auto 12px auto' }} />
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Loading AI Resume Audit...</h4>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>Evaluating ATS compliance, skill taxonomy, and company fit matrix.</p>
          </div>
        ) : error || !report ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#ef4444' }}>
            <AlertTriangle size={36} style={{ margin: '0 auto 10px auto' }} />
            <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0' }}>Unable to Retrieve Audit Data</h4>
            <p style={{ fontSize: '13px', color: '#64748b' }}>{error || 'Candidate has not uploaded a parseable resume yet.'}</p>
          </div>
        ) : (
          <div id="hr-analyzer-report-printable">
            {/* Authenticity & Identity Verification Banner */}
            {authVerif && (
              <div style={{ marginBottom: '18px' }}>
                {authVerif.name_mismatch && (
                  <div style={{ 
                    backgroundColor: '#fffbeb', 
                    border: '1px solid #fde68a', 
                    borderRadius: '10px', 
                    padding: '14px 18px', 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '12px',
                    marginBottom: '10px'
                  }}>
                    <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#92400e', margin: '0 0 2px 0' }}>
                        Identity Discrepancy Flagged
                      </h4>
                      <p style={{ fontSize: '12px', color: '#b45309', margin: 0, lineHeight: 1.4 }}>
                        Resume document states candidate name <strong>"{authVerif.resume_name}"</strong>, but registered profile name is <strong>"{authVerif.profile_name}"</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {authVerif.is_valid_resume === false && (
                  <div style={{ 
                    backgroundColor: '#fef2f2', 
                    border: '1px solid #fecaca', 
                    borderRadius: '10px', 
                    padding: '14px 18px', 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '12px' 
                  }}>
                    <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#991b1b', margin: '0 0 2px 0' }}>
                        Invalid / Non-Resume Document Detected
                      </h4>
                      <p style={{ fontSize: '12px', color: '#b91c1c', margin: 0, lineHeight: 1.4 }}>
                        Uploaded document lacks standard career sections. Automated screening filters will penalize this layout.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Candidate Header Summary & ATS Gauge */}
            <div style={{ 
              background: 'linear-gradient(135deg, #1e293b, #0f172a)', 
              borderRadius: '14px', 
              padding: '22px', 
              color: '#fff', 
              marginBottom: '20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', fontWeight: '700' }}>
                  Candidate Audit Profile
                </span>
                <h4 style={{ fontSize: '20px', fontWeight: '800', margin: '4px 0 6px 0' }}>
                  {report.candidate_name || 'Candidate'}
                  {report.resume_name && report.resume_name !== report.candidate_name && (
                    <span style={{ fontSize: '12px', fontWeight: '400', color: '#94a3b8', marginLeft: '8px' }}>
                      (Resume: {report.resume_name})
                    </span>
                  )}
                </h4>
                <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '0 0 12px 0' }}>
                  {report.email || ''} {report.phone ? `• ${report.phone}` : ''}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>
                    🎯 {report.seniority_level || 'Software Developer'}
                  </span>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>
                    ⏳ {report.experience_years || 0} Yrs Exp
                  </span>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>
                    🎓 {report.education || 'Graduate'}
                  </span>
                </div>
              </div>

              {/* ATS Gauge Box */}
              <div style={{ 
                backgroundColor: 'rgba(255,255,255,0.06)', 
                border: '1px solid rgba(255,255,255,0.12)', 
                borderRadius: '12px', 
                padding: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px' 
              }}>
                <div style={{ 
                  width: '72px', 
                  height: '72px', 
                  borderRadius: '50%', 
                  border: `5px solid ${scoreColor}`, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: scoreBg,
                  color: scoreColor,
                  flexShrink: 0
                }}>
                  <span style={{ fontSize: '20px', fontWeight: '900', lineHeight: 1 }}>{atsScore}%</span>
                  <span style={{ fontSize: '8px', fontWeight: '800', textTransform: 'uppercase' }}>ATS Score</span>
                </div>
                <div>
                  <h5 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 2px 0' }}>
                    {atsScore >= 80 ? 'Excellent Match Health' : atsScore >= 60 ? 'Good Standard Profile' : 'Needs Optimization'}
                  </h5>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                    Deterministic multi-pillar applicant tracking system audit.
                  </p>
                </div>
              </div>
            </div>

            {/* 5 Core ATS Pillars */}
            {report.ats_pillars && (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={16} color="#2563eb" /> 5-Pillar ATS Methodology Evaluation
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {[
                    { key: 'format_parsability', label: '1. Format & Parsability', desc: 'Section headings & layout', val: report.ats_pillars.format_parsability },
                    { key: 'keyword_density', label: '2. Keyword Density', desc: 'Skill taxonomy & stack depth', val: report.ats_pillars.keyword_density },
                    { key: 'action_impact', label: '3. Action & Metrics', desc: 'Power verbs & quantified impact', val: report.ats_pillars.action_impact },
                    { key: 'brevity_readability', label: '4. Brevity & Readability', desc: 'Length & layout clarity', val: report.ats_pillars.brevity_readability },
                    { key: 'authenticity_integrity', label: '5. Authenticity Integrity', desc: 'Document structure & identity', val: report.ats_pillars.authenticity_integrity }
                  ].map(p => {
                    const pScore = p.val || 50;
                    const pColor = pScore >= 80 ? '#10b981' : pScore >= 60 ? '#2563eb' : pScore >= 40 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={p.key} style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b' }}>{p.label}</span>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: pColor }}>{pScore}%</span>
                        </div>
                        <div style={{ height: '5px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
                          <div style={{ height: '100%', width: `${pScore}%`, backgroundColor: pColor, borderRadius: '3px' }} />
                        </div>
                        <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>{p.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Line-by-Line Document Inspection */}
            {lineAnalysis.length > 0 && (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="#7c3aed" /> Line-by-Line Document Inspection
                    </h4>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                      Live annotation of candidate resume bullet points with metric statements and power verbs.
                    </p>
                  </div>
                  {lineSummary && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '3px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: '700' }}>
                        ✓ {lineSummary.metric_lines || 0} Metrics
                      </span>
                      <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '3px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: '700' }}>
                        ⚡ {lineSummary.action_verbs || 0} Verbs
                      </span>
                      {(lineSummary.passive_phrases || 0) > 0 && (
                        <span style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '3px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: '700' }}>
                          ⚠️ {lineSummary.passive_phrases} Passive
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                  {lineAnalysis.map((line, idx) => {
                    if (line.category === 'SECTION_HEADER') {
                      return (
                        <div key={idx} style={{ backgroundColor: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', fontWeight: '800', fontSize: '11px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          § {line.text}
                        </div>
                      );
                    }

                    const badgeBg = line.badge_color === 'green' ? '#ecfdf5' : line.badge_color === 'blue' ? '#eff6ff' : line.badge_color === 'red' ? '#fef2f2' : line.badge_color === 'cyan' ? '#ecfeff' : '#f8fafc';
                    const badgeTextColor = line.badge_color === 'green' ? '#047857' : line.badge_color === 'blue' ? '#1d4ed8' : line.badge_color === 'red' ? '#b91c1c' : line.badge_color === 'cyan' ? '#0e7490' : '#64748b';
                    const borderColor = line.badge_color === 'green' ? '#a7f3d0' : line.badge_color === 'blue' ? '#bfdbfe' : line.badge_color === 'red' ? '#fecaca' : '#e2e8f0';

                    return (
                      <div key={idx} style={{ border: `1px solid ${borderColor}`, borderRadius: '6px', padding: '8px 12px', backgroundColor: line.badge_color === 'red' ? '#fffbfb' : '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                          <p style={{ margin: 0, fontSize: '12px', color: '#1e293b', fontWeight: '500', lineHeight: 1.4 }}>
                            <span style={{ color: '#94a3b8', fontSize: '10px', marginRight: '6px' }}>L{line.line_number}</span>
                            {line.text}
                          </p>
                          <span style={{ backgroundColor: badgeBg, color: badgeTextColor, border: `1px solid ${borderColor}`, padding: '2px 6px', borderRadius: '5px', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {line.badge}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{line.feedback}</span>
                          {line.suggestion && (
                            <span style={{ fontSize: '10px', color: '#b91c1c', backgroundColor: '#fef2f2', padding: '2px 5px', borderRadius: '4px', fontStyle: 'italic' }}>
                              💡 {line.suggestion}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Strengths & Weaknesses */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#166534', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={15} color="#16a34a" /> Verified Key Strengths
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {strengths.map((s, idx) => (
                    <div key={idx} style={{ fontSize: '12px', color: '#15803d', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <Check size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#92400e', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={15} color="#d97706" /> Candidate Gap Areas
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {weaknesses.map((w, idx) => (
                    <div key={idx} style={{ fontSize: '12px', color: '#b45309', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Extracted Skill Taxonomy Breakdown (6 Categories) */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={16} color="#2563eb" /> Verified Skill Taxonomy Breakdown ({report.total_skills_count || 0} Skills)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                {/* Cybersecurity */}
                {skillTax.cybersecurity_and_networking && skillTax.cybersecurity_and_networking.length > 0 && (
                  <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#c2410c', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                      <ShieldCheck size={13} color="#ea580c" /> Cybersecurity & Networking
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {skillTax.cybersecurity_and_networking.map(s => (
                        <span key={s} style={{ backgroundColor: '#ffffff', color: '#c2410c', border: '1px solid #ffedd5', fontSize: '11px', padding: '2px 7px', borderRadius: '6px', fontWeight: '600' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <Code size={13} color="#2563eb" /> Programming Languages
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {skillTax.languages && skillTax.languages.length > 0 ? (
                      skillTax.languages.map(s => (
                        <span key={s} style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '11px', padding: '2px 7px', borderRadius: '6px', fontWeight: '600' }}>{s}</span>
                      ))
                    ) : (
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>None detected</span>
                    )}
                  </div>
                </div>

                {/* Frameworks */}
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <Layers size={13} color="#7c3aed" /> Frameworks & Libraries
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {skillTax.frameworks && skillTax.frameworks.length > 0 ? (
                      skillTax.frameworks.map(s => (
                        <span key={s} style={{ backgroundColor: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', fontSize: '11px', padding: '2px 7px', borderRadius: '6px', fontWeight: '600' }}>{s}</span>
                      ))
                    ) : (
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>None detected</span>
                    )}
                  </div>
                </div>

                {/* Cloud & Data */}
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <Cloud size={13} color="#059669" /> Cloud, DevOps & Databases
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {skillTax.databases_and_cloud && skillTax.databases_and_cloud.length > 0 ? (
                      skillTax.databases_and_cloud.map(s => (
                        <span key={s} style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '11px', padding: '2px 7px', borderRadius: '6px', fontWeight: '600' }}>{s}</span>
                      ))
                    ) : (
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>None detected</span>
                    )}
                  </div>
                </div>

                {/* AI & Data */}
                {skillTax.ai_and_data && skillTax.ai_and_data.length > 0 && (
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                      <Sparkles size={13} color="#0891b2" /> AI & Data Science
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {skillTax.ai_and_data.map(s => (
                        <span key={s} style={{ backgroundColor: '#ecfeff', color: '#0e7490', border: '1px solid #a5f3fc', fontSize: '11px', padding: '2px 7px', borderRadius: '6px', fontWeight: '600' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Tools */}
                {skillTax.other_tools && skillTax.other_tools.length > 0 && (
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                      <FileText size={13} color="#64748b" /> Additional Tools & Protocols
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {skillTax.other_tools.map(s => (
                        <span key={s} style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontSize: '11px', padding: '2px 7px', borderRadius: '6px', fontWeight: '600' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actionable Recommendations */}
            {recommendations.length > 0 && (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lightbulb size={16} color="#eab308" /> Recruitment & Candidate Optimization Roadmap
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recommendations.map((rec, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '6px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {idx + 1}
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#1e293b', lineHeight: 1.4 }}>{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Multi-Company & Platform Fit Matrix */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Active Job Openings Compatibility Matrix
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                    Deterministic fit evaluation across active platform openings (Your company postings prioritized).
                  </p>
                </div>
                {report.hr_company && (
                  <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '8px' }}>
                    🏢 {report.hr_company}
                  </span>
                )}
              </div>

              {jobMatrix.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>No active openings currently open for evaluation.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {jobMatrix.map(job => (
                    <div 
                      key={job.job_id} 
                      style={{ 
                        border: job.is_current_hr_company ? '1.5px solid #3b82f6' : '1px solid #e2e8f0', 
                        borderRadius: '10px', 
                        padding: '14px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        flexWrap: 'wrap', 
                        gap: '12px',
                        backgroundColor: job.is_current_hr_company ? '#f0f7ff' : job.is_domain_mismatch ? '#fafafa' : '#fff'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <h5 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{job.title}</h5>
                          {job.is_current_hr_company && (
                            <span style={{ backgroundColor: '#1d4ed8', color: '#ffffff', fontSize: '10px', padding: '2px 7px', borderRadius: '6px', fontWeight: '800' }}>
                              ⭐ Your Company Opening
                            </span>
                          )}
                          <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', padding: '2px 7px', borderRadius: '6px', fontWeight: '600' }}>
                            {job.domain}
                          </span>
                          {job.is_domain_mismatch && (
                            <span style={{ backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', fontSize: '10px', padding: '1px 6px', borderRadius: '6px', fontWeight: '700' }}>
                              ⚠️ {job.domain_status}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span><Building size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {job.company}</span>
                          <span><MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {job.location}</span>
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(job.matched_skills || []).map(s => (
                            <span key={s} style={{ backgroundColor: '#ecfdf5', color: '#059669', fontSize: '10px', padding: '2px 6px', borderRadius: '8px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <Check size={9} /> {s}
                            </span>
                          ))}
                          {(job.missing_skills || []).map(s => (
                            <span key={s} style={{ backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '10px', padding: '2px 6px', borderRadius: '8px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              ✕ {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: job.match_score >= 80 ? '#10b981' : job.match_score >= 60 ? '#2563eb' : job.match_score >= 35 ? '#f59e0b' : '#ef4444' }}>
                          {job.match_score}%
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>
                          {job.is_domain_mismatch ? 'Incompatible' : 'Match Rating'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
