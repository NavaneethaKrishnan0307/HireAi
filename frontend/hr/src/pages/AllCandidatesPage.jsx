import React, { useState, useEffect } from 'react';
import { Search, Folder, User, Mail, MapPin, Briefcase, GraduationCap, CheckCircle2 } from 'lucide-react';
import { HRAPI } from '../services/api';
import MatchModal from '../components/MatchModal';

export default function AllCandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const data = await HRAPI.getAllCandidates();
      setCandidates(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = candidates.filter(c => {
    const q = searchQuery.toLowerCase();
    const nameMatch = c.full_name?.toLowerCase().includes(q);
    const emailMatch = c.email?.toLowerCase().includes(q);
    const skillsMatch = (c.parsed_skills || []).some(s => s.toLowerCase().includes(q));
    return nameMatch || emailMatch || skillsMatch;
  });

  return (
    <div className="hr-content-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 className="hr-page-title">Candidate Talent Directory</h2>
          <p className="hr-page-subtitle">Indexed candidates with parsed resume skills, certifications, and experience.</p>
        </div>

        <div className="input-with-icon" style={{ width: '280px' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search candidate name or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={16} className="input-icon-right" />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading candidates directory...</div>
      ) : filtered.length === 0 ? (
        <div className="job-find-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
          <Folder size={40} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>No Candidates Found</h4>
          <p style={{ fontSize: '13px' }}>No candidates match your search query or have registered yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filtered.map(cand => (
            <div key={cand.id} className="job-find-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{cand.full_name}</h3>
                    <p style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {cand.email} {cand.location ? `• ${cand.location}` : ''}
                    </p>
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.8', marginBottom: '16px' }}>
                  <div><strong>Role:</strong> {cand.current_title || 'Software Developer'}</div>
                  <div><strong>Experience:</strong> {cand.years_of_experience || 0} Years</div>
                  <div><strong>Education:</strong> {cand.education || 'Graduate'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Skills:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(cand.parsed_skills || []).length > 0 ? (
                      cand.parsed_skills.map(s => (
                        <span key={s} style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>
                          {s}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>No skills extracted yet</span>
                    )}
                  </div>
                </div>
              </div>

              <button 
                type="button" 
                className="view-all-outline-btn" 
                style={{ width: '100%', marginTop: '20px', padding: '10px' }}
                onClick={() => setSelectedCandidate(cand)}
              >
                Evaluate Candidate Profile
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedCandidate && (
        <MatchModal 
          candidate={selectedCandidate} 
          onClose={() => setSelectedCandidate(null)} 
        />
      )}
    </div>
  );
}
