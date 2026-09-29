import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CandidateAPI } from '../services/api';
import { 
  MapPin, 
  Briefcase, 
  IndianRupee, 
  Sparkles, 
  CheckCircle2, 
  Search, 
  Lightbulb, 
  ArrowUpRight, 
  Zap, 
  Target,
  AlertTriangle,
  UploadCloud,
  Lock,
  FileText
} from 'lucide-react';
import JobSimulatorModal from '../components/JobSimulatorModal';

export default function AvailableJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [simulatingJob, setSimulatingJob] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await CandidateAPI.getJobs();
      setJobs(data);
      const appliedMap = {};
      let allComplete = true;
      data.forEach(j => {
        if (j.has_applied) appliedMap[j.id] = true;
        if (j.is_profile_complete === false) allComplete = false;
      });
      setAppliedJobs(appliedMap);
      setIsProfileComplete(allComplete);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    if (!isProfileComplete) {
      alert('Application Blocked: Please upload your resume and complete your profile before applying for opportunities.');
      return;
    }
    try {
      setApplyingId(jobId);
      await CandidateAPI.applyToJob(jobId);
      setAppliedJobs(prev => ({ ...prev, [jobId]: true }));
      alert('Application submitted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to apply');
    } finally {
      setApplyingId(null);
    }
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (j.required_skills && j.required_skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="content-area">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="page-title" style={{ margin: 0 }}>Available Opportunities</h2>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
            Live open positions across partner enterprises with explainable matching and gap analysis.
          </p>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search role or skill..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Incomplete Profile / View-Only Mode Banner */}
      {!loading && !isProfileComplete && (
        <div style={{ 
          backgroundColor: '#fffbeb', 
          border: '1px solid #fde68a', 
          borderRadius: '12px', 
          padding: '16px 20px', 
          marginBottom: '20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '14px',
          boxShadow: '0 2px 8px rgba(217, 119, 6, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
            <AlertTriangle size={24} color="#d97706" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#92400e' }}>
                View-Only Mode: Profile Incomplete (0% Match Gated)
              </h4>
              <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#b45309', lineHeight: 1.4 }}>
                You can browse all live corporate openings. To calculate your personalized AI match rating and unlock 1-click job applications, upload your resume and complete your profile.
              </p>
            </div>
          </div>
          <Link 
            to="/upload" 
            className="choose-btn" 
            style={{ 
              margin: 0, 
              padding: '9px 18px', 
              fontSize: '13px', 
              fontWeight: '700',
              backgroundColor: '#d97706', 
              textDecoration: 'none', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <UploadCloud size={15} /> Upload Resume to Unlock Apply
          </Link>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#64748b', fontSize: '14px' }}>Loading matching job opportunities...</p>
      ) : filteredJobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#64748b' }}>No matching job openings found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {filteredJobs.map(job => {
            const hasApplied = appliedJobs[job.id];
            const isComplete = job.is_profile_complete !== false;
            const score = isComplete ? (job.match_score || 0) : 0;
            const scoreColor = !isComplete ? '#64748b' : score >= 80 ? '#059669' : score >= 50 ? '#d97706' : '#64748b';
            const scoreBg = !isComplete ? '#f1f5f9' : score >= 80 ? '#ecfdf5' : score >= 50 ? '#fffbeb' : '#f1f5f9';
            const gapAdvice = job.skill_gap_advice || [];
            const missingSkills = job.missing_skills || [];

            return (
              <div key={job.id} className="card" style={{ transition: 'box-shadow 0.2s', padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                      {job.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>
                      {job.company} • <MapPin size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> {job.location}
                    </p>
                  </div>

                  <div style={{ 
                    backgroundColor: scoreBg, 
                    color: scoreColor, 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontWeight: '800',
                    fontSize: '13px',
                    border: `1px solid ${scoreColor}33`
                  }}>
                    <Sparkles size={14} />
                    <span>{isComplete ? `${score}% Match` : '0% Match (Profile Incomplete)'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#475569', margin: '10px 0', flexWrap: 'wrap' }}>
                  <span><strong>Experience:</strong> {job.min_experience}+ Years</span>
                  <span><strong>Education:</strong> {job.education_required}</span>
                  {job.min_salary > 0 && (
                    <span><strong>Salary:</strong> ₹{(job.min_salary / 100000).toFixed(1)}L - ₹{(job.max_salary / 100000).toFixed(1)}L PA</span>
                  )}
                </div>

                <p style={{ fontSize: '13px', color: '#475569', margin: '10px 0 14px 0', lineHeight: 1.5 }}>
                  {job.description}
                </p>

                <div style={{ marginBottom: '14px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Required Skills:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {job.required_skills?.map(s => {
                      const isMatched = isComplete && (job.matched_skills || []).includes(s);
                      return (
                        <span 
                          key={s} 
                          className="skill-tag"
                          style={{
                            backgroundColor: isMatched ? '#eff6ff' : '#f8fafc',
                            borderColor: isMatched ? '#93c5fd' : '#e2e8f0',
                            color: isMatched ? '#1e40af' : '#64748b'
                          }}
                        >
                          {isMatched ? '✓ ' : ''}{s}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Always-Visible Skill Gap Advisor Box */}
                <div style={{ 
                  background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', 
                  border: '1px solid #fde68a', 
                  borderRadius: '10px', 
                  padding: '12px 16px', 
                  marginBottom: '16px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontWeight: '800', fontSize: '13px', marginBottom: '6px' }}>
                    <Lightbulb size={16} /> Skill Gap Advisor & Recommendations
                  </div>
                  {!isComplete ? (
                    <p style={{ fontSize: '12px', color: '#78350f', margin: 0 }}>
                      ⚠️ Profile Incomplete: Upload your resume in the <Link to="/upload" style={{ color: '#b45309', fontWeight: '700' }}>Resume Upload Portal</Link> to automatically extract your skills, calculate your exact fit score, and qualify for applications.
                    </p>
                  ) : gapAdvice.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {gapAdvice.slice(0, 2).map((item, idx) => (
                        <p key={idx} style={{ fontSize: '12px', color: '#78350f', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ArrowUpRight size={13} /> {item.recommendation}
                        </p>
                      ))}
                    </div>
                  ) : missingSkills.length > 0 ? (
                    <p style={{ fontSize: '12px', color: '#78350f', margin: 0 }}>
                      Missing skills: <strong>{missingSkills.join(', ')}</strong>. Upload your updated resume to verify your qualifications and boost your match rating!
                    </p>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#065f46', margin: 0, fontWeight: '600' }}>
                      ✓ Outstanding match! You possess all core required skills for this position.
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSimulatingJob(job)}
                    style={{
                      backgroundColor: '#f8fafc',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Zap size={14} color="#2563eb" /> Simulate Match & Skill Delta
                  </button>

                  {hasApplied ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: '700', fontSize: '13px', padding: '8px 16px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                      <CheckCircle2 size={16} /> Application Submitted
                    </span>
                  ) : !isComplete ? (
                    <Link
                      to="/upload"
                      className="choose-btn"
                      style={{
                        margin: 0,
                        padding: '10px 20px',
                        textDecoration: 'none',
                        backgroundColor: '#475569',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Lock size={14} /> Upload Resume to Apply
                    </Link>
                  ) : (
                    <button 
                      className="choose-btn" 
                      onClick={() => handleApply(job.id)} 
                      disabled={applyingId === job.id}
                      style={{ margin: 0, padding: '10px 24px' }}
                    >
                      {applyingId === job.id ? 'Submitting...' : 'Apply Now'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {simulatingJob && (
        <JobSimulatorModal
          job={simulatingJob}
          onApply={(jobId) => handleApply(jobId)}
          onClose={() => setSimulatingJob(null)}
        />
      )}
    </div>
  );
}
