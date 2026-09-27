import React, { useState, useEffect } from 'react';
import { HRAPI } from '../services/api';
import { Sparkles, MapPin, Briefcase, Filter, User } from 'lucide-react';
import MatchModal from '../components/MatchModal';

export default function CandidateMatchesPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

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

  const loadApplicants = async (jobId) => {
    try {
      setLoading(true);
      const data = await HRAPI.getJobApplicants(jobId);
      setApplicants(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hr-content-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="hr-page-title">Candidate Matches & Pipeline</h2>
          <p className="hr-page-subtitle">Ranked candidate pool evaluated against job criteria via deterministic rules.</p>
        </div>

        <div style={{ minWidth: '280px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Select Active Job Opening</label>
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

      {selectedCandidate && (
        <MatchModal 
          candidate={selectedCandidate} 
          onClose={() => setSelectedCandidate(null)}
          onStatusChange={(cid, status) => {
            setApplicants(prev => prev.map(a => a.id === cid ? { ...a, application_status: status } : a));
          }}
        />
      )}
    </div>
  );
}
