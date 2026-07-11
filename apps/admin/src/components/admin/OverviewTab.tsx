import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Package, TrendingUp, Users, DollarSign, Activity, Settings, RefreshCw } from 'lucide-react';
import { INITIAL_ORDERS, ACTIVITY_LOG } from '../../mockData';

const salesData = [
  { name: 'Jul', sales: 4000, orders: 240 },
  { name: 'Aug', sales: 3000, orders: 139 },
  { name: 'Sep', sales: 2000, orders: 980 },
  { name: 'Oct', sales: 2780, orders: 390 },
  { name: 'Nov', sales: 1890, orders: 480 },
  { name: 'Dec', sales: 2390, orders: 380 },
  { name: 'Jan', sales: 3490, orders: 430 },
];

export default function OverviewTab({ simulateWebhook, isSimulatingWebhook }: { simulateWebhook: () => void, isSimulatingWebhook: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-500 text-sm">Today - {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={simulateWebhook}
            disabled={isSimulatingWebhook}
            className="btn btn-outline flex items-center gap-2"
          >
            <RefreshCw size={16} className={isSimulatingWebhook ? 'animate-spin' : ''} />
            Sync Shopify Orders
          </button>
          <button className="btn btn-primary">Generate All PDFs</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Purchases', value: '150', icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Pending Customization', value: '146', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Print Ready (Approved)', value: '20', icon: Package, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Requires Client Revision', value: '0', icon: Users, color: 'text-red-500', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className="saas-card !p-6 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="saas-card lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue & Order Volume</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF304C" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#FF304C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#FF304C" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Log */}
        <div className="saas-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-primary font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-6">
            {ACTIVITY_LOG.map((log) => (
              <div key={log.id} className="flex gap-4 relative">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0 z-10 relative">
                  <div className="absolute -inset-1 rounded-full bg-primary/20 animate-ping"></div>
                </div>
                {/* Vertical line connecting timeline */}
                <div className="absolute left-1 top-4 bottom-[-24px] w-px bg-gray-100 z-0 last:hidden"></div>
                
                <div>
                  <p className="text-sm text-gray-900 font-medium">{log.action}</p>
                  <div className="flex gap-2 text-xs text-gray-500 mt-1">
                    <span>{log.user}</span>
                    <span>•</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
