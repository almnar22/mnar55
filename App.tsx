
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Catalog } from './components/Catalog';
import { Lending } from './components/Lending';
import { UserManagement } from './components/UserManagement';
import { Assistant } from './components/Assistant';
import { Specializations } from './components/Specializations';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { Page, User, Book, Loan, LibrarySettings } from './types';
import { supabase } from './services/supabaseClient';
import { Menu, Loader2 } from 'lucide-react';

// Default Settings
const DEFAULT_SETTINGS: LibrarySettings = {
  name: 'المكتبة الجامعية الذكية',
  institution: 'جامعة المستقبل',
  email: 'library@university.edu',
  phone: '0123456789',
  copyrightText: '© 2024 جميع الحقوق محفوظة',
  lastBackupDate: null,
  backupIntervalDays: 7,
  dashboardMode: 'auto',
  manualStats: { students: 0, books: 0, journals: 0, professors: 0, borrowed: 0, available: 0 },
  visibleStats: { students: true, books: true, journals: true, professors: true, borrowed: true, available: true },
  privacyLevel: 'medium',
  securityOptions: { exportRestricted: false, encrypted: true, activityLog: true, maintenanceMode: false },
  permissions: {
    student: { borrow: true, search: true, digital: true },
    professor: { borrow: true, search: true, digital: true },
    staff: { borrow: true, search: true, digital: true },
    admin: { borrow: true, search: true, digital: true }
  }
};

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Navigation State
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data State
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [settings, setSettings] = useState<LibrarySettings>(DEFAULT_SETTINGS);
  const [notifications, setNotifications] = useState<string[]>([]);
  
  // Loading State
  const [loading, setLoading] = useState(true);

  // Initial Data Load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Settings (if table exists, otherwise use defaults)
        const { data: settingsData } = await supabase.from('settings').select('*').single();
        if (settingsData) setSettings(settingsData);

        // Fetch Users
        const { data: usersData } = await supabase.from('users').select('*');
        if (usersData) setUsers(usersData);

        // Fetch Books
        const { data: booksData } = await supabase.from('books').select('*');
        if (booksData) {
            setBooks(booksData);
            // Extract specializations
            const specs = Array.from(new Set(booksData.map((b: Book) => b.specialization).filter(Boolean))) as string[];
            setSpecializations(specs);
        }

        // Fetch Loans
        const { data: loansData } = await supabase.from('loans').select('*');
        if (loansData) setLoans(loansData);

      } catch (error) {
        console.error('Error fetching data:', error);
        // Don't show error to user immediately on load to avoid bad UX if tables are empty
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Auth Handlers ---
  const handleLogin = async (id: string, password: string): Promise<string | void> => {
      try {
          const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
          
          if (error || !data) {
              return 'المستخدم غير موجود';
          }

          if (data.password !== password) {
              return 'كلمة المرور غير صحيحة';
          }

          if (data.status !== 'active') {
              return 'هذا الحساب غير نشط';
          }

          setCurrentUser(data);
          setCurrentPage(Page.DASHBOARD);
          setNotifications(prev => [...prev, `مرحباً بعودتك، ${data.name}`]);
      } catch (e) {
          return 'حدث خطأ أثناء تسجيل الدخول';
      }
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setCurrentPage(Page.LOGIN);
  };

  // --- Book Handlers ---
  const handleAddBook = async (book: Book) => {
      try {
          const { data, error } = await supabase.from('books').insert([book]).select();
          if (error) throw error;
          if (data) {
              setBooks(prev => [...prev, data[0]]);
              if (book.specialization && !specializations.includes(book.specialization)) {
                  setSpecializations(prev => [...prev, book.specialization]);
              }
              setNotifications(prev => [...prev, `تم إضافة كتاب: ${book.title}`]);
          }
      } catch (error: any) {
          alert('فشل إضافة الكتاب: ' + error.message);
      }
  };

  const handleUpdateBook = async (book: Book) => {
      try {
          const { error } = await supabase.from('books').update(book).eq('id', book.id);
          if (error) throw error;
          setBooks(prev => prev.map(b => b.id === book.id ? book : b));
          setNotifications(prev => [...prev, `تم تحديث كتاب: ${book.title}`]);
      } catch (error: any) {
           alert('فشل تحديث الكتاب: ' + error.message);
      }
  };

  const handleDeleteBook = async (id: string) => {
      try {
          const { error } = await supabase.from('books').delete().eq('id', id);
          if (error) throw error;
          setBooks(prev => prev.filter(b => b.id !== id));
      } catch (error: any) {
          alert('فشل حذف الكتاب. تأكد من عدم وجود إعارات مرتبطة به.');
      }
  };

  const handleAddBooks = async (newBooks: Book[]) => {
      try {
          const { data, error } = await supabase.from('books').insert(newBooks).select();
          if (error) throw error;
          if (data) {
             setBooks(prev => [...prev, ...data]);
             const newSpecs = new Set(specializations);
             newBooks.forEach(b => { if(b.specialization) newSpecs.add(b.specialization) });
             setSpecializations(Array.from(newSpecs));
             setNotifications(prev => [...prev, `تم إضافة ${data.length} كتاب بنجاح`]);
          }
      } catch (error: any) {
          alert('فشل الإضافة الجماعية: ' + error.message);
      }
  };

  // --- Loan Handlers ---
  const handleIssueBook = async (bookId: string, userId: string, duration: number, notes?: string) => {
      const book = books.find(b => b.id === bookId);
      const user = users.find(u => u.id === userId);

      if (!book || !user) return;
      if (book.remainingCopies <= 0) {
          alert('لا توجد نسخ متاحة');
          return;
      }

      const issueDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + duration);

      const newLoan: Loan = {
          id: crypto.randomUUID(),
          bookId,
          bookTitle: book.title,
          userId,
          studentName: user.name,
          issueDate: issueDate.toISOString(),
          dueDate: dueDate.toISOString(),
          status: 'active',
          notes,
          originalLocation: {
              cabinet: book.cabinet,
              bookShelfNumber: book.bookShelfNumber,
              shelfOrder: book.shelfOrder
          }
      };

      try {
          const { error: loanError } = await supabase.from('loans').insert([newLoan]);
          if (loanError) throw loanError;

          const updatedBook = { ...book, remainingCopies: book.remainingCopies - 1 };
          const { error: bookError } = await supabase.from('books').update({ remainingCopies: updatedBook.remainingCopies }).eq('id', book.id);
          if (bookError) throw bookError;

          setLoans(prev => [...prev, newLoan]);
          setBooks(prev => prev.map(b => b.id === bookId ? updatedBook : b));
          setNotifications(prev => [...prev, `تم إعارة "${book.title}" للطالب ${user.name}`]);

      } catch (error: any) {
          alert('فشل عملية الإعارة: ' + error.message);
      }
  };

  const handleReturnBook = async (loanId: string, condition: 'excellent' | 'good' | 'damaged' | 'lost', penalty: number, notes: string) => {
      const loan = loans.find(l => l.id === loanId);
      if (!loan) return;

      try {
          const updateData = {
              status: 'returned',
              returnDate: new Date().toISOString(),
              conditionOnReturn: condition,
              penaltyAmount: penalty,
              notes: notes ? (loan.notes ? loan.notes + ' | ' + notes : notes) : loan.notes
          };
          
          const { error: loanError } = await supabase.from('loans').update(updateData).eq('id', loanId);
          if (loanError) throw loanError;

          if (condition !== 'lost') {
              const book = books.find(b => b.id === loan.bookId);
              if (book) {
                  const updatedBook = { ...book, remainingCopies: book.remainingCopies + 1 };
                  const { error: bookError } = await supabase.from('books').update({ remainingCopies: updatedBook.remainingCopies }).eq('id', book.id);
                  if (bookError) throw bookError;
                  setBooks(prev => prev.map(b => b.id === book.id ? updatedBook : b));
              }
          }

          setLoans(prev => prev.map(l => l.id === loanId ? { ...l, ...updateData, status: 'returned' as any } : l));
          setNotifications(prev => [...prev, `تم استرجاع كتاب "${loan.bookTitle}"`]);

      } catch (error: any) {
           alert('فشل عملية الإرجاع: ' + error.message);
      }
  };

  const handleAddBulkLoans = async (newLoans: Loan[]) => {
       try {
           const { data, error } = await supabase.from('loans').insert(newLoans).select();
           if (error) throw error;
           
           if(data) {
               setLoans(prev => [...prev, ...data]);
               const bookCounts = new Map<string, number>();
               newLoans.forEach(l => {
                   bookCounts.set(l.bookId, (bookCounts.get(l.bookId) || 0) + 1);
               });
               
               setBooks(prev => prev.map(b => {
                   const count = bookCounts.get(b.id);
                   if (count) return { ...b, remainingCopies: b.remainingCopies - count };
                   return b;
               }));
               
               setNotifications(prev => [...prev, `تم إضافة ${data.length} إعارة بنجاح`]);
           }
       } catch (error: any) {
           alert('فشل إضافة الإعارات: ' + error.message);
       }
  };

  // --- User Handlers ---
  const handleAddUser = async (user: User) => {
      try {
          const { data, error } = await supabase.from('users').insert([user]).select();
          if (error) throw error;
          if (data) {
              setUsers(prev => [...prev, data[0]]);
              setNotifications(prev => [...prev, `تم تسجيل المستخدم: ${user.name}`]);
          }
      } catch (error: any) {
          alert('فشل إضافة المستخدم: ' + error.message);
      }
  };

  const handleUpdateUser = async (user: User) => {
      try {
          const { error } = await supabase.from('users').update(user).eq('id', user.id);
          if (error) throw error;
          setUsers(prev => prev.map(u => u.id === user.id ? user : u));
          setNotifications(prev => [...prev, `تم تحديث بيانات: ${user.name}`]);
      } catch (error: any) {
          alert('فشل تحديث المستخدم: ' + error.message);
      }
  };

  const handleDeleteUser = async (userId: string) => {
      if (currentUser && currentUser.id === userId) {
          alert('لا يمكنك حذف الحساب الذي تستخدمه حالياً.');
          return;
      }

      try {
          const { error } = await supabase.from('users').delete().eq('id', userId);
          if (error) throw error;
          
          setUsers(prev => prev.filter(u => u.id !== userId));
          setNotifications(prev => [...prev, `تم حذف المستخدم بنجاح`]);
      } catch (error: any) {
          console.error("Delete error:", error);
          if (error.code === '23503') {
              alert('عذراً، لا يمكن حذف هذا المستخدم لأنه مرتبط بسجلات إعارة أو بيانات أخرى في النظام. يرجى حذف السجلات المرتبطة أولاً.');
          } else {
              alert('حدث خطأ أثناء الحذف: ' + error.message);
          }
      }
  };
  
  const handleAddUsers = async (newUsers: User[]) => {
      try {
          const { data, error } = await supabase.from('users').insert(newUsers).select();
          if (error) throw error;
          if (data) {
              setUsers(prev => [...prev, ...data]);
              setNotifications(prev => [...prev, `تم إضافة ${data.length} مستخدم بنجاح`]);
          }
      } catch (error: any) {
          alert('فشل الإضافة الجماعية: ' + error.message);
      }
  };

  // --- Specialization Handlers ---
  const handleAddSpecialization = (name: string) => {
      setSpecializations(prev => [...prev, name]);
  };
  
  const handleUpdateSpecialization = async (oldName: string, newName: string) => {
      setSpecializations(prev => prev.map(s => s === oldName ? newName : s));
      try {
          const { error } = await supabase.from('books').update({ specialization: newName }).eq('specialization', oldName);
          if (error) throw error;
          setBooks(prev => prev.map(b => b.specialization === oldName ? { ...b, specialization: newName } : b));
      } catch (error: any) {
          console.error("Update spec error", error);
      }
  };

  const handleDeleteSpecialization = (name: string) => {
      setSpecializations(prev => prev.filter(s => s !== name));
  };

  const handleAddSpecializations = (names: string[]) => {
      setSpecializations(prev => [...new Set([...prev, ...names])]);
  };

  // --- Settings Handlers ---
  const handleUpdateSettings = async (newSettings: LibrarySettings) => {
      try {
           const { error } = await supabase.from('settings').upsert({ id: 1, ...newSettings });
           if (error) console.warn("Settings sync failed, using local state");
           setSettings(newSettings);
      } catch (e) {
          console.error(e);
      }
  };

  const handleBackup = () => {
      const data = {
          settings,
          users,
          books,
          loans,
          timestamp: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `library_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleRestore = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = JSON.parse(e.target?.result as string);
              if (data.settings) setSettings(data.settings);
              if (data.users) setUsers(data.users);
              if (data.books) setBooks(data.books);
              if (data.loans) setLoans(data.loans);
              alert('تم استعادة النسخة الاحتياطية بنجاح');
          } catch (err) {
              alert('ملف غير صالح');
          }
      };
      reader.readAsText(file);
  };

  // --- Render ---

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-100" dir="rtl">
              <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-[#4A90E2] mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-slate-700">جاري تحميل النظام...</h2>
                  <p className="text-slate-500">يرجى الانتظار لحظات</p>
              </div>
          </div>
      );
  }

  if (!currentUser) {
      return <Login onLogin={handleLogin} libraryName={settings.name} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900" dir="rtl">
      <Sidebar 
        currentPage={currentPage}
        onNavigate={(page) => { setIsSidebarOpen(false); setCurrentPage(page); }}
        currentUser={currentUser}
        onLogout={handleLogout}
        settings={settings}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 h-screen overflow-hidden flex flex-col relative">
         {/* Mobile Header */}
         <div className="md:hidden p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
             <div className="font-bold text-[#2C6FB7]">{settings.name}</div>
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                 <Menu className="w-6 h-6" />
             </button>
         </div>

         <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto">
                {currentPage === Page.DASHBOARD && (
                    <Dashboard 
                        books={books}
                        loans={loans}
                        users={users}
                        notifications={notifications}
                        settings={settings}
                    />
                )}
                
                {currentPage === Page.CATALOG && (
                    <Catalog 
                        books={books}
                        onAddBook={handleAddBook}
                        onAddBooks={handleAddBooks}
                        onUpdateBook={handleUpdateBook}
                        onDeleteBook={handleDeleteBook}
                        role={currentUser.role}
                        specializationsList={specializations}
                    />
                )}

                {currentPage === Page.LENDING && (
                    <Lending 
                        books={books}
                        loans={loans}
                        users={users}
                        currentUser={currentUser}
                        onIssueBook={handleIssueBook}
                        onReturnBook={handleReturnBook}
                        onAddBulkLoans={handleAddBulkLoans}
                    />
                )}

                {currentPage === Page.USERS && currentUser.role === 'admin' && (
                    <UserManagement 
                        users={users}
                        onAddUser={handleAddUser}
                        onAddUsers={handleAddUsers}
                        onUpdateUser={handleUpdateUser}
                        onDeleteUser={handleDeleteUser}
                    />
                )}

                {currentPage === Page.SPECIALIZATIONS && currentUser.role === 'admin' && (
                    <Specializations 
                        specializations={specializations}
                        books={books}
                        onAdd={handleAddSpecialization}
                        onAddSpecializations={handleAddSpecializations}
                        onUpdate={handleUpdateSpecialization}
                        onDelete={handleDeleteSpecialization}
                    />
                )}

                {currentPage === Page.AI_ASSISTANT && (
                    <Assistant books={books} />
                )}

                {currentPage === Page.SETTINGS && currentUser.role === 'admin' && (
                    <Settings 
                        settings={settings}
                        onUpdateSettings={handleUpdateSettings}
                        onBackup={handleBackup}
                        onRestore={handleRestore}
                    />
                )}
            </div>
         </div>
      </main>
    </div>
  );
};

export default App;
