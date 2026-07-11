import type { Order, ActivityLog, TemplateItem, PrinterQueueItem, AdminSection } from './types';

export const INITIAL_ORDERS: Order[] = [
  { id: '#1042', customer: 'John Doe',    product: 'Coffee Mug Wrap',      productType: 'mug',      dpi: '300 DPI',  dpiStatus: 'ok',   uploadStatus: 'ready',    date: 'Jun 16, 2026', phone: '+91 98765 43210' },
  { id: '#1043', customer: 'Jane Smith',  product: 'Stretch Canvas 12A-16', productType: 'canvas',   dpi: '150 DPI',  dpiStatus: 'low',  uploadStatus: 'awaiting', date: 'Jun 16, 2026', phone: '+91 87654 32109' },
  { id: '#1044', customer: 'Robert Lee',  product: 'Stretch Canvas 12A-16', productType: 'canvas',   dpi: '300 DPI',  dpiStatus: 'ok',   uploadStatus: 'ready',    date: 'Jun 15, 2026', phone: '+91 76543 21098' },
  { id: '#1045', customer: 'Emily Davis', product: 'Coffee Mug Wrap',      productType: 'mug',      dpi: 'No Image', dpiStatus: 'none', uploadStatus: 'pending',  date: 'Jun 15, 2026', phone: '+91 65432 10987' },
  { id: '#1046', customer: 'Priya Singh', product: 'Photo Frame 8A-10',     productType: 'frame',    dpi: '300 DPI',  dpiStatus: 'ok',   uploadStatus: 'ready',    date: 'Jun 14, 2026', phone: '+91 54321 09876' },
  { id: '#1047', customer: 'Ravi Kumar',  product: 'Wall Calendar 2027',   productType: 'calendar', dpi: '72 DPI',   dpiStatus: 'low',  uploadStatus: 'awaiting', date: 'Jun 14, 2026', phone: '+91 43210 98765' },
];

export const ACTIVITY_LOG: ActivityLog[] = [
  { id: 'a1', action: 'New order #1048 synced from Shopify',    user: 'System',     timestamp: '2 min ago',  type: 'order'  },
  { id: 'a2', action: 'Jane Smith uploaded 3 photos for #1043', user: 'Jane Smith', timestamp: '14 min ago', type: 'upload' },
  { id: 'a3', action: 'Order #1042 PDF generated and queued',   user: 'Automation', timestamp: '28 min ago', type: 'print'  },
  { id: 'a4', action: 'AI upscaler processed #1047 to 300 DPI', user: 'AI Engine',  timestamp: '45 min ago', type: 'system' },
  { id: 'a5', action: 'Order #1044 routed to Printer Operator', user: 'Admin',      timestamp: '1 hr ago',   type: 'print'  },
  { id: 'a6', action: 'New Shopify webhook connected',           user: 'System',     timestamp: '2 hrs ago',  type: 'system' },
];

export const TEMPLATES: TemplateItem[] = [
  { id: 't1', name: 'Classic Mug Wrap',     productType: 'mug',       thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200', usageCount: 142, lastModified: 'Jun 15, 2026', tags: ['popular']  },
  { id: 't2', name: 'Ocean Canvas',         productType: 'canvas',    thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200', usageCount: 98,  lastModified: 'Jun 12, 2026', tags: ['new']      },
  { id: 't3', name: 'Portrait Frame',       productType: 'frame',     thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200', usageCount: 67,  lastModified: 'Jun 10, 2026', tags: []           },
  { id: 't4', name: '2027 Family Calendar', productType: 'calendar',  thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=200', usageCount: 34,  lastModified: 'Jun 8, 2026',  tags: ['seasonal'] },
  { id: 't5', name: 'Rose Photo Book',      productType: 'photobook', thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=200', usageCount: 23,  lastModified: 'Jun 5, 2026',  tags: []           },
];

export const INITIAL_QUEUE: PrinterQueueItem[] = [
  { id: '#1042', customer: 'John Doe',    product: 'Coffee Mug (11oz)', trimSize: '8.5"A-3.0"',    status: 'print-ready', priority: 'high',   assignedAt: '09:15 AM' },
  { id: '#1044', customer: 'Robert Lee',  product: 'Canvas 12A-16',      trimSize: '12.25"A-16.25"', status: 'processing',  priority: 'normal', assignedAt: '09:45 AM' },
  { id: '#1046', customer: 'Priya Singh', product: 'Photo Frame 8A-10',  trimSize: '8.25"A-10.25"',  status: 'pending',     priority: 'low',    assignedAt: '10:00 AM' },
];

export const SECTIONS: { id: AdminSection; icon: any; label: string }[] = [
  { id: 'overview',   icon: 'LayoutDashboard',      label: 'Overview'       },
  { id: 'orders',     icon: 'ShoppingCart',         label: 'Orders'         },
  { id: 'monitor',    icon: 'Activity',             label: 'Upload Monitor' },
  { id: 'templates',  icon: 'Image',                label: 'Templates'      },
  { id: 'sku-mappings', icon: 'Tags',               label: 'SKU Rules' },
  { id: 'users',      icon: 'Users',                label: 'User Management'},
  { id: 'queue',      icon: 'Printer',              label: 'Print Queue'    },
  { id: 'reports',    icon: 'BarChart3',            label: 'Reports'        },
  { id: 'workflow',   icon: 'GitCommit',            label: 'Workflow'       },
  { id: 'settings',   icon: 'Settings',             label: 'Settings'       },
];

