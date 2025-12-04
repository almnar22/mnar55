import React, { useState, useEffect } from 'react';
import { Book, Loan, User, LibrarySettings, DashboardStats } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Users, Bell, BookA, GraduationCap, Globe, Library, Repeat, AlertTriangle, Clock, LogIn, Plus, CheckCircle, ArrowRightLeft } from 'lucide-react';

interface DashboardProps {
  books: Book[];
  loans: Loan[];
  users: User[];
  notifications: string[];
  settings: LibrarySettings;
}

export const Dashboard: React.FC<DashboardProps> = ({ books, loans, users, notifications, settings }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // --- Calculation Logic (Auto Mode) ---
  const calculatedStats: DashboardStats = {
      students: new Set(loans.map(l => l.userId)).size, // Beneficiary Students roughly or total students? Let's use total students for consistency with labels
      books: books.length,
      journals: books.filter(b => 
        b.specialization.includes('دوريات') || 
        b.specialization.includes('مجلة') || 
        b.title.includes('مجلة') ||
        b.department.includes('دوريات')
      ).length,
      professors: users.filter(u => u.role === 'professor' || u.role === 'staff').length, // Grouping staff/professors
      borrowed: loans.filter(l => l.status === 'active' || l.status === 'overdue').length,
      available: books.reduce((sum, b) => sum + b.remainingCopies, 0)
  };

  // Adjust students count to be total users with student role for better accuracy in auto mode
  calculatedStats.students = users.filter(u => u.role === 'student').length;

  // Determine which stats to use
  const statsToDisplay = settings.dashboardMode === 'manual' ? settings.manualStats : calculatedStats;

  // --- Dictionaries (Extra stat not in DashboardStats interface but kept for visuals if needed, using calculated)
  const dictionariesCount = books.filter(b => 
    b.specialization.includes('قواميس') || 
    b.specialization.includes('معاجم') || 
    b.title.includes('قاموس') || 
    b.title.includes('معجم')
  ).length;

  const totalUsers = users.length;
  const totalVisits = users.reduce((acc, user) => acc + (user.visits || 0), 0);
  const overdueLoans = loans.filter(l => l.status === 'overdue');
  const overdueCount = overdueLoans.length;

  const specializations = Array.from(new Set(books.map(b => b.specialization)));
  
  // Mapping keys to Icon and Color
  const statConfig = {
      students: { label: 'الطلاب', icon: GraduationCap, color: 'bg-gradient-to-br from-[#4CAF50] to-[#2E7D32]', sub: 'عدد الطلاب المسجلين', border: 'border-t-[#4CAF50]' },
      books: { label: 'الكتب', icon: Library, color: 'bg-gradient-to-br from-[#4A90E2] to-[#2C6FB7]', sub: 'إجمالي الكتب', border: 'border-t-[#4A90E2]' },
      journals: { label: 'الدوريات', icon: Globe, color: 'bg-gradient-to-br from-purple-500 to-purple-700', sub: 'مجلة ودورية', border: 'border-t-purple-500' },
      professors: { label: 'الأساتذة', icon: Users, color: 'bg-gradient-to-br from-blue-500 to-blue-700', sub: 'أعضاء الهيئة', border: 'border-t-blue-500' },
      borrowed: { label: 'الإعارات', icon: Repeat, color: 'bg-gradient-to-br from-[#FFA726] to-[#F57C00]', sub: 'كتب مستعارة', border: 'border-t-[#FFA726]' },
      available: { label: 'المتاح', icon: CheckCircle, color: 'bg-gradient-to-br from-teal-500 to-teal-700', sub: 'نسخ متوفرة', border: 'border-t-teal-500' },
  };

  // Filter visible stats
  const visibleStatsList = (Object.keys(statConfig) as Array<keyof typeof statConfig>).filter(key => settings.visibleStats[key]);

  // Quick Stats (Section 1 - Dynamic)
  const quickStats = visibleStatsList.map(key => ({
      ...statConfig[key],
      value: statsToDisplay[key]
  }));

  // Extra fixed stats (Section 2 - Keeping these as fixed extras or could be dynamic too)
  const additionalStats = [
    { label: 'الزيارات', value: totalVisits, icon: LogIn, color: 'bg-gradient-to-br from-cyan-500 to-cyan-700', sub: 'عملية دخول', border: 'border-t-cyan-500' },
    { label: 'متأخرة', value: overdueCount, icon: AlertTriangle, color: 'bg-gradient-to-br from-[#F44336] to-[#C62828]', sub: 'كتب', border: 'border-t-[#F44336]' },
    { label: 'المستخدمين', value: totalUsers, icon: Users, color: 'bg-gradient-to-br from-indigo-500 to-indigo-700', sub: 'حساب مسجل', border: 'border-t-indigo-500' },
    { label: 'القواميس', value: dictionariesCount, icon: BookA, color: 'bg-gradient-to-br from-lime-500 to-lime-700', sub: 'قاموس ومعجم', border: 'border-t-lime-500' },
  ];

  // Prepare Chart Data
  const specData = specializations.map(spec => ({
    name: spec,
    value: books.filter(b => b.specialization === spec).length
  })).filter(d => d.value > 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4ecdc4'];

  const loanTrendData = [
    { name: 'السبت', loans: 4 },
    { name: 'الأحد', loans: 7 },
    { name: 'الاثنين', loans: 12 },
    { name: 'الثلاثاء', loans: 9 },
    { name: 'الأربعاء', loans: 15 },
    { name: 'الخميس', loans: 6 },
    { name: 'الجمعة', loans: 2 },
  ];

  const getDaysOverdue = (dueDate: string) => {
    const diff = new Date().getTime() - new Date(dueDate).getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-8">
      
      {/* Header */}
      <header className="bg-gradient-to-br from-[#4A90E2] to-[#2C6FB7] text-white p-8 rounded-2xl shadow-lg shadow-blue-500/20 text-center mb-8">
        <div className="flex justify-center mb-4">
            {settings.logo && <img src={settings.logo} alt="Logo" className="h-20 bg-white/10 rounded-lg p-2 backdrop-blur-sm" />}
        </div>
        <h1 className="text-3xl font-bold mb-2">📊 {settings.name || 'لوحة تحكم نظام إدارة المكتبة'}</h1>
        <p className="opacity-90 text-blue-100">{settings.institution}</p>
      </header>

      {/* Notifications Area */}
      {notifications.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 shadow-sm">
              <h4 className="flex items-center gap-2 text-amber-800 font-bold mb-2">
                  <Bell className="w-5 h-5" />
                  تنبيهات النظام
              </h4>
              <ul className="space-y-2">
                  {notifications.map((note, idx) => (
                      <li key={idx} className="text-sm text-amber-700 flex items-center gap-2 bg-white/50 p-2 rounded-lg">
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                          {note}
                      </li>
                  ))}
              </ul>
          </div>
      )}

      {/* Section 1: Configurable Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`bg-white p-6 rounded-2xl shadow-sm border-t-4 ${stat.border} hover:-translate-y-1 transition-transform duration-300 flex items-center gap-4`}>
              <div className={`${stat.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0`}>
                <Icon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-800">{stat.value.toLocaleString()}</h3>
                <p className="text-slate-500 font-medium">{stat.label}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section 2: Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {additionalStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`bg-white p-6 rounded-2xl shadow-sm border-t-4 ${stat.border} hover:-translate-y-1 transition-transform duration-300 flex items-center gap-4`}>
              <div className={`${stat.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0`}>
                <Icon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-800">{stat.value.toLocaleString()}</h3>
                <p className="text-slate-500 font-medium">{stat.label}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Loans */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
             <h3 className="text-xl font-bold text-[#2C6FB7] flex items-center gap-2">
               <span className="text-2xl">📈</span> حركة الإعارة الشهرية
             </h3>
             <span className="bg-slate-50 text-slate-500 text-xs px-3 py-1.5 rounded-lg font-medium">إحصائيات شهر {new Date().toLocaleDateString('ar-EG', { month: 'long' })}</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loanTrendData}>
                <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                  cursor={{fill: '#f1f5f9'}}
                />
                <Bar dataKey="loans" fill="#4A90E2" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Specialization Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
             <h3 className="text-xl font-bold text-[#2C6FB7] flex items-center gap-2">
               <span className="text-2xl">🎯</span> توزيع الكتب حسب التخصص
             </h3>
             <span className="bg-slate-50 text-slate-500 text-xs px-3 py-1.5 rounded-lg font-medium">النسب المئوية</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={specData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {specData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 4: Activities & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Activities */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <span className="text-2xl">⏰</span>
                <h3 className="text-xl font-bold text-[#2C6FB7]">الأنشطة الأخيرة</h3>
            </div>
            
            <ul className="space-y-0">
                {/* Real Recent Loans */}
                {loans.slice(-3).reverse().map((loan, idx) => (
                     <li key={loan.id || idx} className="flex gap-4 py-4 border-b border-slate-100 last:border-0">
                        <div className="w-10 h-10 rounded-full bg-[#4CAF50] text-white flex items-center justify-center shrink-0">
                            <ArrowRightLeft className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm">عملية نشطة</h4>
                            <p className="text-sm text-slate-500">الطالب "{loan.studentName}" استعار "{loan.bookTitle}"</p>
                            <span className="text-xs text-slate-400 mt-1 block">{new Date(loan.issueDate).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </li>
                ))}

                 <li className="flex gap-4 py-4 border-b border-slate-100 last:border-0">
                    <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0">
                        <LogIn className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">تسجيل دخول</h4>
                        <p className="text-sm text-slate-500">تم تسجيل دخول مستخدم للنظام</p>
                        <span className="text-xs text-slate-400 mt-1 block">{new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                </li>
            </ul>
        </div>

        {/* Overdue Books */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <span className="text-2xl">⚠️</span>
                <h3 className="text-xl font-bold text-[#2C6FB7]">الكتب المتأخرة عن موعد الاسترجاع</h3>
            </div>

            <ul className="space-y-0">
                {overdueLoans.length > 0 ? (
                    overdueLoans.slice(0, 5).map(loan => (
                        <li key={loan.id} className="flex gap-4 py-4 border-b border-slate-100 last:border-0">
                            <div className="w-10 h-10 rounded-full bg-[#F44336] text-white flex items-center justify-center shrink-0">
                                <BookA className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-slate-800 text-sm">{loan.bookTitle}</h4>
                                    <span className="bg-[#F44336] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        تأخر {getDaysOverdue(loan.dueDate)} يوم
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 mt-1">الطالب: {loan.studentName}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-slate-400">تاريخ الاستحقاق: {new Date(loan.dueDate).toLocaleDateString('ar-EG')}</span>
                                </div>
                            </div>
                        </li>
                    ))
                ) : (
                    <li className="py-8 text-center text-slate-500 flex flex-col items-center">
                        <CheckCircle className="w-12 h-12 text-emerald-200 mb-2" />
                        <p>ممتاز! لا توجد كتب متأخرة حالياً</p>
                    </li>
                )}
            </ul>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center pt-8 mt-8 border-t border-slate-200 text-slate-500 text-sm">
        <p className="font-bold mb-1">{settings.copyrightText}</p>
        <p dir="ltr">
            آخر تحديث: {currentTime.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </footer>
    </div>
  );
};