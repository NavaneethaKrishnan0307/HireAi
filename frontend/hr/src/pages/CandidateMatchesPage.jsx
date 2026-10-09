import React, { useState, useEffect } from 'react';
import { HRAPI } from '../services/api';
import { Sparkles, MapPin, Briefcase, Filter, User, Download, Sliders, Columns, CheckSquare, Square, X } from 'lucide-react';
import MatchModal from '../components/MatchModal';

export default function CandidateMatchesPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Dynamic Weights State
  const [showWeightSliders, setShowWeightSliders] = useState(false);
  const [weights, setWeights] = useState({
    skills: 50,
    experience: 25,
    education: 15,
    additional: 10
  });

  // Candidate Comparison State
  const [comparedCandidateIds, setComparedCandidateIds] = useState([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadApplicants(selectedJobId);
    }
  }, [selectedJobId]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await HRAPI.getJobs();
      setJobs(data);
      if (data.length > 0) {
        setSelectedJobId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadApplicants = async (jobId, customWeights = null) => {
    try {
      setLoading(true);
      const normalizedWeights = customWeights ? {
        skills: customWeights.skills / 100,
        experience: customWeights.experience / 100,
        education: customWeights.education / 100,
        additional: customWeights.additional / 100
      } : {
        skills: weights.skills / 100,
        experience: weights.experience / 100,
        education: weights.education / 100,
        additional: weights.additional / 100
      };
      const data = await HRAPI.getJobApplicants(jobId, normalizedWeights);
      const sorted = Array.isArray(data) ? [...data].sort((a, b) => {
        const scoreA = Number(a.match_score ?? a.score ?? 0);
        const scoreB = Number(b.match_score ?? b.score ?? 0);
        if (Math.abs(scoreB - scoreA) > 0.0001) {
          return scoreB - scoreA;
        }
        const expA = Number(a.years_of_experience ?? 0);
        const expB = Number(b.years_of_experience ?? 0);
        return expB - expA;
      }) : [];
      setApplicants(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyWeights = () => {
    if (selectedJobId) {
      loadApplicants(selectedJobId, weights);
    }
  };

  const handleExportCSV = async () => {
    if (!selectedJobId) return;
    try {
      setExporting(true);
      await HRAPI.exportJobApplicantsCsv(selectedJobId);
    } catch (err) {
      alert(err.message || 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const toggleCompare = (candidateId, e) => {
    e.stopPropagation();
    if (comparedCandidateIds.includes(candidateId)) {
      setComparedCandidateIds(prev => prev.filter(id => id !== candidateId));
    } else {
      if (comparedCandidateIds.length >= 3) {
        alert('You can compare a maximum of 3 candidates side-by-side.');
        return;
      }
      setComparedCandidateIds(prev => [...prev, candidateId]);
    }
  };

  const comparedCandidates = applicants.filter(a => comparedCandidateIds.includes(a.id));

  return (
    <div className="hr-content-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="hr-page-title">Candidate Matches & Pipeline</h2>
          <p className="hr-page-subtitle">Ranked candidate pool evaluated against job criteria via deterministic rules.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            type="button"
            onClick={() => setShowWeightSliders(!showWeightSliders)}
            className="secondary-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '9px 14px' }}
          >
            <Sliders size={16} /> Scoring Weights
          </button>

          <button 
            type="button"
            onClick={handleExportCSV}
            disabled={exporting || applicants.length === 0}
            className="secondary-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '9px 14px' }}
          >
            <Download size={16} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>

          {comparedCandidateIds.length > 1 && (
            <button 
              type="button"
              onClick={() => setShowComparisonModal(true)}
              className="find-candidates-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '9px 14px' }}
            >
              <Columns size={16} /> Compare ({comparedCandidateIds.length})
            </button>
          )}

          <div style={{ minWidth: '240px' }}>
            <select 
              className="form-select" 
              value={selectedJobId} 
              onChange={(e) => setSelectedJobId(e.target.value)}
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.title} ({j.location})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Weight Sliders Panel */}
      {showWeightSliders && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Customize Multi-Criteria Scoring Weights</h4>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Total: {weights.skills + weights.experience + weights.education + weights.additional}%</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                <span>Skills Match</span>
                <span>{weights.skills}%</span>
              </label>
              <input 
                type="range" min="0" max="100" step="5"
                value={weights.skills} 
                onChange={(e) => setWeights({ ...weights, skills: Number(e.target.value) })}
                style={{ width: '100%', marginTop: '6px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                <span>Experience</span>
                <span>{weights.experience}%</span>
              </label>
              <input 
                type="range" min="0" max="100" step="5"
                value={weights.experience} 
                onChange={(e) => setWeights({ ...weights, experience: Number(e.target.value) })}
                style={{ width: '100%', marginTop: '6px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                <span>Education</span>
                <span>{weights.education}%</span>
              </label>
              <input 
                type="range" min="0" max="100" step="5"
                value={weights.education} 
                onChange={(e) => setWeights({ ...weights, education: Number(e.target.value) })}
                style={{ width: '100%', marginTop: '6px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                <span>Certifications</span>
                <span>{weights.additional}%</span>
              </label>
              <input 
                type="range" min="0" max="100" step="5"
                value={weights.additional} 
                onChange={(e) => setWeights({ ...weights, additional: Number(e.target.value) })}
                style={{ width: '100%', marginTop: '6px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
            <button 
              type="button" 
              onClick={handleApplyWeights}
              className="find-candidates-btn"
              style={{ padding: '8px 20px', fontSize: '13px' }}
            >
              Re-Rank Candidates
            </button>
          </div>
        </div>
      )}

      <div className="matches-section">
        {loading ? (
          <p>Evaluating candidate ranking algorithms...</p>
        ) : applicants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#64748b' }}>No applications recorded for this job opening yet.</p>
          </div>
        ) : (
          <table className="candidates-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Select</th>
                <th>Rank</th>
                <th>Candidate</th>
                <th>Skills Match</th>
                <th>Experience</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((cand, idx) => (
                <tr key={cand.id || idx} onClick={() => setSelectedCandidate(cand)}>
                  <td onClick={(e) => toggleCompare(cand.id, e)} style={{ cursor: 'pointer', textAlign: 'center' }}>
                    {comparedCandidateIds.includes(cand.id) ? (
                      <CheckSquare size={18} color="#10b981" />
                    ) : (
                      <Square size={18} color="#94a3b8" />
                    )}
                  </td>
                  <td style={{ fontWeight: '800', color: '#10b981' }}>#{idx + 1}</td>
                  <td>
                    <div className="candidate-cell">
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User size={18} />
                      </div>
                      <div>
                        <h4 className="candidate-name">{cand.full_name}</h4>
                        <p className="candidate-email">{cand.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {(cand.parsed_skills || []).slice(0, 3).map((s) => (
                        <span key={s} style={{ color: '#475569', fontSize: '13px' }}>
                          {s}{(cand.parsed_skills.indexOf(s) < 2 && cand.parsed_skills.indexOf(s) < (cand.parsed_skills.length - 1)) ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{cand.years_of_experience || 3.0} Years</td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      background: cand.application_status === 'shortlisted' ? '#ecfdf5' : '#f1f5f9',
                      color: cand.application_status === 'shortlisted' ? '#059669' : '#475569'
                    }}>
                      {cand.application_status || 'Applied'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="score-badge">
                      {cand.match_score || 85}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Side-by-Side Comparison Modal */}
      {showComparisonModal && (
        <div className="modal-overlay" onClick={() => setShowComparisonModal(false)}>
          <div className="modal-card" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Side-by-Side Candidate Showdown</h3>
                <p style={{ fontSize: '13px', color: '#64748b' }}>Comparing {comparedCandidates.length} candidates against job criteria</p>
              </div>
              <button onClick={() => setShowComparisonModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${comparedCandidates.length}, 1fr)`, gap: '16px' }}>
              {comparedCandidates.map((cand) => (
                <div key={cand.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', background: '#f8fafc' }}>
                  <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{cand.full_name}</h4>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>{cand.email}</p>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: '#059669', margin: '8px 0' }}>
                      {cand.match_score}%
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div><strong>Experience:</strong> {cand.years_of_experience} Years</div>
                    <div><strong>Education:</strong> {cand.education || 'B.Tech'}</div>
                    <div>
                      <strong>Matched Skills:</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {(cand.match_details?.matched_skills || []).map(s => (
                          <span key={s} style={{ background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <strong>Missing Skills:</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {(cand.match_details?.missing_skills || []).map(s => (
                          <span key={s} style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedCandidate && (
        <MatchModal 
          candidate={selectedCandidate} 
          jobId={selectedJobId}
          onClose={() => setSelectedCandidate(null)}
          onStatusChange={(cid, status) => {
            setApplicants(prev => prev.map(a => a.id === cid ? { ...a, application_status: status } : a));
          }}
        />
      )}
    </div>
  );
}
