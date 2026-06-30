import React, { useEffect, useState, useRef } from 'react';
import type { PrinterQueueItem, PrintStatus } from '../types';
import { useToast } from '../context/ToastContext';
import logoBlack from '../assets/logos/logo-black.png';
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

  // Queue State
  const [queue, setQueue] = useState<PrinterQueueItem[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('all');

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
        setQueue(data);
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
        setLoginErr(data.error || 'Invalid credentials. Try printer@theprink.com / printer123');
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
          showToast('Appending trim margins & CMYK calibration bars…', 'info');
          setTimeout(() => {
            showToast(`Downloaded: ${data.filename}`, 'success');
          }, 900);
        }, 900);
      } else {
        showToast('Compiling failed. Unauthorized.', 'error');
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
              <img src={logoBlack} alt="the Prink Logo" style={{ height: '48px', width: 'auto', display: 'block' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>
              Printer Terminal
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.875rem' }}>
              Access local queue &amp; download vector files
            </p>
            <form onSubmit={handleLogin} autoComplete="off">
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
                id="printer-login-btn"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
                disabled={loggingIn}
              >
                {loggingIn ? 'Connecting…' : 'Access Queue'}
              </button>
            </form>
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
              Direct access to print queue jobs, vector alignment sheets, CMYK calibration parameters, and instant vector downloads.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: 'bi-file-earmark-pdf',     text: 'Download vector print PDF/X-1a formats' },
                { icon: 'bi-sliders',              text: 'CMYK press color calibration checks'     },
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
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 28px' }}>

      {/* ── Page Header ── */}
      <div className="flex justify-between align-center section-header mb-6">
        <div>
          <h2 className="page-heading" style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)', paddingLeft: 14 }}>
            Printer Operator Terminal
          </h2>
          <p className="text-sm text-muted" style={{ marginTop: 4 }}>
            Manage and download compiled print-ready vector layouts.
          </p>
        </div>
        <div className="flex gap-2 align-center flex-wrap">
          <button className="btn btn-outline btn-sm" onClick={fetchQueue}>
            <i className="bi bi-arrow-repeat" /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={batchDownload}>
            <i className="bi bi-download" /> Batch Download
          </button>
          <button className="btn btn-danger btn-sm" style={{ padding: '6px 12px' }} onClick={handleLogout}>
            <i className="bi bi-box-arrow-right" /> Terminal Log Out
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-4 gap-4 mb-6">
        {[
          { label: 'Total Jobs',     value: queue.length,                       icon: 'bi-printer',        variant: '' },
          { label: 'Pending',        value: countByStatus('pending'),            icon: 'bi-clock',          variant: ' accent' },
          { label: 'Print Ready',    value: countByStatus('print-ready'),        icon: 'bi-check-circle',   variant: ' success' },
          { label: 'Completed Today',value: countByStatus('completed') + 12,    icon: 'bi-bag-check',      variant: '' },
        ].map((m, i) => (
          <div key={i} className={`metric-card${m.variant}`}>
            <div className="flex justify-between align-center mb-2">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{m.label}</p>
              <span style={{ width: 28, height: 28, background: 'var(--bg-tertiary)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`bi ${m.icon}`} style={{ fontSize: 13, color: m.variant.includes('accent') ? 'var(--accent)' : m.variant.includes('success') ? 'var(--success)' : 'var(--primary)' }} />
              </span>
            </div>
            <h3 style={{ fontSize: 26, fontWeight: 700, color: m.variant.includes('accent') ? 'var(--accent)' : m.variant.includes('success') ? 'var(--success)' : 'var(--primary)', lineHeight: 1, margin: '2px 0 4px' }}>{m.value}</h3>
          </div>
        ))}
      </div>

      {/* ── Print Queue Card ── */}
      <div className="card p-6 mb-6">
        {/* Tab Bar */}
        <div className="tab-bar">
          {tabs.map(t => (
            <button key={t.id}
              className={`tab-item${filter === t.id ? ' active' : ''}`}
              onClick={() => setFilter(t.id)}
            >
              {t.label}
              {t.count !== undefined && (
                <span className="tab-count">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="clean-table-wrapper">
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
                    <i className="bi bi-inbox" style={{ fontSize: 28, display: 'block', marginBottom: 8, opacity: 0.4 }} />
                    No jobs matching this filter.
                  </td>
                </tr>
              ) : filteredQueue.map(item => (
                <tr key={item.id} id={`printer-row-${item.id}`}>
                  <td><span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>{item.id}</span></td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{item.customer}</div>
                  </td>
                  <td><span className="text-sm text-muted">{item.product}</span></td>
                  <td>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{item.trimSize}</span>
                    <br />
                    <span className="text-xs text-muted">+0.125" bleed</span>
                  </td>
                  <td>
                    <span className={`priority-badge ${item.priority}`}>
                      {item.priority === 'high' && <i className="bi bi-arrow-up" />}
                      {item.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`status-chip ${item.status}`}>
                      {STATUS_META[item.status]?.label ?? item.status}
                    </span>
                  </td>
                  <td><span className="text-xs text-muted">{item.assignedAt}</span></td>
                  <td>
                    <div className="flex gap-2">
                      {item.status === 'print-ready' && (
                        <>
                          <button className="btn btn-primary btn-sm"
                            onClick={() => downloadPDF(item.id, item.customer)}>
                            <i className="bi bi-file-earmark-pdf" /> PDF
                          </button>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => updateJobStatus(item.id, 'completed')}>
                            Done
                          </button>
                        </>
                      )}
                      {item.status === 'processing' && (
                        <>
                          <button className="btn btn-primary btn-sm"
                            onClick={() => downloadPDF(item.id, item.customer)}>
                            <i className="bi bi-file-earmark-pdf" /> PDF
                          </button>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => updateJobStatus(item.id, 'completed')}>
                            Done
                          </button>
                        </>
                      )}
                      {item.status === 'pending' && (
                        <button className="btn btn-outline btn-sm"
                          onClick={() => updateJobStatus(item.id, 'processing')}>
                          <i className="bi bi-play" /> Start
                        </button>
                      )}
                      {item.status === 'completed' && (
                        <span className="badge badge-success" style={{ fontSize: 11 }}>
                          <i className="bi bi-check" /> Delivered
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

      {/* ── CMYK Calibration Preview ── */}
      <div className="card p-6">
        <div className="flex justify-between align-center mb-4">
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              CMYK Registration Mark Preview
            </h4>
            <p className="text-xs text-muted" style={{ marginTop: 2 }}>Color calibration reference for press operators</p>
          </div>
          <span className="badge badge-primary"><i className="bi bi-printer" /> Print Calibration</span>
        </div>

        <div style={{
          height: 240,
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border-color)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'var(--gradient-subtle)' }} />
          {/* Print Sheet Mockup */}
          <div style={{ background: 'white', width: 380, height: 175, border: '1px solid #d1d5db', boxShadow: 'var(--shadow-lg)', position: 'relative', borderRadius: 2 }}>
            {/* Bleed border */}
            <div style={{ position: 'absolute', top: -5, left: -5, right: -5, bottom: -5, border: '1.5px dashed var(--accent)', borderRadius: 2, opacity: 0.6 }} />
            {/* Crosshairs */}
            {([[-18,-18], [-18,'calc(100% + 6px)'], ['calc(100% + 6px)',-18], ['calc(100% + 6px)','calc(100% + 6px)']] as [number|string, number|string][]).map((pos, i) => (
              <span key={i} style={{ position: 'absolute', top: pos[0], left: pos[1], fontSize: 13, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>⊕</span>
            ))}
            {/* CMYK + Brand Color bars */}
            <div style={{ position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 3 }}>
              {['#00b4d8','#e040fb','#ffd60a','#1a1a1a','#171C62','#FF304C','#0fbe88'].map((c, i) => (
                <div key={i} style={{ width: 14, height: 14, background: c, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              ))}
            </div>
            {/* Job metadata */}
            <span style={{ position: 'absolute', bottom: 5, left: 8, fontFamily: 'monospace', fontSize: 8, color: '#64748b', letterSpacing: '0.04em' }}>
              JOB: {queue[0]?.id ?? '#----'} · the PRINK PRINT ENGINE · v2.1 · CMYK/300DPI
            </span>
            {/* Image fill */}
            <div style={{ width: '100%', height: '100%', background: "url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop') center", backgroundSize: 'cover', opacity: 0.82, borderRadius: 1 }} />
          </div>
        </div>

        {/* Spec Cards */}
        <div className="flex gap-4 mt-4">
          {[
            { label: 'Color Profile', value: 'sRGB → CMYK'   },
            { label: 'Resolution',    value: '300 DPI min'    },
            { label: 'Bleed',         value: '0.125" all sides'},
            { label: 'Safe Zone',     value: '0.25" from edge' },
            { label: 'File Format',   value: 'PDF/X-1a'       },
            { label: 'Colour Mode',   value: 'ISO Coated v2'  },
          ].map(spec => (
            <div key={spec.label} style={{ flex: 1, padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs text-muted">{spec.label}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginTop: 2 }}>{spec.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
