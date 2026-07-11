import React from 'react';
import { ToastProvider } from './context/ToastContext';
import PrinterPortal from './components/PrinterPortal';

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1">
        <PrinterPortal />
      </main>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
