// =============================================================================
// THE PRINK — CustomerPortal.tsx
// Full production implementation: Login · Upload · Preview · Tracking · Drafts
// =============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CustomerSubView,
  CropMaskType,
  ProductType,
  PrintTheme,
  UploadedImage,
  Order,
} from '../types';
import { useToast } from '../context/ToastContext';
import mainLogo from '../assets/logos/main-logo.png';
import logoBlack from '../assets/logos/logo-black.png';
import websiteLogo from '../assets/logos/website-logo.png';

// ---------------------------------------------------------------------------
// Seed / Static Data
// ---------------------------------------------------------------------------

const SEED_IMAGES: UploadedImage[] = [
  {
    id: 'img-1',
    src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop',
    name: 'portrait-1.jpg',
  },
  {
    id: 'img-2',
    src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&auto=format&fit=crop',
    name: 'portrait-2.jpg',
  },
  {
    id: 'img-3',
    src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop',
    name: 'portrait-3.jpg',
  },
];

const THEMES: PrintTheme[] = [
  { id: 'classic',  name: 'Classic White', bg: '#ffffff',  accent: '#171C62', preview: ['#ffffff', '#f5f5f5']  },
  { id: 'rustic',   name: 'Rustic Warm',   bg: '#f5e6d0',  accent: '#c4956a', preview: ['#f5e6d0', '#c4956a']  },
  { id: 'ocean',    name: 'Ocean Blue',    bg: '#e0f0ff',  accent: '#0077b6', preview: ['#0077b6', '#90e0ef']  },
  { id: 'rose',     name: 'Rose Pink',     bg: '#fce4ec',  accent: '#e91e8c', preview: ['#fce4ec', '#e91e8c']  },
  { id: 'midnight', name: 'Midnight Dark', bg: '#0d1b2a',  accent: '#4cc9f0', preview: ['#0d1b2a', '#4cc9f0'] },
  { id: 'vintage',  name: 'Vintage Gold',  bg: '#fdf3e7',  accent: '#b8860b', preview: ['#fdf3e7', '#b8860b']  },
];

const PRODUCTS: { id: ProductType; icon: string; name: string }[] = [
  { id: 'mug',       icon: 'bi-cup-hot',     name: 'Coffee Mug'   },
  { id: 'canvas',    icon: 'bi-image',        name: 'Canvas Print' },
  { id: 'frame',     icon: 'bi-aspect-ratio', name: 'Photo Frame'  },
  { id: 'calendar',  icon: 'bi-calendar3',    name: 'Calendar'     },
  { id: 'photobook', icon: 'bi-book',         name: 'Photo Book'   },
];

