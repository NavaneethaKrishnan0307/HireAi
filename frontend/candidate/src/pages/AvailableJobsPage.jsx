import React, { useState, useEffect } from 'react';
import { CandidateAPI } from '../services/api';
import { MapPin, Briefcase, IndianRupee, Sparkles, CheckCircle2, Search, Lightbulb } from 'lucide-react';

export default function AvailableJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await CandidateAPI.getJobs();
      setJobs(data);
      const appliedMap = {};
      data.forEach(j => {
        if (j.has_applied) appliedMap[j.id] = true;
      });
      setAppliedJobs(appliedMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 className="page-title">Available Opportunities</h2>
          <p className="page-subtitle">Personalized AI match ratings tailored to your parsed resume profile.</p>
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

      {loading ? (
        <p>Loading matching job recommendations...</p>
      ) : filteredJobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#64748b' }}>No matching job openings found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredJobs.map(job => {
            const hasApplied = appliedJobs[job.id];
            const score = job.match_score || 0;
            const scoreColor = score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#64748b';
            const scoreBg = score >= 80 ? '#ecfdf5' : score >= 60 ? '#fffbeb' : '#f1f5f9';
            const gapAdvice = job.skill_gap_advice || [];

            return (
              <div key={job.id} className="card" style={{ transition: 'box-shadow 0.2s', padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                      {job.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>
                      {job.company} • <MapPin size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> {job.location}
                    </p>
                  </div>

                  {score > 0 && (
                    <div style={{ 
                      backgroundColor: scoreBg, 
                      color: scoreColor, 
                      padding: '6px 14px', 
                      borderRadius: '20px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      fontWeight: '700',
                      fontSize: '13px',
                      border: `1px solid ${scoreColor}33`
                    }}>
                      <Sparkles size={14} />
                      <span>{score}% Match</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#475569', margin: '10px 0' }}>
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
                      const isMatched = (job.matched_skills || []).includes(s);
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

                {/* Skill Gap Advice */}
                {gapAdvice.length > 0 && !hasApplied && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontWeight: '700', fontSize: '12px', marginBottom: '4px' }}>
                      <Lightbulb size={14} /> Skill Gap Advisor
                    </div>
                    <p style={{ fontSize: '12px', color: '#78350f', margin: 0 }}>
                      {gapAdvice[0].recommendation}
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  {hasApplied ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: '600', fontSize: '14px', padding: '8px 16px' }}>
                      <CheckCircle2 size={16} /> Applied
                    </span>
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
    </div>
  );
}
