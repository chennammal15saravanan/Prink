// =========================================================================
// THE PRINK — Shared TypeScript Types (Expanded)
// =========================================================================

export type PortalType = 'customer' | 'admin' | 'printer';
export type CustomerSubView = 'upload' | 'preview' | 'tracking' | 'drafts';
export type AdminSection = 'overview' | 'orders' | 'monitor' | 'templates' | 'queue' | 'reports' | 'settings' | 'workflow';
export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type CropMaskType = 'circle' | 'square' | 'rect';
export type ProductType = 'mug' | 'canvas' | 'frame' | 'calendar' | 'photobook';
export type DpiStatus = 'ok' | 'low' | 'none';
export type UploadStatus = 'ready' | 'awaiting' | 'pending';
export type PrintStatus = 'pending' | 'processing' | 'print-ready' | 'completed';
export type Priority = 'high' | 'normal' | 'low';
export type UploadMethod = 'file' | 'camera' | 'cloud';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface UploadedImage {
  id: string;
  src: string;
  name: string;
}

export interface PrintTheme {
  id: string;
  name: string;
  bg: string;
  accent: string;
  preview: string[];
}

export interface Order {
  id: string;
  customer: string;
  product: string;
  productType: ProductType;
  dpi: string;
  dpiStatus: DpiStatus;
  uploadStatus: UploadStatus;
  date: string;
  phone?: string;
}

export interface PrinterQueueItem {
  id: string;
  customer: string;
  product: string;
  trimSize: string;
  status: PrintStatus;
  priority: Priority;
  assignedAt: string;
}

export interface TemplateItem {
  id: string;
  name: string;
  productType: ProductType;
  thumbnail: string;
  usageCount: number;
  lastModified: string;
  tags: string[];
}

export interface TrackingEvent {
  label: string;
  description: string;
  active: boolean;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  type: 'order' | 'upload' | 'print' | 'system';
}
