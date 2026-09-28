import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  Wand2, 
  ArrowRight, 
  Layers, 
  TrendingUp, 
  ShieldCheck, 
  FileText 
} from 'lucide-react';
import { CandidateAPI } from '../services/api';

export default function StarTransformerModal({ initialBullet = '', onClose }) {
  const [rawBullet, setRawBullet] = useState(initialBullet);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  useEffect(() => {
    if (initialBullet) {
      handleTransform(initialBullet);
    }
  }, [initialBullet]);

  const handleTransform = async (textToTransform = rawBullet) => {
    if (!textToTransform || !textToTransform.trim()) return;
    try {
      setLoading(true);
      const data = await CandidateAPI.transformBullet(textToTransform.trim());
      setResult(data);
    } catch (err) {
      console.error('STAR Transformation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#fdf4ff', color: '#9333ea', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>
              <Sparkles size={13} /> Context-Free Grammar (CFG) STAR Optimizer (Zero ML)
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              Deterministic STAR Bullet Transformer
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Convert weak, passive resume phrases into high-impact STAR power templates with quantifiable metrics.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={22} />
          </button>
        </div>

        {/* Input Form */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
            Your Original Resume Bullet Point:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              value={rawBullet}
              onChange={(e) => setRawBullet(e.target.value)}
              placeholder="e.g. Worked on backend features for customer payments..."
              style={{ flex: 1, padding: '10px 14px', fontSize: '13px' }}
            />
            <button
              type="button"
              onClick={() => handleTransform(rawBullet)}
              disabled={loading || !rawBullet.trim()}
              className="choose-btn"
              style={{ padding: '10px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Wand2 size={15} /> {loading ? 'Transforming...' : 'Transform to STAR'}
            </button>
          </div>
        </div>

        {/* CFG Production Rule Banner */}
        {result && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: '#64748b' }}>
              <div>
                <strong>CFG Grammar Rule:</strong> <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{result.cfg_production_rule}</span>
              </div>
              <div>
                Passive Pattern: <strong style={{ color: '#ef4444' }}>{result.detected_passive_pattern}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Output Variations */}
        {result && result.variations && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
              3 High-Impact STAR Variations:
            </h4>

            {result.variations.map((v, idx) => (
              <div 
                key={idx}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      backgroundColor: '#eff6ff', 
                      color: '#2563eb', 
                      border: '1px solid #bfdbfe', 
                      fontSize: '11px', 
                      fontWeight: '800', 
                      padding: '2px 8px', 
                      borderRadius: '10px' 
                    }}>
                      {v.archetype}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Action Verb: <strong>{v.action_verb}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(v.star_bullet, idx)}
                    style={{
                      background: copiedIdx === idx ? '#ecfdf5' : '#f1f5f9',
                      color: copiedIdx === idx ? '#059669' : '#334155',
                      border: `1px solid ${copiedIdx === idx ? '#a7f3d0' : '#cbd5e1'}`,
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {copiedIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                    {copiedIdx === idx ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', lineHeight: '1.5', margin: '0 0 10px 0' }}>
                  "{v.star_bullet}"
                </p>

                {/* STAR Decomposition Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '11px', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: '700' }}>[S/T] Situation & Task:</span>
                    <div style={{ color: '#1e293b', marginTop: '2px' }}>{v.situation_task}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: '700' }}>[A] Action Verb & System:</span>
                    <div style={{ color: '#1e293b', marginTop: '2px' }}>{v.action}</div>
                  </div>
                  <div>
                    <span style={{ color: '#059669', fontWeight: '700' }}>[R] Measurable Metric:</span>
                    <div style={{ color: '#065f46', marginTop: '2px', fontWeight: '700' }}>{v.metric_result}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
