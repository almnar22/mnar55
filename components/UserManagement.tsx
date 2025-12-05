
import React, { useState, useMemo } from 'react';
import { User, UserRole } from '../types';
import { 
    Users, Search, Plus, Edit2, Shield, Trash2, FileSpreadsheet, 
    Check, X, RefreshCw, Key, Download, Filter, Save, GraduationCap, Briefcase, PauseCircle, Loader2, Mail, Phone, Calendar
} from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: User) => void;
  onAddUsers: (users: User[]) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onAddUsers, onUpdateUser, onDeleteUser }) => {
  // --- States ---
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  
  // Form Data
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const initialFormState: User = {
    id: '', name: '', email: '', password: '', role: 'student',
    department: '', phone: '', status: 'active', joinDate: new Date().toISOString(), visits: 0
  };
  const [formData, setFormData] = useState<User>(initialFormState);
  
  // Reset Password State
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Bulk Import State
  const [bulkData, setBulkData] = useState('');
  const [parsedUsers, setParsedUsers] = useState<User[]>([]);

  // --- Derived Data ---
  const stats = useMemo(() => {
      return {
          total: users.length,
          students: users.filter(u => u.role === 'student').length,
          staff: users.filter(u => u.role === 'staff' || u.role === 'professor').length,
          inactive: users.filter(u => u.status === 'inactive' || u.status === 'suspended').length
      };
  }, [users]);

  const filteredUsers = useMemo(() => {
      return users.filter(user => {
          const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                user.id.includes(searchTerm) ||
                                user.email.toLowerCase().includes(searchTerm);
          const matchesRole = roleFilter ? user.role === roleFilter : true;
          const matchesStatus = statusFilter === 'all' ? true : user.status === statusFilter;
          
          return matchesSearch && matchesRole && matchesStatus;
      });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // --- Handlers ---

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData(initialFormState);
    setShowAddModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData(user);
    setShowAddModal(true);
  };

  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      // Auto-generate password if adding new user
      if (!editingUser) {
          setFormData(prev => ({ ...prev, id: val, password: (parseInt(val) * 2).toString() || val }));
      } else {
          setFormData(prev => ({ ...prev, id: val }));
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
        onUpdateUser(formData);
    } else {
        if (users.some(u => u.id === formData.id)) {
            alert('رقم المستخدم موجود بالفعل');
            return;
        }
        onAddUser(formData);
    }
    setShowAddModal(false);
  };

  const handleResetPassword = () => {
      alert(`تم إرسال كلمة المرور الجديدة (${generatedPassword}) إلى ${resetTargetUser?.email}`);
      setShowResetModal(false);
      setGeneratedPassword('');
      setResetTargetUser(null);
  };

  // Export Users to CSV
  const handleExportUsers = () => {
      const headers = ['الرقم الجامعي', 'الاسم', 'البريد', 'الدور', 'القسم', 'الحالة'];
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
          + headers.join(",") + "\n"
          + filteredUsers.map(u => `${u.id},"${u.name}",${u.email},${u.role},"${u.department}",${u.status}`).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "users_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleRefresh = () => {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 800);
  };

  // Bulk Import Logic
  const handleParseBulk = () => {
      if (!bulkData.trim()) return;
      const rows = bulkData.trim().split('\n');
      const newUsers: User[] = [];

      rows.forEach((row) => {
          const cols = row.split('\t').map(c => c.trim());
          // Expected: FullName | ID | Email | Phone | Role | Department | Status
          if (cols.length < 3) return;

          const id = cols[1];
          const roleMap: Record<string, UserRole> = { 'admin': 'admin', 'student': 'student', 'professor': 'professor', 'staff': 'staff' };
          const statusMap: Record<string, 'active' | 'inactive' | 'suspended'> = { 'active': 'active', 'inactive': 'inactive', 'suspended': 'suspended' };

          const user: User = {
              name: cols[0],
              id: id,
              email: cols[2],
              password: (parseInt(id) * 2).toString(), // Auto password
              phone: cols[3] || '',
              role: roleMap[cols[4]] || 'student',
              department: cols[5] || '',
              status: statusMap[cols[6]] || 'active',
              joinDate: new Date().toISOString(),
              visits: 0
          };
          
          if(user.id && user.name) newUsers.push(user);
      });
      setParsedUsers(newUsers);
  };

  const getRoleColor = (role: string) => {
      switch(role) {
          case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
          case 'student': return 'bg-green-100 text-green-700 border-green-200';
          case 'professor': return 'bg-orange-100 text-orange-700 border-orange-200';
          default: return 'bg-blue-100 text-blue-700 border-blue-200';
      }
  };

  const getRoleLabel = (role: string) => {
      switch(role) {
          case 'admin': return 'مسؤول مكتبة';
          case 'student': return 'طالب';
          case 'professor': return 'أستاذ/دكتور';
          case 'staff': return 'موظف';
          default: return role;
      }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      
      {/* Header */}
      <header className="bg-gradient-to-br from-[#4A90E2] to-[#2C6FB7] text-white p-8 rounded-2xl shadow-lg shadow-blue-500/20 text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
             <Users className="w-8 h-8" />
             إدارة المستخدمين
        </h1>
        <p className="opacity-90 text-blue-100">صلاحيات الطلاب وأمناء المكتبة والأساتذة والموظفين</p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border-t-4 border-[#4A90E2] flex items-center gap-3 md:gap-4 hover:shadow-md transition">
            <div className="bg-gradient-to-br from-[#4A90E2] to-[#2C6FB7] w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-white text-lg md:text-2xl shadow-lg shadow-blue-200">
                <Users className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
                <h3 className="text-xl md:text-3xl font-bold text-slate-800">{stats.total}</h3>
                <p className="text-slate-500 text-xs md:text-sm">إجمالي المستخدمين</p>
            </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border-t-4 border-[#4CAF50] flex items-center gap-3 md:gap-4 hover:shadow-md transition">
            <div className="bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-white text-lg md:text-2xl shadow-lg shadow-green-200">
                <GraduationCap className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
                <h3 className="text-xl md:text-3xl font-bold text-slate-800">{stats.students}</h3>
                <p className="text-slate-500 text-xs md:text-sm">الطلاب</p>
            </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border-t-4 border-[#FFA726] flex items-center gap-3 md:gap-4 hover:shadow-md transition">
            <div className="bg-gradient-to-br from-[#FFA726] to-[#F57C00] w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-white text-lg md:text-2xl shadow-lg shadow-orange-200">
                <Briefcase className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
                <h3 className="text-xl md:text-3xl font-bold text-slate-800">{stats.staff}</h3>
                <p className="text-slate-500 text-xs md:text-sm">الأساتذة والموظفين</p>
            </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border-t-4 border-[#F44336] flex items-center gap-3 md:gap-4 hover:shadow-md transition">
            <div className="bg-gradient-to-br from-[#F44336] to-[#C62828] w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-white text-lg md:text-2xl shadow-lg shadow-red-200">
                <PauseCircle className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
                <h3 className="text-xl md:text-3xl font-bold text-slate-800">{stats.inactive}</h3>
                <p className="text-slate-500 text-xs md:text-sm">غير نشطين</p>
            </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
            <div className="relative">
                <label className="block text-sm font-bold text-[#2C6FB7] mb-2">🔍 بحث عن مستخدم</label>
                <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="بحث بالاسم، الرقم الجامعي، أو البريد الإلكتروني..." 
                    className="w-full pl-4 pr-10 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-[#4A90E2]"
                />
                <Search className="absolute right-3 bottom-3.5 text-slate-400 w-5 h-5" />
            </div>
            <div className="relative">
                <label className="block text-sm font-bold text-[#2C6FB7] mb-2">📋 فلترة حسب النوع</label>
                <select 
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-[#4A90E2] bg-white"
                >
                    <option value="">كل الأنواع</option>
                    <option value="admin">مسؤول مكتبة</option>
                    <option value="student">طالب</option>
                    <option value="professor">أستاذ/دكتور</option>
                    <option value="staff">موظف</option>
                </select>
                <Filter className="absolute right-3 bottom-3.5 text-slate-400 w-5 h-5" />
            </div>
         </div>

         <div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-4">
             <div className="flex gap-2 w-full md:w-auto">
                <button 
                    onClick={handleOpenAdd}
                    className="flex-1 md:flex-none bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white px-4 md:px-6 py-3 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                    <Plus className="w-5 h-5" /> إضافة مستخدم
                </button>
                <button 
                    onClick={() => { setShowBulkModal(true); setParsedUsers([]); setBulkData(''); }}
                    className="flex-1 md:flex-none bg-gradient-to-r from-[#FFA726] to-[#F57C00] text-white px-4 md:px-6 py-3 rounded-lg font-bold shadow-lg shadow-orange-500/20 transition hover:-translate-y-1 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                    <FileSpreadsheet className="w-5 h-5" /> إضافة جماعية
                </button>
             </div>
             <div className="flex gap-2 w-full md:w-auto">
                <button 
                    onClick={handleExportUsers}
                    className="flex-1 md:flex-none bg-white border-2 border-[#4CAF50] text-[#4CAF50] hover:bg-[#4CAF50] hover:text-white px-4 md:px-6 py-3 rounded-lg font-bold transition hover:-translate-y-1 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                    <Download className="w-5 h-5" /> تصدير
                </button>
                <button 
                    onClick={handleRefresh}
                    className="flex-1 md:flex-none bg-white border-2 border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white px-4 md:px-6 py-3 rounded-lg font-bold transition hover:-translate-y-1 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} /> تحديث
                </button>
             </div>
         </div>
      </div>

      {/* Users Grid Cards (Unified View) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {filteredUsers.map(user => (
             <div key={user.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col group relative">
                 
                 {/* Top Badges */}
                 <div className="absolute top-3 left-3 z-10">
                     <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${getRoleColor(user.role)}`}>
                         {getRoleLabel(user.role)}
                     </span>
                 </div>
                 <div className="absolute top-3 right-3 z-10">
                     {user.status === 'active' && <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">نشط</span>}
                     {user.status === 'inactive' && <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">غير نشط</span>}
                     {user.status === 'suspended' && <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">موقوف</span>}
                 </div>

                 {/* Card Content */}
                 <div className="p-6 pt-12 flex flex-col h-full items-center text-center">
                     <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#4A90E2] to-[#2C6FB7] flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-blue-200 mb-4 group-hover:scale-110 transition-transform duration-300">
                         {user.name.charAt(0)}
                     </div>
                     
                     <h3 className="font-bold text-slate-800 text-lg mb-1 truncate w-full" title={user.name}>{user.name}</h3>
                     <p className="text-sm text-slate-500 font-mono bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 mb-3">{user.id}</p>
                     
                     <div className="w-full space-y-2 mb-4 text-sm text-slate-600">
                         <div className="flex items-center gap-2 justify-center">
                             <Briefcase className="w-3 h-3 text-slate-400" />
                             <span className="truncate">{user.department || 'عام'}</span>
                         </div>
                         <div className="flex items-center gap-2 justify-center" title={user.email}>
                             <Mail className="w-3 h-3 text-slate-400" />
                             <span className="truncate max-w-[200px]">{user.email}</span>
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-2 w-full mt-auto mb-4 text-xs">
                         <div className="bg-slate-50 p-2 rounded border border-slate-100">
                             <span className="block text-slate-400 mb-1">الزيارات</span>
                             <span className="font-bold text-slate-700">{user.visits || 0}</span>
                         </div>
                         <div className="bg-slate-50 p-2 rounded border border-slate-100">
                             <span className="block text-slate-400 mb-1">آخر دخول</span>
                             <span className="font-bold text-slate-700">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-EG-u-nu-latn') : '-'}</span>
                         </div>
                     </div>

                     {/* Action Footer */}
                     <div className="pt-4 border-t border-slate-100 w-full flex justify-center gap-2">
                         <button 
                             onClick={() => handleOpenEdit(user)}
                             className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                             title="تعديل"
                         >
                             <Edit2 className="w-4 h-4" />
                         </button>
                         <button 
                             onClick={() => { setResetTargetUser(user); setGeneratedPassword((parseInt(user.id)*2).toString() || '123456'); setShowResetModal(true); }}
                             className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition"
                             title="إعادة تعيين كلمة المرور"
                         >
                             <Key className="w-4 h-4" />
                         </button>
                         <button 
                             onClick={() => { if(window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) onDeleteUser(user.id); }}
                             className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition"
                             title="حذف"
                         >
                             <Trash2 className="w-4 h-4" />
                         </button>
                     </div>
                 </div>
             </div>
         ))}
      </div>

      {filteredUsers.length === 0 && (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <p>لا يوجد مستخدمين مطابقين للبحث</p>
          </div>
      )}

      {/* Mock Pagination */}
      <div className="p-6 flex justify-center gap-2 mt-4">
         <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition font-bold">السابق</button>
         <button className="px-4 py-2 bg-[#4A90E2] text-white rounded-lg font-bold shadow-lg shadow-blue-200">1</button>
         <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition font-bold">2</button>
         <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition font-bold">3</button>
         <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition font-bold">التالي</button>
      </div>

      {/* --- Modals (Keep existing modals unchanged visually but ensures logic is intact) --- */}

      {/* Add/Edit User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        {editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
                    </h3>
                    <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-slate-50">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#2C6FB7]">الاسم الكامل *</label>
                        <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#2C6FB7]">الرقم الجامعي/الهوية *</label>
                        <input 
                            type="text" 
                            required 
                            disabled={!!editingUser}
                            value={formData.id} 
                            onChange={handleUserIdChange}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] outline-none disabled:bg-slate-200" 
                        />
                        {!editingUser && <p className="text-xs text-slate-500">سيكون اسم المستخدم، وكلمة المرور = الرقم × 2</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#2C6FB7]">البريد الإلكتروني *</label>
                        <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-[#2C6FB7]">نوع المستخدم *</label>
                            <select 
                                value={formData.role} 
                                onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] outline-none bg-white"
                            >
                                <option value="student">طالب</option>
                                <option value="admin">مسؤول مكتبة</option>
                                <option value="professor">أستاذ/دكتور</option>
                                <option value="staff">موظف</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-[#2C6FB7]">رقم الجوال</label>
                            <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] outline-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#2C6FB7]">القسم/التخصص</label>
                        <select 
                            value={formData.department} 
                            onChange={e => setFormData({...formData, department: e.target.value})}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] outline-none bg-white"
                        >
                            <option value="">اختر القسم...</option>
                            <option value="العلوم الصحية">العلوم الصحية</option>
                            <option value="علوم الحاسوب">علوم الحاسوب</option>
                            <option value="إدارة أعمال والعلوم الإنسانية">إدارة أعمال والعلوم الإنسانية</option>
                            <option value="العلوم المصرفية">العلوم المصرفية</option>
                            <option value="لغة انجليزية">لغة انجليزية</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#2C6FB7]">الحالة</label>
                        <select 
                            value={formData.status} 
                            onChange={e => setFormData({...formData, status: e.target.value as any})}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] outline-none bg-white"
                        >
                            <option value="active">نشط</option>
                            <option value="inactive">غير نشط</option>
                            <option value="suspended">موقوف</option>
                        </select>
                    </div>
                    <div className="pt-4 flex gap-3 border-t border-slate-200 mt-4">
                        <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-100 transition">إلغاء</button>
                        <button type="submit" className="flex-1 py-3 bg-[#4A90E2] text-white rounded-lg font-bold hover:bg-[#2C6FB7] transition shadow-lg shadow-blue-500/20">حفظ المستخدم</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && resetTargetUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Key className="w-5 h-5 text-[#FFA726]" /> إعادة تعيين كلمة المرور
                    </h3>
                    <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-[#4A90E2] flex items-center justify-center text-white font-bold text-xl">
                            {resetTargetUser.name.charAt(0)}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">{resetTargetUser.name}</h4>
                            <p className="text-sm text-slate-500">الرقم: {resetTargetUser.id}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">كلمة المرور الجديدة المقترحة</label>
                        <input type="text" readOnly value={generatedPassword} className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg text-center font-mono text-lg tracking-wider text-slate-800" />
                        <p className="text-xs text-slate-400 text-center">القيمة الافتراضية: الرقم الجامعي × 2</p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">إرسال البيانات إلى</label>
                        <input type="email" defaultValue={resetTargetUser.email} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] outline-none" />
                    </div>

                    <div className="flex gap-2 p-3 bg-green-50 border border-green-100 rounded-lg text-green-800 text-sm">
                        <Check className="w-5 h-5 shrink-0" />
                        <p>سيتم إرسال كلمة المرور الجديدة تلقائياً إلى البريد الإلكتروني المسجل.</p>
                    </div>
                </div>
                <div className="p-5 border-t border-slate-100 flex gap-3">
                    <button onClick={() => setShowResetModal(false)} className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-100 transition">إلغاء</button>
                    <button onClick={handleResetPassword} className="flex-1 py-2.5 bg-[#4A90E2] text-white rounded-lg font-bold hover:bg-[#2C6FB7] transition shadow-lg shadow-blue-500/20">إرسال وإعادة التعيين</button>
                </div>
            </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl my-8 relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileSpreadsheet className="w-6 h-6 text-[#4A90E2]" />
                        إضافة مستخدمين جماعية
                    </h3>
                    <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    <div className="text-center">
                        <a href="#" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#4A90E2] text-[#4A90E2] rounded-lg font-bold hover:bg-[#4A90E2] hover:text-white transition">
                            <Download className="w-5 h-5" /> تنزيل نموذج Excel
                        </a>
                    </div>

                    <div className="bg-blue-50 border-r-4 border-[#4A90E2] p-5 rounded-lg">
                        <h4 className="font-bold text-blue-800 mb-2">📋 تعليمات الإضافة الجماعية:</h4>
                        <ol className="list-decimal list-inside text-blue-700 space-y-1 text-sm mb-4">
                            <li>قم بتنزيل نموذج Excel أعلاه</li>
                            <li>املأ البيانات حسب الترتيب التالي للأعمدة</li>
                        </ol>
                        <div className="bg-white p-3 rounded border border-blue-200 font-mono text-xs text-slate-600">
                            الاسم الكامل | الرقم الجامعي | البريد الإلكتروني | رقم الجوال | نوع المستخدم | القسم | الحالة
                        </div>
                        <ul className="mt-3 text-xs text-blue-600 space-y-1">
                            <li>• الرقم الجامعي سيكون هو اسم المستخدم</li>
                            <li>• كلمة المرور الافتراضية = الرقم الجامعي × 2</li>
                            <li>• أنواع المستخدمين المقبولة: admin, student, professor, staff</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">نسخ ولصق البيانات</label>
                        <textarea 
                            value={bulkData}
                            onChange={(e) => setBulkData(e.target.value)}
                            placeholder="انسخ البيانات من Excel والصقها هنا..."
                            className="w-full h-40 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4A90E2] font-mono text-sm"
                        ></textarea>
                    </div>

                    {parsedUsers.length > 0 && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold text-slate-700">معاينة ({parsedUsers.length} مستخدم)</div>
                            <div className="max-h-60 overflow-y-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-white text-slate-500">
                                        <tr>
                                            <th className="p-3">الاسم</th>
                                            <th className="p-3">الرقم</th>
                                            <th className="p-3">الدور</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {parsedUsers.map((u, i) => (
                                            <tr key={i}>
                                                <td className="p-3">{u.name}</td>
                                                <td className="p-3 font-mono">{u.id}</td>
                                                <td className="p-3">{u.role}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 bg-white rounded-b-2xl flex gap-3">
                    <button onClick={() => {setShowBulkModal(false); setBulkData(''); setParsedUsers([])}} className="flex-1 py-3 border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50">إلغاء</button>
                    {parsedUsers.length === 0 ? (
                        <button onClick={handleParseBulk} disabled={!bulkData.trim()} className="flex-1 py-3 bg-[#4A90E2] text-white rounded-lg font-bold hover:bg-[#2C6FB7] disabled:opacity-50">معاينة البيانات</button>
                    ) : (
                        <button onClick={() => { onAddUsers(parsedUsers); setShowBulkModal(false); setBulkData(''); setParsedUsers([]); }} className="flex-1 py-3 bg-[#4CAF50] text-white rounded-lg font-bold hover:bg-[#388E3C]">تأكيد الاستيراد</button>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
