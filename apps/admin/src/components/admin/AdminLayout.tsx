import React from 'react';
import { SECTIONS } from '../../mockData';
import { LogOut, Bell, UserCircle } from 'lucide-react';
import type { AdminSection } from '../../types';
import whiteLogo from '../../assets/logos/white-logo.png';
import mainLogo from '../../assets/logos/main-logo.png';
import * as Icons from 'lucide-react';

interface AdminLayoutProps {
  activeSection: AdminSection;
  setActiveSection: (section: AdminSection) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function AdminLayout({ activeSection, setActiveSection, onLogout, children }: AdminLayoutProps) {
  return (
    <div className="portal-layout font-sans text-gray-900 bg-gray-50 h-screen w-full flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0B0F33] text-gray-300 flex flex-col flex-shrink-0 transition-all duration-300 border-r border-[#1B215A]">
        <div className="h-20 flex items-center px-6 border-b border-[#1B215A]">
          <img src={whiteLogo} alt="Prink" className="h-8 object-contain" />
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
          <div className="px-6 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Main Menu</p>
          </div>
          <nav className="space-y-1">
            {SECTIONS.map((section) => {
              const IconComponent = (Icons as any)[section.icon] || Icons.Box;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors border-l-2 ${
                    isActive 
                      ? 'bg-[#1B215A]/50 text-white border-[#FF304C]' 
                      : 'border-transparent hover:bg-[#1B215A]/30 hover:text-white'
                  }`}
                >
                  <IconComponent size={20} className={isActive ? 'text-[#FF304C]' : 'text-gray-400'} />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[#1B215A]">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#1B215A]/30 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8F9FC]">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shadow-sm flex-shrink-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {SECTIONS.find(s => s.id === activeSection)?.label || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#FF304C] rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">Admin User</p>
                <p className="text-xs text-gray-500">System Administrator</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <UserCircle size={24} />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
