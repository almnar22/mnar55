
import React, { useState, useMemo, useRef } from 'react';
import { Book, Loan, User } from '../types';
import { 
  Search, Calendar, User as UserIcon, ArrowRightLeft, CheckCircle, 
  AlertTriangle, Clock, History, BookOpen, BarChart3, AlertCircle, 
  Plus, Check, MapPin, DollarSign, X, Layers, FileDown, Printer, 
  FileText, RotateCcw, Filter
} from 'lucide-react';

interface LendingProps {
  books: Book[];
  loans: Loan[];
  users: User[];
  currentUser: User;
  onIssueBook: (bookId: string, userId: string, duration: number, notes?: string) => void;
  onReturnBook: (loanId: string, condition: 'excellent' | 'good' | 'damaged' | 'lost', penalty: number, notes: string) => void;
}

export const Lending: React.FC<LendingProps> = ({ books, loans, users, currentUser, onIssueBook, onReturnBook }) => {
  // --- State ---
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'overdue' | 'returned'>('all');
  
  // Search State
  const [searchStudent, setSearchStudent] = useState('');
  const [searchBook, setSearchBook] = useState('');

  // Modals
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [viewLoan, setViewLoan] = useState<Loan | null>(null); // For Details Modal
  
  // Issue Form State
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [issueDuration, setIssueDuration] = useState(14);
  const [issueNotes, setIssueNotes] = useState('');
  const [modalBookSearch, setModalBookSearch] = useState('');
  const [modalUserSearch, setModalUserSearch] = useState('');
  
  // Return Form State
  const [loanToReturn, setLoanToReturn] = useState<Loan | null>(null);
  const [returnCondition, setReturnCondition] = useState<'excellent' | 'good' | 'damaged' | 'lost'>('excellent');
  const [returnNotes, setReturnNotes] = useState('');
  const [isLocationChecked, setIsLocationChecked] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = currentUser.role === 'admin';

  // --- Derived Data ---

  // Statistics
  const stats = useMemo(() => {
    const active = loans.filter(l => l.status === 'active' || l.status === 'overdue').length;
    const overdue = loans.filter(l => l.status === 'overdue').length;
    const returned = loans.filter(l => l.status === 'returned').length;
    
    // Calculate today's loans
    const todayStr = new Date().toISOString().split('T')[0];
    const newToday = loans.filter(l => l.issueDate.startsWith(todayStr)).length;

    return { active, overdue, returned, newToday };
  }, [loans]);

  // Filtering
  const filteredLoans = useMemo(() => {
      return loans.filter(loan => {
          // Status Filter
          let matchesStatus = true;
          if (filterStatus === 'active') matchesStatus = loan.status === 'active' || loan.status === 'overdue';
          if (filterStatus === 'overdue') matchesStatus = loan.status === 'overdue';
          if (filterStatus === 'returned') matchesStatus = loan.status === 'returned';

          // Search Filter
          const matchesStudent = searchStudent === '' || 
              loan.studentName.toLowerCase().includes(searchStudent.toLowerCase()) || 
              loan.userId.includes(searchStudent);
          
          const matchesBook = searchBook === '' || 
              loan.bookTitle.toLowerCase().includes(searchBook.toLowerCase()) || 
              loan.bookId.includes(searchBook);

          // Student View Filter (if not admin)
          const matchesUserRole = isAdmin ? true : loan.userId === currentUser.id;

          return matchesStatus && matchesStudent && matchesBook && matchesUserRole;
      });
  }, [loans, filterStatus, searchStudent, searchBook, isAdmin, currentUser.id]);

  // Search Results for Issue Modal
  const foundBooks = useMemo(() => {
      if (!modalBookSearch) return [];
      return books.filter(b => 
          b.title.toLowerCase().includes(modalBookSearch.toLowerCase()) || 
          b.code.includes(modalBookSearch)
      ).slice(0, 5);
  }, [books, modalBookSearch]);

  const foundUsers = useMemo(() => {
      if (!modalUserSearch) return [];
      return users.filter(u => 
        u.status === 'active' && (
        u.name.toLowerCase().includes(modalUserSearch.toLowerCase()) || 
        u.id.includes(modalUserSearch))
      ).slice(0, 5);
  }, [users, modalUserSearch]);


  // --- Logic Helpers ---

  const calculateDueDate = (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toLocaleDateString('ar-EG');
  };

  const getDaysOverdue = (dueDate: string) => {
    const diff = new Date().getTime() - new Date(dueDate).getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const calculatePenalty = (loan: Loan) => {
      const days = getDaysOverdue(loan.dueDate);
      return days * 2; // Assuming 2 currency units per day
  };

  // --- Handlers ---

  const handleIssueSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedBook && selectedUser) {
          onIssueBook(selectedBook.id, selectedUser.id, issueDuration, issueNotes);
          setShowIssueModal(false);
          resetIssueForm();
      }
  };

  const resetIssueForm = () => {
      setSelectedBook(null);
      setSelectedUser(null);
      setModalBookSearch('');
      setModalUserSearch('');
      setIssueDuration(14);
      setIssueNotes('');
  };

  const openReturnModal = (loan: Loan) => {
      setLoanToReturn(loan);
      setReturnCondition('excellent');
      setReturnNotes('');
      setIsLocationChecked(false);
      setShowReturnModal(true);
  };

  const handleReturnSubmit = () => {
      if (loanToReturn) {
          const penalty = calculatePenalty(loanToReturn);
          onReturnBook(loanToReturn.id, returnCondition, penalty, returnNotes);
          setShowReturnModal(false);
          setLoanToReturn(null);
      }
  };

  const handleImportLoans = () => {
      fileInputRef.current?.click();
  };

  const handleReports = () => {
      alert(`ملخص التقارير:\nإعارات نشطة: ${stats.active}\nمتأخرة: ${stats.overdue}\nتم الإرجاع: ${stats.returned}`);
  };

  // --- Student View Specifics ---
  if (!isAdmin) {
      return (
          <div className="space-y-6">
             <header className="bg-gradient-to-br from-[#4A90E2] to-[#2C6FB7] text-white p-8 rounded-2xl shadow-lg shadow-blue-500/20 text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">كتبي واستعاراتي</h2>
                <p className="opacity-90 text-blue-100">سجل استعارتك الحالي والسابق</p>
             </header>
             
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-[#4A90E2] text-white">
                        <tr>
                            <th className="p-4 font-semibold">الكتاب</th>
                            <th className="p-4 font-semibold">تاريخ الاستعارة</th>
                            <th className="p-4 font-semibold">موعد الإرجاع</th>
                            <th className="p-4 font-semibold">الحالة</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredLoans.map(loan => {
                             const isOverdue = loan.status === 'overdue';
                             return (
                                <tr key={loan.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-bold text-slate-800">{loan.bookTitle}</td>
                                    <td className="p-4 text-slate-600 text-sm">{new Date(loan.issueDate).toLocaleDateString('ar-EG')}</td>
                                    <td className="p-4 text-slate-600 text-sm">{new Date(loan.dueDate).toLocaleDateString('ar-EG')}</td>
                                    <td className="p-4">
                                        {loan.status === 'returned' ? (
                                             <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200">تم الإرجاع</span>
                                        ) : isOverdue ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-white bg-rose-500 px-3 py-1 rounded-full w-fit">
                                                <AlertTriangle className="w-3 h-3" /> متأخر
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold text-[#4A90E2] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">نشط (لديك)</span>
                                        )}
                                    </td>
                                </tr>
                             )
                        })}
                        {filteredLoans.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-3">
                                        <BookOpen className="w-12 h-12 text-slate-200" />
                                        <p className="text-lg">لا يوجد لديك أي استعارات مسجلة</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
             </div>
          </div>
      )
  }

  // --- Admin View ---
  return (
    <div className="space-y-6 animate-fade-in font-sans pb-8">
       {/* Header */}
      <header className="bg-gradient-to-br from-[#4A90E2] to-[#2C6FB7] text-white p-8 rounded-2xl shadow-lg shadow-blue-500/20 text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
             <BookOpen className="w-8 h-8" />
             نظام إعارة الكتب
        </h1>
        <p className="opacity-90 text-blue-100">إدارة عمليات إعارة واسترجاع الكتب - مكتبة الكلية</p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-[#FFA726] hover:-translate-y-1 transition-transform duration-300 flex items-center gap-4">
            <div className="bg-gradient-to-br from-[#FFA726] to-[#F57C00] w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg shadow-orange-200">
                <ArrowRightLeft className="w-8 h-8" />
            </div>
            <div>
                <h3 className="text-3xl font-bold text-slate-800">{stats.active}</h3>
                <p className="text-slate-500 text-sm">إعارات نشطة</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-[#F44336] hover:-translate-y-1 transition-transform duration-300 flex items-center gap-4">
            <div className="bg-gradient-to-br from-[#F44336] to-[#C62828] w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg shadow-red-200">
                <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
                <h3 className="text-3xl font-bold text-slate-800">{stats.overdue}</h3>
                <p className="text-slate-500 text-sm">كتب متأخرة</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-[#4CAF50] hover:-translate-y-1 transition-transform duration-300 flex items-center gap-4">
            <div className="bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg shadow-green-200">
                <CheckCircle className="w-8 h-8" />
            </div>
            <div>
                <h3 className="text-3xl font-bold text-slate-800">{stats.returned}</h3>
                <p className="text-slate-500 text-sm">إعارات منتهية</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-[#4A90E2] hover:-translate-y-1 transition-transform duration-300 flex items-center gap-4">
            <div className="bg-gradient-to-br from-[#4A90E2] to-[#2C6FB7] w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-200">
                <Plus className="w-8 h-8" />
            </div>
            <div>
                <h3 className="text-3xl font-bold text-slate-800">{stats.newToday}</h3>
                <p className="text-slate-500 text-sm">إعارات اليوم</p>
            </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="relative">
                <label className="block text-sm font-bold text-[#2C6FB7] mb-2">🔍 البحث عن طالب</label>
                <input 
                    type="text" 
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="ادخل رقم الطالب أو الاسم..."
                    className="w-full pl-4 pr-10 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-[#4A90E2]" 
                />
                <UserIcon className="absolute right-3 bottom-3.5 text-slate-400 w-5 h-5" />
            </div>
            
            <div className="relative">
                <label className="block text-sm font-bold text-[#2C6FB7] mb-2">🔍 البحث عن كتاب</label>
                <input 
                    type="text" 
                    value={searchBook}
                    onChange={(e) => setSearchBook(e.target.value)}
                    placeholder="ادخل اسم الكتاب أو الكود..."
                    className="w-full pl-4 pr-10 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-[#4A90E2]" 
                />
                <BookOpen className="absolute right-3 bottom-3.5 text-slate-400 w-5 h-5" />
            </div>
         </div>

         <div className="flex flex-wrap gap-4 justify-center md:justify-start">
             <button 
                onClick={() => setShowIssueModal(true)}
                className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] hover:from-[#3b82f6] hover:to-[#2563eb] text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 flex items-center gap-2"
             >
                <Plus className="w-5 h-5" /> بدء إعارة جديدة
             </button>
             <button 
                onClick={handleImportLoans}
                className="bg-gradient-to-r from-[#FFA726] to-[#F57C00] hover:from-[#fb923c] hover:to-[#ea580c] text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-orange-500/20 transition hover:-translate-y-1 flex items-center gap-2"
             >
                <FileDown className="w-5 h-5" /> استيراد إعارات
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx" />
             </button>
             <button 
                onClick={handleReports}
                className="bg-white border-2 border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white px-6 py-3 rounded-lg font-bold transition hover:-translate-y-1 flex items-center gap-2"
             >
                <BarChart3 className="w-5 h-5" /> تقارير الإعارة
             </button>
             <button 
                onClick={() => window.print()}
                className="bg-white border-2 border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white px-6 py-3 rounded-lg font-bold transition hover:-translate-y-1 flex items-center gap-2"
             >
                <Printer className="w-5 h-5" /> طباعة السجلات
             </button>
         </div>
      </div>

      {/* Records Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
         <div className="p-6 border-b-2 border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-[#2C6FB7] flex items-center gap-2">
                <FileText className="w-6 h-6" /> سجلات الإعارة
            </h2>
            
            <div className="flex gap-2">
                <button 
                    onClick={() => setFilterStatus('all')}
                    className={`px-5 py-2 rounded-full border-2 font-medium text-sm transition ${filterStatus === 'all' ? 'bg-[#4A90E2] text-white border-[#4A90E2]' : 'bg-white text-slate-500 border-slate-200 hover:border-[#4A90E2] hover:text-[#4A90E2]'}`}
                >
                    الكل
                </button>
                <button 
                    onClick={() => setFilterStatus('active')}
                    className={`px-5 py-2 rounded-full border-2 font-medium text-sm transition ${filterStatus === 'active' ? 'bg-[#4A90E2] text-white border-[#4A90E2]' : 'bg-white text-slate-500 border-slate-200 hover:border-[#4A90E2] hover:text-[#4A90E2]'}`}
                >
                    نشطة
                </button>
                <button 
                    onClick={() => setFilterStatus('overdue')}
                    className={`px-5 py-2 rounded-full border-2 font-medium text-sm transition ${filterStatus === 'overdue' ? 'bg-[#4A90E2] text-white border-[#4A90E2]' : 'bg-white text-slate-500 border-slate-200 hover:border-[#4A90E2] hover:text-[#4A90E2]'}`}
                >
                    متأخرة
                </button>
                <button 
                    onClick={() => setFilterStatus('returned')}
                    className={`px-5 py-2 rounded-full border-2 font-medium text-sm transition ${filterStatus === 'returned' ? 'bg-[#4A90E2] text-white border-[#4A90E2]' : 'bg-white text-slate-500 border-slate-200 hover:border-[#4A90E2] hover:text-[#4A90E2]'}`}
                >
                    منتهية
                </button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-right text-sm border-separate border-spacing-0">
                <thead>
                    <tr>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#2C6FB7] sticky top-0 first:rounded-tr-lg">اسم الطالب</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#2C6FB7] sticky top-0">الكتاب</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#2C6FB7] sticky top-0">رقم الكتاب</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#2C6FB7] sticky top-0">الخزانة</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#2C6FB7] sticky top-0">تاريخ الإعارة</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#2C6FB7] sticky top-0">موعد الإرجاع</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#2C6FB7] sticky top-0">الحالة</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#2C6FB7] sticky top-0 last:rounded-tl-lg">إجراء</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredLoans.map(loan => {
                        const isOverdue = loan.status === 'overdue';
                        const isReturned = loan.status === 'returned';
                        const daysOverdue = getDaysOverdue(loan.dueDate);
                        
                        return (
                        <tr key={loan.id} className="hover:bg-blue-50/30 transition duration-150">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4A90E2] to-[#2C6FB7] flex items-center justify-center text-white font-bold text-lg shrink-0">
                                        {loan.studentName.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">{loan.studentName}</div>
                                        <small className="text-slate-500">{loan.userId}</small>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFA726] to-[#F57C00] flex items-center justify-center text-white text-lg shrink-0">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div className="max-w-[200px]">
                                        <div className="font-bold text-slate-800 truncate" title={loan.bookTitle}>{loan.bookTitle}</div>
                                        <small className="text-slate-500">كود: {loan.bookId}</small>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="inline-flex items-center gap-1.5 bg-[#E3F2FD] px-3 py-1.5 rounded-full text-sm font-medium text-[#2C6FB7]">
                                    <MapPin className="w-3 h-3" />
                                    <span>{loan.originalLocation?.bookShelfNumber || '-'}</span>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="inline-flex items-center gap-1.5 bg-[#E3F2FD] px-3 py-1.5 rounded-full text-sm font-medium text-[#2C6FB7]">
                                    <Layers className="w-3 h-3" />
                                    <span>{loan.originalLocation?.cabinet || '-'}</span>
                                </div>
                            </td>
                            <td className="p-4 text-slate-600 font-medium">{new Date(loan.issueDate).toLocaleDateString('ar-EG')}</td>
                            <td className="p-4">
                                <div className="text-slate-600 font-medium">{new Date(loan.dueDate).toLocaleDateString('ar-EG')}</div>
                                {isOverdue && !isReturned && (
                                    <small className="text-rose-600 font-bold">متأخر {daysOverdue} يوم</small>
                                )}
                                {!isOverdue && !isReturned && (
                                    <small className="text-emerald-600 font-bold">متبقي {Math.abs(getDaysOverdue(loan.dueDate))} يوم</small>
                                )}
                            </td>
                            <td className="p-4">
                                {isReturned ? (
                                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">تم الإرجاع</span>
                                ) : isOverdue ? (
                                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700">متأخر</span>
                                ) : (
                                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700">نشطة</span>
                                )}
                            </td>
                            <td className="p-4">
                                <div className="flex gap-2">
                                    {!isReturned && (
                                        <button 
                                            onClick={() => openReturnModal(loan)}
                                            className="px-3 py-1.5 rounded-lg bg-[#FFA726] hover:bg-[#F57C00] text-white font-bold text-xs flex items-center gap-1 transition"
                                        >
                                            <RotateCcw className="w-3 h-3" /> إرجاع
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => setViewLoan(loan)}
                                        className="px-3 py-1.5 rounded-lg bg-[#4A90E2] hover:bg-[#2C6FB7] text-white font-bold text-xs flex items-center gap-1 transition"
                                    >
                                        <FileText className="w-3 h-3" /> تفاصيل
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )})}
                    {filteredLoans.length === 0 && (
                        <tr>
                            <td colSpan={8} className="py-16 text-center text-slate-500">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                        <Search className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-lg font-medium">لا توجد سجلات مطابقة للبحث</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
         </div>

         {/* Pagination (Mock) */}
         <div className="p-6 border-t border-slate-100 flex justify-center gap-2">
            <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition">السابق</button>
            <button className="px-4 py-2 bg-[#4A90E2] text-white rounded-lg font-bold">1</button>
            <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition">2</button>
            <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition">3</button>
            <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition">التالي</button>
         </div>
      </div>

      {/* Footer */}
      <footer className="text-center pt-8 mt-8 border-t border-slate-200 text-slate-500 text-sm">
        <p className="font-bold mb-1">نظام إعارة الكتب - مكتبة الكلية | تم تحديث البيانات: {new Date().toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</p>
        <p>إجمالي السجلات المعروضة: {filteredLoans.length} سجل</p>
      </footer>


      {/* --- New Borrowing Modal --- */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#4A90E2] text-white shrink-0">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Plus className="w-6 h-6" />
                        نموذج إعارة كتاب جديد
                    </h3>
                    <button onClick={() => setShowIssueModal(false)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleIssueSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Section 1: Student Info */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative group transition-all hover:border-blue-300">
                        <label className="block text-sm font-bold text-[#2C6FB7] mb-3 flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            بيانات الطالب / المستفيد
                        </label>
                        
                        {!selectedUser ? (
                            <div className="space-y-3">
                                <input 
                                    type="text" 
                                    className="w-full p-3 rounded-lg border border-slate-300 focus:outline-none focus:border-[#4A90E2] focus:ring-2 focus:ring-blue-100 text-slate-800"
                                    placeholder="بحث برقم الهوية أو الاسم..."
                                    value={modalUserSearch}
                                    onChange={(e) => setModalUserSearch(e.target.value)}
                                    autoFocus
                                />
                                {foundUsers.length > 0 && (
                                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                        {foundUsers.map(u => (
                                            <div 
                                                key={u.id} 
                                                onClick={() => { setSelectedUser(u); setModalUserSearch(''); }}
                                                className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 border-slate-50 flex justify-between items-center"
                                            >
                                                <div>
                                                    <p className="font-bold text-slate-800">{u.name}</p>
                                                    <p className="text-xs text-slate-500">{u.id} - {u.department}</p>
                                                </div>
                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                                    <Plus className="w-4 h-4" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                                <div>
                                    <p className="font-bold text-slate-800">{selectedUser.name}</p>
                                    <p className="text-sm text-slate-500">{selectedUser.id} | {selectedUser.department}</p>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setSelectedUser(null)} 
                                    className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 bg-red-50 rounded hover:bg-red-100"
                                >
                                    تغيير
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Section 2: Book Info */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative group transition-all hover:border-blue-300">
                        <label className="block text-sm font-bold text-[#2C6FB7] mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            بيانات الكتاب
                        </label>
                        
                        {!selectedBook ? (
                            <div className="space-y-3">
                                <input 
                                    type="text" 
                                    className="w-full p-3 rounded-lg border border-slate-300 focus:outline-none focus:border-[#4A90E2] focus:ring-2 focus:ring-blue-100 text-slate-800"
                                    placeholder="بحث بعنوان الكتاب أو الكود..."
                                    value={modalBookSearch}
                                    onChange={(e) => setModalBookSearch(e.target.value)}
                                />
                                {foundBooks.length > 0 && (
                                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                        {foundBooks.map(b => (
                                            <div 
                                                key={b.id} 
                                                onClick={() => { 
                                                    if(b.remainingCopies > 0) {
                                                        setSelectedBook(b); 
                                                        setModalBookSearch('');
                                                    } else {
                                                        alert('هذا الكتاب غير متاح حالياً');
                                                    }
                                                }}
                                                className={`p-3 border-b last:border-0 border-slate-50 flex justify-between items-center ${b.remainingCopies > 0 ? 'hover:bg-blue-50 cursor-pointer' : 'bg-slate-50 opacity-60 cursor-not-allowed'}`}
                                            >
                                                <div>
                                                    <p className="font-bold text-slate-800">{b.title}</p>
                                                    <p className="text-xs text-slate-500">كود: {b.code} | {b.author}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${b.remainingCopies > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        متبقي: {b.remainingCopies}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm space-y-2">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <p className="font-bold text-slate-800 truncate">{selectedBook.title}</p>
                                    <button 
                                        type="button" 
                                        onClick={() => setSelectedBook(null)} 
                                        className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 bg-red-50 rounded hover:bg-red-100"
                                    >
                                        تغيير
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-blue-50 p-2 rounded text-blue-800 flex items-center gap-2">
                                        <MapPin className="w-3 h-3" />
                                        <span>الخزانة: <b>{selectedBook.cabinet}</b></span>
                                    </div>
                                    <div className="bg-blue-50 p-2 rounded text-blue-800 flex items-center gap-2">
                                        <Layers className="w-3 h-3" />
                                        <span>الرف: <b>{selectedBook.bookShelfNumber}</b></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 3: Loan Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">مدة الإعارة</label>
                            <div className="flex gap-2">
                                {[7, 14, 30].map(days => (
                                    <button
                                        key={days}
                                        type="button"
                                        onClick={() => setIssueDuration(days)}
                                        className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all ${issueDuration === days ? 'bg-[#4A90E2] text-white border-[#4A90E2]' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                                    >
                                        {days} يوم
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الإرجاع المتوقع</label>
                            <div className="w-full p-2.5 bg-slate-100 rounded-lg text-slate-600 border border-slate-200 font-mono text-center">
                                {calculateDueDate(issueDuration)}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات</label>
                            <textarea 
                                rows={2}
                                value={issueNotes}
                                onChange={(e) => setIssueNotes(e.target.value)}
                                className="w-full p-3 rounded-lg border border-slate-300 focus:outline-none focus:border-[#4A90E2] focus:ring-1 focus:ring-blue-200 text-slate-800 text-sm"
                                placeholder="أي ملاحظات إضافية..."
                            />
                        </div>
                    </div>

                </form>

                <div className="p-5 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
                    <button 
                        onClick={() => setShowIssueModal(false)}
                        className="flex-1 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition"
                    >
                        إلغاء
                    </button>
                    <button 
                        onClick={handleIssueSubmit}
                        disabled={!selectedBook || !selectedUser}
                        className="flex-1 py-3 rounded-xl bg-[#4A90E2] text-white font-bold hover:bg-[#2C6FB7] transition shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Check className="w-5 h-5" />
                        تأكيد الإعارة
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- Return Book Modal --- */}
      {showReturnModal && loanToReturn && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200 border-t-8 border-[#FFA726]">
                <div className="p-6 border-b border-slate-100 shrink-0">
                    <h3 className="text-xl font-bold text-slate-800 mb-1">استرجاع كتاب إلى المكتبة</h3>
                    <p className="text-sm text-slate-500">يرجى التحقق من حالة الكتاب وموقعه قبل التأكيد</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Info Card */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="block text-xs text-slate-400 mb-1">الكتاب</span>
                            <span className="font-bold text-slate-800 block truncate">{loanToReturn.bookTitle}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-slate-400 mb-1">المستعير</span>
                            <span className="font-bold text-slate-800 block">{loanToReturn.studentName}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-slate-400 mb-1">تاريخ الإعارة</span>
                            <span className="font-medium text-slate-600">{new Date(loanToReturn.issueDate).toLocaleDateString('ar-EG')}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-slate-400 mb-1">حالة التأخير</span>
                            {getDaysOverdue(loanToReturn.dueDate) > 0 ? (
                                <span className="font-bold text-rose-600">{getDaysOverdue(loanToReturn.dueDate)} يوم تأخير</span>
                            ) : (
                                <span className="font-bold text-emerald-600">في الموعد</span>
                            )}
                        </div>
                    </div>

                    {/* Original Location Check */}
                    <div className="border-2 border-dashed border-[#4A90E2] bg-blue-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3 text-[#2C6FB7]">
                            <MapPin className="w-5 h-5" />
                            <h4 className="font-bold">الموقع الأصلي للتخزين</h4>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mb-4">
                             <div className="bg-white p-2 rounded border border-blue-200 text-center">
                                <span className="block text-[10px] text-slate-400">الخزانة</span>
                                <span className="block font-bold text-slate-800">{loanToReturn.originalLocation?.cabinet || '-'}</span>
                             </div>
                             <div className="bg-white p-2 rounded border border-blue-200 text-center">
                                <span className="block text-[10px] text-slate-400">الرف</span>
                                <span className="block font-bold text-slate-800">{loanToReturn.originalLocation?.bookShelfNumber || '-'}</span>
                             </div>
                             <div className="bg-white p-2 rounded border border-blue-200 text-center">
                                <span className="block text-[10px] text-slate-400">الترتيب</span>
                                <span className="block font-bold text-slate-800">{loanToReturn.originalLocation?.shelfOrder || '-'}</span>
                             </div>
                        </div>

                        <button 
                            type="button"
                            onClick={() => setIsLocationChecked(true)}
                            className={`w-full py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${isLocationChecked ? 'bg-emerald-500 text-white' : 'bg-white text-[#4A90E2] border border-[#4A90E2] hover:bg-blue-50'}`}
                        >
                            {isLocationChecked ? <><Check className="w-4 h-4" /> تم التحقق من الموقع</> : 'فحص توفر الموقع الأصلي'}
                        </button>
                    </div>

                    {/* Condition & Penalty */}
                    <div className="space-y-4">
                        <div>
                             <label className="block text-sm font-bold text-slate-700 mb-2">حالة الكتاب عند الإرجاع</label>
                             <div className="grid grid-cols-2 gap-2">
                                {['excellent', 'good', 'damaged', 'lost'].map((cond) => (
                                    <button
                                        key={cond}
                                        onClick={() => setReturnCondition(cond as any)}
                                        className={`py-2 px-3 rounded-lg border text-sm font-medium text-right transition ${returnCondition === cond ? 'border-[#FFA726] bg-orange-50 text-orange-800 ring-1 ring-orange-200' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${returnCondition === cond ? 'bg-[#FFA726]' : 'bg-slate-300'}`}></div>
                                            {cond === 'excellent' && 'ممتاز'}
                                            {cond === 'good' && 'جيد'}
                                            {cond === 'damaged' && 'متضرر'}
                                            {cond === 'lost' && 'مفقود'}
                                        </div>
                                    </button>
                                ))}
                             </div>
                        </div>

                        {getDaysOverdue(loanToReturn.dueDate) > 0 && (
                            <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg flex items-center justify-between text-rose-800">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5" />
                                    <span className="font-bold text-sm">غرامة تأخير مستحقة</span>
                                </div>
                                <span className="font-mono font-bold text-lg">{calculatePenalty(loanToReturn)} ج.م</span>
                            </div>
                        )}
                        
                        <div>
                             <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات الإرجاع</label>
                             <input 
                                type="text"
                                value={returnNotes}
                                onChange={(e) => setReturnNotes(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#FFA726]"
                                placeholder="أي أضرار أو ملاحظات..."
                             />
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
                    <button 
                        onClick={() => setShowReturnModal(false)}
                        className="flex-1 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition"
                    >
                        إلغاء
                    </button>
                    <button 
                        onClick={handleReturnSubmit}
                        className="flex-1 py-3 rounded-xl bg-[#FFA726] text-white font-bold hover:bg-[#F57C00] transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" />
                        تأكيد الإرجاع
                    </button>
                </div>
             </div>
        </div>
      )}

      {/* --- View Details Modal --- */}
      {viewLoan && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-slate-800">تفاصيل الإعارة</h3>
                    <button onClick={() => setViewLoan(null)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-500">رقم العملية:</span>
                            <span className="font-mono font-bold text-slate-800">{viewLoan.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">الطالب:</span>
                            <span className="font-bold text-slate-800">{viewLoan.studentName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">الكتاب:</span>
                            <span className="font-bold text-slate-800">{viewLoan.bookTitle}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="border p-3 rounded-lg text-center">
                            <span className="block text-xs text-slate-400">تاريخ الإعارة</span>
                            <span className="font-bold text-slate-800">{new Date(viewLoan.issueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="border p-3 rounded-lg text-center">
                            <span className="block text-xs text-slate-400">تاريخ الاستحقاق</span>
                            <span className="font-bold text-slate-800">{new Date(viewLoan.dueDate).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {viewLoan.status === 'returned' && (
                        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-emerald-800 text-sm text-center">
                            تم إرجاع الكتاب بتاريخ {viewLoan.returnDate ? new Date(viewLoan.returnDate).toLocaleDateString() : '-'}
                        </div>
                    )}
                    
                    {viewLoan.notes && (
                        <div className="text-sm bg-yellow-50 p-3 rounded-lg text-yellow-800 border border-yellow-100">
                            <strong>ملاحظات:</strong> {viewLoan.notes}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
