import React, { useState, useEffect } from 'react';
import { CandidateAPI } from '../services/api';
import { 
  Briefcase, 
  Building, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Calendar, 
  Video, 
  ExternalLink, 
  DollarSign, 
  BookOpen, 
  FileText, 
  Sparkles, 
  Award,
  Globe,
  User
} from 'lucide-react';

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await CandidateAPI.getMyApplications();
      setApplications(data || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStageNumber = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'offer_extended':
      case 'hired':
      case 'offer':
        return 5;
      case 'interview_scheduled':
      case 'interview':
        return 4;
      case 'technical_assessment':
      case 'assessment':
        return 3;
      case 'shortlisted':
        return 2;
      case 'rejected':
      case 'archived':
        return -1;
      case 'applied':
      case 'under_review':
      default:
        return 1;
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'offer_extended':
      case 'hired':
      case 'offer':
        return (
          <span style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            🎉 Offer Extended
          </span>
        );
      case 'interview_scheduled':
      case 'interview':
        return (
          <span style={{ backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            🎙️ Interview Scheduled
          </span>
        );
      case 'technical_assessment':
      case 'assessment':
        return (
          <span style={{ backgroundColor: '#ecfeff', color: '#0e7490', border: '1px solid #a5f3fc', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            💻 Tech Assessment
          </span>
        );
      case 'shortlisted':
        return (
          <span style={{ backgroundColor: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            ⭐ Shortlisted
          </span>
        );
      case 'rejected':
      case 'archived':
        return (
          <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            ❌ Not Selected
          </span>
        );
      default:
        return (
          <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            📥 Screened & Applied
          </span>
        );
    }
  };

  return (
    <div className="content-area" style={{ paddingBottom: '100px' }}>
      <div style={{ marginBottom: '22px' }}>
        <h2 className="page-title" style={{ margin: 0 }}>My Applications & Interview Pipeline</h2>
        <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
          Track real-time evaluation status, scheduled tests, interview video links, and formal job offers.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
          <p>Loading your application statuses and schedules...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Briefcase size={42} color="#94a3b8" style={{ margin: '0 auto 14px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>No active job applications yet</h3>
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '420px', margin: '0 auto' }}>
            Explore available verified openings in the Job Directory and simulate your match score.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {applications.map((app) => {
            const currentStageNum = getStageNumber(app.status);
            const isRejected = currentStageNum === -1;
            const stageDetails = app.stage_details || {};
            const techDetails = stageDetails.technical_assessment || {};
            const interviewDetails = stageDetails.interview_scheduled || {};
            const offerDetails = stageDetails.offer_extended || {};

            return (
              <div key={app.id} className="card" style={{ padding: '24px', border: currentStageNum === 5 ? '2px solid #10b981' : currentStageNum === 4 ? '2px solid #f59e0b' : currentStageNum === 3 ? '2px solid #06b6d4' : '1px solid #e2e8f0' }}>
                {/* Header: Role, Company & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {app.job_title}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px', margin: 0 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Building size={14} color="#64748b" /> <strong>{app.company}</strong>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={14} color="#64748b" /> {app.location}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={14} color="#64748b" /> Applied on {new Date(app.applied_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </p>
                  </div>

                  <div>
                    {getStatusBadge(app.status)}
                  </div>
                </div>

                {/* 5-Step Pipeline Timeline */}
                <div style={{ backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '10px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                    {/* Background connecting bar */}
                    <div style={{ position: 'absolute', top: '12px', left: '8%', right: '8%', height: '3px', backgroundColor: '#e2e8f0', zIndex: 0 }}></div>
                    
                    {/* Stage 1: Applied */}
                    <div style={{ textAlign: 'center', zIndex: 1, flex: 1 }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#10b981', color: '#fff', fontSize: '12px', fontWeight: '900', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>✓</div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>Applied</div>
                    </div>

                    {/* Stage 2: Shortlisted */}
                    <div style={{ textAlign: 'center', zIndex: 1, flex: 1 }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: currentStageNum >= 2 ? '#10b981' : '#e2e8f0', color: currentStageNum >= 2 ? '#fff' : '#64748b', fontSize: '12px', fontWeight: '900', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                        {currentStageNum >= 2 ? '✓' : '2'}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: currentStageNum >= 2 ? '#0f172a' : '#94a3b8' }}>Shortlisted</div>
                    </div>

                    {/* Stage 3: Tech Assessment */}
                    <div style={{ textAlign: 'center', zIndex: 1, flex: 1 }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: currentStageNum >= 3 ? '#06b6d4' : '#e2e8f0', color: currentStageNum >= 3 ? '#fff' : '#64748b', fontSize: '12px', fontWeight: '900', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                        {currentStageNum >= 3 ? '✓' : '3'}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: currentStageNum >= 3 ? '#0e7490' : '#94a3b8' }}>Tech Test</div>
                    </div>

                    {/* Stage 4: Interview Scheduled */}
                    <div style={{ textAlign: 'center', zIndex: 1, flex: 1 }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: currentStageNum >= 4 ? '#f59e0b' : '#e2e8f0', color: currentStageNum >= 4 ? '#fff' : '#64748b', fontSize: '12px', fontWeight: '900', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                        {currentStageNum >= 4 ? '✓' : '4'}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: currentStageNum >= 4 ? '#b45309' : '#94a3b8' }}>Interview</div>
                    </div>

                    {/* Stage 5: Offer Extended or Rejected */}
                    <div style={{ textAlign: 'center', zIndex: 1, flex: 1 }}>
                      <div style={{ 
                        width: '26px', 
                        height: '26px', 
                        borderRadius: '50%', 
                        backgroundColor: isRejected ? '#ef4444' : currentStageNum >= 5 ? '#10b981' : '#e2e8f0', 
                        color: (isRejected || currentStageNum >= 5) ? '#fff' : '#64748b', 
                        fontSize: '12px', 
                        fontWeight: '900', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        marginBottom: '6px' 
                      }}>
                        {isRejected ? '✗' : currentStageNum >= 5 ? '🎉' : '5'}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: isRejected ? '#dc2626' : currentStageNum >= 5 ? '#047857' : '#94a3b8' }}>
                        {isRejected ? 'Not Selected' : 'Job Offer'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* STAGE 1 & 2 NOTICE BANNERS */}
                {currentStageNum === 1 && (
                  <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Clock size={18} color="#2563eb" />
                    <div>
                      <strong style={{ fontSize: '13px', color: '#1e40af' }}>Screening & Initial Review in Progress</strong>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#3b82f6' }}>
                        Your application has been received and is under review by the hiring team. Once your profile is shortlisted, technical evaluation schedules will be published here.
                      </p>
                    </div>
                  </div>
                )}

                {currentStageNum === 2 && (
                  <div style={{ backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '8px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={18} color="#7c3aed" />
                    <div>
                      <strong style={{ fontSize: '13px', color: '#5b21b6' }}>Profile Shortlisted! ⭐</strong>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6d28d9' }}>
                        Congratulations! The hiring team has shortlisted your application. Your Technical Assessment slot is currently being prepared.
                      </p>
                    </div>
                  </div>
                )}

                {/* STAGE 3: TECHNICAL ASSESSMENT DETAILS CARD */}
                {currentStageNum >= 3 && (techDetails.scheduled_date || techDetails.link || techDetails.venue_address) && (
                  <div style={{ backgroundColor: '#f0f9ff', border: currentStageNum === 3 ? '2px solid #0284c7' : '1px solid #bae6fd', borderRadius: '10px', padding: '18px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        💻 Technical Assessment Details {currentStageNum > 3 && '✓ (Cleared)'}
                      </h4>
                      <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                        {techDetails.mode === 'in_person' ? '🏢 In-Person Test Center' : '🌐 Online Assessment'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px', fontSize: '13px', color: '#334155' }}>
                      <div>
                        <strong>📅 Assessment Date:</strong> {techDetails.scheduled_date || 'To be announced'}
                      </div>
                      <div>
                        <strong>⏰ Time / Slot:</strong> {techDetails.scheduled_time || '10:00 AM IST'}
                      </div>
                    </div>

                    {techDetails.mode === 'in_person' && techDetails.venue_address ? (
                      <div style={{ backgroundColor: '#fff', border: '1px solid #e0f2fe', padding: '10px 14px', borderRadius: '8px', marginBottom: '10px', fontSize: '13px' }}>
                        <strong style={{ color: '#0369a1' }}>🏢 Center Address:</strong> {techDetails.venue_address}
                      </div>
                    ) : techDetails.link ? (
                      <div style={{ marginBottom: '12px' }}>
                        <a 
                          href={techDetails.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="choose-btn" 
                          style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#0284c7', textDecoration: 'none' }}
                        >
                          <ExternalLink size={15} /> Launch Online Assessment Portal
                        </a>
                      </div>
                    ) : null}

                    {techDetails.instructions && (
                      <div style={{ fontSize: '12px', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '10px 12px', borderRadius: '6px', lineHeight: 1.4 }}>
                        <strong>💡 Instructions:</strong> {techDetails.instructions}
                      </div>
                    )}
                  </div>
                )}

                {/* STAGE 4: INTERVIEW SCHEDULED DETAILS CARD */}
                {currentStageNum >= 4 && (interviewDetails.scheduled_date || interviewDetails.link || interviewDetails.venue_address) && (
                  <div style={{ backgroundColor: '#fffbeb', border: currentStageNum === 4 ? '2px solid #f59e0b' : '1px solid #fde68a', borderRadius: '10px', padding: '18px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🎙️ Interview Round Schedule {currentStageNum > 4 && '✓ (Cleared)'}
                      </h4>
                      <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                        {interviewDetails.mode === 'in_person' ? '🏢 In-Person Office Interview' : '📹 Online Video Call'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px', fontSize: '13px', color: '#78350f' }}>
                      <div>
                        <strong>📅 Interview Date:</strong> {interviewDetails.scheduled_date || 'Upcoming'}
                      </div>
                      <div>
                        <strong>⏰ Time & Timezone:</strong> {interviewDetails.scheduled_time || '11:30 AM IST'}
                      </div>
                      {interviewDetails.interviewer_name && (
                        <div>
                          <strong>👤 Panel / Interviewer:</strong> {interviewDetails.interviewer_name}
                        </div>
                      )}
                    </div>

                    {interviewDetails.mode === 'in_person' && interviewDetails.venue_address ? (
                      <div style={{ backgroundColor: '#fff', border: '1px solid #fde68a', padding: '10px 14px', borderRadius: '8px', marginBottom: '10px', fontSize: '13px' }}>
                        <strong style={{ color: '#92400e' }}>🏢 Interview Venue Address:</strong> {interviewDetails.venue_address}
                      </div>
                    ) : interviewDetails.link ? (
                      <div style={{ marginBottom: '12px' }}>
                        <a 
                          href={interviewDetails.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="choose-btn" 
                          style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#d97706', textDecoration: 'none' }}
                        >
                          <Video size={15} /> Join Video Interview (Google Meet / Zoom)
                        </a>
                      </div>
                    ) : null}

                    {interviewDetails.instructions && (
                      <div style={{ fontSize: '12px', color: '#92400e', backgroundColor: '#fef3c7', padding: '10px 12px', borderRadius: '6px', lineHeight: 1.4 }}>
                        <strong>📌 Preparation Notes:</strong> {interviewDetails.instructions}
                      </div>
                    )}
                  </div>
                )}

                {/* STAGE 5: OFFICIAL JOB OFFER EXTENDED CARD */}
                {currentStageNum === 5 && (
                  <div style={{ 
                    background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)', 
                    border: '2px solid #10b981', 
                    borderRadius: '12px', 
                    padding: '22px', 
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.12)' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          🎉 Official Employment Offer Letter
                        </h4>
                        <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#047857' }}>
                          Issued by <strong>{app.company}</strong> for your outstanding evaluation.
                        </p>
                      </div>
                      <span style={{ backgroundColor: '#059669', color: '#fff', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Award size={14} /> Offer Active
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #a7f3d0', marginBottom: '16px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Offered Role / Designation</span>
                        <p style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                          {offerDetails.role_title || app.job_title}
                        </p>
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Compensation (CTC Package)</span>
                        <p style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: '900', color: '#059669' }}>
                          {offerDetails.compensation || '₹18,50,000 / annum + Bonus'}
                        </p>
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Expected Joining Date</span>
                        <p style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                          📅 {offerDetails.joining_date || 'November 01, 2026'}
                        </p>
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Work Venue & Location</span>
                        <p style={{ margin: '2px 0 0 0', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                          🏢 {offerDetails.venue_location || app.location || 'Bangalore HQ (Hybrid)'}
                        </p>
                      </div>
                    </div>

                    {/* Company Rules & Policy Link */}
                    {offerDetails.company_rules_url && (
                      <div style={{ marginBottom: '14px' }}>
                        <a 
                          href={offerDetails.company_rules_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#065f46',
                            backgroundColor: '#d1fae5',
                            padding: '8px 14px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '700',
                            textDecoration: 'none',
                            border: '1px solid #6ee7b7'
                          }}
                        >
                          <BookOpen size={15} /> View Official Company Rules, Benefits & Policy Handbook <ExternalLink size={13} />
                        </a>
                      </div>
                    )}

                    {offerDetails.notes && (
                      <div style={{ fontSize: '13px', color: '#065f46', backgroundColor: '#d1fae5', padding: '12px 14px', borderRadius: '8px', lineHeight: 1.5, borderLeft: '4px solid #059669' }}>
                        <strong>✉️ HR Message:</strong> {offerDetails.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
