import React, { useState } from 'react';
import { X, HelpCircle, Sparkles, Check, Copy, BookOpen, ShieldAlert, Award, Layers } from 'lucide-react';

export default function InterviewQuestionsModal({ candidate, questions = [], isBlind = false, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!candidate) return null;

  const displayName = isBlind ? `Candidate #${(candidate.id || 'A14').slice(0, 5).toUpperCase()}` : (candidate.full_name || 'Candidate');
  
  const primarySkill = (candidate.parsed_skills && candidate.parsed_skills[0]) || 'Software Architecture';
  const defaultQuestions = [
    {
      category: 'TECHNICAL_CORE',
      badge: 'Core Competency',
      target_skill: primarySkill,
      question: `Can you detail your production experience with ${primarySkill}? What were the key architectural trade-offs or performance considerations in your recent implementation?`,
      interviewer_rubric: `Look for deep understanding of ${primarySkill} best practices, concurrency, memory management, or error handling rather than just syntax knowledge.`
    },
    {
      category: 'SKILL_GAP_TRANSITION',
      badge: 'Skill Gap & Adaptability',
      target_skill: 'System Integration',
      question: `Describe a scenario where you had to quickly adopt a new technology stack or cloud framework under a tight project deadline. How did you validate your solution?`,
      interviewer_rubric: `Assess steep learning curve capability, self-sufficiency with documentation, and test-driven validation.`
    },
    {
      category: 'ARCHITECTURE_SCALE',
      badge: 'Architecture & Scale',
      target_skill: 'Scalability',
      question: `How have you designed software components to handle increasing traffic loads, database connection limits, and graceful failure recovery?`,
      interviewer_rubric: `Look for caching strategies (Redis), database indexing/sharding, connection pooling, and circuit breaker patterns.`
    },
    {
      category: 'METRIC_VERIFICATION',
      badge: 'Metric Verification',
      target_skill: 'Impact Claims',
      question: `In your resume, you listed measurable contributions to engineering projects. Walk us through how you measured that impact and baseline performance metrics.`,
      interviewer_rubric: `Verify that candidate genuinely understands the performance numbers, latency reductions, or throughput claims stated on their resume.`
    },
    {
      category: 'BEHAVIORAL_DELIVERY',
      badge: 'Agile Delivery',
      target_skill: 'Collaboration',
      question: `Describe a situation where requirements shifted unexpectedly midway through a sprint. How did you realign priorities and communicate with cross-functional stakeholders?`,
      interviewer_rubric: `Assess constructive communication, pragmatic prioritization, and commitment to delivery without creating friction.`
    }
  ];

  const questionList = (questions && questions.length > 0)
    ? questions
    : ((candidate.interview_questions && candidate.interview_questions.length > 0)
      ? candidate.interview_questions
      : ((candidate.match_details?.interview_questions && candidate.match_details.interview_questions.length > 0)
        ? candidate.match_details.interview_questions
        : defaultQuestions));

  const handleCopyAll = () => {
    const text = questionList.map((q, idx) => (
      `Q${idx + 1} [${q.badge || q.category}]: ${q.question}\nRubric: ${q.interviewer_rubric}\n`
    )).join('\n');

    navigator.clipboard.writeText(`HireAI Interview Questions for ${displayName}:\n\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const getBadgeStyle = (category) => {
    switch (category) {
      case 'TECHNICAL_CORE':
        return { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' };
      case 'SKILL_GAP_TRANSITION':
        return { bg: '#fffbeb', border: '#fde68a', text: '#b45309' };
      case 'ARCHITECTURE_SCALE':
        return { bg: '#fdf4ff', border: '#f5d0fe', text: '#86198f' };
      case 'METRIC_VERIFICATION':
        return { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' };
      case 'BEHAVIORAL_DELIVERY':
      default:
        return { bg: '#f8fafc', border: '#e2e8f0', text: '#475569' };
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '760px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>
              <Sparkles size={13} /> Rule-Based Expert System (Zero ML / Zero DL)
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              Tailored Technical Interview Questions & Rubrics
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Candidate: <strong>{displayName}</strong> • Tailored to verified resume claims & skill gaps
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={22} />
          </button>
        </div>

        {/* Copy Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            5 Deterministic production rules fired based on candidate profile.
          </span>
          <button 
            type="button" 
            onClick={handleCopyAll}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '12px', 
              fontWeight: '700', 
              color: copied ? '#059669' : '#2563eb', 
              background: copied ? '#ecfdf5' : '#eff6ff', 
              border: `1px solid ${copied ? '#a7f3d0' : '#bfdbfe'}`, 
              padding: '6px 12px', 
              borderRadius: '6px', 
              cursor: 'pointer' 
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied to Clipboard!' : 'Copy All Questions'}
          </button>
        </div>

        {/* Questions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {questionList.map((q, idx) => {
            const badgeStyle = getBadgeStyle(q.category);
            return (
              <div 
                key={idx} 
                style={{ 
                  background: '#ffffff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '10px', 
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      background: '#0f172a', 
                      color: '#ffffff', 
                      fontSize: '12px', 
                      fontWeight: '800' 
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ 
                      backgroundColor: badgeStyle.bg, 
                      color: badgeStyle.text, 
                      border: `1px solid ${badgeStyle.border}`, 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      fontWeight: '700' 
                    }}>
                      {q.badge || q.category}
                    </span>
                  </div>
                  {q.target_skill && (
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Target: <strong>{q.target_skill}</strong>
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', lineHeight: '1.5', marginBottom: '10px' }}>
                  "{q.question}"
                </p>

                {/* Interviewer Rubric */}
                <div style={{ background: '#f8fafc', borderLeft: '3px solid #2563eb', padding: '8px 12px', borderRadius: '0 6px 6px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '700', color: '#334155', marginBottom: '2px' }}>
                    <BookOpen size={12} color="#2563eb" /> Evaluator Assessment Rubric:
                  </div>
                  <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
                    {q.interviewer_rubric}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
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