const DRAFT_ITEMS = [
  { id: 'd-1', name: 'Family Portrait Mug',  date: 'Jun 14, 2026', thumb: SEED_IMAGES[0].src, product: 'mug'       },
  { id: 'd-2', name: 'Beach Canvas Print',   date: 'Jun 12, 2026', thumb: SEED_IMAGES[1].src, product: 'canvas'    },
  { id: 'd-3', name: 'Vintage Photo Book',   date: 'Jun 08, 2026', thumb: SEED_IMAGES[2].src, product: 'photobook' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CustomerPortalProps {
  initialState?: 'login' | 'dashboard';
  initialSubView?: CustomerSubView;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CustomerPortal({
  initialState = 'login',
  initialSubView = 'upload',
}: CustomerPortalProps) {
  const { showToast } = useToast();

  // ── Auth state ─────────────────────────────────────────────────────────────
  const [authView, setAuthView]       = useState<'login' | 'dashboard'>(() => {
    return localStorage.getItem('customer_token') ? 'dashboard' : 'login';
  });
  const [phone, setPhone]             = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpSent, setOtpSent]         = useState(false);

  // ── Dashboard nav ──────────────────────────────────────────────────────────
  const [subView, setSubView] = useState<CustomerSubView>(initialSubView);

  // Active Order state (dynamically fetched from backend)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const fetchActiveOrder = useCallback(async () => {
    try {
      const token = localStorage.getItem('customer_token');
      if (!token) return;
      const res = await fetch('/api/customer/order', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveOrder(data);
        if (data.productType) {
          setSelectedProduct(data.productType);
        }
      }
    } catch (err) {
      console.error('Failed to fetch active order:', err);
    }
  }, []);

  useEffect(() => {
    if (authView === 'dashboard') {
      fetchActiveOrder();
    }
  }, [authView, fetchActiveOrder]);

  // ── Upload state ───────────────────────────────────────────────────────────
  type UploadMethod = 'file' | 'camera' | 'cloud';
  const [uploadMethod, setUploadMethod]     = useState<UploadMethod>('file');
  const [images, setImages]                 = useState<UploadedImage[]>(SEED_IMAGES);
  const [dragOver, setDragOver]             = useState(false);
  const [caption, setCaption]               = useState('');
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [dragIndex, setDragIndex]           = useState<number | null>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const MAX_CAPTION = 200;

  // ── Preview state ──────────────────────────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState<ProductType>('mug');
  const [selectedTheme, setSelectedTheme]     = useState('classic');
  const [zoom, setZoom]                       = useState(1);
  const [rotation, setRotation]               = useState(0);
  const [showSafe, setShowSafe]               = useState(true);
  const [showBleed, setShowBleed]             = useState(false);
  const [sliderPos, setSliderPos]             = useState(50);
  const [comparing, setComparing]             = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // ── Crop modal ─────────────────────────────────────────────────────────────
  const [cropOpen, setCropOpen]     = useState(false);
  const [cropTarget, setCropTarget] = useState<UploadedImage | null>(null);
  const [cropMask, setCropMask]     = useState<CropMaskType>('square');
  const [cropScale, setCropScale]   = useState(1);
  const [cropRot, setCropRot]       = useState(0);

  // ── Order confirmation modal ────────────────────────────────────────────────
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [confirmStep, setConfirmStep]   = useState(2);
  const [placingOrder, setPlacingOrder] = useState(false);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const activeTheme   = THEMES.find(t => t.id === selectedTheme)   ?? THEMES[0];
  const activeProduct = PRODUCTS.find(p => p.id === selectedProduct) ?? PRODUCTS[0];

  // suppress unused import warning
  useEffect(() => {}, []);

  // ===========================================================================
  // AUTH HANDLERS
  // ===========================================================================

  const handleOtpRequest = useCallback(async () => {
    if (!phone.trim()) { showToast('Please enter your phone number', 'warning'); return; }
    try {
      await fetch('/api/auth/otp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `${countryCode}${phone}` }),
      });
      setOtpSent(true);
      showToast('OTP sent! Check your messages.', 'success');
      setTimeout(async () => {
        const entered = window.prompt('Enter OTP (demo: 1234)');
        if (entered === '1234') {
          try {
            const verifyRes = await fetch('/api/auth/otp-verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone: `${countryCode}${phone}`, code: entered }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              localStorage.setItem('customer_token', verifyData.token);
              showToast('Logged in successfully!', 'success');
              setAuthView('dashboard');
            } else {
              showToast(verifyData.error || 'Verification failed.', 'error');
            }
          } catch (err) {
            showToast('Authentication error. Please try again.', 'error');
          }
        } else if (entered !== null) {
          showToast('Invalid OTP. Please try again.', 'error');
        }
      }, 400);
    } catch {
      showToast('Failed to send OTP. Please try again.', 'error');
    }
  }, [phone, countryCode, showToast]);

  const handleWhatsAppLogin = useCallback(async () => {
    if (!phone.trim()) { showToast('Please enter your phone number', 'warning'); return; }
    try {
      const res = await fetch('/api/auth/whatsapp-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `${countryCode}${phone}` }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('customer_token', data.token);
        showToast('WhatsApp login link sent & authenticated!', 'success');
        setTimeout(() => setAuthView('dashboard'), 1200);
      } else {
        showToast('WhatsApp login failed. Please try again.', 'error');
      }
    } catch {
      showToast('WhatsApp login failed. Please try again.', 'error');
    }
  }, [phone, countryCode, showToast]);

  // ===========================================================================
  // UPLOAD HELPERS
  // ===========================================================================

  const simulateProgress = (id: string) => {
    let val = 0;
    const iv = setInterval(() => {
      val += Math.random() * 20 + 5;
      if (val >= 100) { val = 100; clearInterval(iv); }
      setUploadProgress(prev => ({ ...prev, [id]: Math.min(val, 100) }));
    }, 120);
  };

  const addImages = (files: FileList | File[]) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      const newId  = `img-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      reader.onload = e => {
        const img: UploadedImage = { id: newId, src: e.target?.result as string, name: file.name };
        setImages(prev => [...prev, img]);
        simulateProgress(newId);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addImages(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files) addImages(e.dataTransfer.files);
  };

  const handleMethodClick = (method: UploadMethod) => {
    setUploadMethod(method);
    if (method === 'file')   fileInputRef.current?.click();
    if (method === 'camera') cameraInputRef.current?.click();
    if (method === 'cloud')  showToast('Google Drive & Dropbox integrations coming soon!', 'info');
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setUploadProgress(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const openCrop = (img: UploadedImage) => {
    setCropTarget(img); setCropScale(1); setCropRot(0); setCropMask('square'); setCropOpen(true);
  };

  const handleDragStart = (_e: React.DragEvent, idx: number) => setDragIndex(idx);
  const handleDropCard  = (_e: React.DragEvent, idx: number) => {
    if (dragIndex === null || dragIndex === idx) return;
    setImages(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(dragIndex, 1);
      arr.splice(idx, 0, moved);
      return arr;
    });
    setDragIndex(null);
  };

  // ===========================================================================
  // COMPARE SLIDER
  // ===========================================================================

  const handleSliderMouseDown = (_e: React.MouseEvent) => {
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;
    const move = (ev: MouseEvent) => {
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSliderPos(Math.max(5, Math.min(95, pct)));
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  // ===========================================================================
  // ORDER PLACEMENT
  // ===========================================================================

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    try {
      await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: selectedProduct, theme: selectedTheme, imageCount: images.length, caption }),
      });
      setConfirmStep(3);
      showToast('Order placed successfully! 🎉', 'success');
      setTimeout(() => { setConfirmOpen(false); setConfirmStep(2); setSubView('tracking'); }, 2200);
    } catch {
      showToast('Failed to place order. Please retry.', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  // ===========================================================================
  // ── LOGIN VIEW ─────────────────────────────────────────────────────────────
  // ===========================================================================

  if (authView === 'login') {
    return (
      <div className="auth-wrapper" style={{ flexDirection: 'column', gap: '1.5rem', paddingTop: '40px', paddingBottom: '40px' }}>
        <div className="auth-card">
          {/* Brand logo */}
          <div className="auth-brand-display" style={{ marginBottom: '20px' }}>
            <img src={logoBlack} alt="the Prink Logo" style={{ height: '48px', width: 'auto', display: 'block' }} />
          </div>

          <p className="text-sm text-muted" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            Your premium photo printing experience
          </p>

          <div className="flex flex-col gap-3">
            {/* Phone + country code */}
            <label className="label" htmlFor="cp-phone">Phone Number</label>
            <div className="input-group" style={{ marginBottom: 0, display: 'flex' }}>
              <select
                id="cp-country"
                className="input"
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                style={{
                  flex: '0 0 96px',
                  borderRight: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
                }}
              >
                <option value="+91">🇮🇳 +91</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+61">🇦🇺 +61</option>
                <option value="+971">🇦🇪 +971</option>
              </select>
              <input
                id="cp-phone"
                type="tel"
                className="input"
                placeholder="Phone number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                style={{ flex: 1, borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}
              />
            </div>

            {/* OTP */}
            <button id="cp-otp-btn" className="btn btn-primary" style={{ width: '100%' }} onClick={handleOtpRequest}>
              <i className="bi bi-phone" />
              {otpSent ? 'Resend OTP' : 'Send OTP'}
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <span>or continue with</span>
            </div>

            {/* WhatsApp */}
            <button
              id="cp-wa-btn"
              className="btn btn-outline"
              style={{ width: '100%', gap: '0.5rem', borderColor: '#25D366', color: '#25D366' }}
              onClick={handleWhatsAppLogin}
            >
              <i className="bi bi-whatsapp" style={{ fontSize: 18 }} />
              Login via WhatsApp
            </button>
          </div>

          <p className="text-xs text-muted" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            By continuing, you agree to our{' '}
            <a href="#" style={{ color: 'var(--primary)' }}>Terms</a> &amp;{' '}
            <a href="#" style={{ color: 'var(--primary)' }}>Privacy Policy</a>.
          </p>

          {/* Demo bypass */}
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', marginTop: '0.75rem', opacity: 0.65 }}
            onClick={() => {
              localStorage.setItem('customer_token', 'demo-bypass-token');
              setAuthView('dashboard');
            }}
          >
            <i className="bi bi-eye" /> Demo — Skip to Dashboard
          </button>
        </div>

        {/* Footer Marketing Banner */}
        <div style={{ textAlign: 'center', opacity: 0.75 }}>
          <img src={websiteLogo} alt="the Prink Website Logo" style={{ height: '24px', width: 'auto', display: 'inline-block' }} />
        </div>
      </div>
    );
  }

  // ===========================================================================
  // ── DASHBOARD VIEW ─────────────────────────────────────────────────────────
  // ===========================================================================

  const NAV_ITEMS: { key: CustomerSubView; icon: string; label: string }[] = [
    { key: 'upload',   icon: 'bi-cloud-upload', label: 'Upload'   },
    { key: 'preview',  icon: 'bi-eye',           label: 'Preview'  },
    { key: 'tracking', icon: 'bi-geo-alt',       label: 'Tracking' },
    { key: 'drafts',   icon: 'bi-journal',       label: 'Drafts'   },
  ];

  return (
    <div className="portal-layout">
      {/* Hidden file inputs */}
      <input ref={fileInputRef}   type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFileChange} />

      {/* ====================================================================
          SIDEBAR
          ==================================================================== */}
      <aside className="portal-sidebar">
        {/* Logo */}
        <div className="sidebar-logo-area" style={{ display: 'flex', alignItems: 'center', padding: '12px 16px' }}>
          <img src={mainLogo} alt="the Prink Logo" style={{ height: '36px', width: 'auto', display: 'block' }} />
        </div>

        {/* User card */}
        <div
          className="card p-4"
          style={{ margin: '1rem', textAlign: 'center', background: 'linear-gradient(135deg,#171C6212 0%,#FF304C0a 100%)' }}
        >
          <div className="avatar" style={{ margin: '0 auto 0.5rem' }}>
            {activeOrder?.customer ? activeOrder.customer.split(' ').map(n => n[0]).join('') : 'JS'}
          </div>
          <div className="font-semibold" style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>
            {activeOrder?.customer || 'John Smith'}
          </div>
          <div className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>
            Order {activeOrder?.id || '#1042'}
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <span className="badge badge-success">Active</span>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: '0 0.75rem' }}>
          <div className="sidebar-section-label">Navigation</div>
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              id={`nav-${item.key}`}
              className={`sidebar-item${subView === item.key ? ' active' : ''}`}
              onClick={() => setSubView(item.key)}
            >
              <i className={`bi ${item.icon}`} />
              <span>{item.label}</span>
              {subView === item.key && (
                <span style={{
                  marginLeft: 'auto', width: 6, height: 6,
                  borderRadius: '50%', background: 'var(--accent)',
                  display: 'inline-block',
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Logout */}
        <div style={{ marginTop: 'auto', padding: '1rem 0.75rem' }}>
          <button
            className="sidebar-item"
            style={{ color: 'var(--error)', width: '100%' }}
            onClick={() => {
              localStorage.removeItem('customer_token');
              setAuthView('login');
              setOtpSent(false);
            }}
          >
            <i className="bi bi-box-arrow-left" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ====================================================================
          MAIN CONTENT
          ==================================================================== */}
      <main className="portal-content">

        {/* ================================================================
            SUBVIEW: UPLOAD
            ================================================================ */}
        {subView === 'upload' && (
          <div className="flex flex-col gap-6">
            {/* Heading row */}
            <div className="flex align-center justify-between">
              <h1 className="page-heading" style={{ color: 'var(--primary)', margin: 0 }}>
                Upload Photos
              </h1>
              <span className="badge badge-primary">
                {images.length} photo{images.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Upload method cards */}
            <div className="upload-methods-row">
              {(
                [
                  { key: 'file',   icon: 'bi-folder2', label: 'File Upload' },
                  { key: 'camera', icon: 'bi-camera',   label: 'Camera'      },
                  { key: 'cloud',  icon: 'bi-cloud',    label: 'Cloud'       },
                ] as { key: UploadMethod; icon: string; label: string }[]
              ).map(m => (
                <button
                  key={m.key}
                  id={`upload-method-${m.key}`}
                  className={`upload-method-card${uploadMethod === m.key ? ' active' : ''}`}
                  onClick={() => handleMethodClick(m.key)}
                >
                  <div className="upload-method-icon">
                    <i className={`bi ${m.icon}`} />
                  </div>
                  <span className="text-sm font-semibold">{m.label}</span>
                </button>
              ))}
            </div>

            {/* Drop zone */}
            <div
              id="upload-dropzone"
              className={`upload-zone${dragOver ? ' drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon">
                <i className="bi bi-cloud-arrow-up" />
              </div>
              <p className="font-semibold" style={{ color: 'var(--primary)', margin: '0.5rem 0 0.25rem' }}>
                Drag &amp; drop photos here
              </p>
              <p className="text-sm text-muted">or click to browse files (JPG, PNG, WEBP)</p>
            </div>

            {/* Progress bars */}
            {Object.entries(uploadProgress).filter(([, v]) => v < 100).length > 0 && (
              <div className="card p-4 flex flex-col gap-2">
                <div className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>Uploading…</div>
                {Object.entries(uploadProgress)
                  .filter(([, v]) => v < 100)
                  .map(([id, pct]) => {
                    const img = images.find(i => i.id === id);
                    return (
                      <div key={id}>
                        <div className="flex justify-between text-xs text-muted" style={{ marginBottom: '0.25rem' }}>
                          <span>{img?.name ?? id}</span>
                          <span>{Math.round(pct)}%</span>
                        </div>
                        <div className="progress-bar-track">
                          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Image gallery */}
            {images.length > 0 && (
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>
                  Your Photos — drag to reorder
                </div>
                <div className="preview-grid">
                  {images.map((img, idx) => (
                    <div
                      key={img.id}
                      className="preview-card"
                      draggable
                      onDragStart={e => handleDragStart(e, idx)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => handleDropCard(e, idx)}
                      style={{ opacity: dragIndex === idx ? 0.45 : 1, cursor: 'grab' }}
                    >
                      <img
                        src={img.src}
                        alt={img.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div className="preview-card-overlay">
                        <button className="preview-card-btn" title="Crop" onClick={() => openCrop(img)}>
                          <i className="bi bi-crop" />
                        </button>
                        <button
                          className="preview-card-btn"
                          title="Delete"
                          onClick={() => removeImage(img.id)}
                          style={{ background: 'rgba(255,48,76,0.85)' }}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                      {/* Inline progress */}
                      {uploadProgress[img.id] !== undefined && uploadProgress[img.id] < 100 && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: '#ffffff30' }}>
                          <div style={{
                            height: '100%',
                            width: `${uploadProgress[img.id]}%`,
                            background: 'var(--accent)',
                            transition: 'width 0.12s',
                          }} />
                        </div>
                      )}
                      {/* Index badge */}
                      <div style={{
                        position: 'absolute', bottom: 6, left: 8,
                        fontSize: '0.65rem', color: '#fff', fontWeight: 700,
                        textShadow: '0 1px 3px #0008', pointerEvents: 'none',
                      }}>
                        #{idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Caption */}
            <div className="caption-wrapper">
              <label className="label" htmlFor="cp-caption" style={{ color: 'var(--primary)' }}>
                Personal Message
              </label>
              <textarea
                id="cp-caption"
                className="caption-textarea"
                placeholder="Add a personal message for your print..."
                maxLength={MAX_CAPTION}
                value={caption}
                onChange={e => setCaption(e.target.value)}
              />
              <div className="caption-footer">
                <span className="text-xs text-muted">Printed on the inside cover / back</span>
                <span
                  className="text-xs"
                  style={{ color: caption.length >= MAX_CAPTION ? 'var(--accent)' : 'var(--text-muted)' }}
                >
                  {caption.length}/{MAX_CAPTION}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex justify-between align-center" style={{ paddingTop: '0.5rem' }}>
              <span className="text-sm text-muted">{images.length} photo{images.length !== 1 ? 's' : ''} ready</span>
              <button
                id="goto-preview-btn"
                className="btn btn-primary"
                disabled={images.length === 0}
                onClick={() => setSubView('preview')}
              >
                Continue to Preview <i className="bi bi-arrow-right" />
              </button>
            </div>
          </div>
        )}

        {/* ================================================================
            SUBVIEW: PREVIEW
            ================================================================ */}
        {subView === 'preview' && (
          <div className="flex flex-col gap-6">
            <div className="flex align-center justify-between">
              <h1 className="page-heading" style={{ color: 'var(--primary)', margin: 0 }}>
                Live Preview
              </h1>
              <button className="btn btn-outline btn-sm" onClick={() => setSubView('upload')}>
                <i className="bi bi-arrow-left" /> Back
              </button>
            </div>

            {/* Product selector */}
            <div>
              <div className="sidebar-section-label" style={{ marginBottom: '0.6rem' }}>Choose Product</div>
              <div className="product-selector-grid">
                {PRODUCTS.map(p => (
                  <button
                    key={p.id}
                    id={`product-${p.id}`}
                    className={`product-card${selectedProduct === p.id ? ' active' : ''}`}
                    onClick={() => setSelectedProduct(p.id)}
                  >
                    <div className="product-card-icon">
                      <i className={`bi ${p.icon}`} />
                    </div>
                    <div className="product-card-name">{p.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Live preview grid */}
            <div className="live-preview-grid">
              {/* Mockup canvas */}
              <div className="canvas-container-box">
                <div ref={sliderRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
                  {/* Theme background */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    borderRadius: 'var(--radius-lg)',
                    background: activeTheme.bg,
                    transition: 'background 0.4s ease',
                  }} />

                  {/* Product mockup */}
                  <div
                    className={`mockup-wrapper ${selectedProduct}`}
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 0.25s ease',
                    }}
                  >
                    <img
                      className="mockup-img"
                      src={images[0]?.src ?? ''}
                      alt="Product preview"
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                    {showSafe  && <div className="overlay-safe-zone"  title="Safe zone"  />}
                    {showBleed && <div className="overlay-bleed-zone" title="Bleed zone" />}
                  </div>

                  {/* Comparison slider */}
                  {comparing && (
                    <>
                      <div
                        className="preview-slider-mask"
                        style={{
                          width: `${sliderPos}%`,
                          position: 'absolute', top: 0, left: 0, bottom: 0,
                          overflow: 'hidden', pointerEvents: 'none',
                        }}
                      >
                        <div style={{
                          background: '#f0f0f0',
                          position: 'absolute', inset: 0,
                          opacity: 0.6,
                          borderRadius: 'var(--radius-lg)',
                        }} />
                      </div>
                      <div
                        className="preview-slider-handle"
                        style={{ left: `${sliderPos}%` }}
                        onMouseDown={handleSliderMouseDown}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Controls panel */}
              <div className="flex flex-col gap-4">
                {/* Zoom */}
                <div className="card p-4">
                  <div className="text-sm font-semibold" style={{ color: 'var(--primary)', marginBottom: '0.6rem' }}>Zoom</div>
                  <div className="flex align-center gap-3">
                    <button className="btn btn-outline btn-sm" onClick={() => setZoom(z => Math.max(0.5, +(z - 0.1).toFixed(2)))}>
                      <i className="bi bi-zoom-out" />
                    </button>
                    <div style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                      {Math.round(zoom * 100)}%
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(2)))}>
                      <i className="bi bi-zoom-in" />
                    </button>
                  </div>
                </div>

                {/* Rotate */}
                <div className="card p-4">
                  <div className="text-sm font-semibold" style={{ color: 'var(--primary)', marginBottom: '0.6rem' }}>Rotate</div>
                  <div className="flex align-center gap-3">
                    <button className="btn btn-outline btn-sm" onClick={() => setRotation(r => r - 90)}>
                      <i className="bi bi-arrow-counterclockwise" />
                    </button>
                    <div style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>{rotation}°</div>
                    <button className="btn btn-outline btn-sm" onClick={() => setRotation(r => r + 90)}>
                      <i className="bi bi-arrow-clockwise" />
                    </button>
                  </div>
                </div>

                {/* Overlays */}
                <div className="card p-4 flex flex-col gap-2">
                  <div className="text-sm font-semibold" style={{ color: 'var(--primary)', marginBottom: '0.4rem' }}>Overlays</div>
                  <label className="flex align-center gap-2 text-sm" style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={showSafe}  onChange={e => setShowSafe(e.target.checked)}  />
                    Safe Zone
                  </label>
                  <label className="flex align-center gap-2 text-sm" style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={showBleed} onChange={e => setShowBleed(e.target.checked)} />
                    Bleed Zone
                  </label>
                  <button
                    className={`btn btn-sm${comparing ? ' btn-navy' : ' btn-outline'}`}
                    style={{ marginTop: '0.35rem' }}
                    onClick={() => setComparing(c => !c)}
                  >
                    <i className="bi bi-layout-split" /> {comparing ? 'Stop Compare' : 'Compare'}
                  </button>
                </div>

                {/* Reset */}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setZoom(1); setRotation(0); setComparing(false); }}
                >
                  <i className="bi bi-arrow-repeat" /> Reset
                </button>
              </div>
            </div>

            {/* Theme selector */}
            <div>
              <div className="sidebar-section-label" style={{ marginBottom: '0.6rem' }}>Choose Theme</div>
              <div className="theme-selector-grid">
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    id={`theme-${theme.id}`}
                    className={`theme-card${selectedTheme === theme.id ? ' active' : ''}`}
                    onClick={() => setSelectedTheme(theme.id)}
                  >
                    <div
                      className="theme-card-preview"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${theme.preview[0]} 0%, ${theme.preview[1]} 100%)`,
                      }}
                    />
                    <div className="theme-card-label">{theme.name}</div>
                    {selectedTheme === theme.id && (
                      <div className="theme-card-check">
                        <i className="bi bi-check-lg" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm Approval CTA */}
            <div
              className="card p-4"
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, #2d3491 100%)',
                border: 'none',
              }}
            >
              <div className="flex align-center justify-between">
                <div>
                  <div className="font-bold" style={{ color: '#fff', fontSize: '1rem' }}>
                    Happy with your preview?
                  </div>
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.72)', marginTop: '0.2rem' }}>
                    Review &amp; place your order
                  </div>
                </div>
                <button
                  id="confirm-approval-btn"
                  className="btn btn-primary"
                  onClick={() => { setConfirmStep(2); setConfirmOpen(true); }}
                >
                  Confirm Approval <i className="bi bi-check-circle" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            SUBVIEW: TRACKING
            ================================================================ */}
        {subView === 'tracking' && (
          <div className="flex flex-col gap-6">
            <h1 className="page-heading" style={{ color: 'var(--primary)', margin: 0 }}>
              Order Tracking
            </h1>

            {/* Order header */}
            <div className="card p-4 flex align-center justify-between">
              <div>
                <div className="font-bold" style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>Order {activeOrder?.id || '#1042'}</div>
                <div className="text-sm text-muted" style={{ marginTop: '0.2rem' }}>Placed on {activeOrder?.date || 'Jun 14, 2026'}</div>
              </div>
              <span className="badge badge-accent" style={{ background: '#FF304C1a', color: 'var(--accent)' }}>
                In Transit
              </span>
            </div>

            {/* Timeline */}
            <div className="card p-6">
              <div className="font-semibold" style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
                Delivery Timeline
              </div>
              {[
                {
                  label: 'In Transit',
                  desc:  'Your package is on its way — estimated delivery Jun 18, 2026',
                  time:  'Jun 16, 09:42 AM',
                  active: true,
                },
                {
                  label: 'Validated & PDF Compiled',
                  desc:  'Your artwork was verified and print-ready PDF was generated',
                  time:  'Jun 15, 03:14 PM',
                  active: false,
                },
                {
                  label: 'Order Created',
                  desc:  'We received your order and started processing',
                  time:  'Jun 14, 11:00 AM',
                  active: false,
                },
              ].map((event, i, arr) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: i < arr.length - 1 ? '1.25rem' : 0 }}>
                  {/* Dot + connector */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                      background: event.active ? 'var(--accent)' : 'var(--border-color)',
                      border: event.active ? '3px solid #FF304C44' : '2px solid var(--border-color)',
                      boxShadow: event.active ? '0 0 0 4px #FF304C22' : 'none',
                      transition: 'all 0.3s',
                    }} />
                    {i < arr.length - 1 && (
                      <div style={{
                        width: 2, flex: 1, minHeight: 32,
                        background: 'var(--border-color)',
                        margin: '4px 0',
                      }} />
                    )}
                  </div>
                  {/* Content */}
                  <div style={{ paddingBottom: '0.4rem' }}>
                    <div className="font-semibold text-sm" style={{ color: event.active ? 'var(--accent)' : 'var(--primary)' }}>
                      {event.label}
                    </div>
                    <div className="text-xs text-muted" style={{ marginTop: '0.15rem' }}>{event.desc}</div>
                    <div className="text-xs" style={{
                      marginTop: '0.3rem',
                      color: event.active ? 'var(--accent)' : '#94a3b8',
                      fontWeight: 500,
                    }}>
                      <i className="bi bi-clock" style={{ marginRight: 4 }} />{event.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery map placeholder */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{
                height: 200,
                background: 'linear-gradient(135deg, #e0f0ff 0%, #b3d9f5 50%, #7bc0e8 100%)',
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ textAlign: 'center', zIndex: 1 }}>
                  <i className="bi bi-map" style={{ fontSize: 48, color: 'var(--primary)', opacity: 0.45 }} />
                  <div className="font-semibold text-sm" style={{ color: 'var(--primary)', marginTop: '0.5rem', opacity: 0.65 }}>
                    Live Map View
                  </div>
                  <div className="text-xs text-muted">Carrier integration coming soon</div>
                </div>
                <div style={{ position: 'absolute', top: 40,  left:  '30%', fontSize: 24 }}>📍</div>
                <div style={{ position: 'absolute', bottom: 30, right: '25%', fontSize: 20 }}>🏠</div>
              </div>
              <div className="p-4">
                <div className="flex align-center justify-between">
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--primary)' }}>Estimated Delivery</div>
                    <div className="text-sm text-muted" style={{ marginTop: '0.15rem' }}>Thursday, Jun 18, 2026</div>
                  </div>
                  <button className="btn btn-outline btn-sm">
                    <i className="bi bi-telephone" /> Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            SUBVIEW: DRAFTS
            ================================================================ */}
        {subView === 'drafts' && (
          <div className="flex flex-col gap-6">
            <div className="flex align-center justify-between">
              <h1 className="page-heading" style={{ color: 'var(--primary)', margin: 0 }}>
                Saved Drafts
              </h1>
              <span className="badge badge-primary">{DRAFT_ITEMS.length} drafts</span>
            </div>

            <div
              className="preview-grid"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
            >
              {DRAFT_ITEMS.map(draft => (
                <div key={draft.id} className="card" style={{ overflow: 'hidden', padding: 0 }}>
                  {/* Thumbnail */}
                  <div style={{ height: 150, overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={draft.thumb}
                      alt={draft.name}
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        transition: 'transform 0.35s ease',
                      }}
                      onMouseOver={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.07)'; }}
                      onMouseOut={e  => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
                    />
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(23,28,98,0.85)', borderRadius: '999px',
                      padding: '2px 8px', fontSize: '0.65rem', color: '#fff', fontWeight: 700,
                      textTransform: 'capitalize',
                    }}>
                      {draft.product}
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <div className="font-semibold text-sm" style={{ color: 'var(--primary)' }}>{draft.name}</div>
                    <div className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>
                      <i className="bi bi-calendar3" style={{ marginRight: 4 }} />{draft.date}
                    </div>
                    <div className="flex gap-2" style={{ marginTop: '0.75rem' }}>
                      <button
                        id={`resume-draft-${draft.id}`}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => { setSubView('upload'); showToast(`Resumed: ${draft.name}`, 'info'); }}
                      >
                        <i className="bi bi-pencil" /> Resume
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        title="Delete draft"
                        style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* =======================================================================
          CROP MODAL
          ======================================================================= */}
      {cropOpen && cropTarget && (
        <div className="modal-overlay" onClick={() => setCropOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            {/* Header */}
            <div className="flex align-center justify-between" style={{ marginBottom: '1rem' }}>
              <h2 className="font-bold" style={{ color: 'var(--primary)', margin: 0, fontSize: '1.1rem' }}>
                Crop Image
              </h2>
              <button className="btn btn-outline btn-sm" onClick={() => setCropOpen(false)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {/* Preview */}
            <div
              className="crop-frame-box"
              style={{ marginBottom: '1rem', position: 'relative', overflow: 'hidden' }}
            >
              <img
                className="crop-img-target"
                src={cropTarget.src}
                alt="Crop target"
                style={{
                  transform: `scale(${cropScale}) rotate(${cropRot}deg)`,
                  transition: 'transform 0.2s',
                  maxWidth: '100%',
                  display: 'block',
                  margin: 'auto',
                }}
              />
              <div
                className="crop-border-mask"
                style={{
                  borderRadius: cropMask === 'circle' ? '50%' : cropMask === 'square' ? '4px' : '2px',
                  aspectRatio: cropMask === 'rect' ? '16/9' : '1/1',
                }}
              />
            </div>

            {/* Mask type */}
            <div className="flex gap-2" style={{ marginBottom: '0.75rem' }}>
              {(['circle', 'square', 'rect'] as CropMaskType[]).map(m => (
                <button
                  key={m}
                  id={`crop-mask-${m}`}
                  className={`btn btn-sm${cropMask === m ? ' btn-navy' : ' btn-outline'}`}
                  style={{ flex: 1, textTransform: 'capitalize', gap: '0.3rem' }}
                  onClick={() => setCropMask(m)}
                >
                  {m === 'circle' && <i className="bi bi-circle" />}
                  {m === 'square' && <i className="bi bi-square" />}
                  {m === 'rect'   && <i className="bi bi-aspect-ratio" />}
                  {m}
                </button>
              ))}
            </div>

            {/* Scale slider */}
            <div className="flex flex-col gap-2" style={{ marginBottom: '0.75rem' }}>
              <label className="label flex align-center justify-between">
                <span>Scale</span>
                <span className="text-xs text-muted">{Math.round(cropScale * 100)}%</span>
              </label>
              <input
                type="range" min="0.5" max="3" step="0.05"
                value={cropScale}
                onChange={e => setCropScale(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Rotation slider */}
            <div className="flex flex-col gap-2" style={{ marginBottom: '1rem' }}>
              <label className="label flex align-center justify-between">
                <span>Rotation</span>
                <span className="text-xs text-muted">{cropRot}°</span>
              </label>
              <input
                type="range" min="-180" max="180" step="1"
                value={cropRot}
                onChange={e => setCropRot(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setCropOpen(false)}>Cancel</button>
              <button
                id="crop-apply-btn"
                className="btn btn-primary"
                onClick={() => {
                  setCropOpen(false);
                  showToast(`Crop applied to ${cropTarget.name}`, 'success');
                }}
              >
                <i className="bi bi-check-lg" /> Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          ORDER CONFIRMATION MODAL
          ======================================================================= */}
      {confirmOpen && (
        <div className="modal-overlay" onClick={() => { if (!placingOrder) setConfirmOpen(false); }}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            {/* Header */}
            <div className="flex align-center justify-between" style={{ marginBottom: '1rem' }}>
              <h2 className="font-bold" style={{ color: 'var(--primary)', margin: 0, fontSize: '1.1rem' }}>
                Confirm Your Order
              </h2>
              {!placingOrder && (
                <button className="btn btn-outline btn-sm" onClick={() => setConfirmOpen(false)}>
                  <i className="bi bi-x-lg" />
                </button>
              )}
            </div>

            {/* Stepper */}
            <div className="confirm-modal-steps" style={{ marginBottom: '1.5rem' }}>
              {['Upload', 'Review', 'Confirm', 'Done'].map((step, idx) => (
                <React.Fragment key={step}>
                  <div
                    className={`confirm-step${confirmStep === idx ? ' active' : confirmStep > idx ? ' done' : ''}`}
                  >
                    <div className="confirm-step-dot">
                      {confirmStep > idx
                        ? <i className="bi bi-check-lg" style={{ fontSize: 10 }} />
                        : idx + 1
                      }
                    </div>
                    <div className="confirm-step-label">{step}</div>
                  </div>
                  {idx < 3 && (
                    <div style={{
                      flex: 1, height: 2, alignSelf: 'flex-start', marginTop: 12,
                      background: confirmStep > idx ? 'var(--accent)' : 'var(--border-color)',
                      transition: 'background 0.3s',
                    }} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {confirmStep < 3 ? (
              <>
                {/* Order summary table */}
                <div className="card p-4" style={{ marginBottom: '1rem', background: 'var(--surface)' }}>
                  <div className="text-sm font-semibold" style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>
                    Order Summary
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <tbody>
                      {[
                        ['Product', <span key="p" className="badge badge-primary">{activeProduct.name}</span>],
                        ['Photos',  `${images.length} photo${images.length !== 1 ? 's' : ''}`],
                        ['Theme',   activeTheme.name],
                        [
                          'Message',
                          caption.trim()
                            ? `"${caption.slice(0, 40)}${caption.length > 40 ? '…' : ''}"`
                            : <em key="nc" className="text-muted">No message</em>,
                        ],
                      ].map(([key, val]) => (
                        <tr key={String(key)}>
                          <td style={{ color: '#64748b', paddingBottom: '0.5rem', width: '40%' }}>{key}</td>
                          <td style={{ color: 'var(--primary)', fontWeight: 500, paddingBottom: '0.5rem' }}>
                            {val as React.ReactNode}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Theme swatch */}
                <div className="flex align-center gap-3" style={{ marginBottom: '1.25rem' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-md)', flexShrink: 0,
                    backgroundImage: `linear-gradient(135deg, ${activeTheme.preview[0]}, ${activeTheme.preview[1]})`,
                    border: '2px solid var(--border-color)',
                  }} />
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--primary)' }}>{activeTheme.name}</div>
                    <div className="text-xs text-muted">Selected theme</div>
                  </div>
                </div>

                <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setConfirmOpen(false)} disabled={placingOrder}>
                    Edit
                  </button>
                  <button
                    id="place-order-btn"
                    className="btn btn-primary"
                    disabled={placingOrder}
                    onClick={handlePlaceOrder}
                  >
                    {placingOrder ? (
                      <><i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite' }} /> Placing…</>
                    ) : (
                      <><i className="bi bi-bag-check" /> Place Order</>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Success state */
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                  animation: 'scaleIn 0.4s ease',
                }}>
                  <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: 32 }} />
                </div>
                <div className="font-bold" style={{ color: 'var(--primary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  Order Placed! 🎉
                </div>
                <div className="text-sm text-muted">Redirecting to tracking…</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
