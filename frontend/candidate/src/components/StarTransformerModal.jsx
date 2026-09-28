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
  HelpCircle,
  Eye,
  Briefcase,
  Calendar,
  CheckCheck
} from 'lucide-react';
import { CandidateAPI } from '../services/api';

const QUICK_EXAMPLES = [
  "worked on backend features for customer payments",
  "helped with fixing bugs in react frontend",
  "responsible for database queries and performance",
  "participated in cloud deployment and automation"
];

export default function StarTransformerModal({ initialBullet = '', onClose, onApplyToResume }) {
  const [rawBullet, setRawBullet] = useState(initialBullet || 'worked on backend features for customer payments');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [appliedToast, setAppliedToast] = useState(false);

  useEffect(() => {
    handleTransform(initialBullet || 'worked on backend features for customer payments');
  }, [initialBullet]);

  const handleTransform = async (textToTransform = rawBullet) => {
    if (!textToTransform || !textToTransform.trim()) return;
    try {
      setLoading(true);
      const data = await CandidateAPI.transformBullet(textToTransform.trim());
      setResult(data);
      setSelectedIdx(0);
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

  const selectedBullet = result?.variations?.[selectedIdx]?.star_bullet || rawBullet;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '860px', maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#fdf4ff', color: '#9333ea', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>
              <Sparkles size={13} /> AI Resume Bullet Point Optimizer & Live Preview
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              Deterministic STAR Bullet Transformer
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Turn weak, passive resume lines into powerful, quantified achievements and preview them live in your resume.
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
              <strong style={{ fontSize: '13px', color: '#1e40af' }}>How does this help your job applications?</strong>
              <p style={{ fontSize: '12px', color: '#334155', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                HR recruiters and automated ATS systems reject generic statements like <em>"Worked on APIs"</em> or <em>"Helped fix bugs"</em>. 
                This tool automatically upgrades your line using the industry-gold-standard <strong>STAR method</strong> (<strong>S</strong>ituation, <strong>T</strong>ask, <strong>A</strong>ction Verb, <strong>R</strong>esult Metric). 
                See the live comparison and resume document preview below!
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
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Or click a 1-click sample: </span>
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

        {/* Side-by-Side Before vs After Comparison */}
        {result && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '12px', 
            marginBottom: '20px',
            background: '#0f172a',
            padding: '16px',
            borderRadius: '10px',
            color: '#ffffff'
          }}>
            {/* Before (Weak) */}
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>
                ❌ Before: Weak Resume Line (Low Impact)
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#fca5a5', lineHeight: 1.4 }}>
                "{rawBullet}"
              </p>
              <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '10px', color: '#f87171' }}>
                • Lacks action verbs • No measurable numbers • Low ATS score
              </span>
            </div>

            {/* After (Supercharged STAR) */}
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>
                ✅ After: Supercharged STAR Bullet (High Impact)
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#6ee7b7', fontWeight: '600', lineHeight: 1.4 }}>
                "{selectedBullet}"
              </p>
              <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '10px', color: '#34d399' }}>
                • Strong action verb • Quantified result metric • Passes ATS filters
              </span>
            </div>
          </div>
        )}

        {/* Live Resume Document Preview Section */}
        {result && (
          <div style={{ marginBottom: '24px', background: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '10px', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: '800', fontSize: '13px' }}>
                <Eye size={16} color="#2563eb" /> Live Resume Document Preview (How Recruiters See It)
              </div>
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '10px' }}>
                ✓ ATS-Optimized Layout
              </span>
            </div>

            {/* Formatted Mini Resume Experience Block */}
            <div style={{ fontFamily: 'Georgia, serif', background: '#fafafa', padding: '16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', marginBottom: '8px' }}>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>Software Engineer / Developer</strong>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Tech Innovations Inc. | 2023 - Present</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                <li>Collaborated with cross-functional engineering teams to architect scalable services.</li>
                <li style={{ backgroundColor: '#fef08a', color: '#0f172a', fontWeight: '600', padding: '2px 4px', borderRadius: '4px' }}>
                  {selectedBullet}
                </li>
                <li>Participated in daily agile standups, code reviews, and automated CI/CD deployments.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Output Variations List */}
        {result && result.variations && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                ⚡ 3 High-Impact STAR Variations (Click to select & preview):
              </h4>
              <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>
                Click any option to preview in document above
              </span>
            </div>

            {result.variations.map((v, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedIdx(idx)}
                  style={{
                    background: isSelected ? '#faf5ff' : '#ffffff',
                    border: `2px solid ${isSelected ? '#9333ea' : '#e2e8f0'}`,
                    borderRadius: '10px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: isSelected ? '0 2px 8px rgba(147, 51, 234, 0.15)' : '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        backgroundColor: isSelected ? '#9333ea' : '#eff6ff', 
                        color: isSelected ? '#ffffff' : '#2563eb', 
                        fontSize: '11px', 
                        fontWeight: '800', 
                        padding: '3px 10px', 
                        borderRadius: '12px' 
                      }}>
                        Option {idx + 1}: {v.archetype} {isSelected && '✓ (Active Preview)'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(v.star_bullet, idx);
                      }}
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
                      {copiedIdx === idx ? 'Copied!' : '📋 Copy to Paste in Resume'}
                    </button>
                  </div>

                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                    "{v.star_bullet}"
                  </p>

                  {/* STAR Decomposition Breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '11px', background: isSelected ? '#ffffff' : '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
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
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{ 
              padding: '8px 20px', 
              borderRadius: '6px', 
              background: '#f1f5f9', 
              color: '#475569', 
              fontSize: '13px', 
              fontWeight: '700', 
              border: '1px solid #cbd5e1', 
              cursor: 'pointer' 
            }}
          >
            Close
          </button>

          <button 
            type="button" 
            onClick={() => handleCopy(selectedBullet, 999)}
            className="choose-btn"
            style={{ margin: 0, padding: '10px 24px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#059669' }}
          >
            <CheckCheck size={16} /> Copy Active STAR Bullet ({copiedIdx === 999 ? 'Copied!' : 'Ready to Paste'})
          </button>
        </div>
      </div>
    </div>
  );
}
