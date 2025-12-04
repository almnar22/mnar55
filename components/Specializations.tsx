
import React, { useState, useMemo } from 'react';
import { Book } from '../types';
import { 
    Plus, Edit2, Trash2, Save, X, Layers, AlertCircle, FileSpreadsheet, 
    Check, FolderTree, BookOpen, Download, Building2 
} from 'lucide-react';

interface SpecializationsProps {
  specializations: string[];
  books: Book[];
  onAdd: (name: string) => void;
  onAddSpecializations: (specs: string[]) => void;
  onUpdate: (oldName: string, newName: string) => void;
  onDelete: (name: string) => void;
}

// Initial Data
const INITIAL_DEPARTMENTS = [
    { id: 1, name: 'إدارة أعمال والعلوم الإنسانية', icon: '💼', color: '#4A90E2' },
    { id: 2, name: 'العلوم الصحية', icon: '🏥', color: '#4CAF50' },
    { id: 3, name: 'العلوم المصرفية', icon: '💰', color: '#FF9800' },
    { id: 4, name: 'الصحية', icon: '🩺', color: '#9C27B0' },
    { id: 5, name: 'العلوم والحقوق الإنسانية', icon: '⚖️', color: '#3F51B5' },
    { id: 6, name: 'تقافية', icon: '🎭', color: '#009688' },
    { id: 7, name: 'علوم الحاسوب', icon: '💻', color: '#FF5722' },
    { id: 8, name: 'لغة انجليزية', icon: '🔤', color: '#E91E63' },
    { id: 9, name: 'لغة عربية', icon: '📖', color: '#795548' }
];

