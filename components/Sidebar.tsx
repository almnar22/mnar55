import React from 'react';
import { Page, User, LibrarySettings } from '../types';
import { LayoutDashboard, BookOpen, Repeat, Sparkles, Library, LogOut, Users, UserCircle, Layers, Settings } from 'lucide-react';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  currentUser: User;
  onLogout: () => void;
  settings: LibrarySettings;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, currentUser, onLogout, settings }) => {
  const isAdmin = currentUser.role === 'admin';
  const rolePermissions = settings.permissions[currentUser.role] || {};

  const navItems = [
    { id: Page.DASHBOARD, label: 'لوحة التحكم', icon: LayoutDashboard, visible: isAdmin },
    // Catalog requires 'search' permission
    { id: Page.CATALOG, label: 'المكتبة الورقية', icon: BookOpen, visible: rolePermissions.search !== false }, 
    // Lending requires 'borrow' permission
    { id: Page.LENDING, label: isAdmin ? 'الإعارة والاسترجاع' : 'كتبي واستعاراتي', icon: Repeat, visible: rolePermissions.borrow !== false },
    { id: Page.SPECIALIZATIONS, label: 'إدارة التخصصات', icon: Layers, visible: isAdmin },
    { id: Page.USERS, label: 'المستخدمين', icon: Users, visible: isAdmin },
    // AI Assistant requires 'digital' permission
    { id: Page.AI_ASSISTANT, label: 'المساعد الذكي', icon: Sparkles, visible: rolePermissions.digital !== false },
    { id: Page.SETTINGS, label: 'إعدادات النظام', icon: Settings, visible: isAdmin },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col shadow-xl z-20 transition-all duration-300 no-print">
      <div className="p-6 flex items-center gap-3 border-b border-slate-700">
        <div className="bg-primary-500 p-2 rounded-lg shrink-0">
          <Library className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold truncate">{settings.name || 'النظام الجامعي'}</h1>
          <p className="text-xs text-slate-400">نظام الإدارة الجامعي</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          if (!item.visible) return null;
          
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-4">
        <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <UserCircle className="w-6 h-6 text-slate-400" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                </div>
            </div>
            
            <div className="flex items-center justify-between mb-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
               <span>الدور الحالي</span>
               {isAdmin ? (
                 <span className="text-emerald-400">أمين مكتبة</span>
               ) : (
                 <span className="text-blue-400">طالب</span>
               )}
            </div>

            <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 text-xs bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 py-2 rounded-lg transition"
            >
                <LogOut className="w-3 h-3" />
                تسجيل خروج
            </button>
        </div>
      </div>
    </aside>
  );
};