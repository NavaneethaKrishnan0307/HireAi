import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Target, 
  Calculator, 
  Award,
  RefreshCw
} from 'lucide-react';
import { CandidateAPI } from '../services/api';

export default function JobSimulatorModal({ job, onApply, onClose }) {
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulatedSkills, setSimulatedSkills] = useState([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [simulatedExp, setSimulatedExp] = useState(null);

  useEffect(() => {
    runSimulation([]);
  }, [job]);

  const runSimulation = async (addedSkills = simulatedSkills, exp = simulatedExp) => {
    if (!job) return;
    try {
      setLoading(true);
      const res = await CandidateAPI.simulateJobMatch(job.id, {
        added_skills: addedSkills,
        simulated_years_experience: exp
      });
      setSimulation(res);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSkill = (skill) => {
    let nextSkills;
    if (simulatedSkills.includes(skill)) {
      nextSkills = simulatedSkills.filter(s => s !== skill);
    } else {
      nextSkills = [...simulatedSkills, skill];
    }
    setSimulatedSkills(nextSkills);
    runSimulation(nextSkills, simulatedExp);
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    if (!customSkillInput.trim()) return;
    const skill = customSkillInput.trim();
    if (!simulatedSkills.includes(skill)) {
      const nextSkills = [...simulatedSkills, skill];
      setSimulatedSkills(nextSkills);
      runSimulation(nextSkills, simulatedExp);
    }
    setCustomSkillInput('');
  };

  if (!job) return null;

  const baseScore = simulation?.base_score || job.match_score || 0;
  const simScore = simulation?.simulated_score ?? baseScore;
  const delta = simulation?.score_delta ?? 0;
  const roadmap = simulation?.heuristic_skill_roadmap || [];
  const missingSkills = job.missing_skills || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>
              <Sparkles size={13} /> Pure Classical FOAI Pre-Application Job Simulator
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              Simulate Match: {job.title}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              {job.company} • Calculate your projected score delta Δ(Job, Candidate) before officially applying
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={22} />
          </button>
        </div>

        {/* Score Comparison Hero Box */}
        <div style={{ 
          background: 'linear-gradient(135deg, #0f172a, #1e293b)', 
          color: '#ffffff', 
          borderRadius: '12px', 
          padding: '20px 24px', 
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            {/* Current Score */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Current Verified Match
              </span>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#f8fafc', marginTop: '4px' }}>
                {baseScore}%
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <ArrowRight size={24} color="#38bdf8" />
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '800', 
                backgroundColor: delta > 0 ? '#059669' : '#334155', 
                color: '#ffffff', 
                padding: '2px 8px', 
                borderRadius: '10px' 
              }}>
                {delta >= 0 ? `+${delta}% Delta` : `${delta}%`}
              </span>
            </div>

            {/* Projected Score */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                Projected Simulated Score
              </span>
              <div style={{ fontSize: '36px', fontWeight: '900', color: '#34d399', marginTop: '4px' }}>
                {simScore}%
              </div>
            </div>
          </div>

          {simulation?.actionable_insight && (
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #334155', fontSize: '12px', color: '#cbd5e1', textAlign: 'center' }}>
              💡 <strong>Heuristic Projection:</strong> {simulation.actionable_insight}
            </div>
          )}
        </div>

        {/* Interactive Heuristic Skill Playground */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={16} color="#2563eb" /> Test Adding Skills in Real-Time
          </h4>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
            Click any missing skill below to simulate learning it, and watch your projected match score update dynamically:
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            {missingSkills.map((skill, idx) => {
              const isAdded = simulatedSkills.includes(skill);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleToggleSkill(skill)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    backgroundColor: isAdded ? '#ecfdf5' : '#f8fafc',
                    color: isAdded ? '#059669' : '#475569',
                    border: `1px solid ${isAdded ? '#10b981' : '#cbd5e1'}`,
                    boxShadow: isAdded ? '0 1px 3px rgba(16, 185, 129, 0.2)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  {isAdded ? <CheckCircle2 size={14} color="#059669" /> : <Plus size={14} />}
                  <span>{skill}</span>
                  {isAdded && <span style={{ fontSize: '10px', color: '#059669' }}>(Simulated)</span>}
                </button>
              );
            })}
          </div>

          {/* Add custom skill input */}
          <form onSubmit={handleAddCustomSkill} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Type custom skill (e.g., AWS, Docker, GraphQL)..."
              value={customSkillInput}
              onChange={(e) => setCustomSkillInput(e.target.value)}
              className="form-input"
              style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
            />
            <button
              type="submit"
              className="choose-btn"
              style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              Add to Simulation
            </button>
          </form>
        </div>

        {/* A* Heuristic Roadmap Table */}
        {roadmap.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={16} color="#059669" /> A* Skill Bridge Priority Roadmap
            </h4>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px', color: '#475569' }}>Missing Skill</th>
                    <th style={{ padding: '10px 14px', color: '#475569' }}>Score Boost</th>
                    <th style={{ padding: '10px 14px', color: '#475569' }}>Projected Match</th>
                    <th style={{ padding: '10px 14px', color: '#475569' }}>Acquisition Effort</th>
                  </tr>
                </thead>
                <tbody>
                  {roadmap.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: '700', color: '#0f172a' }}>
                        {item.skill}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#059669', fontWeight: '800' }}>
                        +{item.score_boost_percent}%
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: '700' }}>
                        {item.projected_total}%
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>
                        {item.difficulty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: '#f1f5f9',
              color: '#475569',
              fontSize: '13px',
              fontWeight: '700',
              border: '1px solid #cbd5e1',
              cursor: 'pointer'
            }}
          >
            Close Simulator
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onApply) onApply(job.id);
            }}
            className="find-candidates-btn"
            style={{ padding: '10px 24px', fontSize: '13px' }}
          >
            Apply to Job With Current Profile ({baseScore}%)
          </button>
        </div>
      </div>
    </div>
  );
}
