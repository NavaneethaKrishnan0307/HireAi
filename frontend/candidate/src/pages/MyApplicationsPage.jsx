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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {applications.map(app => (
            <div key={app.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
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
          ))}
        </div>
      )}
    </div>
  );
}
