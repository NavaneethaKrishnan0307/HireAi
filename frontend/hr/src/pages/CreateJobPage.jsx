import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckCircle, Briefcase } from 'lucide-react';
import { HRAPI } from '../services/api';

export default function CreateJobPage() {
  const navigate = useNavigate();
  const user = HRAPI.getCurrentUser();
  const activeCompany = user?.company_name || 'TechCorp Solutions';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: activeCompany,
    department: 'Engineering',
    location: 'Bangalore',
    min_experience: 3.0,
    max_experience: 6.0,
    min_salary: 1200000,
    max_salary: 2000000,
    education_required: 'B.Tech/B.E. in Computer Science',
    required_skills: 'Python, SQL, FastAPI, Docker',
    preferred_skills: 'AWS, PostgreSQL',
    certifications_preferred: 'AWS Certified Developer',
    description: 'We are seeking an experienced software engineer to lead design and development of high performance cloud applications.'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const reqSkills = formData.required_skills.split(',').map(s => s.trim()).filter(Boolean);
      const prefSkills = formData.preferred_skills.split(',').map(s => s.trim()).filter(Boolean);
      const certs = formData.certifications_preferred.split(',').map(s => s.trim()).filter(Boolean);

      await HRAPI.createJob({
        ...formData,
        min_experience: parseFloat(formData.min_experience),
        max_experience: parseFloat(formData.max_experience),
        min_salary: parseFloat(formData.min_salary),
        max_salary: parseFloat(formData.max_salary),
        required_skills: reqSkills,
        preferred_skills: prefSkills,
        certifications_preferred: certs
      });

      alert('Job opening published successfully! Position is now active and accessible to all matching candidates.');
      navigate('/matches');
    } catch (err) {
      alert(err.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hr-content-area">
      <h2 className="hr-page-title">Post New Job Opening</h2>
      <p className="hr-page-subtitle">Define candidate requirements, skills, experience limits, and compensation.</p>

      <div className="job-find-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2col">
            <div className="form-group">
              <label className="form-label">Job Title</label>
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
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Company / Organization</span>
                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>🔒 Locked to your Secure Vault</span>
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.company} 
                readOnly
                style={{ backgroundColor: '#f8fafc', color: '#334155', fontWeight: '600', cursor: 'not-allowed' }}
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Job Domain / Department</label>
              <select 
                className="form-input" 
                value={formData.department} 
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
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
              <label className="form-label">Location</label>
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
              <label className="form-label">Required Minimum Experience (Years)</label>
              <input 
                type="number" 
                step="0.5" 
                className="form-input" 
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
                  placeholder="Min" 
                  value={formData.min_salary} 
                  onChange={(e) => setFormData({ ...formData, min_salary: e.target.value })} 
                />
                <span className="salary-dash">-</span>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Max" 
                  value={formData.max_salary} 
                  onChange={(e) => setFormData({ ...formData, max_salary: e.target.value })} 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Education Qualification Required</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. B.Tech/B.E./MCA" 
                value={formData.education_required} 
                onChange={(e) => setFormData({ ...formData, education_required: e.target.value })} 
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Mandatory Skills (Comma separated)</label>
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
                placeholder="e.g. AWS Certified Developer" 
                value={formData.certifications_preferred} 
                onChange={(e) => setFormData({ ...formData, certifications_preferred: e.target.value })} 
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Job Description</label>
              <textarea 
                className="form-input" 
                rows="4" 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
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
