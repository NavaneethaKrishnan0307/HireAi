import React, { useState, useEffect } from 'react';
import { CandidateAPI } from '../services/api';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Code, 
  CheckCircle, 
  Plus, 
  X, 
  Sparkles, 
  Globe,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { COUNTRY_CODES, parsePhoneNumber } from '../constants/countryCodes';
import { COUNTRIES_AND_CITIES, parseLocation } from '../constants/countriesAndCities';
import CustomSearchableDropdown from '../components/CustomSearchableDropdown';

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
  const initialLocParsed = parseLocation(cachedData?.location);

  const [profile, setProfile] = useState(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [validationError, setValidationError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [newSkill, setNewSkill] = useState('');

  // Phone state
  const [selectedCountryCode, setSelectedCountryCode] = useState(initialPhoneParsed.dialCode);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneParsed.number);

  // Country & City state
  const [selectedCountry, setSelectedCountry] = useState(initialLocParsed.country || 'India');
  const [selectedCity, setSelectedCity] = useState(initialLocParsed.city || 'Bangalore');
  const [isCustomCity, setIsCustomCity] = useState(initialLocParsed.isCustomCity);
  const [customCityText, setCustomCityText] = useState(initialLocParsed.customCity);

  const currentCountryObj = COUNTRIES_AND_CITIES.find(c => c.country === selectedCountry) || COUNTRIES_AND_CITIES[0];
  const availableCities = currentCountryObj?.cities || [];

  // Dropdown options formatted for CustomSearchableDropdown
  const countryCodeOptions = COUNTRY_CODES.map((c) => {
    const dial = c.dialCode || c.code;
    return {
      value: dial,
      label: `${dial} ${c.name}`,
      flag: c.flag,
      sublabel: dial
    };
  });

  const countryOptions = COUNTRIES_AND_CITIES.map((c) => ({
    value: c.country,
    label: c.country,
    flag: c.flag
  }));

  const cityOptions = [
    ...availableCities.map((city) => ({
      value: city,
      label: city,
      flag: '📍'
    })),
    {
      value: 'Other',
      label: '✨ Other / Custom City...',
      flag: '✨'
    }
  ];

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

  const buildLocationString = (country, city, isCustom, customText) => {
    const finalCity = (isCustom || city === 'Other') ? (customText || '').trim() : city;
    if (!finalCity && !country) return '';
    if (!finalCity) return country;
    return `${finalCity}, ${country}`;
  };

  const loadProfile = async () => {
    try {
      const data = await CandidateAPI.getProfile();
      if (data) {
        setProfile(data);
        localStorage.setItem('candidate_profile_cache', JSON.stringify(data));
        
        const parsedP = parsePhoneNumber(data.phone);
        setSelectedCountryCode(parsedP.dialCode);
        setPhoneNumber(parsedP.number);

        const parsedL = parseLocation(data.location);
        setSelectedCountry(parsedL.country || 'India');
        setSelectedCity(parsedL.city || 'Bangalore');
        setIsCustomCity(parsedL.isCustomCity);
        setCustomCityText(parsedL.customCity || '');

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

  const handleCountryCodeChange = (val) => {
    const code = typeof val === 'object' ? val.target.value : val;
    setSelectedCountryCode(code);
    const combined = phoneNumber.trim() ? `${code} ${phoneNumber.trim()}` : '';
    setFormData(prev => ({ ...prev, phone: combined }));
    if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: null }));
  };

  const handlePhoneNumberChange = (e) => {
    const num = e.target.value;
    setPhoneNumber(num);
    const combined = num.trim() ? `${selectedCountryCode} ${num.trim()}` : '';
    setFormData(prev => ({ ...prev, phone: combined }));
    if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: null }));
  };

  const handleCountryChange = (val) => {
    const newCountry = typeof val === 'object' ? val.target.value : val;
    setSelectedCountry(newCountry);
    const cObj = COUNTRIES_AND_CITIES.find(c => c.country === newCountry);
    const firstCity = cObj?.cities[0] || 'Remote';
    setSelectedCity(firstCity);
    setIsCustomCity(false);
    setCustomCityText('');
    const locStr = buildLocationString(newCountry, firstCity, false, '');
    setFormData(prev => ({ ...prev, location: locStr }));
    if (fieldErrors.location) setFieldErrors(prev => ({ ...prev, location: null }));
  };

  const handleCityChange = (val) => {
    const newCity = typeof val === 'object' ? val.target.value : val;
    setSelectedCity(newCity);
    if (newCity === 'Other') {
      setIsCustomCity(true);
      const locStr = buildLocationString(selectedCountry, 'Other', true, customCityText);
      setFormData(prev => ({ ...prev, location: locStr }));
    } else {
      setIsCustomCity(false);
      const locStr = buildLocationString(selectedCountry, newCity, false, '');
      setFormData(prev => ({ ...prev, location: locStr }));
    }
    if (fieldErrors.location) setFieldErrors(prev => ({ ...prev, location: null }));
  };

  const handleCustomCityChange = (e) => {
    const text = e.target.value;
    setCustomCityText(text);
    const locStr = buildLocationString(selectedCountry, 'Other', true, text);
    setFormData(prev => ({ ...prev, location: locStr }));
    if (fieldErrors.location) setFieldErrors(prev => ({ ...prev, location: null }));
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
      if (fieldErrors.parsed_skills) setFieldErrors(prev => ({ ...prev, parsed_skills: null }));
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

  const validateAllCompulsoryFields = () => {
    const errors = {};
    const missingNames = [];

    // 1. Full Name
    if (!formData.full_name || !formData.full_name.trim()) {
      errors.full_name = 'Full Name is compulsory.';
      missingNames.push('Full Name');
    }

    // 2. Email Address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !formData.email.trim()) {
      errors.email = 'Email Address is compulsory.';
      missingNames.push('Email Address');
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address.';
      missingNames.push('Valid Email Address');
    }

    // 3. Phone Number
    if (!phoneNumber || !phoneNumber.trim() || phoneNumber.trim().length < 6) {
      errors.phone = 'Phone Number is compulsory (min 6 digits).';
      missingNames.push('Phone Number');
    }

    // 4. Country & City Location
    if (!selectedCountry || !selectedCountry.trim()) {
      errors.country = 'Country is compulsory.';
      missingNames.push('Country');
    }
    if (isCustomCity && (!customCityText || !customCityText.trim())) {
      errors.city = 'Custom City Name is compulsory.';
      missingNames.push('City Name');
    } else if (!selectedCity || !selectedCity.trim()) {
      errors.city = 'City is compulsory.';
      missingNames.push('City');
    }

    // 5. Job Title
    if (!formData.current_title || !formData.current_title.trim()) {
      errors.current_title = 'Current Job Title / Role is compulsory.';
      missingNames.push('Current Job Title');
    }

    // 6. Experience
    if (formData.years_of_experience === '' || formData.years_of_experience === null || isNaN(formData.years_of_experience) || formData.years_of_experience < 0) {
      errors.years_of_experience = 'Years of Experience is compulsory (enter 0 for fresher).';
      missingNames.push('Years of Experience');
    }

    // 7. Education
    if (!formData.education || !formData.education.trim()) {
      errors.education = 'Education / Qualification is compulsory.';
      missingNames.push('Education');
    }

    // 8. Skills
    if (!formData.parsed_skills || formData.parsed_skills.length === 0) {
      errors.parsed_skills = 'At least 1 technical skill is compulsory.';
      missingNames.push('Skills (At least 1 required)');
    }

    return { errors, missingNames };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setValidationError('');

    const { errors, missingNames } = validateAllCompulsoryFields();
    setFieldErrors(errors);

    if (missingNames.length > 0) {
      setValidationError(`Profile Unsavable: All fields are strictly compulsory. Please fill in: ${missingNames.join(', ')}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setSaving(true);
      const finalPhone = phoneNumber.trim() ? `${selectedCountryCode} ${phoneNumber.trim()}` : '';
      const finalLocation = buildLocationString(selectedCountry, selectedCity, isCustomCity, customCityText);
      const payload = {
        ...formData,
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: finalPhone,
        location: finalLocation,
        current_title: formData.current_title.trim(),
        education: formData.education.trim(),
        years_of_experience: Number(formData.years_of_experience) || 0
      };

      // Immediately cache to localStorage so it is never lost on refresh
      localStorage.setItem('candidate_profile_cache', JSON.stringify(payload));
      await CandidateAPI.updateProfile(payload);
      setSuccessMsg('✓ Profile and compulsory details saved successfully!');
      setValidationError('');
      setFieldErrors({});
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadProfile();
    } catch (err) {
      setValidationError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !cachedData) {
    return <div className="content-area"><p>Loading profile...</p></div>;
  }

  return (
    <div className="content-area" style={{ paddingBottom: '140px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
        <div>
          <h2 className="page-title" style={{ margin: 0 }}>My Profile</h2>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
            All fields marked with <span style={{ color: '#ef4444', fontWeight: '800' }}>*</span> are strictly compulsory to save your profile and unlock job applications.
          </p>
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
            Upload Resume
          </Link>
        </div>
      </div>

      {validationError && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>Missing Compulsory Information</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', lineHeight: 1.4 }}>{validationError}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} />
          <span style={{ fontWeight: '600', fontSize: '14px' }}>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} noValidate>
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '18px' }}>Personal Information</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} color="#64748b" /> Full Name <span style={{ color: '#ef4444', fontWeight: '800' }}>*</span>
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.full_name} 
                onChange={(e) => {
                  setFormData({ ...formData, full_name: e.target.value });
                  if (fieldErrors.full_name) setFieldErrors(prev => ({ ...prev, full_name: null }));
                }} 
                placeholder="Candidate Full Name"
                style={{ borderColor: fieldErrors.full_name ? '#ef4444' : undefined }}
              />
              {fieldErrors.full_name && (
                <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>{fieldErrors.full_name}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} color="#64748b" /> Email Address <span style={{ color: '#ef4444', fontWeight: '800' }}>*</span>
              </label>
              <input 
                type="email" 
                className="form-input" 
                value={formData.email} 
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null }));
                }} 
                placeholder="candidate@example.com"
                style={{ borderColor: fieldErrors.email ? '#ef4444' : undefined }}
              />
              {fieldErrors.email && (
                <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>{fieldErrors.email}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} color="#64748b" /> Phone Number <span style={{ color: '#ef4444', fontWeight: '800' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                <div style={{ flex: '0 0 170px' }}>
                  <CustomSearchableDropdown
                    value={selectedCountryCode}
                    onChange={handleCountryCodeChange}
                    options={countryCodeOptions}
                    placeholder="Country Code"
                    searchPlaceholder="Search code..."
                    dropdownWidth="260px"
                  />
                </div>
                <input 
                  type="tel" 
                  className="form-input" 
                  style={{ flex: 1, borderColor: fieldErrors.phone ? '#ef4444' : undefined }}
                  value={phoneNumber} 
                  onChange={handlePhoneNumberChange} 
                  placeholder="98765 43210"
                />
              </div>
              {fieldErrors.phone && (
                <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>{fieldErrors.phone}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={14} color="#64748b" /> Country <span style={{ color: '#ef4444', fontWeight: '800' }}>*</span>
              </label>
              <CustomSearchableDropdown
                value={selectedCountry}
                onChange={handleCountryChange}
                options={countryOptions}
                placeholder="Select Country"
                searchPlaceholder="Search country..."
              />
              {fieldErrors.country && (
                <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>{fieldErrors.country}</p>
              )}
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} color="#64748b" /> City / Region <span style={{ color: '#ef4444', fontWeight: '800' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 260px' }}>
                  <CustomSearchableDropdown
                    value={selectedCity}
                    onChange={handleCityChange}
                    options={cityOptions}
                    placeholder="Select City"
                    searchPlaceholder="Search city in this country..."
                  />
                </div>
                {isCustomCity && (
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter custom city..." 
                    value={customCityText} 
                    onChange={handleCustomCityChange} 
                    style={{ flex: '1 1 240px', borderColor: fieldErrors.city ? '#ef4444' : undefined }}
                  />
                )}
              </div>
              {fieldErrors.city && (
                <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>{fieldErrors.city}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '18px' }}>Professional Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                Current Job Title / Role <span style={{ color: '#ef4444', fontWeight: '800' }}>*</span>
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.current_title} 
                onChange={(e) => {
                  setFormData({ ...formData, current_title: e.target.value });
                  if (fieldErrors.current_title) setFieldErrors(prev => ({ ...prev, current_title: null }));
                }} 
                placeholder="Senior Python Developer / Fresher"
                style={{ borderColor: fieldErrors.current_title ? '#ef4444' : undefined }}
              />
              {fieldErrors.current_title && (
                <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>{fieldErrors.current_title}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Years of Experience <span style={{ color: '#ef4444', fontWeight: '800' }}>*</span>
              </label>
              <input 
                type="number" 
                step="0.1" 
                min="0"
                className="form-input" 
                value={formData.years_of_experience} 
                onChange={(e) => {
                  setFormData({ ...formData, years_of_experience: e.target.value === '' ? '' : parseFloat(e.target.value) });
                  if (fieldErrors.years_of_experience) setFieldErrors(prev => ({ ...prev, years_of_experience: null }));
                }} 
                style={{ borderColor: fieldErrors.years_of_experience ? '#ef4444' : undefined }}
              />
              {fieldErrors.years_of_experience && (
                <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>{fieldErrors.years_of_experience}</p>
              )}
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">
                Education / Qualification <span style={{ color: '#ef4444', fontWeight: '800' }}>*</span>
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.education} 
                onChange={(e) => {
                  setFormData({ ...formData, education: e.target.value });
                  if (fieldErrors.education) setFieldErrors(prev => ({ ...prev, education: null }));
                }} 
                placeholder="B.Tech in Computer Science / Graduate"
                style={{ borderColor: fieldErrors.education ? '#ef4444' : undefined }}
              />
              {fieldErrors.education && (
                <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>{fieldErrors.education}</p>
              )}
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label className="form-label">
              Technical Skills <span style={{ color: '#ef4444', fontWeight: '800' }}>*</span> (At least 1 required)
            </label>
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
                placeholder="Add skill (e.g. Python, Docker, AWS, React)" 
                value={newSkill} 
                onChange={(e) => setNewSkill(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(e); } }}
                style={{ maxWidth: '320px', borderColor: fieldErrors.parsed_skills ? '#ef4444' : undefined }}
              />
              <button type="button" className="choose-btn" onClick={handleAddSkill} style={{ margin: 0 }}>
                <Plus size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Add Skill
              </button>
            </div>
            {fieldErrors.parsed_skills && (
              <p style={{ color: '#ef4444', fontSize: '12px', margin: '6px 0 0 0' }}>{fieldErrors.parsed_skills}</p>
            )}
          </div>
        </div>

        <button 
          type="submit" 
          className="choose-btn" 
          disabled={saving} 
          style={{ padding: '12px 36px', fontSize: '15px', fontWeight: '700' }}
        >
          {saving ? 'Validating & Saving...' : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
}
