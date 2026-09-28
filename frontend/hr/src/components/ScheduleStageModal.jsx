import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  Link as LinkIcon, 
  FileText, 
  DollarSign, 
  Briefcase, 
  CheckCircle2, 
  Sparkles, 
  User, 
  BookOpen, 
  Globe, 
  Building 
} from 'lucide-react';

export default function ScheduleStageModal({ candidate, initialStage, onClose, onSave }) {
  const currentStage = initialStage || candidate?.stage || 'interview_scheduled';
  const existingDetails = candidate?.stage_details?.[currentStage] || {};

  // Common fields
  const [mode, setMode] = useState(existingDetails.mode || 'online');
  const [scheduledDate, setScheduledDate] = useState(existingDetails.scheduled_date || new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState(existingDetails.scheduled_time || '11:00 AM IST');
  const [link, setLink] = useState(existingDetails.link || (currentStage === 'interview_scheduled' ? 'https://meet.google.com/hireai-interview' : 'https://hackerrank.com/test/hireai-eval'));
  const [venueAddress, setVenueAddress] = useState(existingDetails.venue_address || 'TechCorp Towers, 4th Floor, Electronic City, Bangalore');
  const [instructions, setInstructions] = useState(existingDetails.instructions || '');
  const [interviewerName, setInterviewerName] = useState(existingDetails.interviewer_name || 'Senior Technical Panel');

  // Offer Extended specific fields
  const [roleTitle, setRoleTitle] = useState(existingDetails.role_title || candidate?.job_title || 'Software Engineer');
  const [compensation, setCompensation] = useState(existingDetails.compensation || '₹18,50,000 / annum + Bonus');
  const [joiningDate, setJoiningDate] = useState(existingDetails.joining_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [venueLocation, setVenueLocation] = useState(existingDetails.venue_location || 'Bangalore Office / Hybrid (3 days onsite, 2 days remote)');
  const [companyRulesUrl, setCompanyRulesUrl] = useState(existingDetails.company_rules_url || 'https://techcorp.com/careers/employee-handbook-policy');
  const [notes, setNotes] = useState(existingDetails.notes || 'Congratulations! We are delighted to extend this employment offer. Please review company policies and confirm acceptance.');

  const [saving, setSaving] = useState(false);

  // Quick Preset Handlers
  const applyPreset = (type) => {
    if (type === 'online_meet') {
      setMode('online');
      setLink('https://meet.google.com/hireai-tech-round');
      setInstructions('Please join with camera on and be ready for live coding.');
    } else if (type === 'onsite_interview') {
      setMode('in_person');
      setVenueAddress('TechCorp Headquarters, Main Boardroom, 5th Floor, Bangalore');
      setInstructions('Please report to reception with a photo ID 15 minutes prior to scheduled time.');
    } else if (type === 'hackerrank_test') {
      setMode('online');
      setLink('https://hackerrank.com/test/hireai-fastapi-assessment');
      setInstructions('60-minute automated test covering algorithms, data structures, and REST API design.');
    } else if (type === 'standard_offer') {
      setRoleTitle(candidate?.job_title || 'Senior Software Engineer');
      setCompensation('₹20,00,000 / annum + ₹2,00,000 Performance Bonus');
      setVenueLocation('Bangalore HQ / Hybrid (Flexible)');
      setCompanyRulesUrl('https://techcorp.com/careers/employee-handbook-policy');
      setNotes('We are thrilled to welcome you to the team! Please sign and return the offer letter within 5 business days.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let stagePayload = {};
      if (currentStage === 'technical_assessment') {
        stagePayload = {
          mode,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          link: mode === 'online' ? link : '',
          venue_address: mode === 'in_person' ? venueAddress : '',
          instructions
        };
      } else if (currentStage === 'interview_scheduled') {
        stagePayload = {
          mode,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          link: mode === 'online' ? link : '',
          venue_address: mode === 'in_person' ? venueAddress : '',
          interviewer_name: interviewerName,
          instructions
        };
      } else if (currentStage === 'offer_extended') {
        stagePayload = {
          role_title: roleTitle,
          compensation,
          joining_date: joiningDate,
          venue_location: venueLocation,
          company_rules_url: companyRulesUrl,
          notes
        };
      }

      await onSave({
        targetStage: currentStage,
        stageDetails: {
          [currentStage]: stagePayload
        }
      });
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to save stage details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>
              {currentStage === 'technical_assessment' ? '💻' : currentStage === 'interview_scheduled' ? '🎙️' : currentStage === 'offer_extended' ? '🎉' : '⚙️'}
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                {currentStage === 'technical_assessment' && 'Schedule Technical Assessment'}
                {currentStage === 'interview_scheduled' && 'Schedule Candidate Interview'}
                {currentStage === 'offer_extended' && 'Extend Job Offer & Set Terms'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                For candidate: <strong style={{ color: '#1e293b' }}>{candidate?.candidate?.full_name || candidate?.candidate_name || 'Candidate'}</strong> ({candidate?.job_title || 'Role'})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="icon-btn" 
            style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', padding: '6px', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Preset Quick Fill Buttons */}
        <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={13} color="#f59e0b" /> Quick Presets:
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {currentStage === 'technical_assessment' && (
              <button type="button" onClick={() => applyPreset('hackerrank_test')} className="choose-btn" style={{ margin: 0, padding: '4px 10px', fontSize: '11px', backgroundColor: '#0284c7' }}>
                🌐 Online Test
              </button>
            )}
            {currentStage === 'interview_scheduled' && (
              <>
                <button type="button" onClick={() => applyPreset('online_meet')} className="choose-btn" style={{ margin: 0, padding: '4px 10px', fontSize: '11px', backgroundColor: '#7c3aed' }}>
                  📹 Google Meet
                </button>
                <button type="button" onClick={() => applyPreset('onsite_interview')} className="choose-btn" style={{ margin: 0, padding: '4px 10px', fontSize: '11px', backgroundColor: '#0f766e' }}>
                  🏢 Onsite Office
                </button>
              </>
            )}
            {currentStage === 'offer_extended' && (
              <button type="button" onClick={() => applyPreset('standard_offer')} className="choose-btn" style={{ margin: 0, padding: '4px 10px', fontSize: '11px', backgroundColor: '#059669' }}>
                📄 Standard Package
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* TECHNICAL ASSESSMENT FORM */}
          {currentStage === 'technical_assessment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Assessment Mode</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setMode('online')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: mode === 'online' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: mode === 'online' ? '#f0f9ff' : '#fff',
                      color: mode === 'online' ? '#0369a1' : '#475569',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '13px'
                    }}
                  >
                    <Globe size={15} /> Online Assessment Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('in_person')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: mode === 'in_person' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: mode === 'in_person' ? '#f0f9ff' : '#fff',
                      color: mode === 'in_person' ? '#0369a1' : '#475569',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '13px'
                    }}
                  >
                    <Building size={15} /> In-Person Test Center
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="#64748b" /> Assessment Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="#64748b" /> Assessment Time
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    placeholder="e.g. 02:00 PM IST"
                    required
                  />
                </div>
              </div>

              {mode === 'online' ? (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LinkIcon size={14} color="#0284c7" /> Online Test / Assessment URL
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://hackerrank.com/test/..."
                    required
                  />
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#0284c7" /> In-Person Test Center Address
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                    placeholder="Enter building, lab room, and street address..."
                    required
                  />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="#64748b" /> Instructions & Test Scope
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. 60 mins coding evaluation on Python data structures and FastAPI concepts. Ensure a quiet environment."
                />
              </div>
            </div>
          )}

          {/* INTERVIEW SCHEDULED FORM */}
          {currentStage === 'interview_scheduled' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Interview Mode</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setMode('online')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: mode === 'online' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                      backgroundColor: mode === 'online' ? '#f5f3ff' : '#fff',
                      color: mode === 'online' ? '#6d28d9' : '#475569',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '13px'
                    }}
                  >
                    <Video size={15} /> Online Video Meeting
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('in_person')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: mode === 'in_person' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                      backgroundColor: mode === 'in_person' ? '#f5f3ff' : '#fff',
                      color: mode === 'in_person' ? '#6d28d9' : '#475569',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '13px'
                    }}
                  >
                    <Building size={15} /> In-Person / Onsite
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="#64748b" /> Interview Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="#64748b" /> Time & Timezone
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    placeholder="e.g. 11:30 AM IST"
                    required
                  />
                </div>
              </div>

              {mode === 'online' ? (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LinkIcon size={14} color="#7c3aed" /> Meeting Link (Google Meet / Zoom / Teams)
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    required
                  />
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#7c3aed" /> Office Venue & Room Address
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                    placeholder="TechCorp HQ, 4th Floor, Conference Room 2, Bangalore"
                    required
                  />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} color="#64748b" /> Interviewer / Panel Members
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  placeholder="e.g. Lead Cloud Architect & Senior Manager"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="#64748b" /> Candidate Preparation Instructions
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Please be ready to present previous architecture and coding projects."
                />
              </div>
            </div>
          )}

          {/* OFFER EXTENDED FORM */}
          {currentStage === 'offer_extended' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Briefcase size={14} color="#059669" /> Official Role / Designation
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={14} color="#059669" /> Compensation (Salary / CTC)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={compensation}
                    onChange={(e) => setCompensation(e.target.value)}
                    placeholder="e.g. ₹22,00,000 / annum + Bonus"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="#059669" /> Expected Joining Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#059669" /> Joining Venue / Location / Mode
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={venueLocation}
                    onChange={(e) => setVenueLocation(e.target.value)}
                    placeholder="e.g. Bangalore HQ / Hybrid"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={14} color="#059669" /> Company Rules & Policy Handbook Link
                </label>
                <input
                  type="url"
                  className="form-input"
                  value={companyRulesUrl}
                  onChange={(e) => setCompanyRulesUrl(e.target.value)}
                  placeholder="https://company.com/careers/employee-rules-and-benefits"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="#059669" /> Formal Welcome Message & Offer Note
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Congratulations on clearing all rounds! We are thrilled to extend this formal offer..."
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
            <button
              type="button"
              onClick={onClose}
              className="choose-btn"
              style={{ backgroundColor: '#f1f5f9', color: '#475569', margin: 0 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="choose-btn"
              style={{
                backgroundColor: currentStage === 'offer_extended' ? '#059669' : currentStage === 'interview_scheduled' ? '#7c3aed' : '#0284c7',
                margin: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <CheckCircle2 size={16} />
              {saving ? 'Saving Details...' : currentStage === 'offer_extended' ? 'Confirm & Send Offer' : 'Save & Publish Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
