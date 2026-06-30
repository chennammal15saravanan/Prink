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
  { id: 'mug',       icon: 'bi-cup-hot',       name: 'Coffee Mug'   },
  { id: 'canvas',    icon: 'bi-image',          name: 'Canvas Print' },
  { id: 'frame',     icon: 'bi-aspect-ratio',   name: 'Photo Frame'  },
  { id: 'calendar',  icon: 'bi-calendar3',      name: 'Calendar'     },
  { id: 'photobook', icon: 'bi-book',           name: 'Photo Book'   },
];

// Rich sample orders for the demo portal
const MOCK_ORDERS: Order[] = [
  {
    id: 'SP-1042',
    customer: 'Sarah Connor',
    product: 'Classic Coffee Mug Wrap',
    productType: 'mug',
    sku: 'PRK-MUG-CLASSIC',
    quantity: 2,
    dpi: '300 DPI',
    dpiStatus: 'ok',
    uploadStatus: 'awaiting',
    customizationStatus: 'pending',
    deliveryStatus: 'pending',
    date: 'Jun 28, 2026',
    phone: '+91 98765 43210',
    adminComments: '',
    images: [],
  },
  {
    id: 'SP-1043',
    customer: 'Sarah Connor',
    product: 'Stretch Canvas 12×16',
    productType: 'canvas',
    sku: 'PRK-CAN-1216',
    quantity: 1,
    dpi: '150 DPI',
    dpiStatus: 'low',
    uploadStatus: 'awaiting',
    customizationStatus: 'in-progress',
    deliveryStatus: 'pending',
    date: 'Jun 29, 2026',
    phone: '+91 98765 43210',
    adminComments: 'Low resolution detected. Please upload a higher-resolution photo (min 300 DPI recommended for best print quality).',
    images: [],
  },
  {
    id: 'SP-1039',
    customer: 'Sarah Connor',
    product: 'Premium Photo Frame 8×10',
    productType: 'frame',
    sku: 'PRK-FRM-810',
    quantity: 1,
    dpi: '300 DPI',
    dpiStatus: 'ok',
    uploadStatus: 'ready',
    customizationStatus: 'completed',
    deliveryStatus: 'delivered',
    date: 'May 10, 2026',
    phone: '+91 98765 43210',
    adminComments: '',
    images: [],
  },
];

