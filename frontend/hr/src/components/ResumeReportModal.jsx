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
  Printer, 
  Check, 
  FileText,
  User
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card print-area" 
        style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#eff6ff', color: '#2563eb', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>
              <Sparkles size={13} /> Deep AI Candidate Audit Report
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              {report?.candidate_name || candidateName || 'Candidate Report'}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={handlePrint}
              style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#334155' }}
            >
              <Printer size={15} /> Print
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <Sparkles size={36} color="#2563eb" style={{ animation: 'spin 2s linear infinite', margin: '0 auto 12px auto' }} />
            <p style={{ color: '#64748b', fontSize: '14px' }}>Loading complete AI Resume & Fit Analysis...</p>
          </div>
        ) : error || !report ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#ef4444' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 10px auto' }} />
            <p style={{ fontSize: '14px', fontWeight: '600' }}>{error || 'Unable to retrieve resume audit data.'}</p>
          </div>
        ) : (
          <div>
            {/* Candidate Header Summary */}
            <div style={{ 
              background: 'linear-gradient(135deg, #1e293b, #0f172a)', 
              borderRadius: '12px', 
              padding: '20px', 
              color: '#fff', 
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0' }}>{report.candidate_name}</h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 10px 0' }}>{report.email} {report.phone ? `• ${report.phone}` : ''}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>
                    🎯 {report.seniority_level}
                  </span>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>
                    ⏳ {report.experience_years} Yrs Exp
                  </span>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>
                    🎓 {report.education}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.08)', padding: '12px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '24px', fontWeight: '900', color: report.ats_health_score >= 80 ? '#34d399' : '#fbbf24' }}>
                  {report.ats_health_score}%
                </div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '700' }}>ATS Health Rating</div>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#166534', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={15} color="#16a34a" /> Verified Key Strengths
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {report.strengths.map((s, idx) => (
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
                  {report.weaknesses.map((w, idx) => (
                    <div key={idx} style={{ fontSize: '12px', color: '#b45309', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Extracted Skill Taxonomy */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={15} color="#2563eb" /> Verified Skill Taxonomy Breakdown ({report.total_skills_count} Skills)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Languages</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                    {report.skill_taxonomy.languages.map(s => (
                      <span key={s} style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{s}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Frameworks</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                    {report.skill_taxonomy.frameworks.map(s => (
                      <span key={s} style={{ backgroundColor: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{s}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Cloud & Data</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                    {report.skill_taxonomy.databases_and_cloud.map(s => (
                      <span key={s} style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={15} color="#eab308" /> Recruitment Recommendation
              </h4>
              <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Candidate demonstrates solid technical aptitude with clean document structure. Suitable for evaluation across matched platform postings.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
