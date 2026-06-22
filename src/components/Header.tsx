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
    <header className={`app-header${activePortal === 'printer' ? ' printer-header' : ''}`}>
      {/* ── Brand Logo ── */}
      <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        <img 
          src={getLogo()} 
          alt="the Prink Logo" 
          style={{ 
            height: activePortal === 'printer' ? '28px' : '32px', 
            width: 'auto', 
            display: 'block' 
          }} 
        />
      </div>


      {/* ── Portal Switcher Tabs ── */}
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

      {/* ── Right Controls ── */}
      <div className="flex align-center gap-2">
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
    </header>
  );
}
