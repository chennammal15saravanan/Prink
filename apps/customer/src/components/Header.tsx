import React from 'react';
import mainLogo from '../assets/logos/main-logo.png';
import { useToast } from '../context/ToastContext';

export default function Header() {
  const { showToast } = useToast();

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <img src={mainLogo} alt="Prink Logo" style={{ height: '28px', objectFit: 'contain' }} />
        </div>
        <div className="header-right">
          <div className="status-badge connected">
            <i className="bi bi-circle-fill"></i> API Connected
          </div>
          <button className="icon-button" onClick={() => showToast('Toggle Dark Mode', 'info')}>
            <i className="bi bi-moon-stars"></i>
          </button>
        </div>
      </header>
    </>
  );
}

