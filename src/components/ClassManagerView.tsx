import React, { useState, useMemo } from 'react';
import { ClassRoom, Student, AppSettings } from '../types';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  FileSpreadsheet, 
  ArrowRightLeft, 
  ListOrdered, 
  Check, 
  X, 
  AlertTriangle,
  Download,
  Search,
  Sparkles,
  ClipboardPaste,
  ChevronUp,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { searchVietnamese, compareVietnameseNames } from '../utils/vietnamese';
import { parseExcelOrCsvFile, downloadSampleExcelTemplate } from '../services/excel';

interface ClassManagerViewProps {
  classes: ClassRoom[];
  students: Student[];
  currentClass: ClassRoom;
  settings: AppSettings;
  onSelectClass: (classId: string) => void;
  onAddClass: (newClass: Omit<ClassRoom, 'id' | 'order'>) => void;
  onUpdateClass: (cls: ClassRoom) => void;
  onDeleteClass: (classId: string) => void;
  onAddStudent: (student: Omit<Student, 'id' | 'totalScore'>) => void;
  onBatchAddStudents: (classId: string, names: string[]) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onTransferStudent: (studentId: string, targetClassId: string, keepScores: boolean) => void;
  onAutoReorderSTT: (classId: string) => void;
  onImportStudentsSuccess: (newStudents: Student[]) => void;
  onClearClassStudents: (classId: string) => void;
  onReorderClasses: (classes: ClassRoom[]) => void;
}

