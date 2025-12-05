
import React, { useState, useMemo, useRef } from 'react';
import { Book, UserRole } from '../types';
import { 
  Search, Filter, Plus, Printer, Edit2, Trash2, X, 
  FileSpreadsheet, Check, Info, Image as ImageIcon, 
  BookOpen, AlertTriangle, CheckCircle, RotateCcw,
  UploadCloud, Download, LayoutGrid, Library, Eye,
  MapPin, Calendar, DollarSign, Hash, Layers
} from 'lucide-react';

interface CatalogProps {
  books: Book[];
  onAddBook: (book: Book) => void;
  onAddBooks: (books: Book[]) => void;
  onUpdateBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  role: UserRole;
  specializationsList: string[];
}

export const Catalog: React.FC<CatalogProps> = ({ books, onAddBook, onAddBooks, onUpdateBook, onDeleteBook, role, specializationsList }) => {
  // --- States ---
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const [viewBook, setViewBook] = useState<Book | null>(null); // State for viewing details
  
  // Search & Filter State
  const [searchFilter, setSearchFilter] = useState({
    term: '',
    type: 'all', // all, title, author, code
    specialization: '',
    department: '',
    cabinet: '',
    status: 'all' // all, available, unavailable
  });

  // Add/Edit Wizard State
  const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'details' | 'image'>('basic');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<Book>({} as Book);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Import Wizard State
  const [bulkStep, setBulkStep] = useState<1 | 2 | 3>(1);
  const [bulkData, setBulkData] = useState('');
  const [parsedBooks, setParsedBooks] = useState<Book[]>([]);

  const isAdmin = role === 'admin';

  // --- Derived Data ---
  
  // Unique lists for filters
  const departments = useMemo(() => Array.from(new Set(books.map(b => b.department).filter(Boolean))), [books]);
  const cabinets = useMemo(() => Array.from(new Set(books.map(b => b.cabinet).filter(Boolean))), [books]);

  // Statistics
  const stats = useMemo(() => {
    const totalTitles = books.length;
    const totalCopies = books.reduce((sum, b) => sum + b.copies, 0);
    const availableCopies = books.reduce((sum, b) => sum + b.remainingCopies, 0);
    const borrowedCopies = totalCopies - availableCopies; // Simplified assumption
    
    return {
      titles: totalTitles,
      available: availableCopies,
      borrowed: borrowedCopies,
      missing: 0 // Placeholder as we don't track missing specifically in Book model yet
    };
  }, [books]);

  // Filtering Logic
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const term = searchFilter.term.toLowerCase();
      
      // Text Search
      let matchesTerm = false;
      if (!term) matchesTerm = true;
      else if (searchFilter.type === 'title') matchesTerm = book.title.toLowerCase().includes(term);
      else if (searchFilter.type === 'author') matchesTerm = book.author.toLowerCase().includes(term);
      else if (searchFilter.type === 'code') matchesTerm = book.code.toLowerCase().includes(term);
      else matchesTerm = book.title.toLowerCase().includes(term) || book.author.toLowerCase().includes(term) || book.code.includes(term);

      // Dropdown Filters
      const matchesSpec = !searchFilter.specialization || book.specialization === searchFilter.specialization;
      const matchesDept = !searchFilter.department || book.department === searchFilter.department;
      const matchesCab = !searchFilter.cabinet || book.cabinet === searchFilter.cabinet;
      
      // Status Filter
      let matchesStatus = true;
      if (searchFilter.status === 'available') matchesStatus = book.remainingCopies > 0;
      if (searchFilter.status === 'unavailable') matchesStatus = book.remainingCopies === 0;

      return matchesTerm && matchesSpec && matchesDept && matchesCab && matchesStatus;
    });
  }, [books, searchFilter]);

  // --- Handlers ---

  const initialFormState: Book = {
    id: '', code: '', inventoryNumber: '0.00', title: '', author: '', 
    specialization: '', department: '', cabinet: '', bookShelfNumber: '', 
    shelfOrder: '', copies: 1, editionYear: new Date().getFullYear().toString(), 
    entryDate: new Date().toISOString().split('T')[0], remainingCopies: 1, 
    parts: 0, price: 0.00, coverImage: ''
  };

  const handleOpenAdd = () => {
    setEditingBook(null);
    setFormData({ ...initialFormState, id: Date.now().toString() });
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleOpenEdit = (book: Book) => {
    setEditingBook(book);
    setFormData(book);
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, coverImage: event.target?.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmitBook = () => {
    const finalData = {
        ...formData,
        copies: Number(formData.copies),
        remainingCopies: Number(formData.remainingCopies),
        parts: Number(formData.parts),
        price: Number(formData.price)
    };

    if (editingBook) {
        onUpdateBook(finalData);
    } else {
        onAddBook(finalData);
    }
    setShowModal(false);
  };

  // Export to CSV
  const handleExport = () => {
    const headers = ['رقم الكود', 'اسم الكتاب', 'المؤلف', 'التخصص', 'القسم', 'الخزانة', 'عدد النسخ', 'المتبقي'];
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + headers.join(",") + "\n"
        + filteredBooks.map(b => {
            return `${b.code},"${b.title}","${b.author}","${b.specialization}","${b.department}","${b.cabinet}",${b.copies},${b.remainingCopies}`;
        }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "library_books.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk Import Handlers
  const handleParseBulk = () => {
    if (!bulkData.trim()) return;
    
    const rows = bulkData.trim().split('\n');
    const newBooks: Book[] = [];
    
    rows.forEach((row, index) => {
        const cols = row.split('\t').map(c => c.trim());
        if (cols.length < 3) return; 
        
        // Expected columns: Code | Inventory | Title | Author | Specialization | Department | Cabinet | Shelf Number | Shelf Order | Copies | Edition | Entry Date | Remaining | Parts | Price
        const book: Book = {
            id: (Date.now() + index).toString(),
            code: cols[0] || '',
            inventoryNumber: cols[1] || '0.00',
            title: cols[2] || 'بدون عنوان',
            author: cols[3] || 'غير معروف',
            specialization: cols[4] || 'عام',
            department: cols[5] || '',
            cabinet: cols[6] || '',
            bookShelfNumber: cols[7] || '',
            shelfOrder: cols[8] || '',
            copies: parseInt(cols[9]) || 1,
            editionYear: cols[10] || '',
            entryDate: cols[11] || new Date().toISOString().split('T')[0],
            remainingCopies: parseInt(cols[12]) || 1,
            parts: parseInt(cols[13]) || 0,
            price: parseFloat(cols[14]) || 0,
            coverImage: '' 
        };
        newBooks.push(book);
    });

    setParsedBooks(newBooks);
    setBulkStep(2);
  };

  const confirmBulkImport = () => {
    onAddBooks(parsedBooks);
    setParsedBooks([]);
    setBulkData('');
    setBulkStep(1);
    setShowBulkModal(false);
  };

  // Helper for progress bar
  const getProgress = () => {
      const tabs = ['basic', 'location', 'details', 'image'];
      const idx = tabs.indexOf(activeTab) + 1;
      return (idx / 4) * 100;
  };

  const handleNextTab = () => {
      const tabs: ('basic' | 'location' | 'details' | 'image')[] = ['basic', 'location', 'details', 'image'];
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) {
          setActiveTab(tabs[currentIndex + 1]);
      }
  };

  const handlePrevTab = () => {
      const tabs: ('basic' | 'location' | 'details' | 'image')[] = ['basic', 'location', 'details', 'image'];
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0) {
          setActiveTab(tabs[currentIndex - 1]);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* --- Header & Stats --- */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
             <div>
                <h2 className="text-2xl font-bold text-slate-800">المكتبة الورقية</h2>
                <p className="text-slate-500">إدارة محتوى المكتبة والسجلات</p>
             </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 md:gap-4 hover:shadow-md transition cursor-pointer group">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-[#4A90E2] to-[#2C6FB7] flex items-center justify-center text-white text-lg md:text-2xl shadow-lg shadow-blue-200 group-hover:scale-110 transition">
                    <BookOpen />
                </div>
                <div>
                    <h3 className="text-xl md:text-3xl font-bold text-slate-800">{stats.titles}</h3>
                    <p className="text-slate-500 text-xs md:text-sm">إجمالي العناوين</p>
                </div>
            </div>
            
            <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 md:gap-4 hover:shadow-md transition cursor-pointer group">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] flex items-center justify-center text-white text-lg md:text-2xl shadow-lg shadow-green-200 group-hover:scale-110 transition">
                    <CheckCircle />
                </div>
                <div>
                    <h3 className="text-xl md:text-3xl font-bold text-slate-800">{stats.available}</h3>
                    <p className="text-slate-500 text-xs md:text-sm">نسخة متاحة</p>
                </div>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 md:gap-4 hover:shadow-md transition cursor-pointer group">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-[#FFA726] to-[#EF6C00] flex items-center justify-center text-white text-lg md:text-2xl shadow-lg shadow-orange-200 group-hover:scale-110 transition">
                    <Library />
                </div>
                <div>
                    <h3 className="text-xl md:text-3xl font-bold text-slate-800">{stats.borrowed}</h3>
                    <p className="text-slate-500 text-xs md:text-sm">نسخة مستعارة</p>
                </div>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 md:gap-4 hover:shadow-md transition cursor-pointer group">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-[#F44336] to-[#C62828] flex items-center justify-center text-white text-lg md:text-2xl shadow-lg shadow-red-200 group-hover:scale-110 transition">
                    <AlertTriangle />
                </div>
                <div>
                    <h3 className="text-xl md:text-3xl font-bold text-slate-800">{stats.missing}</h3>
                    <p className="text-slate-500 text-xs md:text-sm">نسخ ناقصة</p>
                </div>
            </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row flex-wrap gap-3">
             {isAdmin && (
                <div className="flex gap-2 w-full md:w-auto">
                    <button 
                        onClick={handleOpenAdd}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#4CAF50] hover:bg-[#388E3C] text-white px-4 md:px-6 py-3 rounded-lg font-bold shadow-lg shadow-green-500/20 transition hover:-translate-y-1 text-sm md:text-base"
                    >
                        <Plus className="w-5 h-5" /> إضافة كتاب
                    </button>
                    <button 
                        onClick={() => { setBulkStep(1); setParsedBooks([]); setBulkData(''); setShowBulkModal(true); }}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#FFA726] hover:bg-[#F57C00] text-white px-4 md:px-6 py-3 rounded-lg font-bold shadow-lg shadow-orange-500/20 transition hover:-translate-y-1 text-sm md:text-base"
                    >
                        <FileSpreadsheet className="w-5 h-5" /> إضافة جماعية
                    </button>
                </div>
             )}
             <div className="mr-auto flex gap-2 w-full md:w-auto">
                <button 
                    onClick={handleExport} 
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-lg font-medium hover:bg-slate-50 transition text-sm"
                >
                    <Download className="w-4 h-4" /> تصدير
                </button>
                <button 
                    onClick={() => window.print()} 
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-lg font-medium hover:bg-slate-50 transition text-sm"
                >
                    <Printer className="w-4 h-4" /> طباعة
                </button>
             </div>
        </div>

        {/* Advanced Search Bar */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                        type="text"
                        value={searchFilter.term}
                        onChange={(e) => setSearchFilter({...searchFilter, term: e.target.value})}
                        placeholder="بحث عام..."
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition"
                    />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
                    {['all', 'title', 'author', 'code'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setSearchFilter({...searchFilter, type})}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                                searchFilter.type === type 
                                ? 'bg-[#4A90E2] text-white shadow-sm' 
                                : 'text-slate-500 hover:text-slate-800 hover:bg-white'
                            }`}
                        >
                            {type === 'all' && 'الكل'}
                            {type === 'title' && 'العنوان'}
                            {type === 'author' && 'المؤلف'}
                            {type === 'code' && 'الكود'}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row flex-wrap gap-4 pt-2 border-t border-slate-100">
                 <div className="flex items-center gap-2 min-w-[200px]">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select 
                        value={searchFilter.specialization}
                        onChange={(e) => setSearchFilter({...searchFilter, specialization: e.target.value})}
                        className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#4A90E2]"
                    >
                        <option value="">كل التخصصات</option>
                        {specializationsList.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 <div className="flex items-center gap-2 min-w-[200px]">
                    <LayoutGrid className="w-4 h-4 text-slate-400" />
                    <select 
                        value={searchFilter.department}
                        onChange={(e) => setSearchFilter({...searchFilter, department: e.target.value})}
                        className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#4A90E2]"
                    >
                        <option value="">كل الأقسام</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                 </div>
                 <button 
                    onClick={() => setSearchFilter({term: '', type: 'all', specialization: '', department: '', cabinet: '', status: 'all'})}
                    className="mr-auto text-sm text-red-500 hover:text-red-700 flex items-center gap-1 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition"
                >
                    <RotateCcw className="w-3 h-3" /> إعادة تعيين
                 </button>
            </div>
        </div>
      </div>

      {/* --- Books Table (Desktop) --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hidden md:block">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <h3 className="font-bold text-slate-800">قائمة الكتب ({filteredBooks.length})</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-right text-sm border-separate border-spacing-0">
                <thead>
                    <tr>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#4A90E2] sticky top-0 first:rounded-tr-lg"></th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#4A90E2] sticky top-0">رقم الكود</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#4A90E2] sticky top-0">رقم الجرد</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#4A90E2] sticky top-0 min-w-[200px]">اسم الكتاب</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#4A90E2] sticky top-0">المؤلف</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#4A90E2] sticky top-0">التخصص</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#4A90E2] sticky top-0">القسسم</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#4A90E2] sticky top-0">الخزانة</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#4A90E2] sticky top-0 text-center">رقم الكتاب<br/>في الرف</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#4A90E2] sticky top-0 text-center">الترتيب<br/>في الرفوف</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#4A90E2] sticky top-0 text-center">عدد<br/>النسخ</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#4A90E2] sticky top-0">طبعة سنة</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#4A90E2] sticky top-0">تاريخ<br/>دخول الكتاب</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#4A90E2] sticky top-0 text-center">العدد<br/>المتبقي</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#4A90E2] sticky top-0 text-center">عدد<br/>الاجزاء</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#4A90E2] sticky top-0">السعر</th>
                        <th className="bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white p-4 font-semibold border-b-2 border-[#4A90E2] sticky top-0 last:rounded-tl-lg"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredBooks.map((book) => (
                        <tr key={book.id} className="hover:bg-blue-50/50 transition duration-150">
                            <td className="p-3 border-b border-slate-100">
                                <div className="w-10 h-14 bg-slate-100 rounded border border-slate-200 overflow-hidden flex items-center justify-center">
                                    {book.coverImage ? (
                                        <img src={book.coverImage} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-4 h-4 text-slate-300" />
                                    )}
                                </div>
                            </td>
                            <td className="p-3 font-mono font-medium text-slate-600 border-b border-slate-100">{book.code}</td>
                            <td className="p-3 text-slate-500 border-b border-slate-100">{book.inventoryNumber}</td>
                            <td className="p-3 font-bold text-slate-800 border-b border-slate-100">{book.title}</td>
                            <td className="p-3 text-slate-600 border-b border-slate-100">{book.author}</td>
                            <td className="p-3 text-slate-600 border-b border-slate-100">{book.specialization}</td>
                            <td className="p-3 text-slate-500 border-b border-slate-100">{book.department}</td>
                            <td className="p-3 font-medium text-[#4A90E2] border-b border-slate-100">{book.cabinet}</td>
                            <td className="p-3 text-center border-b border-slate-100">{book.bookShelfNumber}</td>
                            <td className="p-3 text-center border-b border-slate-100">{book.shelfOrder}</td>
                            <td className="p-3 text-center font-bold border-b border-slate-100">{book.copies}</td>
                            <td className="p-3 text-slate-500 border-b border-slate-100">{book.editionYear}</td>
                            <td className="p-3 text-slate-500 text-xs border-b border-slate-100">{book.entryDate}</td>
                            <td className="p-3 text-center border-b border-slate-100">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    book.remainingCopies > 0 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : 'bg-rose-100 text-rose-700'
                                }`}>
                                    {book.remainingCopies}
                                </span>
                            </td>
                            <td className="p-3 text-center border-b border-slate-100">{book.parts}</td>
                            <td className="p-3 text-slate-600 font-mono border-b border-slate-100">{book.price > 0 ? book.price.toFixed(2) : '-'}</td>
                            <td className="p-3 border-b border-slate-100">
                                <div className="flex gap-2 justify-end">
                                    <button 
                                        onClick={() => setViewBook(book)} 
                                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition" 
                                        title="عرض التفاصيل"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    {isAdmin ? (
                                        <>
                                            <button onClick={() => handleOpenEdit(book)} className="p-1.5 text-[#4A90E2] hover:bg-blue-50 rounded transition"><Edit2 className="w-4 h-4" /></button>
                                            <button 
                                                onClick={() => { setBookToDelete(book.id); setShowDeleteModal(true); }} 
                                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <button className="p-1.5 text-slate-400 hover:text-[#4A90E2] transition"><Info className="w-4 h-4" /></button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredBooks.length === 0 && (
                        <tr>
                            <td colSpan={17} className="p-12 text-center text-slate-500">
                                <div className="flex flex-col items-center gap-3">
                                    <Search className="w-12 h-12 text-slate-200" />
                                    <p>لا توجد نتائج مطابقة للبحث</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- Mobile Cards View (Hidden on Desktop) --- */}
      <div className="md:hidden space-y-4">
        {filteredBooks.map(book => (
            <div key={book.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
               <div className="flex gap-4">
                  <div className="w-20 h-28 bg-slate-100 rounded-lg shrink-0 overflow-hidden border border-slate-200">
                     {book.coverImage ? (
                        <img src={book.coverImage} className="w-full h-full object-cover" alt="" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-8 h-8" />
                        </div>
                     )}
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 line-clamp-2 text-sm">{book.title}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap shrink-0 ${
                            book.remainingCopies > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                            {book.remainingCopies} متاح
                        </span>
                     </div>
                     <p className="text-xs text-slate-500 mt-1 truncate">{book.author}</p>
                     <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">{book.code}</span>
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 truncate max-w-[100px]">{book.specialization}</span>
                     </div>
                     <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                         <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {book.cabinet || '-'}</span>
                     </div>
                  </div>
               </div>
               
               <div className="flex gap-2 pt-3 border-t border-slate-100 mt-auto">
                   <button 
                       onClick={() => setViewBook(book)}
                       className="flex-1 py-1.5 bg-slate-50 text-slate-600 rounded text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-1"
                   >
                       <Eye className="w-3 h-3" /> التفاصيل
                   </button>
                   {isAdmin && (
                       <>
                           <button 
                               onClick={() => handleOpenEdit(book)}
                               className="flex-1 py-1.5 bg-blue-50 text-blue-600 rounded text-xs font-bold hover:bg-blue-100 flex items-center justify-center gap-1"
                           >
                               <Edit2 className="w-3 h-3" /> تعديل
                           </button>
                           <button 
                               onClick={() => { setBookToDelete(book.id); setShowDeleteModal(true); }}
                               className="flex-1 py-1.5 bg-rose-50 text-rose-600 rounded text-xs font-bold hover:bg-rose-100 flex items-center justify-center gap-1"
                           >
                               <Trash2 className="w-3 h-3" /> حذف
                           </button>
                       </>
                   )}
               </div>
            </div>
        ))}
        {filteredBooks.length === 0 && (
            <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                <Search className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p>لا توجد كتب مطابقة</p>
            </div>
        )}
      </div>

      {/* --- View Book Details Modal --- */}
      {viewBook && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-100 bg-[#4A90E2] text-white flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <BookOpen className="w-6 h-6" />
                        تفاصيل الكتاب
                    </h3>
                    <button onClick={() => setViewBook(null)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    <div className="flex flex-col md:flex-row gap-8">
                        
                        {/* Right: Cover & Main Actions */}
                        <div className="w-full md:w-1/3 flex flex-col gap-4">
                            <div className="aspect-[2/3] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center relative group">
                                {viewBook.coverImage ? (
                                    <img src={viewBook.coverImage} className="w-full h-full object-cover" alt="Book Cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-300">
                                        <ImageIcon className="w-16 h-16" />
                                        <span className="text-sm">لا توجد صورة</span>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                     {viewBook.remainingCopies > 0 ? (
                                         <span className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg">متاح للاستعارة</span>
                                     ) : (
                                         <span className="bg-rose-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg">غير متاح</span>
                                     )}
                                </div>
                            </div>
                            
                            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                                <span className="block text-slate-400 text-xs mb-1">السعر</span>
                                <span className="block text-xl font-bold text-slate-800 flex items-center justify-center gap-1">
                                    <DollarSign className="w-4 h-4 text-emerald-500" />
                                    {viewBook.price > 0 ? viewBook.price.toFixed(2) : 'مجاني / غير محدد'}
                                </span>
                            </div>
                        </div>

                        {/* Left: Details Grid */}
                        <div className="w-full md:w-2/3 space-y-6">
                            
                            {/* Main Info */}
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-1">{viewBook.title}</h2>
                                <p className="text-slate-500 text-lg flex items-center gap-2">
                                    بواسطة <span className="text-[#4A90E2] font-medium">{viewBook.author}</span>
                                </p>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2">
                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium border border-blue-100 flex items-center gap-1">
                                    <Hash className="w-3 h-3" /> {viewBook.code}
                                </span>
                                <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-lg text-sm font-medium border border-purple-100">
                                    {viewBook.specialization}
                                </span>
                                {viewBook.department && (
                                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-sm font-medium border border-slate-200">
                                        {viewBook.department}
                                    </span>
                                )}
                            </div>

                            <hr className="border-slate-200" />

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs text-slate-400">رقم الجرد</span>
                                    <p className="font-bold text-slate-700">{viewBook.inventoryNumber || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-slate-400">تاريخ الدخول</span>
                                    <p className="font-bold text-slate-700 flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-slate-400" />
                                        {viewBook.entryDate}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-slate-400">سنة الطبعة</span>
                                    <p className="font-bold text-slate-700">{viewBook.editionYear || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-slate-400">عدد الأجزاء</span>
                                    <p className="font-bold text-slate-700">{viewBook.parts}</p>
                                </div>
                            </div>

                            {/* Location Box */}
                            <div className="bg-[#F0F7FF] border border-[#4A90E2]/30 rounded-xl p-4">
                                <h4 className="font-bold text-[#4A90E2] mb-3 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> موقع التخزين
                                </h4>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-sm">
                                        <span className="block text-[10px] text-slate-400">الخزانة</span>
                                        <span className="block font-bold text-slate-800 text-lg">{viewBook.cabinet || '-'}</span>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-sm">
                                        <span className="block text-[10px] text-slate-400">الرف</span>
                                        <span className="block font-bold text-slate-800 text-lg">{viewBook.bookShelfNumber || '-'}</span>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-sm">
                                        <span className="block text-[10px] text-slate-400">الترتيب</span>
                                        <span className="block font-bold text-slate-800 text-lg">{viewBook.shelfOrder || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Copies Status */}
                            <div className="bg-slate-100 rounded-xl p-4 flex justify-between items-center">
                                <div>
                                    <span className="text-xs text-slate-500 block">إجمالي النسخ</span>
                                    <span className="font-bold text-xl text-slate-800">{viewBook.copies}</span>
                                </div>
                                <div className="h-8 w-px bg-slate-300"></div>
                                <div>
                                    <span className="text-xs text-slate-500 block">المتبقي</span>
                                    <span className={`font-bold text-xl ${viewBook.remainingCopies > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{viewBook.remainingCopies}</span>
                                </div>
                                <div className="h-8 w-px bg-slate-300"></div>
                                <div>
                                    <span className="text-xs text-slate-500 block">مستعار</span>
                                    <span className="font-bold text-xl text-orange-600">{viewBook.copies - viewBook.remainingCopies}</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    {isAdmin && (
                        <button 
                            onClick={() => { setViewBook(null); handleOpenEdit(viewBook); }}
                            className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-100 transition flex items-center gap-2"
                        >
                            <Edit2 className="w-4 h-4" /> تعديل البيانات
                        </button>
                    )}
                    <button 
                        onClick={() => setViewBook(null)}
                        className="px-6 py-2 bg-[#4A90E2] text-white rounded-lg font-bold hover:bg-[#2C6FB7] transition"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- Add/Edit Modal (Wizard) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        {editingBook ? <Edit2 className="w-6 h-6 text-[#FFA726]" /> : <Plus className="w-6 h-6 text-[#4CAF50]" />}
                        {editingBook ? 'تعديل بيانات الكتاب' : 'إضافة كتاب جديد'}
                    </h3>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-6 h-6" /></button>
                </div>

                {/* Tabs & Progress */}
                <div className="bg-white border-b border-slate-100 px-6 pt-4">
                    <div className="flex gap-8 mb-4 overflow-x-auto">
                        <button 
                            onClick={() => setActiveTab('basic')}
                            className={`pb-3 font-bold text-sm transition relative whitespace-nowrap ${activeTab === 'basic' ? 'text-[#4A90E2]' : 'text-slate-500'}`}
                        >
                            البيانات الأساسية
                            {activeTab === 'basic' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#4A90E2] rounded-t-full"></div>}
                        </button>
                        <button 
                            onClick={() => setActiveTab('location')}
                            className={`pb-3 font-bold text-sm transition relative whitespace-nowrap ${activeTab === 'location' ? 'text-[#4A90E2]' : 'text-slate-500'}`}
                        >
                            التصنيف والموقع
                            {activeTab === 'location' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#4A90E2] rounded-t-full"></div>}
                        </button>
                        <button 
                            onClick={() => setActiveTab('details')}
                            className={`pb-3 font-bold text-sm transition relative whitespace-nowrap ${activeTab === 'details' ? 'text-[#4A90E2]' : 'text-slate-500'}`}
                        >
                            التفاصيل والنسخ
                            {activeTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#4A90E2] rounded-t-full"></div>}
                        </button>
                        <button 
                            onClick={() => setActiveTab('image')}
                            className={`pb-3 font-bold text-sm transition relative whitespace-nowrap ${activeTab === 'image' ? 'text-[#4A90E2]' : 'text-slate-500'}`}
                        >
                            اضف صورة الكتاب
                            {activeTab === 'image' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#4A90E2] rounded-t-full"></div>}
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    
                    {/* Basic Data Tab */}
                    {activeTab === 'basic' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4">
                             <div className="space-y-2">
                                 <label className="text-sm font-bold text-slate-700">رقم الكود <span className="text-red-500">*</span></label>
                                 <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-[#4A90E2] outline-none" required />
                                 <p className="text-xs text-slate-400">كود فريد لكل كتاب</p>
                             </div>
                             <div className="space-y-2">
                                 <label className="text-sm font-bold text-slate-700">رقم الجرد</label>
                                 <input type="text" value={formData.inventoryNumber} onChange={e => setFormData({...formData, inventoryNumber: e.target.value})} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-[#4A90E2] outline-none" />
                             </div>
                             <div className="space-y-2 md:col-span-2">
                                 <label className="text-sm font-bold text-slate-700">اسم الكتاب <span className="text-red-500">*</span></label>
                                 <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-[#4A90E2] outline-none" required />
                             </div>
                             <div className="space-y-2 md:col-span-2">
                                 <label className="text-sm font-bold text-slate-700">المؤلف <span className="text-red-500">*</span></label>
                                 <input type="text" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-[#4A90E2] outline-none" required />
                             </div>
                             <div className="space-y-2">
                                 <label className="text-sm font-bold text-slate-700">تاريخ دخول الكتاب</label>
                                 <input type="date" value={formData.entryDate} onChange={e => setFormData({...formData, entryDate: e.target.value})} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-[#4A90E2] outline-none" />
                             </div>
                         </div>
                    )}

                    {/* Location Tab */}
                    {activeTab === 'location' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">التخصص <span className="text-red-500">*</span></label>
                                    <select 
                                        value={formData.specialization} 
                                        onChange={e => setFormData({...formData, specialization: e.target.value})} 
                                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] outline-none bg-white"
                                    >
                                        <option value="">اختر التخصص...</option>
                                        {specializationsList.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">القسسم</label>
                                    <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">الخزانة</label>
                                    <input type="text" value={formData.cabinet} onChange={e => setFormData({...formData, cabinet: e.target.value})} placeholder="مثال: F9" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">الترتيب في الرفوف</label>
                                    <input type="text" value={formData.shelfOrder} onChange={e => setFormData({...formData, shelfOrder: e.target.value})} placeholder="مثال: رف 1" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">رقم الكتاب في الرف</label>
                                    <input type="text" value={formData.bookShelfNumber} onChange={e => setFormData({...formData, bookShelfNumber: e.target.value})} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">طبعة سنة</label>
                                    <input type="text" value={formData.editionYear} onChange={e => setFormData({...formData, editionYear: e.target.value})} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] outline-none" />
                                </div>
                            </div>
                            
                            {/* Location Preview */}
                            <div className="bg-[#E3F2FD] p-4 rounded-xl border-2 border-dashed border-[#4A90E2] mt-4">
                                <h4 className="font-bold text-[#2C6FB7] mb-3 flex items-center gap-2">
                                    <Library className="w-5 h-5" /> معاينة الموقع:
                                </h4>
                                <div className="flex flex-wrap gap-3">
                                    <span className="bg-white px-3 py-1 rounded-lg border border-blue-200 text-sm text-slate-600">
                                        الخزانة: <b className="text-[#4A90E2]">{formData.cabinet || '--'}</b>
                                    </span>
                                    <span className="bg-white px-3 py-1 rounded-lg border border-blue-200 text-sm text-slate-600">
                                        الرف: <b className="text-[#4A90E2]">{formData.shelfOrder || '--'}</b>
                                    </span>
                                    <span className="bg-white px-3 py-1 rounded-lg border border-blue-200 text-sm text-slate-600">
                                        الترتيب: <b className="text-[#4A90E2]">{formData.shelfOrder || '--'}</b>
                                    </span>
                                    <span className="bg-white px-3 py-1 rounded-lg border border-blue-200 text-sm text-slate-600">
                                        الرقم: <b className="text-[#4A90E2]">{formData.bookShelfNumber || '--'}</b>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Details Tab */}
                    {activeTab === 'details' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">عدد النسخ الكلي</label>
                                    <input type="number" min="1" value={formData.copies} onChange={e => setFormData({...formData, copies: Number(e.target.value), remainingCopies: Number(e.target.value)})} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">المتبقي حالياً</label>
                                    <input type="number" min="0" value={formData.remainingCopies} onChange={e => setFormData({...formData, remainingCopies: Number(e.target.value)})} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] outline-none" />
                                    <p className="text-xs text-slate-400">يتم تحديثه تلقائياً عند الإعارة</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">عدد الأجزاء</label>
                                    <input type="number" min="0" value={formData.parts} onChange={e => setFormData({...formData, parts: Number(e.target.value)})} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">السعر (ريال)</label>
                                    <input type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] outline-none" />
                                </div>
                            </div>

                            <div className="bg-[#E8F5E9] p-4 rounded-xl border border-green-200 flex items-center gap-3 text-green-800">
                                <Info className="w-5 h-5" />
                                <span>
                                    📊 النسخ: <b>{formData.copies}</b> كلي | <b>{formData.remainingCopies}</b> متبقي | <b>{formData.copies - formData.remainingCopies}</b> مستعار
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Image Tab */}
                    {activeTab === 'image' && (
                        <div className="animate-in fade-in slide-in-from-right-4 flex flex-col items-center justify-center py-8">
                            <div 
                                className="w-full max-w-md border-3 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition hover:border-[#4A90E2]"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-[#4A90E2]">
                                    {formData.coverImage ? <img src={formData.coverImage} className="w-full h-full object-cover rounded-full" /> : <ImageIcon className="w-10 h-10" />}
                                </div>
                                <h4 className="text-lg font-bold text-slate-800 mb-2">اضف صورة الكتاب</h4>
                                <p className="text-slate-500 text-sm mb-4">انقر لاختيار ملف (JPG, PNG)</p>
                                <button className="bg-[#FFA726] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#F57C00] transition">
                                    اختر صورة
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer & Actions */}
                <div className="p-6 border-t border-slate-100 bg-white rounded-b-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-slate-500 font-bold">التقدم: {Math.round(getProgress())}%</span>
                        <div className="flex-1 mx-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#4A90E2] transition-all duration-300" style={{ width: `${getProgress()}%` }}></div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={handlePrevTab}
                            disabled={activeTab === 'basic'}
                            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            السابق
                        </button>
                        
                        {activeTab !== 'image' ? (
                            <button 
                                onClick={handleNextTab}
                                className="px-6 py-3 rounded-xl bg-[#FFA726] text-white font-bold hover:bg-[#F57C00] transition shadow-lg shadow-orange-500/20"
                            >
                                التالي
                            </button>
                        ) : (
                            <button 
                                onClick={handleSubmitBook}
                                disabled={!formData.code || !formData.title || !formData.author}
                                className="px-8 py-3 rounded-xl bg-[#4A90E2] text-white font-bold hover:bg-[#2C6FB7] transition shadow-lg shadow-blue-500/20 flex items-center gap-2"
                            >
                                <Check className="w-5 h-5" /> حفظ البيانات
                            </button>
                        )}
                        
                        <button 
                            onClick={() => setShowModal(false)}
                            className="mr-auto px-6 py-3 rounded-xl border border-red-100 text-red-500 font-bold hover:bg-red-50"
                        >
                            إلغاء
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- Bulk Add Modal (Wizard) --- */}
      {showBulkModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-5xl my-8 relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                  {/* Header */}
                  <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-2xl flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <FileSpreadsheet className="w-6 h-6 text-[#4A90E2]" />
                                إضافة مجموعة كتب (Excel)
                            </h2>
                        </div>
                        <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                  </div>

                  {/* Steps */}
                  <div className="bg-white p-4 border-b border-slate-100 flex justify-center gap-4">
                      {[1, 2, 3].map(step => (
                          <div key={step} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                              bulkStep === step ? 'bg-[#4A90E2] text-white' : 
                              bulkStep > step ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                          }`}>
                              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">{step}</span>
                              {step === 1 && 'التحميل'}
                              {step === 2 && 'المراجعة'}
                              {step === 3 && 'التأكيد'}
                          </div>
                      ))}
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                      
                      {/* Step 1: Upload/Paste */}
                      {bulkStep === 1 && (
                          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-[#4A90E2]">
                                      <UploadCloud className="w-8 h-8" />
                                  </div>
                                  <h3 className="text-lg font-bold text-slate-800">نسخ البيانات من Excel</h3>
                                  <p className="text-slate-500">انسخ البيانات من ملف Excel وألصقها في المربع أدناه</p>
                                  
                                  <textarea
                                      value={bulkData}
                                      onChange={(e) => setBulkData(e.target.value)}
                                      placeholder="انسخ والصق بيانات الكتب هنا..."
                                      className="w-full h-64 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4A90E2] font-mono text-sm whitespace-pre"
                                  />
                                  
                                  <div className="text-right text-xs bg-slate-100 p-3 rounded-lg border border-slate-200">
                                      <p className="font-bold mb-1">📋 ترتيب الأعمدة المطلوب:</p>
                                      <p>رقم الكود | رقم الجرد | اسم الكتاب | المؤلف | التخصص | القسسم | الخزانة | رقم الكتاب في الرف | الترتيب في الرفوف | عدد النسخ | طبعة سنة | تاريخ دخول الكتاب | العدد المتبقي | عدد الاجزاء | السعر</p>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* Step 2: Review */}
                      {bulkStep === 2 && (
                          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                              <div className="flex justify-between items-center">
                                  <h3 className="font-bold text-slate-800">🔍 معاينة البيانات ({parsedBooks.length} كتاب)</h3>
                                  <button onClick={() => {setBulkStep(1); setParsedBooks([])}} className="text-sm text-red-500 hover:underline">إعادة التحميل</button>
                              </div>

                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                  <table className="w-full text-sm text-right text-slate-800">
                                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                          <tr>
                                              <th className="p-3">رقم الكود</th>
                                              <th className="p-3">اسم الكتاب</th>
                                              <th className="p-3">المؤلف</th>
                                              <th className="p-3">التخصص</th>
                                              <th className="p-3">الحالة</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                          {parsedBooks.map((b, i) => (
                                              <tr key={i} className="hover:bg-slate-50 text-slate-900">
                                                  <td className="p-3 font-mono">{b.code}</td>
                                                  <td className="p-3 font-bold">{b.title}</td>
                                                  <td className="p-3 text-slate-600">{b.author}</td>
                                                  <td className="p-3 text-slate-500">{b.specialization}</td>
                                                  <td className="p-3">
                                                      {b.code && b.title ? (
                                                          <span className="text-green-600 flex items-center gap-1 text-xs font-bold"><Check className="w-3 h-3" /> صالح</span>
                                                      ) : (
                                                          <span className="text-red-600 flex items-center gap-1 text-xs font-bold"><X className="w-3 h-3" /> بيانات ناقصة</span>
                                                      )}
                                                  </td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      )}

                       {/* Step 3: Confirm */}
                       {bulkStep === 3 && (
                           <div className="flex flex-col items-center justify-center py-12 animate-in fade-in slide-in-from-right-4 text-center space-y-6">
                               <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 animate-bounce">
                                   <CheckCircle className="w-12 h-12" />
                               </div>
                               <h3 className="text-2xl font-bold text-slate-800">جاهز للإضافة!</h3>
                               <p className="text-slate-500">سيتم إضافة <b>{parsedBooks.length}</b> كتاب إلى المكتبة</p>
                               
                               <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                                   <div className="bg-white p-4 rounded-xl border border-slate-200">
                                       <span className="block text-sm text-slate-500">إجمالي الكتب</span>
                                       <span className="block text-2xl font-bold text-[#4A90E2]">{parsedBooks.length}</span>
                                   </div>
                                   <div className="bg-white p-4 rounded-xl border border-slate-200">
                                       <span className="block text-sm text-slate-500">التخصصات الجديدة</span>
                                       <span className="block text-2xl font-bold text-[#FFA726]">{new Set(parsedBooks.map(b => b.specialization)).size}</span>
                                   </div>
                               </div>
                           </div>
                       )}

                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-slate-100 bg-white rounded-b-2xl flex justify-between">
                       {bulkStep > 1 && (
                           <button onClick={() => setBulkStep(prev => prev - 1 as any)} className="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 font-bold hover:bg-slate-50">السابق</button>
                       )}
                       
                       {bulkStep === 1 && (
                           <button 
                               onClick={handleParseBulk} 
                               disabled={!bulkData.trim()}
                               className="px-6 py-3 rounded-lg bg-[#4A90E2] text-white font-bold hover:bg-[#2C6FB7] ml-auto disabled:opacity-50"
                           >
                               التالي: مراجعة البيانات
                           </button>
                       )}
                       
                       {bulkStep === 2 && (
                           <button 
                               onClick={() => setBulkStep(3)}
                               className="px-6 py-3 rounded-lg bg-[#4A90E2] text-white font-bold hover:bg-[#2C6FB7] ml-auto"
                           >
                               التالي: تأكيد
                           </button>
                       )}

                       {bulkStep === 3 && (
                           <button 
                               onClick={confirmBulkImport}
                               className="px-8 py-3 rounded-lg bg-[#4CAF50] text-white font-bold hover:bg-[#388E3C] ml-auto shadow-lg shadow-green-500/20"
                           >
                               بدء الاستيراد
                           </button>
                       )}
                  </div>
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200 text-center">
                 <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
                   <AlertTriangle className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 mb-2">تأكيد الحذف</h3>
                 <p className="text-slate-500 mb-6">هل أنت متأكد من حذف هذا الكتاب؟ هذا الإجراء لا يمكن التراجع عنه.</p>
                 <div className="flex gap-3">
                   <button 
                      onClick={() => setShowDeleteModal(false)} 
                      className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-200"
                   >
                      إلغاء
                   </button>
                   <button 
                      onClick={() => { if(bookToDelete) onDeleteBook(bookToDelete); setShowDeleteModal(false); }} 
                      className="flex-1 bg-rose-600 text-white py-3 rounded-lg font-bold hover:bg-rose-700 shadow-lg shadow-rose-500/20"
                   >
                      حذف
                   </button>
                 </div>
            </div>
        </div>
      )}

    </div>
  );
};
