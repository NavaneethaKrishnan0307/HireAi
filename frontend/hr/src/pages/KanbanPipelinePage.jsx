import React, { useState, useEffect } from 'react';
import { HRAPI } from '../services/api';
import { 
  Sparkles, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  HelpCircle, 
  FileText, 
  User, 
  ChevronRight, 
  Filter, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Award,
  RefreshCw
} from 'lucide-react';
import InterviewQuestionsModal from '../components/InterviewQuestionsModal';
import ProofTraceModal from '../components/ProofTraceModal';
import ResumeReportModal from '../components/ResumeReportModal';

const STAGE_CONFIG = [
  { id: 'applied', label: 'Screened & Applied', icon: '📥', color: '#3b82f6', bg: '#eff6ff' },
  { id: 'shortlisted', label: 'Shortlisted', icon: '⭐', color: '#8b5cf6', bg: '#f5f3ff' },
  { id: 'technical_assessment', label: 'Tech Assessment', icon: '💻', color: '#06b6d4', bg: '#ecfeff' },
  { id: 'interview_scheduled', label: 'Interview Scheduled', icon: '🎙️', color: '#f59e0b', bg: '#fffbeb' },
  { id: 'offer_extended', label: 'Offer Extended', icon: '🎉', color: '#10b981', bg: '#ecfdf5' },
  { id: 'rejected', label: 'Archived / Rejected', icon: '❌', color: '#ef4444', bg: '#fef2f2' }
];

