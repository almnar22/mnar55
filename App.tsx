
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Catalog } from './components/Catalog';
import { Lending } from './components/Lending';
import { Assistant } from './components/Assistant';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { Specializations } from './components/Specializations';
import { Settings } from './components/Settings';
import { Page, Book, Loan, User, LibrarySettings } from './types';
import { supabase } from './services/supabaseClient';
import { Loader2 } from 'lucide-react';

const INITIAL_SETTINGS: LibrarySettings = {
  name: 'مكتبة كلية المنار الجامعية المركزية',
  institution: 'كلية المنار',
  copyrightText: 'جميع الحقوق محفوظة © 2025',
  email: 'admin@almanar.edu',
  phone: '0501234567',
  
  backupIntervalDays: 7,
  lastBackupDate: new Date().toISOString(),
  
  dashboardMode: 'auto',
  manualStats: {
      students: 0,
      books: 0,
      journals: 0,
      professors: 0,
      borrowed: 0,
      available: 0
  },
  visibleStats: {
      students: true,
      books: true,
      journals: true,
      professors: false,
      borrowed: false,
      available: false
  },

  privacyLevel: 'medium',
  securityOptions: {
      exportRestricted: true,
      encrypted: false,
      activityLog: true,
      maintenanceMode: false
  },
  
  permissions: {
      'student': { 'borrow': true, 'search': true, 'reserve': false, 'digital': true },
      'professor': { 'borrow': true, 'search': true, 'reserve': true, 'digital': true },
      'staff': { 'borrow': true, 'search': true, 'reserve': true, 'digital': true },
      'admin': { 'borrow': true, 'search': true, 'reserve': true, 'digital': true }
  }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>(Page.LOGIN);
  const [isLoading, setIsLoading] = useState(true);
  
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [settings, setSettings] = useState<LibrarySettings>(INITIAL_SETTINGS);
  const [settingsId, setSettingsId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);

  // Load Data from Supabase
  const fetchData = async () => {
      setIsLoading(true);
      try {
          // 1. Fetch Settings
          const { data: settingsData } = await supabase.from('settings').select('*').limit(1).single();
          if (settingsData && settingsData.config) {
              setSettings(settingsData.config);
              setSettingsId(settingsData.id);
          } else {
              // Create default settings if not exist
              const { data: newSetting } = await supabase.from('settings').insert([{ config: INITIAL_SETTINGS }]).select().single();
              if (newSetting) setSettingsId(newSetting.id);
          }

          // 2. Fetch Books
          const { data: booksData } = await supabase.from('books').select('*');
          if (booksData) setBooks(booksData as Book[]);

          // 3. Fetch Users
          const { data: usersData } = await supabase.from('users').select('*');
          if (usersData) setUsers(usersData as User[]);

          // 4. Fetch Loans
          const { data: loansData } = await supabase.from('loans').select('*');
          if (loansData) setLoans(loansData as Loan[]);

          // 5. Fetch Specializations
          const { data: specsData } = await supabase.from('specializations').select('*');
          if (specsData) setSpecializations(specsData.map((s: any) => s.name));

          // If no admin user exists, create a default one
          if (!usersData || usersData.length === 0) {
              const defaultAdmin: User = {
                  id: 'admin', name: 'Admin', email: 'admin@system.com', password: 'admin',
                  role: 'admin', status: 'active', joinDate: new Date().toISOString(), visits: 0, department: 'IT'
              };
              await supabase.from('users').insert([defaultAdmin]);
              setUsers([defaultAdmin]);
          }

      } catch (error) {
          console.error("Error fetching data:", error);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  // Check for notifications
  useEffect(() => {
    if (!currentUser) return;
    const notes: string[] = [];
    
    if (currentUser.role === 'admin') {
        const overdueCount = loans.filter(l => l.status === 'overdue').length;
        if (overdueCount > 0) notes.push(`يوجد ${overdueCount} كتب متأخرة عن موعد الاسترجاع.`);
    } else {
        const myOverdue = loans.filter(l => l.userId === currentUser.id && l.status === 'overdue').length;
        if (myOverdue > 0) notes.push(`لديك ${myOverdue} كتب متأخرة. يرجى إرجاعها.`);
    }

    setNotifications(notes);
  }, [loans, currentUser]);

  // Auth Handlers
  const handleLogin = async (id: string, password: string): Promise<string | void> => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .eq('password', password)
        .single();

      if (error || !data) {
          return 'بيانات الدخول غير صحيحة';
      }

      const user = data as User;
      if (user.status === 'suspended') {
          return 'تم إيقاف هذا الحساب. يرجى مراجعة الإدارة.';
      }

      // Update visit count
      const updatedUser = { ...user, lastLogin: new Date().toISOString(), visits: (user.visits || 0) + 1 };
      await supabase.from('users').update({ lastLogin: updatedUser.lastLogin, visits: updatedUser.visits }).eq('id', user.id);
      
      setCurrentUser(updatedUser);
      setCurrentPage(Page.DASHBOARD);
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setCurrentPage(Page.LOGIN);
  };

  // --- CRUD Handlers (Synced with Supabase) ---

  // Users
  const handleAddUser = async (newUser: User) => {
      const { error } = await supabase.from('users').insert([newUser]);
      if (!error) {
          setUsers(prev => [...prev, newUser]);
          alert('تم إضافة المستخدم بنجاح');
      } else {
          alert('حدث خطأ أثناء الإضافة: ' + error.message);
      }
  };

  const handleAddUsers = async (newUsers: User[]) => {
      const { error } = await supabase.from('users').insert(newUsers);
      if (!error) {
          setUsers(prev => [...prev, ...newUsers]);
          alert(`تم إضافة ${newUsers.length} مستخدم بنجاح`);
      }
  };

  const handleUpdateUser = async (updatedUser: User) => {
      const { error } = await supabase.from('users').update(updatedUser).eq('id', updatedUser.id);
      if (!error) {
          setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
          if (currentUser && currentUser.id === updatedUser.id) setCurrentUser(updatedUser);
          alert('تم التحديث بنجاح');
      }
  };

  const handleDeleteUser = async (userId: string) => {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (!error) setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // Books
  const handleAddBook = async (newBook: Book) => {
      const { error } = await supabase.from('books').insert([newBook]);
      if (!error) {
          setBooks(prev => [...prev, newBook]);
          alert('تم إضافة الكتاب بنجاح');
      }
  };

  const handleAddBooks = async (newBooks: Book[]) => {
      const { error } = await supabase.from('books').insert(newBooks);
      if (!error) {
          setBooks(prev => [...prev, ...newBooks]);
          alert(`تم إضافة ${newBooks.length} كتاب بنجاح`);
      }
  };

  const handleUpdateBook = async (updatedBook: Book) => {
      const { error } = await supabase.from('books').update(updatedBook).eq('id', updatedBook.id);
      if (!error) {
          setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
          alert('تم تحديث الكتاب');
      }
  };

  const handleDeleteBook = async (id: string) => {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (!error) setBooks(prev => prev.filter(b => b.id !== id));
  };

  // Specializations
  const handleAddSpecialization = async (name: string) => {
      const { error } = await supabase.from('specializations').insert([{ name }]);
      if (!error) setSpecializations(prev => [...prev, name]);
  };

  const handleAddSpecializations = async (newSpecs: string[]) => {
      const rows = newSpecs.map(name => ({ name }));
      const { error } = await supabase.from('specializations').insert(rows);
      if (!error) {
          setSpecializations(prev => [...prev, ...newSpecs]);
          alert('تم إضافة التخصصات');
      }
  };

  const handleUpdateSpecialization = async (oldName: string, newName: string) => {
      // Supabase doesn't support direct PK update easily, usually delete insert or cascade.
      // For simplicity in this structure: Update table, then update books
      const { error } = await supabase.from('specializations').update({ name: newName }).eq('name', oldName);
      if (!error) {
          // Also update books with this spec
          await supabase.from('books').update({ specialization: newName }).eq('specialization', oldName);
          
          setSpecializations(prev => prev.map(s => s === oldName ? newName : s));
          setBooks(prev => prev.map(b => b.specialization === oldName ? { ...b, specialization: newName } : b));
      }
  };

  const handleDeleteSpecialization = async (name: string) => {
      const { error } = await supabase.from('specializations').delete().eq('name', name);
      if (!error) setSpecializations(prev => prev.filter(s => s !== name));
  };

  // Loans
  const handleIssueBook = async (bookId: string, userId: string, durationDays: number, notes?: string) => {
    const book = books.find(b => b.id === bookId);
    const user = users.find(u => u.id === userId);

    if (!book || !user) return;
    if (book.remainingCopies <= 0) {
        alert('لا توجد نسخ متبقية');
        return;
    }

    const newLoan: Loan = {
        id: crypto.randomUUID(),
        bookId: book.id,
        bookTitle: book.title,
        userId: user.id,
        studentName: user.name,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        originalLocation: {
            cabinet: book.cabinet,
            bookShelfNumber: book.bookShelfNumber,
            shelfOrder: book.shelfOrder
        },
        notes: notes
    };

    const { error } = await supabase.from('loans').insert([newLoan]);
    if (!error) {
        // Update book copies
        await supabase.from('books').update({ remainingCopies: book.remainingCopies - 1 }).eq('id', book.id);
        
        setLoans(prev => [...prev, newLoan]);
        setBooks(prev => prev.map(b => b.id === bookId ? { ...b, remainingCopies: b.remainingCopies - 1 } : b));
    }
  };

  const handleReturnBook = async (loanId: string, condition: 'excellent' | 'good' | 'damaged' | 'lost', penalty: number, notes: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    // We use explicit object for updates to ensure types are correct
    const updates = {
        status: condition === 'lost' ? 'lost' : 'returned',
        returnDate: new Date().toISOString(),
        conditionOnReturn: condition,
        penaltyAmount: penalty,
        notes: notes ? (loan.notes ? `${loan.notes} | ${notes}` : notes) : loan.notes
    };

    const { error } = await supabase.from('loans').update(updates).eq('id', loanId);
    if (!error) {
        setLoans(prev => prev.map(l => l.id === loanId ? { ...l, ...updates } as Loan : l));
        
        if (condition !== 'lost') {
            const book = books.find(b => b.id === loan.bookId);
            if (book) {
                await supabase.from('books').update({ remainingCopies: book.remainingCopies + 1 }).eq('id', book.id);
                setBooks(prev => prev.map(b => b.id === book.id ? { ...b, remainingCopies: b.remainingCopies + 1 } : b));
            }
        }
    }
  };

  // Settings
  const handleUpdateSettings = async (newSettings: LibrarySettings) => {
      if (settingsId) {
          const { error } = await supabase.from('settings').update({ config: newSettings }).eq('id', settingsId);
          if (!error) {
              setSettings(newSettings);
          }
      }
  };

  const handleBackup = () => {
    const data = { books, loans, users, settings, specializations };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleRestore = (file: File) => {
      alert('لاستعادة نسخة احتياطية كاملة، يرجى التواصل مع مسؤول قاعدة البيانات.');
  };

  if (isLoading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-[#4A90E2]" />
              <p className="text-slate-500 font-bold">جاري الاتصال بقاعدة البيانات...</p>
          </div>
      );
  }

  if (!currentUser || currentPage === Page.LOGIN) {
      return <Login onLogin={handleLogin} libraryName={settings.name} />;
  }

  const renderContent = () => {
    if (currentUser.role === 'student' && [Page.DASHBOARD, Page.USERS, Page.SPECIALIZATIONS, Page.SETTINGS].includes(currentPage)) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <h3 className="text-xl font-bold mb-2">غير مصرح بالدخول</h3>
                <p>هذه الصفحة متاحة للمسؤولين فقط.</p>
            </div>
        );
    }

    switch (currentPage) {
      case Page.DASHBOARD:
        return <Dashboard books={books} loans={loans} notifications={notifications} users={users} settings={settings} />;
      case Page.CATALOG:
        return <Catalog 
            books={books} 
            onAddBook={handleAddBook} 
            onAddBooks={handleAddBooks}
            onUpdateBook={handleUpdateBook}
            onDeleteBook={handleDeleteBook}
            role={currentUser.role}
            specializationsList={specializations}
        />;
      case Page.LENDING:
        return <Lending 
            books={books} 
            loans={loans} 
            users={users}
            currentUser={currentUser}
            onIssueBook={handleIssueBook} 
            onReturnBook={handleReturnBook} 
        />;
      case Page.SPECIALIZATIONS:
        return <Specializations
            specializations={specializations}
            books={books}
            onAdd={handleAddSpecialization}
            onAddSpecializations={handleAddSpecializations}
            onUpdate={handleUpdateSpecialization}
            onDelete={handleDeleteSpecialization}
        />;
      case Page.USERS:
        return <UserManagement 
            users={users} 
            onAddUser={handleAddUser}
            onAddUsers={handleAddUsers}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
        />
      case Page.AI_ASSISTANT:
        return <Assistant books={books} />;
      case Page.SETTINGS:
        return <Settings 
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onBackup={handleBackup}
            onRestore={handleRestore}
            stats={{
              students: users.filter(u => u.role === 'student').length,
              books: books.length,
              journals: books.filter(b => b.specialization.includes('دورية') || b.department.includes('دورية')).length, 
              professors: users.filter(u => u.role === 'professor').length,
              borrowed: loans.filter(l => l.status === 'active' || l.status === 'overdue').length,
              available: books.reduce((acc, b) => acc + b.remainingCopies, 0)
            }}
        />;
      default:
        return <Dashboard books={books} loans={loans} notifications={notifications} users={users} settings={settings} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        currentUser={currentUser}
        onLogout={handleLogout}
        settings={settings}
      />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto h-screen">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