export const ClassManagerView: React.FC<ClassManagerViewProps> = ({
  classes,
  students,
  currentClass,
  settings,
  onSelectClass,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onAddStudent,
  onBatchAddStudents,
  onUpdateStudent,
  onDeleteStudent,
  onTransferStudent,
  onAutoReorderSTT,
  onImportStudentsSuccess,
  onClearClassStudents,
  onReorderClasses,
}) => {
  const [subTab, setSubTab] = useState<'roster' | 'classes'>('roster');
  const [searchQuery, setSearchQuery] = useState('');

  // Class Modal State
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [classNameInput, setClassNameInput] = useState('');
  const [classGradeInput, setClassGradeInput] = useState<number>(1);
  const [classRoomInput, setClassRoomInput] = useState('Phòng Tin Học 1');

  // Single Student Add/Edit Modal
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentNameInput, setStudentNameInput] = useState('');
  const [studentSttInput, setStudentSttInput] = useState<number>(1);
  const [studentGenderInput, setStudentGenderInput] = useState<'nam' | 'nu' | ''>('');
  const [studentNotesInput, setStudentNotesInput] = useState('');

  // Batch paste modal
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchNamesText, setBatchNamesText] = useState('');

  // Transfer Student Modal
  const [transferringStudent, setTransferringStudent] = useState<Student | null>(null);
  const [targetTransferClassId, setTargetTransferClassId] = useState<string>('');
  const [keepTransferScores, setKeepTransferScores] = useState<boolean>(true);

  // Delete Confirmations
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [isConfirmClearAllOpen, setIsConfirmClearAllOpen] = useState(false);

  // Sorting handlers for classes
  const handleSortClassesStandard = () => {
    const sorted = [...classes].sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
    const reordered = sorted.map((c, i) => ({ ...c, order: i + 1 }));
    onReorderClasses(reordered);
  };

  const handleSortClassesByName = () => {
    const sorted = [...classes].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const reordered = sorted.map((c, i) => ({ ...c, order: i + 1 }));
    onReorderClasses(reordered);
  };

  const handleSortClassesByPoints = () => {
    const sorted = [...classes].sort((a, b) => {
      const ptsA = students.filter((s) => s.classId === a.id).reduce((sum, s) => sum + s.totalScore, 0);
      const ptsB = students.filter((s) => s.classId === b.id).reduce((sum, s) => sum + s.totalScore, 0);
      return ptsB - ptsA;
    });
    const reordered = sorted.map((c, i) => ({ ...c, order: i + 1 }));
    onReorderClasses(reordered);
  };

  const handleMoveClass = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= classes.length) return;
    const newClasses = [...classes];
    const temp = newClasses[index];
    newClasses[index] = newClasses[targetIndex];
    newClasses[targetIndex] = temp;
    const reordered = newClasses.map((c, i) => ({ ...c, order: i + 1 }));
    onReorderClasses(reordered);
  };

  // Excel file upload
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Filter students for current class
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === currentClass.id);
  }, [students, currentClass.id]);

  const filteredStudents = useMemo(() => {
    const res = classStudents.filter((s) => searchVietnamese(searchQuery, s.fullName));
    res.sort((a, b) => a.stt - b.stt);
    return res;
  }, [classStudents, searchQuery]);

  // Handle open add single student modal
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setStudentNameInput('');
    setStudentSttInput(classStudents.length + 1);
    setStudentGenderInput('');
    setStudentNotesInput('');
    setIsStudentModalOpen(true);
  };

  // Handle open edit single student modal
  const handleOpenEditStudent = (stu: Student) => {
    setEditingStudent(stu);
    setStudentNameInput(stu.fullName);
    setStudentSttInput(stu.stt);
    setStudentGenderInput(stu.gender || '');
    setStudentNotesInput(stu.notes || '');
    setIsStudentModalOpen(true);
  };

  // Submit student form
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = studentNameInput.trim();
    if (!cleanName) return;

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        fullName: cleanName,
        stt: studentSttInput,
        gender: studentGenderInput,
        notes: studentNotesInput.trim(),
      });
    } else {
      const initialScores: Record<number, number> = {};
      for (let w = 1; w <= 35; w++) initialScores[w] = 0;

      onAddStudent({
        stt: studentSttInput,
        fullName: cleanName,
        classId: currentClass.id,
        scores: initialScores,
        gender: studentGenderInput,
        notes: studentNotesInput.trim(),
      });
    }

    setIsStudentModalOpen(false);
  };

  // Submit Batch Add
  const handleSaveBatch = () => {
    const lines = batchNamesText
      .split('\n')
      .map((l) => l.trim().replace(/^\d+[\.\-\s]+/, '')) // remove leading numbering like "1. ", "02 - "
      .filter((l) => l.length > 0);

    if (lines.length > 0) {
      onBatchAddStudents(currentClass.id, lines);
    }
    setBatchNamesText('');
    setIsBatchModalOpen(false);
  };

  // Handle Class Add/Edit
  const handleOpenAddClass = () => {
    setEditingClass(null);
    setClassNameInput('');
    setClassGradeInput(1);
    setClassRoomInput('Phòng Tin Học 1');
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: ClassRoom) => {
    setEditingClass(cls);
    setClassNameInput(cls.name);
    setClassGradeInput(cls.grade);
    setClassRoomInput(cls.room || 'Phòng Tin Học 1');
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = classNameInput.trim();
    if (!cleanName) return;

    if (editingClass) {
      onUpdateClass({
        ...editingClass,
        name: cleanName,
        grade: classGradeInput,
        room: classRoomInput.trim(),
      });
    } else {
      onAddClass({
        name: cleanName,
        grade: classGradeInput,
        room: classRoomInput.trim(),
      });
    }

    setIsClassModalOpen(false);
  };

  // Handle Transfer
  const handleExecuteTransfer = () => {
    if (!transferringStudent || !targetTransferClassId) return;
    onTransferStudent(transferringStudent.id, targetTransferClassId, keepTransferScores);
    setTransferringStudent(null);
  };

  // Handle Excel Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportError(null);

    try {
      const parsed = await parseExcelOrCsvFile(file, currentClass.id);
      if (parsed.students.length === 0) {
        throw new Error('Không tìm thấy danh sách học sinh hợp lệ trong file');
      }

      const newFullStudents: Student[] = parsed.students.map((s, idx) => ({
        ...s,
        id: `stu-${currentClass.id}-${Date.now()}-${idx + 1}`,
      }));

      onImportStudentsSuccess(newFullStudents);
      setIsImportModalOpen(false);
    } catch (err: any) {
      setImportError(err?.message || 'Có lỗi khi đọc file');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Tab Switcher: Quản lý danh sách học sinh vs Quản lý danh mục 23 Lớp */}
      <div className="flex border-b border-slate-200 justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab('roster')}
            className={`pb-3 px-3 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all ${
              subTab === 'roster'
                ? 'border-purple-600 text-purple-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Danh Sách Học Sinh (Lớp {currentClass.name})</span>
          </button>

          <button
            onClick={() => setSubTab('classes')}
            className={`pb-3 px-3 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all ${
              subTab === 'classes'
                ? 'border-purple-600 text-purple-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Danh Mục Toàn Bộ {classes.length} Lớp Học</span>
          </button>
        </div>

        {subTab === 'roster' && (
          <div className="flex items-center gap-2 pb-2 flex-wrap">
            <button
              onClick={() => onAutoReorderSTT(currentClass.id)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs"
              title="Đánh lại số thứ tự từ 1 đến hết theo thứ tự hiện tại"
            >
              <ListOrdered className="w-3.5 h-3.5 text-purple-600" />
              <span>Đánh lại STT</span>
            </button>

            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold flex items-center gap-1 shadow-2xs"
              title="Dán nhanh danh sách nhiều học sinh cùng lúc"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Dán danh sách nhanh</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-2xs"
              title="Nhập file Excel hoặc CSV"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Nhập Excel/CSV</span>
            </button>

            <button
              onClick={handleOpenAddStudent}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm học sinh</span>
            </button>

            {/* Xóa tất cả học sinh */}
            {classStudents.length > 0 && (
              <button
                onClick={() => setIsConfirmClearAllOpen(true)}
                className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 shadow-2xs"
                title={`Xóa tất cả ${classStudents.length} học sinh của Lớp ${currentClass.name}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Xóa Tất Cả HS</span>
              </button>
            )}
          </div>
        )}

        {subTab === 'classes' && (
          <div className="flex items-center gap-2 pb-2 flex-wrap">
            {/* Sắp xếp chuẩn Khối 1 - 5 */}
            <button
              onClick={handleSortClassesStandard}
              className="px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center gap-1 shadow-2xs"
              title="Sắp xếp toàn bộ các lớp theo thứ tự chuẩn Khối 1 đến Khối 5 (1/1, 1/2...)"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" />
              <span>Sắp xếp chuẩn (K1 ➜ K5)</span>
            </button>

            <button
              onClick={handleSortClassesByName}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs"
              title="Sắp xếp lớp theo thứ tự chữ cái tên lớp"
            >
              <span>Theo Tên (A ➜ Z)</span>
            </button>

            <button
              onClick={handleSortClassesByPoints}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs"
              title="Sắp xếp lớp theo tổng điểm thi đua cao nhất"
            >
              <span>Điểm cao nhất</span>
            </button>

            <button
              onClick={handleOpenAddClass}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Lớp Học Mới</span>
            </button>
          </div>
        )}
      </div>

      {/* SUBTAB 1: STUDENT ROSTER OF CURRENT CLASS */}
      {subTab === 'roster' && (
        <div className="space-y-3">
          {/* Search bar & info */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm học sinh theo tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-800"
              />
            </div>

            <div className="text-xs text-slate-500">
              Đang xem lớp: <strong className="text-slate-900 font-bold">{currentClass.name}</strong> • Sĩ số: <strong className="text-purple-600 font-bold">{classStudents.length} học sinh</strong>
            </div>
          </div>

          {/* Student Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                  <tr>
                    <th className="p-3 text-center w-12">STT</th>
                    <th className="p-3">Mã HS</th>
                    <th className="p-3">Họ và tên</th>
                    <th className="p-3 text-center w-20">Giới tính</th>
                    <th className="p-3 text-center">Tổng Điểm 35T</th>
                    <th className="p-3">Ghi chú</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Chưa có học sinh trong lớp này hoặc không khớp với tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((stu) => (
                      <tr key={stu.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-center font-bold text-slate-600">{stu.stt}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-400">{stu.id.replace('stu-', '')}</td>
                        <td className="p-3 font-bold text-slate-900 text-sm">
                          {stu.fullName}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              stu.gender === 'nu'
                                ? 'bg-pink-100 text-pink-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {stu.gender === 'nu' ? 'Nữ' : stu.gender === 'nam' ? 'Nam' : 'Chưa xác định'}
                          </span>
                        </td>
                        <td className="p-3 text-center font-black text-amber-600 text-sm">
                          {stu.totalScore} ⭐
                        </td>
                        <td className="p-3 text-slate-500">{stu.notes || '-'}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Transfer button */}
                            <button
                              onClick={() => {
                                setTransferringStudent(stu);
                                setTargetTransferClassId('');
                              }}
                              title="Chuyển lớp cho học sinh này"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>

                            {/* Edit button */}
                            <button
                              onClick={() => handleOpenEditStudent(stu)}
                              title="Sửa thông tin học sinh"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => setDeletingStudentId(stu.id)}
                              title="Xóa học sinh"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: ALL 23 CLASSES DIRECTORY */}
      {subTab === 'classes' && (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 text-purple-900 p-3 rounded-xl text-xs">
            Hệ thống đang quản lý <strong className="font-bold">{classes.length} lớp học</strong>. Giáo viên có thể thêm, sửa tên lớp (ví dụ 1/1, 2/1...), thay đổi phòng học, hoặc đổi lớp đang giảng dạy nhanh chóng.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {classes.map((cls, idx) => {
              const count = students.filter((s) => s.classId === cls.id).length;
              const totalPts = students
                .filter((s) => s.classId === cls.id)
                .reduce((sum, s) => sum + s.totalScore, 0);
              const isCurrent = cls.id === currentClass.id;

              return (
                <div
                  key={cls.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-purple-50/50 border-purple-400 shadow-md ring-2 ring-purple-400'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                        Khối {cls.grade}
                      </span>
                      <h4 className="text-xl font-black text-slate-900 mt-1">Lớp {cls.name}</h4>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Move up / down buttons to reorder classes */}
                      <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMoveClass(idx, 'up')}
                          className="p-1 rounded text-slate-500 hover:text-purple-700 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Di chuyển lớp lên trước"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={idx === classes.length - 1}
                          onClick={() => handleMoveClass(idx, 'down')}
                          className="p-1 rounded text-slate-500 hover:text-purple-700 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Di chuyển lớp xuống sau"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleOpenEditClass(cls)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50"
                        title="Sửa thông tin lớp"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingClassId(cls.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Xóa lớp học"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mt-1">Phòng: {cls.room || 'Phòng Tin Học'}</p>

                  <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-100">
                    <span className="font-semibold text-slate-600 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {count} học sinh
                    </span>
                    <span className="font-bold text-amber-600 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      {totalPts} ⭐
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectClass(cls.id)}
                    className={`mt-3 w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isCurrent ? 'Đang chọn dạy' : 'Chọn lớp này'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT SINGLE STUDENT */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingStudent ? 'Sửa Thông Tin Học Sinh' : `Thêm Học Sinh Vào Lớp ${currentClass.name}`}
              </h3>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Số thứ tự (STT):</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={studentSttInput}
                  onChange={(e) => setStudentSttInput(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Họ và tên học sinh:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={studentNameInput}
                  onChange={(e) => setStudentNameInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold text-sm"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Giới tính:</label>
                  <select
                    value={studentGenderInput}
                    onChange={(e) => setStudentGenderInput(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">Chưa xác định</option>
                    <option value="nam">Nam</option>
                    <option value="nu">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ghi chú (chức vụ):</label>
                  <input
                    type="text"
                    placeholder="Lớp trưởng / Tổ trưởng..."
                    value={studentNotesInput}
                    onChange={(e) => setStudentNotesInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-xs"
                >
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BATCH PASTE STUDENTS */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ClipboardPaste className="w-5 h-5 text-purple-600" />
                Dán Nhanh Danh Sách Học Sinh • Lớp {currentClass.name}
              </h3>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mt-3 text-xs">
              <p className="text-slate-500">
                Thầy/Cô chỉ cần copy danh sách học sinh từ Word, Excel hoặc văn bản rồi paste vào đây. Mỗi học sinh một dòng (hệ thống tự động loại bỏ số thứ tự ở đầu dòng nếu có).
              </p>

              <textarea
                rows={8}
                value={batchNamesText}
                onChange={(e) => setBatchNamesText(e.target.value)}
                placeholder="1. Nguyễn Văn An&#10;2. Trần Thị Mai&#10;3. Lê Hoàng Nam&#10;..."
                className="w-full p-3 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              />

              <div className="flex items-center justify-between text-slate-500">
                <span>
                  Đã nhận diện: <strong className="text-purple-600">{batchNamesText.split('\n').filter((l) => l.trim().length > 0).length}</strong> học sinh
                </span>
                <span className="text-[11px] text-slate-400">Tự động nối tiếp STT hiện tại</span>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveBatch}
                  disabled={!batchNamesText.trim()}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-xs disabled:opacity-40"
                >
                  Thêm Vào Lớp {currentClass.name}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EXCEL / CSV IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Nhập Danh Sách Từ Excel / CSV
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-3 text-xs">
              <p className="text-slate-500">
                Nhập danh sách học sinh cho <strong className="text-slate-900 font-bold">Lớp {currentClass.name}</strong> từ file Excel (.xlsx) hoặc file CSV.
              </p>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Chưa có file mẫu chuẩn?</div>
                  <div className="text-[11px] text-slate-500">Tải file Excel mẫu gồm 35 tuần về xem mẫu</div>
                </div>
                <button
                  onClick={downloadSampleExcelTemplate}
                  className="flex items-center gap-1 bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-300 px-2.5 py-1.5 rounded-lg font-bold text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải mẫu
                </button>
              </div>

              {/* Upload Input */}
              <div className="border-2 border-dashed border-emerald-300 rounded-xl p-6 text-center hover:bg-emerald-50/40 transition-colors">
                <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <label className="cursor-pointer">
                  <span className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs shadow-xs inline-block">
                    Chọn File Excel hoặc CSV
                  </span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-2">Hỗ trợ các cột: STT, Họ và tên, Giới tính, T1..T35, Ghi chú</p>
              </div>

              {importLoading && (
                <div className="p-3 text-center text-emerald-700 font-bold animate-pulse">
                  Đang phân tích dữ liệu Excel...
                </div>
              )}

              {importError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                  {importError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TRANSFER STUDENT TO ANOTHER CLASS */}
      {transferringStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                Chuyển Lớp Cho Học Sinh
              </h3>
              <button
                onClick={() => setTransferringStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>Học sinh: <strong className="text-slate-900 font-bold text-sm">{transferringStudent.fullName}</strong></div>
                <div>Lớp hiện tại: <strong className="text-purple-600 font-bold">Lớp {currentClass.name}</strong></div>
                <div>Tổng điểm đã tích lũy: <strong className="text-amber-600 font-bold">{transferringStudent.totalScore} ⭐</strong></div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Chọn lớp muốn chuyển đến:</label>
                <select
                  value={targetTransferClassId}
                  onChange={(e) => setTargetTransferClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-bold text-sm"
                >
                  <option value="">-- Chọn lớp đích --</option>
                  {classes
                    .filter((c) => c.id !== currentClass.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        Lớp {c.name} (Khối {c.grade})
                      </option>
                    ))}
                </select>
              </div>

              {/* Requirement: khi chuyển học sinh sang lớp khác phải giữ nguyên dữ liệu kết quả nếu người dùng xác nhận */}
              <label className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepTransferScores}
                  onChange={(e) => setKeepTransferScores(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="font-bold text-amber-900">
                  Giữ nguyên dữ liệu điểm số 35 tuần của học sinh sang lớp mới
                </span>
              </label>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransferringStudent(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={!targetTransferClassId}
                  onClick={handleExecuteTransfer}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xs disabled:opacity-40"
                >
                  Xác Nhận Chuyển Lớp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD / EDIT CLASS */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingClass ? `Sửa Lớp ${editingClass.name}` : 'Thêm Lớp Học Mới'}
              </h3>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tên lớp học (ví dụ: 1/1, 2/1, 3A...):</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 1/1"
                  value={classNameInput}
                  onChange={(e) => setClassNameInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Thuộc khối:</label>
                <select
                  value={classGradeInput}
                  onChange={(e) => setClassGradeInput(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-bold"
                >
                  <option value={1}>Khối 1</option>
                  <option value={2}>Khối 2</option>
                  <option value={3}>Khối 3</option>
                  <option value={4}>Khối 4</option>
                  <option value={5}>Khối 5</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Phòng học phụ trách:</label>
                <input
                  type="text"
                  placeholder="Phòng Tin Học 1..."
                  value={classRoomInput}
                  onChange={(e) => setClassRoomInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-xs"
                >
                  Lưu Lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE STUDENT MODAL */}
      {deletingStudentId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-center">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-2" />
            <h4 className="font-bold text-slate-900 text-base">Xác Nhận Xóa Học Sinh?</h4>
            <p className="text-xs text-slate-500 mt-1">
              Bạn có chắc chắn muốn xóa học sinh này khỏi Lớp {currentClass.name}? Điểm tích lũy của em cũng sẽ bị xóa.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setDeletingStudentId(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  onDeleteStudent(deletingStudentId);
                  setDeletingStudentId(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs"
              >
                Xóa Vĩnh Viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE CLASS MODAL */}
      {deletingClassId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-center">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-2" />
            <h4 className="font-bold text-slate-900 text-base">Xác Nhận Xóa Lớp Học?</h4>
            <p className="text-xs text-slate-500 mt-1">
              Hành động này sẽ xóa lớp học và toàn bộ danh sách học sinh thuộc lớp này. Vui lòng cân nhắc kỹ hoặc sao lưu dữ liệu trước!
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setDeletingClassId(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  onDeleteClass(deletingClassId);
                  setDeletingClassId(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs"
              >
                Xóa Lớp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM CLEAR ALL STUDENTS MODAL */}
      {isConfirmClearAllOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">
              Xác Nhận Xóa TẤT CẢ Học Sinh?
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              Bạn có chắc chắn muốn xóa toàn bộ <strong className="text-rose-700 font-bold">{classStudents.length} học sinh</strong> của Lớp <strong className="text-slate-900 font-bold">{currentClass.name}</strong>?
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Toàn bộ danh sách và điểm tích lũy 35 tuần của lớp này sẽ bị xóa để nhập lại danh sách mới.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setIsConfirmClearAllOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  onClearClassStudents(currentClass.id);
                  setIsConfirmClearAllOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs"
              >
                Xác Nhận Xóa Tất Cả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
