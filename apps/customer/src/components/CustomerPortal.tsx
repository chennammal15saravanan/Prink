// =============================================================================
// THE PRINK — CustomerPortal.tsx  (Premium Redesign)
// Dashboard · My Orders · Design Lab · Tracking · History · Templates
// =============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CustomerSubView,
  CropMaskType,
  ProductType,
  PrintTheme,
  UploadedImage,
  Order,
  TemplateItem,
  SkuMapping,
  CanvasElement,
} from '../types';
import { useToast } from '../context/ToastContext';
import mainLogo from '../assets/logos/main-logo.png';
import logoBlack from '../assets/logos/logo-black.png';
import websiteLogo from '../assets/logos/website-logo.png';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UploadCloud, 
  Palette, 
  MapPin, 
  History, 
  LayoutTemplate, 
  User, 
  HelpCircle, 
  LogOut, 
  Bell, 
  Sparkles, 
  Clock, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Truck, 
  FileText, 
  Camera, 
  Activity, 
  Phone, 
  Mail, 
  Layers, 
  HeartHandshake,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Seed / Static Data
// ---------------------------------------------------------------------------

const SEED_IMAGES: UploadedImage[] = [
  { id: 'img-1', src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop', name: 'portrait-1.jpg' },
  { id: 'img-2', src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&auto=format&fit=crop', name: 'portrait-2.jpg' },
  { id: 'img-3', src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop', name: 'portrait-3.jpg' },
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
  { id: 'tshirt',    icon: 'bi-file-person',   name: 'T-Shirt'      },
  { id: 'mug',       icon: 'bi-cup-hot',       name: 'Coffee Mug'   },
  { id: 'mobilecase',icon: 'bi-phone',         name: 'Mobile Case'  },
  { id: 'frame',     icon: 'bi-aspect-ratio',   name: 'Photo Frame'  },
  { id: 'pillow',    icon: 'bi-box',           name: 'Pillow'       },
  { id: 'photobook', icon: 'bi-book',           name: 'Photo Book'   },
  { id: 'keychain',  icon: 'bi-key',           name: 'Keychain'     },
  { id: 'canvas',    icon: 'bi-image',          name: 'Canvas Print' },
  { id: 'calendar',  icon: 'bi-calendar3',      name: 'Calendar'     },
];

// Rich sample orders for the demo portal
const MOCK_ORDERS: Order[] = [];

// Rich sample templates
const MOCK_TEMPLATES: TemplateItem[] = [];

const MOCK_SKU_MAPPINGS = [] as unknown as SkuMapping[];

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
  initialSubView = 'dashboard',
}: CustomerPortalProps) {
  const { showToast } = useToast();

  // ── Auth state ──────────────────────────────────────────────────────────────
  const [authView, setAuthView]       = useState<'login' | 'dashboard'>(() => {
    return localStorage.getItem('customer_token') ? 'dashboard' : 'login';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [forceDashboard, setForceDashboard] = useState(() => {
    return !!localStorage.getItem('customer_token');
  });
  const [phone, setPhone]             = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpSent, setOtpSent]         = useState(false);
  
  // Custom tabbed authentication & registration states
  const [loginTab, setLoginTab]       = useState<'password' | 'otp' | 'register'>('password');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName]         = useState('');
  const [regEmail, setRegEmail]       = useState('');
  const [regPhone, setRegPhone]       = useState('');
  const [regPassword, setRegPassword] = useState('');
  
  // Dynamic Product Config
  const [productConfigs, setProductConfigs] = useState<Record<string, any>>({});

  // Interactive mockup image positioning & edit states
  const [photoScale, setPhotoScale]         = useState(1);
  const [photoRotation, setPhotoRotation]   = useState(0);
  const [photoOffsetX, setPhotoOffsetX]     = useState(0);
  const [photoOffsetY, setPhotoOffsetY]     = useState(0);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const photoOffsetStart = useRef({ x: 0, y: 0 });

  // Butterfly Box multi-image crop states
  const [activeButterflyIndex, setActiveButterflyIndex] = useState(0);
  const [butterflyCrops, setButterflyCrops] = useState<Record<number, { scale: number, rotation: number, x: number, y: number }>>({
    0: { scale: 1, rotation: 0, x: 0, y: 0 },
    1: { scale: 1, rotation: 0, x: 0, y: 0 },
    2: { scale: 1, rotation: 0, x: 0, y: 0 },
    3: { scale: 1, rotation: 0, x: 0, y: 0 },
    4: { scale: 1, rotation: 0, x: 0, y: 0 },
    5: { scale: 1, rotation: 0, x: 0, y: 0 },
    6: { scale: 1, rotation: 0, x: 0, y: 0 },
    7: { scale: 1, rotation: 0, x: 0, y: 0 }
  });

  const changeActiveButterflyPhoto = (newIdx: number) => {
    if (newIdx < 0 || newIdx >= 8) return;
    // Save current crop values to the current active index
    setButterflyCrops(prev => ({
      ...prev,
      [activeButterflyIndex]: { scale: photoScale, rotation: photoRotation, x: photoOffsetX, y: photoOffsetY }
    }));
    // Load crop values for the new active index
    const saved = butterflyCrops[newIdx] || { scale: 1, rotation: 0, x: 0, y: 0 };
    setPhotoScale(saved.scale);
    setPhotoRotation(saved.rotation);
    setPhotoOffsetX(saved.x);
    setPhotoOffsetY(saved.y);
    setActiveButterflyIndex(newIdx);
    if (images[newIdx]) {
      setLivePreviewPhoto(images[newIdx].src);
    }
  };

  // Sync current global crop settings back to butterflyCrops in real-time
  useEffect(() => {
    if (activeOrder && (activeOrder.productType === 'butterfly' || (activeOrder.product || '').toLowerCase().includes('butterfly'))) {
      setButterflyCrops(prev => ({
        ...prev,
        [activeButterflyIndex]: { scale: photoScale, rotation: photoRotation, x: photoOffsetX, y: photoOffsetY }
      }));
    }
  }, [photoScale, photoRotation, photoOffsetX, photoOffsetY, activeButterflyIndex]);

  const renderButterflySheet = (isReview = false) => (
    <div style={{
      width: '297px',
      height: '420px',
      background: '#ffffff',
      borderRadius: '2px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px 10px 10px',
      boxSizing: 'border-box'
    }}>
      {/* Green Cut Line */}
      <div style={{ position: 'absolute', top: '6px', left: '6px', right: '6px', bottom: '6px', border: '1px dashed #22c55e', pointerEvents: 'none', zIndex: 5 }} />
      {/* Red Safe Margin */}
      <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', bottom: '12px', border: '1px dashed #ef4444', pointerEvents: 'none', zIndex: 5 }} />

      <div style={{ zIndex: 6, textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '9px', fontWeight: 800, color: '#000', marginBottom: '2px' }}>Butterfly Box Print Template</div>
        <div style={{ fontSize: '5px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.5px' }}>A3 SHEET - 300 DPI - CMYK - LIVE PREVIEW</div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', zIndex: 6, justifyContent: 'center', maxWidth: '380px' }}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map(idx => {
          const isProduct1 = idx < 4;
          const label = isProduct1 ? `P1 - Face ${idx + 1}` : `P2 - Face ${idx - 3}`;
          const color = isProduct1 ? '#0ea5e9' : '#e11d48';
          const bgColor = isProduct1 ? '#e0f2fe' : '#fce7f3';
          const crop = butterflyCrops[idx] || { scale: 1, rotation: 0, x: 0, y: 0 };
          const ratio = 81 / 140; 
          const isActive = !isReview && activeButterflyIndex === idx;

          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', width: '81px' }}>
              <div style={{ background: bgColor, color: color, fontSize: '5px', fontWeight: 800, textAlign: 'center', padding: '3px 0', border: `1px solid ${color}`, borderBottom: 'none' }}>
                {label} (81x81mm)
              </div>
              <div style={{ width: '81px', height: '81px', border: `1.5px solid ${color}`, background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
                <div onClick={() => !isReview && changeActiveButterflyPhoto(idx)} style={{ width: '100%', height: '100%', position: 'absolute', left: 0, top: 0, border: '1px solid #fff', boxSizing: 'border-box', cursor: isReview ? 'default' : 'pointer', outline: isActive ? `2px solid ${color}` : 'none', outlineOffset: '-2px', zIndex: isActive ? 10 : 1, overflow: 'hidden' }}>
                  {images[idx] ? (
                    <img crossOrigin="anonymous" src={images[idx].src} alt={`photo-${idx}`} style={{ position: 'absolute', left: 0, top: 0, transformOrigin: 'center', width: '100%', height: '100%', objectFit: 'cover', transform: `translate(${crop.x * ratio}px, ${crop.y * ratio}px) scale(${crop.scale}) rotate(${crop.rotation}deg)`, transition: 'transform 0.1s' }} />
                  ) : <div style={{ width: '100%', height: '100%', background: '#f1f5f9' }} />}
                  <div style={{ position: 'absolute', bottom: '1px', left: '1px', background: 'rgba(255,255,255,0.8)', fontSize: '5px', fontWeight: 700, padding: '1px 3px', borderRadius: '1px' }}>Photo {idx + 1}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const [butterflyPreviewMode, setButterflyPreviewMode] = useState<'sheet' | 'mockup'>('mockup');

  const [customerName, setCustomerName] = useState(() => {
    try {
      const t = localStorage.getItem('customer_token');
      if (t && t !== 'demo-bypass-token') {
        const payload = JSON.parse(atob(t.split('.')[1]));
        return payload.name || 'Guest';
      }
    } catch {}
    return localStorage.getItem('customerName') || 'Guest';
  });

  const [customerEmail, setCustomerEmail] = useState(() => {
    try {
      const t = localStorage.getItem('customer_token');
      if (t && t !== 'demo-bypass-token') {
        const payload = JSON.parse(atob(t.split('.')[1]));
        return payload.email || '';
      }
    } catch {}
    return localStorage.getItem('customerEmail') || '';
  });

  const [customerPhone, setCustomerPhone] = useState(() => {
    try {
      const t = localStorage.getItem('customer_token');
      if (t && t !== 'demo-bypass-token') {
        const payload = JSON.parse(atob(t.split('.')[1]));
        return payload.phone || '';
      }
    } catch {}
    return localStorage.getItem('customerPhone') || '';
  });

  const [customerId, setCustomerId] = useState(() => {
    try {
      const t = localStorage.getItem('customer_token');
      if (t && t !== 'demo-bypass-token') {
        const payload = JSON.parse(atob(t.split('.')[1]));
        return payload.id || '';
      }
    } catch {}
    return localStorage.getItem('customerId') || '';
  });

  // ── WhatsApp Token Auto-Login (on mount) ────────────────────────────────────
  useEffect(() => {
    // Extract token from URL hash query: /#/customer?token=xxx or /?token=xxx
    const hash = window.location.hash;
    const search = hash.includes('?') ? hash.slice(hash.indexOf('?')) : window.location.search;
    const params = new URLSearchParams(search);
    const urlToken = params.get('token');
    if (urlToken) {
      try {
        // Validate it is a proper JWT (3 parts)
        const parts = urlToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          localStorage.setItem('customer_token', urlToken);
          setCustomerName(payload.name || 'Customer');
          setAuthView('dashboard');
          // Remove token from URL without page reload
          const newHash = hash.split('?')[0];
          window.history.replaceState(null, '', window.location.pathname + '#' + newHash);
          showToast(`Welcome back, ${payload.name || 'Customer'}! Your order is ready to customize.`, 'success');
        }
      } catch (e) {
        console.error('Invalid token in URL:', e);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Dashboard nav ───────────────────────────────────────────────────────────
  const [subView, setSubView] = useState<CustomerSubView>(initialSubView);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // ── Data state ──────────────────────────────────────────────────────────────
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orders, setOrders]           = useState<Order[]>([]);
  const [templates, setTemplates]     = useState<TemplateItem[]>([]);
  const [skuMappings, setSkuMappings] = useState<SkuMapping[]>([]);

  // Shopify Dev Login States
  const [shopifyCustomers, setShopifyCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [manualIdOrEmail, setManualIdOrEmail] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customersError, setCustomersError] = useState('');

  const loadShopifyCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    setCustomersError('');
    try {
      const res = await fetch('/api/shopify/customers');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setShopifyCustomers(data);
      } else {
        setCustomersError('No Shopify customers found. Check your Shopify credentials in server/.env');
      }
    } catch (err: any) {
      setCustomersError(err.message || 'Failed to connect to Shopify. Make sure the server is running.');
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  const handleShopifyDevLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const query = selectedCustomerId || manualIdOrEmail;
    if (!query) { showToast('Please select a customer or enter an ID/email', 'warning'); return; }

    const selectedCust = shopifyCustomers.find(c => String(c.id) === String(selectedCustomerId));
    const body = selectedCust 
      ? { 
          customerId: selectedCustomerId,
          email: selectedCust.email,
          firstName: selectedCust.first_name,
          lastName: selectedCust.last_name,
          phone: selectedCust.phone
        }
      : { query };

    try {
      const res = await fetch('/api/auth/shopify-dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('customer_token', data.token);
        if (data.user?.name) setCustomerName(data.user.name);
        showToast('Connected to Shopify!', 'success');
        setAuthView('dashboard');
        setForceDashboard(true);
      } else {
        showToast(data.error || 'Shopify dev login failed', 'error');
      }
    } catch {
      showToast('Network error while logging in.', 'error');
    }
  }, [selectedCustomerId, manualIdOrEmail, showToast]);

  useEffect(() => {
    if (authView === 'login') {
      loadShopifyCustomers();
    }
  }, [authView, loadShopifyCustomers]);

  // ── Orders filter ───────────────────────────────────────────────────────────
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'active' | 'completed' | 'delivered'>('all');

  // ── Submission / workflow states ─────────────────────────────────────────────
  const [submissionDone, setSubmissionDone] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState('');
  const [skuLoading, setSkuLoading]         = useState(false);
  const [livePreviewPhoto, setLivePreviewPhoto] = useState<string | null>(null);

  // ── Canvas Editor State ─────────────────────────────────────────────────────
  const [canvasElements, setCanvasElements]     = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [undoStack, setUndoStack]               = useState<CanvasElement[][]>([]);
  const [redoStack, setRedoStack]               = useState<CanvasElement[][]>([]);
  const [canvasScale, setCanvasScale]           = useState(1);
  const [editorSnapAlign, setEditorSnapAlign]   = useState(true);

  // ── Upload state ────────────────────────────────────────────────────────────
  type UploadMethod = 'file' | 'camera' | 'cloud';
  const [uploadMethod, setUploadMethod]     = useState<UploadMethod>('file');
  const [images, setImages]                 = useState<UploadedImage[]>(SEED_IMAGES);
  const [dragOver, setDragOver]             = useState(false);
  const [caption, setCaption]               = useState('');
  const [selectedOccasionTheme, setSelectedOccasionTheme] = useState('');
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [dragIndex, setDragIndex]           = useState<number | null>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const MAX_CAPTION = 200;

  // ── Live Camera Modal state ─────────────────────────────────────────────────
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream]       = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode]           = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError]         = useState<string | null>(null);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const snapCanvas = useRef<HTMLCanvasElement>(null);

  // ── Preview state ───────────────────────────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState<ProductType>('mug');
  const [selectedTheme, setSelectedTheme]     = useState('classic');
  const [zoom, setZoom]                       = useState(1);
  const [rotation, setRotation]               = useState(0);
  const [showSafe, setShowSafe]               = useState(true);
  const [showBleed, setShowBleed]             = useState(false);
  const [sliderPos, setSliderPos]             = useState(50);
  const [comparing, setComparing]             = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);


  // ── Crop modal ──────────────────────────────────────────────────────────────
  const [cropOpen, setCropOpen]     = useState(false);
  const [cropTarget, setCropTarget] = useState<UploadedImage | null>(null);
  const [cropMask, setCropMask]     = useState<CropMaskType>('square');
  const [cropScale, setCropScale]   = useState(1);
  const [cropRot, setCropRot]       = useState(0);

  // ── Order confirmation modal ────────────────────────────────────────────────
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [confirmStep, setConfirmStep]   = useState(2);
  const [placingOrder, setPlacingOrder] = useState(false);

  // ── 5-Step Wizard state ─────────────────────────────────────────────────────
  const [wizardStep, setWizardStep]     = useState<1|2|3|4|5>(1);
  const [wizardDir, setWizardDir]       = useState<'forward'|'back'>('forward');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goWizard = (step: 1|2|3|4|5, dir: 'forward'|'back' = 'forward') => {
    setWizardDir(dir);
    setWizardStep(step);
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const activeTheme   = THEMES.find(t => t.id === selectedTheme)   ?? THEMES[0];
  const activeProduct = PRODUCTS.find(p => p.id === selectedProduct) ?? PRODUCTS[0];

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchActiveOrder = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const token = localStorage.getItem('customer_token');
      const isLoggedIn = !!token && token !== 'fallback';

      if (!isLoggedIn) {
        // Guest mode shows no orders. There is deliberately no public
        // "list all orders" endpoint: serving one would expose every
        // customer's name, phone and artwork to anonymous callers. A guest
        // reaches their own order through the tokenised upload link instead.
        setOrders([]);
        if (!activeOrder) {
          setActiveOrder(null);
          setSelectedProduct('mug');
        }

        const resTemplates = await fetch('/api/templates');
        if (resTemplates.ok) {
          const tdata = await resTemplates.json();
          setTemplates(Array.isArray(tdata) ? tdata : (tdata.templates || []));
        } else {
          setTemplates([]);
        }

        const resMappings = await fetch('/api/skus');
        if (resMappings.ok) {
          const sdata = await resMappings.json();
          setSkuMappings(Array.isArray(sdata) ? sdata : (sdata.skus || []));
        } else {
          setSkuMappings([]);
        }

        return;
      }

      // If token is clearly not a JWT, use empty states
      if (!token.includes('.') || token.split('.').length !== 3) {
        setOrders([]);
        if (!activeOrder) {
          setActiveOrder(null);
          setSelectedProduct('mug');
        }
        setTemplates([]);
        setSkuMappings([]);
        return;
      }

      try {
        const resMe = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resMe.ok) {
          const medata = await resMe.json();
          if (medata.success && medata.user) {
            setCustomerName(medata.user.name || 'Guest');
            setCustomerEmail(medata.user.email || '');
            setCustomerPhone(medata.user.phone || '');
          }
        }
      } catch (e) {
        console.error('Failed to fetch profile info:', e);
      }

      const resOrders = await fetch('/api/orders/customer/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resOrders.ok) {
        const list = await resOrders.json();
        setOrders(list);
        if (list.length > 0) {
          setActiveOrder(list[0]);
          if (list[0].productType) setSelectedProduct(list[0].productType);
          if (list[0].customer) {
            const cust = list[0].customer;
            if (typeof cust === 'object') {
              setCustomerName(cust.name || 'Guest');
              setCustomerEmail(cust.email || '');
              setCustomerPhone(cust.phone || '');
            } else {
              setCustomerName(cust);
            }
          }
        }
      } else if (resOrders.status === 401 || resOrders.status === 403) {
        // Token is expired or invalid — clear it and force re-login
        localStorage.removeItem('customer_token');
        setAuthView('login');
        setForceDashboard(false);
        showToast('Your session has expired. Please log in again.', 'error');
        return;
      } else {
        setOrders([]);
        setActiveOrder(null);
        setSelectedProduct('mug');
      }

      const resTemplates = await fetch('/api/templates');
      if (resTemplates.ok) {
        const tdata = await resTemplates.json();
        setTemplates(Array.isArray(tdata) ? tdata : (tdata.templates || []));
      } else {
        setTemplates([]);
      }

      const resMappings = await fetch('/api/skus');
      if (resMappings.ok) {
        const sdata = await resMappings.json();
        setSkuMappings(Array.isArray(sdata) ? sdata : (sdata.skus || []));
      } else {
        setSkuMappings([]);
      }
    } catch (err) {
      console.error('Failed to fetch customer data:', err);
      setOrders([]);
      setActiveOrder(null);
      setTemplates([]);
      setSkuMappings([]);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const LOCAL_PRODUCT_CONFIGS: Record<string, any> = {
    tshirt: {
      productType: 'tshirt',
      width: '12.0"', height: '16.0"', pixelWidth: 2400, pixelHeight: 3200, cropRatio: 0.75,
      supportedFormats: ['PNG', 'JPG', 'WEBP'],
      qualityRecommendation: '300 DPI high-resolution PNG with transparency',
      safePrintArea: { x: 10, y: 10, width: 80, height: 80 },
      imagePlacementArea: { x: 25, y: 20, width: 50, height: 60 },
      requiresPreview: false
    },
    mug: {
      productType: 'mug',
      width: '8.5"', height: '3.0"', pixelWidth: 2550, pixelHeight: 900, cropRatio: 2.83,
      supportedFormats: ['JPG', 'PNG', 'WEBP'],
      qualityRecommendation: '300 DPI panoramic wrap image with vibrant details',
      safePrintArea: { x: 5, y: 5, width: 90, height: 90 },
      imagePlacementArea: { x: 5, y: 5, width: 90, height: 90 },
      requiresPreview: true
    },
    mobilecase: {
      productType: 'mobilecase',
      width: '4.0"', height: '8.0"', pixelWidth: 1200, pixelHeight: 2400, cropRatio: 0.5,
      supportedFormats: ['JPG', 'PNG'],
      qualityRecommendation: 'Keep main subjects centered; avoid camera cutouts at the top',
      safePrintArea: { x: 8, y: 15, width: 84, height: 75 },
      imagePlacementArea: { x: 0, y: 0, width: 100, height: 100 },
      requiresPreview: true
    },
    frame: {
      productType: 'frame',
      width: '8.0"', height: '10.0"', pixelWidth: 2400, pixelHeight: 3000, cropRatio: 0.8,
      supportedFormats: ['JPG', 'PNG', 'HEIC'],
      qualityRecommendation: 'High-contrast portrait or landscape photo, min 300 DPI',
      safePrintArea: { x: 5, y: 5, width: 90, height: 90 },
      imagePlacementArea: { x: 5, y: 5, width: 90, height: 90 },
      requiresPreview: false
    },
    pillow: {
      productType: 'pillow',
      width: '12.0"', height: '12.0"', pixelWidth: 3600, pixelHeight: 3600, cropRatio: 1.0,
      supportedFormats: ['JPG', 'PNG', 'WEBP'],
      qualityRecommendation: 'Square crop, centered design with high-contrast text',
      safePrintArea: { x: 10, y: 10, width: 80, height: 80 },
      imagePlacementArea: { x: 10, y: 10, width: 80, height: 80 },
      requiresPreview: false
    },
    photobook: {
      productType: 'photobook',
      width: '6.0"', height: '6.0"', pixelWidth: 1800, pixelHeight: 1800, cropRatio: 1.0,
      supportedFormats: ['JPG', 'PNG', 'HEIC'],
      qualityRecommendation: 'Story layout with clean margins, min 300 DPI per photo',
      safePrintArea: { x: 5, y: 5, width: 90, height: 90 },
      imagePlacementArea: { x: 5, y: 5, width: 90, height: 90 },
      requiresPreview: false
    },
    keychain: {
      productType: 'keychain',
      width: '2.0"', height: '2.0"', pixelWidth: 600, pixelHeight: 600, cropRatio: 1.0,
      supportedFormats: ['PNG', 'JPG'],
      qualityRecommendation: 'Close-up portrait or custom logo cropped cleanly',
      safePrintArea: { x: 5, y: 5, width: 90, height: 90 },
      imagePlacementArea: { x: 10, y: 10, width: 80, height: 80 },
      requiresPreview: false
    },
    butterfly: {
      productType: 'butterfly',
      width: '8.5"', height: '11.0"', pixelWidth: 2550, pixelHeight: 3300, cropRatio: 0.77,
      supportedFormats: ['PNG', 'JPG', 'WEBP'],
      qualityRecommendation: 'Requires exactly 2 photos. 1 image for Product 1 (blue area) and 1 image for Product 2 (red area).',
      safePrintArea: { x: 5, y: 5, width: 90, height: 90 },
      imagePlacementArea: { x: 5, y: 5, width: 90, height: 90 },
      requiresPreview: false
    }
  };

  const getProductConfig = (type: string) => {
    return productConfigs[type] || LOCAL_PRODUCT_CONFIGS[type] || LOCAL_PRODUCT_CONFIGS.mug;
  };

  const fetchProductConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/product-configs');
      if (res.ok) {
        setProductConfigs(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch configs:', e);
    }
  }, []);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim() || !loginPassword.trim()) {
      showToast('Please enter both identifier and password', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: emailOrPhone, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('customer_token', data.token);
        setCustomerName(data.user.name);
        setAuthView('dashboard');
        setForceDashboard(true);
        showToast(`Welcome back, ${data.user.name}!`, 'success');
      } else {
        showToast(data.error || 'Login failed. Check your credentials.', 'error');
      }
    } catch {
      showToast('Auth server connection failed.', 'error');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword.trim()) {
      showToast('All registration fields are required', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, phone: regPhone, password: regPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('customer_token', data.token);
        setCustomerName(data.user.name);
        setAuthView('dashboard');
        setForceDashboard(true);
        showToast(`Account created! Welcome, ${data.user.name}!`, 'success');
      } else {
        showToast(data.error || 'Registration failed. Check details.', 'error');
      }
    } catch {
      showToast('Auth server connection failed.', 'error');
    }
  };

  useEffect(() => {
    // Call orders fetch if customer_token exists on mount/load
    const hasToken = !!localStorage.getItem('customer_token');
    if (authView === 'dashboard' || hasToken) {
      fetchActiveOrder();
      fetchProductConfigs();
      // Sync customer details from stored token
      try {
        const t = localStorage.getItem('customer_token');
        if (t && t !== 'demo-bypass-token') {
          const parts = t.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.name) setCustomerName(payload.name);
            if (payload.email) setCustomerEmail(payload.email);
            if (payload.phone) setCustomerPhone(payload.phone);
            if (payload.id) setCustomerId(payload.id);
          }
        }
      } catch {}
    }
  }, [authView, fetchActiveOrder, fetchProductConfigs]);

  // Suppress unused-var warnings
  useEffect(() => { void (zoom); void (rotation); void (comparing); void (uploadMethod); }, []);

  // Global mouse/touch movement listeners for mockup dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingPhoto) return;
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      setPhotoOffsetX(photoOffsetStart.current.x + dx);
      setPhotoOffsetY(photoOffsetStart.current.y + dy);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingPhoto) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartPos.current.x;
      const dy = touch.clientY - dragStartPos.current.y;
      setPhotoOffsetX(photoOffsetStart.current.x + dx);
      setPhotoOffsetY(photoOffsetStart.current.y + dy);
    };

    const handleMouseUp = () => {
      setIsDraggingPhoto(false);
    };

    if (isDraggingPhoto) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDraggingPhoto]);

  // ── Canvas helpers ──────────────────────────────────────────────────────────
  const saveState = (newEls: CanvasElement[]) => {
    setUndoStack(prev => [...prev, canvasElements]);
    setRedoStack([]);
    setCanvasElements(newEls);
  };
  const handleUndo = () => {
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, canvasElements]);
    setUndoStack(u => u.slice(0, -1));
    setCanvasElements(prev);
  };
  const handleRedo = () => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(u => [...u, canvasElements]);
    setRedoStack(r => r.slice(0, -1));
    setCanvasElements(next);
  };

  const handleSubmitDesign = async () => {
    if (!activeOrder) return;
    const designConfig = {
      photoScale,
      photoRotation,
      photoOffsetX,
      photoOffsetY,
      caption,
      theme: selectedTheme,
      occasionTheme: selectedOccasionTheme,
      butterflyCrops: (activeOrder.productType === 'butterfly' || (activeOrder.product || '').toLowerCase().includes('butterfly')) ? {
        ...butterflyCrops,
        [activeButterflyIndex]: { scale: photoScale, rotation: photoRotation, x: photoOffsetX, y: photoOffsetY }
      } : undefined
    };

    try {
      const token = localStorage.getItem('customer_token');
      const payload = {
        designData: JSON.stringify(designConfig),
        customizationStatus: 'completed',
        images: images.length > 0 ? images.map(img => ({ id: img.id, name: img.name, src: img.src, serverFilename: img.serverFilename || img.name })) : (livePreviewPhoto ? [{ id: 'img_1', name: 'upload.jpg', src: livePreviewPhoto, serverFilename: 'upload.jpg' }] : [])
      };
      
      const res = await fetch(`/api/orders/${encodeURIComponent(activeOrder.id)}/design`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        showToast('Design submitted successfully! Status: Pending Admin Review.', 'success');
        fetchActiveOrder(); // refresh list
        navTo('tracking'); // go to tracking
      } else {
        const errorData = await res.json();
        showToast(errorData.error || 'Failed to submit design.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Offline Mode: Simulating design submission!', 'success');
      activeOrder.customizationStatus = 'completed';
      activeOrder.adminApprovalStatus = 'pending';
      activeOrder.designData = JSON.stringify(designConfig);
      activeOrder.submissionTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      activeOrder.images = images.length > 0 ? images : (livePreviewPhoto ? [{ id: 'img_1', name: 'upload.jpg', src: livePreviewPhoto, serverFilename: 'upload.jpg' }] : []);
      navTo('tracking');
    }
  };

  const loadSkuTemplate = (order: Order) => {
    setActiveOrder(order);
    setSelectedProduct(order.productType);
    setSkuLoading(true);

    // Show SKU detection animation briefly
    setTimeout(() => {
      setSkuLoading(false);

      if (order.designData) {
        try {
          const rawSaved = JSON.parse(order.designData);
          let finalSaved = Array.isArray(rawSaved) ? rawSaved : (rawSaved?.designData || rawSaved?.items || []);
          if (!Array.isArray(finalSaved)) finalSaved = [];
          setCanvasElements(finalSaved);
          setUndoStack([]); setRedoStack([]); setSelectedElementId(null);
          showToast('Restored saved design draft!', 'success');
          setSubView('editor');
          setMobileNavOpen(false);
          return;
        } catch {}
      }

      const allTemplates = templates;
      const allMappings  = skuMappings;

      const sku     = order.sku || '';
      const mapping = allMappings.find(m => m.sku.toLowerCase() === sku.toLowerCase());
      const tmpl    = mapping
        ? allTemplates.find(t => t.id === mapping.templateId)
        : allTemplates.find(t => t.productType === order.productType && t.isDefault);

      if (tmpl) {
        showToast(`✓ SKU ${sku} detected → Loading ${tmpl.name} editor`, 'success');
        if (tmpl.elements && tmpl.elements.length > 0) {
          setCanvasElements(tmpl.elements);
        } else {
          const defaultEl: CanvasElement = {
            id: 'el-text-1', type: 'text', x: 125, y: 100, width: 200, height: 50,
            rotation: 0, opacity: 1, zIndex: 1,
            text: 'Your Custom Text', fontFamily: 'Inter', fontSize: 24,
            color: '#171C62', textAlign: 'center',
          };
          setCanvasElements([defaultEl]);
        }
      } else {
        const defaultEl: CanvasElement = {
          id: 'el-text-1', type: 'text', x: 125, y: 100, width: 200, height: 50,
          rotation: 0, opacity: 1, zIndex: 1,
          text: 'Your Custom Text', fontFamily: 'Inter', fontSize: 24,
          color: '#171C62', textAlign: 'center',
        };
        setCanvasElements([defaultEl]);
        showToast('Start designing your custom product!', 'info');
      }
      setUndoStack([]); setRedoStack([]); setSelectedElementId(null);
      setSubView('editor');
      setMobileNavOpen(false);
    }, 600);
  };

  const addTextLayer = () => {
    const el: CanvasElement = {
      id: `el-text-${Date.now()}`, type: 'text', x: 100, y: 100,
      width: 200, height: 40, rotation: 0, opacity: 1,
      zIndex: canvasElements.length + 1,
      text: 'Click to edit', fontFamily: 'Inter', fontSize: 20,
      color: '#171c62', textAlign: 'center',
    };
    saveState([...canvasElements, el]);
    setSelectedElementId(el.id);
  };

  const addShapeLayer = (shapeType: 'rect' | 'circle') => {
    const el: CanvasElement = {
      id: `el-shape-${Date.now()}`, type: 'shape', shapeType, x: 150, y: 120,
      width: 80, height: 80, rotation: 0, opacity: 1,
      zIndex: canvasElements.length + 1, fillColor: '#FF304C',
      strokeColor: '#171c62', strokeWidth: 2,
    };
    saveState([...canvasElements, el]);
    setSelectedElementId(el.id);
  };

  const addImageLayer = (src: string) => {
    const el: CanvasElement = {
      id: `el-img-${Date.now()}`, type: 'image', src, x: 80, y: 80,
      width: 150, height: 150, rotation: 0, opacity: 1,
      zIndex: canvasElements.length + 1,
      brightness: 100, contrast: 100, saturation: 100, blur: 0, sepia: 0,
    };
    saveState([...canvasElements, el]);
    setSelectedElementId(el.id);
  };

  const deleteElement  = (id: string) => { saveState(canvasElements.filter(e => e.id !== id)); if (selectedElementId === id) setSelectedElementId(null); };
  const bringToFront   = (id: string) => { const mx = Math.max(...canvasElements.map(e => e.zIndex), 0); saveState(canvasElements.map(e => e.id === id ? { ...e, zIndex: mx + 1 } : e)); };
  const sendToBack     = (id: string) => { const mn = Math.min(...canvasElements.map(e => e.zIndex), 1); saveState(canvasElements.map(e => e.id === id ? { ...e, zIndex: Math.max(1, mn - 1) } : e)); };
  const updateElementProps = (id: string, props: Partial<CanvasElement>) => saveState(canvasElements.map(e => e.id === id ? { ...e, ...props } : e));

  const saveDesign = async () => {
    if (!activeOrder) return;
    try {
      const token = localStorage.getItem('customer_token');
      const isButterfly = activeOrder.productType === 'butterfly' || (activeOrder.product || '').toLowerCase().includes('butterfly');
      const payloadDesignData = isButterfly ? { elements: canvasElements, butterflyCrops } : canvasElements;
      const res = await fetch(`/api/orders/${encodeURIComponent(activeOrder.id)}/design`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ designData: JSON.stringify(payloadDesignData), customizationStatus: 'in-progress' }),
      });
      if (res.ok) { showToast('Design draft saved!', 'success'); fetchActiveOrder(); }
      else if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('customer_token');
        setAuthView('login');
        showToast('Session expired. Please log in again.', 'error');
      }
      else showToast('Failed to save draft.', 'error');
    } catch { showToast('Network error.', 'error'); }
  };

  const submitDesign = async () => {
    if (!activeOrder) return;
    try {
      const token = localStorage.getItem('customer_token');
      const isButterfly = activeOrder.productType === 'butterfly' || (activeOrder.product || '').toLowerCase().includes('butterfly');
      const payloadDesignData = isButterfly ? { elements: canvasElements, butterflyCrops } : canvasElements;
      // Attempt server submit
      if (token && token.includes('.') && token.split('.').length === 3) {
        const res = await fetch(`/api/orders/${encodeURIComponent(activeOrder.id)}/design`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            designData: JSON.stringify(payloadDesignData),
            customizationStatus: 'completed',
            images: images.map(img => ({ id: img.id, name: img.name, src: img.src })),
          }),
        });
        if (res.ok) {
          await fetchActiveOrder();
        }
      } else {
        // Offline/mock mode: update local state
        setOrders(prev => prev.map(o => o.id === activeOrder.id
          ? { ...o, customizationStatus: 'completed' as const, uploadStatus: 'ready' as const }
          : o
        ));
      }
      // Show premium confirmation screen
      setSubmittedOrderId(activeOrder.id);
      setSubmissionDone(true);
      setSubView('tracking');
      showToast('🎉 Design submitted! Admin will review shortly.', 'success');
    } catch {
      // Still show confirmation screen in demo mode
      setSubmittedOrderId(activeOrder?.id || '');
      setSubmissionDone(true);
      setSubView('tracking');
      showToast('Design submitted for admin review!', 'success');
    }
  };

  // ── Upload helpers ──────────────────────────────────────────────────────────
  const simulateProgress = (id: string) => {
    let v = 0;
    const iv = setInterval(() => {
      v += Math.random() * 20 + 5;
      if (v >= 100) { v = 100; clearInterval(iv); }
      setUploadProgress(p => ({ ...p, [id]: Math.min(v, 100) }));
    }, 120);
  };

  const addImages = (files: FileList | File[]) => {
    Array.from(files).forEach((file, fileIdx) => {
      const reader = new FileReader();
      const id = `img-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      reader.onload = e => {
        const src = e.target?.result as string;
        setImages(prev => [...prev, { id, src, name: file.name }]);
        simulateProgress(id);
        // Update live preview with the first new photo
        if (fileIdx === 0) setLivePreviewPhoto(src);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addImages(e.target.files); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files) addImages(e.dataTransfer.files); };
  const removeImage = (id: string) => { setImages(p => p.filter(i => i.id !== id)); setUploadProgress(p => { const n = { ...p }; delete n[id]; return n; }); };
  const openCrop = (img: UploadedImage) => { setCropTarget(img); setCropScale(1); setCropRot(0); setCropMask('square'); setCropOpen(true); };
  const handleDragStart = (_e: React.DragEvent, idx: number) => setDragIndex(idx);
  const handleDropCard  = (_e: React.DragEvent, idx: number) => {
    if (dragIndex === null || dragIndex === idx) return;
    setImages(prev => { const a = [...prev]; const [m] = a.splice(dragIndex, 1); a.splice(idx, 0, m); return a; });
    setDragIndex(null);
  };

  const openCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    try {
      // Stop any existing stream first
      if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); setCameraStream(null); }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) { videoRef.current.srcObject = stream; }
    } catch (err: any) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : `Camera error: ${err.message}`
      );
    }
  };

  const closeCamera = () => {
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); }
    setCameraStream(null);
    setShowCameraModal(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    const video  = videoRef.current;
    const canvas = snapCanvas.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Mirror horizontally if using front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const id = `cam_${Date.now()}`;
    const newImg: UploadedImage = { id, src: dataUrl, name: `camera-${id}.jpg` };
    setImages(prev => [...prev, newImg]);
    showToast('Photo captured! ✓', 'success');
    closeCamera();
  };

  const switchCamera = () => {
    const next: 'user' | 'environment' = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    openCamera(next);
  };

  const handleMethodClick = (method: UploadMethod) => {
    setUploadMethod(method);
    if (method === 'file') { fileInputRef.current?.click(); }
    if (method === 'camera') { setShowCameraModal(true); openCamera(facingMode); }
    if (method === 'cloud')  showToast('Cloud integrations coming soon!', 'info');
  };

  // Cleanup camera stream when modal is closed or component unmounts
  useEffect(() => {
    return () => { cameraStream?.getTracks().forEach(t => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraStream]);

  // Attach stream to video element when both are ready
  useEffect(() => {
    if (showCameraModal && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [showCameraModal, cameraStream]);

  // Space key shortcut to capture when camera modal is open
  useEffect(() => {
    if (!showCameraModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); capturePhoto(); }
      if (e.key === 'Escape') closeCamera();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCameraModal, cameraStream, facingMode]);

  // ── Compare slider ──────────────────────────────────────────────────────────
  const handleSliderMouseDown = (_e: React.MouseEvent) => {
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;
    const move = (ev: MouseEvent) => { const p = ((ev.clientX - rect.left) / rect.width) * 100; setSliderPos(Math.max(5, Math.min(95, p))); };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  // ── Order placement ─────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    try {
      const res = await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: selectedProduct, theme: selectedTheme, imageCount: images.length, caption }),
      });

      // A non-2xx response previously still showed "Order placed successfully",
      // which reported success for an order that was never created.
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'We could not place that order. Please try again.', 'error');
        return;
      }

      setConfirmStep(3);
      showToast('Order placed successfully! 🎉', 'success');
      setTimeout(() => { setConfirmOpen(false); setConfirmStep(2); setSubView('tracking'); }, 2200);
    } catch {
      showToast('Failed to place order. Retry.', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  // ===========================================================================
  // ── COMPUTED DATA ─────────────────────────────────────────────────────────
  // ===========================================================================

  const allOrders   = orders;
  const allTemplates = templates;
  const activeOnly  = allOrders.filter(o => o.deliveryStatus !== 'delivered');
  const deliveredOrders = allOrders.filter(o => o.deliveryStatus === 'delivered');

  const filteredOrders = ordersFilter === 'all'       ? allOrders
    : ordersFilter === 'active'    ? activeOnly
    : ordersFilter === 'completed' ? allOrders.filter(o => o.customizationStatus === 'completed')
    : deliveredOrders;

  const initials = (customerName || 'GU').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const isLoggedIn = !!localStorage.getItem('customer_token') && localStorage.getItem('customer_token') !== 'fallback';
  const activeSubView = forceDashboard ? subView : 'preview';

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
            const vr = await fetch('/api/auth/otp-verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone: `${countryCode}${phone}`, code: entered }),
            });
            const vd = await vr.json();
            if (vr.ok && vd.success) {
              localStorage.setItem('customer_token', vd.token);
              setCustomerName(vd.user.name);
              showToast('Logged in!', 'success');
              setAuthView('dashboard');
            } else {
              showToast(vd.error || 'Verification failed.', 'error');
            }
          } catch { showToast('Auth error. Try again.', 'error'); }
        } else if (entered !== null) {
          showToast('Invalid OTP.', 'error');
        }
      }, 400);
    } catch { showToast('Failed to send OTP.', 'error'); }
  }, [phone, countryCode, showToast]);

  const handleWhatsAppLogin = useCallback(async () => {
    if (!phone.trim()) { showToast('Please enter your phone number', 'warning'); return; }
    try {
      const res  = await fetch('/api/auth/whatsapp-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `${countryCode}${phone}` }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) localStorage.setItem('customer_token', data.token);
        if (data.user?.name) setCustomerName(data.user.name);
        showToast('Login successful!', 'success');
        setAuthView('dashboard');
        setForceDashboard(true);
      } else {
        showToast(data.error || 'Login failed', 'error');
      }
    } catch {
      showToast('Auth error. Try again.', 'error');
    }
  }, [phone, countryCode, showToast]);

  if (authView === 'login') {
    return (
      <div className="auth-wrapper" style={{ position: 'relative' }}>
        {/* Floating orbs for ambient depth */}
        <div style={{ position: 'absolute', top: '8%', left: '15%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,48,76,0.18) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', animation: 'heroOrb1 10s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,120,255,0.20) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', animation: 'heroOrb2 14s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 500, height: 500, transform: 'translate(-50%,-50%)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '460px', width: '100%', margin: '0 auto', padding: '40px 20px', position: 'relative', zIndex: 10 }}>
          {/* Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <img src={mainLogo} alt="the Prink" style={{ height: 48, width: 'auto', marginBottom: 20, filter: 'brightness(0) invert(1)' }} />
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(150,191,72,0.15)', border: '1px solid rgba(150,191,72,0.30)', borderRadius: 999, padding: '5px 14px', marginBottom: 16 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#96bf48', boxShadow: '0 0 6px rgba(150,191,72,0.8)', animation: 'pulse-ring 2s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#a6d463', textTransform: 'uppercase', letterSpacing: '0.10em' }}>Connected to Shopify</span>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', margin: '0 0 8px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>Welcome Back</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.50)', margin: 0, lineHeight: 1.5 }}>Sign in to view your orders &amp; personalize your prints</p>
          </div>

          {/* Main Glass Card */}
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            borderRadius: 28,
            boxShadow: '0 32px 80px rgba(0,0,0,0.40), 0 2px 0 rgba(255,255,255,0.08) inset',
            padding: '36px 32px',
            border: '1px solid rgba(255,255,255,0.13)',
          }}>
            {/* Shopify Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #96bf48 0%, #79a83a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(150,191,72,0.35)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <path d="M15.337 23.979l6.21-1.347S18.973 7.416 18.954 7.29c-.019-.127-.133-.21-.256-.21-.122 0-2.243-.046-2.243-.046s-1.49-1.453-1.657-1.62v18.565h.539zM12.5 6.19s-1.065-.317-2.23-.317c-1.76 0-1.844 1.103-1.844 1.382 0 1.519 3.961 2.1 3.961 5.658 0 2.798-1.772 4.6-4.163 4.6-2.87 0-4.326-1.786-4.326-1.786l.766-2.537s1.507 1.295 2.779 1.295c.832 0 1.17-.655 1.17-1.134 0-1.98-3.247-2.068-3.247-5.32 0-2.74 1.963-5.386 5.924-5.386 1.525 0 2.279.435 2.279.435L12.5 6.19z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>Shopify Customer Login</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', marginTop: 1 }}>prink-in.myshopify.com</div>
                </div>
              </div>
              {shopifyCustomers.length > 0 && (
                <div style={{ background: 'rgba(150,191,72,0.15)', border: '1px solid rgba(150,191,72,0.30)', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 800, color: '#a6d463' }}>
                  {shopifyCustomers.length} customers
                </div>
              )}
            </div>

            <form onSubmit={handleShopifyDevLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Customer Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 8 }} htmlFor="shopify-cust-select">
                  Select Existing Shopify Customer
                </label>
                {loadingCustomers ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(255,255,255,0.06)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)' }}>
                    <div style={{ width: 16, height: 16, border: '2px solid rgba(150,191,72,0.7)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Loading Shopify customers...</span>
                  </div>
                ) : customersError ? (
                  <div style={{ background: 'rgba(255,48,76,0.10)', border: '1px solid rgba(255,48,76,0.25)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 12, color: '#ff8090', marginBottom: 8 }}><i className="bi bi-exclamation-circle" style={{ marginRight: 6 }} />{customersError}</div>
                    <button type="button" onClick={loadShopifyCustomers} style={{ fontSize: 11, fontWeight: 700, color: '#FF304C', background: 'none', border: '1px solid rgba(255,48,76,0.40)', borderRadius: 8, padding: '5px 14px', cursor: 'pointer' }}>
                      <i className="bi bi-arrow-clockwise" style={{ marginRight: 4 }} />Retry
                    </button>
                  </div>
                ) : (
                  <select
                    id="shopify-cust-select"
                    value={selectedCustomerId}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setSelectedCustomerId(val);
                      if (val) {
                        setManualIdOrEmail('');
                        const selectedCust = shopifyCustomers.find(c => String(c.id) === String(val));
                        const email = selectedCust?.email;
                        const firstName = selectedCust?.first_name || '';
                        const lastName = selectedCust?.last_name || '';
                        const phone = selectedCust?.phone;
                        
                        try {
                          setLoadingOrders(true);
                          const res = await fetch('/api/auth/shopify-dev-login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              query: val,
                              email: email,
                              firstName: firstName,
                              lastName: lastName,
                              phone: phone
                            }),
                          });
                          const data = await res.json();
                          if (res.ok && data.token) {
                            localStorage.setItem('customer_token', data.token);
                            if (data.user?.name) setCustomerName(data.user.name);
                            if (data.user?.email) setCustomerEmail(data.user.email);
                            if (data.user?.phone) setCustomerPhone(data.user.phone);
                            showToast('Connected to Shopify!', 'success');
                            setAuthView('dashboard');
                            setForceDashboard(true);
                            await fetchActiveOrder();
                          } else {
                            showToast(data.error || 'Shopify dev login failed', 'error');
                          }
                        } catch {
                          showToast('Network error while logging in.', 'error');
                        } finally {
                          setLoadingOrders(false);
                        }
                      }
                    }}
                    style={{ width: '100%', height: '48px', padding: '0 16px', background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.14)', borderRadius: 12, fontSize: 13, color: '#ffffff', outline: 'none', cursor: 'pointer', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  >
                    <option value="" style={{ background: '#0d1240' }}>— Select from Shopify Customers List ({shopifyCustomers.length}) —</option>
                    {shopifyCustomers.map((cust) => (
                      <option key={cust.id} value={cust.id} style={{ background: '#0d1240' }}>
                        {cust.first_name || ''} {cust.last_name || ''} — {cust.email || cust.phone || 'No contact'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.10)' }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.10em' }}>or enter manually</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.10)' }} />
              </div>

              {/* Manual Input */}
              <div>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 8 }} htmlFor="manual-cust-input">
                  Customer ID or Email
                </label>
                <input
                  id="manual-cust-input"
                  type="text"
                  placeholder="e.g. 10091273191653 or customer@email.com"
                  value={manualIdOrEmail}
                  onChange={(e) => {
                    setManualIdOrEmail(e.target.value);
                    if (e.target.value) setSelectedCustomerId('');
                  }}
                  style={{ width: '100%', height: '46px', padding: '0 14px', background: '#fff', border: '1.5px solid var(--border-color)', borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                style={{
                  width: '100%', padding: '13px 20px', marginTop: 4,
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.18)', transition: 'transform 0.15s',
                }}
                onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <i className="bi bi-box-arrow-in-right" style={{ fontSize: 16 }} />
                Sign In &amp; View My Orders
              </button>
            </form>
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 20 }}>
            By continuing, you agree to our{' '}
            <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Terms</a> &amp;{' '}
            <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // ── SIDEBAR NAV ITEMS ───────────────────────────────────────────────────────
  // ===========================================================================

  const NAV_ITEMS: { key: CustomerSubView; icon: React.ComponentType<any>; label: string; badge?: string }[] = [
    { key: 'dashboard', icon: LayoutDashboard,  label: 'Dashboard'  },
    { key: 'upload',    icon: ShoppingBag,      label: 'My Orders', badge: String(activeOnly.length) },
    { key: 'preview',   icon: UploadCloud,      label: 'Upload Photos' },
    { key: 'editor',    icon: Palette,          label: 'Design Lab'  },
    { key: 'tracking',  icon: MapPin,           label: 'Track Order' },
    { key: 'drafts',    icon: History,          label: 'Order History' },
    { key: 'templates', icon: LayoutTemplate,   label: 'Templates'   },
    { key: 'profile',   icon: User,             label: 'My Profile'  },
    { key: 'support',   icon: HelpCircle,       label: 'Support'     },
  ];

  const navTo = (key: CustomerSubView) => {
    if (key === 'preview') {
      setForceDashboard(false);
      setActiveOrder(null);
    } else {
      setSubView(key);
    }
    setMobileNavOpen(false);
  };

  // ===========================================================================
  // ── HELPER: Product icon by type ────────────────────────────────────────────
  // ===========================================================================
  const productIcon = (type: ProductType) => {
    const map: Record<ProductType, string> = {
      tshirt: 'bi-file-person', mug: 'bi-cup-hot', mobilecase: 'bi-phone',
      frame: 'bi-aspect-ratio', pillow: 'bi-box', photobook: 'bi-book',
      keychain: 'bi-key', canvas: 'bi-image', calendar: 'bi-calendar3',
      butterfly: 'bi-gift',
    };
    return map[type] || 'bi-box';
  };

  const customizationBadge = (order: Order) => {
    if (order.adminApprovalStatus === 'approved') return <span className="badge badge-success"><i className="bi bi-patch-check-fill" /> Design Approved</span>;
    if (order.adminApprovalStatus === 'rejected') return <span className="badge badge-error"><i className="bi bi-exclamation-octagon-fill" /> Revision Needed</span>;
    if (order.adminApprovalStatus === 'reupload') return <span className="badge badge-warning"><i className="bi bi-cloud-upload-fill" /> Re-upload Requested</span>;
    if (order.customizationStatus === 'completed' && order.adminApprovalStatus === 'pending') return <span className="badge badge-info"><i className="bi bi-shield-fill-exclamation" /> Under Admin Review</span>;
    if (order.customizationStatus === 'completed')    return <span className="badge badge-success"><i className="bi bi-check-circle" /> Design Submitted</span>;
    if (order.customizationStatus === 'in-progress')  return <span className="badge badge-accent"><i className="bi bi-palette" /> Editing Draft</span>;
    return <span className="badge badge-warning"><i className="bi bi-hourglass-split" /> Awaiting Design</span>;
  };

  const deliveryBadge = (order: Order) => {
    if (order.deliveryStatus === 'delivered') return <span className="badge badge-success">Delivered</span>;
    if (order.deliveryStatus === 'shipped')   return <span className="badge badge-accent"><i className="bi bi-truck" style={{ marginRight: 3 }} />Shipped</span>;
    return <span className="badge badge-secondary">Pending</span>;
  };

  const orderProgress = (order: Order) => {
    const steps = trackingSteps(order);
    const completedCount = steps.filter(s => s.done).length;
    return Math.round((completedCount / steps.length) * 100);
  };

  // ===========================================================================
  // ── TRACKING STEPS ──────────────────────────────────────────────────────────
  // ===========================================================================
  const trackingSteps = (order: Order) => [
    { label: 'Order Received',          icon: 'bi-bag-check',        done: true },
    { label: 'Personalization Pending',  icon: 'bi-clock-history',   done: true },
    { label: 'Photos Uploaded',         icon: 'bi-image',            done: !!(order.images && order.images.length > 0) },
    { label: 'Submitted to Admin',      icon: 'bi-send',             done: order.customizationStatus === 'completed' },
    { label: 'Under Review',            icon: 'bi-shield-check',     done: order.customizationStatus === 'completed' && order.adminApprovalStatus === 'pending' },
    { label: 'Editing in Progress',     icon: 'bi-pencil-square',    done: order.customizationStatus === 'in-progress' || order.adminApprovalStatus === 'approved' },
    { label: 'Approved',                icon: 'bi-check-circle',     done: order.adminApprovalStatus === 'approved' },
    { label: 'Sent to Printer',         icon: 'bi-file-earmark-pdf', done: order.adminApprovalStatus === 'approved' },
    { label: 'Printing',                icon: 'bi-printer',          done: order.adminApprovalStatus === 'approved' },
    { label: 'Ready for Dispatch',      icon: 'bi-box-seam',         done: order.deliveryStatus === 'shipped' || order.deliveryStatus === 'delivered' },
    { label: 'Delivered',               icon: 'bi-house-heart',      done: order.deliveryStatus === 'delivered' },
  ];

  // ===========================================================================
  // ── PORTAL LAYOUT ───────────────────────────────────────────────────────────
  // ===========================================================================

  return (
    <div className="portal-layout" style={{ position: 'relative' }}>
      {/* Container for hidden inputs/canvas so they don't act as grid items */}
      <div style={{ display: 'none' }}>
        <input ref={fileInputRef}   type="file" accept="image/*" multiple onChange={handleFileChange} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} />
        <canvas ref={snapCanvas} />
      </div>

      {/* ── Live Camera Modal ─────────────────────────────────────────────── */}
      {showCameraModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', maxWidth: 640, padding: '0 16px' }}>
            <i className="bi bi-camera-fill" style={{ fontSize: 22, color: '#fff' }} />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, flex: 1 }}>Take a Photo</span>
            <button
              onClick={closeCamera}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                width: 36, height: 36, cursor: 'pointer', color: '#fff', fontSize: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            ><i className="bi bi-x" /></button>
          </div>

          {/* Video / Error area */}
          <div style={{
            width: '100%', maxWidth: 640, aspectRatio: '16/9',
            borderRadius: 16, overflow: 'hidden', background: '#111',
            position: 'relative', margin: '0 16px',
            boxShadow: '0 0 0 2px rgba(255,255,255,0.08)',
          }}>
            {cameraError ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: '100%', gap: 12, padding: 24, textAlign: 'center',
              }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 40, color: '#f97316' }} />
                <p style={{ color: '#fff', fontSize: 15, margin: 0 }}>{cameraError}</p>
                <button
                  onClick={() => openCamera(facingMode)}
                  style={{
                    padding: '10px 24px', background: 'var(--primary)', color: '#fff',
                    border: 'none', borderRadius: 50, fontWeight: 700, cursor: 'pointer', fontSize: 14,
                  }}
                >Try Again</button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                  display: 'block',
                }}
              />
            )}

            {/* Switch camera top-right */}
            {!cameraError && (
              <button
                onClick={switchCamera}
                title="Switch camera"
                style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '50%', width: 40, height: 40,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff', fontSize: 18,
                }}
              ><i className="bi bi-arrow-repeat" /></button>
            )}
          </div>

          {/* Capture / Cancel row */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <button
              onClick={closeCamera}
              style={{
                padding: '12px 28px', background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.25)', borderRadius: 50,
                color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer',
              }}
            ><i className="bi bi-x-circle me-2" />Cancel</button>

            {!cameraError && (
              <button
                onClick={capturePhoto}
                style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e91e8c, #171C62)',
                  border: '4px solid #fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(233,30,140,0.5)',
                  transition: 'transform 0.15s',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.92)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                title="Capture photo"
              >
                <i className="bi bi-camera-fill" style={{ fontSize: 28, color: '#fff' }} />
              </button>
            )}
          </div>

          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: 0 }}>
            Click the shutter button or press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>Space</kbd> to capture
          </p>
        </div>
      )}

      {/* ── Mobile overlay ─────────────────────────────────────────────────── */}
      {mobileNavOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, backdropFilter: 'blur(2px)' }}
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* ── SKU Loading Overlay ─────────────────────────────────────────────── */}
      {skuLoading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(23,28,98,0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
        }}>
          {/* Spinning ring */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            border: '4px solid rgba(255,255,255,0.1)',
            borderTop: '4px solid var(--accent)',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ color: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.6, marginBottom: 8 }}>
              SKU Detection
            </div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>
              Loading {activeOrder?.productType?.toUpperCase() || 'Product'} Editor...
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
              {activeOrder?.sku ? `Mapping SKU: ${activeOrder.sku}` : 'Detecting product template...'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['bi-tags', 'bi-palette', 'bi-check-circle'].map((icon, i) => (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: `pulse-ring ${1 + i * 0.3}s infinite`,
              }}>
                <i className={`bi ${icon}`} style={{ color: '#fff', fontSize: 14 }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          SIDEBAR
          ==================================================================== */}
      {isLoggedIn && forceDashboard && (
        <aside className={`portal-sidebar${mobileNavOpen ? ' mobile-open' : ''}`}>
          {/* Logo */}
          <div className="sidebar-logo-area">
            <img src={mainLogo} alt="the Prink" style={{ height: 28, width: 'auto' }} />
          </div>

          {/* User card */}
          <div style={{ margin: '12px 12px 8px', padding: '10px 12px', background: '#FFFFFF', borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, borderRadius: '50%', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{initials}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customerName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>VIP Member</div>
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }}></span>
              <span>{activeOnly.length} Active Order{activeOnly.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Nav */}
          <div style={{ padding: '0 8px', flex: 1, overflowY: 'auto' }}>
            <div className="sidebar-section-label">Navigation</div>
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  id={`nav-${item.key}`}
                  className={`sidebar-item${activeSubView === item.key ? ' active' : ''}`}
                  onClick={() => navTo(item.key)}
                >
                  <Icon style={{ width: 16, height: 16 }} />
                  <span>{item.label}</span>
                  {item.badge && item.badge !== '0' && (
                    <span style={{ marginLeft: 'auto', background: activeSubView === item.key ? 'rgba(255,77,109,0.15)' : 'var(--primary-soft)', color: 'var(--primary)', borderRadius: 99, fontSize: 9, fontWeight: 700, padding: '2px 6px', minWidth: 18, textAlign: 'center' }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Logout */}
          <div style={{ padding: '12px 8px 16px' }}>
            <button className="sidebar-item" style={{ color: 'var(--error)', width: '100%' }}
              onClick={() => {
                localStorage.removeItem('customer_token');
                localStorage.removeItem('customerName');
                localStorage.removeItem('customerEmail');
                localStorage.removeItem('customerId');
                localStorage.removeItem('customerPhone');
                window.location.href = '/customer/auth';
              }}>
              <LogOut style={{ width: 16, height: 16, color: 'var(--error)' }} />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      )}

      {/* ====================================================================
          MAIN CONTENT
          ==================================================================== */}
      <main className="portal-content">
        {/* Minimal Flow Top Header */}
        {!forceDashboard && (
          <header style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.4)',
            background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)',
            position: 'sticky', top: 0, zIndex: 100,
            marginBottom: '24px', borderRadius: '16px', 
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
            flexWrap: 'wrap', gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <img src={mainLogo} alt="the Prink" style={{ height: 32, width: 'auto' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', paddingLeft: 12, borderLeft: '1px solid var(--border-color)' }}>
                Product Personalization Studio
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: 10 }} className="header-actions">
              <button className="btn btn-outline btn-sm" onClick={() => {
                setForceDashboard(true);
                if (!isLoggedIn) {
                  setShowLoginModal(true);
                }
              }}>
                <i className="bi bi-grid-1x2" style={{ marginRight: 6 }} /> Return to Dashboard
              </button>
              {!isLoggedIn && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowLoginModal(true)}>
                  <i className="bi bi-box-arrow-in-right" style={{ marginRight: 6 }} /> Customer Login / Register
                </button>
              )}
            </div>
          </header>
        )}

        {/* Mobile top bar */}
        <div style={{ display: 'none' }} className="show-mobile-flex" id="mobile-topbar">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isLoggedIn && (
                <button
                  id="mobile-menu-btn"
                  onClick={() => setMobileNavOpen(!mobileNavOpen)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--primary)', padding: 4 }}>
                  <i className={`bi ${mobileNavOpen ? 'bi-x-lg' : 'bi-list'}`} />
                </button>
              )}
              <img src={mainLogo} alt="Prink" style={{ height: 28, width: 'auto' }} />
            </div>
            {isLoggedIn && <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{initials}</div>}
          </div>
        </div>

        {/* Mobile hamburger (only visible when logged in & dashboard active) */}
        {isLoggedIn && forceDashboard && (
          <button
            className="mobile-menu-btn"
            style={{ position: 'fixed', top: 10, left: 10, zIndex: 300, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, width: 40, height: 40, display: 'none', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--primary)', fontSize: 20, boxShadow: 'var(--shadow-sm)' }}
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            id="hamburger-btn">
            <i className={`bi ${mobileNavOpen ? 'bi-x-lg' : 'bi-list'}`} />
          </button>
        )}

        {/* ==================================================================
            SUBVIEW: DASHBOARD
            ================================================================== */}
        {activeSubView === 'dashboard' && loadingOrders && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: 16 }}>
            <div className="spinner" style={{ width: 44, height: 44, border: '4px solid rgba(255, 77, 109, 0.1)', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)' }}>Loading customer profile & orders...</div>
          </div>
        )}

        {activeSubView === 'dashboard' && !loadingOrders && (
          <div className="flex flex-col gap-6" style={{ gap: 24 }}>
            {/* Welcome Card */}
            <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid var(--border-color)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Welcome back, {customerName.split(' ')[0]}!
                  </h1>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6, marginBottom: 0 }}>
                    You have <strong style={{ color: 'var(--text-primary)' }}>{activeOnly.length} active order{activeOnly.length !== 1 ? 's' : ''}</strong> in production. Personalize your prints below to start printing.
                  </p>
                  <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span>Active Orders: <strong style={{ color: 'var(--text-primary)' }}>{activeOnly.length}</strong></span>
                    {activeOnly.length > 0 && (
                      <span>Estimated Delivery: <strong style={{ color: 'var(--text-primary)' }}>5-7 business days</strong></span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-outline" style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 12, padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => navTo('upload')}>
                    <ShoppingBag style={{ width: 14, height: 14 }} /> View Orders
                  </button>
                  <button className="btn btn-outline" style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 12, padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => navTo('preview')}>
                    <UploadCloud style={{ width: 14, height: 14 }} /> Upload Photos
                  </button>
                  {activeOnly.length > 0 && (
                    <button className="btn" style={{ background: 'var(--primary)', color: '#FFFFFF', borderRadius: 12, padding: '8px 16px', fontSize: 13, border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => loadSkuTemplate(activeOnly[0])}>
                      <Palette style={{ width: 14, height: 14 }} /> Continue Design
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
              {[
                { label: 'Active Orders', value: String(activeOnly.length), icon: ShoppingBag, color: '#FF4D6D' },
                { label: 'Designs in Progress', value: String(allOrders.filter(o => o.customizationStatus === 'in-progress').length), icon: Palette, color: '#3B82F6' },
                { label: 'Orders Under Review', value: String(allOrders.filter(o => o.customizationStatus === 'completed' && o.uploadStatus !== 'ready').length), icon: CheckCircle2, color: '#22C55E' },
                { label: 'Loyalty Points', value: '750 pts', icon: Sparkles, color: '#F59E0B' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="card-hover-effect" style={{
                    background: '#FFFFFF',
                    borderRadius: 16,
                    border: '1px solid var(--border-color)',
                    padding: '16px 20px',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    transition: 'all 0.2s ease',
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, flexShrink: 0 }}>
                      <Icon style={{ width: 20, height: 20 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{stat.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{stat.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main 2-column */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: '24px', alignItems: 'start' }} className="responsive-two-col">
              {/* Active Orders */}
              <div className="flex flex-col gap-4" style={{ gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Active Shopify Purchases</h2>
                  <button className="btn btn-outline btn-sm" style={{ borderRadius: 8 }} onClick={() => navTo('upload')}>
                    View All <ArrowRight style={{ width: 12, height: 12 }} />
                  </button>
                </div>

                {activeOnly.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px', background: '#FFFFFF', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--primary)' }}>
                      <ShoppingBag style={{ width: 40, height: 40 }} />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>No Active Orders</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 320, margin: '8px auto 20px', lineHeight: 1.5 }}>
                      Browse our collection and place an order on the Shopify store to customize your prints.
                    </p>
                    <a href="https://theprink.in" target="_blank" rel="noopener noreferrer" className="btn" style={{ display: 'inline-flex', background: 'var(--primary)', color: '#FFFFFF', textDecoration: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, border: 'none' }}>
                      Browse Store
                    </a>
                  </div>
                ) : (
                  activeOnly.map(order => {
                    const pct = orderProgress(order);
                    const isInProgress = order.customizationStatus === 'in-progress';
                    const isCompleted  = order.customizationStatus === 'completed';

                    return (
                      <div key={order.id} className="card-hover-effect" style={{ background: '#FFFFFF', padding: '20px', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-color)', padding: 4 }}>
                              {order.productImage && !order.productImage.includes('unsplash.com') ? (
                                <img src={order.productImage} alt={order.product} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', borderRadius: 8, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                  <ShoppingBag style={{ width: 24, height: 24 }} />
                                </div>
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.3 }}>{order.product}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                                Order: <strong style={{ color: 'var(--text-primary)' }}>#{order.shopifyId || order.id}</strong>  ·  Qty: <strong style={{ color: 'var(--text-primary)' }}>{order.quantity || 1}</strong>  ·  Date: <strong style={{ color: 'var(--text-primary)' }}>{order.date}</strong>
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                Est. Delivery: <strong style={{ color: 'var(--text-primary)' }}>5-7 business days</strong>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                            {customizationBadge(order)}
                            <span className={`badge ${order.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`} style={{ textTransform: 'capitalize', fontSize: 10 }}>
                              {order.paymentStatus || 'Paid'}
                            </span>
                          </div>
                        </div>

                        {/* DPI Warning */}
                        {order.dpiStatus === 'low' && (
                          <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 11, color: '#b45309', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertTriangle style={{ width: 14, height: 14 }} />
                            <span>Low resolution image detected ({order.dpi}). Higher quality recommended.</span>
                          </div>
                        )}

                        {/* Progress bar */}
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                            <span>Fulfillment Progress</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{pct}%</span>
                          </div>
                          <div className="progress-bar" style={{ height: 6, borderRadius: 3, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                            <div className="progress-bar-fill" style={{ height: '100%', width: `${pct}%`, background: 'var(--primary)' }} />
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
                          <button className="btn btn-outline btn-sm" style={{ borderRadius: 8 }} onClick={() => { setActiveOrder(order); navTo('tracking'); }}>
                            <MapPin style={{ width: 12, height: 12 }} /> Track Order
                          </button>
                          <button className="btn btn-outline btn-sm" style={{ borderRadius: 8 }} onClick={() => { setActiveOrder(order); navTo('preview'); }}>
                            <UploadCloud style={{ width: 12, height: 12 }} /> Upload Photos
                          </button>
                          <button className="btn btn-primary btn-sm" style={{ borderRadius: 8, background: 'var(--primary)', color: '#fff', border: 'none' }} onClick={() => loadSkuTemplate(order)}>
                            <Palette style={{ width: 12, height: 12 }} /> {isCompleted ? 'View Design' : isInProgress ? 'Resume Lab' : 'Customize Design'}
                          </button>
                        </div>

                        {/* Admin comments */}
                        {order.adminComments && (
                          <div style={{ marginTop: 12, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '10px 14px' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--error)', textTransform: 'uppercase', marginBottom: 4 }}>
                              <AlertTriangle style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} /> Admin Feedback
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>{order.adminComments}</p>
                            <button className="btn btn-primary btn-sm" style={{ marginTop: 8, background: 'var(--primary)', border: 'none', borderRadius: 8 }} onClick={() => loadSkuTemplate(order)}>
                              <Palette style={{ width: 12, height: 12 }} /> Edit &amp; Resubmit
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Profile, Quick Actions, Timeline, Notifications */}
              <div className="flex flex-col gap-4" style={{ gap: 20 }}>
                {/* Shopify Customer Profile Card */}
                <div className="card-hover-effect" style={{ padding: 20, borderRadius: 16, background: '#FFFFFF', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16 }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{customerName}</div>
                      <span className="badge badge-success" style={{ fontSize: 9, marginTop: 2, background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' }}>VIP Member</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Email</span>
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{customerEmail || '—'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Phone</span>
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{customerPhone || '—'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Total Orders</span>
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{allOrders.length}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Loyalty Points</span>
                      <strong style={{ color: 'var(--primary)', fontWeight: 600 }}>750 pts</strong>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', margin: '8px 0 4px' }}>Quick Actions</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { title: 'Upload Photos', desc: 'Add new design photos', icon: UploadCloud, view: 'preview' },
                      { title: 'Design Studio', desc: 'Open custom editor', view: 'editor' },
                      { title: 'Track Orders', desc: 'Track your deliveries', view: 'tracking' },
                      { title: 'Contact Support', desc: 'Get support assistance', view: 'support' }
                    ].map((act, idx) => {
                      const ActIcon = act.icon as any;
                      return (
                        <div key={idx} className="card-hover-effect" style={{
                          background: '#FFFFFF',
                          border: '1px solid var(--border-color)',
                          borderRadius: 12,
                          padding: 12,
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-xs)'
                        }} onClick={() => {
                          if (act.view === 'preview') {
                            setForceDashboard(false);
                            setActiveOrder(null);
                          } else {
                            navTo(act.view as CustomerSubView);
                          }
                        }}>
                          <div style={{ color: 'var(--primary)', marginBottom: 6 }}>
                            {ActIcon && <ActIcon style={{ width: 18, height: 18 }} />}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>{act.title}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.2 }}>{act.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Activity Timeline */}
                <div className="card-hover-effect" style={{ padding: 16, borderRadius: 16, background: '#FFFFFF', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', margin: '0 0 16px' }}>Recent Activity</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 15, top: 8, bottom: 8, width: 1.5, background: 'var(--border-color)' }}></div>
                    {[
                      { event: 'Delivered', desc: 'Order SP-2009 delivered to doorstep.', time: 'Today, 2:40 PM', icon: CheckCircle2, color: '#22C55E' },
                      { event: 'Order Shipped', desc: 'Package for SP-2008 with Delhivery.', time: 'Yesterday, 10:15 AM', icon: Truck, color: '#3B82F6' },
                      { event: 'Printing Started', desc: 'T-Shirt print layout approved.', time: 'Jul 20, 4:30 PM', icon: Printer, color: '#FF4D6D' },
                      { event: 'Design Approved', desc: 'Sarah approved layout for SP-2001.', time: 'Jul 19, 11:20 AM', icon: Sparkles, color: '#F59E0B' },
                      { event: 'Upload Link Sent', desc: 'Photo link dispatched via WhatsApp.', time: 'Jul 18, 9:05 AM', icon: UploadCloud, color: '#9CA3AF' },
                      { event: 'Order Synced', desc: 'Shopify Purchase SP-2001 connected.', time: 'Jul 18, 9:00 AM', icon: RefreshCw, color: '#111827' }
                    ].map((item, idx) => {
                      const ItemIcon = item.icon as any;
                      return (
                        <div key={idx} style={{ display: 'flex', gap: 12, position: 'relative', zIndex: 1 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FFFFFF', border: `1.5px solid ${item.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0 }}>
                            {ItemIcon && <ItemIcon style={{ width: 14, height: 14 }} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>{item.event}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{item.desc}</div>
                            <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 3 }}>{item.time}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Notifications */}
                <div className="card-hover-effect" style={{ padding: 16, borderRadius: 16, background: '#FFFFFF', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', margin: 0 }}>Notifications</h3>
                    <Bell style={{ width: 14, height: 14, color: 'var(--text-secondary)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { title: 'Delivery Confirmation', msg: 'SP-2009 has been marked as delivered.', time: '1h ago', type: 'success' },
                      { title: 'Order Shipped', msg: 'SP-2008 has been shipped via standard mail.', time: '4h ago', type: 'info' },
                      { title: 'Printing Started', msg: 'Printing process started for SP-2003 White T-Shirt.', time: '1d ago', type: 'info' },
                      { title: 'Design Approved', msg: 'Your layout for Mug Wrap SP-2001 is approved.', time: '2d ago', type: 'success' },
                      { title: 'Upload Reminder', msg: 'Please upload photos for Mug Wrap SP-2002.', time: '3d ago', type: 'warning' }
                    ].map((notif, idx) => (
                      <div key={idx} style={{ padding: 10, borderRadius: 10, background: notif.type === 'success' ? 'rgba(34, 197, 94, 0.05)' : notif.type === 'warning' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(59, 130, 246, 0.05)', border: `1px solid ${notif.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : notif.type === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: 11, color: 'var(--text-primary)' }}>{notif.title}</span>
                          <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{notif.time}</span>
                        </div>
                        <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.3 }}>{notif.msg}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            SUBVIEW: MY ORDERS (upload key)
            ================================================================== */}
        {activeSubView === 'upload' && (
          <div className="flex flex-col gap-6">
            <div className="flex align-center justify-between flex-wrap gap-3">
              <div>
                <button className="btn btn-outline btn-sm mb-2" onClick={() => navTo('dashboard')}>
                  <i className="bi bi-arrow-left" /> Dashboard
                </button>
                <h1 className="page-heading">My Orders</h1>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>All your Shopify purchases in one place</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => navTo('preview')}>
                <i className="bi bi-cloud-upload" /> Upload Photos
              </button>
            </div>

            {/* Filter tabs */}
            <div className="tab-bar" style={{ width: 'auto', flexWrap: 'wrap' }}>
              {(['all', 'active', 'completed', 'delivered'] as const).map(f => (
                <button key={f} className={`tab-item${ordersFilter === f ? ' active' : ''}`}
                  onClick={() => setOrdersFilter(f)}
                  style={{ textTransform: 'capitalize' }}>
                  {f} {f === 'all' ? `(${allOrders.length})` : f === 'active' ? `(${activeOnly.length})` : f === 'delivered' ? `(${deliveredOrders.length})` : ''}
                </button>
              ))}
            </div>

            {/* Order cards */}
            <div className="flex flex-col gap-4">
              {filteredOrders.length === 0 ? (
                <div className="card p-8" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  <i className="bi bi-inbox" style={{ fontSize: 48, opacity: 0.3, display: 'block', marginBottom: 12 }} />
                  <div style={{ fontWeight: 600 }}>No orders found</div>
                </div>
              ) : filteredOrders.map(order => {
                const pct = orderProgress(order);
                const isInProgress = order.customizationStatus === 'in-progress';
                const isCompleted  = order.customizationStatus === 'completed';

                return (
                  <div key={order.id} className="card" style={{ padding: '24px', borderRadius: 20 }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {/* Product image or fallback icon */}
                      <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                        {order.productImage && !order.productImage.includes('unsplash.com') ? (
                          <img src={order.productImage} alt={order.product} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <i className={`bi ${productIcon(order.productType)}`} style={{ fontSize: '28px', color: 'var(--accent)' }} />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>{order.product}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                              SKU: <strong style={{ color: 'var(--primary)' }}>{order.sku || '—'}</strong>  ·  Variant: <strong style={{ color: 'var(--primary)' }}>{order.variant || 'Default'}</strong>  ·  Qty: <strong style={{ color: 'var(--primary)' }}>{order.quantity || 1}</strong>  ·  Ordered: {order.date}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {customizationBadge(order)}
                            {deliveryBadge(order)}
                          </div>
                        </div>

                        {/* DPI & Shopify status */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                          <span className={`badge ${order.dpiStatus === 'ok' ? 'badge-success' : order.dpiStatus === 'low' ? 'badge-warning' : 'badge-error'}`}>
                            <i className={`bi ${order.dpiStatus === 'ok' ? 'bi-check-circle' : 'bi-exclamation-triangle'}`} />
                            {order.dpi} {order.dpiStatus === 'ok' ? '✓' : '⚠'}
                          </span>
                          <span className={`badge ${order.paymentStatus === 'paid' || order.paymentStatus === 'authorized' ? 'badge-success' : 'badge-warning'}`}>
                            <i className="bi bi-wallet2" style={{ marginRight: 3 }} />
                            {order.paymentStatus || 'Paid'}
                          </span>
                          <span className={`badge ${order.fulfillmentStatus === 'fulfilled' ? 'badge-success' : 'badge-secondary'}`}>
                            <i className="bi bi-box-seam" style={{ marginRight: 3 }} />
                            {order.fulfillmentStatus || 'unfulfilled'}
                          </span>
                          <a href={`https://admin.shopify.com/store/theprink/orders/${order.shopifyId || order.id.split('-')[0]}`} target="_blank" rel="noopener noreferrer" className="badge badge-secondary" style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            Ref: Shopify-{order.id}
                          </a>
                        </div>

                        {/* Progress */}
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5 }}>
                            <span style={{ fontWeight: 600 }}>Production Progress</span>
                            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{pct}%</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        {/* Admin feedback */}
                        {order.adminComments && (
                          <div style={{ background: 'rgba(255,48,76,0.06)', border: '1px solid rgba(255,48,76,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--error)', marginBottom: 4 }}>
                              <i className="bi bi-exclamation-circle" style={{ marginRight: 4 }} />Admin Revision Request
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>{order.adminComments}</p>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: 14, marginTop: 14 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => { setActiveOrder(order); navTo('tracking'); }}>
                            <i className="bi bi-geo-alt" /> Track Order
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => { setActiveOrder(order); navTo('preview'); }}>
                            <i className="bi bi-cloud-upload" /> Upload Photos
                          </button>
                          {order.deliveryStatus !== 'delivered' && (
                            <button className="btn btn-primary btn-sm" onClick={() => loadSkuTemplate(order)}>
                              <i className={`bi ${isCompleted ? 'bi-eye' : 'bi-palette'}`} />
                              {isCompleted ? 'View Design' : isInProgress ? 'Resume Lab' : 'Customize Design'}
                            </button>
                          )}
                          {order.deliveryStatus === 'delivered' && (
                            <button className="btn btn-secondary btn-sm" onClick={() => showToast('Reorder added to cart!', 'success')}>
                              <i className="bi bi-arrow-repeat" /> Reorder
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================================
            SUBVIEW: UPLOAD PHOTOS (preview key used as upload center)
            ================================================================== */}
        {activeSubView === 'preview' && (
          <div className="wizard-shell" style={{ background: 'transparent', minHeight: 'unset' }}>

            {/* ── Wizard Steps Bar ─────────────────────────────────────────── */}
            {wizardStep < 5 && (
              <div className="wizard-steps-bar" style={{ margin: '28px 0 44px', padding: '0 4px' }}>
                {[
                  { n: 1, label: 'Select' },
                  { n: 2, label: 'Upload' },
                  { n: 3, label: 'Preview' },
                  { n: 4, label: 'Review' },
                  { n: 5, label: 'Done' },
                ].filter(s => s.n !== 3 || (activeOrder && getProductConfig(activeOrder.productType).requiresPreview))
                .map((s, idx, arr) => {
                  const status = wizardStep > s.n ? 'done' : wizardStep === s.n ? 'active' : 'pending';
                  const isDone = idx > 0 && wizardStep > arr[idx-1].n;
                  const isActive = idx > 0 && wizardStep === s.n;
                  return (
                    <React.Fragment key={s.n}>
                      {idx > 0 && <div className={`wizard-step-connector ${isDone ? 'done' : isActive ? 'active' : ''}`} />}
                      <div className={`wizard-step-node ${status}`}>
                        <div className={`wizard-step-circle ${status}`}>
                          {status === 'done' ? <i className="bi bi-check-lg" /> : (idx + 1)}
                        </div>
                        <div className="wizard-step-label">{s.label}</div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* ================================================================
                WIZARD STEP 1 — Product Selection
                ================================================================ */}
            {wizardStep === 1 && (
              <div className={`wizard-panel${wizardDir === 'back' ? ' reverse' : ''}`}>
                <h2 className="wiz-section-title">Your Ordered Products</h2>
                <p className="wiz-section-sub">Select a product below to begin your personalization journey.</p>

                <div className="wiz-product-grid">
                  {orders.map((order, idx) => {
                    const isCompleted  = order.customizationStatus === 'completed';
                    const isInProgress = order.customizationStatus === 'in-progress';
                    const isSelected   = activeOrder?.id === order.id;
                    return (
                      <div
                        key={order.id}
                        className={`wiz-product-card${isSelected ? ' selected' : ''}`}
                        style={{ animationDelay: `${idx * 0.07}s` }}
                        onClick={() => {
                          setActiveOrder(order);
                          setSelectedProduct(order.productType);
                          setPhotoScale(1); setPhotoRotation(0); setPhotoOffsetX(0); setPhotoOffsetY(0);
                        }}
                      >
                        {/* QTY Badge */}
                        <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 3 }}>
                          <span className="badge badge-secondary" style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 800, boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}>QTY: {order.quantity || 1}</span>
                        </div>
                        {/* Image */}
                        <div className="wiz-product-card-img">
                          {order.images && order.images.length > 0 ? (
                            <img src={order.images[0].src} alt={order.product} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <i className={`bi ${productIcon(order.productType)}`} />
                          )}
                        </div>
                        {/* Body */}
                        <div className="wiz-product-card-body">
                          <div className="wiz-product-card-name">{order.product}</div>
                          <div className="wiz-product-card-sku">SKU: {order.sku || 'PRK-GENERIC'} &nbsp;·&nbsp; {order.date}</div>
                          <div className="wiz-product-card-footer">
                            <div>
                              <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Status</div>
                              {isCompleted ? (
                                <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 11 }}><i className="bi bi-check-circle-fill" style={{ marginRight: 3 }} />Submitted</span>
                              ) : isInProgress ? (
                                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 11 }}><i className="bi bi-pencil" style={{ marginRight: 3 }} />In Progress</span>
                              ) : (
                                <span style={{ color: 'var(--warning)', fontWeight: 700, fontSize: 11 }}><i className="bi bi-hourglass-split" style={{ marginRight: 3 }} />Awaiting Photos</span>
                              )}
                            </div>
                            <button
                              type="button"
                              className="wiz-personalize-btn"
                              onClick={e => {
                                e.stopPropagation();
                                setActiveOrder(order);
                                setSelectedProduct(order.productType);
                                setPhotoScale(1); setPhotoRotation(0); setPhotoOffsetX(0); setPhotoOffsetY(0);
                                goWizard(2, 'forward');
                              }}
                            >
                              <i className="bi bi-stars" /> Personalize
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Order Status Tracking System ── */}
                <div className="card tracking-card" style={{ marginTop: 40, padding: 24, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)', margin: '0 0 4px' }}>Live Order Status Tracking</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '0 0 24px' }}>Follow your order's real-time journey from placement to print production and shipment.</p>
                  
                  {activeOrder ? (() => {
                    const logs = activeOrder.activityLogs || [];
                    
                    // Determine completion state of each pipeline checkpoint
                    const orderPlacedLog = logs.find((l: any) => l.text.toLowerCase().includes('placed') || l.text.toLowerCase().includes('synced'));
                    const photosUploadedLog = logs.find((l: any) => l.text.toLowerCase().includes('upload') || l.text.toLowerCase().includes('final'));
                    const approvedLog = logs.find((l: any) => l.text.toLowerCase().includes('approved') || l.text.toLowerCase().includes('submitted'));
                    const printingLog = logs.find((l: any) => l.text.toLowerCase().includes('printing') || l.text.toLowerCase().includes('download') || l.text.toLowerCase().includes('pdf'));
                    const deliveredLog = activeOrder.printStatus === 'completed' || activeOrder.customizationStatus === 'completed' && activeOrder.pdfUrl;
                    
                    const pipeline = [
                      { title: 'Order Synced', log: orderPlacedLog || { time: activeOrder.date } },
                      { title: 'Photos Uploaded', log: photosUploadedLog },
                      { title: 'Admin Approved', log: approvedLog },
                      { title: 'Sent to Printer', log: printingLog },
                      { title: 'Fulfillment Completed', log: deliveredLog ? { time: 'Completed' } : null }
                    ];

                    return (
                      <div>
                        {/* Timeline Visualization */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: 32, padding: '0 10px' }}>
                          {/* Connector Line */}
                          <div style={{ position: 'absolute', top: 12, left: '6%', right: '6%', height: 2, background: 'var(--border-color)', zIndex: 1 }} />
                          {/* Progress Line */}
                          <div style={{ 
                            position: 'absolute', 
                            top: 12, 
                            left: '6%', 
                            width: `${
                              deliveredLog ? '88%' : 
                              printingLog ? '66%' : 
                              approvedLog ? '44%' : 
                              photosUploadedLog ? '22%' : '0%'
                            }`, 
                            height: 2, 
                            background: 'var(--success)', 
                            zIndex: 1,
                            transition: 'width 0.4s ease'
                          }} />
                          
                          {pipeline.map((step, idx) => {
                            const isDone = !!step.log;
                            return (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, width: '18%' }}>
                                <div style={{ 
                                  width: 26, 
                                  height: 26, 
                                  borderRadius: '50%', 
                                  background: isDone ? 'var(--success)' : 'var(--bg-primary)', 
                                  border: `2px solid ${isDone ? 'var(--success)' : 'var(--border-color)'}`, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  color: isDone ? 'white' : 'var(--text-tertiary)',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  marginBottom: 8,
                                  boxShadow: 'var(--shadow-sm)'
                                }}>
                                  {isDone ? <i className="bi bi-check" style={{ fontSize: 16 }} /> : (idx + 1)}
                                </div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: isDone ? 'var(--text-primary)' : 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.2 }}>{step.title}</div>
                                {isDone && step.log?.time && (
                                  <div style={{ fontSize: 8, color: 'var(--text-tertiary)', marginTop: 4 }}>{step.log.time}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Recent History */}
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 18 }}>
                          <h4 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', margin: '0 0 12px' }}>Operational Activity Logs</h4>
                          <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {logs.length === 0 ? (
                              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No logs recorded for this order yet.</div>
                            ) : (
                              [...logs].reverse().map((log: any, logIdx: number) => (
                                <div key={logIdx} style={{ display: 'flex', gap: 12, fontSize: 11, alignItems: 'center' }}>
                                  <span style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: 10 }}>[{log.time}]</span>
                                  <span className={`badge badge-${log.type === 'success' ? 'success' : log.type === 'error' ? 'danger' : 'secondary'}`} style={{ fontSize: 8, padding: '2px 6px', textTransform: 'uppercase' }}>{log.type}</span>
                                  <span style={{ color: 'var(--text-primary)' }}>{log.text}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })() : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', color: 'var(--text-tertiary)' }}>
                      <i className="bi bi-info-circle" style={{ fontSize: 24, marginBottom: 8, opacity: 0.5 }} />
                      <div style={{ fontSize: 11, fontStyle: 'italic' }}>Select a product from the list above to view its real-time production history tracking timeline.</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================================================================
                WIZARD STEP 2 — Photo Upload
                ================================================================ */}
            {wizardStep === 2 && activeOrder && (
              <div className={`wizard-panel${wizardDir === 'back' ? ' reverse' : ''}`}>
                {/* Selected product banner */}
                                <div className="wiz-prod-banner">
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, var(--primary) 0%, #2A3178 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'white', flexShrink: 0, boxShadow: '0 8px 16px rgba(11,15,51,0.2)' }}>
                    <i className={"bi " + productIcon(activeOrder.productType)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)', lineHeight: 1.2, marginBottom: 8 }}>{activeOrder.product}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span className="badge bg-secondary">SKU: {activeOrder.sku}</span>
                      <span className="badge" style={{ backgroundColor: 'var(--primary)' }}>Qty: {activeOrder.quantity}</span>
                      <span className="badge bg-info text-dark">
                        <i className="bi bi-rulers me-1" />
                        {activeOrder.skuDetails?.printAreaWidth ? Math.round(activeOrder.skuDetails.printAreaWidth * 300) : getProductConfig(activeOrder.productType).pixelWidth}x{activeOrder.skuDetails?.printAreaHeight ? Math.round(activeOrder.skuDetails.printAreaHeight * 300) : getProductConfig(activeOrder.productType).pixelHeight}px
                      </span>
                    </div>
                  </div>
                </div>

                <h2 className="wiz-section-title">Upload Your Photos</h2>
                <p className="wiz-section-sub">Drop your photos here — we'll place them beautifully on your product.</p>

                {activeOrder.productType === 'butterfly' && (
                  <div style={{
                    background: 'linear-gradient(to right, #eff6ff, #f8fafc)',
                    border: '1px solid #bfdbfe',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.05)'
                  }}>
                    <div style={{
                      background: '#3b82f6',
                      color: 'white',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                      boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
                    }}>
                      <i className="bi bi-info-circle-fill" style={{ fontSize: '16px' }}></i>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 800, color: '#1e3a8a' }}>Butterfly Box Photo Rules</h4>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#1e40af', fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <li>You must upload <strong>exactly 2 photos</strong> to proceed.</li>
                        <li><strong>Photo 1</strong> will be placed on <strong>Product 1 (Blue layout)</strong>.</li>
                        <li><strong>Photo 2</strong> will be placed on <strong>Product 2 (Red layout)</strong>.</li>
                        <li>After uploading, you can instantly preview and adjust crops for each photo.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Upload method pills */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  {[
                    { icon: 'bi-folder2-open', label: 'From Device', m: 'file' },
                    { icon: 'bi-camera',        label: 'Camera',      m: 'camera' },
                    { icon: 'bi-cloud-arrow-up',label: 'Cloud Drive', m: 'cloud' },
                  ].map(pill => (
                    <button key={pill.m}
                      className={`upload-method-pill${uploadMethod === pill.m ? ' active' : ''}`}
                      onClick={() => handleMethodClick(pill.m as any)}>
                      <i className={`bi ${pill.icon}`} /> {pill.label}
                    </button>
                  ))}
                </div>

                {/* Drop zone */}
                <div
                  className={`wiz-upload-zone${dragOver ? ' dragover' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files) addImages(e.dataTransfer.files); }}
                  onClick={() => fileInputRef.current?.click()}
                >
                                    <div className="wiz-upload-zone-content">
                    <i className="bi bi-cloud-arrow-up-fill wiz-upload-icon" />
                    <div style={{ fontWeight: 900, fontSize: 24, color: 'var(--primary)', marginBottom: 8 }}>Drop your best photos here</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                    Supports <strong>JPG, PNG, HEIC, WEBP</strong>&nbsp;·&nbsp;Max 20MB per photo<br />
                    Minimum <strong>300 DPI</strong> recommended for best print quality
                  </div>
                  </div>
                </div>

                {/* Thumbnail strip & Live Preview (if Butterfly) */}
                {images.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 12 }}>Your Photos ({images.length})</div>
                    
                    {/* Live Preview for Butterfly Box */}
                    {(activeOrder.productType === 'butterfly' || (activeOrder.product || '').toLowerCase().includes('butterfly')) && (
                      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
                        {renderButterflySheet(true)}
                      </div>
                    )}

                    <div className="wiz-thumb-strip">
                      {images.map((img, idx) => (
                        <div key={img.id} className="wiz-thumb" style={{ animationDelay: `${idx * 0.06}s` }}>
                          <img src={img.src} alt={img.name} />
                          {uploadProgress[img.id] !== undefined && uploadProgress[img.id] < 100 && (
                            <div className="wiz-upload-progress" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 0, margin: 0 }}>
                              <div className="wiz-upload-progress-fill" style={{ width: `${uploadProgress[img.id]}%` }} />
                            </div>
                          )}
                          <button className="wiz-thumb-remove" onClick={e => { e.stopPropagation(); removeImage(img.id); }}>
                            <i className="bi bi-x" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* OR divider */}
                <div style={{ display: 'flex', alignItems: 'center', margin: '32px 0' }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color)' }}></div>
                  <div style={{ padding: '0 16px', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 13, textTransform: 'uppercase' }}>OR CHOOSE A THEME</div>
                  <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color)' }}></div>
                </div>

                {/* Theme Selection */}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--primary)' }}>Skip Photo Upload & Select an Occasion</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                    {[
                      { id: 'birthday', label: 'Happy Birthday', icon: 'bi-balloon' },
                      { id: 'anniversary', label: 'Anniversary', icon: 'bi-heart' },
                      { id: 'love', label: 'Love', icon: 'bi-hearts' },
                      { id: 'custom', label: 'Custom Text Only', icon: 'bi-type' }
                    ].map(theme => (
                      <button key={theme.id}
                        className={`wiz-theme-card${selectedOccasionTheme === theme.id ? ' selected' : ''}`}
                        onClick={() => setSelectedOccasionTheme(theme.id === selectedOccasionTheme ? '' : theme.id)}
                        style={{
                          padding: '16px 12px',
                          borderRadius: 12,
                          border: `2px solid ${selectedOccasionTheme === theme.id ? 'var(--accent)' : 'var(--border-color)'}`,
                          background: selectedOccasionTheme === theme.id ? 'rgba(233,69,96,0.05)' : 'white',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 8,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <i className={`bi ${theme.icon}`} style={{ fontSize: 24, color: selectedOccasionTheme === theme.id ? 'var(--accent)' : 'var(--text-secondary)' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: selectedOccasionTheme === theme.id ? 'var(--accent)' : 'var(--primary)' }}>{theme.label}</span>
                      </button>
                    ))}
                  </div>
                  {selectedOccasionTheme && (
                    <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <i className="bi bi-info-circle me-1" /> You selected a theme. You can skip photo upload and proceed.
                      <button className="btn btn-sm btn-link text-danger p-0 ms-3" onClick={() => setSelectedOccasionTheme('')}>Clear Theme</button>
                    </div>
                  )}
                </div>

                {/* Personalization caption */}
                <div style={{ marginTop: 24 }}>
                  <label className="label" style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, display: 'block' }}>Personalization Message <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(Optional)</span></label>
                  <textarea
                    className="textarea"
                    rows={3}
                    maxLength={MAX_CAPTION}
                    placeholder="E.g. 'Happy Birthday Mom! With love, Sarah' — included on your print."
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    style={{ fontSize: 13 }}
                  />
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4, textAlign: 'right' }}>{caption.length}/{MAX_CAPTION}</div>
                </div>

                {/* Nav row */}
                <div className="wiz-nav-row">
                  <button className="wiz-btn-back" onClick={() => goWizard(1, 'back')}>
                    <i className="bi bi-arrow-left" /> Back
                  </button>
                  <button
                    className="wiz-btn-next"
                    onClick={() => {
                      if ((activeOrder.productType === 'butterfly' || (activeOrder.product || '').toLowerCase().includes('butterfly'))) {
                        if (images.length !== 8 && !selectedOccasionTheme) {
                          showToast('The Butterfly Box template requires exactly 8 photos or a selected theme.', 'warning');
                          return;
                        }
                      } else {
                        if (images.length === 0 && !selectedOccasionTheme) {
                          showToast('Please upload at least one photo or select a theme.', 'warning');
                          return;
                        }
                      }
                      
                      const reqPreview = getProductConfig(activeOrder.productType).requiresPreview;
                      if (images.length > 0) {
                        setLivePreviewPhoto(images[0].src);
                      } else {
                        setLivePreviewPhoto(null);
                      }
                      
                      goWizard(reqPreview ? 3 : 4, 'forward');
                    }}
                  >
                    {getProductConfig(activeOrder.productType).requiresPreview ? 'Preview & Edit' : 'Review Design'} <i className="bi bi-arrow-right" />
                  </button>
                </div>
              </div>
            )}

            {/* ================================================================
                WIZARD STEP 3 — Live Preview & Editing
                ================================================================ */}
            {wizardStep === 3 && activeOrder && (
              <div className={`wizard-panel${wizardDir === 'back' ? ' reverse' : ''}`}>
                <h2 className="wiz-section-title">Position Your Design</h2>
                <p className="wiz-section-sub">Drag the image inside the mockup to perfectly position it on your product.</p>

                <div className="wiz-editor-layout">
                  {/* Left: Mockup Stage */}
                  <div className="wiz-mockup-stage">
                    {/* T-SHIRT */}
                    {activeOrder.productType === 'tshirt' && (
                      <div style={{ position: 'relative', width: '220px', height: '260px', display: 'flex', justifyContent: 'center' }}>
                        <svg viewBox="0 0 100 100" style={{ position: 'absolute', width: '100%', height: '100%', fill: '#f5f5f5', stroke: '#ddd', strokeWidth: 1.5, filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.12))' }}>
                          <path d="M 30,10 L 40,15 L 50,12 L 60,15 L 70,10 L 85,25 L 75,35 L 70,32 L 70,90 L 30,90 L 30,32 L 25,35 L 15,25 Z" />
                          <path d="M 40,15 A 10,10 0 0,0 60,15 Z" fill="#e0e0e0" />
                        </svg>
                        <div style={{ position: 'absolute', top: '75px', width: '64px', height: '85px', border: '1px dashed rgba(23,28,98,0.2)', overflow: 'hidden', background: '#fff', borderRadius: 2 }}>
                          <img src={livePreviewPhoto || images[0]?.src} alt="preview"
                            style={{ transform: `translate(${photoOffsetX}px,${photoOffsetY}px) scale(${photoScale}) rotate(${photoRotation}deg)`, cursor: 'move', transition: isDraggingPhoto ? 'none' : 'transform 0.15s ease-out', width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none', touchAction: 'none' }}
                            onMouseDown={e => { e.preventDefault(); setIsDraggingPhoto(true); dragStartPos.current = { x: e.clientX, y: e.clientY }; photoOffsetStart.current = { x: photoOffsetX, y: photoOffsetY }; }}
                            onTouchStart={e => { setIsDraggingPhoto(true); const t = e.touches[0]; dragStartPos.current = { x: t.clientX, y: t.clientY }; photoOffsetStart.current = { x: photoOffsetX, y: photoOffsetY }; }}
                          />
                        </div>
                      </div>
                    )}
                    {/* MUG */}
                    {activeOrder.productType === 'mug' && (
                      <div style={{ position: 'relative', width: '220px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '130px', height: '140px', background: '#ffffff', borderRadius: '8px 8px 16px 16px', boxShadow: 'inset -20px 0 20px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #eee', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '100px', height: '110px', overflow: 'hidden', borderRadius: 4, position: 'relative', border: '1px dashed #ddd' }}>
                            <img src={livePreviewPhoto || images[0]?.src} alt="preview"
                              style={{ transform: `translate(${photoOffsetX}px,${photoOffsetY}px) scale(${photoScale}) rotate(${photoRotation}deg)`, cursor: 'move', transition: isDraggingPhoto ? 'none' : 'transform 0.15s ease-out', width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none', touchAction: 'none' }}
                              onMouseDown={e => { e.preventDefault(); setIsDraggingPhoto(true); dragStartPos.current = { x: e.clientX, y: e.clientY }; photoOffsetStart.current = { x: photoOffsetX, y: photoOffsetY }; }}
                              onTouchStart={e => { setIsDraggingPhoto(true); const t = e.touches[0]; dragStartPos.current = { x: t.clientX, y: t.clientY }; photoOffsetStart.current = { x: photoOffsetX, y: photoOffsetY }; }}
                            />
                          </div>
                        </div>
                        <div style={{ position: 'absolute', right: '25px', top: '40px', width: '30px', height: '80px', border: '12px solid #ffffff', borderLeft: 'none', borderRadius: '0 40px 40px 0', boxShadow: '3px 6px 12px rgba(0,0,0,0.08)' }} />
                      </div>
                    )}
                    {/* MOBILE CASE */}
                    {activeOrder.productType === 'mobilecase' && (
                      <div style={{ position: 'relative', width: '130px', height: '250px', background: '#1c1c1e', borderRadius: '24px', padding: '6px', border: '3px solid #2c2c2e', boxShadow: '0 12px 36px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ position: 'absolute', top: '15px', left: '15px', width: '40px', height: '40px', background: '#0a0a0a', borderRadius: '10px', zIndex: 10, display: 'flex', flexWrap: 'wrap', padding: '4px', gap: '2px' }}>
                          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#2c2c2e' }} />
                          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#2c2c2e' }} />
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2c2c2e' }} />
                        </div>
                        <div style={{ width: '100%', height: '100%', borderRadius: '18px', overflow: 'hidden', position: 'relative', background: '#fff' }}>
                          <img src={livePreviewPhoto || images[0]?.src} alt="preview"
                            style={{ transform: `translate(${photoOffsetX}px,${photoOffsetY}px) scale(${photoScale}) rotate(${photoRotation}deg)`, cursor: 'move', transition: isDraggingPhoto ? 'none' : 'transform 0.15s ease-out', width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none', touchAction: 'none' }}
                            onMouseDown={e => { e.preventDefault(); setIsDraggingPhoto(true); dragStartPos.current = { x: e.clientX, y: e.clientY }; photoOffsetStart.current = { x: photoOffsetX, y: photoOffsetY }; }}
                            onTouchStart={e => { setIsDraggingPhoto(true); const t = e.touches[0]; dragStartPos.current = { x: t.clientX, y: t.clientY }; photoOffsetStart.current = { x: photoOffsetX, y: photoOffsetY }; }}
                          />
                        </div>
                      </div>
                    )}
                    {/* FRAME */}
                    {activeOrder.productType === 'frame' && (
                      <div style={{ position: 'relative', width: '220px', height: '180px', background: '#3e2723', padding: '16px', borderRadius: '4px', boxShadow: '0 10px 36px rgba(0,0,0,0.25)', border: '1px solid #271511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '100%', height: '100%', background: '#f5f5f5', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.1)' }}>
                          <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', background: '#fff', boxShadow: 'inset 0 0 4px rgba(0,0,0,0.2)' }}>
                            <img src={livePreviewPhoto || images[0]?.src} alt="preview"
                              style={{ transform: `translate(${photoOffsetX}px,${photoOffsetY}px) scale(${photoScale}) rotate(${photoRotation}deg)`, cursor: 'move', transition: isDraggingPhoto ? 'none' : 'transform 0.15s ease-out', width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none', touchAction: 'none' }}
                              onMouseDown={e => { e.preventDefault(); setIsDraggingPhoto(true); dragStartPos.current = { x: e.clientX, y: e.clientY }; photoOffsetStart.current = { x: photoOffsetX, y: photoOffsetY }; }}
                              onTouchStart={e => { setIsDraggingPhoto(true); const t = e.touches[0]; dragStartPos.current = { x: t.clientX, y: t.clientY }; photoOffsetStart.current = { x: photoOffsetX, y: photoOffsetY }; }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {/* PILLOW */}
                    {activeOrder.productType === 'pillow' && (
                      <div style={{ position: 'relative', width: '200px', height: '200px', background: '#fafafa', borderRadius: '36px', boxShadow: '0 10px 28px rgba(0,0,0,0.10), inset 0 0 20px rgba(0,0,0,0.06)', overflow: 'hidden', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f0f0f0' }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '24px', overflow: 'hidden', position: 'relative', border: '1px dashed #eee' }}>
                          <img src={livePreviewPhoto || images[0]?.src} alt="preview"
                            style={{ transform: `translate(${photoOffsetX}px,${photoOffsetY}px) scale(${photoScale}) rotate(${photoRotation}deg)`, cursor: 'move', transition: isDraggingPhoto ? 'none' : 'transform 0.15s ease-out', width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none', touchAction: 'none' }}
                            onMouseDown={e => { e.preventDefault(); setIsDraggingPhoto(true); dragStartPos.current = { x: e.clientX, y: e.clientY }; photoOffsetStart.current = { x: photoOffsetX, y: photoOffsetY }; }}
                            onTouchStart={e => { setIsDraggingPhoto(true); const t = e.touches[0]; dragStartPos.current = { x: t.clientX, y: t.clientY }; photoOffsetStart.current = { x: photoOffsetX, y: photoOffsetY }; }}
                          />
                        </div>
                      </div>
                    )}
                    {/* KEYCHAIN */}
                    {activeOrder.productType === 'keychain' && (
                      <div style={{ position: 'relative', width: '200px', height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '4px solid #b0bec5', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                        <div style={{ width: '4px', height: '16px', background: '#b0bec5' }} />
                        <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '6px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
                            <img src={livePreviewPhoto || images[0]?.src} alt="preview"
                              style={{ transform: `translate(${photoOffsetX}px,${photoOffsetY}px) scale(${photoScale}) rotate(${photoRotation}deg)`, cursor: 'move', transition: isDraggingPhoto ? 'none' : 'transform 0.15s ease-out', width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none', touchAction: 'none' }}
                              onMouseDown={e => { e.preventDefault(); setIsDraggingPhoto(true); dragStartPos.current = { x: e.clientX, y: e.clientY }; photoOffsetStart.current = { x: photoOffsetX, y: photoOffsetY }; }}
                              onTouchStart={e => { setIsDraggingPhoto(true); const t = e.touches[0]; dragStartPos.current = { x: t.clientX, y: t.clientY }; photoOffsetStart.current = { x: photoOffsetX, y: photoOffsetY }; }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {/* PHOTO BOOK */}
                    {activeOrder.productType === 'photobook' && (
                      <div style={{ position: 'relative', width: '250px', height: '170px', background: '#fafafa', borderRadius: '4px', border: '1px solid #ddd', display: 'flex', boxShadow: '0 10px 25px rgba(0,0,0,0.12)' }}>
                        <div style={{ flex: 1, borderRight: '1px solid #eee', background: '#fff', padding: '10px' }}>
                          <div style={{ width: '100%', height: '100%', border: '1px solid #f0f0f0', borderRadius: 2 }} />
                        </div>
                        <div style={{ flex: 1, background: '#fff', padding: '10px' }}>
                          <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', border: '1px dashed #ccc', borderRadius: 2 }}>
                            <img src={livePreviewPhoto || images[0]?.src} alt="preview"
                              style={{ transform: `translate(${photoOffsetX}px,${photoOffsetY}px) scale(${photoScale}) rotate(${photoRotation}deg)`, cursor: 'move', transition: isDraggingPhoto ? 'none' : 'transform 0.15s ease-out', width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none', touchAction: 'none' }}
                              onMouseDown={e => { e.preventDefault(); setIsDraggingPhoto(true); dragStartPos.current = { x: e.clientX, y: e.clientY }; photoOffsetStart.current = { x: photoOffsetX, y: photoOffsetY }; }}
                              onTouchStart={e => { setIsDraggingPhoto(true); const t = e.touches[0]; dragStartPos.current = { x: t.clientX, y: t.clientY }; photoOffsetStart.current = { x: photoOffsetX, y: photoOffsetY }; }}
                            />
                          </div>
                        </div>
                        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '4px', marginLeft: '-2px', background: 'linear-gradient(90deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.08) 100%)' }} />
                      </div>
                    )}
                    {/* BUTTERFLY BOX */}
                    {(activeOrder.productType === 'butterfly' || (activeOrder.product || '').toLowerCase().includes('butterfly')) && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%', position: 'relative' }}>
                        
                        {/* Toggle Mode Switch */}
                        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.08)', padding: '4px', borderRadius: '99px', border: '1px solid rgba(255, 255, 255, 0.1)', gap: '4px', zIndex: 100 }}>
                          <button 
                            type="button"
                            onClick={() => setButterflyPreviewMode('sheet')}
                            style={{ padding: '6px 16px', borderRadius: '99px', border: 'none', background: butterflyPreviewMode === 'sheet' ? 'var(--accent)' : 'transparent', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                          >
                            <i className="bi bi-file-earmark-pdf" style={{ marginRight: '5px' }} /> Print Sheet View
                          </button>
                          <button 
                            type="button"
                            onClick={() => setButterflyPreviewMode('mockup')}
                            style={{ padding: '6px 16px', borderRadius: '99px', border: 'none', background: butterflyPreviewMode === 'mockup' ? 'var(--accent)' : 'transparent', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                          >
                            <i className="bi bi-box-seam" style={{ marginRight: '5px' }} /> 3D Mockup Box
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '28px', width: '100%', padding: '0 20px', flexWrap: 'wrap' }}>
                          
                          {/* Left side: Preview Stage */}
                          {butterflyPreviewMode === 'sheet' ? (
                            /* Realistic 2D Print Sheet Preview */
                            renderButterflySheet(false)
                          ) : (
                            /* 3D Butterfly Box Mockup */
                            <div style={{
                              width: '200px',
                              height: '240px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              perspective: '1000px',
                            }}>
                              <div style={{
                                position: 'relative',
                                width: '140px',
                                height: '140px',
                                transformStyle: 'preserve-3d',
                                animation: 'butterflySpin 16s infinite linear'
                              }}>
                                <style dangerouslySetInnerHTML={{__html: `
                                  @keyframes butterflySpin {
                                    from { transform: rotateX(-20deg) rotateY(0deg); }
                                    to { transform: rotateX(-20deg) rotateY(360deg); }
                                  }
                                `}} />
                                {/* Front Face (Product 2 / Red) */}
                                <div style={{
                                  position: 'absolute', width: '140px', height: '140px',
                                  background: '#fff', border: '2px solid #e11d48',
                                  transform: 'translateZ(70px)', display: 'flex', flexWrap: 'wrap'
                                }}>
                                  {[1].map(idx => {
                                    const crop = butterflyCrops[idx] || { scale: 1, rotation: 0, x: 0, y: 0 };
                                    return (
                                      <div key={idx} style={{ width: '100%', height: '100%', overflow: 'hidden', border: '1px solid #fff' }}>
                                        {images[idx] ? (
                                          <img crossOrigin="anonymous" src={images[idx].src} alt={`mockup-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transformOrigin: 'center', transform: `translate(${crop.x * (140/140)}px, ${crop.y * (140/140)}px) scale(${crop.scale}) rotate(${crop.rotation}deg)` }} />
                                        ) : <div style={{ width: '100%', height: '100%', background: '#fce7f3' }} />}
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                {/* Top Face (Product 1 / Blue) */}
                                <div style={{
                                  position: 'absolute', width: '140px', height: '140px',
                                  background: '#fff', border: '2px solid #0ea5e9',
                                  transform: 'rotateX(90deg) translateZ(70px)', display: 'flex', flexWrap: 'wrap'
                                }}>
                                  {[0].map(idx => {
                                    const crop = butterflyCrops[idx] || { scale: 1, rotation: 0, x: 0, y: 0 };
                                    return (
                                      <div key={idx} style={{ width: '100%', height: '100%', overflow: 'hidden', border: '1px solid #fff' }}>
                                        {images[idx] ? (
                                          <img crossOrigin="anonymous" src={images[idx].src} alt={`mockup-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transformOrigin: 'center', transform: `translate(${crop.x * (140/140)}px, ${crop.y * (140/140)}px) scale(${crop.scale}) rotate(${crop.rotation}deg)` }} />
                                        ) : <div style={{ width: '100%', height: '100%', background: '#e0f2fe' }} />}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Right, Left, Back, Bottom faces for completeness */}
                                <div style={{ position: 'absolute', width: '140px', height: '140px', background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', border: '1px solid #cbd5e1', transform: 'rotateY(90deg) translateZ(70px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <div style={{ color: '#94a3b8', fontSize: '24px', fontWeight: 900, transform: 'rotate(-45deg)' }}>PRINK</div>
                                </div>
                                <div style={{ position: 'absolute', width: '140px', height: '140px', background: '#f8fafc', border: '1px solid #cbd5e1', transform: 'rotateY(-90deg) translateZ(70px)' }} />
                                <div style={{ position: 'absolute', width: '140px', height: '140px', background: '#f8fafc', border: '1px solid #cbd5e1', transform: 'rotateY(180deg) translateZ(70px)' }} />
                                <div style={{ position: 'absolute', width: '140px', height: '140px', background: '#e2e8f0', border: '1px solid #cbd5e1', transform: 'rotateX(-90deg) translateZ(70px)' }} />
                              </div>
                            </div>
                          )}

                          {/* Right side: Active Cell Focus Editor */}
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            padding: '12px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                          }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Adjust Photo #{activeButterflyIndex + 1}
                            </div>
                            
                            <div style={{
                              position: 'relative',
                              width: '140px',
                              height: '140px',
                              borderRadius: '8px',
                              border: `2px dashed ${activeButterflyIndex < 4 ? '#3b82f6' : '#ef4444'}`,
                              overflow: 'hidden',
                              background: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)'
                            }}>
                              {images[activeButterflyIndex] ? (
                                <img
                                  src={livePreviewPhoto || images[activeButterflyIndex]?.src}
                                  alt="active-cell-preview"
                                  style={{
                                    transform: `translate(${photoOffsetX}px, ${photoOffsetY}px) scale(${photoScale}) rotate(${photoRotation}deg)`,
                                    cursor: 'move',
                                    transition: isDraggingPhoto ? 'none' : 'transform 0.15s ease-out',
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    userSelect: 'none',
                                    touchAction: 'none'
                                  }}
                                  onMouseDown={e => { e.preventDefault(); setIsDraggingPhoto(true); dragStartPos.current = { x: e.clientX, y: e.clientY }; photoOffsetStart.current = { x: photoOffsetX, y: photoOffsetY }; }}
                                  onTouchStart={e => { setIsDraggingPhoto(true); const t = e.touches[0]; dragStartPos.current = { x: t.clientX, y: t.clientY }; photoOffsetStart.current = { x: photoOffsetX, y: photoOffsetY }; }}
                                />
                              ) : (
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Select Photo</span>
                              )}
                            </div>
                            <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                              Drag inside the dashed box to position.
                            </div>
                          </div>

                        </div>

                      </div>
                    )}
                    {/* CANVAS / CALENDAR / GENERIC FALLBACK */}
                    {activeOrder.productType !== 'tshirt' && activeOrder.productType !== 'mug' && activeOrder.productType !== 'mobilecase' && activeOrder.productType !== 'frame' && activeOrder.productType !== 'pillow' && activeOrder.productType !== 'keychain' && activeOrder.productType !== 'photobook' && activeOrder.productType !== 'butterfly' && (
                      <div style={{ position: 'relative', width: '240px', height: '180px', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.14), inset 0 0 0 4px #eee', overflow: 'hidden', background: '#fff' }}>
                        <img src={livePreviewPhoto || images[0]?.src} alt="preview"
                          style={{ transform: `translate(${photoOffsetX}px,${photoOffsetY}px) scale(${photoScale}) rotate(${photoRotation}deg)`, cursor: 'move', transition: isDraggingPhoto ? 'none' : 'transform 0.15s ease-out', width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none', touchAction: 'none' }}
                          onMouseDown={e => { e.preventDefault(); setIsDraggingPhoto(true); dragStartPos.current = { x: e.clientX, y: e.clientY }; photoOffsetStart.current = { x: photoOffsetX, y: photoOffsetY }; }}
                          onTouchStart={e => { setIsDraggingPhoto(true); const t = e.touches[0]; dragStartPos.current = { x: t.clientX, y: t.clientY }; photoOffsetStart.current = { x: photoOffsetX, y: photoOffsetY }; }}
                        />
                      </div>
                    )}
                    {/* Drag hint */}
                    <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(23,28,98,0.75)', backdropFilter: 'blur(6px)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '5px 14px', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
                      <i className="bi bi-arrows-move" style={{ marginRight: 5 }} />Drag to reposition
                    </div>
                  </div>

                  {/* Right: Editor Panel */}
                  <div className="wiz-editor-panel">
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="bi bi-sliders" style={{ color: 'var(--accent)' }} /> Edit Controls
                    </div>

                    {/* Zoom slider */}
                    <div>
                      <div className="wiz-slider-label">
                        <span><i className="bi bi-zoom-in" style={{ marginRight: 4 }} />Zoom / Scale</span>
                        <span style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 800 }} onClick={() => setPhotoScale(1)}>{Math.round(photoScale * 100)}% · Reset</span>
                      </div>
                      <input type="range" className="wiz-slider" min="0.3" max="3.0" step="0.05" value={photoScale} onChange={e => setPhotoScale(parseFloat(e.target.value))} style={{ width: '100%' }} />
                    </div>

                    {/* Rotation slider */}
                    <div>
                      <div className="wiz-slider-label">
                        <span><i className="bi bi-arrow-repeat" style={{ marginRight: 4 }} />Rotate</span>
                        <span style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 800 }} onClick={() => setPhotoRotation(0)}>{photoRotation}° · Reset</span>
                      </div>
                      <input type="range" className="wiz-slider" min="-180" max="180" step="1" value={photoRotation} onChange={e => setPhotoRotation(parseInt(e.target.value))} style={{ width: '100%' }} />
                    </div>

                    {/* Quick actions */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="wiz-tool-btn" onClick={() => { setPhotoScale(s => Math.min(3, s + 0.1)); }}><i className="bi bi-zoom-in" />Zoom In</button>
                      <button className="wiz-tool-btn" onClick={() => { setPhotoScale(s => Math.max(0.3, s - 0.1)); }}><i className="bi bi-zoom-out" />Zoom Out</button>
                      <button className="wiz-tool-btn" onClick={() => { setPhotoRotation(r => r - 90); }}><i className="bi bi-arrow-counterclockwise" />−90°</button>
                      <button className="wiz-tool-btn" onClick={() => { setPhotoRotation(r => r + 90); }}><i className="bi bi-arrow-clockwise" />+90°</button>
                      <button className="wiz-tool-btn" style={{ flex: 1, justifyContent: 'center', color: 'var(--error)', borderColor: 'rgba(255,48,76,0.2)' }} onClick={() => { setPhotoScale(1); setPhotoRotation(0); setPhotoOffsetX(0); setPhotoOffsetY(0); }}>
                        <i className="bi bi-arrow-counterclockwise" />Reset All
                      </button>
                    </div>

                    {/* Thumbnail selector */}
                    {images.length > 1 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Choose Preview Photo</div>
                        <div className="wiz-thumb-strip">
                          {images.map(img => (
                            <div key={img.id} className="wiz-thumb"
                              style={{ border: livePreviewPhoto === img.src ? '2.5px solid var(--accent)' : undefined }}
                              onClick={() => setLivePreviewPhoto(img.src)}>
                              <img src={img.src} alt={img.name} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nav row */}
                <div className="wiz-nav-row">
                  <button className="wiz-btn-back" onClick={() => goWizard(2, 'back')}>
                    <i className="bi bi-arrow-left" /> Back
                  </button>
                  <button className="wiz-btn-next" onClick={() => goWizard(4, 'forward')}>
                    Review Design <i className="bi bi-arrow-right" />
                  </button>
                </div>
              </div>
            )}

            {/* ================================================================
                WIZARD STEP 4 — Final Review
                ================================================================ */}
            {wizardStep === 4 && activeOrder && (
              <div className={`wizard-panel${wizardDir === 'back' ? ' reverse' : ''}`}>
                <h2 className="wiz-section-title">Review Your Design</h2>
                <p className="wiz-section-sub">Look good? Submit it to our design team for review and printing.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 24, alignItems: 'start' }} className="responsive-two-col">
                  {/* Left: Preview */}
                  <div className="wiz-review-card glass-panel">
                    <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="bi bi-eye-fill" style={{ color: 'var(--accent)' }} /> Final Preview
                    </div>
                    {/* Mockup preview (static render) */}
                    <div style={{ width: '100%', minHeight: 240, background: 'linear-gradient(145deg, #eef0f9, #f7f8fc)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                      {(livePreviewPhoto || images[0]?.src) ? (
                        (activeOrder.productType === 'butterfly' || (activeOrder.product || '').toLowerCase().includes('butterfly')) ? (
                          /* Render 2D Print Sheet Preview inside step 4 review */
                          renderButterflySheet(true)
                        ) : (
                          (() => {
                            const pType = activeOrder.productType;
                            const imgSrc = livePreviewPhoto || images[0]?.src;
                            if (pType === 'tshirt') {
                              return (
                                <div style={{ position: 'relative', width: '180px', height: '210px', display: 'flex', justifyContent: 'center' }}>
                                  <svg viewBox="0 0 100 100" style={{ position: 'absolute', width: '100%', height: '100%', fill: '#f5f5f5', stroke: '#ddd', strokeWidth: 1.5, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.1))' }}>
                                    <path d="M 30,10 L 40,15 L 50,12 L 60,15 L 70,10 L 85,25 L 75,35 L 70,32 L 70,90 L 30,90 L 30,32 L 25,35 L 15,25 Z" />
                                    <path d="M 40,15 A 10,10 0 0,0 60,15 Z" fill="#e0e0e0" />
                                  </svg>
                                  <div style={{ position: 'absolute', top: '60px', width: '52px', height: '70px', border: '1px dashed rgba(23,28,98,0.15)', overflow: 'hidden', background: '#fff', borderRadius: 2 }}>
                                    <img src={imgSrc} alt="tshirt layout" style={{ transform: `translate(${photoOffsetX * (52/64)}px,${photoOffsetY * (70/85)}px) scale(${photoScale}) rotate(${photoRotation}deg)`, width: '100%', height: '100%', objectFit: 'cover' }} />
                                  </div>
                                </div>
                              );
                            }
                            if (pType === 'mug') {
                              return (
                                <div style={{ position: 'relative', width: '180px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <div style={{ width: '110px', height: '120px', background: '#ffffff', borderRadius: '8px 8px 14px 14px', boxShadow: 'inset -15px 0 15px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.1)', border: '1px solid #eee', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: '85px', height: '95px', overflow: 'hidden', borderRadius: 4, position: 'relative', border: '1px dashed #eee' }}>
                                      <img src={imgSrc} alt="mug layout" style={{ transform: `translate(${photoOffsetX * (85/100)}px,${photoOffsetY * (95/110)}px) scale(${photoScale}) rotate(${photoRotation}deg)`, width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                  </div>
                                  <div style={{ position: 'absolute', right: '40px', top: '35px', width: '25px', height: '70px', border: '10px solid #ffffff', borderLeft: 'none', borderRadius: '0 30px 30px 0', boxShadow: '2px 4px 8px rgba(0,0,0,0.06)' }} />
                                </div>
                              );
                            }
                            if (pType === 'mobilecase') {
                              return (
                                <div style={{ position: 'relative', width: '110px', height: '210px', background: '#1c1c1e', borderRadius: '20px', padding: '5px', border: '2.5px solid #2c2c2e', boxShadow: '0 10px 28px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
                                  <div style={{ position: 'absolute', top: '12px', left: '12px', width: '32px', height: '32px', background: '#0a0a0a', borderRadius: '8px', zIndex: 10, display: 'flex', flexWrap: 'wrap', padding: '3px', gap: '1.5px' }}>
                                    <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#2c2c2e' }} />
                                    <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#2c2c2e' }} />
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2c2c2e' }} />
                                  </div>
                                  <div style={{ width: '100%', height: '100%', borderRadius: '15px', overflow: 'hidden', position: 'relative', background: '#fff' }}>
                                    <img src={imgSrc} alt="case layout" style={{ transform: `translate(${photoOffsetX * (100/118)}px,${photoOffsetY * (200/238)}px) scale(${photoScale}) rotate(${photoRotation}deg)`, width: '100%', height: '100%', objectFit: 'cover' }} />
                                  </div>
                                </div>
                              );
                            }
                            if (pType === 'frame') {
                              return (
                                <div style={{ position: 'relative', width: '180px', height: '150px', background: '#3e2723', padding: '12px', borderRadius: '4px', boxShadow: '0 8px 28px rgba(0,0,0,0.2)', border: '1px solid #271511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <div style={{ width: '100%', height: '100%', background: '#f5f5f5', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 1.5px 4px rgba(0,0,0,0.1)' }}>
                                    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', background: '#fff', boxShadow: 'inset 0 0 3px rgba(0,0,0,0.15)' }}>
                                      <img src={imgSrc} alt="frame layout" style={{ transform: `translate(${photoOffsetX}px,${photoOffsetY}px) scale(${photoScale}) rotate(${photoRotation}deg)`, width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            // Default canvas fallback
                            return (
                              <div style={{ position: 'relative', width: '180px', height: '180px', padding: '12px', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                <img src={imgSrc} alt="canvas layout" style={{ transform: `translate(${photoOffsetX}px,${photoOffsetY}px) scale(${photoScale}) rotate(${photoRotation}deg)`, width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            );
                          })()
                        )
                      ) : (
                        <i className={`bi ${productIcon(activeOrder.productType)}`} style={{ fontSize: 60, color: 'var(--accent)', opacity: 0.5 }} />
                      )}
                    </div>
                    {/* Uploaded photos row */}
                    {images.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>Uploaded Photos ({images.length})</div>
                        <div className="wiz-thumb-strip">
                          {images.map(img => (
                            <div key={img.id} className="wiz-thumb">
                              <img src={img.src} alt={img.name} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Summary */}
                  <div className="wiz-review-card glass-panel" style={{ gap: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="bi bi-card-checklist" style={{ color: 'var(--accent)' }} /> Order Summary
                    </div>
                    {[
                      { label: 'Product', value: activeOrder.product },
                      { label: 'SKU', value: activeOrder.sku || 'PRK-GENERIC' },
                      { label: 'Quantity', value: String(activeOrder.quantity || 1) },
                      { label: 'Photos', value: images.length > 0 ? `${images.length} photo${images.length !== 1 ? 's' : ''} uploaded` : 'No photos (Theme selected)' },
                      { label: 'Theme', value: selectedOccasionTheme ? selectedOccasionTheme.charAt(0).toUpperCase() + selectedOccasionTheme.slice(1) : '(none)' },
                      { label: 'Message', value: caption.trim() ? caption : '(none)' },
                      { label: 'Scale', value: `${Math.round(photoScale * 100)}%` },
                      { label: 'Rotation', value: `${photoRotation}°` },
                    ].filter(r => r.label !== 'Theme' || selectedOccasionTheme).map(row => (
                      <div key={row.label} className="wiz-spec-row">
                        <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>{row.label}</span>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', textAlign: 'right', maxWidth: '55%', wordBreak: 'break-word' }}>{row.value}</span>
                      </div>
                    ))}

                    {/* Confidence chip */}
                    <div style={{ marginTop: 16, background: 'rgba(15,190,136,0.08)', border: '1px solid rgba(15,190,136,0.2)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                      <i className="bi bi-shield-check" style={{ color: 'var(--success)', fontSize: 18 }} />
                      <span style={{ color: '#0a8a62', fontWeight: 600 }}>Your design will be reviewed by our team within 24 hours before printing.</span>
                    </div>
                  </div>
                </div>

                {/* Nav row */}
                <div className="wiz-nav-row">
                  <button className="wiz-btn-back" onClick={() => goWizard(getProductConfig(activeOrder.productType).requiresPreview ? 3 : 2, 'back')}>
                    <i className="bi bi-pencil" /> {getProductConfig(activeOrder.productType).requiresPreview ? 'Continue Editing' : 'Back to Upload'}
                  </button>
                  <button
                    className="wiz-btn-submit"
                    disabled={isSubmitting}
                    onClick={async () => {
                      setIsSubmitting(true);
                      await handleSubmitDesign();
                      setIsSubmitting(false);
                      goWizard(5, 'forward');
                    }}
                  >
                    {isSubmitting ? (
                      <><div style={{ width: 18, height: 18, border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Submitting...</>
                    ) : (
                      <><i className="bi bi-send-check-fill" /> Submit Design to Admin</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ================================================================
                WIZARD STEP 5 — Success
                ================================================================ */}
            {wizardStep === 5 && (
              <div className="wiz-success-shell" style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Confetti dots */}
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="wiz-confetti-dot" style={{
                    width: `${8 + Math.random() * 10}px`,
                    height: `${8 + Math.random() * 10}px`,
                    background: ['#FF304C','#171C62','#0fbe88','#f59e0b','#4cc9f0'][i % 5],
                    top: `${Math.random() * 40}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.6}s`,
                    animationDuration: `${1 + Math.random() * 0.8}s`,
                    opacity: 0,
                  }} />
                ))}
                <div className="wiz-success-ring">
                  <i className="bi bi-check-lg" />
                </div>
                <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)', margin: '0 0 10px' }}>Design Submitted! 🎉</h2>
                <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 480, lineHeight: 1.7, margin: '0 0 32px' }}>
                  Your design has been sent to our creative team for review. We'll notify you once it's approved and sent to print.
                </p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button className="wiz-btn-next" onClick={() => { navTo('tracking'); }}>
                    <i className="bi bi-geo-alt-fill" /> Track My Order
                  </button>
                  <button className="wiz-btn-back" onClick={() => {
                    setWizardStep(1);
                    setActiveOrder(null);
                    setImages([]);
                    setCaption('');
                    setLivePreviewPhoto(null);
                    setPhotoScale(1); setPhotoRotation(0); setPhotoOffsetX(0); setPhotoOffsetY(0);
                  }}>
                    <i className="bi bi-arrow-left" /> Personalize Another
                  </button>
                </div>
              </div>
            )}

          </div>
        )}


        {/* ==================================================================
            SUBVIEW: DESIGN LAB (CANVAS EDITOR)
            ================================================================== */}
        {activeSubView === 'editor' && (
          <div className="flex flex-col gap-4">
            {/* Editor top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button className="btn btn-outline btn-sm" onClick={() => navTo('dashboard')}>
                  <i className="bi bi-arrow-left" /> Back
                </button>
                <div>
                  <h1 style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                    <i className="bi bi-palette" style={{ marginRight: 8, color: 'var(--accent)' }} />
                    Design Lab
                  </h1>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {activeOrder ? `${activeOrder.product} · SKU: ${activeOrder.sku}` : 'Custom Product'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" title="Undo" onClick={handleUndo} disabled={!undoStack.length}>
                  <i className="bi bi-arrow-counterclockwise" /> Undo
                </button>
                <button className="btn btn-outline btn-sm" title="Redo" onClick={handleRedo} disabled={!redoStack.length}>
                  <i className="bi bi-arrow-clockwise" /> Redo
                </button>
                <div style={{ width: 1, height: 24, background: 'var(--border-color)' }} />
                <button className="btn btn-outline btn-sm" onClick={saveDesign}>
                  <i className="bi bi-save" /> Save Draft
                </button>
                <button className="btn btn-primary btn-sm" onClick={submitDesign}>
                  <i className="bi bi-check-circle" /> Submit Design
                </button>
              </div>
            </div>

            {/* 3-column editor workspace */}
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 260px', gap: 16, alignItems: 'start', minHeight: 520 }}>

              {/* LEFT: Tool Panel */}
              <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflowY: 'auto' }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)' }}>Design Tools</div>

                {/* Add Elements */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Add Elements</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', gap: 8 }} onClick={addTextLayer}>
                      <i className="bi bi-fonts" /> Add Text Layer
                    </button>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" style={{ flex: 1 }} title="Rectangle" onClick={() => addShapeLayer('rect')}>
                        <i className="bi bi-square" /> Rect
                      </button>
                      <button className="btn btn-outline btn-sm" style={{ flex: 1 }} title="Circle" onClick={() => addShapeLayer('circle')}>
                        <i className="bi bi-circle" /> Circle
                      </button>
                    </div>
                    <button className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', gap: 8 }} onClick={() => fileInputRef.current?.click()}>
                      <i className="bi bi-image" /> Upload Image
                    </button>
                  </div>
                </div>

                {/* Image library */}
                {images.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Photo Library</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                      {images.map(img => (
                        <div key={img.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'var(--bg-tertiary)', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border-color)' }}
                          onClick={() => addImageLayer(img.src)}>
                          <img src={img.src} alt={img.name} style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                          <span style={{ fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{img.name}</span>
                          <i className="bi bi-plus-lg" style={{ fontSize: 11, color: 'var(--accent)' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Layers */}
                {canvasElements.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Layers ({canvasElements.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {[...canvasElements].sort((a, b) => b.zIndex - a.zIndex).map(el => (
                        <div key={el.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: selectedElementId === el.id ? 'var(--bg-tertiary)' : 'transparent', borderRadius: 6, cursor: 'pointer', border: '1px solid ' + (selectedElementId === el.id ? 'var(--border-focus)' : 'transparent') }}
                          onClick={() => setSelectedElementId(el.id)}>
                          <i className={`bi ${el.type === 'text' ? 'bi-fonts' : el.type === 'image' ? 'bi-image' : 'bi-square'}`} style={{ fontSize: 12, color: 'var(--text-tertiary)', flexShrink: 0 }} />
                          <span style={{ fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                            {el.type === 'text' ? (el.text?.slice(0, 14) || 'Text') : el.type === 'image' ? 'Image' : (el.shapeType || 'Shape')}
                          </span>
                          <div style={{ display: 'flex', gap: 2 }}>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, fontSize: 10, color: 'var(--text-secondary)' }} title="Bring Front" onClick={e => { e.stopPropagation(); bringToFront(el.id); }}><i className="bi bi-chevron-double-up" /></button>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, fontSize: 10, color: 'var(--text-secondary)' }} title="Send Back" onClick={e => { e.stopPropagation(); sendToBack(el.id); }}><i className="bi bi-chevron-double-down" /></button>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, fontSize: 10, color: 'var(--error)' }} title="Delete" onClick={e => { e.stopPropagation(); deleteElement(el.id); }}><i className="bi bi-trash" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Canvas settings */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Canvas</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
                        <span>Zoom</span><span>{Math.round(canvasScale * 100)}%</span>
                      </div>
                      <input type="range" min="0.5" max="1.5" step="0.1" value={canvasScale} onChange={e => setCanvasScale(parseFloat(e.target.value))} style={{ width: '100%' }} />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
                      <input type="checkbox" checked={showSafe} onChange={e => setShowSafe(e.target.checked)} />
                      Safe Margin Guide
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
                      <input type="checkbox" checked={showBleed} onChange={e => setShowBleed(e.target.checked)} />
                      Bleed Zone Guide
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
                      <input type="checkbox" checked={editorSnapAlign} onChange={e => setEditorSnapAlign(e.target.checked)} />
                      Snap Alignment
                    </label>
                  </div>
                </div>
              </div>

              {/* CENTER: Canvas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                <div style={{
                  width: '100%', background: 'repeating-conic-gradient(#eef0f9 0% 25%, #f7f8fc 0% 50%) 0 0 / 20px 20px',
                  borderRadius: 20, padding: '32px 24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--border-color)', minHeight: 400, overflow: 'hidden',
                }} onClick={() => setSelectedElementId(null)}>
                  <div style={{
                    width: 450, height: 320,
                    background: THEMES.find(t => t.id === selectedTheme)?.bg || '#fff',
                    position: 'relative', boxShadow: '0 12px 40px rgba(23,28,98,0.18)',
                    transform: `scale(${canvasScale})`, transition: 'transform 0.15s',
                    border: '1px solid rgba(0,0,0,0.06)', borderRadius: 4,
                    flexShrink: 0,
                  }}>
                    {/* Overlays */}
                    {showSafe && (
                      <div style={{ position: 'absolute', inset: 16, border: '1px dashed rgba(23,28,98,0.3)', pointerEvents: 'none', zIndex: 1000 }}>
                        <span style={{ position: 'absolute', top: 2, left: 2, background: 'rgba(23,28,98,0.7)', color: '#fff', fontSize: 7, padding: '1px 3px', borderRadius: 2 }}>Safe</span>
                      </div>
                    )}
                    {showBleed && (
                      <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(255,48,76,0.3)', pointerEvents: 'none', zIndex: 1000 }}>
                        <span style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(255,48,76,0.7)', color: '#fff', fontSize: 7, padding: '1px 3px', borderRadius: 2 }}>Bleed</span>
                      </div>
                    )}
                    {editorSnapAlign && selectedElementId && (
                      <>
                        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dotted rgba(23,28,98,0.2)', pointerEvents: 'none', zIndex: 999 }} />
                        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, borderLeft: '1px dotted rgba(23,28,98,0.2)', pointerEvents: 'none', zIndex: 999 }} />
                      </>
                    )}

                    {/* Canvas Elements */}
                    {(Array.isArray(canvasElements) ? canvasElements : []).map(el => {
                      const isSelected = selectedElementId === el.id;
                      const commonStyle: React.CSSProperties = {
                        position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
                        transform: `rotate(${el.rotation}deg)`, zIndex: el.zIndex, opacity: el.opacity,
                        cursor: 'move', border: isSelected ? '2px dashed var(--accent)' : '2px solid transparent',
                        boxSizing: 'border-box',
                      };
                      if (el.type === 'text') return (
                        <div key={el.id} style={{ ...commonStyle, fontFamily: el.fontFamily || 'Inter', fontSize: el.fontSize || 20, color: el.color || '#171c62', textAlign: el.textAlign || 'center', padding: 4, wordBreak: 'break-word', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: el.textAlign === 'left' ? 'flex-start' : el.textAlign === 'right' ? 'flex-end' : 'center' }}
                          onClick={e => { e.stopPropagation(); setSelectedElementId(el.id); }}>
                          {el.text}
                        </div>
                      );
                      if (el.type === 'image') return (
                        <div key={el.id} style={{ ...commonStyle, overflow: 'hidden' }}
                          onClick={e => { e.stopPropagation(); setSelectedElementId(el.id); }}>
                          <img src={el.src} alt="canvas" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: `brightness(${el.brightness ?? 100}%) contrast(${el.contrast ?? 100}%) saturate(${el.saturation ?? 100}%) blur(${el.blur ?? 0}px) sepia(${el.sepia ?? 0}%) ${el.grayscale ? 'grayscale(100%)' : ''}`, transform: `${el.flipX ? 'scaleX(-1)' : ''} ${el.flipY ? 'scaleY(-1)' : ''}` }} />
                        </div>
                      );
                      if (el.type === 'shape') return (
                        <div key={el.id} style={{ ...commonStyle }} onClick={e => { e.stopPropagation(); setSelectedElementId(el.id); }}>
                          <div style={{ width: '100%', height: '100%', background: el.fillColor || '#FF304C', border: `${el.strokeWidth || 1}px solid ${el.strokeColor || '#171c62'}`, borderRadius: el.shapeType === 'circle' ? '50%' : 0 }} />
                        </div>
                      );
                      return null;
                    })}

                    {/* Empty state */}
                    {canvasElements.length === 0 && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(23,28,98,0.3)' }}>
                        <i className="bi bi-palette" style={{ fontSize: 40, marginBottom: 8 }} />
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Add elements using the Tools panel</div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* RIGHT: Inspector */}
              <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, height: '100%', overflowY: 'auto' }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)' }}>Inspector</div>
                {(() => {
                  const el = canvasElements.find(e => e.id === selectedElementId);
                  if (!el) return (
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', padding: '24px 0', textAlign: 'center', fontStyle: 'italic' }}>
                      <i className="bi bi-cursor" style={{ fontSize: 32, display: 'block', marginBottom: 8, opacity: 0.4 }} />
                      Click an element to edit its properties
                    </div>
                  );
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* Position/Size */}
                      {[
                        { label: 'X', key: 'x', min: 0, max: 400, val: el.x },
                        { label: 'Y', key: 'y', min: 0, max: 300, val: el.y },
                        { label: 'Width',  key: 'width',  min: 20, max: 450, val: el.width },
                        { label: 'Height', key: 'height', min: 20, max: 320, val: el.height },
                        { label: 'Rotation', key: 'rotation', min: 0, max: 360, val: el.rotation },
                        { label: 'Opacity', key: 'opacity', min: 0.1, max: 1, step: 0.1, val: el.opacity, display: Math.round(el.opacity * 100) + '%' },
                      ].map(s => (
                        <div key={s.key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</span>
                            <span style={{ color: 'var(--text-tertiary)' }}>{(s as any).display ?? s.val}</span>
                          </div>
                          <input type="range" min={s.min} max={s.max} step={(s as any).step ?? 1} value={s.val}
                            onChange={e => updateElementProps(el.id, { [s.key]: parseFloat(e.target.value) } as any)} style={{ width: '100%' }} />
                        </div>
                      ))}

                      {/* Text props */}
                      {el.type === 'text' && (
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Text</div>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>Content</label>
                            <input type="text" className="input" style={{ marginTop: 4, padding: '6px 8px', fontSize: 12 }} value={el.text || ''} onChange={e => updateElementProps(el.id, { text: e.target.value })} />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>Font</label>
                            <select className="input" style={{ marginTop: 4, padding: '4px 6px', fontSize: 11 }} value={el.fontFamily || 'Inter'} onChange={e => updateElementProps(el.id, { fontFamily: e.target.value })}>
                              <option>Inter</option><option>Arial</option><option>Times New Roman</option><option>Courier New</option><option>Georgia</option>
                            </select>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}><span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Font Size</span><span style={{ color: 'var(--text-tertiary)' }}>{el.fontSize || 20}px</span></div>
                            <input type="range" min="10" max="80" value={el.fontSize || 20} onChange={e => updateElementProps(el.id, { fontSize: parseInt(e.target.value) })} style={{ width: '100%' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>Color</label>
                            <input type="color" style={{ width: '100%', height: 28, border: 'none', cursor: 'pointer', padding: 0, marginTop: 4 }} value={el.color || '#171c62'} onChange={e => updateElementProps(el.id, { color: e.target.value })} />
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {(['left', 'center', 'right'] as const).map(a => (
                              <button key={a} className={`btn btn-sm ${el.textAlign === a ? 'btn-navy' : 'btn-outline'}`} style={{ flex: 1, fontSize: 10 }} onClick={() => updateElementProps(el.id, { textAlign: a })}>
                                <i className={`bi bi-text-${a}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Image filters */}
                      {el.type === 'image' && (
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Image Filters</div>
                          {[
                            { label: 'Brightness', key: 'brightness', min: 50, max: 150, val: el.brightness ?? 100 },
                            { label: 'Contrast',   key: 'contrast',   min: 50, max: 150, val: el.contrast ?? 100 },
                            { label: 'Saturation', key: 'saturation', min: 50, max: 150, val: el.saturation ?? 100 },
                            { label: 'Blur',       key: 'blur',       min: 0,  max: 10,  val: el.blur ?? 0 },
                          ].map(f => (
                            <div key={f.key}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{f.label}</span>
                                <span style={{ color: 'var(--text-tertiary)' }}>{f.val}{f.key === 'blur' ? 'px' : '%'}</span>
                              </div>
                              <input type="range" min={f.min} max={f.max} value={f.val} onChange={e => updateElementProps(el.id, { [f.key]: parseInt(e.target.value) } as any)} style={{ width: '100%' }} />
                            </div>
                          ))}
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <label style={{ fontSize: 11, display: 'flex', gap: 5, cursor: 'pointer', alignItems: 'center' }}>
                              <input type="checkbox" checked={!!el.grayscale} onChange={e => updateElementProps(el.id, { grayscale: e.target.checked })} /> Grayscale
                            </label>
                            <label style={{ fontSize: 11, display: 'flex', gap: 5, cursor: 'pointer', alignItems: 'center' }}>
                              <input type="checkbox" checked={!!el.flipX} onChange={e => updateElementProps(el.id, { flipX: e.target.checked })} /> Flip X
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Shape styling */}
                      {el.type === 'shape' && (
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Shape Style</div>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>Fill Color</label>
                            <input type="color" style={{ width: '100%', height: 28, border: 'none', cursor: 'pointer', padding: 0, marginTop: 4 }} value={el.fillColor || '#FF304C'} onChange={e => updateElementProps(el.id, { fillColor: e.target.value })} />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>Border Color</label>
                            <input type="color" style={{ width: '100%', height: 28, border: 'none', cursor: 'pointer', padding: 0, marginTop: 4 }} value={el.strokeColor || '#171c62'} onChange={e => updateElementProps(el.id, { strokeColor: e.target.value })} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}><span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Border Width</span><span style={{ color: 'var(--text-tertiary)' }}>{el.strokeWidth || 1}px</span></div>
                            <input type="range" min="0" max="10" value={el.strokeWidth || 1} onChange={e => updateElementProps(el.id, { strokeWidth: parseInt(e.target.value) })} style={{ width: '100%' }} />
                          </div>
                        </div>
                      )}

                      {/* Delete */}
                      <button className="btn btn-danger btn-sm" style={{ width: '100%', marginTop: 4 }} onClick={() => deleteElement(el.id)}>
                        <i className="bi bi-trash" /> Delete Element
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            SUBVIEW: ORDER TRACKING
            ================================================================== */}
        {activeSubView === 'tracking' && (
          <div className="flex flex-col gap-6">

            {/* ── PREMIUM SUBMISSION CONFIRMATION ─────────────────────────────── */}
            {submissionDone && (
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: 24, padding: '40px 32px', color: 'var(--primary)', textAlign: 'center',
                position: 'relative', overflow: 'hidden', marginBottom: 8,
              }}>
                {/* Animated circles */}
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} style={{
                      position: 'absolute', borderRadius: '50%',
                      width: `${80 + i * 40}px`, height: `${80 + i * 40}px`,
                      border: '1px solid var(--border-color)',
                      top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      animation: `pulse-ring ${2 + i * 0.3}s infinite`,
                    }} />
                  ))}
                </div>
                {/* Success Icon */}
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'var(--bg-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', fontSize: 36, border: '2px solid var(--border-color)',
                }}>
                  🎉
                </div>
                <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px', color: 'var(--primary)' }}>Design Submitted!</h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                  Your customization for <strong>{submittedOrderId || activeOrder?.product}</strong> has been submitted.
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '0 0 24px' }}>
                  Our design team will review and approve within 24 hours. You'll receive a WhatsApp notification once approved.
                </p>
                {/* Status chips */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
                  <span className="badge badge-success">
                    ✓ Design Saved
                  </span>
                  <span className="badge badge-secondary">
                    📋 Under Admin Review
                  </span>
                  <span className="badge badge-secondary">
                    📱 WhatsApp Alert Queued
                  </span>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" style={{ borderRadius: 99, padding: '10px 22px' }}
                    onClick={() => { setSubmissionDone(false); navTo('dashboard'); }}>
                    <i className="bi bi-grid-1x2" /> Return to Dashboard
                  </button>
                  <button className="btn btn-outline" style={{ borderRadius: 99 }}
                    onClick={() => setSubmissionDone(false)}>
                    <i className="bi bi-geo-alt" /> View Tracking
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <button className="btn btn-outline btn-sm mb-2" onClick={() => navTo('dashboard')}>
                  <i className="bi bi-arrow-left" /> Dashboard
                </button>
                <h1 className="page-heading">Order Tracking</h1>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>Live production status for your purchases.</p>
              </div>
              <div style={{ textAlign: 'right', background: 'var(--bg-tertiary)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Est. Delivery</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>July 4, 2026</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Express Print Processing</div>
              </div>
            </div>

            {/* Order selector */}
            {activeOnly.length > 1 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', alignSelf: 'center' }}>Tracking for:</span>
                {activeOnly.map(o => (
                  <button key={o.id}
                    className={`btn btn-sm ${activeOrder?.id === o.id ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveOrder(o)}>
                    {o.product}
                  </button>
                ))}
              </div>
            )}

            {/* Timeline card */}
            {(() => {
              const order = activeOrder || allOrders[0];
              if (!order) return null;
              const steps = trackingSteps(order);
              const activeIdx = steps.reduce((last, step, idx) => step.done ? idx : last, -1);

              return (
                <div className="card" style={{ padding: '28px 24px', borderRadius: 24 }}>
                  {/* Order meta */}
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Product</div>
                      <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>{order.product}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Order ID</div>
                      <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>Shopify-{order.id}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>SKU</div>
                      <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>{order.sku || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Ordered</div>
                      <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>{order.date}</div>
                    </div>
                  </div>

                  {/* Horizontal timeline */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
                    {steps.map((step, idx) => (
                      <React.Fragment key={step.label}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16, fontWeight: 700, position: 'relative', zIndex: 2, transition: 'all 0.3s',
                            background: step.done ? (idx === activeIdx ? 'var(--accent)' : 'var(--success)') : 'var(--bg-secondary)',
                            border: `2px solid ${step.done ? (idx === activeIdx ? 'var(--accent)' : 'var(--success)') : 'var(--border-color)'}`,
                            color: step.done ? '#fff' : 'var(--text-tertiary)',
                            boxShadow: idx === activeIdx ? '0 0 0 6px rgba(255,48,76,0.15)' : 'none',
                            animation: idx === activeIdx ? 'pulse-ring 2s infinite' : 'none',
                          }}>
                            <i className={`bi ${step.icon}`} style={{ fontSize: 15 }} />
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 600, textAlign: 'center', marginTop: 8, lineHeight: 1.3, color: step.done ? (idx === activeIdx ? 'var(--accent)' : 'var(--success)') : 'var(--text-tertiary)', maxWidth: 72 }}>
                            {step.label}
                          </div>
                        </div>
                        {idx < steps.length - 1 && (
                          <div style={{ flex: 1, height: 2, background: steps[idx + 1].done ? 'var(--success)' : 'var(--border-color)', marginTop: 19, minWidth: 20, transition: 'background 0.3s' }} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Admin feedback */}
                  {order.adminComments && (
                    <div style={{ marginTop: 24, background: 'rgba(255,48,76,0.06)', border: '1px solid rgba(255,48,76,0.15)', borderRadius: 12, padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--error)', textTransform: 'uppercase', marginBottom: 6 }}>
                        <i className="bi bi-exclamation-circle" style={{ marginRight: 6 }} />Admin Revision Requested
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 10px' }}>"{order.adminComments}"</p>
                      <button className="btn btn-primary btn-sm" onClick={() => loadSkuTemplate(order)}>
                        <i className="bi bi-pencil-square" /> Edit Design &amp; Resubmit
                      </button>
                    </div>
                  )}

                  {/* Quick actions */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => loadSkuTemplate(order)}>
                      <i className="bi bi-palette" /> Open Design Lab
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => showToast('Shipment tracking link sent to your WhatsApp!', 'info')}>
                      <i className="bi bi-whatsapp" /> Get Tracking Link
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => showToast('Support ticket opened!', 'success')}>
                      <i className="bi bi-question-circle" /> Contact Support
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ==================================================================
            SUBVIEW: ORDER HISTORY (drafts key)
            ================================================================== */}
        {activeSubView === 'drafts' && (
          <div className="flex flex-col gap-6">
            <div>
              <button className="btn btn-outline btn-sm mb-2" onClick={() => navTo('dashboard')}>
                <i className="bi bi-arrow-left" /> Dashboard
              </button>
              <h1 className="page-heading">Order History</h1>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>Track delivered orders and quickly reorder your favorites.</p>
            </div>

            {/* Delivered orders */}
            {deliveredOrders.length === 0 ? (
              <div className="card" style={{ padding: '40px', borderRadius: 20, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24, color: 'var(--text-tertiary)' }}>
                  <i className="bi bi-box2" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>No Order History</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 300, margin: '0 auto' }}>You have no completed orders yet.</p>
              </div>
            ) : deliveredOrders.map(order => (
              <div key={order.id} className="card" style={{ padding: '20px 24px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ width: 72, height: 72, borderRadius: 12, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'var(--accent)', flexShrink: 0 }}>
                  <i className={`bi ${productIcon(order.productType)}`} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary)', marginBottom: 4 }}>{order.product}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Ref: Shopify-{order.id} · {order.date}</div>
                  <div style={{ marginTop: 6 }}><span className="badge badge-success"><i className="bi bi-house-check" /> Delivered</span></div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => showToast('Invoice PDF downloading...', 'info')}><i className="bi bi-file-earmark-pdf" /> Invoice</button>
                  <button className="btn btn-primary btn-sm" onClick={() => showToast('Reorder added to cart!', 'success')}><i className="bi bi-arrow-repeat" /> Reorder</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================================================================
            SUBVIEW: TEMPLATES GALLERY
            ================================================================== */}
        {activeSubView === 'templates' && (
          <div className="flex flex-col gap-6">
            <div>
              <button className="btn btn-outline btn-sm mb-2" onClick={() => navTo('dashboard')}>
                <i className="bi bi-arrow-left" /> Dashboard
              </button>
              <h1 className="page-heading">Template Gallery</h1>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>Browse curated design templates for your personalized products.</p>
            </div>

            <div className="grid grid-4 gap-4">
              {allTemplates.map(t => (
                <div key={t.id} className="draft-card"
                  onClick={() => { const o = activeOnly.find(ord => ord.productType === t.productType); if (o) loadSkuTemplate(o); else showToast('No active purchase matches this template type.', 'warning'); }}>
                  <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                    <img src={t.thumbnail} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} />
                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                      {t.isPremium && <span className="badge badge-accent" style={{ fontSize: 9 }}>PRO</span>}
                      {t.isDefault && <span className="badge badge-success" style={{ fontSize: 9 }}>Popular</span>}
                    </div>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(23,28,98,0.6) 0%, transparent 50%)', opacity: 0, transition: 'opacity 0.2s' }} className="template-overlay" />
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)', marginBottom: 4 }}>{t.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <span className="badge badge-secondary" style={{ fontSize: 9 }}>{t.productType}</span>
                        {t.category && <span className="badge badge-primary" style={{ fontSize: 9 }}>{t.category}</span>}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{t.usageCount} uses</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================
            SUBVIEW: PROFILE
            ================================================================== */}
        {activeSubView === 'profile' && (
          <div className="flex flex-col gap-6">
            <div>
              <button className="btn btn-outline btn-sm mb-2" onClick={() => navTo('dashboard')}>
                <i className="bi bi-arrow-left" /> Dashboard
              </button>
              <h1 className="page-heading">My Profile</h1>
            </div>

            <div className="card" style={{ padding: 28, borderRadius: 24 }}>
              {/* Profile header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                <div className="avatar" style={{ width: 80, height: 80, fontSize: 28 }}>{initials}</div>
                <div>
                  <h2 style={{ margin: 0, color: 'var(--primary)', fontSize: 22, fontWeight: 800 }}>{customerName}</h2>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>VIP Premium Member · Since Jan 2026</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-success">Active Account</span>
                    <span className="badge badge-accent">750 Points</span>
                    <span className="badge badge-primary">Premium Elite</span>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-2 gap-4">
                <div>
                  <label className="label">Phone Number</label>
                  <input type="text" className="input" readOnly value={allOrders[0]?.phone || '+91 98765 43210'} />
                </div>
                <div>
                  <label className="label">Membership Tier</label>
                  <input type="text" className="input" readOnly value="Premium Elite Gold" />
                </div>
                <div>
                  <label className="label">Loyalty Points</label>
                  <input type="text" className="input" readOnly value="750 Points (Redeemable)" />
                </div>
                <div>
                  <label className="label">Total Orders</label>
                  <input type="text" className="input" readOnly value={`${allOrders.length} Orders Placed`} />
                </div>
              </div>

              {/* Loyalty bar */}
              <div style={{ marginTop: 24, padding: '16px 20px', background: 'var(--primary-soft)', borderRadius: 14, border: '1px solid rgba(23,28,98,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>Loyalty Progress</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>750 / 1000 points to Platinum</div>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: '75%' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>250 more points to unlock Platinum tier with free shipping!</div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            SUBVIEW: SUPPORT
            ================================================================== */}
        {activeSubView === 'support' && (
          <div className="flex flex-col gap-6">
            <div>
              <button className="btn btn-outline btn-sm mb-2" onClick={() => navTo('dashboard')}>
                <i className="bi bi-arrow-left" /> Dashboard
              </button>
              <h1 className="page-heading">Customer Support</h1>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>Get help with your orders, designs, and deliveries.</p>
            </div>

            <div className="grid grid-3 gap-4">
              {[
                { icon: 'bi-whatsapp', title: 'WhatsApp Support', desc: 'Chat with our team instantly via WhatsApp for quick help.', btn: 'Chat Now', color: '#25D366', action: () => showToast('Opening WhatsApp support...', 'info') },
                { icon: 'bi-telephone', title: 'Call Us', desc: 'Speak to a print specialist. Available Mon–Sat, 10am–7pm IST.', btn: 'Call Now', color: 'var(--primary)', action: () => showToast('Call: +91 98765 00000', 'info') },
                { icon: 'bi-envelope', title: 'Email Support', desc: 'Send a detailed query. Replies within 24 hours on business days.', btn: 'Email Us', color: 'var(--accent)', action: () => showToast('Email: support@theprink.in', 'info') },
              ].map(s => (
                <div key={s.title} className="card" style={{ padding: '20px', textAlign: 'center', borderRadius: 20 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: s.color, margin: '0 auto 14px' }}>
                    <i className={`bi ${s.icon}`} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>{s.desc}</div>
                  <button className="btn btn-outline btn-sm" style={{ width: '100%', borderColor: s.color, color: s.color }} onClick={s.action}>{s.btn}</button>
                </div>
              ))}
            </div>

            <div className="grid grid-2 gap-6">
              {/* FAQ */}
              <div className="card" style={{ padding: '24px', borderRadius: 20 }}>
                <h3 style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: 16, fontSize: 16 }}>Frequently Asked Questions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { q: 'How long does design review take?', a: 'Designs are reviewed within 1–2 hours of submission during business hours.' },
                    { q: 'Can I modify after submission?', a: 'Once approved, orders move to print queue. Contact us immediately via WhatsApp for urgent changes.' },
                    { q: 'What DPI is recommended?', a: 'We recommend minimum 300 DPI for best print quality. Low-DPI warnings are shown in your order.' },
                    { q: 'How do I track my delivery?', a: 'Go to Track Order in the sidebar. We also send WhatsApp updates at every stage.' },
                  ].map((faq, i) => (
                    <div key={i} style={{ paddingBottom: 14, borderBottom: i < 3 ? '1px solid var(--border-color)' : 'none' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--primary)', marginBottom: 4 }}>{faq.q}</div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ticket form */}
              <div className="card" style={{ padding: '24px', borderRadius: 20 }}>
                <h3 style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: 16, fontSize: 16 }}>Submit a Support Ticket</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="label">Related Order</label>
                    <select className="input">
                      <option value="">Select order...</option>
                      {allOrders.map(o => <option key={o.id} value={o.id}>Shopify-{o.id} · {o.product}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Issue Type</label>
                    <select className="input">
                      <option>Design Quality</option>
                      <option>Low DPI Warning</option>
                      <option>Shipment Delay</option>
                      <option>Wrong Product</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Describe Your Issue</label>
                    <textarea className="textarea" rows={4} placeholder="Please describe your issue in detail..." />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => showToast('Support ticket created! We\'ll respond within 2 hours.', 'success')}>
                    <i className="bi bi-send" /> Submit Ticket
                  </button>
                </div>
              </div>
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
            <div className="flex align-center justify-between" style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: 700, color: 'var(--primary)', margin: 0, fontSize: '1.1rem' }}>Crop Image</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setCropOpen(false)}><i className="bi bi-x-lg" /></button>
            </div>

            <div className="crop-frame-box" style={{ marginBottom: '1rem', position: 'relative', overflow: 'hidden' }}>
              <img className="crop-img-target" src={cropTarget.src} alt="Crop" style={{ transform: `scale(${cropScale}) rotate(${cropRot}deg)`, transition: 'transform 0.2s', maxWidth: '100%', display: 'block', margin: 'auto' }} />
              <div className="crop-border-mask" style={{ borderRadius: cropMask === 'circle' ? '50%' : cropMask === 'square' ? '4px' : '2px', aspectRatio: cropMask === 'rect' ? '16/9' : '1/1' }} />
            </div>

            <div className="flex gap-2" style={{ marginBottom: '0.75rem' }}>
              {(['circle', 'square', 'rect'] as CropMaskType[]).map(m => (
                <button key={m} className={`btn btn-sm${cropMask === m ? ' btn-navy' : ' btn-outline'}`} style={{ flex: 1, textTransform: 'capitalize' }} onClick={() => setCropMask(m)}>
                  {m === 'circle' && <i className="bi bi-circle" />}
                  {m === 'square' && <i className="bi bi-square" />}
                  {m === 'rect'   && <i className="bi bi-aspect-ratio" />}
                  {m}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2" style={{ marginBottom: '0.75rem' }}>
              <label className="label flex align-center justify-between"><span>Scale</span><span className="text-xs text-muted">{Math.round(cropScale * 100)}%</span></label>
              <input type="range" min="0.5" max="3" step="0.05" value={cropScale} onChange={e => setCropScale(Number(e.target.value))} style={{ width: '100%' }} />
            </div>

            <div className="flex flex-col gap-2" style={{ marginBottom: '1rem' }}>
              <label className="label flex align-center justify-between"><span>Rotation</span><span className="text-xs text-muted">{cropRot}°</span></label>
              <input type="range" min="-180" max="180" step="1" value={cropRot} onChange={e => setCropRot(Number(e.target.value))} style={{ width: '100%' }} />
            </div>

            <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setCropOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { setCropOpen(false); showToast(`Crop applied to ${cropTarget.name}`, 'success'); }}>
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
            <div className="flex align-center justify-between" style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontWeight: 700, color: 'var(--primary)', margin: 0, fontSize: '1.1rem' }}>Confirm Your Order</h2>
              {!placingOrder && <button className="btn btn-outline btn-sm" onClick={() => setConfirmOpen(false)}><i className="bi bi-x-lg" /></button>}
            </div>

            <div className="confirm-modal-steps" style={{ marginBottom: '1.5rem' }}>
              {['Upload', 'Review', 'Confirm', 'Done'].map((step, idx) => (
                <React.Fragment key={step}>
                  <div className={`confirm-step${confirmStep === idx ? ' active' : confirmStep > idx ? ' done' : ''}`}>
                    <div className="confirm-step-dot">
                      {confirmStep > idx ? <i className="bi bi-check-lg" style={{ fontSize: 10 }} /> : idx + 1}
                    </div>
                    <div className="confirm-step-label">{step}</div>
                  </div>
                  {idx < 3 && <div style={{ flex: 1, height: 2, alignSelf: 'flex-start', marginTop: 12, background: confirmStep > idx ? 'var(--accent)' : 'var(--border-color)', transition: 'background 0.3s' }} />}
                </React.Fragment>
              ))}
            </div>

            {confirmStep < 3 ? (
              <>
                <div className="card p-4" style={{ marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--primary)', marginBottom: 12 }}>Order Summary</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <tbody>
                      {[
                        ['Product', <span key="p" className="badge badge-primary">{activeProduct.name}</span>],
                        ['Photos', `${images.length} photo${images.length !== 1 ? 's' : ''}`],
                        ['Message', caption.trim() ? `"${caption.slice(0, 40)}${caption.length > 40 ? '…' : ''}"` : <em key="nc" className="text-muted">No message</em>],
                      ].map(([k, v]) => (
                        <tr key={String(k)}>
                          <td style={{ color: 'var(--text-secondary)', paddingBottom: 8, width: '40%' }}>{k}</td>
                          <td style={{ color: 'var(--primary)', fontWeight: 500, paddingBottom: 8 }}>{v as React.ReactNode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setConfirmOpen(false)} disabled={placingOrder}>Edit</button>
                  <button className="btn btn-primary" disabled={placingOrder} onClick={handlePlaceOrder}>
                    {placingOrder
                      ? <><i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite' }} /> Placing…</>
                      : <><i className="bi bi-bag-check" /> Place Order</>}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'scaleIn 0.4s ease' }}>
                  <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: 32 }} />
                </div>
                <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.3rem', marginBottom: 6 }}>Order Placed! 🎉</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Redirecting to tracking…</div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Optional Customer Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, width: '100%', padding: '24px 28px', borderRadius: 24 }}>
            <div className="flex align-center justify-between" style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: 800, color: 'var(--primary)', margin: 0, fontSize: '1.2rem' }}>Customer Workspace</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setShowLoginModal(false)}><i className="bi bi-x-lg" /></button>
            </div>

            {/* Reuse Tab switcher */}
            <div className="tab-bar" style={{ marginBottom: '1.25rem', display: 'flex', gap: 4, background: 'var(--bg-tertiary)', borderRadius: 10, padding: 2 }}>
              {[
                { id: 'password' as const, label: 'Password' },
                { id: 'otp' as const, label: 'OTP Login' },
                { id: 'register' as const, label: 'Register' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`tab-item ${loginTab === t.id ? 'active' : ''}`}
                  style={{ flex: 1, padding: '8px 12px', fontSize: 11, borderRadius: 8, background: loginTab === t.id ? 'var(--bg-primary)' : 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, color: loginTab === t.id ? 'var(--primary)' : 'var(--text-secondary)' }}
                  onClick={() => setLoginTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB: PASSWORD LOGIN */}
            {loginTab === 'password' && (
              <form onSubmit={async (e) => { await handlePasswordLogin(e); setShowLoginModal(false); }} className="flex flex-col gap-3">
                <div>
                  <label className="label text-xxs font-semibold" htmlFor="login-modal-ident">Email or Mobile Number</label>
                  <input
                    id="login-modal-ident"
                    type="text"
                    className="input"
                    placeholder="Enter email or mobile number"
                    value={emailOrPhone}
                    onChange={e => setEmailOrPhone(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label text-xxs font-semibold" htmlFor="login-modal-pass">Password</label>
                  <input
                    id="login-modal-pass"
                    type="password"
                    className="input"
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
                  <i className="bi bi-box-arrow-in-right" /> Log In
                </button>
              </form>
            )}

            {/* TAB: OTP LOGIN */}
            {loginTab === 'otp' && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="label text-xxs font-semibold" htmlFor="modal-cp-phone">Mobile Number</label>
                  <div className="input-group" style={{ marginBottom: 0, display: 'flex' }}>
                    <select id="modal-cp-country" className="input" value={countryCode}
                      onChange={e => setCountryCode(e.target.value)}
                      style={{ flex: '0 0 96px', borderRight: '1px solid var(--border-color)', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }}>
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+971">🇦🇪 +971</option>
                    </select>
                    <input id="modal-cp-phone" type="tel" className="input" placeholder="Phone number"
                      value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      style={{ flex: 1, borderRadius: '0 var(--radius-md) var(--radius-md) 0' }} />
                  </div>
                </div>

                <button id="modal-cp-otp-btn" className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={async () => { await handleOtpRequest(); setShowLoginModal(false); }}>
                  <i className="bi bi-phone" /> {otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>

                <div className="auth-divider"><span>or continue with</span></div>

                <button id="modal-cp-wa-btn" className="btn btn-outline w-full" style={{ borderColor: '#25D366', color: '#25D366', justifyContent: 'center' }} onClick={async () => { await handleWhatsAppLogin(); setShowLoginModal(false); }}>
                  <i className="bi bi-whatsapp" style={{ fontSize: 18 }} /> Login via WhatsApp
                </button>
              </div>
            )}

            {/* TAB: REGISTER */}
            {loginTab === 'register' && (
              <form onSubmit={async (e) => { await handleRegister(e); setShowLoginModal(false); }} className="flex flex-col gap-3">
                <div>
                  <label className="label text-xxs font-semibold" htmlFor="modal-reg-name">Full Name</label>
                  <input
                    id="modal-reg-name"
                    type="text"
                    className="input"
                    placeholder="E.g. Sarah Connor"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label text-xxs font-semibold" htmlFor="modal-reg-email">Email Address</label>
                  <input
                    id="modal-reg-email"
                    type="email"
                    className="input"
                    placeholder="name@example.com"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label text-xxs font-semibold" htmlFor="modal-reg-phone">Mobile Number</label>
                  <input
                    id="modal-reg-phone"
                    type="tel"
                    className="input"
                    placeholder="E.g. +919876543210"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label text-xxs font-semibold" htmlFor="modal-reg-pass">Create Password</label>
                  <input
                    id="modal-reg-pass"
                    type="password"
                    className="input"
                    placeholder="Create password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
                  <i className="bi bi-person-plus" /> Create Account &amp; Login
                </button>
              </form>
            )}

            <button className="btn btn-secondary btn-sm"
              style={{ width: '100%', marginTop: '1rem', opacity: 0.7, justifyContent: 'center' }}
              onClick={async () => {
                try {
                  const res = await fetch('/api/auth/demo-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'Sarah Connor', phone: '+91 98765 43210', role: 'customer' }),
                  });
                  const data = await res.json();
                  if (res.ok && data.token) {
                    localStorage.setItem('customer_token', data.token);
                    setCustomerName(data.user.name);
                    setAuthView('dashboard');
                    setForceDashboard(true);
                    setShowLoginModal(false);
                  }
                } catch {
                  setShowLoginModal(false);
                }
              }}>
              <i className="bi bi-eye" /> Demo Bypass (Sarah Connor)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}











