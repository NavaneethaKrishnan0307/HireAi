import React, { useState, useEffect } from 'react';
import { CandidateAPI } from '../services/api';
import { User, Mail, Phone, MapPin, Briefcase, GraduationCap, Code, CheckCircle, Plus, X, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COUNTRY_CODES, parsePhoneNumber } from '../constants/countryCodes';

export default function MyProfilePage() {
  const getCachedProfile = () => {
    try {
      const cached = localStorage.getItem('candidate_profile_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const cachedData = getCachedProfile();
  const initialPhoneParsed = parsePhoneNumber(cachedData?.phone);

  const [profile, setProfile] = useState(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [newSkill, setNewSkill] = useState('');

  const [selectedCountryCode, setSelectedCountryCode] = useState(initialPhoneParsed.dialCode);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneParsed.number);

  const [formData, setFormData] = useState({
    full_name: cachedData?.full_name || '',
    email: cachedData?.email || '',
    phone: cachedData?.phone || '',
    location: cachedData?.location || '',
    current_title: cachedData?.current_title || '',
    years_of_experience: cachedData?.years_of_experience ?? 0,
    education: cachedData?.education || '',
    parsed_skills: cachedData?.parsed_skills || []
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await CandidateAPI.getProfile();
      if (data) {
        setProfile(data);
        localStorage.setItem('candidate_profile_cache', JSON.stringify(data));
        
        const parsed = parsePhoneNumber(data.phone);
        setSelectedCountryCode(parsed.dialCode);
        setPhoneNumber(parsed.number);

        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          current_title: data.current_title || '',
          years_of_experience: data.years_of_experience ?? 0,
          education: data.education || '',
          parsed_skills: data.parsed_skills || []
        });
      }
    } catch (err) {
      console.error('Failed to load candidate profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCountryCodeChange = (e) => {
    const code = e.target.value;
    setSelectedCountryCode(code);
    const combined = phoneNumber.trim() ? `${code} ${phoneNumber.trim()}` : '';
    setFormData(prev => ({ ...prev, phone: combined }));
  };

  const handlePhoneNumberChange = (e) => {
    const num = e.target.value;
    setPhoneNumber(num);
    const combined = num.trim() ? `${selectedCountryCode} ${num.trim()}` : '';
    setFormData(prev => ({ ...prev, phone: combined }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (!formData.parsed_skills.includes(newSkill.trim())) {
      const updated = {
        ...formData,
        parsed_skills: [...formData.parsed_skills, newSkill.trim()]
      };
      setFormData(updated);
      localStorage.setItem('candidate_profile_cache', JSON.stringify(updated));
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updated = {
      ...formData,
      parsed_skills: formData.parsed_skills.filter(s => s !== skillToRemove)
    };
    setFormData(updated);
    localStorage.setItem('candidate_profile_cache', JSON.stringify(updated));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const finalPhone = phoneNumber.trim() ? `${selectedCountryCode} ${phoneNumber.trim()}` : '';
      const payload = {
        ...formData,
        phone: finalPhone
      };
      // Immediately cache to localStorage so it is never lost on refresh
      localStorage.setItem('candidate_profile_cache', JSON.stringify(payload));
      await CandidateAPI.updateProfile(payload);
      setSuccessMsg('Profile and skills saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      await loadProfile();
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !cachedData) {
    return <div className="content-area"><p>Loading profile...</p></div>;
  }

  return (
    <div className="content-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
        <div>
          <h2 className="page-title" style={{ margin: 0 }}>My Profile</h2>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>Manage your personal information, extracted skills, and experience details.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link 
            to="/report" 
            className="choose-btn" 
            style={{ margin: 0, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#0f172a' }}
          >
            <Sparkles size={15} /> View AI Career Report
          </Link>
          <Link 
            to="/upload" 
            className="choose-btn" 
            style={{ margin: 0, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#2563eb' }}
          >
            Upload New Resume
          </Link>
        </div>
      </div>

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
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} color="#64748b" /> Phone Number
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                <select
                  className="form-input"
                  value={selectedCountryCode}
                  onChange={handleCountryCodeChange}
                  aria-label="Country Dialing Code"
                  style={{
                    flex: '0 0 160px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    backgroundColor: '#fff',
                    padding: '8px 10px',
                    fontSize: '13px',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {COUNTRY_CODES.map((c, idx) => {
                    const dial = c.dialCode || c.code;
                    return (
                      <option key={`${dial}-${c.name}-${idx}`} value={dial}>
                        {c.flag} {dial} ({c.name})
                      </option>
                    );
                  })}
                </select>
                <input 
                  type="tel" 
                  className="form-input" 
                  style={{ flex: 1 }}
                  value={phoneNumber} 
                  onChange={handlePhoneNumberChange} 
                  placeholder="98765 43210"
                />
              </div>
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
