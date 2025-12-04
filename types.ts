
export interface Book {
  id: string; // Internal ID
  code: string; // رقم الكود
  inventoryNumber: string; // رقم الجرد
  title: string; // اسم الكتاب
  author: string; // المؤلف
  specialization: string; // التخصص
  department: string; // القسم
  cabinet: string; // الخزانة
  bookShelfNumber: string; // رقم الكتاب في الرف
  shelfOrder: string; // الترتيب في الرفوف
  copies: number; // عدد النسخ
  editionYear: string; // طبعة سنة
  entryDate: string; // تاريخ دخول الكتاب
  remainingCopies: number; // العدد المتبقي
  parts: number; // عدد الاجزاء
  price: number; // السعر
  coverImage?: string; // صورة الكتاب (Base64 URL)
}

export type UserRole = 'admin' | 'student' | 'professor' | 'staff';

export interface User {
  id: string; // University ID / National ID
  name: string;
  email: string;
  password: string; 
  role: UserRole;
  department?: string;
  phone?: string;
  status: 'active' | 'suspended' | 'inactive';
  joinDate: string;
  lastLogin?: string;
  visits?: number; // عدد مرات تسجيل الدخول/الزيارات
}

export interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string; // Linked to User.id
  studentName: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'active' | 'returned' | 'overdue' | 'lost';
  // New fields for comprehensive system
  originalLocation?: {
    cabinet: string;
    bookShelfNumber: string;
    shelfOrder: string;
  };
  conditionOnReturn?: 'excellent' | 'good' | 'damaged' | 'lost';
  penaltyAmount?: number;
  notes?: string;
}

export interface DashboardStats {
  students: number;
  books: number;
  journals: number;
  professors: number;
  borrowed: number;
  available: number;
}

export interface LibrarySettings {
  // Brand & Info
  name: string;
  institution: string;
  email: string;
  phone: string;
  copyrightText: string;
  logo?: string;
  
  // System
  lastBackupDate: string | null;
  backupIntervalDays: number;
  
  // Dashboard Config
  dashboardMode: 'auto' | 'manual';
  manualStats: DashboardStats;
  visibleStats: {
    [key in keyof DashboardStats]: boolean;
  };

  // Security & Privacy
  privacyLevel: 'low' | 'medium' | 'high';
  securityOptions: {
    exportRestricted: boolean;
    encrypted: boolean;
    activityLog: boolean;
    maintenanceMode: boolean;
  };
  
  // Permissions Matrix (Role -> Category -> Permission -> boolean)
  permissions: Record<string, Record<string, boolean>>; 
}

export enum Page {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  CATALOG = 'CATALOG',
  LENDING = 'LENDING',
  USERS = 'USERS',
  AI_ASSISTANT = 'AI_ASSISTANT',
  SPECIALIZATIONS = 'SPECIALIZATIONS',
  SETTINGS = 'SETTINGS'
}