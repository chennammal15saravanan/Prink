import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PortalType } from '../types';
import { useToast } from '../context/ToastContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (portal: PortalType) => void;
}

const COMMANDS = [
  { key: 'customer-login',     icon: 'bi-box-arrow-in-right', label: 'Customer Portal: Sign Out / Reset', tag: 'Auth',   color: 'var(--primary)' },
  { key: 'customer-dashboard', icon: 'bi-cloud-arrow-up',     label: 'Customer Portal: Uploads',        tag: 'Page',   color: 'var(--primary)' },
  { key: 'admin-login',        icon: 'bi-shield-lock',        label: 'Admin Portal: Sign Out / Reset',   tag: 'Auth',   color: 'var(--accent)'  },
  { key: 'admin-dashboard',    icon: 'bi-grid-1x2',           label: 'Admin Portal: Dashboard',          tag: 'Page',   color: 'var(--accent)'  },
  { key: 'printer-dashboard',  icon: 'bi-printer',            label: 'Printer Portal: Queue',            tag: 'Page',   color: 'var(--primary)' },
  { key: 'toggle-theme',       icon: 'bi-moon-stars',         label: 'Toggle Light/Dark Mode',           tag: 'System', color: 'var(--warning)' },
];

export default function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  const filtered = COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  const handleClick = (key: string) => {
    onClose();
    if (key === 'customer-login') {
      localStorage.removeItem('customer_token');
      onNavigate('customer');
      showToast('Logged out of Customer Portal.', 'info');
    } else if (key === 'customer-dashboard') {
      onNavigate('customer');
    } else if (key === 'admin-login') {
      localStorage.removeItem('admin_token');
      onNavigate('admin');
      showToast('Logged out of Admin Portal.', 'info');
    } else if (key === 'admin-dashboard') {
      onNavigate('admin');
    } else if (key === 'printer-dashboard') {
      onNavigate('printer');
    } else if (key === 'toggle-theme') {
      document.getElementById('btn-theme-toggle')?.click();
    }
  };

  return (
    <div
      className={`cmd-palette${isOpen ? ' active' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="cmd-container">
        {/* Header */}
        <div className="cmd-input-wrapper">
          <i className="bi bi-search" style={{ fontSize: 15, color: 'var(--text-tertiary)' }} />
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Search portals and actions…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button
            onClick={onClose}
            style={{ border: '1px solid var(--border-color)', borderRadius: 6, padding: '2px 7px', background: 'var(--bg-tertiary)', cursor: 'pointer', fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}
          >
            ESC
          </button>
        </div>

        {/* Section label */}
        {filtered.length > 0 && (
          <div style={{ padding: '8px 14px 2px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            Actions
          </div>
        )}

        <div className="cmd-results">
          {filtered.map(cmd => (
            <div key={cmd.key} className="cmd-item" onClick={() => handleClick(cmd.key)}>
              <div className="flex align-center gap-3">
                <span style={{ width: 28, height: 28, background: 'var(--bg-tertiary)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`bi ${cmd.icon}`} style={{ fontSize: 13, color: cmd.color }} />
                </span>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{cmd.label}</span>
              </div>
              <span className="badge badge-secondary text-xs">{cmd.tag}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              <i className="bi bi-search" style={{ display: 'block', fontSize: 22, marginBottom: 8, opacity: 0.4 }} />
              No results for "{query}"
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 16, alignItems: 'center' }}>
          {[['↵', 'Select'], ['↑↓', 'Navigate'], ['Esc', 'Close']].map(([key, action]) => (
            <span key={key} className="flex align-center gap-1" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              <kbd style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 4, padding: '1px 5px', fontSize: 10, color: 'var(--text-secondary)' }}>{key}</kbd>
              {action}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
