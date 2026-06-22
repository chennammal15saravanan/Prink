import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import type { Order, PortalType, PrinterQueueItem } from './types';
import { ToastProvider, useToast } from './context/ToastContext';
import Header from './components/Header';
import CommandPalette from './components/CommandPalette';
import CustomerPortal from './components/CustomerPortal';
import AdminPortal from './components/AdminPortal';
import PrinterPortal from './components/PrinterPortal';

function AppContent() {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Printer portal receives orders routed from Admin
  const [printerQueue, setPrinterQueue] = useState<PrinterQueueItem[]>([]);

  // Compute active portal from route pathname
  const getActivePortal = (): PortalType => {
    const path = location.pathname;
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/printer')) return 'printer';
    return 'customer';
  };

  const activePortal = getActivePortal();

  // Global Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleNavigate = (portal: PortalType) => {
    setIsPaletteOpen(false);
    if (portal === 'customer') {
      navigate('/');
    } else {
      navigate(`/${portal}`);
    }
  };

  const handleRouteToPrinter = (order: Order) => {
    const item: PrinterQueueItem = {
      id: order.id,
      customer: order.customer,
      product: order.product,
      trimSize: order.product.toLowerCase().includes('mug') ? '8.5" x 3.0"' : '12.25" x 16.25"',
      status: 'print-ready',
      priority: 'normal',
      assignedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setPrinterQueue(prev => {
      const exists = prev.find(i => i.id === order.id);
      return exists ? prev : [...prev, item];
    });
    navigate('/printer');
    setTimeout(() => showToast(`Order ${order.id} synced with Printer Operator queue.`, 'success'), 1100);
  };

  return (
    <div className="app-container">
      <Header activePortal={activePortal} />

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<CustomerPortal />} />
          <Route path="/customer" element={<CustomerPortal />} />
          <Route
            path="/admin"
            element={
              <AdminPortal onRouteToPrinter={handleRouteToPrinter} />
            }
          />
          <Route
            path="/printer"
            element={<PrinterPortal extraItems={printerQueue} />}
          />
        </Routes>
      </main>

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </ToastProvider>
  );
}
