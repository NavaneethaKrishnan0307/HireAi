import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Award, 
  TrendingUp, 
  FileText, 
  Layers, 
  Code, 
  Cloud, 
  ShieldCheck, 
  Check, 
  Building, 
  MapPin, 
  Lightbulb 
} from 'lucide-react';
import { exportReportToPdf } from '../utils/pdfExport';

export default function ReportPreviewModal({ isOpen, onClose, report, candidateName = 'Candidate' }) {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !report) return null;

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
  const formattedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await exportReportToPdf('report-preview-document-canvas', report.candidate_name || candidateName);
    } catch (err) {
      console.error('Direct PDF export error:', err);
      alert('Unable to generate PDF directly: ' + (err.message || 'unknown error'));
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    const reportElem = document.getElementById('report-preview-document-canvas');
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
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(s => s.outerHTML)
      .join('\n');

    const clone = reportElem.cloneNode(true);
    clone.querySelectorAll('button, .choose-btn, a.choose-btn, .no-print').forEach(el => el.remove());

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resume_Analyzer_Report_${(report.candidate_name || candidateName).replace(/\s+/g, '_')}</title>
          <meta charset="utf-8" />
          ${styles}
          <style>
            @page { size: A4 portrait; margin: 12mm 14mm; }
            body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
            .card { box-shadow: none !important; border: 1px solid #e2e8f0 !important; page-break-inside: avoid; break-inside: avoid; }
            button, .choose-btn { display: none !important; }
          </style>
        </head>
        <body>${clone.innerHTML}</body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 1500);
      }
    }, 400);
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px'
      }}
    >
      {/* Floating Action Bar */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '860px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          flexWrap: 'wrap',
          gap: '12px',
          zIndex: 1010
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={18} color="#ffffff" />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>
              Report Document Preview
            </h4>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              {report.candidate_name || candidateName} • Ready for Download
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Main Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: downloading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.2s ease'
            }}
            title="Download PDF directly to your device"
          >
            <Download size={16} />
            {downloading ? 'Generating PDF...' : 'Download PDF'}
          </button>

          {/* Optional Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: '#f8fafc',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '9px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Print or save through browser print"
          >
            <Printer size={15} /> Print
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '4px'
            }}
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Document View Canvas Wrapper */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: 'calc(90vh - 80px)',
          overflowY: 'auto',
          borderRadius: '12px'
        }}
      >
        <div 
          id="report-preview-document-canvas"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '36px',
            color: '#0f172a',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            border: '1px solid #cbd5e1'
          }}
        >
          {/* Executive Document Letterhead */}
          <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                HireAI Intelligent Hiring Platform • Official Career Audit
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Resume Analyzer & ATS Audit Report
              </h1>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Candidate: <strong>{report.candidate_name || candidateName}</strong>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'right' }}>
              <div>Audit Date: <strong>{formattedDate}</strong></div>
              <div>Verification Status: <strong style="color: #059669;">Verified Authentic</strong></div>
            </div>
          </div>

          {/* Authenticity & Identity Verification Banner */}
          {authVerif && (
            <div style={{ marginBottom: '20px' }}>
              {authVerif.name_mismatch && (
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#92400e', margin: '0 0 2px 0' }}>
                      Identity Discrepancy Flagged
                    </h4>
                    <p style={{ fontSize: '12px', color: '#b45309', margin: 0, lineHeight: 1.4 }}>
                      Resume document header states candidate name <strong>"{authVerif.resume_name}"</strong>, but registered profile is <strong>"{authVerif.profile_name}"</strong>.
                    </p>
                  </div>
                </div>
              )}

              {authVerif.is_valid_resume === false && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#991b1b', margin: '0 0 2px 0' }}>
                      Invalid / Non-Resume Document Detected
                    </h4>
                    <p style={{ fontSize: '12px', color: '#b91c1c', margin: 0, lineHeight: 1.4 }}>
                      Uploaded document lacks standard career sections. Automated screening algorithms will reject this document structure.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Candidate Audit Profile Banner & ATS Gauge */}
          <div style={{ 
            background: 'linear-gradient(135deg, #1e293b, #0f172a)', 
            borderRadius: '14px', 
            padding: '24px', 
            color: '#fff', 
            marginBottom: '22px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', fontWeight: '700' }}>Candidate Audit Profile</span>
              <h3 style={{ fontSize: '22px', fontWeight: '800', marginTop: '4px', marginBottom: '6px' }}>
                {report.candidate_name || candidateName}
                {report.resume_name && report.resume_name !== report.candidate_name && (
                  <span style={{ fontSize: '13px', fontWeight: '400', color: '#94a3b8', marginLeft: '10px' }}>
                    (Resume: {report.resume_name})
                  </span>
                )}
              </h3>
              <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '12px' }}>
                {report.email || ''} {report.phone ? `• ${report.phone}` : ''}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>
                  🎯 {report.seniority_level || 'Software Developer'}
                </span>
                <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>
                  ⏳ {report.experience_years || 0} Years Experience
                </span>
                <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>
                  🎓 {report.education || 'Graduate'}
                </span>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '74px', height: '74px', borderRadius: '50%', border: `5px solid ${scoreColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: scoreBg, color: scoreColor, flexShrink: 0 }}>
                <span style={{ fontSize: '20px', fontWeight: '900', lineHeight: 1 }}>{atsScore}%</span>
                <span style={{ fontSize: '8px', fontWeight: '800', textTransform: 'uppercase' }}>ATS Score</span>
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 2px 0' }}>
                  {atsScore >= 80 ? 'Excellent Match Health' : atsScore >= 60 ? 'Good Standard Profile' : 'Needs Optimization'}
                </h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                  Deterministic multi-pillar applicant tracking system audit.
                </p>
              </div>
            </div>
          </div>

          {/* 5-Pillar ATS Evaluation */}
          {report.ats_pillars && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '22px', backgroundColor: '#fcfcfd' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} color="#2563eb" /> 5-Pillar ATS Methodology Evaluation
              </h3>
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
                    <div key={p.key} style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
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
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} color="#7c3aed" /> Line-by-Line Document Inspection
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                    Live annotation of resume statements with metrics, power verbs, and passive phrasing.
                  </p>
                </div>
                {lineSummary && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                      ✓ {lineSummary.metric_lines || 0} Metric Statements
                    </span>
                    <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                      ⚡ {lineSummary.action_verbs || 0} Power Verbs
                    </span>
                    {(lineSummary.passive_phrases || 0) > 0 && (
                      <span style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                        ⚠️ {lineSummary.passive_phrases} Passive Phrases
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lineAnalysis.map((line, idx) => {
                  if (line.category === 'SECTION_HEADER') {
                    return (
                      <div key={idx} style={{ backgroundColor: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', fontWeight: '800', fontSize: '11px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        § {line.text}
                      </div>
                    );
                  }

                  const badgeBg = line.badge_color === 'green' ? '#ecfdf5' : line.badge_color === 'blue' ? '#eff6ff' : line.badge_color === 'red' ? '#fef2f2' : '#f8fafc';
                  const badgeTextColor = line.badge_color === 'green' ? '#047857' : line.badge_color === 'blue' ? '#1d4ed8' : line.badge_color === 'red' ? '#b91c1c' : '#64748b';
                  const borderColor = line.badge_color === 'green' ? '#a7f3d0' : line.badge_color === 'blue' ? '#bfdbfe' : line.badge_color === 'red' ? '#fecaca' : '#e2e8f0';

                  return (
                    <div key={idx} style={{ border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '8px 12px', backgroundColor: line.badge_color === 'red' ? '#fffbfb' : '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#1e293b', fontWeight: '500', lineHeight: 1.4 }}>
                          <span style={{ color: '#94a3b8', fontSize: '10px', marginRight: '6px' }}>L{line.line_number}</span>
                          {line.text}
                        </p>
                        <span style={{ backgroundColor: badgeBg, color: badgeTextColor, border: `1px solid ${borderColor}`, padding: '2px 6px', borderRadius: '5px', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                          {line.badge}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{line.feedback}</span>
                        {line.suggestion && (
                          <span style={{ fontSize: '10px', color: '#b91c1c', backgroundColor: '#fef2f2', padding: '2px 6px', borderRadius: '4px', fontStyle: 'italic' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '22px' }}>
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

          {/* Technical Skill Taxonomy */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '22px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="#2563eb" /> Verified Skill Taxonomy Breakdown ({report.total_skills_count || 0} Skills)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
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

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <Code size={13} color="#2563eb" /> Programming Languages
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(skillTax.languages || []).map(s => (
                    <span key={s} style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '11px', padding: '2px 7px', borderRadius: '6px', fontWeight: '600' }}>{s}</span>
                  ))}
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <Layers size={13} color="#7c3aed" /> Frameworks & Libraries
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(skillTax.frameworks || []).map(s => (
                    <span key={s} style={{ backgroundColor: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', fontSize: '11px', padding: '2px 7px', borderRadius: '6px', fontWeight: '600' }}>{s}</span>
                  ))}
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <Cloud size={13} color="#059669" /> Cloud, DevOps & Databases
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(skillTax.databases_and_cloud || []).map(s => (
                    <span key={s} style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '11px', padding: '2px 7px', borderRadius: '6px', fontWeight: '600' }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Recommendations */}
          {recommendations.length > 0 && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '22px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lightbulb size={16} color="#eab308" /> Actionable Hireability Roadmap
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recommendations.map((rec, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '6px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {idx + 1}
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#1e293b' }}>{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Job Matrix */}
          {jobMatrix.length > 0 && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>
                Job Openings Compatibility Matrix
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {jobMatrix.map(job => (
                  <div key={job.job_id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{job.title}</span>
                        <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '10px', padding: '2px 6px', borderRadius: '6px' }}>{job.company}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {(job.matched_skills || []).map(s => (
                          <span key={s} style={{ backgroundColor: '#ecfdf5', color: '#059669', fontSize: '10px', padding: '1px 5px', borderRadius: '4px' }}>✓ {s}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: job.match_score >= 80 ? '#10b981' : '#2563eb' }}>
                      {job.match_score}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
