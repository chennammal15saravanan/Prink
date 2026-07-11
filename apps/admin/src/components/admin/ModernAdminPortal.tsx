import React, { useState } from 'react';
import type { AdminSection } from '../../types';
import AdminLayout from './AdminLayout';
import OverviewTab from './OverviewTab';
import OrdersTab from './OrdersTab';
import { INITIAL_ORDERS } from '../../mockData';

export default function ModernAdminPortal() {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);
  const [orders] = useState(INITIAL_ORDERS);

  const simulateWebhook = () => {
    setIsSimulatingWebhook(true);
    setTimeout(() => {
      setIsSimulatingWebhook(false);
      // Would normally fetch new orders here
    }, 1500);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewTab simulateWebhook={simulateWebhook} isSimulatingWebhook={isSimulatingWebhook} />;
      case 'orders':
        return <OrdersTab orders={orders} onSelectOrder={(o) => console.log('Select order', o)} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Module Under Construction</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              This module is currently being migrated to the new Tailwind CSS design system. Please check back later.
            </p>
          </div>
        );
    }
  };

  return (
    <AdminLayout 
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      onLogout={() => console.log('logout')}
    >
      {renderContent()}
    </AdminLayout>
  );
}
