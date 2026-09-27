import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, ArrowRight, Sparkles, UserX, User } from 'lucide-react';
import { HRAPI } from '../services/api';
import MatchModal from '../components/MatchModal';

export default function JobFindPage() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Form State
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [education, setEducation] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [certifications, setCertifications] = useState('');

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await HRAPI.getDashboard();
      setCandidates(data.top_matches || []);
    } catch (err) {
      console.error(err);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    try {
      setLoading(true);
      const minExp = experience === '0-2' ? 1.0 : experience === '3-5' ? 3.0 : experience === '5+' ? 5.0 : 0.0;
      const res = await HRAPI.searchCandidates({
        skills,
        location,
        min_experience: minExp,
        min_salary: parseFloat(minSalary) || 0,
        max_salary: parseFloat(maxSalary) || 0,
        education,
        title: jobTitle,
        certifications
      });
      setCandidates(res.results || []);
    } catch (err) {
      alert(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hr-content-area">
      <h2 className="hr-page-title">Job Find</h2>
      <p className="hr-page-subtitle">Fill in the job details to find the best matching candidates.</p>

      {/* Search Criteria Form */}
      <div className="job-find-card">
        <form onSubmit={handleSearch}>
          <div className="form-grid-2col">
            {/* Skills */}
            <div className="form-group">
              <label className="form-label">Skills</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Python, SQL, Java" 
                value={skills} 
                onChange={(e) => setSkills(e.target.value)} 
              />
            </div>

            {/* Location */}
            <div className="form-group">
              <label className="form-label">Location</label>
              <div className="input-with-icon">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Chennai, Bangalore" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                />
                <MapPin size={16} className="input-icon-right" />
              </div>
            </div>

            {/* Experience */}
            <div className="form-group">
              <label className="form-label">Experience (Years)</label>
              <select 
                className="form-select" 
                value={experience} 
                onChange={(e) => setExperience(e.target.value)}
              >
                <option value="">Select experience</option>
                <option value="0-2">0 - 2 Years (Junior)</option>
                <option value="3-5">3 - 5 Years (Mid-Senior)</option>
                <option value="5+">5+ Years (Senior / Lead)</option>
              </select>
            </div>

            {/* Salary Range */}
            <div className="form-group">
              <label className="form-label">Salary Range (₹)</label>
              <div className="salary-range-inputs">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Min Salary" 
                  value={minSalary} 
                  onChange={(e) => setMinSalary(e.target.value)} 
                />
                <span className="salary-dash">-</span>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Max Salary" 
                  value={maxSalary} 
                  onChange={(e) => setMaxSalary(e.target.value)} 
                />
              </div>
            </div>

            {/* Education */}
            <div className="form-group">
              <label className="form-label">Education</label>
              <select 
                className="form-select" 
                value={education} 
                onChange={(e) => setEducation(e.target.value)}
              >
                <option value="">Select education</option>
                <option value="B.Tech/B.E.">B.Tech / B.E. / B.Sc Computer Science</option>
                <option value="MCA/M.Tech">MCA / M.Tech / M.S.</option>
                <option value="Any Graduate">Any Graduate</option>
              </select>
            </div>

            {/* Job Title / Role */}
            <div className="form-group">
              <label className="form-label">Job Title / Role</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Software Engineer" 
                value={jobTitle} 
                onChange={(e) => setJobTitle(e.target.value)} 
              />
            </div>

            {/* Certifications (Optional) */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Certifications (Optional)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. AWS, Microsoft, PMP" 
                value={certifications} 
                onChange={(e) => setCertifications(e.target.value)} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="find-candidates-btn" disabled={loading}>
              <Search size={16} />
              <span>{loading ? 'Evaluating Rules...' : 'Find Candidates'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Top Candidate Matches Section */}
      <section className="matches-section">
        <div className="matches-header">
          <h3 className="matches-title">Top Candidate Matches</h3>
          {candidates.length > 0 && (
            <span className="view-all-link" onClick={() => navigate('/candidates')}>
              View All Candidates <ArrowRight size={14} />
            </span>
          )}
        </div>

        {loading ? (
          <p style={{ color: '#64748b', padding: '20px 0', textAlign: 'center' }}>Searching candidate database...</p>
        ) : candidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <UserX size={40} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>No Candidates Found</h4>
            <p style={{ fontSize: '13px' }}>The database is currently empty. As candidates register and upload resumes, they will be evaluated and ranked here.</p>
          </div>
        ) : (
          <>
            <table className="candidates-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Skills Match</th>
                  <th>Experience</th>
                  <th style={{ textAlign: 'center' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((cand) => (
                  <tr key={cand.id} onClick={() => setSelectedCandidate(cand)}>
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
                    <td style={{ color: '#0f172a', fontWeight: '500' }}>
                      {cand.years_of_experience || 0} Years
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="score-badge">
                        {cand.score || 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="view-all-btn-center">
              <button 
                type="button" 
                className="view-all-outline-btn"
                onClick={() => navigate('/candidates')}
              >
                View All Candidates
              </button>
            </div>
          </>
        )}
      </section>

      {/* Explainable AI Modal */}
      {selectedCandidate && (
        <MatchModal 
          candidate={selectedCandidate} 
          onClose={() => setSelectedCandidate(null)} 
        />
      )}
    </div>
  );
}
