import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckCircle, Briefcase, Building2, ShieldCheck, Sparkles, RotateCcw } from 'lucide-react';
import { HRAPI } from '../services/api';

function resolveRecruiterCompany(user) {
  if (user?.company_name && !user.company_name.toLowerCase().includes('enterprise')) {
    return user.company_name;
  }
  const email = (user?.email || '').toLowerCase();
  if (email.includes('ghr@') || email.includes('google')) return 'Google';
  if (email.includes('azhr@') || email.includes('azenture')) return 'AZENTURE';
  if (email.includes('techcorp') || email.includes('sarah')) return 'TechCorp Solutions';
  return user?.company_name || 'Google';
}

export default function CreateJobPage() {
  const navigate = useNavigate();
  const user = HRAPI.getCurrentUser();
  const initialCompany = resolveRecruiterCompany(user);

  const [loading, setLoading] = useState(false);
  const [activeVaultCompany, setActiveVaultCompany] = useState(initialCompany);
  const [formData, setFormData] = useState({
    title: '',
    company: initialCompany,
    department: '',
    location: '',
    min_experience: '',
    max_experience: '',
    min_salary: '',
    max_salary: '',
    education_required: '',
    required_skills: '',
    preferred_skills: '',
    certifications_preferred: '',
    description: ''
  });

  useEffect(() => {
    async function syncRecruiterVault() {
      try {
        const synced = await HRAPI.syncUser();
        if (synced?.company_name) {
          setActiveVaultCompany(synced.company_name);
          setFormData(prev => ({
            ...prev,
            company: prev.company === 'TechCorp Solutions' && synced.company_name !== 'TechCorp Solutions'
              ? synced.company_name 
              : prev.company || synced.company_name
          }));
        } else {
          const vault = await HRAPI.getCompanyVault();
          if (vault?.company_name) {
            setActiveVaultCompany(vault.company_name);
            setFormData(prev => ({
              ...prev,
              company: prev.company || vault.company_name
            }));
          }
        }
      } catch (err) {
        console.warn('Could not auto-sync vault metadata:', err);
      }
    }
    syncRecruiterVault();
  }, []);

  const handleLoadSampleTemplate = () => {
    setFormData({
      title: 'Senior Cloud Engineer',
      company: activeVaultCompany || formData.company || 'Google',
      department: 'Engineering',
      location: 'Bangalore',
      min_experience: '3',
      max_experience: '6',
      min_salary: '1200000',
      max_salary: '2200000',
      education_required: 'B.Tech/B.E. in Computer Science',
      required_skills: 'Python, SQL, FastAPI, Docker',
      preferred_skills: 'AWS, PostgreSQL, Kubernetes',
      certifications_preferred: 'AWS Certified Solutions Architect',
      description: 'We are seeking an experienced software engineer to lead design and development of high performance cloud applications.'
    });
  };

  const handleClearAll = () => {
    setFormData({
      title: '',
      company: activeVaultCompany || initialCompany,
      department: '',
      location: '',
      min_experience: '',
      max_experience: '',
      min_salary: '',
      max_salary: '',
      education_required: '',
      required_skills: '',
      preferred_skills: '',
      certifications_preferred: '',
      description: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a Job Title.');
      return;
    }
    if (!formData.department) {
      alert('Please select a Job Domain / Department.');
      return;
    }
    if (!formData.location.trim()) {
      alert('Please enter a Location.');
      return;
    }
    if (formData.min_experience === '' || isNaN(parseFloat(formData.min_experience))) {
      alert('Please specify the Required Minimum Experience (in years).');
      return;
    }
    if (!formData.education_required.trim()) {
      alert('Please specify the Education Qualification Required (e.g. B.Tech/B.E. in Computer Science).');
      return;
    }
    if (!formData.required_skills.trim()) {
      alert('Please provide at least one Mandatory Skill (comma-separated).');
      return;
    }
    if (!formData.description.trim()) {
      alert('Please enter a Job Description.');
      return;
    }

    try {
      setLoading(true);
      const reqSkills = formData.required_skills.split(',').map(s => s.trim()).filter(Boolean);
      const prefSkills = formData.preferred_skills.split(',').map(s => s.trim()).filter(Boolean);
      const certs = formData.certifications_preferred.split(',').map(s => s.trim()).filter(Boolean);

      await HRAPI.createJob({
        ...formData,
        company: (formData.company || activeVaultCompany || 'Google').trim(),
        min_experience: parseFloat(formData.min_experience),
        max_experience: formData.max_experience !== '' ? parseFloat(formData.max_experience) : null,
        min_salary: formData.min_salary !== '' ? parseFloat(formData.min_salary) : 0.0,
        max_salary: formData.max_salary !== '' ? parseFloat(formData.max_salary) : 0.0,
        required_skills: reqSkills,
        preferred_skills: prefSkills,
        certifications_preferred: certs
      });

      alert('Job opening published successfully! Position is now active in your company secure vault and accessible to matching candidates.');
      navigate('/matches');
    } catch (err) {
      alert(err.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hr-content-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h2 className="hr-page-title">Post New Job Opening</h2>
          <p className="hr-page-subtitle">Define candidate requirements, skills, experience limits, and compensation.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            type="button" 
            onClick={handleLoadSampleTemplate}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#0284c7', 
              backgroundColor: '#f0f9ff', 
              border: '1px solid #bae6fd', 
              padding: '7px 12px', 
              borderRadius: '8px', 
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
            title="Populate all fields with a sample Software Engineer role"
          >
            <Sparkles size={14} /> Load Example Template
          </button>
          <button 
            type="button" 
            onClick={handleClearAll}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#64748b', 
              backgroundColor: '#ffffff', 
              border: '1px solid #e2e8f0', 
              padding: '7px 12px', 
              borderRadius: '8px', 
              cursor: 'pointer' 
            }}
            title="Reset all form fields to blank"
          >
            <RotateCcw size={14} /> Clear All
          </button>
        </div>
      </div>

      <div className="job-find-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2col">
            <div className="form-group">
              <label className="form-label">Job Title *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Senior Backend Engineer" 
                value={formData.title} 
                onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Company / Organization *</span>
                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} /> Locked to {activeVaultCompany || 'Google'} Secure Vault
                </span>
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.company} 
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Google, AZENTURE, TechCorp Solutions"
                style={{ backgroundColor: '#ffffff', color: '#0f172a', fontWeight: '600' }}
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Job Domain / Department *</label>
              <select 
                className="form-input" 
                value={formData.department} 
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              >
                <option value="">-- Select Domain / Department --</option>
                <option value="Engineering">Engineering & Software</option>
                <option value="AI & Machine Learning">AI & Machine Learning</option>
                <option value="Cloud & DevOps">Cloud & DevOps</option>
                <option value="Data & Analytics">Data & Analytics</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Cybersecurity">Cybersecurity & SecOps</option>
                <option value="Quality Assurance">Quality Assurance (QA)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Location *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Bangalore, Chennai, Remote" 
                value={formData.location} 
                onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Required Minimum Experience (Years) *</label>
              <input 
                type="number" 
                step="0.5" 
                min="0"
                className="form-input" 
                placeholder="e.g. 3"
                value={formData.min_experience} 
                onChange={(e) => setFormData({ ...formData, min_experience: e.target.value })} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Salary Range (₹ Per Annum)</label>
              <div className="salary-range-inputs">
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Min (e.g. 1200000)" 
                  value={formData.min_salary} 
                  onChange={(e) => setFormData({ ...formData, min_salary: e.target.value })} 
                />
                <span className="salary-dash">-</span>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Max (e.g. 2000000)" 
                  value={formData.max_salary} 
                  onChange={(e) => setFormData({ ...formData, max_salary: e.target.value })} 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Education Qualification Required *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. B.Tech/B.E. in Computer Science" 
                value={formData.education_required} 
                onChange={(e) => setFormData({ ...formData, education_required: e.target.value })} 
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Maximum Experience (Years)</label>
              <input 
                type="number" 
                step="0.5" 
                min="0"
                className="form-input" 
                placeholder="e.g. 6" 
                value={formData.max_experience} 
                onChange={(e) => setFormData({ ...formData, max_experience: e.target.value })} 
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Mandatory Skills (Comma separated) *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Python, SQL, FastAPI, Docker" 
                value={formData.required_skills} 
                onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })} 
                required 
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Preferred Skills (Bonus weight)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. AWS, Kubernetes, Redis" 
                value={formData.preferred_skills} 
                onChange={(e) => setFormData({ ...formData, preferred_skills: e.target.value })} 
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Preferred Certifications</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. AWS Certified Solutions Architect" 
                value={formData.certifications_preferred} 
                onChange={(e) => setFormData({ ...formData, certifications_preferred: e.target.value })} 
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Job Description *</label>
              <textarea 
                className="form-input" 
                rows="4" 
                placeholder="e.g. We are seeking an experienced software engineer to lead design and development of high performance cloud applications..." 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="view-all-outline-btn" onClick={() => navigate('/job-find')}>
              Cancel
            </button>
            <button type="submit" className="find-candidates-btn" disabled={loading}>
              <Plus size={16} />
              <span>{loading ? 'Publishing...' : 'Publish Job Opening'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
