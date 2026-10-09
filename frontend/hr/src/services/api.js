const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getAuthHeader() {
  const token = localStorage.getItem('hr_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const HRAPI = {
  // Auth
  async login(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password, role: 'hr' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    const heuristic = cleanEmail.includes('ghr@') || cleanEmail.includes('google') ? 'Google' :
                      cleanEmail.includes('azhr@') || cleanEmail.includes('azenture') ? 'AZENTURE' :
                      cleanEmail.includes('saranhr@') || cleanEmail.includes('hireai') ? 'HireAI Tech' :
                      cleanEmail.includes('techcorp') || cleanEmail.includes('sarah') ? 'TechCorp Solutions' :
                      'TechCorp Solutions';
    const company = data.user?.company_name || data.role_profile?.company_name || heuristic;
    localStorage.setItem('hr_token', data.token);
    localStorage.setItem('hr_user', JSON.stringify({ ...data.user, company_name: company }));
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
    const company = data.user?.company_name || data.role_profile?.company_name || companyName.trim() || 'TechCorp Solutions';
    localStorage.setItem('hr_token', data.token);
    localStorage.setItem('hr_user', JSON.stringify({ ...data.user, company_name: company }));
    return data;
  },

  logout() {
    localStorage.removeItem('hr_token');
    localStorage.removeItem('hr_user');
  },

  async getCompanyVault() {
    const res = await fetch(`${API_BASE}/api/hr/company-vault`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to load company vault metadata');
    return res.json();
  },

  async syncUser() {
    try {
      const vault = await this.getCompanyVault();
      if (vault?.company_name) {
        const u = this.getCurrentUser() || {};
        const raw = String(vault.company_name).trim();
        const formatted = raw.toLowerCase() === 'google' ? 'Google' :
                          raw.toLowerCase() === 'azenture' ? 'AZENTURE' :
                          raw.toLowerCase().includes('techcorp') ? 'TechCorp Solutions' :
                          raw.charAt(0).toUpperCase() + raw.slice(1);
        const updated = {
          ...u,
          company_name: formatted
        };
        localStorage.setItem('hr_user', JSON.stringify(updated));
        return updated;
      }
    } catch (e) {
      console.warn('Could not sync company vault profile:', e);
    }
    return this.getCurrentUser();
  },

  async forgotPassword(email) {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), role: 'hr' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Email verification failed');
    return data;
  },

  async resetPassword(email, newPassword) {
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), new_password: newPassword, role: 'hr' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Password reset failed');
    return data;
  },

  getCurrentUser() {
    const u = localStorage.getItem('hr_user');
    if (!u) return null;
    try {
      const userObj = JSON.parse(u);
      if (!userObj.company_name) {
        const em = (userObj.email || '').toLowerCase();
        userObj.company_name = em.includes('ghr@') || em.includes('google') ? 'Google' :
                               em.includes('azhr@') || em.includes('azenture') ? 'AZENTURE' :
                               em.includes('techcorp') || em.includes('sarah') ? 'TechCorp Solutions' :
                               'Google';
      }
      return userObj;
    } catch {
      return null;
    }
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

  async getJobApplicants(jobId, weights = null) {
    let url = `${API_BASE}/api/hr/jobs/${jobId}/applicants`;
    if (weights) {
      const params = new URLSearchParams({
        weight_skills: weights.skills || 0.50,
        weight_experience: weights.experience || 0.25,
        weight_education: weights.education || 0.15,
        weight_additional: weights.additional || 0.10
      });
      url += `?${params.toString()}`;
    }
    const res = await fetch(url, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to load applicants');
    return res.json();
  },

  async exportJobApplicantsCsv(jobId) {
    const res = await fetch(`${API_BASE}/api/hr/jobs/${jobId}/export-csv`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to export CSV');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HireAI_Rankings_Job_${jobId}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
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

  async getCandidateUploads(candidateId) {
    const res = await fetch(`${API_BASE}/api/hr/candidates/${candidateId}/uploads`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to load candidate uploads and documents');
    return res.json();
  },

  async getCandidateResumeBlob(candidateId) {
    const res = await fetch(`${API_BASE}/api/hr/candidates/${candidateId}/resume/file`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to fetch candidate resume file');
    return res.blob();
  },

  async getCandidateDocumentBlob(candidateId, docId) {
    const res = await fetch(`${API_BASE}/api/hr/candidates/${candidateId}/documents/${docId}/file`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to fetch candidate document file');
    return res.blob();
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
  },

  async updateCandidateStatus(candidateId, jobId, status) {
    const res = await fetch(`${API_BASE}/api/hr/candidates/${candidateId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ job_id: jobId, status })
    });
    if (!res.ok) throw new Error('Failed to update candidate status');
    return res.json();
  },

  // Deep AI Resume Audit Report for HR
  async getCandidateReport(candidateId) {
    const res = await fetch(`${API_BASE}/api/hr/candidates/${candidateId}/report`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to load candidate resume report');
    return res.json();
  },

  // Interactive Kanban Recruitment Pipeline
  async getPipeline(jobId = null) {
    const url = jobId ? `${API_BASE}/api/hr/pipeline?job_id=${encodeURIComponent(jobId)}` : `${API_BASE}/api/hr/pipeline`;
    const res = await fetch(url, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to load recruitment pipeline');
    return res.json();
  },

  async movePipelineStage({ applicationId, candidateId, jobId, targetStage, stageDetails = null }) {
    const res = await fetch(`${API_BASE}/api/hr/pipeline/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        application_id: applicationId,
        candidate_id: candidateId,
        job_id: jobId,
        target_stage: targetStage,
        stage_details: stageDetails
      })
    });
    if (!res.ok) throw new Error('Failed to advance pipeline stage');
    return res.json();
  },

  async updateApplicationStageDetails(applicationId, { targetStage = null, stageDetails }) {
    const res = await fetch(`${API_BASE}/api/hr/applications/${applicationId}/stage-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        target_stage: targetStage,
        stage_details: stageDetails
      })
    });
    if (!res.ok) throw new Error('Failed to update stage details');
    return res.json();
  }
};