export const Specializations: React.FC<SpecializationsProps> = ({ specializations, books, onAdd, onAddSpecializations, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  
  const [editingSpec, setEditingSpec] = useState<string | null>(null);
  const [formData, setFormData] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  
  // Local state for departments to allow adding new ones
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);

  // Bulk States
  const [bulkData, setBulkData] = useState('');
  const [parsedSpecs, setParsedSpecs] = useState<string[]>([]);

  // Derived Data
  const specializationStats = useMemo(() => {
      return specializations.map(spec => {
          const count = books.filter(b => b.specialization === spec).length;
          // Try to find a department match from books or default to 'Unassigned'
          const deptName = books.find(b => b.specialization === spec)?.department || 'عام';
          const dept = departments.find(d => d.name === deptName) || { color: '#94a3b8', name: deptName };
          
          return { name: spec, count, department: dept };
      }).filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [specializations, books, searchTerm, departments]);

  // Tree Structure Calculation
  const treeData = useMemo(() => {
      // Create a map of department -> specializations
      const tree: Record<string, typeof specializationStats> = {};
      
      // Initialize with departments
      departments.forEach(dept => {
          tree[dept.name] = [];
      });

      // Distribute specializations
      specializationStats.forEach(spec => {
          const deptName = spec.department.name || 'غير مصنف';
          if (!tree[deptName]) tree[deptName] = [];
          tree[deptName].push(spec);
      });

      return tree;
  }, [specializationStats, departments]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingSpec(null);
    setFormData('');
    setShowModal(true);
  };

  const handleOpenEdit = (spec: string) => {
    setEditingSpec(spec);
    setFormData(spec);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.trim()) return;

    if (editingSpec) {
      onUpdate(editingSpec, formData.trim());
    } else {
      if (specializations.includes(formData.trim())) {
        alert('هذا التخصص موجود بالفعل');
        return;
      }
      onAdd(formData.trim());
    }
    setShowModal(false);
  };

  const handleAddDepartment = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newDeptName.trim()) return;
      
      const newDept = {
          id: Date.now(),
          name: newDeptName,
          icon: '📁',
          color: '#64748b' // Default color
      };
      
      setDepartments(prev => [...prev, newDept]);
      setNewDeptName('');
      setShowAddDeptModal(false);
  };

  const handleDeleteSpec = (name: string) => {
      if(window.confirm(`هل أنت متأكد من حذف تخصص "${name}"؟`)) {
          onDelete(name);
      }
  };

  const handleParseBulk = () => {
      if (!bulkData.trim()) return;
      
      const rows = bulkData.trim().split('\n').map(r => r.trim()).filter(r => r !== '');
      const uniqueRows = Array.from(new Set(rows));
      
      setParsedSpecs(uniqueRows);
  };

  const confirmBulkImport = () => {
      onAddSpecializations(parsedSpecs);
      setParsedSpecs([]);
      setBulkData('');
      setShowBulkModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-8">
      
      {/* Header */}
      <header className="bg-gradient-to-br from-[#4A90E2] to-[#2C6FB7] text-white p-8 rounded-2xl shadow-lg shadow-blue-500/20 text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
             <Layers className="w-8 h-8" />
             إدارة التخصصات والأقسام
        </h1>
        <p className="opacity-90 text-blue-100">إضافة وتعديل وحذف تخصصات الكتب والأقسام الأكاديمية</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-[#009688] flex items-center gap-4">
              <div className="bg-gradient-to-br from-[#009688] to-[#00695C] w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg shadow-teal-200">
                  <Building2 className="w-8 h-8" />
              </div>
              <div>
                  <h3 className="text-3xl font-bold text-slate-800">{departments.length}</h3>
                  <p className="text-slate-500 text-sm">الأقسام الرئيسية</p>
              </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-[#FFA726] flex items-center gap-4">
              <div className="bg-gradient-to-br from-[#FFA726] to-[#F57C00] w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg shadow-orange-200">
                  <Layers className="w-8 h-8" />
              </div>
              <div>
                  <h3 className="text-3xl font-bold text-slate-800">{specializations.length}</h3>
                  <p className="text-slate-500 text-sm">التخصصات</p>
              </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-[#9C27B0] flex items-center gap-4">
              <div className="bg-gradient-to-br from-[#9C27B0] to-[#6A1B9A] w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg shadow-purple-200">
                  <BookOpen className="w-8 h-8" />
              </div>
              <div>
                  <h3 className="text-3xl font-bold text-slate-800">{books.length.toLocaleString()}</h3>
                  <p className="text-slate-500 text-sm">الكتب المرتبطة</p>
              </div>
          </div>
      </div>

      {/* Tree Visualization */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-[#2C6FB7] flex items-center gap-2">
                  <FolderTree className="w-6 h-6" /> الهيكل التنظيمي للأقسام والتخصصات
              </h2>
              <div className="flex gap-2">
                  <button 
                    onClick={() => setShowAddDeptModal(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition font-bold text-sm flex items-center gap-2"
                  >
                      <Plus className="w-4 h-4" /> إضافة قسم جديد
                  </button>
                  <button onClick={handleOpenAdd} className="bg-[#FFA726] text-white px-4 py-2 rounded-lg hover:bg-[#F57C00] transition font-bold text-sm flex items-center gap-2">
                      <Plus className="w-4 h-4" /> إضافة تخصص جديد
                  </button>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {departments.map(dept => {
                  const specs = treeData[dept.name] || [];
                  return (
                      <div key={dept.id} className="bg-slate-50 rounded-xl p-5 border-l-4 shadow-sm" style={{ borderLeftColor: dept.color }}>
                          <div className="flex items-center gap-3 mb-4 border-b border-slate-200 pb-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg" style={{ backgroundColor: dept.color }}>
                                  {dept.icon}
                              </div>
                              <div>
                                  <h3 className="font-bold text-slate-800">{dept.name}</h3>
                                  <small className="text-slate-500">{specs.length} تخصص</small>
                              </div>
                          </div>
                          
                          {specs.length > 0 ? (
                              <ul className="space-y-2">
                                  {specs.map((spec, i) => (
                                      <li key={i} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                                          <div className="flex items-center gap-2">
                                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.color }}></span>
                                              <span className="font-medium text-slate-700 text-sm">{spec.name}</span>
                                          </div>
                                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{spec.count} كتاب</span>
                                      </li>
                                  ))}
                              </ul>
                          ) : (
                              <p className="text-xs text-slate-400 italic text-center py-4">لا توجد تخصصات مسجلة في هذا القسم</p>
                          )}
                      </div>
                  );
              })}
          </div>
      </div>

      {/* Detailed List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-xl font-bold text-[#2C6FB7] flex items-center gap-2">
                  <FileSpreadsheet className="w-6 h-6" /> قائمة التخصصات التفصيلية
              </h2>
              <div className="flex gap-2">
                  <input 
                      type="text" 
                      placeholder="بحث في التخصصات..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#4A90E2] text-sm"
                  />
                  <button 
                      onClick={() => setShowBulkModal(true)}
                      className="bg-[#FFA726] text-white px-4 py-2 rounded-lg hover:bg-[#F57C00] transition font-bold text-sm flex items-center gap-2"
                  >
                      <Download className="w-4 h-4" /> إضافة جماعية
                  </button>
              </div>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-bold">
                      <tr>
                          <th className="p-4">#</th>
                          <th className="p-4">اسم التخصص</th>
                          <th className="p-4">القسم الرئيسي</th>
                          <th className="p-4 text-center">عدد الكتب</th>
                          <th className="p-4">اللون</th>
                          <th className="p-4 text-center">إجراءات</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {specializationStats.map((spec, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-4 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="p-4 font-bold text-slate-800">{spec.name}</td>
                              <td className="p-4 text-slate-600">{spec.department.name}</td>
                              <td className="p-4 text-center font-bold">{spec.count}</td>
                              <td className="p-4">
                                  <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded border border-slate-200" style={{ backgroundColor: spec.department.color }}></div>
                                      <span className="text-xs font-mono text-slate-400">{spec.department.color}</span>
                                  </div>
                              </td>
                              <td className="p-4">
                                  <div className="flex items-center justify-center gap-2">
                                      <button 
                                          onClick={() => handleOpenEdit(spec.name)}
                                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                      >
                                          <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button 
                                          onClick={() => handleDeleteSpec(spec.name)}
                                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition"
                                      >
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Add Department Modal */}
      {showAddDeptModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-[#009688] to-[#00695C] text-white flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        إضافة قسم جديد
                    </h3>
                    <button onClick={() => setShowAddDeptModal(false)} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleAddDepartment} className="p-6 space-y-4 bg-slate-50">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">اسم القسم</label>
                        <input 
                            type="text" 
                            required 
                            value={newDeptName} 
                            onChange={e => setNewDeptName(e.target.value)} 
                            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-[#009688] outline-none" 
                            placeholder="أدخل اسم القسم..."
                        />
                    </div>
                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={() => setShowAddDeptModal(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-lg hover:bg-slate-100 font-bold transition">إلغاء</button>
                        <button type="submit" className="flex-1 bg-[#009688] text-white py-3 rounded-lg hover:bg-[#00695C] font-bold transition shadow-lg shadow-teal-500/20">إضافة</button>
                    </div>
                </form>
            </div>
          </div>
      )}

      {/* Add/Edit Specialization Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-[#4A90E2] to-[#2C6FB7] text-white flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Layers className="w-5 h-5" />
                        {editingSpec ? 'تعديل التخصص' : 'إضافة تخصص جديد'}
                    </h3>
                    <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-slate-50">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-[#2C6FB7]">اسم التخصص</label>
                        <input 
                            type="text" 
                            required 
                            value={formData} 
                            onChange={e => setFormData(e.target.value)} 
                            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-[#4A90E2] outline-none" 
                            placeholder="أدخل اسم التخصص..."
                        />
                    </div>
                    {editingSpec && (
                        <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-lg text-xs text-amber-800 border border-amber-100">
                             <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                             <p>تنبيه: تعديل اسم التخصص سيقوم بتحديث جميع الكتب المرتبطة به تلقائياً.</p>
                        </div>
                    )}

                    <div className="pt-4 flex gap-3 border-t border-slate-200 mt-4">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-lg hover:bg-slate-100 font-bold transition">إلغاء</button>
                        <button type="submit" className="flex-1 bg-[#4A90E2] text-white py-3 rounded-lg hover:bg-[#2C6FB7] font-bold transition shadow-lg shadow-blue-500/20">حفظ</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl my-8 relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileSpreadsheet className="w-6 h-6 text-[#4A90E2]" />
                        إضافة تخصصات جماعية
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
                            اسم التخصص | القسم الرئيسي | اللون (اختياري)
                        </div>
                        <div className="mt-3 text-xs text-slate-500">
                            <strong>الأقسام المتاحة:</strong> {departments.map(d => d.name).join('، ')}
                        </div>
                    </div>

                    <textarea
                        value={bulkData}
                        onChange={(e) => setBulkData(e.target.value)}
                        placeholder="أو الصق التخصصات هنا (كل تخصص في سطر)..."
                        className="w-full h-40 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#4A90E2] font-mono text-sm whitespace-pre"
                    />

                    {parsedSpecs.length > 0 && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-4 max-h-60 overflow-y-auto">
                            <div className="font-bold text-slate-700 mb-2">معاينة ({parsedSpecs.length} تخصص)</div>
                            <ul className="list-disc list-inside text-sm text-slate-700 columns-2">
                                {parsedSpecs.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 bg-white rounded-b-2xl flex gap-3">
                    <button onClick={() => {setShowBulkModal(false); setBulkData(''); setParsedSpecs([])}} className="flex-1 py-3 border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50">إلغاء</button>
                    {parsedSpecs.length === 0 ? (
                        <button onClick={handleParseBulk} disabled={!bulkData.trim()} className="flex-1 py-3 bg-[#4A90E2] text-white rounded-lg font-bold hover:bg-[#2C6FB7] disabled:opacity-50">معاينة البيانات</button>
                    ) : (
                        <button onClick={confirmBulkImport} className="flex-1 py-3 bg-[#4CAF50] text-white rounded-lg font-bold hover:bg-[#388E3C]">تأكيد الاستيراد</button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
