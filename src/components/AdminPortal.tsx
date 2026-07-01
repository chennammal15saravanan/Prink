import React, { useEffect, useState, useRef } from 'react';
import type { Order, AdminSection, ActivityLog, TemplateItem, PrinterQueueItem, ProductType, SkuMapping, CanvasElement } from '../types';
import { useToast } from '../context/ToastContext';
import logoBlack from '../assets/logos/logo-black.png';
import whiteLogo from '../assets/logos/white-logo.png';
import websiteLogo from '../assets/logos/website-logo.png';


// ─── Seed Data ───────────────────────────────────────────────────────────────

const INITIAL_ORDERS: Order[] = [
  { id: '#1042', customer: 'John Doe',    product: 'Coffee Mug Wrap',      productType: 'mug',      dpi: '300 DPI',  dpiStatus: 'ok',   uploadStatus: 'ready',    date: 'Jun 16, 2026', phone: '+91 98765 43210' },
  { id: '#1043', customer: 'Jane Smith',  product: 'Stretch Canvas 12×16', productType: 'canvas',   dpi: '150 DPI',  dpiStatus: 'low',  uploadStatus: 'awaiting', date: 'Jun 16, 2026', phone: '+91 87654 32109' },
  { id: '#1044', customer: 'Robert Lee',  product: 'Stretch Canvas 12×16', productType: 'canvas',   dpi: '300 DPI',  dpiStatus: 'ok',   uploadStatus: 'ready',    date: 'Jun 15, 2026', phone: '+91 76543 21098' },
  { id: '#1045', customer: 'Emily Davis', product: 'Coffee Mug Wrap',      productType: 'mug',      dpi: 'No Image', dpiStatus: 'none', uploadStatus: 'pending',  date: 'Jun 15, 2026', phone: '+91 65432 10987' },
  { id: '#1046', customer: 'Priya Singh', product: 'Photo Frame 8×10',     productType: 'frame',    dpi: '300 DPI',  dpiStatus: 'ok',   uploadStatus: 'ready',    date: 'Jun 14, 2026', phone: '+91 54321 09876' },
  { id: '#1047', customer: 'Ravi Kumar',  product: 'Wall Calendar 2027',   productType: 'calendar', dpi: '72 DPI',   dpiStatus: 'low',  uploadStatus: 'awaiting', date: 'Jun 14, 2026', phone: '+91 43210 98765' },
];

const ACTIVITY_LOG: ActivityLog[] = [
  { id: 'a1', action: 'New order #1048 synced from Shopify',    user: 'System',     timestamp: '2 min ago',  type: 'order'  },
  { id: 'a2', action: 'Jane Smith uploaded 3 photos for #1043', user: 'Jane Smith', timestamp: '14 min ago', type: 'upload' },
  { id: 'a3', action: 'Order #1042 PDF generated and queued',   user: 'Automation', timestamp: '28 min ago', type: 'print'  },
  { id: 'a4', action: 'AI upscaler processed #1047 to 300 DPI', user: 'AI Engine',  timestamp: '45 min ago', type: 'system' },
  { id: 'a5', action: 'Order #1044 routed to Printer Operator', user: 'Admin',      timestamp: '1 hr ago',   type: 'print'  },
  { id: 'a6', action: 'New Shopify webhook connected',           user: 'System',     timestamp: '2 hrs ago',  type: 'system' },
];