export default function KanbanPipelinePage() {
  const [pipelineData, setPipelineData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Blind Screening Mode State
  const [isBlindMode, setIsBlindMode] = useState(false);

  // Modals state
  const [activeQuestionsCandidate, setActiveQuestionsCandidate] = useState(null);
  const [activeProofTraceCandidate, setActiveProofTraceCandidate] = useState(null);
  const [activeReportCandidate, setActiveReportCandidate] = useState(null);

  useEffect(() => {
    loadPipeline();
  }, [selectedJobId]);

  const loadPipeline = async () => {
    try {
      setLoading(true);
      const data = await HRAPI.getPipeline(selectedJobId || null);
      setPipelineData(data.pipeline_stages || {});
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Failed to load pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveStage = async (appItem, targetStage) => {
    try {
      await HRAPI.movePipelineStage({
        applicationId: appItem.application_id,
        candidateId: appItem.candidate_id,
        jobId: appItem.job_id,
        targetStage
      });
      await loadPipeline();
    } catch (err) {
      alert(err.message || 'Failed to move candidate stage');
    }
  };

  const getMaskedCandidate = (candidate) => {
    if (!isBlindMode) return candidate;
    const cid = String(candidate.id || candidate.user_id || '999');
    const hash = cid.slice(0, 5).toUpperCase();
    return {
      ...candidate,
      full_name: `Candidate #${hash}`,
      email: `candidate.${hash.toLowerCase()}@verified.talent`,
      phone: '+XX ••••••••••',
      college: '[Verified Accredited Institution]',
      avatar_url: null
    };
  };

  return (
    <div className="hr-content-area" style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px 30px' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>
            <Sparkles size={13} /> Pure Classical FOAI Recruitment Pipeline
          </div>
          <h2 className="hr-page-title" style={{ margin: 0, fontSize: '24px' }}>Recruitment Kanban Pipeline</h2>
          <p className="hr-page-subtitle" style={{ margin: '4px 0 0 0' }}>
            Deterministic state-transition hiring board with bias-free Blind Screening & Explainable AI.
          </p>
        </div>

        {/* Controls: Blind Mode Toggle & Job Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Blind Screening Toggle */}
          <button
            type="button"
            onClick={() => setIsBlindMode(!isBlindMode)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: isBlindMode ? '#0f172a' : '#ffffff',
              color: isBlindMode ? '#ffffff' : '#0f172a',
              border: `1px solid ${isBlindMode ? '#0f172a' : '#cbd5e1'}`,
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: isBlindMode ? '0 2px 8px rgba(15, 23, 42, 0.25)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {isBlindMode ? <EyeOff size={16} color="#38bdf8" /> : <Eye size={16} color="#64748b" />}
            <span>Blind Screening Mode: <strong>{isBlindMode ? 'ON (PII Masked)' : 'OFF'}</strong></span>
          </button>

          {/* Job Filter Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="form-input"
              style={{ padding: '8px 14px', fontSize: '13px', width: '220px', borderRadius: '8px' }}
            >
              <option value="">All Requisitions</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.title} ({j.company})</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={loadPipeline}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Refresh Pipeline"
          >
            <RefreshCw size={15} color="#475569" />
          </button>
        </div>
      </div>

      {/* Blind Mode Notice Banner */}
      {isBlindMode && (
        <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: '12px 18px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} color="#38bdf8" />
            <div>
              <strong style={{ fontSize: '13px', color: '#38bdf8' }}>Anonymous / Blind Screening Active:</strong>
              <span style={{ fontSize: '12px', color: '#cbd5e1', marginLeft: '6px' }}>
                Candidate names, photos, emails, phone numbers, and universities are masked to guarantee 100% merit-based, bias-free technical evaluation.
              </span>
            </div>
          </div>
          <span style={{ fontSize: '11px', backgroundColor: '#1e293b', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
            Zero-Bias Mode
          </span>
        </div>
      )}

      {/* Kanban Board Container */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <RefreshCw size={32} color="#2563eb" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 12px auto' }} />
          <p style={{ color: '#64748b', fontSize: '14px' }}>Loading pipeline stages and match scores...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(240px, 1fr))', gap: '14px', overflowX: 'auto', alignItems: 'start', paddingBottom: '20px' }}>
          {STAGE_CONFIG.map((col) => {
            const items = (pipelineData && pipelineData[col.id]) || [];
            return (
              <div 
                key={col.id} 
                style={{ 
                  background: '#f8fafc', 
                  borderRadius: '10px', 
                  border: '1px solid #e2e8f0', 
                  minHeight: '600px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Column Header */}
                <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', borderRadius: '10px 10px 0 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>{col.icon}</span>
                    <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      {col.label}
                    </h3>
                  </div>
                  <span style={{ 
                    backgroundColor: col.bg, 
                    color: col.color, 
                    fontSize: '11px', 
                    fontWeight: '800', 
                    padding: '2px 8px', 
                    borderRadius: '10px',
                    border: `1px solid ${col.color}33`
                  }}>
                    {items.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  {items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '12px' }}>
                      No candidates in this stage
                    </div>
                  ) : (
                    items.map((item) => {
                      const cand = getMaskedCandidate(item.candidate || {});
                      const score = item.match_score || 0;
                      const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
                      const scoreBg = score >= 80 ? '#ecfdf5' : score >= 50 ? '#fffbeb' : '#fef2f2';

                      const parsedSkills = cand.parsed_skills || [];

                      return (
                        <div
                          key={item.application_id || item.candidate_id}
                          style={{
                            background: '#ffffff',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            padding: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          {/* Card Header: Candidate Info & Score */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                            <div>
                              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
                                {cand.full_name}
                              </h4>
                              <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                                {item.job_title}
                              </p>
                            </div>
                            <div style={{ 
                              backgroundColor: scoreBg, 
                              color: scoreColor, 
                              border: `1px solid ${scoreColor}44`, 
                              padding: '2px 6px', 
                              borderRadius: '6px', 
                              fontSize: '11px', 
                              fontWeight: '900' 
                            }}>
                              {score}%
                            </div>
                          </div>

                          {/* Experience & Skills */}
                          <div style={{ fontSize: '11px', color: '#475569' }}>
                            <span>Exp: <strong>{cand.years_of_experience || 0} yrs</strong></span>
                            {cand.education && (
                              <span> • {isBlindMode ? '[Degree Verified]' : cand.education.split(' ')[0]}</span>
                            )}
                          </div>

                          {/* Skill Tags */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {parsedSkills.slice(0, 3).map((skill, sIdx) => (
                              <span 
                                key={sIdx}
                                style={{ 
                                  backgroundColor: '#f1f5f9', 
                                  color: '#334155', 
                                  fontSize: '10px', 
                                  padding: '1px 5px', 
                                  borderRadius: '4px',
                                  fontWeight: '600'
                                }}
                              >
                                {skill}
                              </span>
                            ))}
                            {parsedSkills.length > 3 && (
                              <span style={{ fontSize: '10px', color: '#94a3b8' }}>+{parsedSkills.length - 3}</span>
                            )}
                          </div>

                          {/* Quick Tool Links */}
                          <div style={{ display: 'flex', gap: '4px', marginTop: '4px', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                            <button
                              type="button"
                              onClick={() => setActiveQuestionsCandidate({
                                ...cand,
                                interview_questions: item.interview_questions || item.match_details?.interview_questions || []
                              })}
                              style={{
                                flex: 1,
                                background: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe',
                                borderRadius: '4px',
                                padding: '4px 0',
                                fontSize: '10px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px'
                              }}
                              title="Tailored Interview Questions"
                            >
                              <HelpCircle size={11} /> Questions
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveProofTraceCandidate({
                                name: cand.full_name,
                                proof: item.proof_trace || item.match_details?.proof_trace
                              })}
                              style={{
                                flex: 1,
                                background: '#f0fdf4',
                                color: '#16a34a',
                                border: '1px solid #bbf7d0',
                                borderRadius: '4px',
                                padding: '4px 0',
                                fontSize: '10px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px'
                              }}
                              title="Decision Proof Tree"
                            >
                              <Sparkles size={11} /> Proof Tree
                            </button>
                          </div>

                          {/* Stage Transition Selector */}
                          <div style={{ marginTop: '2px' }}>
                            <select
                              value={col.id}
                              onChange={(e) => handleMoveStage(item, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '4px 6px',
                                fontSize: '11px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#334155',
                                fontWeight: '600'
                              }}
                            >
                              <option disabled value="">Move to stage...</option>
                              {STAGE_CONFIG.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.icon} {s.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {activeQuestionsCandidate && (
        <InterviewQuestionsModal
          candidate={activeQuestionsCandidate}
          questions={activeQuestionsCandidate.interview_questions || []}
          isBlind={isBlindMode}
          onClose={() => setActiveQuestionsCandidate(null)}
        />
      )}

      {activeProofTraceCandidate && (
        <ProofTraceModal
          candidateName={activeProofTraceCandidate.name}
          proofTrace={activeProofTraceCandidate.proof}
          onClose={() => setActiveProofTraceCandidate(null)}
        />
      )}

      {activeReportCandidate && (
        <ResumeReportModal
          candidateId={activeReportCandidate.id || activeReportCandidate.user_id}
          candidateName={activeReportCandidate.full_name}
          onClose={() => setActiveReportCandidate(null)}
        />
      )}
    </div>
  );
}
