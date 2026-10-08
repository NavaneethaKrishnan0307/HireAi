import React, { useState, useEffect } from 'react';
import { Building, ShieldCheck, Database, Lock, CheckCircle2, Server, Key } from 'lucide-react';
import { HRAPI } from '../services/api';

export default function SettingsPage() {
  const user = HRAPI.getCurrentUser();
  const [vaultData, setVaultData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVault() {
      try {
        const data = await HRAPI.getCompanyVault();
        setVaultData(data);
      } catch (err) {
        console.error('Failed to load vault details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadVault();
  }, []);

  const companyName = user?.company_name || 'Enterprise Organization';

  return (
    <div className="hr-content-area">
      <div style={{ marginBottom: '24px' }}>
        <h2 className="hr-page-title">Enterprise Security & Organization Settings</h2>
        <p className="hr-page-subtitle">Multi-tenant hardware isolation policies, organization identity, and secure database vault status.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Company Identity Card */}
        <div className="job-find-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: '#eff6ff', color: '#2563eb', padding: '10px', borderRadius: '10px' }}>
              <Building size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Organization Identity</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Active tenant profile</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ color: '#64748b' }}>Company Name:</span>
              <span style={{ fontWeight: '700', color: '#0f172a' }}>{companyName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ color: '#64748b' }}>Recruiter:</span>
              <span style={{ fontWeight: '600', color: '#0f172a' }}>{user?.full_name || 'Recruiter'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ color: '#64748b' }}>Work Email:</span>
              <span style={{ fontWeight: '600', color: '#0f172a' }}>{user?.email || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ color: '#64748b' }}>Tenant Status:</span>
              <span style={{ color: '#16a34a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Active MNC Tenant
              </span>
            </div>
          </div>
        </div>

        {/* Secure Database Vault Card */}
        <div className="job-find-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: '#ecfdf5', color: '#059669', padding: '10px', borderRadius: '10px' }}>
              <Database size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Secure Isolated Database Vault</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Dedicated hardware partition</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ color: '#64748b' }}>Vault Directory:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#0f172a' }}>
                {vaultData?.vault_directory || `database/companies/${companyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}/`}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ color: '#64748b' }}>Isolation Level:</span>
              <span style={{ fontWeight: '600', color: '#059669' }}>
                {vaultData?.isolation_level || 'AES-256 Multi-Tenant Secure Partition'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ color: '#64748b' }}>Cross-Access Defense:</span>
              <span style={{ color: '#059669', fontWeight: '700' }}>Strict 403 Cross-Tenant Shield (Enforced)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ color: '#64748b' }}>Vault Jobs Tracked:</span>
              <span style={{ fontWeight: '700', color: '#0f172a' }}>{vaultData?.total_company_jobs ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Policies Details */}
      <div className="job-find-card">
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={20} color="#059669" />
          Enterprise Multi-Tenant Security Guarantees
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', color: '#0f172a' }}>
              <Lock size={16} color="#3b82f6" />
              1. Strict Data Isolation
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
              Your company jobs, applicants, and pipeline records are isolated in your company's dedicated storage vault. Other HRs cannot access or modify your postings.
            </p>
          </div>

          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', color: '#0f172a' }}>
              <Server size={16} color="#10b981" />
              2. Candidate Universal Visibility
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
              Candidates can discover and apply to your openings from the universal candidate job portal with your company branding, while applicant routing stays 100% private to your company.
            </p>
          </div>

          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '700', color: '#0f172a' }}>
              <Key size={16} color="#8b5cf6" />
              3. AI Explainable Matching
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
              Deterministic Rule Engine ranks candidates specifically against your requirements, generating transparent match proof traces and customized interview questions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