const TEMPLATES: TemplateItem[] = [
  { id: 't1', name: 'Classic Mug Wrap',     productType: 'mug',       thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200', usageCount: 142, lastModified: 'Jun 15, 2026', tags: ['popular']  },
  { id: 't2', name: 'Ocean Canvas',         productType: 'canvas',    thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200', usageCount: 98,  lastModified: 'Jun 12, 2026', tags: ['new']      },
  { id: 't3', name: 'Portrait Frame',       productType: 'frame',     thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200', usageCount: 67,  lastModified: 'Jun 10, 2026', tags: []           },
  { id: 't4', name: '2027 Family Calendar', productType: 'calendar',  thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=200', usageCount: 34,  lastModified: 'Jun 8, 2026',  tags: ['seasonal'] },
  { id: 't5', name: 'Rose Photo Book',      productType: 'photobook', thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=200', usageCount: 23,  lastModified: 'Jun 5, 2026',  tags: []           },
];

const INITIAL_QUEUE: PrinterQueueItem[] = [
  { id: '#1042', customer: 'John Doe',    product: 'Coffee Mug (11oz)', trimSize: '8.5"×3.0"',    status: 'print-ready', priority: 'high',   assignedAt: '09:15 AM' },
  { id: '#1044', customer: 'Robert Lee',  product: 'Canvas 12×16',      trimSize: '12.25"×16.25"', status: 'processing',  priority: 'normal', assignedAt: '09:45 AM' },
  { id: '#1046', customer: 'Priya Singh', product: 'Photo Frame 8×10',  trimSize: '8.25"×10.25"',  status: 'pending',     priority: 'low',    assignedAt: '10:00 AM' },
];

const SECTIONS: { id: AdminSection; icon: string; label: string }[] = [
  { id: 'overview',   icon: 'bi-grid-1x2',            label: 'Overview'       },
  { id: 'orders',     icon: 'bi-cart3',               label: 'Orders'         },
  { id: 'monitor',    icon: 'bi-activity',            label: 'Upload Monitor' },
  { id: 'templates',  icon: 'bi-file-earmark-image',  label: 'Templates'      },
  { id: 'sku-mappings', icon: 'bi-tags-fill',          label: 'SKU Mapping Rules' },
  { id: 'queue',      icon: 'bi-printer',             label: 'Print Queue'    },
  { id: 'reports',    icon: 'bi-graph-up',            label: 'Reports'        },
  { id: 'workflow',   icon: 'bi-diagram-3-fill',      label: 'Workflow Pipeline' },
  { id: 'settings',   icon: 'bi-gear',               label: 'Settings'       },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminPortalProps {
  initialState?: 'login' | 'dashboard';
  onRouteToPrinter?: (order: Order) => void;
}

// ─── Helper Badge Renderers ────────────────────────────────────────────────────

function dpiStatusBadge(status: string, label: string) {
  if (status === 'ok')   return <span className="badge badge-success">{label}</span>;
  if (status === 'low')  return <span className="badge badge-warning">{label}</span>;
  return                         <span className="badge badge-error">{label}</span>;
}

function uploadStatusBadge(status: string) {
  const map: Record<string, string> = {
    ready:    'badge-success',
    awaiting: 'badge-warning',
    pending:  'badge-error',
  };
  const labels: Record<string, string> = {
    ready:    'Ready',
    awaiting: 'Awaiting Upload',
    pending:  'Pending',
  };
  return <span className={`badge ${map[status] ?? 'badge-primary'}`}>{labels[status] ?? status}</span>;
}

function StatusChip({ status }: { status: PrinterQueueItem['status'] }) {
  const label: Record<typeof status, string> = {
    pending:      'Pending',
    processing:   'Processing',
    'print-ready':'Print Ready',
    completed:    'Completed',
  };
  return <span className={`status-chip ${status}`}>{label[status]}</span>;
}

function PriorityBadge({ priority }: { priority: PrinterQueueItem['priority'] }) {
  return <span className={`priority-badge ${priority}`}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>;
}

// ─── Inline SVG Line Chart ─────────────────────────────────────────────────────

function LineChart() {
  const data = [38, 52, 45, 61, 72, 58, 84, 91, 75, 88, 102, 127];
  const months = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'];
  const max = 140;
  const w = 600; const h = 160; const pad = 30;
  const xs = data.map((_, i) => pad + (i / (data.length - 1)) * (w - 2 * pad));
  const ys = data.map(v => h - pad - (v / max) * (h - 2 * pad));
  const polyline = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  const area = `${xs[0]},${h - pad} ` + xs.map((x, i) => `${x},${ys[i]}`).join(' ') + ` ${xs[xs.length - 1]},${h - pad}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#171C62" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#171C62" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#chartGrad)" />
      <polyline points={polyline} fill="none" stroke="#171C62" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {xs.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={ys[i]} r="4" fill="#171C62" stroke="#fff" strokeWidth="2" />
          <text x={x} y={h - 6} textAnchor="middle" fontSize="9" fill="#888">{months[i]}</text>
        </g>
      ))}
      {[0, 50, 100].map(v => {
        const y = h - pad - (v / max) * (h - 2 * pad);
        return (
          <g key={v}>
            <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
            <text x={pad - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#aaa">{v}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────

const AdminPortal: React.FC<AdminPortalProps> = ({ onRouteToPrinter }) => {
  const { showToast } = useToast();

  // Auth
  const [screen, setScreen] = useState<'login' | 'dashboard'>(() => {
    return localStorage.getItem('admin_token') ? 'dashboard' : 'login';
  });
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard
  const [section, setSection] = useState<AdminSection>('overview');

  // Orders
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderTab, setOrderTab] = useState<'all' | 'ready' | 'awaiting' | 'pending'>('all');

  // Templates
  const [templateSearch, setTemplateSearch] = useState('');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  // Print Queue
  const [printQueue, setPrintQueue] = useState<PrinterQueueItem[]>(INITIAL_QUEUE);
  const [queueTab, setQueueTab] = useState<'all' | PrinterQueueItem['status']>('all');

  // Settings toggles
  const [toggles, setToggles] = useState({
    whatsapp: true,
    email: true,
    lowDpi: true,
    dailySummary: false,
    autoUpscale: true,
  });
  const [dpiThreshold, setDpiThreshold] = useState(300);
  const [maxFileMB, setMaxFileMB] = useState(20);

  // Upscaler
  const [upscalerRunning, setUpscalerRunning] = useState(false);

  // Sidebar collapsed (mobile)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

  // SKU Mappings States
  const [skuMappings, setSkuMappings] = useState<SkuMapping[]>([]);
  const [showSkuModal, setShowSkuModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<Partial<SkuMapping> | null>(null);

  // Database Templates States
  const [dbTemplates, setDbTemplates] = useState<TemplateItem[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<TemplateItem> | null>(null);

  // Review states
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
  const [reviewComments, setReviewComments] = useState('');

  // Workflow Pipeline simulation states
  const [selectedWorkflowStep, setSelectedWorkflowStep] = useState(0);
  const [workflowLogs, setWorkflowLogs] = useState<Array<{ id: string; time: string; type: 'system'|'success'|'error'|'info'; text: string }>>([
    { id: '1', time: '16:00:00', type: 'system', text: "System Workflow initialized." },
    { id: '2', time: '16:00:05', type: 'success', text: "S3 Connection verified: Bucket 'theprink-assets' accessible." },
    { id: '3', time: '16:00:10', type: 'info', text: "WhatsApp Webhook Listener active on port 5000." },
    { id: '4', time: '16:00:12', type: 'success', text: "Shopify API connection established. Sync token verified." }
  ]);
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);
  const [isSimulatingWhatsApp, setIsSimulatingWhatsApp] = useState(false);
  const [isSimulatingOptimize, setIsSimulatingOptimize] = useState(false);
  const [isSimulatingPDF, setIsSimulatingPDF] = useState(false);
  const [s3Health, setS3Health] = useState<'idle' | 'checking' | 'healthy'>('idle');

  // Sync state changes to Header drawer navigation
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('portal-state-change', { detail: { page: section } }));
  }, [section]);

  // Listen to navigation events from Header drawer navigation
  useEffect(() => {
    const handleNav = (e: any) => {
      if (e.detail && e.detail.page) {
        const validSections = ['overview', 'orders', 'monitor', 'templates', 'queue', 'reports', 'workflow', 'settings'];
        if (validSections.includes(e.detail.page)) {
          setSection(e.detail.page as AdminSection);
        }
      }
    };
    window.addEventListener('portal-navigate', handleNav);
    return () => window.removeEventListener('portal-navigate', handleNav);
  }, []);

  const simulateWebhook = async () => {
    setIsSimulatingWebhook(true);
    const newLog = (type: 'system' | 'success' | 'info' | 'error', text: string) => {
      setWorkflowLogs(prev => [
        ...prev,
        { id: Math.random().toString(), time: new Date().toLocaleTimeString(), type, text }
      ]);
    };
    newLog('info', "Triggering sample Shopify webhook with demo order payload...");
    try {
      const res = await fetch('/api/shopify/mock-webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        newLog('success', `MongoDB record created: Order ${data.order?.id} (${data.order?.customer})`);
        newLog('success', `SKU detected: ${data.order?.sku || 'N/A'} → ${data.order?.productType} editor`);
        newLog('info', `WhatsApp link generated: ${data.whatsapp?.uploadLink || 'N/A'}`);
        showToast(`Mock Shopify Order ${data.order?.id} created for ${data.order?.customer}! WhatsApp link ready.`, 'success');
        await fetchOrders();
      } else {
        throw new Error('Server returned error');
      }
    } catch {
      // Fallback: local simulation
      const SAMPLE_PRODUCTS = [
        { product: 'Classic Coffee Mug Wrap', productType: 'mug' as ProductType, sku: 'MUG-CLASSIC' },
        { product: 'Stretch Canvas 12×16', productType: 'canvas' as ProductType, sku: 'CANVAS-12X16' },
        { product: 'Premium Photo Frame 8×10', productType: 'frame' as ProductType, sku: 'FRAME-8X10' },
      ];
      const SAMPLE_NAMES = ['Sarah Connor', 'Priya Sharma', 'Rahul Mehta', 'Ananya Patel'];
      const sample = SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)];
      const name = SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
      const newOrderNum = 1048 + Math.floor(Math.random() * 500);
      const newOrder: Order = {
        id: `SP-${newOrderNum}`,
        customer: name,
        product: sample.product,
        productType: sample.productType,
        sku: sample.sku,
        dpi: 'No Image',
        dpiStatus: 'none',
        uploadStatus: 'pending',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        phone: '+91 98765 43210'
      };
      setOrders(prev => [newOrder, ...prev]);
      newLog('success', `[Offline Mode] Created local record for Order ${newOrder.id} (${newOrder.customer})`);
      showToast(`Demo Order ${newOrder.id} simulated for ${newOrder.customer}!`, 'success');
    }
    setIsSimulatingWebhook(false);
  };

  const simulateWhatsApp = () => {
    setIsSimulatingWhatsApp(true);
    const newLog = (type: 'system' | 'success' | 'info' | 'error', text: string) => {
      setWorkflowLogs(prev => [
        ...prev,
        { id: Math.random().toString(), time: new Date().toLocaleTimeString(), type, text }
      ]);
    };
    newLog('info', "Sending secure upload link payload to WhatsApp Gateway...");
    setTimeout(() => {
      newLog('success', "WhatsApp Message sent successfully. Status: DELIVERED.");
      showToast("WhatsApp alert simulated successfully!", "success");
      setIsSimulatingWhatsApp(false);
    }, 1200);
  };

  const runS3Check = () => {
    setS3Health('checking');
    const newLog = (type: 'system' | 'success' | 'info' | 'error', text: string) => {
      setWorkflowLogs(prev => [
        ...prev,
        { id: Math.random().toString(), time: new Date().toLocaleTimeString(), type, text }
      ]);
    };
    newLog('system', "Checking AWS S3 bucket connectivity...");
    setTimeout(() => {
      setS3Health('healthy');
      newLog('success', "AWS S3 Ping: Healthy. Region: ap-south-1. Active uploads: 12.");
      showToast("AWS S3 check completed: Active and Healthy", "success");
    }, 1000);
  };

  const simulateOptimization = () => {
    setIsSimulatingOptimize(true);
    const newLog = (type: 'system' | 'success' | 'info' | 'error', text: string) => {
      setWorkflowLogs(prev => [
        ...prev,
        { id: Math.random().toString(), time: new Date().toLocaleTimeString(), type, text }
      ]);
    };
    newLog('info', "Loading target image 'Sarah_Cover.heic' into sharp buffer...");
    setTimeout(() => {
      newLog('system', "Applying crop filter: 3000x2000 -> 1200x800. DPI: 300.");
      setTimeout(() => {
        newLog('success', "sharp Optimization complete: Saved 4.2MB (Compressed to 1.1MB JPEG).");
        showToast("sharp image compression simulated!", "success");
        setIsSimulatingOptimize(false);
      }, 800);
    }, 800);
  };

  const simulatePDFKit = () => {
    setIsSimulatingPDF(true);
    const newLog = (type: 'system' | 'success' | 'info' | 'error', text: string) => {
      setWorkflowLogs(prev => [
        ...prev,
        { id: Math.random().toString(), time: new Date().toLocaleTimeString(), type, text }
      ]);
    };
    newLog('info', "Compiling high-resolution vector layers in PDFKit...");
    setTimeout(() => {
      newLog('system', "Drawing bleed margins (0.125\") and crop crosshairs...");
      setTimeout(() => {
        newLog('success', "PDF compilation complete: Generated CMYK ISO Coated v2 PDF/X-1a format.");
        showToast("PDFKit PDF generation simulated!", "success");
        setIsSimulatingPDF(false);
      }, 900);
    }, 900);
  };


  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (screen === 'login') emailRef.current?.focus();
  }, [screen]);

  // ── Persistent Data Fetchers ────────────────────────────────────────────────
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('admin_token');
        setScreen('login');
        showToast('Session expired. Please log in again.', 'error');
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/printer/queue', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPrintQueue(data);
      }
    } catch (err) {
      console.error('Failed to fetch print queue:', err);
    }
  };

  const fetchSkuMappings = async () => {
    try {
      const res = await fetch('/api/sku-mappings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSkuMappings(data);
      }
    } catch (err) {
      console.error('Failed to fetch SKU mappings:', err);
    }
  };

  const fetchDbTemplates = async () => {
    try {
      const res = await fetch('/api/templates', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDbTemplates(data);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  // ── fetchSettings ────────────────────────────────────────────────────────────
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setToggles({
          whatsapp:     data.whatsappEnabled     ?? true,
          email:        data.emailEnabled         ?? true,
          lowDpi:       data.lowDpiAlertsEnabled  ?? true,
          dailySummary: data.dailySummaryEnabled  ?? false,
          autoUpscale:  data.autoUpscaleEnabled   ?? true,
        });
        if (data.dpiThreshold) setDpiThreshold(data.dpiThreshold);
        if (data.maxFileMB)    setMaxFileMB(data.maxFileMB);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const saveSkuMapping = async () => {
    if (!editingMapping?.sku || !editingMapping?.productType) {
      showToast('SKU and Product Type are required.', 'warning');
      return;
    }
    try {
      const isNew = !editingMapping.id;
      const url = isNew ? '/api/sku-mappings' : `/api/sku-mappings/${editingMapping.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(editingMapping)
      });
      if (res.ok) {
        showToast(`SKU Mapping ${isNew ? 'created' : 'updated'} successfully!`, 'success');
        setShowSkuModal(false);
        fetchSkuMappings();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save SKU mapping.', 'error');
      }
    } catch (err) {
      console.error('Error saving SKU mapping:', err);
    }
  };

  const deleteSkuMapping = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SKU mapping?')) return;
    try {
      const res = await fetch(`/api/sku-mappings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      });
      if (res.ok) {
        showToast('SKU Mapping deleted.', 'success');
        fetchSkuMappings();
      }
    } catch (err) {
      console.error('Error deleting SKU mapping:', err);
    }
  };

  const saveTemplate = async () => {
    if (!editingTemplate?.name || !editingTemplate?.productType) {
      showToast('Name and Product Type are required.', 'warning');
      return;
    }
    try {
      const isNew = !editingTemplate.id;
      const url = isNew ? '/api/templates' : `/api/templates/${editingTemplate.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(editingTemplate)
      });
      if (res.ok) {
        showToast(`Template ${isNew ? 'created' : 'updated'} successfully!`, 'success');
        setShowTemplateModal(false);
        fetchDbTemplates();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save template.', 'error');
      }
    } catch (err) {
      console.error('Error saving template:', err);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      });
      if (res.ok) {
        showToast('Template deleted.', 'success');
        fetchDbTemplates();
      }
    } catch (err) {
      console.error('Error deleting template:', err);
    }
  };

  const duplicateTemplate = async (template: TemplateItem) => {
    try {
      const duplicated: Partial<TemplateItem> = {
        name: `${template.name} (Copy)`,
        productType: template.productType,
        category: template.category || 'mug',
        thumbnail: template.thumbnail,
        tags: [...(template.tags || []), 'duplicated'],
        elements: template.elements || []
      };
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(duplicated)
      });
      if (res.ok) {
        showToast('Template duplicated successfully!', 'success');
        fetchDbTemplates();
      } else {
        showToast('Failed to duplicate template.', 'error');
      }
    } catch (err) {
      console.error('Error duplicating template:', err);
    }
  };


  const handleReviewDecision = async (action: 'approve' | 'reject' | 'request_reupload') => {
    if (!reviewingOrder) return;
    try {
      const res = await fetch(`/api/orders/${reviewingOrder.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ action, comments: reviewComments })
      });
      if (res.ok) {
        let msg = 'Design approved and enqueued into Printer Queue!';
        if (action === 'request_reupload') msg = 'Re-upload request sent to customer.';
        else if (action === 'reject') msg = 'Design rejected. Customer asked to make corrections.';
        
        showToast(msg, action === 'approve' ? 'success' : 'warning');
        setReviewingOrder(null);
        setReviewComments('');
        fetchOrders();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to submit review decision.', 'error');
      }
    } catch (err) {
      console.error('Error submitting review decision:', err);
    }
  };

  useEffect(() => {
    if (screen === 'dashboard') {
      fetchOrders();
      fetchQueue();
      fetchSettings();
      fetchSkuMappings();
      fetchDbTemplates();
    }
  }, [screen]);

  // ── Auth ──────────────────────────────────────────────────────────────────────
  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) { setLoginErr('Please enter email and password.'); return; }
    setLoginErr('');
    setLoggingIn(true);
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setLoggingIn(false);
      if (res.ok && data.success) {
        localStorage.setItem('admin_token', data.token);
        setScreen('dashboard');
        showToast('Welcome back, Admin!', 'success');
      } else {
        setLoginErr(data.error || 'Invalid credentials. Try admin@theprink.com / prink123');
      }
    } catch (err) {
      setLoggingIn(false);
      setLoginErr('Unable to reach server. Please try again.');
    }
  };

  // ── Admin Functions ───────────────────────────────────────────────────────────
  const runUpscaler = async () => {
    if (upscalerRunning) return;
    setUpscalerRunning(true);
    showToast('AI Upscaler started — processing low-DPI images…', 'info');
    
    const lowDpiOrders = orders.filter(o => o.dpiStatus === 'low');
    let upscaledCount = 0;
    
    for (const order of lowDpiOrders) {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}/upscale`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          }
        });
        if (res.ok) {
          upscaledCount++;
        }
      } catch (err) {
        console.error('Upscale failed for:', order.id, err);
      }
    }
    
    setUpscalerRunning(false);
    if (upscaledCount > 0) {
      showToast(`AI Upscaler complete — ${upscaledCount} images upscaled to 300 DPI (AI↑)`, 'success');
      fetchOrders();
    } else {
      showToast('No low-DPI images found to upscale.', 'warning');
    }
  };

  const sendWhatsApp = async (id: string, customer: string) => {
    showToast(`Sending WhatsApp upload link to ${customer}…`, 'info');
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}/notify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      if (res.ok) {
        showToast(`Upload link sent to ${customer} for order ${id}`, 'success');
      } else {
        showToast('Failed to dispatch alert.', 'error');
      }
    } catch (err) {
      showToast('Error dispatching WhatsApp reminder.', 'error');
    }
  };

  const forceApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}/force-approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      if (res.ok) {
        showToast(`Order ${id} force-approved and marked as ready`, 'warning');
        fetchOrders();
      } else {
        showToast('Failed to force approve order.', 'error');
      }
    } catch (err) {
      showToast('Error sending approval request.', 'error');
    }
  };

  const routeToPrinter = async (order: Order) => {
    showToast(`Routing order ${order.id} to Printer Operator…`, 'info');
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}/route-to-printer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      if (res.ok) {
        showToast(`Order ${order.id} sent to print queue`, 'success');
        onRouteToPrinter?.(order);
        fetchOrders();
        fetchQueue();
      } else {
        showToast('Failed to route order to print queue.', 'error');
      }
    } catch (err) {
      showToast('Error routing order.', 'error');
    }
  };

  const markComplete = (id: string) => {
    setPrintQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'completed' } : q));
    showToast(`Order ${id} marked as completed`, 'success');
  };

  const saveSettings = () => showToast('Settings saved successfully', 'success');
  const syncShopify  = () => showToast('Shopify sync started…', 'info');
  const genAllPDFs   = () => showToast('Generating PDFs for all ready orders…', 'info');
  const exportReport = () => showToast('Exporting report as CSV…', 'info');

  // ── Derived ───────────────────────────────────────────────────────────────────
  const filteredOrders = orders
    .filter(o => orderTab === 'all' || o.uploadStatus === orderTab)
    .filter(o =>
      orderSearch.trim() === '' ||
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.product.toLowerCase().includes(orderSearch.toLowerCase())
    );

  const filteredTemplates = TEMPLATES.filter(t =>
    templateSearch.trim() === '' ||
    t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    t.productType.toLowerCase().includes(templateSearch.toLowerCase())
  );

  const filteredQueue = printQueue.filter(q => queueTab === 'all' || q.status === queueTab);

  const readyCount    = orders.filter(o => o.uploadStatus === 'ready').length;
  const awaitingCount = orders.filter(o => o.uploadStatus === 'awaiting').length;
  const pendingCount  = orders.filter(o => o.uploadStatus === 'pending').length;

  const activityDotColor = (type: ActivityLog['type']) => {
    const map = { order: 'order', upload: 'upload', print: 'print', system: 'system' };
    return map[type] ?? 'system';
  };

  // ── LOGIN SCREEN ──────────────────────────────────────────────────────────────
  if (screen === 'login') {
    return (
      <div className="admin-split-layout">
        {/* Left – Form */}
        <div className="admin-split-left">
          <div className="admin-login-form-wrap">
            <div className="admin-login-logo" style={{ marginBottom: '20px' }}>
              <img src={logoBlack} alt="the Prink Logo" style={{ height: '48px', width: 'auto', display: 'block' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>
              Admin Portal
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.875rem' }}>
              Sign in to access the dashboard
            </p>
            <form onSubmit={handleLogin} autoComplete="off">
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="label" htmlFor="admin-email">Email Address</label>
                <input
                  id="admin-email"
                  ref={emailRef}
                  className="input"
                  type="email"
                  placeholder="admin@theprink.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label className="label" htmlFor="admin-password">Password</label>
                <input
                  id="admin-password"
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
                id="admin-login-btn"
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 1rem' }}
                disabled={loggingIn}
              >
                {loggingIn
                  ? <><i className="bi bi-arrow-repeat spin" style={{ marginRight: '0.5rem' }} />Signing in…</>
                  : <><i className="bi bi-shield-lock-fill" style={{ marginRight: '0.5rem' }} />Access Dashboard</>
                }
              </button>
            </form>
            <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', marginBottom: '2rem' }}>
              Demo: admin@theprink.com / prink123
            </p>
            <div style={{ textAlign: 'center', opacity: 0.5 }}>
              <img src={websiteLogo} alt="the Prink Website Logo" style={{ height: '22px', width: 'auto', display: 'inline-block' }} />
            </div>
          </div>
        </div>

        {/* Right – Feature Panel */}
        <div className="admin-split-right">
          <div className="admin-split-right-content">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(255,255,255,0.15)', borderRadius: '20px',
              padding: '0.375rem 0.875rem', marginBottom: '2rem'
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>All Systems Operational</span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '0.75rem' }}>
              Production Command Centre
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
              Manage orders, monitor uploads, control print queues — all from a single intelligent dashboard.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: 'bi-arrow-repeat',         text: 'Live Shopify order sync'          },
                { icon: 'bi-stars',                text: 'AI-powered DPI upscaler'          },
                { icon: 'bi-printer-fill',         text: 'One-click PDF routing to printer' },
                { icon: 'bi-graph-up-arrow',       text: 'Revenue & fulfillment analytics'  },
                { icon: 'bi-whatsapp',             text: 'WhatsApp upload reminders'        },
              ].map(f => (
                <li key={f.icon} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <span style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)',
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

  // ── DASHBOARD ─────────────────────────────────────────────────────────────────
  return (
    <div className="portal-layout" style={{ position: 'relative' }}>
      {/* ── Sidebar Backdrop (Mobile Only) ── */}
      {sidebarOpen && (
        <div className="sidebar-backdrop show-mobile" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`portal-sidebar admin-sidebar collapsible-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo-area" style={{ display: 'flex', alignItems: 'center', padding: '12px 16px' }}>
          <img src={whiteLogo} alt="the Prink Admin" style={{ height: '32px', width: 'auto', display: 'block' }} />
          <button className="btn btn-outline btn-sm show-mobile" style={{ marginLeft: 'auto', padding: '4px 8px', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }} onClick={() => setSidebarOpen(false)}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <span className="sidebar-section-label">Main Menu</span>
        <nav>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              id={`nav-${s.id}`}
              className={`sidebar-item${section === s.id ? ' active' : ''}`}
              onClick={() => {
                setSection(s.id);
                if (window.innerWidth <= 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <i className={`bi ${s.icon}`} />
              <span>{s.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="avatar" style={{ background: 'var(--accent)' }}>A</div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>Admin</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>admin@theprink.com</div>
            </div>
            <button
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)' }}
              title="Sign out"
              onClick={() => {
                localStorage.removeItem('admin_token');
                setScreen('login');
                setEmail('');
                setPassword('');
                if (window.innerWidth <= 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <i className="bi bi-box-arrow-right" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex flex-col w-full h-full" style={{ overflow: 'hidden' }}>
        {/* Mobile Toggle Bar */}
        <div className="admin-mobile-toggle-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={whiteLogo} alt="the Prink Logo" style={{ height: '20px', width: 'auto' }} />
            <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Admin Dashboard</span>
          </div>
          <button className="admin-mobile-toggle-btn" onClick={() => setSidebarOpen(true)}>
            <i className="bi bi-list" style={{ marginRight: '4px' }} />
            Menu
          </button>
        </div>

        <section className="portal-content" style={{ flex: 1, overflowY: 'auto' }}>
        {/* ── OVERVIEW ── */}
        {section === 'overview' && (
          <div>
            <div className="section-header">
              <div>
                <h1 className="page-heading">Dashboard Overview</h1>
                <p className="text-sm text-muted">Today — Jun 18, 2026</p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => {
                localStorage.removeItem('admin_token');
                setScreen('login');
              }}>
                <i className="bi bi-box-arrow-right" /> Sign Out
              </button>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-row mb-4">
              <button id="qa-sync"    className="quick-action-btn" onClick={syncShopify}>
                <i className="bi bi-arrow-repeat" /> Sync Shopify Orders
              </button>
              <button id="qa-upscale" className="quick-action-btn" onClick={runUpscaler} disabled={upscalerRunning}>
                <i className={`bi bi-stars${upscalerRunning ? ' spin' : ''}`} />
                {upscalerRunning ? 'Upscaling…' : 'Upscale Low-DPI'}
              </button>
              <button id="qa-pdf"     className="quick-action-btn" onClick={genAllPDFs}>
                <i className="bi bi-file-earmark-pdf" /> Generate All PDFs
              </button>
              <button id="qa-export"  className="quick-action-btn" onClick={exportReport}>
                <i className="bi bi-download" /> Export Report
              </button>
            </div>

            {/* KPI Grid */}
            <div className="kpi-grid mb-6">
              <div className="kpi-card">
                <div className="kpi-card-icon"><i className="bi bi-cart-check" /></div>
                <div className="kpi-card-label">Total Purchases</div>
                <div className="kpi-card-value">{orders.length}</div>
                <div className="kpi-card-sub">Active Shopify Sync</div>
              </div>
              <div className="kpi-card accent">
                <div className="kpi-card-icon"><i className="bi bi-palette" /></div>
                <div className="kpi-card-label">Pending Customization</div>
                <div className="kpi-card-value">{orders.filter(o => o.customizationStatus !== 'completed').length}</div>
                <div className="kpi-card-sub">Customer editing drafts</div>
              </div>
              <div className="kpi-card success">
                <div className="kpi-card-icon"><i className="bi bi-check-circle" /></div>
                <div className="kpi-card-label">Print Ready (Approved)</div>
                <div className="kpi-card-value">{orders.filter(o => o.uploadStatus === 'ready').length}</div>
                <div className="kpi-card-sub">Verified high-DPI graphics</div>
              </div>
              <div className="kpi-card" style={{ borderLeft: '4px solid var(--error)' }}>
                <div className="kpi-card-icon"><i className="bi bi-exclamation-triangle" style={{ color: 'var(--error)' }} /></div>
                <div className="kpi-card-label">Revision Requested</div>
                <div className="kpi-card-value">{orders.filter(o => o.adminComments).length}</div>
                <div className="kpi-card-sub">Requires client revision</div>
              </div>
            </div>

            {/* Two-column grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
              {/* Recent Orders */}
              <div className="card p-6">
                <div className="flex justify-between align-center mb-4">
                  <h3 style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>Recent Orders</h3>
                  <button className="btn btn-outline btn-sm" onClick={() => setSection('orders')}>View All</button>
                </div>
                <div className="clean-table-wrapper">
                  <table className="clean-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Product</th>
                        <th>DPI</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 4).map(o => (
                        <tr key={o.id}>
                          <td><span style={{ fontWeight: 600, color: 'var(--primary)' }}>{o.id}</span></td>
                          <td>{o.customer}</td>
                          <td style={{ maxWidth: 160 }}><span style={{ fontSize: '0.8rem' }}>{o.product}</span></td>
                          <td>{dpiStatusBadge(o.dpiStatus, o.dpi)}</td>
                          <td>{uploadStatusBadge(o.uploadStatus)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Activity Log */}
              <div className="card p-6">
                <h3 style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem', marginBottom: '1rem' }}>
                  Activity Log
                </h3>
                <ul className="activity-list">
                  {ACTIVITY_LOG.map(a => (
                    <li key={a.id} className="activity-item">
                      <span className={`activity-dot ${activityDotColor(a.type)}`} />
                      <div className="activity-content">
                        <span className="activity-action">{a.action}</span>
                        <span className="activity-meta">{a.user} · {a.timestamp}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── ORDERS ── */}
        {section === 'orders' && (
          <div>
            <div className="section-header">
              <div>
                <h1 className="page-heading">Orders</h1>
                <p className="text-sm text-muted">Manage and track all print orders</p>
              </div>
            </div>

            {/* Tab bar */}
            <div className="tab-bar mb-4">
              {([
                { key: 'all',      label: 'All',            count: orders.length },
                { key: 'ready',    label: 'Ready',          count: readyCount    },
                { key: 'awaiting', label: 'Awaiting Upload', count: awaitingCount },
                { key: 'pending',  label: 'Pending',         count: pendingCount  },
              ] as const).map(t => (
                <button
                  key={t.key}
                  id={`order-tab-${t.key}`}
                  className={`tab-item${orderTab === t.key ? ' active' : ''}`}
                  onClick={() => setOrderTab(t.key)}
                >
                  {t.label}
                  <span className="tab-count">{t.count}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ position: 'relative', maxWidth: 340 }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  id="order-search"
                  className="input"
                  type="search"
                  placeholder="Search orders, customers…"
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Orders Table */}
            <div className="clean-table-wrapper">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Product</th>
                    <th>DPI Status</th>
                    <th>Upload Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                        No orders found
                      </td>
                    </tr>
                  ) : filteredOrders.map(o => (
                    <tr key={o.id}>
                      <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{o.id}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem', flexShrink: 0 }}>
                            {o.customer[0]}
                          </div>
                          {o.customer}
                        </div>
                      </td>
                      <td className="text-sm text-muted">{o.phone}</td>
                      <td className="text-sm">{o.product}</td>
                      <td>{dpiStatusBadge(o.dpiStatus, o.dpi)}</td>
                      <td>{uploadStatusBadge(o.uploadStatus)}</td>
                      <td className="text-sm text-muted">{o.date}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {o.customizationStatus === 'completed' && o.uploadStatus !== 'ready' && (
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }}
                              onClick={() => setReviewingOrder(o)}
                            >
                              <i className="bi bi-shield-check" /> Review Design
                            </button>
                          )}
                          {o.uploadStatus === 'ready' ? (
                            <button
                              id={`route-${o.id}`}
                              className="btn btn-primary btn-sm"
                              onClick={() => routeToPrinter(o)}
                            >
                              <i className="bi bi-printer" /> Send to Print
                            </button>
                          ) : (
                            <>
                              <button
                                id={`wa-${o.id}`}
                                className="btn btn-outline btn-sm"
                                onClick={() => sendWhatsApp(o.id, o.customer)}
                                title="Send WhatsApp reminder"
                              >
                                <i className="bi bi-whatsapp" /> Alert
                              </button>
                              {o.dpiStatus === 'low' && (
                                <button
                                  id={`force-${o.id}`}
                                  className="btn btn-sm"
                                  style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fbbf24' }}
                                  onClick={() => forceApprove(o.id)}
                                >
                                  <i className="bi bi-check2-circle" /> Force Approve
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── UPLOAD MONITOR ── */}
        {section === 'monitor' && (
          <div>
            <div className="section-header">
              <div>
                <h1 className="page-heading">Upload Monitor</h1>
                <p className="text-sm text-muted">Track and manage customer file uploads</p>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Total Uploaded', value: '12 files', icon: 'bi-cloud-upload-fill', cls: '' },
                { label: 'Awaiting Upload', value: '2 orders',  icon: 'bi-hourglass-split',  cls: ' accent' },
                { label: 'Failed Uploads',  value: '0 errors',  icon: 'bi-x-circle',          cls: '' },
              ].map(s => (
                <div key={s.label} className={`metric-card${s.cls}`} style={{ flex: '1 1 160px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>{s.label}</div>
                      <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary)' }}>{s.value}</div>
                    </div>
                    <i className={`bi ${s.icon}`} style={{ fontSize: '1.5rem', color: 'var(--primary)', opacity: 0.35 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Order Upload Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {orders.map(o => (
                <div key={o.id} className="card p-4" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <div className="avatar" style={{ width: 44, height: 44, fontSize: '1rem', flexShrink: 0 }}>{o.customer[0]}</div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: 2 }}>{o.customer}</div>
                    <div className="text-sm text-muted">{o.product}</div>
                    <div className="text-xs text-muted">{o.phone}</div>
                  </div>
                  <div style={{ minWidth: 100 }}>
                    <span className={`status-chip ${o.uploadStatus === 'ready' ? 'print-ready' : o.uploadStatus === 'awaiting' ? 'processing' : 'pending'}`}>
                      {o.uploadStatus === 'ready' ? 'Uploaded' : o.uploadStatus === 'awaiting' ? 'Awaiting' : 'Pending'}
                    </span>
                  </div>
                  <div style={{ minWidth: 80 }}>
                    {dpiStatusBadge(o.dpiStatus, o.dpi)}
                  </div>
                  <div className="text-sm text-muted" style={{ minWidth: 90 }}>{o.date}</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {o.uploadStatus !== 'ready' && (
                      <button
                        id={`upload-link-${o.id}`}
                        className="btn btn-primary btn-sm"
                        onClick={() => sendWhatsApp(o.id, o.customer)}
                      >
                        <i className="bi bi-whatsapp" /> Send Upload Link
                      </button>
                    )}
                    {o.dpiStatus === 'low' && (
                      <button
                        id={`upscale-${o.id}`}
                        className="btn btn-outline btn-sm"
                        onClick={runUpscaler}
                      >
                        <i className="bi bi-stars" /> Upscale
                      </button>
                    )}
                    {o.uploadStatus === 'ready' && (
                      <button
                        id={`print-monitor-${o.id}`}
                        className="btn btn-primary btn-sm"
                        onClick={() => routeToPrinter(o)}
                      >
                        <i className="bi bi-printer" /> Print
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TEMPLATES ── */}
        {section === 'templates' && (
          <div>
            <div className="section-header">
              <div>
                <h1 className="page-heading">Templates</h1>
                <p className="text-sm text-muted">Manage print-ready design templates</p>
              </div>
              <button id="add-template-btn" className="btn btn-primary" onClick={() => {
                setEditingTemplate({
                  name: '',
                  productType: 'mug',
                  category: 'Mugs',
                  thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200',
                  tags: ['new']
                });
                setShowTemplateModal(true);
              }}>
                <i className="bi bi-plus-lg" /> Add New Template
              </button>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '1.5rem', maxWidth: 320 }}>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  id="template-search"
                  className="input"
                  type="search"
                  placeholder="Search templates…"
                  value={templateSearch}
                  onChange={e => setTemplateSearch(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div className="template-grid">
              {(dbTemplates.length > 0 ? dbTemplates : TEMPLATES).filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase())).map(t => (
                <div
                  key={t.id}
                  className="template-card"
                  onMouseEnter={() => setHoveredTemplate(t.id)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                >
                  <div className="template-card-preview">
                    <img src={t.thumbnail} alt={t.name} />
                    {hoveredTemplate === t.id && (
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(23,28,98,0.7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        borderRadius: '12px 12px 0 0', transition: 'all 0.2s'
                      }}>
                            <button
                          id={`edit-tmpl-${t.id}`}
                          className="btn btn-sm"
                          style={{ background: '#fff', color: 'var(--primary)', padding: '0.25rem 0.5rem', fontSize: '11px' }}
                          onClick={() => {
                            setEditingTemplate(t);
                            setShowTemplateModal(true);
                          }}
                        >
                          <i className="bi bi-pencil" /> Edit
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#fff', color: 'var(--accent)', border: 'none', padding: '0.25rem 0.5rem', fontSize: '11px' }}
                          onClick={() => duplicateTemplate(t)}
                        >
                          <i className="bi bi-files" /> Duplicate
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--error)', color: '#fff', border: 'none', padding: '0.25rem 0.5rem', fontSize: '11px' }}
                          onClick={() => deleteTemplate(t.id)}
                        >
                          <i className="bi bi-trash" /> Delete
                        </button>

                      </div>
                    )}
                    {t.tags && t.tags.length > 0 && (
                      <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', display: 'flex', gap: '0.3rem' }}>
                        {t.tags.map(tag => (
                          <span key={tag} style={{
                            background: tag === 'popular' ? 'var(--accent)' : tag === 'new' ? '#10b981' : '#f59e0b',
                            color: '#fff', fontSize: '0.65rem', fontWeight: 700,
                            padding: '0.2rem 0.5rem', borderRadius: '10px', textTransform: 'uppercase'
                          }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="template-card-body">
                    <div className="template-card-name">{t.name}</div>
                    <div className="template-card-meta">
                      <span className="template-card-tag">{t.productType}</span>
                      <span className="text-xs text-muted">{t.usageCount || 0} uses</span>
                    </div>
                    <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>Modified {t.lastModified || 'Just now'}</div>
                  </div>
                </div>
              ))}

              {/* Add New Card */}
              <div
                id="add-new-template-card"
                className="add-new-card"
                onClick={() => {
                  setEditingTemplate({
                    name: '',
                    productType: 'mug',
                    category: 'Mugs',
                    thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200',
                    tags: ['new']
                  });
                  setShowTemplateModal(true);
                }}
              >
                <i className="bi bi-plus-circle" style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
                <span>Add New Template</span>
              </div>
            </div>
          </div>
        )}

        {/* ── SKU MAPPINGS ── */}
        {section === 'sku-mappings' && (
          <div>
            <div className="section-header">
              <div>
                <h1 className="page-heading">SKU Mapping Rules</h1>
                <p className="text-sm text-muted">Map purchased Shopify product SKU codes to templates</p>
              </div>
              <button className="btn btn-primary" onClick={() => {
                setEditingMapping({
                  sku: '',
                  productType: 'mug',
                  templateId: 't1'
                });
                setShowSkuModal(true);
              }}>
                <i className="bi bi-plus-lg" /> Add SKU Rule
              </button>
            </div>

            <div className="card p-6 mb-6">
              <h3 style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem', marginBottom: '1rem' }}>Active Mapping Matrix</h3>
              <div className="clean-table-wrapper">
                <table className="clean-table">
                  <thead>
                    <tr>
                      <th>SKU Code Prefix</th>
                      <th>Mapped Product Type</th>
                      <th>Template Association</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skuMappings.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                          No SKU mapping rules defined. Adding standard presets.
                        </td>
                      </tr>
                    ) : skuMappings.map(m => (
                      <tr key={m.id}>
                        <td><span style={{ fontWeight: 700, color: 'var(--accent)' }}>{m.sku}</span></td>
                        <td style={{ textTransform: 'capitalize' }}>{m.productType}</td>
                        <td>{m.templateId || 'None'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="btn btn-outline btn-sm" onClick={() => {
                              setEditingMapping(m);
                              setShowSkuModal(true);
                            }}>
                              <i className="bi bi-pencil" /> Edit
                            </button>
                            <button className="btn btn-outline btn-sm" style={{ color: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => deleteSkuMapping(m.id || '')}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── PRINT QUEUE ── */}
        {section === 'queue' && (
          <div>
            <div className="section-header">
              <div>
                <h1 className="page-heading">Print Queue</h1>
                <p className="text-sm text-muted">Monitor and manage active print jobs</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => showToast('Queue refreshed', 'info')}>
                <i className="bi bi-arrow-repeat" /> Refresh
              </button>
            </div>

            {/* Tab bar */}
            <div className="tab-bar mb-4">
              {([
                { key: 'all',          label: 'All Jobs',   count: printQueue.length },
                { key: 'pending',      label: 'Pending',    count: printQueue.filter(q => q.status === 'pending').length },
                { key: 'processing',   label: 'Processing', count: printQueue.filter(q => q.status === 'processing').length },
                { key: 'print-ready',  label: 'Print Ready',count: printQueue.filter(q => q.status === 'print-ready').length },
                { key: 'completed',    label: 'Completed',  count: printQueue.filter(q => q.status === 'completed').length },
              ] as const).map(t => (
                <button
                  key={t.key}
                  id={`queue-tab-${t.key}`}
                  className={`tab-item${queueTab === t.key ? ' active' : ''}`}
                  onClick={() => setQueueTab(t.key)}
                >
                  {t.label}
                  <span className="tab-count">{t.count}</span>
                </button>
              ))}
            </div>

            <div className="clean-table-wrapper">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Trim Size</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                        No jobs in this category
                      </td>
                    </tr>
                  ) : filteredQueue.map(q => (
                    <tr key={q.id}>
                      <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{q.id}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem', flexShrink: 0 }}>{q.customer[0]}</div>
                          {q.customer}
                        </div>
                      </td>
                      <td className="text-sm">{q.product}</td>
                      <td className="text-sm text-muted">{q.trimSize}</td>
                      <td><PriorityBadge priority={q.priority} /></td>
                      <td><StatusChip status={q.status} /></td>
                      <td className="text-sm text-muted">{q.assignedAt}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            id={`dl-pdf-${q.id}`}
                            className="btn btn-outline btn-sm"
                            onClick={() => showToast(`Downloading PDF for ${q.id}…`, 'info')}
                          >
                            <i className="bi bi-file-earmark-pdf" /> PDF
                          </button>
                          {q.status === 'print-ready' && (
                            <button
                              id={`complete-${q.id}`}
                              className="btn btn-primary btn-sm"
                              onClick={() => markComplete(q.id)}
                            >
                              <i className="bi bi-check2-all" /> Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── REPORTS ── */}
        {section === 'reports' && (
          <div>
            <div className="section-header">
              <div>
                <h1 className="page-heading">Reports & Analytics</h1>
                <p className="text-sm text-muted">Insights for June 2026</p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={exportReport}>
                <i className="bi bi-download" /> Export CSV
              </button>
            </div>

            {/* Stats row */}
            <div className="kpi-grid mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="kpi-card">
                <div className="kpi-card-icon"><i className="bi bi-currency-rupee" /></div>
                <div className="kpi-card-label">Monthly Revenue</div>
                <div className="kpi-card-value">₹42,890</div>
                <div className="kpi-card-sub">↑ 18% vs May</div>
              </div>
              <div className="kpi-card success">
                <div className="kpi-card-icon"><i className="bi bi-cart-check" /></div>
                <div className="kpi-card-label">Orders This Month</div>
                <div className="kpi-card-value">127</div>
                <div className="kpi-card-sub">↑ 23 from last month</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-card-icon"><i className="bi bi-clock-history" /></div>
                <div className="kpi-card-label">Avg. Fulfillment</div>
                <div className="kpi-card-value">1.4 hrs</div>
                <div className="kpi-card-sub">↓ 0.2 hrs improvement</div>
              </div>
            </div>

            {/* Analytics Grid */}
            <div className="analytics-grid mb-6">
              {/* Orders by Product Type */}
              <div className="chart-card">
                <h3 style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                  Orders by Product Type
                </h3>
                {[
                  { label: 'Coffee Mug',   pct: 42, color: 'var(--primary)' },
                  { label: 'Canvas Print', pct: 28, color: '#3b82f6' },
                  { label: 'Photo Frame',  pct: 15, color: '#10b981' },
                  { label: 'Calendar',     pct: 10, color: '#f59e0b' },
                  { label: 'Photo Book',   pct: 5,  color: 'var(--accent)' },
                ].map(b => (
                  <div key={b.label} className="chart-bar-row">
                    <span className="chart-bar-label">{b.label}</span>
                    <div className="chart-bar-track">
                      <div className="chart-bar-fill" style={{ width: `${b.pct}%`, background: b.color }} />
                    </div>
                    <span className="chart-bar-value">{b.pct}%</span>
                  </div>
                ))}
              </div>

              {/* Upload Status Breakdown */}
              <div className="chart-card">
                <h3 style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                  Upload Status Breakdown
                </h3>
                {[
                  { label: 'Print Ready',     pct: 78, color: '#10b981' },
                  { label: 'Awaiting Upload', pct: 14, color: '#f59e0b' },
                  { label: 'Pending',         pct: 8,  color: 'var(--accent)' },
                ].map(b => (
                  <div key={b.label} className="chart-bar-row">
                    <span className="chart-bar-label">{b.label}</span>
                    <div className="chart-bar-track">
                      <div className="chart-bar-fill" style={{ width: `${b.pct}%`, background: b.color }} />
                    </div>
                    <span className="chart-bar-value">{b.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SVG Line Chart */}
            <div className="chart-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>Monthly Order Volume</h3>
                <span className="badge badge-success">+34% YoY</span>
              </div>
              <LineChart />
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {section === 'settings' && (
          <div>
            <div className="section-header">
              <div>
                <h1 className="page-heading">Settings</h1>
                <p className="text-sm text-muted">Configure integrations and system preferences</p>
              </div>
            </div>

            {/* Block 1: Shopify Integration */}
            <div className="settings-section mb-6">
              <div className="settings-section-header">
                <i className="bi bi-bag-check" />
                <span>Shopify Integration</span>
              </div>
              <div className="settings-section-body">
                <div className="settings-row">
                  <div className="settings-row-info">
                    <label className="label" htmlFor="shopify-url">Shopify Store URL</label>
                    <p className="text-xs text-muted">Your myshopify.com domain</p>
                  </div>
                  <input
                    id="shopify-url"
                    className="input"
                    style={{ maxWidth: 280 }}
                    defaultValue="theprink.myshopify.com"
                  />
                </div>
                <div className="settings-row">
                  <div className="settings-row-info">
                    <label className="label" htmlFor="shopify-api">API Key</label>
                    <p className="text-xs text-muted">Admin API access token</p>
                  </div>
                  <input
                    id="shopify-api"
                    className="input"
                    type="password"
                    style={{ maxWidth: 280 }}
                    defaultValue="sk_••••••••"
                  />
                </div>
                <div style={{ paddingTop: '0.5rem' }}>
                  <button id="sync-shopify-btn" className="btn btn-primary" onClick={syncShopify}>
                    <i className="bi bi-arrow-repeat" /> Sync Now
                  </button>
                </div>
              </div>
            </div>

            {/* Block 2: Notifications */}
            <div className="settings-section mb-6">
              <div className="settings-section-header">
                <i className="bi bi-bell" />
                <span>Notifications</span>
              </div>
              <div className="settings-section-body">
                {([
                  { key: 'whatsapp',     label: 'WhatsApp Upload Reminders', desc: 'Send reminders when customers haven\'t uploaded' },
                  { key: 'email',        label: 'Email Order Confirmations',  desc: 'Send order confirmation emails automatically' },
                  { key: 'lowDpi',       label: 'Low DPI Alerts',            desc: 'Alert when image resolution is below threshold' },
                  { key: 'dailySummary', label: 'Daily Summary Report',      desc: 'Receive daily digest at 8:00 AM' },
                ] as const).map(t => (
                  <div key={t.key} className="settings-row">
                    <div className="settings-row-info">
                      <span className="font-semibold text-sm">{t.label}</span>
                      <p className="text-xs text-muted">{t.desc}</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        id={`toggle-${t.key}`}
                        type="checkbox"
                        checked={toggles[t.key]}
                        onChange={() => setToggles(p => ({ ...p, [t.key]: !p[t.key] }))}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Block 3: System */}
            <div className="settings-section mb-6">
              <div className="settings-section-header">
                <i className="bi bi-gear" />
                <span>System</span>
              </div>
              <div className="settings-section-body">
                <div className="settings-row">
                  <div className="settings-row-info">
                    <label className="label" htmlFor="dpi-threshold">Default DPI Threshold</label>
                    <p className="text-xs text-muted">Minimum acceptable DPI for print quality</p>
                  </div>
                  <input
                    id="dpi-threshold"
                    className="input"
                    type="number"
                    min={72}
                    max={1200}
                    value={dpiThreshold}
                    onChange={e => setDpiThreshold(+e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                </div>
                <div className="settings-row">
                  <div className="settings-row-info">
                    <label className="label" htmlFor="max-filesize">Max File Size (MB)</label>
                    <p className="text-xs text-muted">Maximum allowed upload size per file</p>
                  </div>
                  <input
                    id="max-filesize"
                    className="input"
                    type="number"
                    min={1}
                    max={200}
                    value={maxFileMB}
                    onChange={e => setMaxFileMB(+e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                </div>
                <div className="settings-row">
                  <div className="settings-row-info">
                    <span className="font-semibold text-sm">Auto Upscale Low-DPI</span>
                    <p className="text-xs text-muted">Automatically run AI upscaler on low-resolution images</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      id="toggle-autoUpscale"
                      type="checkbox"
                      checked={toggles.autoUpscale}
                      onChange={() => setToggles(p => ({ ...p, autoUpscale: !p.autoUpscale }))}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
                <div style={{ paddingTop: '0.5rem' }}>
                  <button id="save-settings-btn" className="btn btn-primary" onClick={saveSettings}>
                    <i className="bi bi-floppy2" /> Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {section === 'workflow' && (
          <div>
            <div className="flex justify-between align-center mb-6">
              <div>
                <h3 className="page-heading" style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)', paddingLeft: 14 }}>
                  Automated Workflow Pipeline
                </h3>
                <p className="text-sm text-muted" style={{ marginTop: 4 }}>
                  Monitor and simulate the Shopify-to-Print integration flow.
                </p>
              </div>
            </div>

            <div className="workflow-grid">
              {/* Left Column: Steps list */}
              <div className="workflow-step-list">
                {[
                  { id: 1, title: "Shopify Order Created", service: "Shopify Webhooks", icon: "bi-cart3" },
                  { id: 2, title: "Webhook Trigger Receive", service: "Express REST API", icon: "bi-arrow-left-right" },
                  { id: 3, title: "MongoDB Order Creation", service: "MongoDB / Mongoose", icon: "bi-database-fill-check" },
                  { id: 4, title: "WhatsApp Message Send", service: "Twilio WhatsApp API", icon: "bi-whatsapp" },
                  { id: 5, title: "Customer Portal Open", service: "React Customer Portal", icon: "bi-cloud-upload" },
                  { id: 6, title: "AWS S3 Image Upload", service: "AWS S3 Cloud Storage", icon: "bi-clouds" },
                  { id: 7, title: "sharp Optimization Run", service: "sharp Image Buffer", icon: "bi-magic" },
                  { id: 8, title: "Live Preview Mockup", service: "HTML5 Canvas Preview", icon: "bi-aspect-ratio" },
                  { id: 9, title: "Customer Confirms Design", service: "Customer Portal App", icon: "bi-check-circle-fill" },
                  { id: 10, title: "PDFKit PDF Compilation", service: "PDFKit Rendering Engine", icon: "bi-file-pdf" },
                  { id: 11, title: "Admin Portal Status Sync", service: "WebSockets Admin Dashboard", icon: "bi-sliders" },
                  { id: 12, title: "Printer Queue Allocation", service: "Printer Queue manager", icon: "bi-printer-fill" },
                  { id: 13, title: "Printer Rip Download", service: "Rip Terminal Downloader", icon: "bi-download" },
                  { id: 14, title: "Fulfillment Update Sync", service: "Shopify Fulfillment API", icon: "bi-bag-check-fill" }
                ].map((s, idx) => (
                  <div
                    key={s.id}
                    className={`workflow-step-card flex align-center gap-3${selectedWorkflowStep === idx ? ' active' : ''}`}
                    onClick={() => setSelectedWorkflowStep(idx)}
                  >
                    <div className="workflow-step-icon-wrap">
                      <i className={`bi ${s.icon}`} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: selectedWorkflowStep === idx ? 'var(--accent)' : 'var(--primary)', marginBottom: 2 }}>
                        {s.id}. {s.title}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.service}</p>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: 9, padding: '3px 6px' }}>Active</span>
                  </div>
                ))}
              </div>

              {/* Right Column: Step Details & Simulation Console */}
              <div className="workflow-detail-pane">
                {(() => {
                  const stepDetails = [
                    {
                      title: "1. Shopify Order Placement",
                      subtitle: "Customer completes purchase on Shopify storefront",
                      service: "Shopify Storefront API",
                      dbCollection: "Orders (Shopify Pending)",
                      metric: `Shopify Orders Syncing: ${orders.length} active`,
                      details: "The workflow begins when a customer purchases a personalized product on Shopify. The checkout flow requests image parameters, but leaves fulfillment in a pending state until photos are submitted.",
                      inputs: "Shopify Checkout / Cart Object",
                      outputs: "Shopify orders/create JSON webhook event payload",
                      simText: "Simulate Shopify Order checkout webhook event to push a new unfulfilled order directly to our backend database.",
                      simAction: simulateWebhook,
                      simLabel: "Trigger Shopify Order Webhook",
                      simIcon: "bi-cart-plus-fill",
                      simLoading: isSimulatingWebhook
                    },
                    {
                      title: "2. Shopify Webhook Receive",
                      subtitle: "Shopify triggers orders/create webhook",
                      service: "Express Webhook Endpoints",
                      dbCollection: "System Logs",
                      metric: "API Endpoint: POST /api/webhooks/shopify-orders",
                      details: "Express API catches the orders/create webhook. Validates the Shopify HMAC signature to ensure security and prevent request spoofing.",
                      inputs: "HTTP Request headers & JSON body",
                      outputs: "HTTP 200 OK Response & internal job trigger",
                      simText: "Trigger a test webhook POST check to verify API endpoint handshake and authentication signature.",
                      simAction: simulateWebhook,
                      simLabel: "Post Test API Webhook",
                      simIcon: "bi-arrow-left-right",
                      simLoading: isSimulatingWebhook
                    },
                    {
                      title: "3. MongoDB Order Creation",
                      subtitle: "Express backend saves order record",
                      service: "Mongoose ODM / MongoDB Atlas",
                      dbCollection: "orders / users / uploads",
                      metric: `Stored Database Orders: ${orders.length} records`,
                      details: "Extracts customer parameters from webhook. Creates a new order document in the 'orders' database collection with status 'pending' and extracts SKU parameters to match safe print canvas dimensions.",
                      inputs: "Parsed Shopify order parameters",
                      outputs: "MongoDB document successfully created",
                      simText: "Query MongoDB collection and check document insertion schema integrity.",
                      simAction: () => {
                        showToast("MongoDB schema check: OK. All fields mapped correctly.", "success");
                      },
                      simLabel: "Run DB Integrity Check",
                      simIcon: "bi-database-fill-gear",
                      simLoading: false
                    },
                    {
                      title: "4. WhatsApp Secure Token Dispatch",
                      subtitle: "WhatsApp API delivers upload link to customer",
                      service: "Meta WhatsApp Cloud API / Twilio SDK",
                      dbCollection: "notifications",
                      metric: "API Delivery Uptime: 99.98%",
                      details: "Constructs a personalized template message with a secure link. Dispatches the notification automatically to the customer's phone number via the WhatsApp Business API.",
                      inputs: "Customer Phone Number & Order Token",
                      outputs: "Delivered notification with direct upload link",
                      simText: "Simulate sending a WhatsApp Cloud API notification text with a mock secure portal token link.",
                      simAction: simulateWhatsApp,
                      simLabel: "Simulate WhatsApp Dispatch",
                      simIcon: "bi-whatsapp",
                      simLoading: isSimulatingWhatsApp
                    },
                    {
                      title: "5. Customer Portal Authentication",
                      subtitle: "Customer logs in and loads SKU upload rules",
                      service: "React Frontend App",
                      dbCollection: "templates / uploads",
                      metric: "Safe zones templates loaded: 5 active",
                      details: "The customer clicks the link and verifies access. The customer dashboard automatically looks up the order SKU and applies restrictions (e.g. maximum upload sizes, frame boundaries).",
                      inputs: "Secure token URL payload",
                      outputs: "Upload boundaries & templates rendered on canvas",
                      simText: "Run a template rule resolver test to verify that the proper dimensions and upload limits are loaded per SKU.",
                      simAction: () => {
                        showToast("SKU Rules verified: Canvas (12x16), Mug (8.5x3). Ready.", "success");
                      },
                      simLabel: "Verify SKU Rules Matrix",
                      simIcon: "bi-shield-check",
                      simLoading: false
                    },
                    {
                      title: "6. AWS S3 Image Upload",
                      subtitle: "Raw images uploaded directly to cloud bucket",
                      service: "AWS S3 SDK / CloudFront CDN",
                      dbCollection: "uploads",
                      metric: s3Health === 'healthy' ? "S3 Status: Connected & Healthy" : "S3 Status: Idle",
                      details: "Streams binaries from frontend directly to AWS Simple Storage Service (S3). Generates a CloudFront CDN endpoint to cache images and support fast live-rendering.",
                      inputs: "Binary image streams",
                      outputs: "High-resolution S3 resource URL",
                      simText: "Ping AWS S3 API, check CORS configurations, and verify bucket read/write permissions.",
                      simAction: runS3Check,
                      simLabel: s3Health === 'checking' ? "Pinging AWS S3..." : "Run S3 Health Check",
                      simIcon: "bi-cloud-check-fill",
                      simLoading: s3Health === 'checking'
                    },
                    {
                      title: "7. sharp Image Processing",
                      subtitle: "Backend scales and converts raw images",
                      service: "sharp C++ Image Optimizer",
                      dbCollection: "System Cache",
                      metric: "Optimized buffer caching: Active",
                      details: "Triggers high-performance image compilation. Resizes large assets, transpiles mobile formats (like Apple HEIC) into standard web-friendly JPEGs, and ensures minimum print resolution.",
                      inputs: "Raw uploaded S3 asset",
                      outputs: "Optimized image buffer (300 DPI)",
                      simText: "Run the sharp compiler on a sample HEIC photo to optimize resolution and convert formats.",
                      simAction: simulateOptimization,
                      simLabel: "Run Image Processing Mock",
                      simIcon: "bi-magic",
                      simLoading: isSimulatingOptimize
                    },
                    {
                      title: "8. Live Canvas Preview",
                      subtitle: "HTML5 Canvas renders crop safe areas",
                      service: "HTML5 Canvas Context2D",
                      dbCollection: "System View",
                      metric: "Real-time client adjustments active",
                      details: "Draws product layout mockups (like Mug wraps) in the browser. Renders vector guides so the client can scale, zoom, rotate, and crop their photos within printable limits.",
                      inputs: "Optimized image URL & template bounding boxes",
                      outputs: "Calculated client coordinates array",
                      simText: "Simulate and verify the canvas coordinate math output for crop boxes.",
                      simAction: () => {
                        showToast("Crop coordinates verified: X:140, Y:80, W:800, H:600. Correct.", "success");
                      },
                      simLabel: "Verify Canvas Crop Coordinates",
                      simIcon: "bi-aspect-ratio",
                      simLoading: false
                    },
                    {
                      title: "9. Customer Design Confirmation",
                      subtitle: "Customer confirms crop and submits caption",
                      service: "React State Manager",
                      dbCollection: "Orders (updates received)",
                      metric: "Status transition: pending -> ready",
                      details: "The customer locks editing, confirms bleed lines, and enters optional personalized text (e.g. name or date). Submitting locks the design details to prevent modification.",
                      inputs: "Client confirmed parameters payload",
                      outputs: "Locked design configuration data",
                      simText: "Verify confirmation token locks order edit permissions for customers.",
                      simAction: () => {
                        showToast("Design submission validated. Edit locks activated.", "success");
                      },
                      simLabel: "Test Edit Locking Security",
                      simIcon: "bi-lock-fill",
                      simLoading: false
                    },
                    {
                      title: "10. PDFKit PDF Compilation",
                      subtitle: "PDFKit automatically generates print-ready vector file",
                      service: "PDFKit Node Library",
                      dbCollection: "Compiled Files",
                      metric: "Average compile time: 1.8s",
                      details: "Automatically builds vector PDF sheets. Fetches S3 images, applies crops, overlays template outlines, draws CMYK color bars and registration marks, and appends order metadata to margins.",
                      inputs: "High-resolution S3 images & Crop coordinates",
                      outputs: "Print-ready PDF URL (300 DPI, CMYK, PDF/X-1a)",
                      simText: "Simulate PDFKit compiler to stitch image layers, crop layouts, and registration marks into a CMYK PDF format.",
                      simAction: simulatePDFKit,
                      simLabel: "Simulate PDFKit Compilation",
                      simIcon: "bi-file-earmark-pdf-fill",
                      simLoading: isSimulatingPDF
                    },
                    {
                      title: "11. Admin Dashboard Sync",
                      subtitle: "Admin tracks compiled files and allocations",
                      service: "Express API / WebSockets",
                      dbCollection: "ActivityLogs",
                      metric: "WebSocket active nodes: 14",
                      details: "Receives notification that the PDF is complete. Pushes a status update notification to the admin console and creates a print activity log.",
                      inputs: "Order status change event",
                      outputs: "Admin interface updated in real-time",
                      simText: "Dispatch a mock WebSocket event to synchronize dashboard analytics.",
                      simAction: () => {
                        showToast("WebSocket broadcast successful. All admin charts synced.", "success");
                      },
                      simLabel: "Broadcast WebSocket Sync",
                      simIcon: "bi-broadcast",
                      simLoading: false
                    },
                    {
                      title: "12. Printer Queue Allocation",
                      subtitle: "Printer Terminal Operator receives prioritized print queue",
                      service: "Printer Queue manager",
                      dbCollection: "PrintQueue",
                      metric: `Terminal Queue Size: ${printQueue.length} jobs`,
                      details: "The order is automatically placed in the local printing queue, sorted by submission timestamp and print priority (high, normal, low).",
                      inputs: "Print-ready PDF payload & Priority",
                      outputs: "Operator dashboard queue list update",
                      simText: "Sort active queue and prioritize urgent orders in the operator stack.",
                      simAction: () => {
                        showToast("Printer queue reorganized based on SLA and high-priority flags.", "success");
                      },
                      simLabel: "Optimize Queue Priority",
                      simIcon: "bi-sort-down",
                      simLoading: false
                    },
                    {
                      title: "13. Operator File Download",
                      subtitle: "Operator downloads CMYK PDF for direct press output",
                      service: "Printer Operator Terminal",
                      dbCollection: "System Access",
                      metric: "Download protocol: HTTPS / SSL",
                      details: "The print operator downloads the vector file, reviews the CMYK alignment marks, and imports the PDF into rip software (e.g. Fiery, Roland VersaWorks).",
                      inputs: "PDF download request payload",
                      outputs: "Local PDF print-rip stream",
                      simText: "Test PDF download speed and verify PDF header file integrity.",
                      simAction: () => {
                        showToast("File header verified: PDF-1.4 standard. CRC check ok.", "success");
                      },
                      simLabel: "Test RIP Header Download",
                      simIcon: "bi-download",
                      simLoading: false
                    },
                    {
                      title: "14. Fulfillment Update Sync",
                      subtitle: "Shopify API fulfillment webhook sends tracking",
                      service: "Shopify Rest Admin API",
                      dbCollection: "Orders (Completed)",
                      metric: "Shopify API: POST /admin/api/fulfillments.json",
                      details: "When the operator prints and fulfills the order, the system fires an API request back to Shopify. Shopify marks the order fulfilled and sends tracking links to the customer.",
                      inputs: "Order completion event",
                      outputs: "Shopify order status: Fulfilled",
                      simText: "Simulate dispatching a fulfillment update webhook to Shopify.",
                      simAction: () => {
                        showToast("Shopify fulfillment webhook triggered successfully. Client notified.", "success");
                      },
                      simLabel: "Simulate Shopify Fulfillment Webhook",
                      simIcon: "bi-shop",
                      simLoading: false
                    }
                  ];

                  const s = stepDetails[selectedWorkflowStep];
                  return (
                    <>
                      {/* Section Title */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span className="badge badge-primary" style={{ textTransform: 'uppercase', fontSize: 10 }}>
                            {s.service}
                          </span>
                          {s.dbCollection && (
                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>
                              DB: {s.dbCollection}
                            </span>
                          )}
                        </div>
                        <h4 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
                          {s.title}
                        </h4>
                        <p className="text-sm text-muted">{s.subtitle}</p>
                      </div>

                      {/* Connection Diagram */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                          Integration Interface
                        </p>
                        <div className="connection-flow" style={{ overflowX: 'auto' }}>
                          <span className="connection-node">{s.inputs}</span>
                          <i className="bi bi-chevron-right" style={{ color: 'var(--text-tertiary)', fontSize: 12 }} />
                          <span className="connection-node" style={{ background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}>
                            {s.service}
                          </span>
                          <i className="bi bi-chevron-right" style={{ color: 'var(--text-tertiary)', fontSize: 12 }} />
                          <span className="connection-node">{s.outputs}</span>
                        </div>
                      </div>

                      {/* Technical Description */}
                      <div className="card p-4" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                        <h5 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                          Pipeline Details
                        </h5>
                        <p className="text-sm" style={{ lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                          {s.details}
                        </p>
                        {s.metric && (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 12, borderTop: '1px dashed var(--border-color)', paddingTop: 10 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)' }}>
                              {s.metric}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Interactive Simulation Panel */}
                      <div className="simulation-box">
                        <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className="bi bi-cpu-fill" style={{ color: 'var(--accent)' }} />
                          Pipeline Sandbox Simulator
                        </h5>
                        <p className="text-xs text-muted mb-4">
                          {s.simText}
                        </p>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={s.simAction}
                          disabled={s.simLoading}
                          style={{ gap: 6 }}
                        >
                          {s.simLoading ? (
                            <><i className="bi bi-arrow-repeat spin" /> Simulating...</>
                          ) : (
                            <><i className={`bi ${s.simIcon}`} /> {s.simLabel}</>
                          )}
                        </button>
                      </div>

                      {/* Sandbox Terminal Console Logs */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                            Pipeline Telemetry Console
                          </p>
                          <button
                            onClick={() => setWorkflowLogs([])}
                            style={{ background: 'none', border: 'none', fontSize: 11, cursor: 'pointer', color: 'var(--accent)' }}
                          >
                            Clear Console
                          </button>
                        </div>
                        <div className="workflow-log-console">
                          {workflowLogs.length === 0 ? (
                            <div style={{ color: '#475569', fontStyle: 'italic', textAlign: 'center', paddingTop: 60 }}>
                              No active log entries. Trigger sandbox simulation above to generate telemetry data.
                            </div>
                          ) : (
                            workflowLogs.map(l => (
                              <div key={l.id} className={`workflow-log-entry ${l.type}`}>
                                <span>[{l.time}]</span> {l.text}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =======================================================================
          DESIGN REVIEW MODAL
          ======================================================================= */}
            {/* =======================================================================
          DESIGN REVIEW MODAL (OVERHAULED FULLSCREEN CANVA-STYLE EDITOR)
          ======================================================================= */}
      {reviewingOrder && (
        <AdminDesignEditor
          order={reviewingOrder}
          onClose={() => setReviewingOrder(null)}
          onApprove={() => handleReviewDecision('approve')}
          onReject={() => handleReviewDecision('reject')}
          onRequestReupload={() => handleReviewDecision('request_reupload')}
          onCommentsChange={(txt) => setReviewComments(txt)}
          commentsValue={reviewComments}
          onSaveProgress={async (elements) => {
            try {
              const token = localStorage.getItem('admin_token');
              const res = await fetch(`/api/orders/${encodeURIComponent(reviewingOrder.id)}/design`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  designData: JSON.stringify(elements),
                  customizationStatus: reviewingOrder.customizationStatus
                })
              });
              if (res.ok) {
                showToast('Progress saved successfully!', 'success');
                fetchOrders();
              } else {
                showToast('Failed to save progress.', 'error');
              }
            } catch (err) {
              showToast('Network error while saving.', 'error');
            }
          }}
        />
      )}
      {/* =======================================================================
          SKU RULES CONFIGURATION MODAL
          ======================================================================= */}
      {showSkuModal && editingMapping && (
        <div className="modal-overlay" onClick={() => setShowSkuModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="flex align-center justify-between" style={{ marginBottom: '1.25rem' }}>
              <h2 className="font-bold" style={{ color: 'var(--primary)', margin: 0, fontSize: '1.1rem' }}>
                {editingMapping.id ? 'Edit SKU Rule Mapping' : 'Define New SKU Mapping'}
              </h2>
              <button className="btn btn-outline btn-sm" onClick={() => setShowSkuModal(false)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="label text-xs font-semibold" htmlFor="mapping-sku" style={{ marginBottom: '0.2rem' }}>
                  Shopify SKU Prefix / Match Code:
                </label>
                <input
                  id="mapping-sku"
                  className="input text-xs"
                  type="text"
                  placeholder="E.g. PRK-MUG-CLASSIC"
                  value={editingMapping.sku || ''}
                  onChange={e => setEditingMapping({ ...editingMapping, sku: e.target.value })}
                />
              </div>

              <div>
                <label className="label text-xs font-semibold" htmlFor="mapping-product" style={{ marginBottom: '0.2rem' }}>
                  Mapped Product Canvas Type:
                </label>
                <select
                  id="mapping-product"
                  className="input text-xs"
                  value={editingMapping.productType || 'mug'}
                  onChange={e => setEditingMapping({ ...editingMapping, productType: e.target.value as any })}
                >
                  <option value="mug">Coffee Mug Wrap</option>
                  <option value="canvas">Stretch Canvas</option>
                  <option value="frame">Photo Frame</option>
                  <option value="calendar">Wall Calendar</option>
                </select>
              </div>

              <div>
                <label className="label text-xs font-semibold" htmlFor="mapping-template" style={{ marginBottom: '0.2rem' }}>
                  Associated Canva Design Template:
                </label>
                <select
                  id="mapping-template"
                  className="input text-xs"
                  value={editingMapping.templateId || ''}
                  onChange={e => setEditingMapping({ ...editingMapping, templateId: e.target.value })}
                >
                  <option value="">None (Generic Blank Layout)</option>
                  {(dbTemplates.length > 0 ? dbTemplates : TEMPLATES).map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.productType})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowSkuModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveSkuMapping}>
                  Save Mapping Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TEMPLATES BUILDER CONFIGURATION MODAL
          ======================================================================= */}
      {showTemplateModal && editingTemplate && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="flex align-center justify-between" style={{ marginBottom: '1.25rem' }}>
              <h2 className="font-bold" style={{ color: 'var(--primary)', margin: 0, fontSize: '1.1rem' }}>
                {editingTemplate.id ? 'Edit Template Builder' : 'Create Canva Print Template'}
              </h2>
              <button className="btn btn-outline btn-sm" onClick={() => setShowTemplateModal(false)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="label text-xs font-semibold" htmlFor="tmpl-name" style={{ marginBottom: '0.2rem' }}>
                  Template Display Name:
                </label>
                <input
                  id="tmpl-name"
                  className="input text-xs"
                  type="text"
                  placeholder="E.g. Father's Day Mug Wrap"
                  value={editingTemplate.name || ''}
                  onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                />
              </div>

              <div>
                <label className="label text-xs font-semibold" htmlFor="tmpl-product" style={{ marginBottom: '0.2rem' }}>
                  Target Product Canvas Type:
                </label>
                <select
                  id="tmpl-product"
                  className="input text-xs"
                  value={editingTemplate.productType || 'mug'}
                  onChange={e => setEditingTemplate({ ...editingTemplate, productType: e.target.value as any })}
                >
                  <option value="mug">Coffee Mug Wrap</option>
                  <option value="canvas">Stretch Canvas</option>
                  <option value="frame">Photo Frame</option>
                  <option value="calendar">Wall Calendar</option>
                </select>
              </div>

              <div>
                <label className="label text-xs font-semibold" htmlFor="tmpl-category" style={{ marginBottom: '0.2rem' }}>
                  Template Category:
                </label>
                <select
                  id="tmpl-category"
                  className="input text-xs"
                  value={editingTemplate.category || 'mug'}
                  onChange={e => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                >
                  <option value="mug">Mug</option>
                  <option value="frame">Frame</option>
                  <option value="tshirt">T-shirt</option>
                  <option value="album">Album</option>
                  <option value="case">Mobile case</option>
                  <option value="poster">Poster</option>
                  <option value="gift">Gift products</option>
                </select>
              </div>

              <div style={{ margin: '0.5rem 0' }}>
                <label className="text-xs flex align-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingTemplate.isDefault}
                    onChange={e => setEditingTemplate({ ...editingTemplate, isDefault: e.target.checked })}
                  />
                  <span>Set as default layout for this product canvas type</span>
                </label>
              </div>

              <div>
                <label className="label text-xs font-semibold" htmlFor="tmpl-thumb" style={{ marginBottom: '0.2rem' }}>
                  Thumbnail Image URL:
                </label>
                <input
                  id="tmpl-thumb"
                  className="input text-xs"
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={editingTemplate.thumbnail || ''}
                  onChange={e => setEditingTemplate({ ...editingTemplate, thumbnail: e.target.value })}
                />
              </div>


              <div className="flex gap-2 justify-end" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowTemplateModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveTemplate}>
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

// ─── ADMIN DESIGN EDITOR WORKSPACE (CANVA-STYLE) ────────────────────────────

interface AdminDesignEditorProps {
  order: Order;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRequestReupload: () => void;
  onCommentsChange: (txt: string) => void;
  commentsValue: string;
  onSaveProgress: (elements: CanvasElement[]) => void;
}

const AdminDesignEditor: React.FC<AdminDesignEditorProps> = ({
  order,
  onClose,
  onApprove,
  onReject,
  onRequestReupload,
  onCommentsChange,
  commentsValue,
  onSaveProgress
}) => {
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<CanvasElement[][]>([]);
  const [redoStack, setRedoStack] = useState<CanvasElement[][]>([]);
  const [canvasScale, setCanvasScale] = useState(1);
  const [activeTab, setActiveTab] = useState<'layers' | 'text' | 'image' | 'stickers' | 'shapes' | 'overlays'>('layers');
  const [snapAlign, setSnapAlign] = useState(true);
  const [removeBgLoading, setRemoveBgLoading] = useState(false);
  const [showSafe, setShowSafe] = useState(true);
  const [showBleed, setShowBleed] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Load layout on mount
  useEffect(() => {
    if (order.designData) {
      try {
        const parsed = JSON.parse(order.designData);
        const list = Array.isArray(parsed) ? parsed : (parsed.elements || []);
        setCanvasElements(list);
      } catch (e) {
        console.error('Failed to parse designData', e);
      }
    } else {
      // Default elements
      setCanvasElements([
        {
          id: 'admin-text-1',
          type: 'text',
          x: 100,
          y: 60,
          width: 250,
          height: 50,
          rotation: 0,
          opacity: 1,
          zIndex: 1,
          text: order.product || 'Custom Layout Design',
          fontFamily: 'Outfit',
          fontSize: 24,
          color: '#171C62',
          textAlign: 'center'
        }
      ]);
    }
  }, [order]);

  const saveState = (newElements: CanvasElement[]) => {
    setUndoStack(prev => [...prev, canvasElements]);
    setRedoStack([]);
    setCanvasElements(newElements);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, canvasElements]);
    setUndoStack(u => u.slice(0, -1));
    setCanvasElements(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(u => [...u, canvasElements]);
    setRedoStack(r => r.slice(0, -1));
    setCanvasElements(next);
  };

  const updateElementProps = (id: string, props: Partial<CanvasElement>) => {
    saveState(canvasElements.map(el => el.id === id ? { ...el, ...props } : el));
  };

  const deleteElement = (id: string) => {
    saveState(canvasElements.filter(el => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const addText = () => {
    const newEl: CanvasElement = {
      id: `admin-txt-${Date.now()}`,
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 44,
      rotation: 0,
      opacity: 1,
      zIndex: canvasElements.length + 1,
      text: 'Admin Custom Text',
      fontFamily: 'Outfit',
      fontSize: 20,
      color: '#171C62',
      textAlign: 'center',
      isCurved: false,
      letterSpacing: 0
    };
    saveState([...canvasElements, newEl]);
    setSelectedElementId(newEl.id);
  };

  const addShape = (shapeType: 'rect' | 'circle' | 'triangle' | 'star') => {
    const newEl: CanvasElement = {
      id: `admin-shape-${Date.now()}`,
      type: 'shape',
      shapeType,
      x: 150,
      y: 150,
      width: 80,
      height: 80,
      rotation: 0,
      opacity: 1,
      zIndex: canvasElements.length + 1,
      fillColor: '#FF304C',
      strokeColor: '#171C62',
      strokeWidth: 2
    };
    saveState([...canvasElements, newEl]);
    setSelectedElementId(newEl.id);
  };

  const addSticker = (emoji: string) => {
    const newEl: CanvasElement = {
      id: `admin-sticker-${Date.now()}`,
      type: 'sticker',
      src: emoji,
      x: 140,
      y: 140,
      width: 80,
      height: 80,
      rotation: 0,
      opacity: 1,
      zIndex: canvasElements.length + 1
    };
    saveState([...canvasElements, newEl]);
    setSelectedElementId(newEl.id);
  };

  const addAdminImageLayer = (src: string) => {
    const newEl: CanvasElement = {
      id: `admin-img-${Date.now()}`,
      type: 'image',
      src: src,
      x: 80,
      y: 80,
      width: 150,
      height: 150,
      rotation: 0,
      opacity: 1,
      zIndex: canvasElements.length + 1,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      sepia: 0,
      grayscale: false,
      flipX: false,
      flipY: false
    };
    saveState([...canvasElements, newEl]);
    setSelectedElementId(newEl.id);
  };

  const runRemoveBg = () => {
    if (!selectedElementId) return;
    setRemoveBgLoading(true);
    setTimeout(() => {
      setRemoveBgLoading(false);
      updateElementProps(selectedElementId, { sepia: 10 }); // vintage tint indicator
    }, 1500);
  };

  const activeEl = canvasElements.find(el => el.id === selectedElementId);

  const getCanvasDimensions = () => {
    switch (order.productType) {
      case 'mug': return { w: 450, h: 300 };
      case 'canvas': return { w: 400, h: 400 };
      case 'frame': return { w: 340, h: 440 };
      default: return { w: 400, h: 320 };
    }
  };
  const dims = getCanvasDimensions();

  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);

  const OVERLAYS = [
    { id: 'confetti', name: 'Confetti Overlay', color: 'rgba(255, 48, 76, 0.08)' },
    { id: 'grunge', name: 'Vintage Border', color: 'rgba(23, 28, 98, 0.05)' },
    { id: 'vignette', name: 'Soft Vignette', color: 'rgba(0, 0, 0, 0.06)' },
  ];

  const renderCanvasElement = (el: CanvasElement) => {
    const isSelected = el.id === selectedElementId;
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${el.x}px`,
      top: `${el.y}px`,
      width: `${el.width}px`,
      height: `${el.height}px`,
      transform: `rotate(${el.rotation || 0}deg)`,
      opacity: el.opacity ?? 1,
      zIndex: el.zIndex,
      cursor: 'move',
      userSelect: 'none',
      border: isSelected ? '2px dashed var(--accent)' : 'none',
      padding: '4px'
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedElementId(el.id);
      const startX = e.clientX;
      const startY = e.clientY;
      const initialX = el.x;
      const initialY = el.y;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        let newX = initialX + dx;
        let newY = initialY + dy;

        // Snap alignment simulation
        if (snapAlign) {
          if (Math.abs(newX) < 10) newX = 0;
          if (Math.abs(newY) < 10) newY = 0;
          if (Math.abs(newX - (dims.w - el.width) / 2) < 10) newX = (dims.w - el.width) / 2;
          if (Math.abs(newY - (dims.h - el.height) / 2) < 10) newY = (dims.h - el.height) / 2;
        }

        // update position directly
        setCanvasElements(prev => prev.map(item => item.id === el.id ? { ...item, x: newX, y: newY } : item));
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        // save to undo stack
        saveState(canvasElements);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    };

    return (
      <div key={el.id} style={style} onMouseDown={handleMouseDown}>
        {isSelected && (
          <button style={{
            position: 'absolute', top: -10, right: -10,
            background: 'var(--error)', color: '#fff', border: 'none',
            borderRadius: '50%', width: '18px', height: '18px',
            fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 1000
          }} onClick={(ev) => { ev.stopPropagation(); deleteElement(el.id); }}>
            ✕
          </button>
        )}

        {el.type === 'text' && (
          el.isCurved ? (
            <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
              <path id={`path-${el.id}`} d={`M 10,${el.height * 0.8} Q ${el.width / 2},${el.height * 0.1} ${el.width - 10},${el.height * 0.8}`} fill="transparent" />
              <text fill={el.gradientColor ? 'url(#textGrad)' : el.color} fontSize={el.fontSize} fontFamily={el.fontFamily} textAnchor="middle" letterSpacing={el.letterSpacing}>
                {el.gradientColor && (
                  <defs>
                    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={el.color} />
                      <stop offset="100%" stopColor={el.gradientColor} />
                    </linearGradient>
                  </defs>
                )}
                <textPath href={`#path-${el.id}`} startOffset="50%">
                  {el.text}
                </textPath>
              </text>
            </svg>
          ) : (
            <div style={{
              fontFamily: el.fontFamily,
              fontSize: `${el.fontSize}px`,
              color: el.gradientColor ? 'transparent' : el.color,
              backgroundImage: el.gradientColor ? `linear-gradient(135deg, ${el.color}, ${el.gradientColor})` : 'none',
              WebkitBackgroundClip: el.gradientColor ? 'text' : 'unset',
              textAlign: el.textAlign || 'center',
              textShadow: el.textShadow || 'none',
              letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : 'normal',
              width: '100%', height: '100%', wordBreak: 'break-all'
            }}>
              {el.text}
            </div>
          )
        )}

        {el.type === 'image' && (
          <img src={el.src} alt="img" style={{
            width: '100%', height: '100%', objectFit: 'cover',
            filter: `brightness(${(el.brightness ?? 100)}%) contrast(${(el.contrast ?? 100)}%) saturate(${(el.saturation ?? 100)}%) blur(${(el.blur ?? 0)}px) grayscale(${el.grayscale ? 1 : 0}) sepia(${(el.sepia ?? 0) / 10})`,
            transform: `scaleX(${el.flipX ? -1 : 1}) scaleY(${el.flipY ? -1 : 1})`
          }} />
        )}

        {el.type === 'shape' && (
          el.shapeType === 'circle' ? (
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: el.fillColor, border: `${el.strokeWidth ?? 1}px solid ${el.strokeColor || '#000'}` }} />
          ) : el.shapeType === 'rect' ? (
            <div style={{ width: '100%', height: '100%', background: el.fillColor, border: `${el.strokeWidth ?? 1}px solid ${el.strokeColor || '#000'}` }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: el.fillColor, clipPath: el.shapeType === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
          )
        )}

        {el.type === 'sticker' && (
          <span style={{ fontSize: `${Math.min(el.width, el.height) * 0.8}px`, display: 'block', textAlign: 'center', lineHeight: `${el.height}px` }}>
            {el.src}
          </span>
        )}
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column'
    }}>
      {/* Top operational bar */}
      <div className="flex align-center justify-between p-4" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div className="flex align-center gap-3">
          <button className="btn btn-outline btn-sm" onClick={onClose}>
            <i className="bi bi-arrow-left" /> Back to Dashboard
          </button>
          <div>
            <h2 className="font-bold text-sm" style={{ color: 'var(--primary)', margin: 0 }}>
              Review &amp; Edit Order: {order.id}
            </h2>
            <div className="text-xxs text-muted">Customer: {order.customer} | Product: {order.product} ({order.productType})</div>
          </div>
        </div>

        {/* Undo/Redo */}
        <div className="flex align-center gap-2">
          <button className="btn btn-outline btn-sm" title="Undo" onClick={handleUndo} disabled={undoStack.length === 0}>
            <i className="bi bi-arrow-counterclockwise" />
          </button>
          <button className="btn btn-outline btn-sm" title="Redo" onClick={handleRedo} disabled={redoStack.length === 0}>
            <i className="bi bi-arrow-clockwise" />
          </button>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 8px' }} />
          <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }} onClick={() => onSaveProgress(canvasElements)}>
            <i className="bi bi-save" /> Save Progress
          </button>
        </div>
      </div>

      {/* Main editor split area */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 300px', flex: 1, overflow: 'hidden' }}>
        {/* Left Side Panel */}
        <div style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          <h3 className="font-bold text-xs" style={{ color: 'var(--primary)', textTransform: 'uppercase', margin: 0 }}>Editor Tools</h3>
          
          <div className="flex gap-1" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            {['layers', 'text', 'image', 'stickers', 'shapes', 'overlays'].map(tab => (
              <button
                key={tab}
                className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, padding: '4px 6px', fontSize: '10px', textTransform: 'capitalize' }}
                onClick={() => setActiveTab(tab as any)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TAB: LAYERS */}
          {activeTab === 'layers' && (
            <div className="flex flex-col gap-2">
              <div className="text-xxs text-muted font-bold">Layers ordering</div>
              <div className="flex flex-col gap-1">
                {canvasElements.length === 0 ? (
                  <div className="text-xxs text-muted style-italic">No layers in workspace</div>
                ) : canvasElements.sort((a,b) => b.zIndex - a.zIndex).map(el => (
                  <div key={el.id} className="flex align-center justify-between p-2" style={{
                    background: selectedElementId === el.id ? 'var(--bg-tertiary)' : 'rgba(0,0,0,0.02)',
                    borderRadius: '4px', cursor: 'pointer'
                  }} onClick={() => setSelectedElementId(el.id)}>
                    <span className="text-xxs capitalize" style={{ fontWeight: selectedElementId === el.id ? 700 : 400 }}>
                      {el.type}: {el.text ? el.text.slice(0, 10) + '...' : el.shapeType || 'media'}
                    </span>
                    <div className="flex gap-1">
                      <button style={{ background: 'none', border: 'none', padding: 0 }} onClick={(e) => { e.stopPropagation(); updateElementProps(el.id, { zIndex: el.zIndex + 1 }); }}>
                        <i className="bi bi-chevron-up text-xxs" />
                      </button>
                      <button style={{ background: 'none', border: 'none', padding: 0 }} onClick={(e) => { e.stopPropagation(); updateElementProps(el.id, { zIndex: Math.max(1, el.zIndex - 1) }); }}>
                        <i className="bi bi-chevron-down text-xxs" />
                      </button>
                      <button style={{ background: 'none', border: 'none', padding: 0, color: 'var(--error)' }} onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}>
                        <i className="bi bi-trash text-xxs" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: TEXT */}
          {activeTab === 'text' && (
            <div className="flex flex-col gap-3">
              <button className="btn btn-outline btn-sm w-full" onClick={addText}>
                <i className="bi bi-plus-lg" /> Add Text Layer
              </button>
            </div>
          )}

          {/* TAB: IMAGE */}
          {activeTab === 'image' && (
            <div className="flex flex-col gap-3">
              <div className="text-xxs text-muted font-bold">Client Photo Uploads</div>
              <div className="grid grid-2 gap-2">
                {order.images && order.images.length > 0 ? order.images.map(img => (
                  <div key={img.id} className="card p-1" style={{ cursor: 'pointer', overflow: 'hidden' }} onClick={() => addAdminImageLayer(img.src)}>
                    <img src={img.src} alt="uploaded" style={{ width: '100%', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div className="text-xxs text-truncate mt-1" style={{ fontSize: '8px' }}>{img.name}</div>
                  </div>
                )) : (
                  <div className="text-xxs text-muted" style={{ gridColumn: 'span 2' }}>No client uploads found.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB: STICKERS */}
          {activeTab === 'stickers' && (
            <div>
              <div className="text-xxs text-muted font-bold mb-2">Popular Stickers</div>
              <div className="grid grid-4 gap-2">
                {['💖', '⭐', '🎁', '🎈', '🌹', '🎂', '👑', '🎗️'].map(s => (
                  <button key={s} className="btn btn-outline" style={{ fontSize: '20px', padding: '8px 0' }} onClick={() => addSticker(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SHAPES */}
          {activeTab === 'shapes' && (
            <div>
              <div className="text-xxs text-muted font-bold mb-2">Vector Shapes</div>
              <div className="grid grid-2 gap-2">
                <button className="btn btn-outline btn-sm" onClick={() => addShape('rect')}>Rectangle</button>
                <button className="btn btn-outline btn-sm" onClick={() => addShape('circle')}>Circle</button>
                <button className="btn btn-outline btn-sm" onClick={() => addShape('triangle')}>Triangle</button>
                <button className="btn btn-outline btn-sm" onClick={() => addShape('star')}>Star</button>
              </div>
            </div>
          )}

          {/* TAB: OVERLAYS */}
          {activeTab === 'overlays' && (
            <div className="flex flex-col gap-2">
              <div className="text-xxs text-muted font-bold">Confetti &amp; Borders</div>
              {OVERLAYS.map(ov => (
                <label key={ov.id} className="text-xs flex align-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={activeOverlay === ov.id} onChange={e => setActiveOverlay(e.target.checked ? ov.id : null)} />
                  <span>{ov.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Center Canvas Area */}
        <div style={{ background: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflow: 'hidden', position: 'relative' }}>
          {/* Zoom controls */}
          <div className="flex align-center gap-3 p-2 card" style={{ position: 'absolute', top: 16, right: 16, flexDirection: 'row', zIndex: 100 }}>
            <label className="text-xxs text-muted">Canvas Zoom:</label>
            <input type="range" min="0.6" max="1.5" step="0.1" value={canvasScale} onChange={e => setCanvasScale(parseFloat(e.target.value))} style={{ width: '80px' }} />
            <span className="text-xxs">{Math.round(canvasScale * 100)}%</span>
            <div style={{ width: 1, height: 16, background: 'var(--border-color)' }} />
            <label className="text-xxs flex align-center gap-1 cursor-pointer">
              <input type="checkbox" checked={snapAlign} onChange={e => setSnapAlign(e.target.checked)} />
              <span>Snap guides</span>
            </label>
            <div style={{ width: 1, height: 16, background: 'var(--border-color)' }} />
            <button className="btn btn-sm p-1 btn-outline" style={{ fontSize: '10px' }} onClick={() => setPreviewMode(!previewMode)}>
              <i className="bi bi-eye" style={{ marginRight: '4px' }} /> {previewMode ? 'Edit Flat Wrap' : '3D Cylindrical Preview'}
            </button>
          </div>

          {previewMode ? (
            /* Cylinder Mug cylindrical 3D feel mock */
            <div className="flex flex-col align-center gap-4">
              <div className="mug-mockup-container" style={{
                position: 'relative',
                width: '240px',
                height: '270px',
                background: '#fff',
                borderRadius: '16px 16px 28px 28px',
                boxShadow: 'inset -24px 0 24px rgba(0,0,0,0.1), inset 12px 0 12px rgba(255,255,255,0.85), 0 15px 35px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.04)'
              }}>
                {/* Handle */}
                <div style={{
                  position: 'absolute',
                  right: '-20px',
                  top: '50px',
                  width: '44px',
                  height: '140px',
                  border: '18px solid #fff',
                  borderRadius: '0 50px 50px 0',
                  boxShadow: '6px 8px 16px rgba(0,0,0,0.08)'
                }} />
                {/* Design Wrapper */}
                <div style={{
                  position: 'absolute',
                  inset: '12px 24px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  background: '#f8fafc',
                  border: '1px solid rgba(0,0,0,0.06)'
                }}>
                  {/* Scaled Flat Preview inside cylindrical wrap */}
                  <div style={{
                    width: `${dims.w}px`,
                    height: `${dims.h}px`,
                    position: 'relative',
                    transform: `scale(${200 / dims.w})`,
                    transformOrigin: 'top left'
                  }}>
                    {canvasElements.map(el => (
                      <div key={el.id} style={{
                        position: 'absolute',
                        left: `${el.x}px`,
                        top: `${el.y}px`,
                        width: `${el.width}px`,
                        height: `${el.height}px`,
                        transform: `rotate(${el.rotation || 0}deg)`,
                        opacity: el.opacity ?? 1,
                        zIndex: el.zIndex
                      }}>
                        {el.type === 'text' && (
                          <div style={{ fontFamily: el.fontFamily, fontSize: `${el.fontSize}px`, color: el.color, textAlign: el.textAlign }}>{el.text}</div>
                        )}
                        {el.type === 'image' && <img src={el.src} alt="mug-media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        {el.type === 'shape' && <div style={{ width: '100%', height: '100%', borderRadius: el.shapeType === 'circle' ? '50%' : 0, background: el.fillColor }} />}
                        {el.type === 'sticker' && <span style={{ fontSize: '40px' }}>{el.src}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Cylinder shine light overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 25%, rgba(0,0,0,0.06) 50%, rgba(255,255,255,0.3) 80%, rgba(255,255,255,0.75) 100%)',
                  pointerEvents: 'none'
                }} />
              </div>
              <div className="text-xs font-bold text-muted">Cylindrical Mockup (Auto-calculated wrap)</div>
            </div>
          ) : (
            <div style={{
              width: `${dims.w}px`,
              height: `${dims.h}px`,
              background: '#ffffff',
              position: 'relative',
              boxShadow: '0 15px 35px rgba(0,0,0,0.12)',
              transform: `scale(${canvasScale})`,
              transition: 'transform 0.15s ease-out',
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.08)'
            }}>
              {/* Confetti / Vignette overlay block */}
              {activeOverlay && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: OVERLAYS.find(ov => ov.id === activeOverlay)?.color || 'transparent',
                  zIndex: 999, pointerEvents: 'none'
                }} />
              )}

              {/* Guidelines overlays */}
              {showSafe && (
                <div style={{ position: 'absolute', inset: '16px', border: '1px dashed rgba(23,28,98,0.25)', pointerEvents: 'none', zIndex: 1000 }} />
              )}

              {canvasElements.map(el => renderCanvasElement(el))}
            </div>
          )}
        </div>

        {/* Right Side Settings Inspector */}
        <div style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          <h3 className="font-bold text-xs" style={{ color: 'var(--primary)', textTransform: 'uppercase', margin: 0 }}>Properties Inspector</h3>

          {activeEl ? (
            <div className="flex flex-col gap-4">
              <div className="p-3" style={{ background: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                <div className="text-xxs text-muted">Selected layer:</div>
                <div className="text-xs font-bold capitalize">{activeEl.type} Element</div>
              </div>

              {/* OPACITY SLIDER */}
              <div>
                <label className="label text-xxs font-bold">Layer Opacity:</label>
                <input type="range" min="0" max="1" step="0.1" value={activeEl.opacity ?? 1} onChange={e => updateElementProps(activeEl.id, { opacity: parseFloat(e.target.value) })} />
              </div>

              {/* ROTATION SLIDER */}
              <div>
                <label className="label text-xxs font-bold">Rotate Degrees ({activeEl.rotation ?? 0}°):</label>
                <input type="range" min="0" max="360" value={activeEl.rotation ?? 0} onChange={e => updateElementProps(activeEl.id, { rotation: parseInt(e.target.value) })} />
              </div>

              {/* TEXT OPTIONS */}
              {activeEl.type === 'text' && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="label text-xxs font-bold">Text Content:</label>
                    <input type="text" className="input text-xs" value={activeEl.text || ''} onChange={e => updateElementProps(activeEl.id, { text: e.target.value })} />
                  </div>

                  <div>
                    <label className="label text-xxs font-bold">Font Family:</label>
                    <select className="input text-xs" value={activeEl.fontFamily || 'Outfit'} onChange={e => updateElementProps(activeEl.id, { fontFamily: e.target.value })}>
                      {['Outfit', 'Inter', 'Roboto', 'Playfair Display', 'Great Vibes', 'Lobster'].map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label text-xxs font-bold">Font Size ({activeEl.fontSize}px):</label>
                    <input type="range" min="12" max="64" value={activeEl.fontSize || 20} onChange={e => updateElementProps(activeEl.id, { fontSize: parseInt(e.target.value) })} />
                  </div>

                  <div className="grid grid-2 gap-2">
                    <div>
                      <label className="label text-xxs font-bold">Text Color:</label>
                      <input type="color" className="input" style={{ height: '36px', padding: '2px' }} value={activeEl.color || '#171C62'} onChange={e => updateElementProps(activeEl.id, { color: e.target.value })} />
                    </div>
                    <div>
                      <label className="label text-xxs font-bold">Gradient Color:</label>
                      <input type="color" className="input" style={{ height: '36px', padding: '2px' }} value={activeEl.gradientColor || '#FF304C'} onChange={e => updateElementProps(activeEl.id, { gradientColor: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className="text-xxs flex align-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={!!activeEl.isCurved} onChange={e => updateElementProps(activeEl.id, { isCurved: e.target.checked })} />
                      <span>Apply curved arc text</span>
                    </label>
                  </div>

                  <div>
                    <label className="label text-xxs font-bold">Character Spacing ({activeEl.letterSpacing ?? 0}px):</label>
                    <input type="range" min="0" max="15" value={activeEl.letterSpacing ?? 0} onChange={e => updateElementProps(activeEl.id, { letterSpacing: parseInt(e.target.value) })} />
                  </div>
                </div>
              )}

              {/* IMAGE FILTERS */}
              {activeEl.type === 'image' && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="label text-xxs font-bold">Crop Zoom (Scale):</label>
                    <input type="range" min="1" max="2.5" step="0.1" value={activeEl.width / 150} onChange={e => updateElementProps(activeEl.id, { width: 150 * parseFloat(e.target.value), height: 150 * parseFloat(e.target.value) })} />
                  </div>

                  <div>
                    <label className="label text-xxs font-bold">Brightness ({activeEl.brightness ?? 100}%):</label>
                    <input type="range" min="50" max="150" value={activeEl.brightness ?? 100} onChange={e => updateElementProps(activeEl.id, { brightness: parseInt(e.target.value) })} />
                  </div>

                  <div>
                    <label className="label text-xxs font-bold">Contrast ({activeEl.contrast ?? 100}%):</label>
                    <input type="range" min="50" max="150" value={activeEl.contrast ?? 100} onChange={e => updateElementProps(activeEl.id, { contrast: parseInt(e.target.value) })} />
                  </div>

                  <div>
                    <label className="label text-xxs font-bold">Blur ({activeEl.blur ?? 0}px):</label>
                    <input type="range" min="0" max="10" value={activeEl.blur ?? 0} onChange={e => updateElementProps(activeEl.id, { blur: parseInt(e.target.value) })} />
                  </div>

                  <div className="flex gap-4">
                    <label className="text-xxs flex align-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={!!activeEl.flipX} onChange={e => updateElementProps(activeEl.id, { flipX: e.target.checked })} />
                      <span>Flip Horizontal</span>
                    </label>
                    <label className="text-xxs flex align-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={!!activeEl.flipY} onChange={e => updateElementProps(activeEl.id, { flipY: e.target.checked })} />
                      <span>Flip Vertical</span>
                    </label>
                  </div>

                  <button className="btn btn-outline btn-sm w-full" onClick={runRemoveBg} disabled={removeBgLoading}>
                    {removeBgLoading ? (
                      <span>
                        <span className="spinner-border spinner-border-sm" style={{ marginRight: '6px' }} /> Removing background...
                      </span>
                    ) : (
                      <span>
                        <i className="bi bi-magic" /> Remove Image Background
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xxs text-muted style-italic">Select an element on canvas to edit properties.</div>
          )}
        </div>
      </div>

      {/* Bottom decision bar */}
      <div className="flex align-center justify-between p-4" style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div style={{ flex: 1, maxWidth: '460px' }}>
          <label className="label text-xxs font-bold" htmlFor="editor-comments">Review Feedback Comments:</label>
          <textarea
            id="editor-comments"
            className="textarea text-xs"
            rows={2}
            placeholder="Add correction instructions if requesting design revision..."
            value={commentsValue}
            onChange={e => onCommentsChange(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-outline btn-sm" onClick={() => onSaveProgress(canvasElements)}>
            <i className="bi bi-save" style={{ marginRight: '6px' }} /> Save Draft
          </button>
          <button className="btn btn-sm" style={{ background: 'var(--warning)', color: '#fff', border: 'none', padding: '0 1rem' }} onClick={onRequestReupload}>
            <i className="bi bi-cloud-upload" style={{ marginRight: '6px' }} /> Request Re-upload
          </button>
          <button className="btn btn-sm" style={{ background: 'var(--error)', color: '#fff', border: 'none', padding: '0 1rem' }} onClick={onReject}>
            <i className="bi bi-x-circle" style={{ marginRight: '6px' }} /> Reject (Correction Needed)
          </button>
          <button className="btn btn-sm" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '0 1rem' }} onClick={onApprove}>
            <i className="bi bi-check-circle" style={{ marginRight: '6px' }} /> Approve Design
          </button>
          <button className="btn btn-primary btn-sm" onClick={onApprove}>
            <i className="bi bi-printer" style={{ marginRight: '6px' }} /> Send to Printer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
