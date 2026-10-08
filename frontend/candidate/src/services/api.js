const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getAuthHeader() {
  const token = localStorage.getItem('candidate_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const CandidateAPI = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'candidate' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    localStorage.setItem('candidate_token', data.token);
    localStorage.setItem('candidate_user', JSON.stringify(data.user));
    return data;
  },

  async register(fullName, email, password) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, email, password, role: 'candidate' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Registration failed');
    localStorage.setItem('candidate_token', data.token);
    localStorage.setItem('candidate_user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem('candidate_token');
    localStorage.removeItem('candidate_user');
  },

  async forgotPassword(email) {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), role: 'candidate' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Email verification failed');
    return data;
  },

  async resetPassword(email, newPassword) {
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), new_password: newPassword, role: 'candidate' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Password reset failed');
    return data;
  },

  getCurrentUser() {
    const u = localStorage.getItem('candidate_user');
    return u ? JSON.parse(u) : null;
  },

  // Profile
  async getProfile() {
    const res = await fetch(`${API_BASE}/api/candidate/profile`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      if (res.status === 401) this.logout();
      throw new Error('Failed to load profile');
    }
    return res.json();
  },

  async updateProfile(profileData) {
    const res = await fetch(`${API_BASE}/api/candidate/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(profileData)
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // Resume Upload
  async uploadResume(file, targetTitle = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (targetTitle && typeof targetTitle === 'string' && targetTitle.trim()) {
      formData.append('target_title', targetTitle.trim());
    }

    const res = await fetch(`${API_BASE}/api/candidate/resume`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to upload resume');
    return data;
  },

  // Documents (Certifications, Referrals, Academic/Other)
  async getDocuments(type) {
    const q = type && type !== 'all' ? `?type=${encodeURIComponent(type)}` : '';
    const res = await fetch(`${API_BASE}/api/candidate/documents${q}`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to load documents');
    return res.json();
  },

  async uploadDocument({ file, document_type, title, issuer_or_referee, issue_date }) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', document_type);
    formData.append('title', title);
    if (issuer_or_referee) formData.append('issuer_or_referee', issuer_or_referee);
    if (issue_date) formData.append('issue_date', issue_date);

    const res = await fetch(`${API_BASE}/api/candidate/documents`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to upload document');
    return data;
  },

  async deleteDocument(docId) {
    const res = await fetch(`${API_BASE}/api/candidate/documents/${docId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  },

  async getResumeFileBlob() {
    const res = await fetch(`${API_BASE}/api/candidate/resume/file`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to fetch resume file');
    return res.blob();
  },

  async getDocumentFileBlob(docId) {
    const res = await fetch(`${API_BASE}/api/candidate/documents/${docId}/file`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to fetch document file');
    return res.blob();
  },

  // Jobs
  async getJobs() {
    const res = await fetch(`${API_BASE}/api/candidate/jobs`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to load jobs');
    return res.json();
  },

  async getJobDetail(jobId) {
    const res = await fetch(`${API_BASE}/api/candidate/jobs/${jobId}`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to load job details');
    return res.json();
  },

  async applyToJob(jobId) {
    const res = await fetch(`${API_BASE}/api/candidate/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ job_id: jobId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to submit application');
    return data;
  },

  // Applications
  async getMyApplications() {
    const res = await fetch(`${API_BASE}/api/candidate/applications`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to load applications');
    return res.json();
  },

  // Resume Analysis & Audit Report
  async getResumeReport() {
    const res = await fetch(`${API_BASE}/api/candidate/resume-report`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to load resume audit report');
    return res.json();
  },

  // Pre-Application Heuristic Job Simulator
  async simulateJobMatch(jobId, simulationParams = {}) {
    const res = await fetch(`${API_BASE}/api/candidate/jobs/${jobId}/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(simulationParams)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to simulate job match');
    return data;
  }
};
