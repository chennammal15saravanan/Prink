import React, { useEffect, useState, useRef } from 'react';
import type { PrinterQueueItem, PrintStatus } from '../types';
import { customerName } from '../types';
import { useToast } from '../context/ToastContext';
import mainLogo from '../assets/logos/main-logo.png';
import websiteLogo from '../assets/logos/website-logo.png';

interface PrinterPortalProps {
  extraItems?: PrinterQueueItem[];
}

type StatusFilter = 'all' | PrintStatus;

const STATUS_META: Record<PrintStatus, { label: string; icon: string }> = {
  'pending':     { label: 'Pending',     icon: 'bi-clock' },
  'processing':  { label: 'Processing',  icon: 'bi-arrow-repeat' },
  'print-ready': { label: 'Print Ready', icon: 'bi-check-circle' },
  'completed':   { label: 'Completed',   icon: 'bi-bag-check' },
};

const PRIORITY_ORDER: Record<string, number> = { high: 0, normal: 1, low: 2 };

export default function PrinterPortal({ extraItems = [] }: PrinterPortalProps) {
  const { showToast } = useToast();

  // Auth State
  const [screen, setScreen] = useState<'login' | 'dashboard'>(() => {
    return localStorage.getItem('printer_token') ? 'dashboard' : 'login';
  });
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [loginErr, setLoginErr]   = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // Queue State
  const [queue, setQueue] = useState<PrinterQueueItem[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const emailRef = useRef<HTMLInputElement>(null);

  // Focus email on login screen active
  useEffect(() => {
    if (screen === 'login') emailRef.current?.focus();
  }, [screen]);

  // Load printer queue from backend
  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/printer/queue', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('printer_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        // Handle both direct array and object formats ({ success: true, queue: [...] })
        const list = Array.isArray(data) ? data : (data.queue || []);
        setQueue(list);
      } else if (res.status === 401 || res.status === 403) {

        localStorage.removeItem('printer_token');
        setScreen('login');
        showToast('Session expired. Please log in again.', 'error');
      }
    } catch (err) {
      console.error('Failed to fetch printer queue:', err);
    }
  };

  useEffect(() => {
    if (screen === 'dashboard') {
      fetchQueue();
      // Set up a 5-second polling interval for real-time tracking updates!
      const interval = setInterval(fetchQueue, 5000);
      return () => clearInterval(interval);
    }
  }, [screen]);

  // Sync incoming admin routed items to queue database (simulate server side addition)
  useEffect(() => {
    if (screen !== 'dashboard' || extraItems.length === 0) return;
    setQueue(prev => {
      const ids = new Set(prev.map(i => i.id));
      const toAdd = extraItems.filter(i => !ids.has(i.id));
      return toAdd.length ? [...prev, ...toAdd] : prev;
    });
  }, [extraItems, screen]);

  // Authenticate Printer
  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!regName.trim() || !email.trim() || !password.trim()) { setLoginErr('Please enter name, email and password.'); return; }
    setLoginErr('');
    setLoggingIn(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email, phone: regPhone, password, role: 'printer' }),
      });
      const data = await res.json();
      setLoggingIn(false);
      if (res.ok && data.success) {
        localStorage.setItem('printer_token', data.token);
        setScreen('dashboard');
        showToast('Account created! Welcome, Printer!', 'success');
      } else {
        setLoginErr(data.error || 'Registration failed.');
      }
    } catch (err) {
      setLoggingIn(false);
      setLoginErr('Unable to reach server. Please try again.');
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) { setLoginErr('Please enter email and password.'); return; }
    setLoginErr('');
    setLoggingIn(true);
    try {
      const res = await fetch('/api/auth/printer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setLoggingIn(false);
      if (res.ok && data.success) {
        localStorage.setItem('printer_token', data.token);
        setScreen('dashboard');
        showToast('Press terminal activated!', 'success');
      } else {
        setLoginErr(data.error || 'Invalid credentials.');
      }
    } catch (err) {
      setLoggingIn(false);
      setLoginErr('Unable to connect to server.');
    }
  };

  // Sign out Printer
  const handleLogout = () => {
    localStorage.removeItem('printer_token');
    setScreen('login');
    setEmail('');
    setPassword('');
    showToast('Terminal session closed.', 'info');
  };

  const filteredQueue = queue
    .filter(item => filter === 'all' || item.status === filter)
    .filter(item => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        item.id.toLowerCase().includes(q) ||
        customerName(item.customer).toLowerCase().includes(q) ||
        (item.product && item.product.toLowerCase().includes(q)) ||
        ((item as any).sku && (item as any).sku.toLowerCase().includes(q)) ||
        (item.status && item.status.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  const countByStatus = (s: PrintStatus) => queue.filter(i => i.status === s).length;

  const downloadPDF = async (id: string, customer: string) => {
    showToast(`Compiling print-ready PDF for ${id}…`, 'info');
    try {
      const res = await fetch(`/api/printer/download/${encodeURIComponent(id)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('printer_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTimeout(() => {
          showToast('Preparing print file…', 'info');
          setTimeout(() => {
            // Trigger actual browser download
            const link = document.createElement('a');
            link.href = data.url;
            link.download = data.filename;
            link.target = '_blank';
            link.click();
            showToast(`Downloaded: ${data.filename}`, 'success');
            // Downloading the file means printing has started, not that the
            // job is finished. Marking it complete here would both misreport
            // progress and be rejected as a stage skip by the backend.
            updateJobStatus(id, 'processing');
          }, 900);
        }, 900);
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || `Compiling failed (Status: ${res.status}).`, 'error');
      }
    } catch (err) {
      showToast('Failed to contact print compiler.', 'error');
    }
  };

  const updateJobStatus = async (id: string, newStatus: PrintStatus) => {
    try {
      const res = await fetch(`/api/printer/queue/${encodeURIComponent(id)}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('printer_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setQueue(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
        showToast(`Order ${id} status updated to ${newStatus}.`, 'success');
      } else {
        showToast('Failed to update status.', 'error');
      }
    } catch (err) {
      showToast('Error syncing status update.', 'error');
    }
  };

  const batchDownload = () => {
    const ready = queue.filter(i => i.status === 'print-ready');
    if (!ready.length) { showToast('No print-ready jobs in queue.', 'warning'); return; }
    showToast(`Assembling ${ready.length} PDF files into ZIP…`, 'info');
    setTimeout(() => showToast(`Batch of ${ready.length} vector files ready for download.`, 'success'), 1500);
  };

  const tabs: { id: StatusFilter; label: string; count?: number }[] = [
    { id: 'all',         label: 'All Jobs',    count: queue.length            },
    { id: 'pending',     label: 'Pending',     count: countByStatus('pending')     },
    { id: 'processing',  label: 'Processing',  count: countByStatus('processing')  },
    { id: 'print-ready', label: 'Print Ready', count: countByStatus('print-ready') },
    { id: 'completed',   label: 'Completed',   count: countByStatus('completed')   },
  ];

  // ── RENDER LOGIN VIEW ──
  if (screen === 'login') {
    return (
      <div className="admin-split-layout">
        {/* Left – Credentials Form */}
        <div className="admin-split-left">
          <div className="admin-login-form-wrap">
            <div className="admin-login-logo" style={{ marginBottom: '20px' }}>
              <img src={mainLogo} alt="the Prink Logo" style={{ height: '48px', width: 'auto', display: 'block' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>
              Printer Terminal
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.875rem' }}>
              Access local queue &amp; download vector files
            </p>
            <form onSubmit={isRegister ? handleRegister : handleLogin} autoComplete="off">
                {isRegister && (
                  <>
                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                      <label className="label" htmlFor="printer-name">Operator Name</label>
                      <input
                        id="printer-name"
                        className="input"
                        type="text"
                        placeholder="Operator Name"
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                      />
                    </div>
                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                      <label className="label" htmlFor="printer-phone">Phone Number</label>
                      <input
                        id="printer-phone"
                        className="input"
                        type="tel"
                        placeholder="Optional"
                        value={regPhone}
                        onChange={e => setRegPhone(e.target.value)}
                      />
                    </div>
                  </>
                )}
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="label" htmlFor="printer-email">Operator Email</label>
                <input
                  id="printer-email"
                  ref={emailRef}
                  className="input"
                  type="email"
                  placeholder="printer@theprink.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label className="label" htmlFor="printer-password">Terminal Password</label>
                <input
                  id="printer-password"
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
              </div>
              {loginErr && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
                  padding: '0.75rem 1rem', color: '#dc2626', fontSize: '0.8125rem', marginBottom: '1rem'
                }}>
                  <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '0.4rem' }} />
                  {loginErr}
                </div>
              )}
              <button
                type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 1rem' }}
                  onClick={isRegister ? handleRegister : handleLogin}
                  disabled={loggingIn}
                >
                  {loggingIn ? <span className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <><i className="bi bi-printer" /> {isRegister ? 'Register' : 'Activate Terminal'}</>}
                </button>
              </form>
              {/* Printer accounts are provisioned by an administrator - there
                  is deliberately no self-signup, since anyone able to create
                  their own printer account could read every approved design. */}
              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Need access? Ask a THE PRINK administrator to create your operator account.
                </span>
              </div>
            <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', marginBottom: '2rem' }}>
              Demo: printer@theprink.com / printer123
            </p>
            <div style={{ textAlign: 'center', opacity: 0.5 }}>
              <img src={websiteLogo} alt="the Prink Website Logo" style={{ height: '22px', width: 'auto', display: 'inline-block' }} />
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="admin-split-right" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
          <div className="admin-split-right-content">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(255,255,255,0.1)', borderRadius: '20px',
              padding: '0.375rem 0.875rem', marginBottom: '2rem'
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }} />
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Print Station Active</span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '0.75rem' }}>
              Press Operations Terminal
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
              Direct access to print queue jobs, alignment sheets, registration references, and instant print-file downloads.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: 'bi-file-earmark-pdf',     text: 'Download vector print PDF/X-1a formats' },
                { icon: 'bi-sliders',              text: 'Press registration & alignment checks'   },
                { icon: 'bi-arrow-left-right',     text: 'Trim mark & bleed verification overlay' },
                { icon: 'bi-check2-all',           text: 'Real-time status updates sync'          },
              ].map(f => (
                <li key={f.icon} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <span style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <i className={`bi ${f.icon}`} style={{ color: '#fff', fontSize: '0.95rem' }} />
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER TERMINAL VIEW ──
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0B0F33 0%, #171C62 100%)', 
      padding: '40px 28px',
      fontFamily: "'Inter', sans-serif" 
    }}>
      <style>{`
        .tab-bar { display: flex; gap: 10px; margin-bottom: 24px; }
        .tab-item { padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #94A3B8; cursor: pointer; transition: 0.2s; font-size: 13px; font-weight: 500; }
        .tab-item.active { background: rgba(255, 255, 255, 0.1); color: #FFF; border-color: rgba(255, 255, 255, 0.2); font-weight: 600; }
        .clean-table { width: 100%; border-collapse: collapse; color: rgba(255,255,255,0.85); font-size: 13px; }
        .clean-table th { text-align: left; padding: 16px; color: #94A3B8; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .clean-table td { padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .clean-table tr:hover { background: rgba(255,255,255,0.02); }
        .dark-input::placeholder { color: rgba(255,255,255,0.4); }
        .btn-dark-outline { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #FFF; transition: 0.2s; }
        .btn-dark-outline:hover { background: rgba(255,255,255,0.1); }
        .priority-badge { display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .priority-badge.high { background: rgba(255, 48, 76, 0.15); color: #FF304C; }
        .priority-badge.normal { background: rgba(255, 255, 255, 0.1); color: #E2E8F0; }
        .status-chip { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .status-chip.print-ready { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
        .status-chip.processing { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
        .status-chip.pending { background: rgba(255, 255, 255, 0.1); color: #E2E8F0; border: 1px solid rgba(255, 255, 255, 0.2); }
        .status-chip.completed { background: rgba(255, 255, 255, 0.05); color: #94A3B8; }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* ── Page Header ── */}
        <div className="glass-header flex justify-between align-center section-header mb-8" style={{ flexWrap: 'wrap', gap: 16, alignItems: 'center', padding: '24px 32px', borderRadius: '24px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* For dark mode, you typically want a white logo, assuming mainLogo has good contrast or we drop brightness. Let's just use it as is or add a filter if it's dark text */}
            <div style={{ background: '#FFF', padding: '8px 12px', borderRadius: '12px' }}>
              <img src={mainLogo} alt="the Prink" style={{ height: 32, width: 'auto', display: 'block' }} />
            </div>
            <div style={{ borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: 20, minHeight: 44, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h2 className="page-heading" style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', margin: 0, paddingLeft: 0, borderLeft: 'none', letterSpacing: '0.02em' }}>
                Printer Operator Terminal
              </h2>
              <p className="text-sm" style={{ marginTop: 4, marginBottom: 0, color: '#94A3B8' }}>
                Manage and download compiled print-ready vector layouts.
              </p>
            </div>
          </div>
          <div className="flex gap-3 align-center flex-wrap">
            <button className="btn btn-dark-outline btn-sm" onClick={fetchQueue}>
              <i className="bi bi-arrow-repeat" /> Refresh
            </button>
            <button className="btn btn-primary btn-sm" style={{ background: '#FF304C', border: 'none', boxShadow: '0 4px 12px rgba(255,48,76,0.3)', color: '#FFF' }} onClick={batchDownload}>
              <i className="bi bi-download" /> Batch Download
            </button>
            <button className="btn btn-dark-outline btn-sm" style={{ padding: '6px 12px' }} onClick={handleLogout}>
              <i className="bi bi-box-arrow-right" /> Terminal Log Out
            </button>
          </div>
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-4 gap-6 mb-8">
          {[
            { label: 'Total Jobs',     value: queue.length,                       icon: 'bi-printer',        variant: '' },
            { label: 'Pending',        value: countByStatus('pending'),            icon: 'bi-clock',          variant: ' accent' },
            { label: 'Print Ready',    value: countByStatus('print-ready'),        icon: 'bi-check-circle',   variant: ' success' },
            { label: 'Completed Today',value: countByStatus('completed') + 12,    icon: 'bi-bag-check',      variant: '' },
          ].map((m, i) => (
            <div key={i} className={`glass-panel metric-card${m.variant}`} style={{ borderRadius: '24px', padding: '24px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
              <div className="flex justify-between align-center mb-4">
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8' }}>{m.label}</p>
                <span style={{ width: 36, height: 36, background: m.variant.includes('accent') ? 'rgba(255,48,76,0.15)' : m.variant.includes('success') ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`bi ${m.icon}`} style={{ fontSize: 16, color: m.variant.includes('accent') ? '#FF304C' : m.variant.includes('success') ? '#10b981' : '#E2E8F0' }} />
                </span>
              </div>
              <h3 style={{ fontSize: 36, fontWeight: 800, color: '#FFFFFF', lineHeight: 1, margin: '0' }}>{m.value}</h3>
            </div>
          ))}
        </div>

        {/* ── Print Queue Card ── */}
        <div className="glass-panel p-8 mb-8" style={{ borderRadius: '32px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
        {/* Tab Bar */}
        <div className="tab-bar">
          {tabs.map(t => (
            <button key={t.id}
              className={`tab-item${filter === t.id ? ' active' : ''}`}
              onClick={() => setFilter(t.id)}
            >
              {t.label}
              {t.count !== undefined && (
                <span style={{ marginLeft: 6, opacity: 0.7 }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text"
              placeholder="Search by Order ID, Customer, SKU, Status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dark-input"
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                fontSize: '0.875rem',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(0,0,0,0.2)',
                color: '#FFF',
                outline: 'none'
              }}
            />
            <i className="bi bi-search" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.9rem' }} />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
              >
                <i className="bi bi-x-circle-fill" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="clean-table" id="printer-queue-tbody">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Product Specs</th>
                <th>Trim Size</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    <i className="bi bi-inbox" style={{ fontSize: 32, display: 'block', marginBottom: 12, opacity: 0.5 }} />
                    No jobs matching this filter.
                  </td>
                </tr>
              ) : filteredQueue.map(item => (
                <tr key={item.id} id={`printer-row-${item.id}`}>
                  <td><span style={{ fontWeight: 700, color: '#FFF', fontSize: 13 }}>{item.id}</span></td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13, color: '#E2E8F0' }}>
                      {customerName(item.customer)}
                    </div>
                  </td>

                  <td><span style={{ color: '#94A3B8' }}>{item.product}</span></td>
                  <td>
                    <span style={{ fontWeight: 600, fontSize: 12, color: '#E2E8F0' }}>{item.trimSize}</span>
                    <br />
                    <span style={{ fontSize: 11, color: '#64748B' }}>+0.125" bleed</span>
                  </td>
                  <td>
                    <span className={`priority-badge ${item.priority}`}>
                      {item.priority === 'high' && <i className="bi bi-arrow-up" style={{ marginRight: 4 }} />}
                      {item.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`status-chip ${item.status}`}>
                      {STATUS_META[item.status]?.label ?? item.status}
                    </span>
                  </td>
                  <td><span style={{ color: '#94A3B8', fontSize: 12 }}>{item.assignedAt}</span></td>
                  <td style={{ textAlign: 'right', paddingRight: '24px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'nowrap', alignItems: 'center' }}>
                      {item.status === 'print-ready' && (
                        <>
                          <button className="btn btn-primary btn-sm"
                            style={{ background: '#FF304C', border: 'none', color: '#FFF' }}
                            onClick={() => downloadPDF(item.id, customerName(item.customer))}>
                            <i className="bi bi-file-earmark-pdf" /> PDF
                          </button>
                          <button className="btn btn-dark-outline btn-sm"
                            onClick={() => updateJobStatus(item.id, 'completed')}>
                            Done
                          </button>
                        </>
                      )}
                      {item.status === 'processing' && (
                        <>
                          <button className="btn btn-primary btn-sm"
                            style={{ background: '#FF304C', border: 'none', color: '#FFF' }}
                            onClick={() => downloadPDF(item.id, customerName(item.customer))}>
                            <i className="bi bi-file-earmark-pdf" /> PDF
                          </button>
                          <button className="btn btn-dark-outline btn-sm"
                            onClick={() => updateJobStatus(item.id, 'completed')}>
                            Done
                          </button>
                        </>
                      )}
                        {item.status === 'pending' && (
                          <>
                            <button className="btn btn-primary btn-sm"
                              style={{ background: '#FF304C', border: 'none', color: '#FFF' }}
                              onClick={() => downloadPDF(item.id, customerName(item.customer))}>
                              <i className="bi bi-file-earmark-pdf" /> PDF
                            </button>
                            <button className="btn btn-dark-outline btn-sm"
                              onClick={() => updateJobStatus(item.id, 'processing')}>
                              <i className="bi bi-play" /> Start
                            </button>
                          </>
                        )}
                      {item.status === 'completed' && (
                        <span className="status-chip completed">
                          <i className="bi bi-check" style={{ marginRight: 4 }} /> Delivered
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Registration calibration preview ── */}
      <div className="glass-panel p-8" style={{ borderRadius: '32px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
        <div className="flex justify-between align-center mb-6">
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#FFF', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
              Registration Mark Preview
            </h4>
            <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, marginBottom: 0 }}>Alignment reference for press operators</p>
          </div>
          <span className="status-chip" style={{ background: 'rgba(255,255,255,0.1)', color: '#FFF' }}><i className="bi bi-printer" style={{ marginRight: 6 }} /> Print Calibration</span>
        </div>

        <div style={{
          height: 260,
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.05)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Print Sheet Mockup */}
          <div style={{ background: '#F8FAFC', width: 420, height: 190, border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', position: 'relative', borderRadius: 4 }}>
            {/* Bleed border */}
            <div style={{ position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, border: '1.5px dashed #FF304C', borderRadius: 4, opacity: 0.8 }} />
            {/* Crosshairs */}
            {([[-20,-20], [-20,'calc(100% + 6px)'], ['calc(100% + 6px)',-20], ['calc(100% + 6px)','calc(100% + 6px)']] as [number|string, number|string][]).map((pos, i) => (
              <span key={i} style={{ position: 'absolute', top: pos[0], left: pos[1], fontSize: 14, fontWeight: 900, color: '#171C62', lineHeight: 1 }}>⊕</span>
            ))}
            {/* Calibration + brand colour bars */}
            <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
              {['#00b4d8','#e040fb','#ffd60a','#1a1a1a','#171C62','#FF304C','#0fbe88'].map((c, i) => (
                <div key={i} style={{ width: 16, height: 16, background: c, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
              ))}
            </div>
            {/* Job metadata */}
            <span style={{ position: 'absolute', bottom: 6, left: 10, fontFamily: 'monospace', fontSize: 9, color: '#475569', letterSpacing: '0.05em' }}>
              JOB: {queue[0]?.id ?? '#----'} · the PRINK PRINT ENGINE · v2.1 · RGB/300DPI
            </span>
            {/* Image fill */}
            <div style={{ width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
              <i className="bi bi-images" style={{ fontSize: '48px', color: '#CBD5E1' }} />
            </div>
          </div>
        </div>

        {/* Spec Cards */}
        <div className="flex gap-4 mt-6">
          {[
            { label: 'Color Profile', value: 'sRGB (RGB out)' },
            { label: 'Resolution',    value: '300 DPI min'    },
            { label: 'Bleed',         value: '0.125" all sides'},
            { label: 'Safe Zone',     value: '0.25" from edge' },
            { label: 'File Format',   value: 'PDF/X-1a'       },
            { label: 'Colour Mode',   value: 'ISO Coated v2'  },
          ].map(spec => (
            <div key={spec.label} style={{ flex: 1, padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{spec.label}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#FFF', margin: 0 }}>{spec.value}</p>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}






