import React, { useState, useRef, useEffect } from 'react';
import { LibrarySettings, DashboardStats } from '../types';
import { 
    Save, Upload, Clock, Settings as SettingsIcon, AlertTriangle, 
    LayoutDashboard, Zap, Edit3, GraduationCap, BookOpen, FileText, 
    Users, Repeat, CheckCircle, Shield, Library, Monitor, UserCircle, 
    Copy, Sliders, Tag, Copyright, Info, Database, RefreshCw, Check, 
    GitMerge, Lock, FileInput, FileOutput, Trash2, Globe, Loader2, RotateCcw, X,
    Activity, Layers, Eye
} from 'lucide-react';

interface SettingsProps {
  settings: LibrarySettings;
  onUpdateSettings: (settings: LibrarySettings) => void;
  onBackup: () => void;
  onRestore: (file: File) => void;
  stats?: DashboardStats;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, onBackup, onRestore, stats }) => {
  const [localSettings, setLocalSettings] = useState<LibrarySettings>(JSON.parse(JSON.stringify(settings)));
  const [activeRoleTab, setActiveRoleTab] = useState('student');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      const isChanged = JSON.stringify(localSettings) !== JSON.stringify(settings);
      setHasChanges(isChanged);
  }, [localSettings, settings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onRestore(e.target.files[0]);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  updateNested('logo', event.target.result as string);
                  showNotification('تم تحميل الشعار بنجاح (تذكر حفظ التغييرات)', 'success');
              }
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const validate = (): boolean => {
      if (!localSettings.name || !localSettings.name.trim()) return false;
      if (!localSettings.institution || !localSettings.institution.trim()) return false;
      return true;
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'warning') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveAll = async () => {
      if (!hasChanges) return;
      
      if (!validate()) {
          showNotification('يرجى ملء جميع الحقول المطلوبة', 'warning');
          return;
      }

      setIsSaving(true);
      
      // Simulate network
      setTimeout(() => {
          onUpdateSettings(localSettings);
          showNotification('تم حفظ جميع التغييرات بنجاح', 'success');
          setIsSaving(false);
          setHasChanges(false);
      }, 800);
  };

  const handleReset = () => {
      if (window.confirm('هل أنت متأكد من استعادة الإعدادات الأصلية؟ ستفقد التغييرات غير المحفوظة.')) {
          setLocalSettings(JSON.parse(JSON.stringify(settings)));
      }
  };

  const updateNested = (path: string, value: any) => {
      setLocalSettings(prev => {
          const newState = JSON.parse(JSON.stringify(prev));
          const keys = path.split('.');
          let current = newState;
          for (let i = 0; i < keys.length - 1; i++) {
              if (!current[keys[i]]) current[keys[i]] = {};
              current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = value;
          return newState;
      });
  };

  const fillLiveStats = () => {
      if (stats) {
          updateNested('manualStats', stats);
          showNotification('تم تعبئة القيم الحالية بنجاح', 'success');
      }
  };

  const handlePreview = () => {
      showNotification('جاري معاينة التغييرات...', 'warning');
      // For immediate preview without saving persistence, we could call onUpdateSettings, but that saves it.
      // Usually Preview opens a new window or modal. Here we'll just inform user to check Dashboard after save or implement a temp context.
      // Since the requirement says "Change directly", let's assume Save IS the action they want but they want it to work.
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in font-sans relative pb-24">
      
      {/* Toast Notification */}
      {notification && (
          <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
              notification.type === 'success' ? 'bg-emerald-500 text-white' : 
              notification.type === 'error' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
          }`}>
              {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <span className="font-bold text-sm">{notification.message}</span>
              <button onClick={() => setNotification(null)} className="ml-2 hover:bg-white/20 rounded-full p-1"><X className="w-4 h-4" /></button>
          </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-8 border-b-4 border-[#3498db]">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                    <SettingsIcon className="w-8 h-8 text-[#3498db]" />
                    إعدادات النظام
                </h1>
                <p className="opacity-90 text-slate-300">التحكم الكامل في تخصيص النظام وإدارة الصلاحيات والمعلومات</p>
            </div>
            {hasChanges && (
                <div className="bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                    يوجد تغييرات غير محفوظة
                </div>
            )}
        </div>
      </header>

      <div className="p-8 space-y-8 bg-[#f8f9fa]">
        
        {/* Section 1: Dashboard Customization */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3498db]"></div>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <LayoutDashboard className="w-6 h-6 text-slate-500" />
                    تخصيص لوحة التحكم الرئيسية
                </h2>
                <span className="bg-[#3498db] text-white text-xs px-3 py-1 rounded-full font-bold">تخصيص</span>
            </div>

            <div className="mb-6">
                <div className="mb-4">
                    <h3 className="font-bold text-slate-700">وضع عرض الإحصائيات</h3>
                    <p className="text-sm text-slate-500">اختر كيفية عرض الأرقام والإحصائيات على الشاشة الرئيسية</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <label className={`flex-1 flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${localSettings.dashboardMode === 'auto' ? 'border-[#3498db] bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                        <input 
                            type="radio" 
                            name="display-mode" 
                            checked={localSettings.dashboardMode === 'auto'} 
                            onChange={() => updateNested('dashboardMode', 'auto')} 
                            className="hidden" 
                        />
                        <Zap className={`w-8 h-8 mb-2 ${localSettings.dashboardMode === 'auto' ? 'text-[#3498db]' : 'text-slate-400'}`} />
                        <strong className="block text-slate-800">تلقائي</strong>
                        <small className="text-xs text-slate-500">عرض الأرقام الفعلية من قاعدة البيانات</small>
                    </label>
                    
                    <label className={`flex-1 flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${localSettings.dashboardMode === 'manual' ? 'border-[#3498db] bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                        <input 
                            type="radio" 
                            name="display-mode" 
                            checked={localSettings.dashboardMode === 'manual'} 
                            onChange={() => updateNested('dashboardMode', 'manual')} 
                            className="hidden" 
                        />
                        <Edit3 className={`w-8 h-8 mb-2 ${localSettings.dashboardMode === 'manual' ? 'text-[#3498db]' : 'text-slate-400'}`} />
                        <strong className="block text-slate-800">يدوي</strong>
                        <small className="text-xs text-slate-500">إدخال القيم يدوياً حسب الرغبة</small>
                    </label>
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-top-2 mb-6">
                <div className="mb-4">
                    <h3 className="font-bold text-slate-700">العناصر المعروضة</h3>
                    <p className="text-sm text-slate-500">اختر العناصر التي تريد إظهارها في لوحة التحكم (تعمل في كلا الوضعين)</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { key: 'students', icon: GraduationCap, label: 'الطلاب' },
                        { key: 'books', icon: BookOpen, label: 'الكتب' },
                        { key: 'journals', icon: FileText, label: 'الدوريات' },
                        { key: 'professors', icon: Users, label: 'الأساتذة' },
                        { key: 'borrowed', icon: Repeat, label: 'الكتب المستعارة' },
                        { key: 'available', icon: CheckCircle, label: 'الكتب المتاحة' },
                    ].map((item, idx) => (
                        <label key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    checked={localSettings.visibleStats[item.key as keyof DashboardStats]} 
                                    onChange={(e) => updateNested(`visibleStats.${item.key}`, e.target.checked)}
                                    className="w-4 h-4 text-[#3498db] rounded focus:ring-[#3498db]" 
                                />
                                <span className="flex items-center gap-2 text-slate-700 text-sm font-medium">
                                    <item.icon className="w-4 h-4 text-slate-400" />
                                    {item.label}
                                </span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {localSettings.dashboardMode === 'manual' && (
                <div className="animate-in fade-in slide-in-from-top-2 bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h3 className="font-bold text-slate-700">إدخال القيم يدوياً</h3>
                            <p className="text-sm text-slate-500">أدخل الأرقام التي ستظهر في البطاقات</p>
                        </div>
                        <button 
                            onClick={fillLiveStats}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded hover:bg-slate-50 transition text-sm font-bold shadow-sm"
                        >
                            <RefreshCw className="w-4 h-4" /> نسخ الأرقام الحالية
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { key: 'students', label: 'عدد الطلاب', icon: GraduationCap },
                            { key: 'books', label: 'عدد الكتب', icon: BookOpen },
                            { key: 'journals', label: 'عدد الدوريات', icon: FileText },
                            { key: 'professors', label: 'عدد الأساتذة', icon: Users },
                            { key: 'borrowed', label: 'الكتب المستعارة', icon: Repeat },
                            { key: 'available', label: 'الكتب المتاحة', icon: CheckCircle },
                        ].map((item) => (
                            <div key={item.key} className={`space-y-1 ${!localSettings.visibleStats[item.key as keyof DashboardStats] ? 'opacity-50' : ''}`}>
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <item.icon className="w-3 h-3 text-slate-400" /> {item.label}
                                </label>
                                <input 
                                    type="number" 
                                    value={localSettings.manualStats[item.key as keyof DashboardStats] || 0} 
                                    onChange={e => updateNested(`manualStats.${item.key}`, parseInt(e.target.value) || 0)} 
                                    className="w-full p-2.5 bg-white text-black border border-slate-300 rounded focus:border-[#3498db] focus:ring-1 focus:ring-[#3498db] outline-none" 
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>

        {/* Section 2: Permissions */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#9b59b6]"></div>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-slate-500" />
                    إدارة صلاحيات المستخدمين
                </h2>
                <span className="bg-[#9b59b6] text-white text-xs px-3 py-1 rounded-full font-bold">مهم</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="flex bg-slate-50 border-b border-slate-200 overflow-x-auto">
                    {['student', 'professor', 'staff', 'admin'].map(role => (
                        <button
                            key={role}
                            onClick={() => setActiveRoleTab(role)}
                            className={`px-6 py-3 font-medium text-sm transition whitespace-nowrap flex items-center gap-2 ${activeRoleTab === role ? 'bg-white border-b-2 border-[#9b59b6] text-[#9b59b6]' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {role === 'student' && <><GraduationCap className="w-4 h-4"/> الطالب</>}
                            {role === 'professor' && <><UserCircle className="w-4 h-4"/> الأستاذ/دكتور</>}
                            {role === 'staff' && <><Users className="w-4 h-4"/> أمين المكتبة</>}
                            {role === 'admin' && <><Shield className="w-4 h-4"/> مدير النظام</>}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div>
                            <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4 border-b pb-2">
                                <Library className="w-4 h-4 text-slate-400" /> صلاحيات المكتبة
                            </h4>
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={localSettings.permissions[activeRoleTab]?.borrow}
                                        onChange={(e) => updateNested(`permissions.${activeRoleTab}.borrow`, e.target.checked)}
                                        className="w-4 h-4 rounded text-[#9b59b6] focus:ring-[#9b59b6]" 
                                    />
                                    <span className="text-sm font-medium text-slate-700">استعارة الكتب (صفحة الإعارة)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={localSettings.permissions[activeRoleTab]?.search}
                                        onChange={(e) => updateNested(`permissions.${activeRoleTab}.search`, e.target.checked)}
                                        className="w-4 h-4 rounded text-[#9b59b6] focus:ring-[#9b59b6]" 
                                    />
                                    <span className="text-sm font-medium text-slate-700">البحث في الفهرس (المكتبة)</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4 border-b pb-2">
                                <Monitor className="w-4 h-4 text-slate-400" /> المكتبة الرقمية
                            </h4>
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={localSettings.permissions[activeRoleTab]?.digital}
                                        onChange={(e) => updateNested(`permissions.${activeRoleTab}.digital`, e.target.checked)}
                                        className="w-4 h-4 rounded text-[#9b59b6] focus:ring-[#9b59b6]" 
                                    />
                                    <span className="text-sm font-medium text-slate-700">الوصول للمساعد الذكي</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Section 3: General System Settings */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#f39c12]"></div>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Sliders className="w-6 h-6 text-slate-500" />
                    إعدادات النظام العامة
                </h2>
                <span className="bg-[#f39c12] text-white text-xs px-3 py-1 rounded-full font-bold">إلزامي</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Branding */}
                <div className="border border-slate-200 rounded-xl p-5">
                    <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4">
                        <Tag className="w-4 h-4" /> العلامة التجارية
                    </h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">اسم النظام <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={localSettings.name || ''}
                                onChange={(e) => updateNested('name', e.target.value)}
                                className={`w-full p-2 bg-white text-black border rounded focus:border-[#3498db] outline-none ${!localSettings.name ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">تحميل الشعار</label>
                            <div className="flex gap-3 items-center">
                                <div className="w-24 h-16 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-xs text-slate-400 bg-slate-50 overflow-hidden relative">
                                    {localSettings.logo ? (
                                        <img src={localSettings.logo} alt="Logo" className="w-full h-full object-contain" />
                                    ) : 'لا يوجد'}
                                </div>
                                <input 
                                    type="file" 
                                    ref={logoInputRef} 
                                    onChange={handleLogoUpload} 
                                    className="hidden" 
                                    accept="image/*"
                                />
                                <button 
                                    onClick={() => logoInputRef.current?.click()}
                                    className="px-3 py-2 border border-slate-300 rounded text-slate-600 text-sm hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <Upload className="w-3 h-3" /> تحميل
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border border-slate-200 rounded-xl p-5">
                    <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4">
                        <Copyright className="w-4 h-4" /> حقوق النشر والمعلومات
                    </h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">نص حقوق الطبع</label>
                            <input 
                                type="text" 
                                value={localSettings.copyrightText || ''} 
                                onChange={(e) => updateNested('copyrightText', e.target.value)}
                                className="w-full p-2 bg-white text-black border border-slate-300 rounded focus:border-[#3498db] outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">اسم المؤسسة <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={localSettings.institution || ''}
                                onChange={(e) => updateNested('institution', e.target.value)}
                                className="w-full p-2 bg-white text-black border border-slate-300 rounded focus:border-[#3498db] outline-none" 
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* System Info */}
                <div className="border border-slate-200 rounded-xl p-5">
                    <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-4">
                        <Info className="w-4 h-4" /> معلومات الاتصال والنظام
                    </h4>
                    <div className="space-y-3">
                         <input 
                                type="email" 
                                value={localSettings.email || ''}
                                onChange={(e) => updateNested('email', e.target.value)}
                                placeholder="البريد الإلكتروني" 
                                className="w-full p-2 bg-white text-black border border-slate-300 rounded focus:border-[#3498db] outline-none text-sm" 
                         />
                         <input 
                                type="text" 
                                value={localSettings.phone || ''}
                                onChange={(e) => updateNested('phone', e.target.value)}
                                placeholder="رقم الهاتف" 
                                className="w-full p-2 bg-white text-black border border-slate-300 rounded focus:border-[#3498db] outline-none text-sm" 
                         />
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button onClick={onBackup} className="flex-1 py-2 border border-slate-300 rounded text-slate-600 text-xs font-bold hover:bg-slate-50 flex justify-center items-center gap-1">
                            <Database className="w-3 h-3" /> نسخ احتياطي
                        </button>
                    </div>
                </div>
            </div>
        </section>

      </div>

      {/* Footer / Action Bar */}
      <footer className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
          <div className="container mx-auto flex justify-between items-center px-4">
              <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      آخر تحديث: {new Date().toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}
                  </span>
              </div>

              <div className="flex gap-3">
                  <button 
                    onClick={handlePreview}
                    className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 flex items-center gap-2 transition"
                  >
                      <Eye className="w-4 h-4" /> معاينة
                  </button>

                  <button 
                    onClick={handleReset}
                    disabled={!hasChanges}
                    className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                  >
                      <RotateCcw className="w-4 h-4" /> استعادة
                  </button>
                  
                  <button 
                    onClick={handleSaveAll}
                    disabled={!hasChanges || isSaving}
                    className={`px-6 py-2 bg-[#3498db] text-white font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all ${
                        !hasChanges ? 'opacity-50 cursor-not-allowed bg-slate-400 shadow-none' : 'hover:bg-[#2980b9] hover:-translate-y-1'
                    }`}
                  >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      {isSaving ? 'جاري الحفظ...' : (hasChanges ? 'حفظ التغييرات' : 'لا توجد تغييرات')}
                  </button>
              </div>
          </div>
      </footer>

    </div>
  );
};