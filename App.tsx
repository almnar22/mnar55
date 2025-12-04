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

// Mock Initial Data based on user request
const INITIAL_BOOKS: Book[] = [
  { 
    id: '1624', code: '1624', inventoryNumber: '0.00', 
    title: 'إدارة الأعمال وإدارة المستشفيات الجزء الأول', author: 'محمد عبد المنعم شعيب', 
    specialization: 'إدارة صحية', department: 'العلوم الصحية', 
    cabinet: 'F9', bookShelfNumber: '1', shelfOrder: 'رف 1', 
    copies: 2, editionYear: '2013', entryDate: '2024-02-10', 
    remainingCopies: 2, parts: 0, price: 0.00 
  },
  { 
    id: '1625', code: '1625', inventoryNumber: '0.00', 
    title: 'الإدارة الصحية وإدارة المستشفيات الجزء الثاني', author: 'محمد عبد المنعم شعيب', 
    specialization: 'إدارة صحية', department: 'العلوم الصحية', 
    cabinet: 'F9', bookShelfNumber: '3', shelfOrder: 'رف 1', 
    copies: 2, editionYear: '2014', entryDate: '2024-02-10', 
    remainingCopies: 1, parts: 0, price: 0.00 
  },
  { 
    id: '1626', code: '1626', inventoryNumber: '0.00', 
    title: 'قاموس المصطلحات الطبية الموحد', author: 'د. أحمد شفيق', 
    specialization: 'قواميس ومعاجم', department: 'العلوم الصحية', 
    cabinet: 'D1', bookShelfNumber: '5', shelfOrder: 'رف 2', 
    copies: 5, editionYear: '2020', entryDate: '2024-01-15', 
    remainingCopies: 5, parts: 1, price: 150.00 
  },
  { 
    id: '1627', code: '1627', inventoryNumber: '0.00', 
    title: 'مجلة البحوث الصحية - العدد 45', author: 'هيئة التحرير', 
    specialization: 'دوريات علمية', department: 'الدوريات', 
    cabinet: 'M1', bookShelfNumber: '12', shelfOrder: 'رف 3', 
    copies: 10, editionYear: '2024', entryDate: '2024-03-01', 
    remainingCopies: 10, parts: 1, price: 50.00 
  },
];

const INITIAL_USERS: User[] = [
    {
        id: 'admin', name: 'المسؤول الرئيسي', email: 'admin@library.edu', password: 'admin',
        role: 'admin', status: 'active', joinDate: '2023-01-01', department: 'الإدارة', visits: 142
    },
    {
        id: '1001', name: 'عمر خالد', email: 'omar@student.edu', password: '123',
        role: 'student', status: 'active', joinDate: '2023-09-01', department: 'العلوم الصحية', visits: 25
    },
    {
        id: '1002', name: 'سارة أحمد', email: 'sara@student.edu', password: '123',
        role: 'student', status: 'active', joinDate: '2023-09-15', department: 'التمريض', visits: 12
    },
    {
        id: '2001', name: 'د. محمد علي', email: 'prof.mohamed@university.edu', password: '456',
        role: 'professor', status: 'active', joinDate: '2022-01-15', department: 'علوم الحاسوب', visits: 89
    },
    {
        id: '3001', name: 'أحمد سالم', email: 'staff.ahmed@university.edu', password: '789',
        role: 'staff', status: 'inactive', joinDate: '2023-05-10', department: 'شؤون الطلاب', visits: 45
    }
];

const INITIAL_LOANS: Loan[] = [
  { 
      id: 'l1', bookId: '1625', bookTitle: 'الإدارة الصحية وإدارة المستشفيات الجزء الثاني', 
      userId: '1001', studentName: 'عمر خالد', 
      issueDate: '2023-10-01', dueDate: '2023-10-15', status: 'overdue',
      originalLocation: { cabinet: 'F9', shelfOrder: 'رف 1', bookShelfNumber: '3' }
  },
];

