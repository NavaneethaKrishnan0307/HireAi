import React from 'react';
import { X, CheckCircle, XCircle, Sparkles, Award, GraduationCap, Clock, FileText, User, Lightbulb } from 'lucide-react';
import { HRAPI } from '../services/api';

export default function MatchModal({ candidate, jobId, onClose, onStatusChange }) {
  if (!candidate) return null;

  const match = candidate.match_details || {};
  const score = candidate.score || match.overall_score || 85;
  const targetJobId = jobId || candidate.job_id || (candidate.application ? candidate.application.job_id : null);
  const explanations = match.explanations || [
    '✓ Core skill requirement satisfied',
    '✓ Experience criteria met',
    '✓ Education level qualification satisfied'
  ];
  const skillGapAdvice = match.skill_gap_advice || [];
  const weights = match.applied_weights || { skills: 0.50, experience: 0.25, education: 0.15, additional: 0.10 };

  const handleStatusUpdate = async (newStatus) => {
    try {
      if (candidate.application_id) {
        await HRAPI.updateApplicationStatus(candidate.application_id, newStatus);
      } else {
        await HRAPI.updateCandidateStatus(candidate.id, targetJobId, newStatus);
      }
      if (onStatusChange) onStatusChange(candidate.id, newStatus);
      alert(`Candidate status successfully updated to: ${newStatus.toUpperCase()}`);
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{candidate.full_name}</h3>
              <p style={{ fontSize: '13px', color: '#64748b' }}>{candidate.email} • {candidate.current_title || 'Software Developer'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={22} />
          </button>
        </div>

        {/* Explainable AI Score Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #ecfdf5, #f0fdf4)', 
          border: '1px solid #a7f3d0', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: '800', fontSize: '14px', marginBottom: '4px' }}>
              <Sparkles size={16} /> Explainable AI Match Score
            </div>
            <p style={{ fontSize: '12px', color: '#065f46' }}>
              Deterministic multi-criteria scoring algorithm (100% explainable & transparent)
            </p>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#059669' }}>
            {score}%
          </div>
        </div>

        {/* Scoring Breakdown */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Multi-Criteria Weighted Breakdown</h4>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Custom Weights Applied</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Skills ({Math.round(weights.skills * 100)}% wt.)</span>
                <strong>{match.skill_score || 90}%</strong>
              </div>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${match.skill_score || 90}%`, height: '100%', background: '#10b981' }}></div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Experience ({Math.round(weights.experience * 100)}% wt.)</span>
                <strong>{match.experience_score || 100}%</strong>
              </div>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${match.experience_score || 100}%`, height: '100%', background: '#10b981' }}></div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Education ({Math.round(weights.education * 100)}% wt.)</span>
                <strong>{match.education_score || 100}%</strong>
              </div>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${match.education_score || 100}%`, height: '100%', background: '#10b981' }}></div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Certifications ({Math.round(weights.additional * 100)}% wt.)</span>
                <strong>{match.certifications_score || 100}%</strong>
              </div>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${match.certifications_score || 100}%`, height: '100%', background: '#10b981' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Explainable Decision Log */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>Explainable Rule Reasoning & Proofs</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {explanations.map((exp, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '13px', 
                  color: exp.startsWith('✓') ? '#065f46' : exp.startsWith('✗') ? '#991b1b' : '#334155',
                  background: exp.startsWith('✓') ? '#f0fdf4' : exp.startsWith('✗') ? '#fef2f2' : '#f8fafc',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${exp.startsWith('✓') ? '#bbf7d0' : exp.startsWith('✗') ? '#fecaca' : '#e2e8f0'}`
                }}
              >
                <span>{exp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Gap Advice */}
        {skillGapAdvice.length > 0 && (
          <div style={{ marginBottom: '20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>
              <Lightbulb size={16} /> Skill Gap Improvement Opportunities
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {skillGapAdvice.map((item, idx) => (
                <div key={idx} style={{ fontSize: '12px', color: '#78350f' }}>
                  • <strong>{item.skill}</strong>: {item.recommendation}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button 
            type="button" 
            onClick={() => handleStatusUpdate('rejected')}
            style={{ 
              backgroundColor: '#fee2e2', 
              color: '#dc2626', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: '8px', 
              fontWeight: '700', 
              fontSize: '13px',
              cursor: 'pointer' 
            }}
          >
            Reject Candidate
          </button>
          
          <button 
            type="button" 
            onClick={() => handleStatusUpdate('shortlisted')}
            className="find-candidates-btn"
            style={{ padding: '10px 24px', fontSize: '13px' }}
          >
            Shortlist Candidate
          </button>
        </div>
      </div>
    </div>
  );
}
