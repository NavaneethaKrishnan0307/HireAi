import React from 'react';
import { X, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, ArrowDown, Calculator, Scale } from 'lucide-react';

export default function ProofTraceModal({ proofTrace, candidateName = 'Candidate', onClose }) {
  if (!proofTrace) return null;

  const steps = proofTrace.derivation_steps || [];
  const formula = proofTrace.mathematical_formula || 'Utility(C, J) = w_skill*S_skill + w_exp*S_exp + w_edu*S_edu + w_cert*S_cert';
  const score = proofTrace.composite_score || 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#f0fdf4', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>
              <ShieldCheck size={13} /> Transparent Explainable AI (XAI)
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              Deterministic Decision Tree & Proof Derivation Trace
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Candidate: <strong>{candidateName}</strong> • Full mathematical derivation of match utility score
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={22} />
          </button>
        </div>

        {/* Formula Card */}
        <div style={{ background: '#0f172a', color: '#f8fafc', padding: '16px 20px', borderRadius: '10px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                <Calculator size={13} color="#38bdf8" /> Multi-Attribute Utility Function (MAUA)
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '14px', color: '#38bdf8', marginTop: '6px', fontWeight: '700' }}>
                {formula}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Calculated Match Score</span>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#34d399' }}>{score}%</div>
            </div>
          </div>
        </div>

        {/* Step by Step Proof Tree */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Scale size={16} color="#2563eb" /> Forward-Chaining Derivation Trace
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {steps.map((node, idx) => {
              const isFinal = node.status === 'FINAL_RESULT';
              const isWarning = node.status === 'WARNING';
              const isFail = node.status === 'FAIL';
              
              let statusBg = '#ecfdf5';
              let statusBorder = '#a7f3d0';
              let statusText = '#059669';
              let Icon = CheckCircle2;

              if (isWarning) {
                statusBg = '#fffbeb';
                statusBorder = '#fde68a';
                statusText = '#d97706';
                Icon = AlertTriangle;
              } else if (isFail) {
                statusBg = '#fef2f2';
                statusBorder = '#fecaca';
                statusText = '#dc2626';
                Icon = AlertTriangle;
              } else if (isFinal) {
                statusBg = '#eff6ff';
                statusBorder = '#bfdbfe';
                statusText = '#2563eb';
                Icon = Sparkles;
              }

              return (
                <div 
                  key={idx} 
                  style={{ 
                    border: `1px solid ${statusBorder}`, 
                    background: statusBg, 
                    borderRadius: '8px', 
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: statusText }}>
                        Step {node.step}: {node.name}
                      </span>
                    </div>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '800', 
                      backgroundColor: '#ffffff', 
                      color: statusText, 
                      padding: '2px 8px', 
                      borderRadius: '10px',
                      border: `1px solid ${statusBorder}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Icon size={12} /> {node.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#1e293b', marginTop: '2px', wordBreak: 'break-word' }}>
                    {node.logic}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{ 
              padding: '8px 18px', 
              borderRadius: '6px', 
              background: '#0f172a', 
              color: '#ffffff', 
              fontSize: '13px', 
              fontWeight: '700', 
              border: 'none', 
              cursor: 'pointer' 
            }}
          >
            Close Proof Tree
          </button>
        </div>
      </div>
    </div>
  );
}
