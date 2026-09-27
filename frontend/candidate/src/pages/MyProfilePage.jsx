import React, { useState, useEffect } from 'react';
import { CandidateAPI } from '../services/api';
import { User, Mail, Phone, MapPin, Briefcase, GraduationCap, Code, CheckCircle, Plus, X } from 'lucide-react';

export default function MyProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [newSkill, setNewSkill] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    current_title: '',
    years_of_experience: 0,
    education: '',
    parsed_skills: []
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await CandidateAPI.getProfile();
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        location: data.location || '',
        current_title: data.current_title || '',
        years_of_experience: data.years_of_experience || 0,
        education: data.education || '',
        parsed_skills: data.parsed_skills || []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (!formData.parsed_skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        parsed_skills: [...prev.parsed_skills, newSkill.trim()]
      }));
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      parsed_skills: prev.parsed_skills.filter(s => s !== skillToRemove)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await CandidateAPI.updateProfile(formData);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      await loadProfile();
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="content-area"><p>Loading profile...</p></div>;
  }

  return (
    <div className="content-area">
      <h2 className="page-title">My Profile</h2>
      <p className="page-subtitle">Manage your personal information, extracted skills, and experience details.</p>

      {successMsg && (
        <div style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '18px' }}>Personal Information</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.full_name} 
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
                placeholder="Joe Candidate"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                placeholder="joe@example.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                placeholder="+91 9876543210"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Location (City)</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.location} 
                onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                placeholder="Bangalore, India"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '18px' }}>Professional Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Current Job Title / Role</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.current_title} 
                onChange={(e) => setFormData({ ...formData, current_title: e.target.value })} 
                placeholder="Senior Python Developer"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Years of Experience</label>
              <input 
                type="number" 
                step="0.1" 
                className="form-input" 
                value={formData.years_of_experience} 
                onChange={(e) => setFormData({ ...formData, years_of_experience: parseFloat(e.target.value) || 0 })} 
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Education / Qualification</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.education} 
                onChange={(e) => setFormData({ ...formData, education: e.target.value })} 
                placeholder="B.Tech in Computer Science"
              />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label className="form-label">Skills (Extracted from Resume & Custom)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {formData.parsed_skills.map((skill) => (
                <span key={skill} className="skill-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {skill}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveSkill(skill)} />
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Add skill (e.g. Docker, AWS, React)" 
                value={newSkill} 
                onChange={(e) => setNewSkill(e.target.value)} 
                style={{ maxWidth: '300px' }}
              />
              <button type="button" className="choose-btn" onClick={handleAddSkill} style={{ margin: 0 }}>
                <Plus size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Add Skill
              </button>
            </div>
          </div>
        </div>

        <button type="submit" className="choose-btn" disabled={saving} style={{ padding: '12px 32px', fontSize: '15px' }}>
          {saving ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
}
