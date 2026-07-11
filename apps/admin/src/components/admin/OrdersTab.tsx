import React from 'react';
import type { Order } from '../../types';
import { Search, Filter, MoreVertical, Eye, Printer, Edit3 } from 'lucide-react';

interface OrdersTabProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

export default function OrdersTab({ orders, onSelectOrder }: OrdersTabProps) {
  const StatusPill = ({ status }: { status: string }) => {
    let color = 'bg-gray-100 text-gray-800';
    if (status === 'completed' || status === 'print-ready' || status === 'ready' || status === 'ok') {
      color = 'bg-green-100 text-green-800';
    } else if (status === 'in-progress' || status === 'processing' || status === 'awaiting') {
      color = 'bg-blue-100 text-blue-800';
    } else if (status === 'low' || status === 'pending') {
      color = 'bg-orange-100 text-orange-800';
    } else if (status === 'none') {
      color = 'bg-red-100 text-red-800';
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${color}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
      </div>

      <div className="saas-card !p-0 overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by ID, Customer..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
          </div>
          <button className="btn btn-outline flex items-center gap-2 bg-white">
            <Filter size={16} />
            Filters
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">DPI Status</th>
                <th className="px-6 py-4">Design Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-gray-900">{order.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{(order.customer || 'Guest')}</div>
                    <div className="text-xs text-gray-500">{order.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{order.product}</div>
                    <div className="text-xs text-gray-500">{order.productType}</div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={order.dpiStatus} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={order.uploadStatus} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onSelectOrder(order)}
                        className="p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        title="Review Design"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Force Print PDF"
                      >
                        <Printer size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
          <div>Showing 1 to {orders.length} of {orders.length} entries</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 bg-primary text-white rounded">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