const INITIAL_SETTINGS: LibrarySettings = {
  name: 'مكتبة الجامعة المركزية',
  institution: 'مكتبة الجامعة المركزية',
  copyrightText: 'جميع الحقوق محفوظة © 2025',
  email: 'admin@library.edu',
  phone: '0501234567',
  
  backupIntervalDays: 7,
  lastBackupDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  
  dashboardMode: 'auto',
  manualStats: {
      students: 2847,
      books: 45239,
      journals: 1203,
      professors: 327,
      borrowed: 892,
      available: 44347
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
  
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [loans, setLoans] = useState<Loan[]>(INITIAL_LOANS);
  const [settings, setSettings] = useState<LibrarySettings>(INITIAL_SETTINGS);
  const [notifications, setNotifications] = useState<string[]>([]);
  
  // State for Specializations
  const [specializations, setSpecializations] = useState<string[]>(() => 
    Array.from(new Set(INITIAL_BOOKS.map(b => b.specialization)))
  );

  // Check for notifications
  useEffect(() => {
    if (!currentUser) return;
    const notes: string[] = [];
    
    // Check overdue loans
    if (currentUser.role === 'admin') {
        const overdueCount = loans.filter(l => l.status === 'overdue').length;
        if (overdueCount > 0) notes.push(`يوجد ${overdueCount} كتب متأخرة عن موعد الاسترجاع.`);
        
        // Check backup
        if (settings.lastBackupDate) {
            const lastBackup = new Date(settings.lastBackupDate).getTime();
            const daysSinceBackup = (Date.now() - lastBackup) / (1000 * 3600 * 24);
            if (daysSinceBackup > settings.backupIntervalDays) {
                notes.push('حان موعد النسخ الاحتياطي الدوري للبيانات.');
            }
        }
    } else {
        // Student notifications
        const myOverdue = loans.filter(l => l.userId === currentUser.id && l.status === 'overdue').length;
        if (myOverdue > 0) notes.push(`لديك ${myOverdue} كتب متأخرة. يرجى إرجاعها.`);
    }

    setNotifications(notes);
  }, [loans, settings, currentUser]);

  // Auth Handlers
  const handleLogin = (user: User) => {
    // Increment visit count
    const updatedUser = { 
        ...user, 
        lastLogin: new Date().toISOString(),
        visits: (user.visits || 0) + 1
    };
    // Update user in list
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    setCurrentPage(Page.DASHBOARD);
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setCurrentPage(Page.LOGIN);
  };

  // User Management Handlers
  const handleAddUser = (newUser: User) => {
      setUsers(prev => [...prev, newUser]);
      alert('تم إضافة المستخدم بنجاح');
  };

  const handleAddUsers = (newUsers: User[]) => {
      const existingIds = new Set(users.map(u => u.id));
      const filtered = newUsers.filter(u => !existingIds.has(u.id));
      
      if (filtered.length === 0) {
          alert('جميع المستخدمين موجودين بالفعل أو القائمة فارغة.');
          return;
      }

      setUsers(prev => [...prev, ...filtered]);
      alert(`تم إضافة ${filtered.length} مستخدم بنجاح`);
  };

  const handleUpdateUser = (updatedUser: User) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (currentUser && currentUser.id === updatedUser.id) {
          setCurrentUser(updatedUser);
      }
      alert('تم تحديث بيانات المستخدم');
  };

  const handleDeleteUser = (userId: string) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // Book Handlers
  const handleAddBook = (newBook: Book) => {
    setBooks(prev => [...prev, newBook]);
    alert('تم إضافة الكتاب بنجاح');
  };

  const handleAddBooks = (newBooks: Book[]) => {
    setBooks(prev => [...prev, ...newBooks]);
    alert(`تم إضافة ${newBooks.length} كتاب بنجاح`);
  };

  const handleUpdateBook = (updatedBook: Book) => {
    setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
    alert('تم تحديث بيانات الكتاب');
  };

  const handleDeleteBook = (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
  };

  // Specialization Handlers
  const handleAddSpecialization = (name: string) => {
    setSpecializations(prev => [...prev, name]);
  };

  const handleAddSpecializations = (newSpecs: string[]) => {
      const existing = new Set(specializations);
      const filtered = newSpecs.filter(s => !existing.has(s) && s.trim() !== '');

      if (filtered.length === 0) {
           alert('جميع التخصصات موجودة بالفعل أو القائمة فارغة.');
           return;
      }

      setSpecializations(prev => [...prev, ...filtered]);
      alert(`تم إضافة ${filtered.length} تخصص بنجاح`);
  };

  const handleUpdateSpecialization = (oldName: string, newName: string) => {
    setSpecializations(prev => prev.map(s => s === oldName ? newName : s));
    setBooks(prev => prev.map(b => b.specialization === oldName ? { ...b, specialization: newName } : b));
  };

  const handleDeleteSpecialization = (name: string) => {
    setSpecializations(prev => prev.filter(s => s !== name));
  };

  // Lending Handlers
  const handleIssueBook = (bookId: string, userId: string, durationDays: number, notes?: string) => {
    const book = books.find(b => b.id === bookId);
    const user = users.find(u => u.id === userId);

    if (!book || !user) return;
    
    if (book.remainingCopies <= 0) {
        alert('عذراً، لا توجد نسخ متبقية من هذا الكتاب.');
        return;
    }

    const newLoan: Loan = {
        id: Date.now().toString(),
        bookId: book.id,
        bookTitle: book.title,
        userId: user.id,
        studentName: user.name,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        // Save Original Location
        originalLocation: {
            cabinet: book.cabinet,
            bookShelfNumber: book.bookShelfNumber,
            shelfOrder: book.shelfOrder
        },
        notes: notes
    };

    setLoans(prev => [...prev, newLoan]);
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, remainingCopies: b.remainingCopies - 1 } : b));
  };

  const handleReturnBook = (loanId: string, condition: 'excellent' | 'good' | 'damaged' | 'lost', penalty: number, notes: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    setLoans(prev => prev.map(l => l.id === loanId ? { 
        ...l, 
        status: condition === 'lost' ? 'lost' : 'returned', 
        returnDate: new Date().toISOString(),
        conditionOnReturn: condition,
        penaltyAmount: penalty,
        notes: notes ? (l.notes + ' | ' + notes) : l.notes
    } : l));
    
    // Increment remaining copies if not lost
    if (condition !== 'lost') {
        setBooks(prev => prev.map(b => b.id === loan.bookId ? { ...b, remainingCopies: b.remainingCopies + 1 } : b));
    }
  };

  // Settings Handlers
  const handleUpdateSettings = (newSettings: LibrarySettings) => {
      setSettings(newSettings);
  };

  const handleBackup = () => {
    const data = { books, loans, users, settings, specializations };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    setSettings(prev => ({ ...prev, lastBackupDate: new Date().toISOString() }));
    alert('تم تحميل النسخة الاحتياطية بنجاح');
  };

  const handleRestore = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.books && data.loans && data.users) {
            setBooks(data.books);
            setLoans(data.loans);
            setUsers(data.users);
            if(data.settings) setSettings(data.settings);
            if(data.specializations) setSpecializations(data.specializations);
            alert('تم استعادة البيانات بنجاح');
        } else {
            alert('ملف غير صالح');
        }
      } catch (err) {
        alert('خطأ في قراءة الملف');
      }
    };
    reader.readAsText(file);
  };

  if (!currentUser || currentPage === Page.LOGIN) {
      return <Login users={users} onLogin={handleLogin} libraryName={settings.name} />;
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