// Rich sample templates
const MOCK_TEMPLATES: TemplateItem[] = [
  { id: 'tmpl-1', name: 'Elegant Family Portrait', productType: 'mug',       thumbnail: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?q=80&w=300', usageCount: 142, lastModified: '2026-06-20', tags: ['family', 'classic'], category: 'Trending', isDefault: true, elements: [] },
  { id: 'tmpl-2', name: 'Ocean Memories',          productType: 'canvas',    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=300', usageCount: 89,  lastModified: '2026-06-18', tags: ['ocean', 'travel'],  category: 'Travel',   isPremium: true, elements: [] },
  { id: 'tmpl-3', name: 'Minimalist Monochrome',   productType: 'frame',     thumbnail: 'https://images.unsplash.com/photo-1503455637927-730bce8583c0?q=80&w=300', usageCount: 67,  lastModified: '2026-06-15', tags: ['minimal', 'bw'],   category: 'Modern',   elements: [] },
  { id: 'tmpl-4', name: 'Golden Hour Warmth',      productType: 'mug',       thumbnail: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=300', usageCount: 201, lastModified: '2026-06-22', tags: ['sunset', 'warm'],  category: 'Trending', isPremium: true, elements: [] },
  { id: 'tmpl-5', name: 'Vintage Summer Album',    productType: 'photobook', thumbnail: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=300', usageCount: 34,  lastModified: '2026-06-10', tags: ['vintage', 'summer'],category: 'Seasonal',elements: [] },
  { id: 'tmpl-6', name: 'Bold Typography',         productType: 'canvas',    thumbnail: 'https://images.unsplash.com/photo-1530099486328-e021101a494a?q=80&w=300', usageCount: 56,  lastModified: '2026-06-17', tags: ['text', 'bold'],    category: 'Modern',   elements: [] },
];

const MOCK_SKU_MAPPINGS: SkuMapping[] = [
  { sku: 'PRK-MUG-CLASSIC', templateId: 'tmpl-1', productType: 'mug' },
  { sku: 'PRK-CAN-1216',    templateId: 'tmpl-2', productType: 'canvas' },
  { sku: 'PRK-FRM-810',     templateId: 'tmpl-3', productType: 'frame' },
  { sku: 'PRK-ALB-ROSE',    templateId: 'tmpl-5', productType: 'photobook' },
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
  initialSubView = 'dashboard',
}: CustomerPortalProps) {
  const { showToast } = useToast();

  // ── Auth state ──────────────────────────────────────────────────────────────
  const [authView, setAuthView]       = useState<'login' | 'dashboard'>(() =>
    localStorage.getItem('customer_token') ? 'dashboard' : 'login'
  );
  const [phone, setPhone]             = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpSent, setOtpSent]         = useState(false);
  const [customerName, setCustomerName] = useState(() => {
    try {
      const t = localStorage.getItem('customer_token');
      if (t && t !== 'demo-bypass-token') {
        const payload = JSON.parse(atob(t.split('.')[1]));
        return payload.name || 'Guest';
      }
    } catch {}
    return 'Guest';
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
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [dragIndex, setDragIndex]           = useState<number | null>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const MAX_CAPTION = 200;

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

  // ── Derived ─────────────────────────────────────────────────────────────────
  const activeTheme   = THEMES.find(t => t.id === selectedTheme)   ?? THEMES[0];
  const activeProduct = PRODUCTS.find(p => p.id === selectedProduct) ?? PRODUCTS[0];

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchActiveOrder = useCallback(async () => {
    try {
      const token = localStorage.getItem('customer_token');
      if (!token) return;

      // If token is clearly not a JWT, use mock data
      if (!token.includes('.') || token.split('.').length !== 3) {
        setOrders(MOCK_ORDERS);
        setActiveOrder(MOCK_ORDERS[0]);
        setSelectedProduct(MOCK_ORDERS[0].productType);
        setTemplates(MOCK_TEMPLATES);
        setSkuMappings(MOCK_SKU_MAPPINGS);
        return;
      }

      const resOrders = await fetch('/api/customer/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resOrders.ok) {
        const list = await resOrders.json();
        setOrders(list);
        if (list.length > 0) {
          setActiveOrder(list[0]);
          if (list[0].productType) setSelectedProduct(list[0].productType);
          // Sync customer name from order
          if (list[0].customer) setCustomerName(list[0].customer);
        }
      } else {
        // Fall back to mock data on 403/401
        setOrders(MOCK_ORDERS);
        setActiveOrder(MOCK_ORDERS[0]);
        setSelectedProduct(MOCK_ORDERS[0].productType);
      }

      const resTemplates = await fetch('/api/templates');
      if (resTemplates.ok) setTemplates(await resTemplates.json());
      else setTemplates(MOCK_TEMPLATES);

      const resMappings = await fetch('/api/sku-mappings');
      if (resMappings.ok) setSkuMappings(await resMappings.json());
      else setSkuMappings(MOCK_SKU_MAPPINGS);
    } catch (err) {
      console.error('Failed to fetch customer data:', err);
      setOrders(MOCK_ORDERS);
      setActiveOrder(MOCK_ORDERS[0]);
      setTemplates(MOCK_TEMPLATES);
      setSkuMappings(MOCK_SKU_MAPPINGS);
    }
  }, []);

  useEffect(() => {
    if (authView === 'dashboard') {
      fetchActiveOrder();
      // Sync customerName from stored token
      try {
        const t = localStorage.getItem('customer_token');
        if (t && t !== 'demo-bypass-token') {
          const parts = t.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.name) setCustomerName(payload.name);
          }
        }
      } catch {}
    }
  }, [authView, fetchActiveOrder]);

  // Suppress unused-var warnings
  useEffect(() => { void (zoom); void (rotation); void (comparing); void (uploadMethod); }, []);

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

  const loadSkuTemplate = (order: Order) => {
    setActiveOrder(order);
    setSelectedProduct(order.productType);
    setSkuLoading(true);

    // Show SKU detection animation briefly
    setTimeout(() => {
      setSkuLoading(false);

      if (order.designData) {
        try {
          const saved = JSON.parse(order.designData);
          setCanvasElements(saved);
          setUndoStack([]); setRedoStack([]); setSelectedElementId(null);
          showToast('Restored saved design draft!', 'success');
          setSubView('editor');
          setMobileNavOpen(false);
          return;
        } catch {}
      }

      const allTemplates = templates.length > 0 ? templates : MOCK_TEMPLATES;
      const allMappings  = skuMappings.length > 0 ? skuMappings : MOCK_SKU_MAPPINGS;

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
      const res = await fetch(`/api/orders/${encodeURIComponent(activeOrder.id)}/design`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ designData: JSON.stringify(canvasElements), customizationStatus: 'in-progress' }),
      });
      if (res.ok) { showToast('Design draft saved!', 'success'); fetchActiveOrder(); }
      else showToast('Failed to save draft.', 'error');
    } catch { showToast('Network error.', 'error'); }
  };

  const submitDesign = async () => {
    if (!activeOrder) return;
    try {
      const token = localStorage.getItem('customer_token');
      // Attempt server submit
      if (token && token.includes('.') && token.split('.').length === 3) {
        const res = await fetch(`/api/orders/${encodeURIComponent(activeOrder.id)}/design`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            designData: JSON.stringify(canvasElements),
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

  const handleMethodClick = (method: UploadMethod) => {
    setUploadMethod(method);
    if (method === 'file')   fileInputRef.current?.click();
    if (method === 'camera') cameraInputRef.current?.click();
    if (method === 'cloud')  showToast('Cloud integrations coming soon!', 'info');
  };

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
      await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: selectedProduct, theme: selectedTheme, imageCount: images.length, caption }),
      });
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

  const allOrders   = orders.length > 0 ? orders : MOCK_ORDERS;
  const allTemplates = templates.length > 0 ? templates : MOCK_TEMPLATES;
  const activeOnly  = allOrders.filter(o => o.deliveryStatus !== 'delivered');
  const deliveredOrders = allOrders.filter(o => o.deliveryStatus === 'delivered');

  const filteredOrders = ordersFilter === 'all'       ? allOrders
    : ordersFilter === 'active'    ? activeOnly
    : ordersFilter === 'completed' ? allOrders.filter(o => o.customizationStatus === 'completed')
    : deliveredOrders;

  const initials = (customerName || 'GU').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);


  // ===========================================================================
  // ── LOGIN VIEW ──────────────────────────────────────────────────────────────
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
            const vr = await fetch('/api/auth/otp-verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone: `${countryCode}${phone}`, code: entered }),
            });
            const vd = await vr.json();
            if (vr.ok && vd.success) {
              localStorage.setItem('customer_token', vd.token);
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
        localStorage.setItem('customer_token', data.token);
        showToast('WhatsApp login sent!', 'success');
        setTimeout(() => setAuthView('dashboard'), 1200);
      } else {
        showToast('WhatsApp login failed.', 'error');
      }
    } catch { showToast('WhatsApp login failed.', 'error'); }
  }, [phone, countryCode, showToast]);

  if (authView === 'login') {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-brand-display" style={{ marginBottom: 20 }}>
            <img src={logoBlack} alt="the Prink" style={{ height: 52, width: 'auto' }} />
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, marginBottom: '1.5rem' }}>
            Your premium personalized-print workspace
          </p>

          <div className="flex flex-col gap-3">
            <label className="label" htmlFor="cp-phone">Phone Number</label>
            <div className="input-group" style={{ marginBottom: 0, display: 'flex' }}>
              <select id="cp-country" className="input" value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                style={{ flex: '0 0 96px', borderRight: '1px solid var(--border-color)', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }}>
                <option value="+91">🇮🇳 +91</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+61">🇦🇺 +61</option>
                <option value="+971">🇦🇪 +971</option>
              </select>
              <input id="cp-phone" type="tel" className="input" placeholder="Phone number"
                value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                style={{ flex: 1, borderRadius: '0 var(--radius-md) var(--radius-md) 0' }} />
            </div>

            <button id="cp-otp-btn" className="btn btn-primary" style={{ width: '100%' }} onClick={handleOtpRequest}>
              <i className="bi bi-phone" /> {otpSent ? 'Resend OTP' : 'Send OTP'}
            </button>

            <div className="auth-divider"><span>or continue with</span></div>

            <button id="cp-wa-btn" className="btn btn-outline" style={{ width: '100%', borderColor: '#25D366', color: '#25D366' }} onClick={handleWhatsAppLogin}>
              <i className="bi bi-whatsapp" style={{ fontSize: 18 }} /> Login via WhatsApp
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', marginTop: '1.5rem' }}>
            By continuing, you agree to our{' '}
            <a href="#" style={{ color: 'var(--primary)' }}>Terms</a> &amp;{' '}
            <a href="#" style={{ color: 'var(--primary)' }}>Privacy Policy</a>.
          </p>

          <button className="btn btn-secondary btn-sm"
            style={{ width: '100%', marginTop: '0.75rem', opacity: 0.7 }}
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
                } else {
                  // Fallback: just set a flag and use mock data
                  localStorage.setItem('customer_token', 'fallback');
                  setAuthView('dashboard');
                }
              } catch {
                localStorage.setItem('customer_token', 'fallback');
                setAuthView('dashboard');
              }
            }}>
            <i className="bi bi-eye" /> Demo — Skip to Dashboard
          </button>
        </div>

        <div style={{ textAlign: 'center', opacity: 0.7, marginTop: 12 }}>
          <img src={websiteLogo} alt="the Prink" style={{ height: 22, width: 'auto' }} />
        </div>
      </div>
    );
  }

  // ===========================================================================
  // ── SIDEBAR NAV ITEMS ───────────────────────────────────────────────────────
  // ===========================================================================

  const NAV_ITEMS: { key: CustomerSubView; icon: string; label: string; badge?: string }[] = [
    { key: 'dashboard', icon: 'bi-grid-1x2',          label: 'Dashboard'  },
    { key: 'upload',    icon: 'bi-bag-check',          label: 'My Orders', badge: String(activeOnly.length) },
    { key: 'preview',   icon: 'bi-cloud-upload-fill',  label: 'Upload Photos' },
    { key: 'editor',    icon: 'bi-palette',            label: 'Design Lab'  },
    { key: 'tracking',  icon: 'bi-geo-alt',            label: 'Track Order' },
    { key: 'drafts',    icon: 'bi-clock-history',      label: 'Order History' },
    { key: 'templates', icon: 'bi-layout-text-window', label: 'Templates'   },
    { key: 'profile',   icon: 'bi-person-circle',      label: 'My Profile'  },
    { key: 'support',   icon: 'bi-question-circle',    label: 'Support'     },
  ];

  const navTo = (key: CustomerSubView) => { setSubView(key); setMobileNavOpen(false); };

  // ===========================================================================
  // ── HELPER: Product icon by type ────────────────────────────────────────────
  // ===========================================================================
  const productIcon = (type: ProductType) => {
    const map: Record<ProductType, string> = {
      mug: 'bi-cup-hot', canvas: 'bi-image', frame: 'bi-aspect-ratio',
      calendar: 'bi-calendar3', photobook: 'bi-book',
    };
    return map[type] || 'bi-box';
  };

  const customizationBadge = (order: Order) => {
    if (order.customizationStatus === 'completed')    return <span className="badge badge-success"><i className="bi bi-check-circle" /> Design Submitted</span>;
    if (order.customizationStatus === 'in-progress')  return <span className="badge badge-accent"><i className="bi bi-palette" /> Editing Draft</span>;
    return <span className="badge badge-warning"><i className="bi bi-hourglass-split" /> Awaiting Design</span>;
  };

  const deliveryBadge = (order: Order) => {
    if (order.deliveryStatus === 'delivered') return <span className="badge badge-success">Delivered</span>;
    if (order.deliveryStatus === 'shipped')   return <span className="badge badge-primary">Shipped</span>;
    return <span className="badge badge-secondary">Pending</span>;
  };

  const orderProgress = (order: Order) => {
    let step = 0;
    if (order.customizationStatus === 'in-progress') step = 1;
    if (order.customizationStatus === 'completed')   step = 3;
    if (order.uploadStatus === 'ready')              step = 4;
    if (order.deliveryStatus === 'shipped')          step = 5;
    if (order.deliveryStatus === 'delivered')        step = 7;
    return Math.round((step / 7) * 100);
  };

  // ===========================================================================
  // ── TRACKING STEPS ──────────────────────────────────────────────────────────
  // ===========================================================================
  const trackingSteps = (order: Order) => [
    { label: 'Order Synced',    icon: 'bi-bag',             done: true },
    { label: 'Design Started',  icon: 'bi-pencil',          done: order.customizationStatus !== 'pending' },
    { label: 'Design Submitted',icon: 'bi-send',            done: order.customizationStatus === 'completed' },
    { label: 'Admin Approved',  icon: 'bi-shield-check',    done: order.uploadStatus === 'ready' },
    { label: 'In Print Queue',  icon: 'bi-printer',         done: order.uploadStatus === 'ready' },
    { label: 'Packed',          icon: 'bi-box-seam',        done: order.deliveryStatus === 'shipped' || order.deliveryStatus === 'delivered' },
    { label: 'Shipped',         icon: 'bi-truck',           done: order.deliveryStatus === 'shipped' || order.deliveryStatus === 'delivered' },
    { label: 'Delivered',       icon: 'bi-house-check',     done: order.deliveryStatus === 'delivered' },
  ];

  // ===========================================================================
  // ── PORTAL LAYOUT ───────────────────────────────────────────────────────────
  // ===========================================================================

  return (
    <div className="portal-layout" style={{ position: 'relative' }}>
      {/* Hidden file inputs */}
      <input ref={fileInputRef}   type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFileChange} />

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
      <aside className={`portal-sidebar${mobileNavOpen ? ' mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo-area">
          <img src={mainLogo} alt="the Prink" style={{ height: 38, width: 'auto' }} />
        </div>

        {/* User card */}
        <div style={{ margin: '12px 12px 4px', padding: '14px', background: 'linear-gradient(135deg, rgba(23,28,98,0.06) 0%, rgba(255,48,76,0.04) 100%)', borderRadius: 16, border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar" style={{ width: 40, height: 40, fontSize: 14 }}>{initials}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)', lineHeight: 1.2 }}>{customerName}</div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>VIP Premium Member</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <span className="badge badge-success" style={{ fontSize: 9 }}>Active</span>
            <span className="badge badge-primary" style={{ fontSize: 9 }}>{activeOnly.length} Active Orders</span>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: '0 8px', flex: 1, overflowY: 'auto' }}>
          <div className="sidebar-section-label">Navigation</div>
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              id={`nav-${item.key}`}
              className={`sidebar-item${subView === item.key ? ' active' : ''}`}
              onClick={() => navTo(item.key)}
            >
              <i className={`bi ${item.icon}`} />
              <span>{item.label}</span>
              {item.badge && item.badge !== '0' && (
                <span style={{ marginLeft: 'auto', background: subView === item.key ? 'rgba(255,255,255,0.25)' : 'var(--accent)', color: '#fff', borderRadius: 99, fontSize: 9, fontWeight: 700, padding: '2px 6px', minWidth: 18, textAlign: 'center' }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Logout */}
        <div style={{ padding: '12px 8px 16px' }}>
          <button className="sidebar-item" style={{ color: 'var(--error)', width: '100%' }}
            onClick={() => { localStorage.removeItem('customer_token'); setAuthView('login'); setOtpSent(false); }}>
            <i className="bi bi-box-arrow-left" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ====================================================================
          MAIN CONTENT
          ==================================================================== */}
      <main className="portal-content">
        {/* Mobile top bar */}
        <div style={{ display: 'none' }} className="show-mobile-flex" id="mobile-topbar">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                id="mobile-menu-btn"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--primary)', padding: 4 }}>
                <i className={`bi ${mobileNavOpen ? 'bi-x-lg' : 'bi-list'}`} />
              </button>
              <img src={mainLogo} alt="Prink" style={{ height: 28, width: 'auto' }} />
            </div>
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{initials}</div>
          </div>
        </div>

        {/* Mobile hamburger (always visible) */}
        <button
          className="mobile-menu-btn"
          style={{ position: 'fixed', top: 10, left: 10, zIndex: 300, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, width: 40, height: 40, display: 'none', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--primary)', fontSize: 20, boxShadow: 'var(--shadow-sm)' }}
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          id="hamburger-btn">
          <i className={`bi ${mobileNavOpen ? 'bi-x-lg' : 'bi-list'}`} />
        </button>

        {/* ==================================================================
            SUBVIEW: DASHBOARD
            ================================================================== */}
        {subView === 'dashboard' && (
          <div className="flex flex-col gap-6">
            {/* Hero Banner */}
            <div className="portal-hero-banner">
              <div style={{ position: 'relative', zIndex: 2 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0fbe88', display: 'inline-block', animation: 'pulse-ring 2s infinite' }} />
                  Shopify Sync — Live
                </span>
                <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 800, margin: '0 0 8px', color: '#fff', lineHeight: 1.2 }}>
                  Welcome back, {customerName.split(' ')[0]}! 👋
                </h1>
                <p style={{ opacity: 0.9, fontSize: 14, margin: '0 0 20px', lineHeight: 1.6, maxWidth: 500 }}>
                  You have <strong>{activeOnly.length} active order{activeOnly.length !== 1 ? 's' : ''}</strong> in production. Open the Customization Studio to personalize your prints.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn" style={{ background: '#fff', color: 'var(--primary)', fontWeight: 700, borderRadius: 99, padding: '9px 20px', fontSize: 13 }}
                    onClick={() => navTo('upload')}>
                    <i className="bi bi-bag-check" /> View My Orders
                  </button>
                  <button className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff', borderRadius: 99 }}
                    onClick={() => navTo('preview')}>
                    <i className="bi bi-cloud-upload" /> Upload Photos
                  </button>
                </div>
              </div>
              {/* Floating sync card */}
              <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', borderRadius: 16, padding: '14px 18px', fontSize: 11, color: '#fff', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }} className="hide-mobile">
                <div style={{ fontWeight: 700, fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Last Sync</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Just now</div>
                <div style={{ opacity: 0.75, fontSize: 10 }}>All orders updated</div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-4 gap-4">
              {[
                { label: 'Active Orders',   value: String(activeOnly.length),  icon: 'bi-box-seam',     color: '#171C62' },
                { label: 'In Design',       value: String(allOrders.filter(o => o.customizationStatus === 'in-progress').length), icon: 'bi-palette', color: '#FF304C' },
                { label: 'Under Review',    value: String(allOrders.filter(o => o.customizationStatus === 'completed' && o.uploadStatus !== 'ready').length), icon: 'bi-shield-check', color: '#0fbe88' },
                { label: 'Loyalty Points',  value: '750 pts',                  icon: 'bi-trophy',       color: '#f59e0b' },
              ].map((stat, i) => (
                <div key={i} className="card p-4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: `${stat.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: stat.color, flexShrink: 0 }}>
                    <i className={`bi ${stat.icon}`} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main 2-column */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: '1.5rem', alignItems: 'start' }} className="responsive-two-col">
              {/* Active Orders */}
              <div className="flex flex-col gap-4">
                <div className="flex align-center justify-between">
                  <h2 className="section-title" style={{ margin: 0 }}>Active Shopify Purchases</h2>
                  <button className="btn btn-outline btn-sm" onClick={() => navTo('upload')}>
                    View All <i className="bi bi-arrow-right" />
                  </button>
                </div>

                {activeOnly.length === 0 ? (
                  <div className="card p-8" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <i className="bi bi-bag-x" style={{ fontSize: 40, opacity: 0.3, display: 'block', marginBottom: 12 }} />
                    <div style={{ fontWeight: 600 }}>No active orders</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Visit your Shopify store to place a new order</div>
                  </div>
                ) : activeOnly.map(order => {
                  const pct = orderProgress(order);
                  const isInProgress = order.customizationStatus === 'in-progress';
                  const isCompleted  = order.customizationStatus === 'completed';

                  return (
                    <div key={order.id} className="card" style={{ padding: '20px', borderRadius: 20, border: '1px solid var(--border-color)' }}>
                      {/* Header row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'var(--accent)', flexShrink: 0 }}>
                            <i className={`bi ${productIcon(order.productType)}`} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15, lineHeight: 1.3 }}>{order.product}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>
                              SKU: <strong style={{ color: 'var(--text-secondary)' }}>{order.sku || 'N/A'}</strong>  ·  Qty: {order.quantity || 1}  ·  {order.date}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Ref: Shopify-{order.id}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          {customizationBadge(order)}
                          <span className="badge badge-primary"><i className="bi bi-wallet2" style={{ marginRight: 3 }} />Paid</span>
                        </div>
                      </div>

                      {/* DPI Warning */}
                      {order.dpiStatus === 'low' && (
                        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '8px 12px', marginBottom: 14, fontSize: 11, color: '#b45309', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <i className="bi bi-exclamation-triangle" />
                          <span>Low resolution image detected ({order.dpi}). Higher quality recommended.</span>
                        </div>
                      )}

                      {/* Progress bar */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                          <span>Fulfillment Progress</span>
                          <span style={{ color: 'var(--accent)' }}>{pct}% Complete</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-tertiary)', marginTop: 4 }}>
                          <span>Ordered</span><span>Drafted</span><span>Submitted</span><span>Approved</span><span>Printing</span><span>Shipped</span><span>Delivered</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => { setActiveOrder(order); navTo('tracking'); }}>
                          <i className="bi bi-geo-alt" /> Track
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => { setActiveOrder(order); navTo('preview'); }}>
                          <i className="bi bi-cloud-upload" /> Upload
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => loadSkuTemplate(order)}>
                          <i className={`bi ${isCompleted ? 'bi-eye' : 'bi-palette'}`} />
                          {isCompleted ? 'View Design' : isInProgress ? 'Resume Lab' : 'Customize'}
                        </button>
                      </div>

                      {/* Admin revision feedback */}
                      {order.adminComments && (
                        <div style={{ marginTop: 12, background: 'rgba(255,48,76,0.05)', border: '1px solid rgba(255,48,76,0.15)', borderRadius: 10, padding: '10px 14px' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--error)', textTransform: 'uppercase', marginBottom: 4 }}>
                            <i className="bi bi-exclamation-circle" style={{ marginRight: 4 }} />Admin Feedback
                          </div>
                          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>{order.adminComments}</p>
                          <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => loadSkuTemplate(order)}>
                            <i className="bi bi-pencil-square" /> Edit &amp; Resubmit
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Right sidebar: activity + templates */}
              <div className="flex flex-col gap-4">
                {/* Activity Feed */}
                <div className="card" style={{ padding: 20, borderRadius: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Live Activity
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0fbe88', display: 'inline-block', animation: 'pulse-ring 2s infinite' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { time: 'Just now',    type: 'upload', text: 'Shopify order SP-1043 synced to portal.' },
                      { time: '1 hour ago',  type: 'order',  text: 'Canvas design draft saved automatically.' },
                      { time: 'Yesterday',   type: 'print',  text: 'Photo Frame SP-1039 delivered successfully.' },
                      { time: '2 days ago',  type: 'system', text: 'Earned 150 loyalty points on last order.' },
                      { time: '3 days ago',  type: 'upload', text: 'Uploaded 3 high-resolution photos.' },
                    ].map((act, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', paddingBottom: 10, borderBottom: i < 4 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: act.type === 'upload' ? 'var(--accent)' : act.type === 'print' ? 'var(--success)' : act.type === 'order' ? 'var(--primary)' : '#94a3b8', marginTop: 4, flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{act.text}</p>
                          <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{act.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Templates */}
                <div className="card" style={{ padding: 20, borderRadius: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 14 }}>Popular Templates</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {allTemplates.slice(0, 3).map(t => (
                      <div key={t.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px', borderRadius: 10, transition: 'background 0.2s' }}
                        onClick={() => { const o = activeOnly.find(ord => ord.productType === t.productType); if (o) loadSkuTemplate(o); else showToast('No active purchase for this template type.', 'warning'); }}>
                        <img src={t.thumbnail} alt={t.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{t.usageCount} uses · {t.productType}</div>
                        </div>
                        {t.isPremium && <span className="badge badge-accent" style={{ fontSize: 9 }}>PRO</span>}
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 10 }} onClick={() => navTo('templates')}>
                    View All Templates
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            SUBVIEW: MY ORDERS (upload key)
            ================================================================== */}
        {subView === 'upload' && (
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
                      {/* Product icon */}
                      <div style={{ width: 72, height: 72, borderRadius: 18, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'var(--accent)', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                        <i className={`bi ${productIcon(order.productType)}`} />
                      </div>

                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>{order.product}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>
                              SKU: <strong style={{ color: 'var(--primary-light)' }}>{order.sku || '—'}</strong>  ·  Qty: {order.quantity || 1}  ·  Ordered: {order.date}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {customizationBadge(order)}
                            {deliveryBadge(order)}
                          </div>
                        </div>

                        {/* DPI status */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                          <span className={`badge ${order.dpiStatus === 'ok' ? 'badge-success' : order.dpiStatus === 'low' ? 'badge-warning' : 'badge-error'}`}>
                            <i className={`bi ${order.dpiStatus === 'ok' ? 'bi-check-circle' : 'bi-exclamation-triangle'}`} />
                            {order.dpi} {order.dpiStatus === 'ok' ? '✓' : '⚠'}
                          </span>
                          <span className="badge badge-primary"><i className="bi bi-wallet2" /> Paid</span>
                          <span className="badge badge-secondary">Ref: Shopify-{order.id}</span>
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
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
        {subView === 'preview' && (
          <div className="flex flex-col gap-6">
            <div>
              <button className="btn btn-outline btn-sm mb-2" onClick={() => navTo('dashboard')}>
                <i className="bi bi-arrow-left" /> Dashboard
              </button>
              <h1 className="page-heading">Upload Photos</h1>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
                Upload your photos — we'll use them to personalize your custom prints.
              </p>
            </div>

            {/* Upload target indicator */}
            {activeOrder && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--primary-soft)', borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(23,28,98,0.12)' }}>
                <i className="bi bi-info-circle" style={{ color: 'var(--primary)', fontSize: 16, flexShrink: 0 }} />
                <div style={{ fontSize: 12 }}>
                  Uploading photos for: <strong style={{ color: 'var(--primary)' }}>{activeOrder.product}</strong> (SKU: {activeOrder.sku})
                </div>
              </div>
            )}

            {/* Upload method selector */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Upload Method</div>
              <div className="upload-method-pills">
                {([
                  { method: 'file'   as UploadMethod, icon: 'bi-folder2-open', label: 'From Device' },
                  { method: 'camera' as UploadMethod, icon: 'bi-camera',       label: 'Camera' },
                  { method: 'cloud'  as UploadMethod, icon: 'bi-cloud-arrow-up',label: 'Cloud Drive' },
                ]).map(m => (
                  <button key={m.method} className={`upload-method-pill${uploadMethod === m.method ? ' active' : ''}`}
                    onClick={() => handleMethodClick(m.method)}>
                    <i className={`bi ${m.icon}`} /> {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Drop Zone */}
            <div
              className={`upload-zone${dragOver ? ' drag-over' : ''}`}
              style={{ cursor: 'pointer', padding: '40px 24px' }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}>
              <i className="upload-icon bi bi-cloud-upload" />
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)', marginBottom: 6 }}>Drop photos here or click to browse</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Supports JPG, PNG, HEIC, WEBP · Max 20MB per file · Min 300 DPI recommended</div>
            </div>

            {/* Photo Gallery */}
            {images.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>Your Photos ({images.length})</div>
                  <button className="btn btn-outline btn-sm" onClick={() => showToast('All photos cleared.', 'info')}>
                    <i className="bi bi-trash" /> Clear All
                  </button>
                </div>
                <div className="preview-grid">
                  {images.map((img, idx) => (
                    <div
                      key={img.id}
                      className="preview-card"
                      draggable
                      onDragStart={e => handleDragStart(e, idx)}
                      onDrop={e => handleDropCard(e, idx)}
                      onDragOver={e => e.preventDefault()}>
                      <img src={img.src} alt={img.name} />
                      {/* Upload progress */}
                      {uploadProgress[img.id] !== undefined && uploadProgress[img.id] < 100 && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 }}>
                          <div style={{ width: `${uploadProgress[img.id]}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.15s' }} />
                        </div>
                      )}
                      <div className="preview-card-overlay">
                        <button className="preview-card-btn" title="Crop" onClick={e => { e.stopPropagation(); openCrop(img); }}>
                          <i className="bi bi-crop" />
                        </button>
                        <button className="preview-card-btn" title="Remove" onClick={e => { e.stopPropagation(); removeImage(img.id); }}>
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Caption */}
            <div>
              <label className="label">Personalization Message (Optional)</label>
              <textarea
                className="textarea"
                rows={3}
                maxLength={MAX_CAPTION}
                placeholder="E.g. 'Happy Birthday Mom! With love, Sarah' — this will be included on your product."
                value={caption}
                onChange={e => setCaption(e.target.value)}
              />
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4, textAlign: 'right' }}>
                {caption.length}/{MAX_CAPTION} characters
              </div>
            </div>

            {/* ── Live Product Preview ─────────────────────────────────────────── */}
            {(livePreviewPhoto || images.length > 0) && (
              <div className="card" style={{ padding: 20, borderRadius: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0fbe88', display: 'inline-block', animation: 'pulse-ring 2s infinite' }} />
                    Live Preview — {activeOrder?.product || 'Your Product'}
                  </div>
                  <span className="badge badge-success" style={{ fontSize: 10 }}>Auto-generated</span>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Product Mockup */}
                  {activeOrder?.productType === 'mug' && (
                    <div style={{ position: 'relative', width: 200, height: 180 }}>
                      <div style={{
                        width: '100%', height: '100%', borderRadius: '50% 50% 40% 40% / 20% 20% 40% 40%',
                        background: 'linear-gradient(135deg, #f0f0f0 0%, #d8d8d8 100%)',
                        boxShadow: '4px 4px 20px rgba(0,0,0,0.15), inset -3px 0 12px rgba(0,0,0,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                        position: 'relative',
                      }}>
                        <img
                          src={livePreviewPhoto || images[0]?.src}
                          alt="preview"
                          style={{ width: '75%', height: '70%', objectFit: 'cover', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
                        />
                        {/* Mug handle */}
                        <div style={{ position: 'absolute', right: -14, top: '30%', width: 22, height: 50, border: '6px solid #ccc', borderLeft: 'none', borderRadius: '0 50% 50% 0' }} />
                      </div>
                      <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-tertiary)', marginTop: 6 }}>Coffee Mug Wrap</div>
                    </div>
                  )}
                  {(activeOrder?.productType === 'canvas' || activeOrder?.productType === 'frame') && (
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: 200, height: 160, borderRadius: 4,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.2), inset 0 0 0 8px #c8a96e, inset 0 0 0 12px #b8955a',
                        overflow: 'hidden', position: 'relative',
                      }}>
                        <img src={livePreviewPhoto || images[0]?.src} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-tertiary)', marginTop: 6 }}>
                        {activeOrder?.productType === 'frame' ? 'Photo Frame' : 'Canvas Print'}
                      </div>
                    </div>
                  )}
                  {(!activeOrder?.productType || activeOrder.productType === 'calendar' || activeOrder.productType === 'photobook') && (
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: 160, height: 200, borderRadius: 8,
                        background: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', overflow: 'hidden',
                        border: '1px solid var(--border-color)',
                      }}>
                        <img src={livePreviewPhoto || images[0]?.src} alt="preview" style={{ width: '100%', height: '75%', objectFit: 'cover' }} />
                        <div style={{ padding: 8, fontSize: 11, fontWeight: 700, color: 'var(--primary)', textAlign: 'center' }}>
                          {caption || 'Your Text Here'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-tertiary)', marginTop: 6 }}>
                        {activeOrder?.productType === 'calendar' ? 'Wall Calendar' : 'Photo Book'}
                      </div>
                    </div>
                  )}
                  {/* Photo counter */}
                  <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 12 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Photos Added</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)' }}>{images.length}</div>
                    </div>
                    {activeOrder && (
                      <div style={{ background: 'rgba(23,28,98,0.04)', borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>SKU Loaded</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{activeOrder.sku || 'N/A'}</div>
                      </div>
                    )}
                    <button className="btn btn-primary btn-sm" onClick={() => activeOrder && loadSkuTemplate(activeOrder)}>
                      <i className="bi bi-palette" /> Open Design Lab
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={() => { setActiveOrder(null); setSubView('dashboard'); }}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { showToast(`${images.length} photos saved for your order!`, 'success'); navTo('upload'); }}>
                <i className="bi bi-check-circle" /> Save Photos &amp; Continue
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================
            SUBVIEW: DESIGN LAB (CANVAS EDITOR)
            ================================================================== */}
        {subView === 'editor' && (
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
                    {canvasElements.map(el => {
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

                {/* Theme bar */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {THEMES.map(t => (
                    <button key={t.id} title={t.name}
                      onClick={() => setSelectedTheme(t.id)}
                      style={{ width: 28, height: 28, borderRadius: '50%', backgroundImage: `linear-gradient(135deg, ${t.preview[0]}, ${t.preview[1]})`, border: selectedTheme === t.id ? '3px solid var(--accent)' : '2px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s', transform: selectedTheme === t.id ? 'scale(1.2)' : 'scale(1)' }} />
                  ))}
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
        {subView === 'tracking' && (
          <div className="flex flex-col gap-6">

            {/* ── PREMIUM SUBMISSION CONFIRMATION ─────────────────────────────── */}
            {submissionDone && (
              <div style={{
                background: 'linear-gradient(135deg, #171C62 0%, #2d3282 50%, #FF304C 100%)',
                borderRadius: 24, padding: '40px 32px', color: '#fff', textAlign: 'center',
                position: 'relative', overflow: 'hidden', marginBottom: 8,
              }}>
                {/* Animated circles */}
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} style={{
                      position: 'absolute', borderRadius: '50%',
                      width: `${80 + i * 40}px`, height: `${80 + i * 40}px`,
                      border: '1px solid rgba(255,255,255,0.08)',
                      top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      animation: `pulse-ring ${2 + i * 0.3}s infinite`,
                    }} />
                  ))}
                </div>
                {/* Success Icon */}
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', fontSize: 36, border: '2px solid rgba(255,255,255,0.3)',
                }}>
                  🎉
                </div>
                <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px' }}>Design Submitted!</h2>
                <p style={{ opacity: 0.85, fontSize: 14, margin: '0 0 6px' }}>
                  Your customization for <strong>{submittedOrderId || activeOrder?.product}</strong> has been submitted.
                </p>
                <p style={{ opacity: 0.7, fontSize: 12, margin: '0 0 24px' }}>
                  Our design team will review and approve within 24 hours. You'll receive a WhatsApp notification once approved.
                </p>
                {/* Status chips */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
                  <span style={{ background: 'rgba(15,190,136,0.25)', borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 700, border: '1px solid rgba(15,190,136,0.4)' }}>
                    ✓ Design Saved
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 700, border: '1px solid rgba(255,255,255,0.2)' }}>
                    📋 Under Admin Review
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 700, border: '1px solid rgba(255,255,255,0.2)' }}>
                    📱 WhatsApp Alert Queued
                  </span>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn" style={{ background: '#fff', color: 'var(--primary)', fontWeight: 700, borderRadius: 99, padding: '10px 22px' }}
                    onClick={() => { setSubmissionDone(false); navTo('dashboard'); }}>
                    <i className="bi bi-grid-1x2" /> Return to Dashboard
                  </button>
                  <button className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff', borderRadius: 99 }}
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
              <div style={{ textAlign: 'right', background: 'var(--accent-light)', borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(255,48,76,0.15)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Est. Delivery</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>July 4, 2026</div>
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
              const order = activeOrder || allOrders[0] || MOCK_ORDERS[0];
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
        {subView === 'drafts' && (
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
              <>
                {/* Show mock delivered history */}
                {[
                  { id: 'SP-1039', product: 'Premium Photo Frame 8×10', productType: 'frame' as ProductType, date: 'May 10, 2026', total: '₹899', thumb: 'https://images.unsplash.com/photo-1503455637927-730bce8583c0?q=80&w=150', rating: 5 },
                  { id: 'SP-1035', product: 'Classic Coffee Mug Wrap', productType: 'mug'   as ProductType, date: 'Apr 24, 2026', total: '₹449', thumb: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?q=80&w=150', rating: 5 },
                  { id: 'SP-1031', product: 'Stretch Canvas 12×16',    productType: 'canvas'as ProductType, date: 'Mar 12, 2026', total: '₹1,299', thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=150', rating: 4 },
                ].map(h => (
                  <div key={h.id} className="card" style={{ padding: '20px 24px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <img src={h.thumb} alt={h.product} style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--border-color)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary)', marginBottom: 4 }}>{h.product}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>Order: Shopify-{h.id} · Delivered: {h.date}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="badge badge-success"><i className="bi bi-house-check" /> Delivered</span>
                        <span style={{ fontSize: 11 }}>{'★'.repeat(h.rating)}{'☆'.repeat(5 - h.rating)}</span>
                        <strong style={{ fontSize: 13, color: 'var(--primary)' }}>{h.total}</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => showToast('Invoice PDF downloading...', 'info')}>
                        <i className="bi bi-file-earmark-pdf" /> Invoice
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => showToast('Design downloaded!', 'info')}>
                        <i className="bi bi-download" /> Design
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => showToast('Reorder added to cart!', 'success')}>
                        <i className="bi bi-arrow-repeat" /> Reorder
                      </button>
                    </div>
                  </div>
                ))}
              </>
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
        {subView === 'templates' && (
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
        {subView === 'profile' && (
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
        {subView === 'support' && (
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
                        ['Theme', activeTheme.name],
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
    </div>
  );
}
