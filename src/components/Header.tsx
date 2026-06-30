import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { PortalType } from '../types';
import { useToast } from '../context/ToastContext';
import mainLogo from '../assets/logos/main-logo.png';
import logoBlack from '../assets/logos/logo-black.png';
import whiteLogo from '../assets/logos/white-logo.png';

interface HeaderProps {
  activePortal: PortalType;
}

export default function Header({ activePortal }: HeaderProps) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isDark, setIsDark] = React.useState(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });
  const [connectionStatus, setConnectionStatus] = React.useState<'checking' | 'connected' | 'error'>('checking');
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('error');
        }
      } catch (err) {
        setConnectionStatus('error');
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    showToast(next ? 'Dark mode enabled' : 'Light mode enabled', 'success');
  };

  const getLogo = () => {
    if (activePortal === 'printer') {
      return whiteLogo;
    }
    if (isDark) {
      return whiteLogo;
    }
    return activePortal === 'admin' ? logoBlack : mainLogo;
  };

  const portals: { id: PortalType; label: string; icon: string }[] = [
    { id: 'customer', label: 'Customer',  icon: 'bi-person'        },
    { id: 'admin',    label: 'Admin',     icon: 'bi-shield-check'  },
    { id: 'printer',  label: 'Printer',   icon: 'bi-printer'       },
  ];

  return (
    <>
      <header className={`app-header${activePortal === 'printer' ? ' printer-header' : ''}`}>
        {/* ── Brand Logo ── */}
        <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <img 
            src={getLogo()} 
            alt="the Prink Logo" 
            style={{ 
              height: activePortal === 'printer' ? '24px' : '28px', 
              width: 'auto', 
              display: 'block' 
            }} 
          />
        </div>

        {/* ── Portal Switcher Tabs (Desktop Only) ── */}
        <nav className="portal-tabs">
          {portals.map(p => (
            <button
              key={p.id}
              id={`tab-portal-${p.id}`}
              className={`portal-tab${activePortal === p.id ? ' active' : ''}`}
              onClick={() => {
                if (p.id === 'customer') {
                  navigate('/');
                } else {
                  navigate(`/${p.id}`);
                }
                showToast(`Switched to ${p.label} Portal`, 'info');
              }}
            >
              <i className={`bi ${p.icon}`} style={{ marginRight: 5, fontSize: 12 }} />
              {p.label} Portal
            </button>
          ))}
        </nav>

        {/* ── Right Controls (Desktop Only) ── */}
        <div className="flex align-center gap-2">
          {/* Connection Status */}
          <div 
            className="flex align-center gap-1 text-xs" 
            style={{ 
              padding: '6px 12px', 
              borderRadius: 'var(--radius-full)', 
              backgroundColor: connectionStatus === 'connected' ? 'rgba(34, 197, 94, 0.1)' : connectionStatus === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              color: connectionStatus === 'connected' ? '#22c55e' : connectionStatus === 'error' ? '#ef4444' : '#3b82f6',
              border: `1px solid ${connectionStatus === 'connected' ? 'rgba(34, 197, 94, 0.2)' : connectionStatus === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
              fontWeight: 600,
              fontSize: '11px',
              userSelect: 'none'
            }}
          >
            <span 
              className={connectionStatus === 'checking' ? 'animate-pulse' : ''}
              style={{ 
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'currentColor'
              }} 
            />
            <span>{connectionStatus === 'connected' ? 'API Connected' : connectionStatus === 'error' ? 'API Offline' : 'Checking API...'}</span>
          </div>

          {/* Theme Toggle */}
          <button
            id="btn-theme-toggle"
            className="btn btn-outline btn-sm"
            style={{ borderRadius: 'var(--radius-full)', padding: '6px 12px' }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            onClick={toggleTheme}
          >
            <i className={`bi ${isDark ? 'bi-sun-fill' : 'bi-moon-stars-fill'}`}
              style={{ color: isDark ? '#f59e0b' : 'var(--primary)', fontSize: 13 }} />
          </button>
        </div>

        {/* Hamburger Menu Button (Mobile Only) */}
        <button className="hamburger-btn" onClick={() => setIsDrawerOpen(true)}>
          <i className="bi bi-list" />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      <div className={`side-drawer-overlay${isDrawerOpen ? ' active' : ''}`} onClick={() => setIsDrawerOpen(false)} />

      {/* Mobile Drawer Menu */}
      <div className={`side-drawer${isDrawerOpen ? ' active' : ''}`}>
        <div className="side-drawer-header">
          <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '15px' }}>Navigation Menu</span>
          <button className="btn btn-outline btn-sm" style={{ padding: '6px 10px' }} onClick={() => setIsDrawerOpen(false)}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="side-drawer-nav">
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Portals</div>
          {portals.map(p => (
            <button
              key={p.id}
              className={`side-drawer-nav-item${activePortal === p.id ? ' active' : ''}`}
              onClick={() => {
                setIsDrawerOpen(false);
                if (p.id === 'customer') {
                  navigate('/');
                } else {
                  navigate(`/${p.id}`);
                }
                showToast(`Switched to ${p.label} Portal`, 'info');
              }}
            >
              <i className={`bi ${p.icon}`} style={{ fontSize: '16px' }} />
              <span>{p.label} Portal</span>
            </button>
          ))}
          
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '12px 0' }} />
          
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>System Settings</div>
          <button className="side-drawer-nav-item" onClick={() => { setIsDrawerOpen(false); toggleTheme(); }}>
            <i className={`bi ${isDark ? 'bi-sun-fill' : 'bi-moon-stars-fill'}`} style={{ color: isDark ? '#f59e0b' : 'var(--primary)' }} />
            <span>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
          </button>

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '12px 0' }} />

          {/* Mobile Connection Status */}
          <div 
            className="flex align-center gap-2 text-xs" 
            style={{ 
              padding: '10px 14px', 
              borderRadius: 'var(--radius-md)', 
              backgroundColor: connectionStatus === 'connected' ? 'rgba(34, 197, 94, 0.1)' : connectionStatus === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              color: connectionStatus === 'connected' ? '#22c55e' : connectionStatus === 'error' ? '#ef4444' : '#3b82f6',
              fontWeight: 600,
              fontSize: '12px',
              userSelect: 'none'
            }}
          >
            <span 
              className={connectionStatus === 'checking' ? 'animate-pulse' : ''}
              style={{ 
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'currentColor'
              }} 
            />
            <span>{connectionStatus === 'connected' ? 'API Connected' : connectionStatus === 'error' ? 'API Offline' : 'Checking API...'}</span>
          </div>
        </div>
      </div>
    </>
  );
}
