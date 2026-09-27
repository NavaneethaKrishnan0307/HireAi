import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HRAPI } from '../services/api';
import { Plus, Users, Trash2, MapPin, Briefcase } from 'lucide-react';

export default function ManageJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await HRAPI.getJobs();
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this job opening?')) {
      try {
        await HRAPI.deleteJob(id);
        setJobs(jobs.filter(j => j.id !== id));
      } catch (err) {
        alert(err.message || 'Delete failed');
      }
    }
  };

  return (
    <div className="hr-content-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="hr-page-title">Manage Job Openings</h2>
          <p className="hr-page-subtitle">Track posted vacancies, applicants count, and candidate requirements.</p>
        </div>

        <button 
          className="find-candidates-btn"
          onClick={() => navigate('/create-job')}
        >
          <Plus size={16} />
          <span>Add New Job</span>
        </button>
      </div>

      {loading ? (
        <p>Loading job openings...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {jobs.map(job => (
            <div key={job.id} className="job-find-card" style={{ padding: '20px', marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                  {job.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                  {job.company} • <MapPin size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> {job.location} • {job.min_experience}+ Years
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {job.required_skills?.map(s => (
                    <span key={s} style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>{job.applicant_count || 0}</span>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Applicants</div>
                </div>

                <button 
                  className="view-all-outline-btn"
                  style={{ padding: '8px 16px' }}
                  onClick={() => navigate('/matches')}
                >
                  View Ranked Pipeline
                </button>

                <button 
                  onClick={(e) => handleDelete(job.id, e)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '6px' }}
                  title="Delete Job"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
