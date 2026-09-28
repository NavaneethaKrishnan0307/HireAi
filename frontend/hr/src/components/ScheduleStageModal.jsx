import React, { useState, useEffect } from 'react';
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
  Building,
  ArrowRight,
  Layers
} from 'lucide-react';

export default function ScheduleStageModal({ candidate, initialStage, onClose, onSave }) {
  const [currentStage, setCurrentStage] = useState(initialStage || candidate?.stage || 'technical_assessment');
  const [saving, setSaving] = useState(false);

  const existingStageDetails = candidate?.stage_details || {};
  const existingTech = existingStageDetails.technical_assessment || {};
  const existingInterview = existingStageDetails.interview_scheduled || {};
  const existingOffer = existingStageDetails.offer_extended || {};

  // Tech Assessment State
  const [techMode, setTechMode] = useState(existingTech.mode || 'online');
  const [techDate, setTechDate] = useState(existingTech.scheduled_date || new Date().toISOString().split('T')[0]);
  const [techTime, setTechTime] = useState(existingTech.scheduled_time || '10:00 AM IST');
  const [techLink, setTechLink] = useState(existingTech.link || 'https://hackerrank.com/test/hireai-eval-tech');
  const [techVenue, setTechVenue] = useState(existingTech.venue_address || 'TechCorp Innovation Hub, 4th Floor, Tech Park, Bangalore');
  const [techInstructions, setTechInstructions] = useState(existingTech.instructions || '60-minute automated coding assessment covering algorithms, data structures, and REST API design.');

  // Interview State
  const [interviewMode, setInterviewMode] = useState(existingInterview.mode || 'online');
  const [interviewDate, setInterviewDate] = useState(existingInterview.scheduled_date || new Date().toISOString().split('T')[0]);
  const [interviewTime, setInterviewTime] = useState(existingInterview.scheduled_time || '02:30 PM IST');
  const [interviewLink, setInterviewLink] = useState(existingInterview.link || 'https://meet.google.com/hireai-interview');
  const [interviewVenue, setInterviewVenue] = useState(existingInterview.venue_address || 'TechCorp Towers, Main Executive Boardroom, Bangalore');
  const [interviewPanel, setInterviewPanel] = useState(existingInterview.interviewer_name || 'Senior Technical Panel & VP Engineering');
  const [interviewInstructions, setInterviewInstructions] = useState(existingInterview.instructions || 'Technical system design discussion and code walkthrough. Please bring a valid ID and be prepared for live problem solving.');

  // Offer State
  const [offerRole, setOfferRole] = useState(existingOffer.role_title || candidate?.job_title || 'Senior Software Engineer');
  const [offerCompensation, setOfferCompensation] = useState(existingOffer.compensation || '₹22,00,000 / annum + Performance Bonus & ESOPs');
  const [offerJoinDate, setOfferJoinDate] = useState(existingOffer.joining_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [offerLocation, setOfferLocation] = useState(existingOffer.venue_location || 'Bangalore HQ / Hybrid (3 days onsite, 2 days remote)');
  const [offerHandbookUrl, setOfferHandbookUrl] = useState(existingOffer.company_rules_url || 'https://techcorp.com/careers/employee-handbook-policy');
  const [offerNotes, setOfferNotes] = useState(existingOffer.notes || 'Congratulations on clearing all evaluation rounds! We are thrilled to extend this formal offer. Please review company policies and confirm your acceptance.');

  useEffect(() => {
    if (initialStage) {
      setCurrentStage(initialStage);
    }
  }, [initialStage]);

  // Quick Preset Handlers
  const applyPreset = (type) => {
    if (type === 'hackerrank_test') {
      setTechMode('online');
      setTechLink('https://hackerrank.com/test/hireai-fastapi-assessment');
      setTechInstructions('60-minute automated test covering algorithms, data structures, and REST API design.');
    } else if (type === 'in_person_test') {
      setTechMode('in_person');
      setTechVenue('TechCorp Testing Center, Lab B, 3rd Floor, Bangalore');
      setTechInstructions('Please arrive 15 minutes early. Workstations and test environments will be provided.');
    } else if (type === 'online_meet') {
      setInterviewMode('online');
      setInterviewLink('https://meet.google.com/hireai-tech-round');
      setInterviewInstructions('Please join with camera on and ensure a stable internet connection.');
    } else if (type === 'onsite_interview') {
      setInterviewMode('in_person');
      setInterviewVenue('TechCorp Headquarters, Main Boardroom, 5th Floor, Bangalore');
      setInterviewInstructions('Please report to reception with photo ID 15 minutes prior to scheduled time.');
    } else if (type === 'standard_offer') {
      setOfferRole(candidate?.job_title || 'Senior Software Engineer');
      setOfferCompensation('₹20,00,000 / annum + ₹2,00,000 Performance Bonus');
      setOfferLocation('Bangalore HQ / Hybrid (Flexible)');
      setOfferHandbookUrl('https://techcorp.com/careers/employee-handbook-policy');
      setOfferNotes('We are thrilled to welcome you to the team! Please sign and return the offer letter within 5 business days.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let stagePayload = {};
      if (currentStage === 'technical_assessment') {
        stagePayload = {
          mode: techMode,
          scheduled_date: techDate,
          scheduled_time: techTime,
          link: techMode === 'online' ? techLink : '',
          venue_address: techMode === 'in_person' ? techVenue : '',
          instructions: techInstructions
        };
      } else if (currentStage === 'interview_scheduled') {
        stagePayload = {
          mode: interviewMode,
          scheduled_date: interviewDate,
          scheduled_time: interviewTime,
          link: interviewMode === 'online' ? interviewLink : '',
          venue_address: interviewMode === 'in_person' ? interviewVenue : '',
          interviewer_name: interviewPanel,
          instructions: interviewInstructions
        };
      } else if (currentStage === 'offer_extended') {
        stagePayload = {
          role_title: offerRole,
          compensation: offerCompensation,
          joining_date: offerJoinDate,
          venue_location: offerLocation,
          company_rules_url: offerHandbookUrl,
          notes: offerNotes
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

  const candidateDisplayName = candidate?.candidate?.full_name || candidate?.full_name || candidate?.candidate_name || 'Candidate';
  const roleName = candidate?.job_title || candidate?.target_job || 'Engineering Role';

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '680px', width: '92%', maxHeight: '92vh', overflowY: 'auto', padding: '24px' }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#f0fdf4', color: '#16a34a', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>
              <Sparkles size={12} /> Recruitment Pipeline Dispatcher
            </div>
            <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '800', color: '#0f172a' }}>
              Stage Management & Scheduling
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Candidate: <strong style={{ color: '#1e293b' }}>{candidateDisplayName}</strong> • Requisition: <strong>{roleName}</strong>
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Stage Selection Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '18px' }}>
          <button
            type="button"
            onClick={() => setCurrentStage('technical_assessment')}
            style={{
              padding: '10px 8px',
              borderRadius: '8px',
              border: currentStage === 'technical_assessment' ? '2px solid #0284c7' : '1px solid #e2e8f0',
              backgroundColor: currentStage === 'technical_assessment' ? '#f0f9ff' : '#ffffff',
              color: currentStage === 'technical_assessment' ? '#0369a1' : '#64748b',
              fontWeight: currentStage === 'technical_assessment' ? '800' : '600',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s'
            }}
          >
            <span style={{ fontSize: '16px' }}>💻</span>
            <span>Tech Assessment</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStage('interview_scheduled')}
            style={{
              padding: '10px 8px',
              borderRadius: '8px',
              border: currentStage === 'interview_scheduled' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
              backgroundColor: currentStage === 'interview_scheduled' ? '#f5f3ff' : '#ffffff',
              color: currentStage === 'interview_scheduled' ? '#6d28d9' : '#64748b',
              fontWeight: currentStage === 'interview_scheduled' ? '800' : '600',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s'
            }}
          >
            <span style={{ fontSize: '16px' }}>🎙️</span>
            <span>Interview Round</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStage('offer_extended')}
            style={{
              padding: '10px 8px',
              borderRadius: '8px',
              border: currentStage === 'offer_extended' ? '2px solid #059669' : '1px solid #e2e8f0',
              backgroundColor: currentStage === 'offer_extended' ? '#ecfdf5' : '#ffffff',
              color: currentStage === 'offer_extended' ? '#047857' : '#64748b',
              fontWeight: currentStage === 'offer_extended' ? '800' : '600',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s'
            }}
          >
            <span style={{ fontSize: '16px' }}>🎉</span>
            <span>Job Offer</span>
          </button>
        </div>

        {/* Quick Presets Banner */}
        <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={13} color="#f59e0b" /> Quick 1-Click Fill:
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {currentStage === 'technical_assessment' && (
              <>
                <button type="button" onClick={() => applyPreset('hackerrank_test')} className="choose-btn" style={{ margin: 0, padding: '4px 10px', fontSize: '11px', backgroundColor: '#0284c7' }}>
                  🌐 HackerRank Assessment
                </button>
                <button type="button" onClick={() => applyPreset('in_person_test')} className="choose-btn" style={{ margin: 0, padding: '4px 10px', fontSize: '11px', backgroundColor: '#0f766e' }}>
                  🏢 In-Person Lab Test
                </button>
              </>
            )}
            {currentStage === 'interview_scheduled' && (
              <>
                <button type="button" onClick={() => applyPreset('online_meet')} className="choose-btn" style={{ margin: 0, padding: '4px 10px', fontSize: '11px', backgroundColor: '#7c3aed' }}>
                  📹 Google Meet
                </button>
                <button type="button" onClick={() => applyPreset('onsite_interview')} className="choose-btn" style={{ margin: 0, padding: '4px 10px', fontSize: '11px', backgroundColor: '#0f766e' }}>
                  🏢 Onsite Boardroom
                </button>
              </>
            )}
            {currentStage === 'offer_extended' && (
              <button type="button" onClick={() => applyPreset('standard_offer')} className="choose-btn" style={{ margin: 0, padding: '4px 10px', fontSize: '11px', backgroundColor: '#059669' }}>
                📄 Standard Tech Package
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* TECHNICAL ASSESSMENT FORM */}
          {currentStage === 'technical_assessment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Assessment Delivery Mode</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setTechMode('online')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: techMode === 'online' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: techMode === 'online' ? '#f0f9ff' : '#fff',
                      color: techMode === 'online' ? '#0369a1' : '#475569',
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
                    onClick={() => setTechMode('in_person')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: techMode === 'in_person' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: techMode === 'in_person' ? '#f0f9ff' : '#fff',
                      color: techMode === 'in_person' ? '#0369a1' : '#475569',
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
                    value={techDate}
                    onChange={(e) => setTechDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="#64748b" /> Assessment Time & Window
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={techTime}
                    onChange={(e) => setTechTime(e.target.value)}
                    placeholder="e.g. 10:00 AM IST (60 mins)"
                    required
                  />
                </div>
              </div>

              {techMode === 'online' ? (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LinkIcon size={14} color="#0284c7" /> Online Test Platform URL
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    value={techLink}
                    onChange={(e) => setTechLink(e.target.value)}
                    placeholder="https://hackerrank.com/test/..."
                    required
                  />
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#0284c7" /> In-Person Test Center Venue
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={techVenue}
                    onChange={(e) => setTechVenue(e.target.value)}
                    placeholder="Enter test lab room, tower, and campus address..."
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
                  rows={2}
                  value={techInstructions}
                  onChange={(e) => setTechInstructions(e.target.value)}
                  placeholder="e.g. 60 mins coding evaluation on Python data structures and REST APIs."
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
                    onClick={() => setInterviewMode('online')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: interviewMode === 'online' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                      backgroundColor: interviewMode === 'online' ? '#f5f3ff' : '#fff',
                      color: interviewMode === 'online' ? '#6d28d9' : '#475569',
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
                    onClick={() => setInterviewMode('in_person')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: interviewMode === 'in_person' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                      backgroundColor: interviewMode === 'in_person' ? '#f5f3ff' : '#fff',
                      color: interviewMode === 'in_person' ? '#6d28d9' : '#475569',
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
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="#64748b" /> Interview Time & Timezone
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    placeholder="e.g. 02:30 PM IST"
                    required
                  />
                </div>
              </div>

              {interviewMode === 'online' ? (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LinkIcon size={14} color="#7c3aed" /> Meeting Link (Google Meet / Zoom / Teams)
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    value={interviewLink}
                    onChange={(e) => setInterviewLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    required
                  />
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#7c3aed" /> Office Venue & Conference Room
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={interviewVenue}
                    onChange={(e) => setInterviewVenue(e.target.value)}
                    placeholder="TechCorp HQ, Main Boardroom, 5th Floor, Bangalore"
                    required
                  />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} color="#64748b" /> Interviewers / Panel Members
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={interviewPanel}
                  onChange={(e) => setInterviewPanel(e.target.value)}
                  placeholder="e.g. Principal Architect & Engineering Manager"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="#64748b" /> Preparation Notes & Agenda
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={interviewInstructions}
                  onChange={(e) => setInterviewInstructions(e.target.value)}
                  placeholder="e.g. System design discussion, architecture patterns, and live coding."
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
                    <Briefcase size={14} color="#059669" /> Official Designation / Title
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={offerRole}
                    onChange={(e) => setOfferRole(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={14} color="#059669" /> Total Compensation (CTC / Salary)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={offerCompensation}
                    onChange={(e) => setOfferCompensation(e.target.value)}
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
                    value={offerJoinDate}
                    onChange={(e) => setOfferJoinDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#059669" /> Office Location / Work Mode
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={offerLocation}
                    onChange={(e) => setOfferLocation(e.target.value)}
                    placeholder="e.g. Bangalore Campus / Hybrid"
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
                  value={offerHandbookUrl}
                  onChange={(e) => setOfferHandbookUrl(e.target.value)}
                  placeholder="https://techcorp.com/careers/employee-handbook-policy"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="#059669" /> Formal Welcome Message & Offer Note
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={offerNotes}
                  onChange={(e) => setOfferNotes(e.target.value)}
                  placeholder="Congratulations on clearing all rounds! We look forward to welcoming you..."
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
                gap: '6px',
                padding: '10px 20px',
                fontSize: '13px'
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
