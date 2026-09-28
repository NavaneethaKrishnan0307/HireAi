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
  FileText,
  Lightbulb,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { CandidateAPI } from '../services/api';

const QUICK_EXAMPLES = [
  "worked on backend features for customer payments",
  "helped with fixing bugs in react frontend",
  "responsible for database queries and performance",
  "participated in cloud deployment and automation"
];

export default function StarTransformerModal({ initialBullet = '', onClose }) {
  const [rawBullet, setRawBullet] = useState(initialBullet || 'worked on backend features for customer payments');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  useEffect(() => {
    handleTransform(initialBullet || 'worked on backend features for customer payments');
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
    setTimeout(() => setCopiedIdx(null), 3000);
  };

  const handleSelectExample = (ex) => {
    setRawBullet(ex);
    handleTransform(ex);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#fdf4ff', color: '#9333ea', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>
              <Sparkles size={13} /> Resume Bullet Point Optimizer
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              Deterministic STAR Power Bullet Transformer
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Turn weak, passive resume lines into powerful, quantified achievements that pass HR screeners.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={22} />
          </button>
        </div>

        {/* Layman Explanation Card */}
        <div style={{ 
          background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)', 
          border: '1px solid #bfdbfe', 
          borderRadius: '10px', 
          padding: '14px 18px', 
          marginBottom: '18px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Lightbulb size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '13px', color: '#1e40af' }}>How will this help you land interviews?</strong>
              <p style={{ fontSize: '12px', color: '#334155', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                HR recruiters and resume scanners ignore generic sentences like <em>"Worked on APIs"</em> or <em>"Helped fix bugs"</em>. 
                Top companies require the <strong>STAR method</strong>: 
                <strong> S</strong>ituation + <strong>T</strong>ask + <strong>A</strong>ction Verb + <strong>R</strong>esult Metric (e.g. <em>35% speed boost, 99.9% uptime</em>). 
                Simply paste or choose a line below, pick your favorite version, and copy it straight into your resume!
              </p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
            Type or edit your resume sentence:
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
              style={{ padding: '10px 20px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Wand2 size={15} /> {loading ? 'Optimizing...' : 'Optimize Line'}
            </button>
          </div>
        </div>

        {/* Quick Example Pills */}
        <div style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Or try a 1-click sample: </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
            {QUICK_EXAMPLES.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectExample(ex)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                "{ex}"
              </button>
            ))}
          </div>
        </div>

        {/* Output Variations */}
        {result && result.variations && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                ⚡ 3 High-Impact STAR Variations (Pick your favorite):
              </h4>
              <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>
                ✓ Includes Quantified Metric Placeholders
              </span>
            </div>

            {result.variations.map((v, idx) => (
              <div 
                key={idx}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      backgroundColor: '#eff6ff', 
                      color: '#2563eb', 
                      border: '1px solid #bfdbfe', 
                      fontSize: '11px', 
                      fontWeight: '800', 
                      padding: '3px 10px', 
                      borderRadius: '12px' 
                    }}>
                      Option {idx + 1}: {v.archetype}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(v.star_bullet, idx)}
                    style={{
                      background: copiedIdx === idx ? '#ecfdf5' : '#059669',
                      color: copiedIdx === idx ? '#059669' : '#ffffff',
                      border: `1px solid ${copiedIdx === idx ? '#a7f3d0' : '#059669'}`,
                      borderRadius: '6px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    {copiedIdx === idx ? <Check size={14} /> : <Copy size={14} />}
                    {copiedIdx === idx ? 'Copied to Clipboard!' : '📋 Copy to Paste in Resume'}
                  </button>
                </div>

                <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                  "{v.star_bullet}"
                </p>

                {/* STAR Decomposition Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '11px', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: '700' }}>[S/T] Situation & Task:</span>
                    <div style={{ color: '#1e293b', marginTop: '2px' }}>{v.situation_task}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: '700' }}>[A] Strong Action Verb:</span>
                    <div style={{ color: '#1e293b', marginTop: '2px', fontWeight: '600' }}>{v.action}</div>
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
              padding: '8px 20px', 
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
