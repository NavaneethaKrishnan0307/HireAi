import React, { useState, useEffect } from 'react';
import { CandidateAPI } from '../services/api';
import { Briefcase, Building, MapPin, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

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
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status) => {
    switch (status) {
      case 'shortlisted':
      case 'hired':
        return 3;
      case 'under_review':
        return 2;
      case 'applied':
      default:
        return 1;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'shortlisted':
        return <span style={{ backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '700' }}>Shortlisted</span>;
      case 'under_review':
        return <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '700' }}>Under Review</span>;
      case 'rejected':
        return <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '700' }}>Not Selected</span>;
      default:
        return <span style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '700' }}>Application Received</span>;
    }
  };

  return (
    <div className="content-area">
      <h2 className="page-title">My Applications</h2>
      <p className="page-subtitle">Track real-time evaluation status and recruitment pipeline updates.</p>

      {loading ? (
        <p>Loading application statuses...</p>
      ) : applications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <Briefcase size={36} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>No active applications yet</h3>
          <p style={{ color: '#64748b', fontSize: '13px' }}>Explore available job openings and apply to get matched.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {applications.map(app => {
            const step = getStatusStep(app.status);
            const isRejected = app.status === 'rejected';

            return (
              <div key={app.id} className="card" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                      {app.job_title}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span><Building size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> {app.company}</span>
                      <span><MapPin size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> {app.location}</span>
                      <span><Clock size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> Applied on {new Date(app.applied_at).toLocaleDateString()}</span>
                    </p>
                  </div>

                  <div>
                    {getStatusBadge(app.status)}
                  </div>
                </div>

                {/* Stepper Timeline */}
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '10px', left: '15%', right: '15%', height: '2px', background: '#e2e8f0', zIndex: 0 }}></div>
                    
                    <div style={{ textAlign: 'center', zIndex: 1, flex: 1 }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#10b981', color: '#fff', fontSize: '11px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>✓</div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>Applied</div>
                    </div>

                    <div style={{ textAlign: 'center', zIndex: 1, flex: 1 }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: step >= 2 ? '#10b981' : '#e2e8f0', color: step >= 2 ? '#fff' : '#64748b', fontSize: '11px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                        {step >= 2 ? '✓' : '2'}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: step >= 2 ? '#0f172a' : '#94a3b8' }}>Under Review</div>
                    </div>

                    <div style={{ textAlign: 'center', zIndex: 1, flex: 1 }}>
                      <div style={{ 
                        width: '22px', 
                        height: '22px', 
                        borderRadius: '50%', 
                        background: isRejected ? '#ef4444' : step >= 3 ? '#10b981' : '#e2e8f0', 
                        color: (isRejected || step >= 3) ? '#fff' : '#64748b', 
                        fontSize: '11px', 
                        fontWeight: '800', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        marginBottom: '4px' 
                      }}>
                        {isRejected ? '✗' : step >= 3 ? '✓' : '3'}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: (isRejected || step >= 3) ? '#0f172a' : '#94a3b8' }}>
                        {isRejected ? 'Decision' : 'Shortlisted'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
