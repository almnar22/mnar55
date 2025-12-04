import React, { useState } from 'react';
import { User } from '../types';
import { 
  Library, Lock, User as UserIcon, LogIn, AlertCircle, 
  CheckCircle, Search, ArrowRightLeft, BarChart3, BookOpen,
  Building2, Globe
} from 'lucide-react';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  libraryName: string;
}

export const Login: React.FC<LoginProps> = ({ users, onLogin, libraryName }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay for effect
    setTimeout(() => {
        const user = users.find(u => u.id === id && u.password === password);

        if (user) {
        if (user.status === 'suspended') {
            setError('تم إيقاف هذا الحساب. يرجى مراجعة إدارة المكتبة.');
            setLoading(false);
            return;
        }
        onLogin(user);
        } else {
        setError('بيانات الدخول غير صحيحة');
        setLoading(false);
        }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center p-4 font-sans" dir="rtl">
        {/* Main Card */}
        <div className="w-full max-w-[1200px] min-h-[700px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Side - Hero */}
            <div className="md:w-1/2 bg-gradient-to-br from-[#4A90E2] to-[#2C6FB7] relative overflow-hidden p-12 text-white flex flex-col justify-center">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <Library className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">IIN</h1>
                            <p className="opacity-90">{libraryName}</p>
                        </div>
                    </div>

                    <h2 className="text-4xl font-bold leading-tight mb-6">نظام إدارة المكتبة المتكامل</h2>
                    <p className="text-lg opacity-90 mb-10 leading-relaxed">
                        بوابة الوصول إلى جميع خدمات المكتبة الرقمية، إدارة الإعارة، 
                        البحث المتقدم، والموارد التعليمية في مكان واحد
                    </p>

                    <ul className="space-y-6">
                        <li className="flex items-center gap-4 text-lg">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <span>وصول سريع إلى آلاف الكتب الرقمية</span>
                        </li>
                        <li className="flex items-center gap-4 text-lg">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <Search className="w-5 h-5" />
                            </div>
                            <span>بحث متقدم في فهارس المكتبة</span>
                        </li>
                        <li className="flex items-center gap-4 text-lg">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <ArrowRightLeft className="w-5 h-5" />
                            </div>
                            <span>إدارة إعارة الكتب إلكترونياً</span>
                        </li>
                        <li className="flex items-center gap-4 text-lg">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <span>تقارير وإحصائيات مفصلة</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-center">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-[#2C6FB7] mb-2">تسجيل الدخول للنظام</h2>
                    <p className="text-slate-500">أدخل بيانات الدخول للوصول إلى حسابك</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border-r-4 border-red-500 p-4 rounded-lg flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto w-full">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-[#2C6FB7]">
                            <UserIcon className="w-4 h-4" />
                            رقم الهوية / الرقم الجامعي
                        </label>
                        <div className="relative group">
                            <input 
                                type="text"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                className="w-full pl-4 pr-12 py-4 rounded-xl border-2 border-slate-200 focus:border-[#4A90E2] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-800 font-medium"
                                placeholder="أدخل رقم المستخدم"
                                required
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#4A90E2] transition-colors">
                                <span className="text-lg font-bold">#</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400">أدخل رقم الهوية أو الرقم الجامعي المسجل في النظام</p>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-[#2C6FB7]">
                            <Lock className="w-4 h-4" />
                            كلمة المرور
                        </label>
                        <div className="relative group">
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-4 pr-12 py-4 rounded-xl border-2 border-slate-200 focus:border-[#4A90E2] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-800 font-medium"
                                placeholder="••••••••"
                                required
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#4A90E2] transition-colors">
                                <Lock className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${rememberMe ? 'bg-[#4A90E2] border-[#4A90E2]' : 'border-slate-300 bg-white group-hover:border-[#4A90E2]'}`}>
                                {rememberMe && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                            <span className="text-sm text-slate-500 group-hover:text-[#4A90E2] transition-colors">تذكر بيانات الدخول</span>
                        </label>
                        <button type="button" className="text-sm font-bold text-[#4A90E2] hover:text-[#2C6FB7] hover:underline">
                            نسيت كلمة المرور؟
                        </button>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#FFA726] to-[#F57C00] hover:from-[#fb923c] hover:to-[#ea580c] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <LogIn className="w-6 h-6" />
                                دخول إلى النظام
                            </>
                        )}
                    </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">أو سجل الدخول باستخدام</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button type="button" className="flex items-center justify-center gap-2 py-3 border-2 border-slate-100 rounded-xl hover:border-[#4A90E2] hover:bg-blue-50 transition-all group">
                             <Globe className="w-5 h-5 text-slate-500 group-hover:text-[#4A90E2]" />
                             <span className="text-sm font-bold text-slate-600 group-hover:text-[#4A90E2]">حساب الجامعة</span>
                        </button>
                        <button type="button" className="flex items-center justify-center gap-2 py-3 border-2 border-slate-100 rounded-xl hover:border-[#EA4335] hover:bg-red-50 transition-all group">
                             <Building2 className="w-5 h-5 text-slate-500 group-hover:text-[#EA4335]" />
                             <span className="text-sm font-bold text-slate-600 group-hover:text-[#EA4335]">Microsoft 365</span>
                        </button>
                    </div>
                </form>

                <div className="mt-8 p-4 bg-blue-50 border-r-4 border-[#4A90E2] rounded-r-none rounded-xl">
                    <p className="text-slate-600 text-sm mb-1"><strong>الحصول على حساب جديد</strong></p>
                    <p className="text-slate-500 text-sm mb-2">للطلاب الجدد أو أعضاء هيئة التدريس الذين ليس لديهم حساب</p>
                    <button className="text-[#4A90E2] font-bold text-sm hover:underline flex items-center gap-1">
                        يرجى مراجعة أمين المكتبة <ArrowRightLeft className="w-3 h-3" />
                    </button>
                </div>

                <div className="mt-auto pt-8 text-center border-t border-slate-100">
                    <p className="text-slate-400 text-sm">© {new Date().getFullYear()} نظام IIN - مكتبة الجامعة المركزية.</p>
                </div>
            </div>

        </div>
    </div>
  );
};
