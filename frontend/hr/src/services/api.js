const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getAuthHeader() {
  const token = localStorage.getItem('hr_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const HRAPI = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password, role: 'hr' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    localStorage.setItem('hr_token', data.token);
    localStorage.setItem('hr_user', JSON.stringify(data.user));
    return data;
  },

  async register(fullName, companyName, department, email, password) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName.trim(),
        company_name: companyName.trim() || 'TechCorp Solutions',
        email: email.trim(),
        password,
        role: 'hr'
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Registration failed');
    localStorage.setItem('hr_token', data.token);
    localStorage.setItem('hr_user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem('hr_token');
    localStorage.removeItem('hr_user');
  },

  getCurrentUser() {
    const u = localStorage.getItem('hr_user');
    return u ? JSON.parse(u) : null;
  },

  // Dashboard & Metrics
  async getDashboard() {
    const res = await fetch(`${API_BASE}/api/hr/dashboard`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      if (res.status === 401) this.logout();
      throw new Error('Failed to load dashboard');
    }
    return res.json();
  },

  // Candidate Search & Matching
  async searchCandidates(query) {
    const res = await fetch(`${API_BASE}/api/hr/search-candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(query)
    });
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  // Jobs
  async getJobs() {
    const res = await fetch(`${API_BASE}/api/hr/jobs`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to load jobs');
    return res.json();
  },

  async createJob(jobData) {
    const res = await fetch(`${API_BASE}/api/hr/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(jobData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to create job');
    return data;
  },

  async updateJob(jobId, jobData) {
    const res = await fetch(`${API_BASE}/api/hr/jobs/${jobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(jobData)
    });
    if (!res.ok) throw new Error('Failed to update job');
    return res.json();
  },

  async deleteJob(jobId) {
    const res = await fetch(`${API_BASE}/api/hr/jobs/${jobId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to delete job');
    return res.json();
  },

  async getJobApplicants(jobId) {
    const res = await fetch(`${API_BASE}/api/hr/jobs/${jobId}/applicants`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to load applicants');
    return res.json();
  },

  // Candidates
  async getAllCandidates() {
    const res = await fetch(`${API_BASE}/api/hr/candidates`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to load candidates');
    return res.json();
  },

  async getCandidateDetails(candidateId) {
    const res = await fetch(`${API_BASE}/api/hr/candidates/${candidateId}`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to load candidate details');
    return res.json();
  },

  async updateApplicationStatus(applicationId, status) {
    const res = await fetch(`${API_BASE}/api/hr/applications/${applicationId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  }
};
