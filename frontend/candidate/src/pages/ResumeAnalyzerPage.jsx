import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  Briefcase, 
  Building, 
  MapPin, 
  ChevronRight, 
  Printer, 
  FileText, 
  Code, 
  Layers, 
  Cloud, 
  Check, 
  X,
  TrendingUp,
  ShieldCheck,
  User
} from 'lucide-react';
import { CandidateAPI } from '../services/api';

export default function ResumeAnalyzerPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CandidateAPI.getResumeReport();
      setReport(data);
    } catch (err) {
      setError(err.message || 'Failed to generate resume report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="content-area" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Sparkles size={40} color="#2563eb" style={{ animation: 'spin 2s linear infinite', margin: '0 auto 16px auto' }} />
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Generating AI Resume Audit & Report...</h3>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>Evaluating ATS compliance, skill taxonomy, and open platform job compatibility.</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="content-area">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Unable to Generate Audit Report</h3>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '8px 0 16px 0' }}>{error || 'Please upload your resume to generate your personalized report.'}</p>
          <Link to="/upload" className="choose-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Upload Resume Now
          </Link>
        </div>
      </div>
    );
  }

  const atsScore = report.ats_health_score || 75;
  const scoreColor = atsScore >= 80 ? '#10b981' : atsScore >= 60 ? '#f59e0b' : '#ef4444';
  const scoreBg = atsScore >= 80 ? '#ecfdf5' : atsScore >= 60 ? '#fffbeb' : '#fef2f2';

  return (
    <div className="content-area print-area">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>
            <Sparkles size={14} /> Open Source Platform AI Audit
          </div>
          <h2 className="page-title" style={{ margin: 0 }}>Resume Analyzer & Career Report</h2>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
            In-depth ATS evaluation, skill taxonomy breakdown, and multi-company job fit matrix.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link 
            to="/profile"
            className="choose-btn" 
            style={{ margin: 0, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb' }}
          >
            <User size={16} /> Modify Profile
          </Link>
          <button 
            onClick={handlePrint}
            className="choose-btn" 
            style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a' }}
          >
            <Printer size={16} /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Top Banner: Score & Candidate Profile */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1e293b, #0f172a)', 
        borderRadius: '16px', 
        padding: '28px', 
        color: '#fff', 
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)'
      }}>
        <div>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: '700' }}>Candidate Audit Profile</span>
          <h3 style={{ fontSize: '24px', fontWeight: '800', marginTop: '4px', marginBottom: '8px' }}>{report.candidate_name}</h3>
          <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '14px' }}>
            {report.email} {report.phone ? `• ${report.phone}` : ''}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
              🎯 {report.seniority_level}
            </span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
              ⏳ {report.experience_years} Years Experience
            </span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
              🎓 {report.education}
            </span>
          </div>
        </div>

        {/* ATS Quality Gauge */}
        <div style={{ 
          backgroundColor: 'rgba(255,255,255,0.05)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '14px', 
          padding: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px' 
        }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            border: `6px solid ${scoreColor}`, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: scoreBg,
            color: scoreColor,
            flexShrink: 0
          }}>
            <span style={{ fontSize: '22px', fontWeight: '900', lineHeight: 1 }}>{atsScore}%</span>
            <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase' }}>ATS Score</span>
          </div>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>
              {atsScore >= 80 ? 'Excellent Match Health' : atsScore >= 60 ? 'Good Standard Profile' : 'Needs Optimization'}
            </h4>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
              Your resume successfully passed structural parsing and meets platform recruiter evaluation criteria.
            </p>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Strengths */}
        <div className="card" style={{ padding: '22px', borderLeft: '4px solid #10b981' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="#10b981" /> Key Competitive Strengths
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {report.strengths.map((str, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#334155' }}>
                <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{str}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Improvement Areas */}
        <div className="card" style={{ padding: '22px', borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#f59e0b" /> Growth & Improvement Areas
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {report.weaknesses.map((weak, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#334155' }}>
                <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{weak}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categorized Technical Skill Taxonomy */}
      <div className="card" style={{ marginBottom: '24px', padding: '22px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="#2563eb" /> Extracted Skill Taxonomy ({report.total_skills_count} Skills Verified)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {/* Cybersecurity & InfoSec */}
          {report.skill_taxonomy.cybersecurity_and_networking && report.skill_taxonomy.cybersecurity_and_networking.length > 0 && (
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #fed7aa' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#c2410c', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} color="#ea580c" /> Cybersecurity & Networking
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {report.skill_taxonomy.cybersecurity_and_networking.map(s => (
                  <span key={s} className="skill-tag" style={{ backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5' }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Code size={14} color="#2563eb" /> Programming Languages
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {report.skill_taxonomy.languages && report.skill_taxonomy.languages.length > 0 ? (
                report.skill_taxonomy.languages.map(s => (
                  <span key={s} className="skill-tag" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>{s}</span>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>None detected</span>
              )}
            </div>
          </div>

          {/* Frameworks */}
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} color="#7c3aed" /> Frameworks & Libraries
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {report.skill_taxonomy.frameworks && report.skill_taxonomy.frameworks.length > 0 ? (
                report.skill_taxonomy.frameworks.map(s => (
                  <span key={s} className="skill-tag" style={{ backgroundColor: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>{s}</span>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>None detected</span>
              )}
            </div>
          </div>

          {/* Cloud & Data */}
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cloud size={14} color="#059669" /> Cloud, DevOps & Databases
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {report.skill_taxonomy.databases_and_cloud && report.skill_taxonomy.databases_and_cloud.length > 0 ? (
                report.skill_taxonomy.databases_and_cloud.map(s => (
                  <span key={s} className="skill-tag" style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>{s}</span>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>None detected</span>
              )}
            </div>
          </div>

          {/* AI / Machine Learning */}
          {report.skill_taxonomy.ai_and_data && report.skill_taxonomy.ai_and_data.length > 0 && (
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="#0891b2" /> AI & Data Science
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {report.skill_taxonomy.ai_and_data.map(s => (
                  <span key={s} className="skill-tag" style={{ backgroundColor: '#ecfeff', color: '#0e7490', border: '1px solid #a5f3fc' }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Other Tools */}
          {report.skill_taxonomy.other_tools && report.skill_taxonomy.other_tools.length > 0 && (
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} color="#64748b" /> Additional Tools & Protocols
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {report.skill_taxonomy.other_tools.map(s => (
                  <span key={s} className="skill-tag" style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="card" style={{ marginBottom: '24px', padding: '22px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lightbulb size={18} color="#eab308" /> Actionable Hireability Roadmap
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {report.recommendations.map((rec, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {idx + 1}
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#1e293b' }}>{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Company Job Fit Matrix */}
      <div className="card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
              Open Platform Job Compatibility Matrix
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Deterministic compatibility scores across active positions posted by multiple companies.
            </p>
          </div>
          <Link to="/jobs" style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Browse All Openings <ChevronRight size={16} />
          </Link>
        </div>

        {report.job_matrix.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '13px' }}>No active job openings currently found on the platform.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {report.job_matrix.map(job => (
              <div key={job.job_id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', backgroundColor: '#fff' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{job.title}</h4>
                    <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', padding: '2px 8px', borderRadius: '8px', fontWeight: '600' }}>
                      {job.domain}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span><Building size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> {job.company}</span>
                    <span><MapPin size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> {job.location}</span>
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {job.matched_skills.map(s => (
                      <span key={s} style={{ backgroundColor: '#ecfdf5', color: '#059669', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Check size={10} /> {s}
                      </span>
                    ))}
                    {job.missing_skills.map(s => (
                      <span key={s} style={{ backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <X size={10} /> {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: job.match_score >= 80 ? '#10b981' : job.match_score >= 60 ? '#2563eb' : '#f59e0b' }}>
                      {job.match_score}%
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>Match Rating</div>
                  </div>

                  <Link 
                    to="/jobs" 
                    className="choose-btn" 
                    style={{ margin: 0, padding: '8px 16px', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    Apply <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
