import React, { useState, useMemo } from 'react';
import { 
  Student, 
  ClassRoom, 
  AppSettings, 
  ScoreHistoryLog 
} from '../types';
import { 
  Search, 
  Plus, 
  Minus, 
  Trophy, 
  Sparkles, 
  Users, 
  Award, 
  RotateCcw, 
  X, 
  ArrowUpDown, 
  Filter, 
  CheckCircle, 
  AlertCircle,
  ClipboardPaste,
  Upload,
  FileSpreadsheet,
  Trash2,
  Edit3,
  Download,
  AlertTriangle
} from 'lucide-react';
import { searchVietnamese, compareVietnameseNames } from '../utils/vietnamese';
import { parseExcelOrCsvFile, downloadSampleExcelTemplate } from '../services/excel';

interface QuickScoreViewProps {
  currentClass: ClassRoom;
  students: Student[];
  settings: AppSettings;
  onScoreChange: (studentId: string, week: number, delta: number) => void;
  onSetScoreDirect: (studentId: string, week: number, newScore: number) => void;
  lastHistoryLog: ScoreHistoryLog | null;
  onUndoLastScore: () => void;
  onAddStudent: (student: Omit<Student, 'id' | 'totalScore'>) => void;
  onBatchAddStudents: (classId: string, names: string[]) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onImportStudentsSuccess: (newStudents: Student[]) => void;
  onOpenReportExport: () => void;
  onClearClassStudents: (classId: string) => void;
}

export const QuickScoreView: React.FC<QuickScoreViewProps> = ({
  currentClass,
  students,
  settings,
  onScoreChange,
  onSetScoreDirect,
  lastHistoryLog,
  onUndoLastScore,
  onAddStudent,
  onBatchAddStudents,
  onUpdateStudent,
  onDeleteStudent,
  onImportStudentsSuccess,
  onOpenReportExport,
  onClearClassStudents,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unscored' | 'scored'>('all');
  const [sortBy, setSortBy] = useState<'stt' | 'name' | 'week-desc' | 'total-desc'>('stt');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [directScoreInput, setDirectScoreInput] = useState<string>('');
  const [activePlusAnimationId, setActivePlusAnimationId] = useState<string | null>(null);

  // Modals inside QuickScoreView
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentNameInput, setStudentNameInput] = useState('');
  const [studentSttInput, setStudentSttInput] = useState<number>(1);
  const [studentGenderInput, setStudentGenderInput] = useState<'nam' | 'nu' | ''>('');
  const [studentNotesInput, setStudentNotesInput] = useState('');

  // Batch paste modal
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchNamesText, setBatchNamesText] = useState('');

  // Excel import modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Delete confirmation modal
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [isConfirmClearAllOpen, setIsConfirmClearAllOpen] = useState(false);

  const currentWeek = settings.currentWeek;

  // Filter students for current class
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === currentClass.id);
  }, [students, currentClass.id]);

  // Statistics for the current week in this class
  const stats = useMemo(() => {
    const total = classStudents.length;
    let scoredCount = 0;
    let unscoredCount = 0;
    let weekTotalPoints = 0;
    let maxWeekScore = 0;
    let classAllTimeTotal = 0;

    classStudents.forEach((s) => {
      const wScore = s.scores[currentWeek] || 0;
      if (wScore > 0) {
        scoredCount++;
      } else {
        unscoredCount++;
      }
      weekTotalPoints += wScore;
      if (wScore > maxWeekScore) maxWeekScore = wScore;
      classAllTimeTotal += s.totalScore;
    });

    return {
      total,
      scoredCount,
      unscoredCount,
      weekTotalPoints,
      maxWeekScore,
      classAllTimeTotal,
    };
  }, [classStudents, currentWeek]);

  // Filtered and sorted students
  const filteredStudents = useMemo(() => {
    let result = classStudents.filter((s) => {
      // Search
      const matchesSearch = searchVietnamese(searchQuery, s.fullName) || 
        String(s.stt).includes(searchQuery.trim());
      if (!matchesSearch) return false;

      // Filter
      const wScore = s.scores[currentWeek] || 0;
      if (filterType === 'unscored') return wScore === 0;
      if (filterType === 'scored') return wScore > 0;
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'stt') {
        return a.stt - b.stt;
      }
      if (sortBy === 'name') {
        return compareVietnameseNames(a.fullName, b.fullName);
      }
      if (sortBy === 'week-desc') {
        const diff = (b.scores[currentWeek] || 0) - (a.scores[currentWeek] || 0);
        if (diff !== 0) return diff;
        return a.stt - b.stt;
      }
      if (sortBy === 'total-desc') {
        const diff = b.totalScore - a.totalScore;
        if (diff !== 0) return diff;
        return a.stt - b.stt;
      }
      return 0;
    });

    return result;
  }, [classStudents, searchQuery, filterType, sortBy, currentWeek]);

  const handlePlusClick = (studentId: string) => {
    onScoreChange(studentId, currentWeek, 1);
    setActivePlusAnimationId(studentId);
    setTimeout(() => {
      setActivePlusAnimationId((prev) => (prev === studentId ? null : prev));
    }, 700);
  };

  const handleMinusClick = (studentId: string, currentScore: number) => {
    if (currentScore <= 0) return;
    onScoreChange(studentId, currentWeek, -1);
  };

  const handleStartDirectEdit = (studentId: string, currentScore: number) => {
    setEditingStudentId(studentId);
    setDirectScoreInput(String(currentScore));
  };

  const handleSaveDirectScore = (studentId: string) => {
    const parsed = parseInt(directScoreInput, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onSetScoreDirect(studentId, currentWeek, parsed);
    }
    setEditingStudentId(null);
  };

  // Add / Edit student handlers
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setStudentNameInput('');
    setStudentSttInput(classStudents.length + 1);
    setStudentGenderInput('');
    setStudentNotesInput('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditStudent = (stu: Student) => {
    setEditingStudent(stu);
    setStudentNameInput(stu.fullName);
    setStudentSttInput(stu.stt);
    setStudentGenderInput(stu.gender || '');
    setStudentNotesInput(stu.notes || '');
    setIsAddModalOpen(true);
  };

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

    setIsAddModalOpen(false);
  };

  // Batch paste handler
  const handleSaveBatch = () => {
    const lines = batchNamesText
      .split('\n')
      .map((l) => l.trim().replace(/^\d+[\.\-\s]+/, ''))
      .filter((l) => l.length > 0);

    if (lines.length > 0) {
      onBatchAddStudents(currentClass.id, lines);
    }
    setBatchNamesText('');
    setIsBatchModalOpen(false);
  };

  // Excel upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadError(null);

    try {
      const parsed = await parseExcelOrCsvFile(file, currentClass.id);
      if (parsed.students.length === 0) {
        throw new Error('Không tìm thấy danh sách học sinh hợp lệ');
      }

      const newFullStudents: Student[] = parsed.students.map((s, idx) => ({
        ...s,
        id: `stu-${currentClass.id}-${Date.now()}-${idx + 1}`,
      }));

      onImportStudentsSuccess(newFullStudents);
      setIsUploadModalOpen(false);
    } catch (err: any) {
      setUploadError(err?.message || 'Có lỗi khi đọc file Excel');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Top Header Card: Current Class Overview & Quick Stats */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <Trophy className="w-56 h-56 text-white" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white/20 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                Khối {currentClass.grade}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Lớp {currentClass.name}
              </h2>
              <span className="bg-amber-400 text-slate-900 text-xs font-black px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                ĐANG CHẤM: TUẦN {currentWeek}
              </span>
            </div>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
              Phòng: {currentClass.room || 'Phòng Tin Học'} • Bấm (+1) để cộng điểm phát biểu, hệ thống tự động lưu ngay lập tức.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-slate-900">
            <div className="bg-white/95 rounded-xl p-2.5 text-center shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
                <Users className="w-3 h-3 text-emerald-600" />
                Sĩ số
              </div>
              <div className="text-xl font-black text-slate-800">{stats.total}</div>
            </div>

            <div className="bg-white/95 rounded-xl p-2.5 text-center shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Lượt tuần {currentWeek}
              </div>
              <div className="text-xl font-black text-emerald-600">+{stats.weekTotalPoints}</div>
            </div>

            <div className="bg-white/95 rounded-xl p-2.5 text-center shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3 text-teal-600" />
                Đã phát biểu
              </div>
              <div className="text-xl font-black text-teal-700">
                {stats.scoredCount} <span className="text-xs font-normal text-slate-400">/ {stats.total}</span>
              </div>
            </div>

            <div className="bg-white/95 rounded-xl p-2.5 text-center shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
                <Award className="w-3 h-3 text-amber-600" />
                Tổng cả năm
              </div>
              <div className="text-xl font-black text-amber-600">{stats.classAllTimeTotal} ⭐</div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS BAR: Thêm học sinh, Dán danh sách, Tải lên Excel, Xuất báo cáo */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenAddStudent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
            title="Thêm một học sinh mới vào lớp này"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Thêm Học Sinh</span>
          </button>

          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-xs shadow-2xs active:scale-95 transition-all"
            title="Dán nhanh danh sách học sinh từ Word hoặc Excel"
          >
            <ClipboardPaste className="w-4 h-4 text-purple-600" />
            <span>Dán Danh Sách</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs shadow-2xs active:scale-95 transition-all"
            title="Tải lên tệp Excel (.xlsx) hoặc CSV"
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Tải Lên Excel</span>
          </button>

          {/* Xóa tất cả học sinh */}
          {classStudents.length > 0 && (
            <button
              onClick={() => setIsConfirmClearAllOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs shadow-2xs active:scale-95 transition-all"
              title={`Xóa toàn bộ ${classStudents.length} học sinh của lớp này`}
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Xóa Tất Cả HS</span>
            </button>
          )}
        </div>

        {/* Xuất Báo Cáo Button */}
        <button
          onClick={onOpenReportExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 active:scale-95 transition-all"
          title="Xuất báo cáo theo tuần, học kì, cả năm của lớp và các lớp dạy"
        >
          <FileSpreadsheet className="w-4 h-4 text-slate-950" />
          <span>Xuất Báo Cáo Excel</span>
        </button>
      </div>

      {/* Control bar: Fast search, quick filter pills, sorting */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo họ tên hoặc STT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter and Sort Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1.5 rounded-md transition-all ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({classStudents.length})
            </button>
            <button
              onClick={() => setFilterType('unscored')}
              className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                filterType === 'unscored'
                  ? 'bg-rose-500 text-white shadow-2xs font-bold'
                  : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Chưa có điểm T{currentWeek} ({stats.unscoredCount})
            </button>
            <button
              onClick={() => setFilterType('scored')}
              className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                filterType === 'scored'
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Đã có điểm ({stats.scoredCount})
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-medium text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="stt">Xếp theo STT</option>
              <option value="name">Xếp theo Tên (A - Z)</option>
              <option value="week-desc">Điểm T{currentWeek} cao nhất</option>
              <option value="total-desc">Tổng điểm cả năm cao nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Student Scoring Roster */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-medium">Không tìm thấy học sinh phù hợp với bộ lọc</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <button
                onClick={handleOpenAddStudent}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg shadow-2xs"
              >
                + Thêm học sinh ngay
              </button>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                }}
                className="text-xs text-slate-600 hover:underline font-semibold px-2 py-1.5"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredStudents.map((student) => {
              const weekScore = student.scores[currentWeek] || 0;
              const isPlusAnimated = activePlusAnimationId === student.id;
              const isEditing = editingStudentId === student.id;

              return (
                <div
                  key={student.id}
                  className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 sm:px-4 py-3 gap-3 transition-colors ${
                    weekScore > 0 ? 'bg-emerald-50/25 hover:bg-emerald-50/50' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Left: STT, Student Name, Gender, Notes */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm">
                      {student.stt}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                          {student.fullName}
                        </span>
                        {(
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${student.gender === 'nu' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                            {student.gender === 'nu' ? 'Nữ' : student.gender === 'nam' ? 'Nam' : 'Chưa xác định'}
                          </span>
                        )}
                        {student.notes && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-medium">
                            {student.notes}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1 font-semibold text-slate-600">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          Tổng cả năm: <strong className="text-amber-600 font-bold">{student.totalScore}</strong>
                        </span>
                        <span>•</span>
                        <span>Mã: {student.id.replace('stu-', '')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score Counter Badge & BIG TOUCH-FRIENDLY BUTTONS + Student Actions */}
                  <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 flex-shrink-0">
                    {/* Floating animation badge on +1 */}
                    <div className="relative">
                      {isPlusAnimated && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none z-20 animate-bounce text-xs font-black text-emerald-600 bg-white px-2 py-0.5 rounded-full shadow-md border border-emerald-300">
                          +1 Điểm! 🎉
                        </div>
                      )}

                      {/* Current Week Score Display / Direct Edit */}
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={directScoreInput}
                            onChange={(e) => setDirectScoreInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveDirectScore(student.id)}
                            className="w-14 px-1 py-1.5 text-center font-bold text-base border-2 border-emerald-500 rounded-lg focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveDirectScore(student.id)}
                            className="bg-emerald-600 text-white text-xs px-2 py-1.5 rounded-lg font-bold"
                          >
                            Lưu
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartDirectEdit(student.id, weekScore)}
                          title="Nhấn để nhập trực tiếp số điểm tuần này"
                          className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-center ${
                            weekScore > 0
                              ? 'bg-emerald-100/80 border-emerald-300 text-emerald-900 shadow-2xs hover:bg-emerald-200'
                              : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          <span className="text-[11px] uppercase font-bold text-slate-500">
                            T{currentWeek}:
                          </span>
                          <span className="text-lg font-black text-emerald-700 min-w-[20px]">
                            {weekScore}
                          </span>
                          <span className="text-[10px] text-slate-400 group-hover:text-slate-600">
                            ✏️
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Minus 1 Button */}
                    <button
                      onClick={() => handleMinusClick(student.id, weekScore)}
                      disabled={weekScore <= 0}
                      title={weekScore <= 0 ? 'Điểm đã bằng 0, không thể trừ tiếp' : 'Trừ 1 điểm tuần này'}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center border border-slate-300 bg-white hover:bg-rose-50 hover:border-rose-300 text-slate-600 hover:text-rose-600 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 shadow-2xs"
                    >
                      <Minus className="w-5 h-5 font-bold" />
                    </button>

                    {/* BIG +1 BUTTON */}
                    <button
                      onClick={() => handlePlusClick(student.id)}
                      className="h-10 sm:h-11 px-4 sm:px-5 rounded-xl flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white font-black text-base shadow-md shadow-emerald-600/30 active:scale-95 transition-all select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
                      title={`Cộng 1 điểm cho ${student.fullName} trong tuần ${currentWeek}`}
                    >
                      <Plus className="w-5 h-5 stroke-[3]" />
                      <span>+1</span>
                    </button>

                    {/* Inline edit student */}
                    <button
                      onClick={() => handleOpenEditStudent(student)}
                      className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                      title={`Sửa thông tin của ${student.fullName}`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Inline delete student */}
                    <button
                      onClick={() => setDeletingStudent(student)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title={`Xóa học sinh ${student.fullName}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT SINGLE STUDENT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingStudent ? 'Sửa Thông Tin Học Sinh' : `Thêm Học Sinh Vào Lớp ${currentClass.name}`}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-sm"
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
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs"
                >
                  Lưu Học Sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BATCH PASTE STUDENTS */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
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
                Copy danh sách học sinh từ Word, Excel hoặc danh bạ và dán vào đây. Mỗi học sinh một dòng. Hệ thống tự nhận diện tên và đánh số thứ tự tiếp theo.
              </p>

              <textarea
                rows={8}
                value={batchNamesText}
                onChange={(e) => setBatchNamesText(e.target.value)}
                placeholder="Nguyễn Văn An&#10;Trần Thị Mai&#10;Lê Hoàng Nam&#10;..."
                className="w-full p-3 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                autoFocus
              />

              <div className="flex items-center justify-between text-slate-500">
                <span>
                  Đã nhận diện: <strong className="text-purple-600 font-bold">{batchNamesText.split('\n').filter((l) => l.trim().length > 0).length}</strong> học sinh
                </span>
                <span className="text-[11px] text-slate-400">Tự động nối tiếp STT</span>
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

      {/* MODAL: UPLOAD EXCEL FILE */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Tải Lên Danh Sách Excel • Lớp {currentClass.name}
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Chưa có file mẫu?</div>
                  <div className="text-[11px] text-slate-500">Tải file mẫu Excel chuẩn 35 tuần</div>
                </div>
                <button
                  onClick={downloadSampleExcelTemplate}
                  className="flex items-center gap-1 bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-300 px-2.5 py-1.5 rounded-lg font-bold text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải mẫu
                </button>
              </div>

              {/* Upload Drop area */}
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center hover:bg-blue-50/40 transition-colors">
                <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <label className="cursor-pointer">
                  <span className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg font-bold text-xs shadow-xs inline-block">
                    Chọn File Excel (.xlsx) / CSV
                  </span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-2">
                  Tự động nhận diện STT, Họ và tên, Giới tính, Điểm các tuần
                </p>
              </div>

              {uploadLoading && (
                <div className="p-3 text-center text-blue-700 font-bold animate-pulse">
                  Đang xử lý tệp Excel...
                </div>
              )}

              {uploadError && (
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                  {uploadError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE STUDENT MODAL */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Xác Nhận Xóa Học Sinh?</h4>
            <p className="text-xs text-slate-600 mt-1">
              Bạn có chắc chắn muốn xóa em <strong className="text-slate-900 font-bold">{deletingStudent.fullName}</strong> khỏi Lớp {currentClass.name}? Điểm tích lũy ({deletingStudent.totalScore} ⭐) của em sẽ bị xóa.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  onDeleteStudent(deletingStudent.id);
                  setDeletingStudent(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs"
              >
                Xóa Học Sinh
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
              Toàn bộ danh sách và điểm số 35 tuần của các em sẽ bị xóa sạch để bạn nhập lại từ đầu.
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

      {/* Floating Undo Snackbar if recent action exists */}
      {lastHistoryLog && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-sm text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs sm:text-sm animate-fade-in">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">
              {lastHistoryLog.delta > 0 ? '+1' : '-1'}
            </span>
            <span>
              {lastHistoryLog.studentName} (Lớp {lastHistoryLog.className}, T{lastHistoryLog.week})
            </span>
            <span className="text-slate-400">
              ➜ Tuần: <strong className="text-white">{lastHistoryLog.newScore}</strong> | Tổng: <strong className="text-amber-400">{lastHistoryLog.newTotal}</strong>
            </span>
          </div>

          <button
            onClick={onUndoLastScore}
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-900 px-2.5 py-1 rounded-lg font-bold transition-all text-xs shadow-xs active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Hoàn tác
          </button>
        </div>
      )}
    </div>
  );
};
