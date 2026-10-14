import React, { useState, useMemo } from 'react';
import { ClassRoom, Student } from '../types';
import { GraduationCap, Users, Sparkles, Plus, Settings2, Trash2, ArrowUpDown } from 'lucide-react';

interface ClassSelectorBarProps {
  classes: ClassRoom[];
  students: Student[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  onOpenAddClass: () => void;
  onOpenClassManager: () => void;
  onDeleteClass: (classId: string) => void;
}

export const ClassSelectorBar: React.FC<ClassSelectorBarProps> = ({
  classes,
  students,
  selectedClassId,
  onSelectClass,
  onOpenAddClass,
  onOpenClassManager,
  onDeleteClass,
}) => {
  const [gradeFilter, setGradeFilter] = useState<number | 'all'>('all');
  const [classSortBy, setClassSortBy] = useState<'order' | 'name' | 'points' | 'students'>('order');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Group stats
  const getStudentCount = (classId: string) => {
    return students.filter((s) => s.classId === classId).length;
  };

  const getClassTotalPoints = (classId: string) => {
    return students
      .filter((s) => s.classId === classId)
      .reduce((sum, s) => sum + s.totalScore, 0);
  };

  const filteredClasses = useMemo(() => {
    let list = gradeFilter === 'all' 
      ? [...classes] 
      : classes.filter((c) => c.grade === gradeFilter);

    list.sort((a, b) => {
      if (classSortBy === 'order') {
        // Standard pedagogical order: Grade 1..5, then class name natural order (1/1, 1/2...)
        if (a.grade !== b.grade) return a.grade - b.grade;
        return (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name, undefined, { numeric: true });
      }
      if (classSortBy === 'name') {
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      }
      if (classSortBy === 'points') {
        return getClassTotalPoints(b.id) - getClassTotalPoints(a.id);
      }
      if (classSortBy === 'students') {
        return getStudentCount(b.id) - getStudentCount(a.id);
      }
      return 0;
    });

    return list;
  }, [classes, gradeFilter, classSortBy, students]);

  const gradeColors: Record<number, { bg: string; activeBg: string; text: string; border: string }> = {
    1: { bg: 'bg-emerald-50 hover:bg-emerald-100', activeBg: 'bg-emerald-600 text-white shadow-emerald-500/30', text: 'text-emerald-800', border: 'border-emerald-200' },
    2: { bg: 'bg-blue-50 hover:bg-blue-100', activeBg: 'bg-blue-600 text-white shadow-blue-500/30', text: 'text-blue-800', border: 'border-blue-200' },
    3: { bg: 'bg-amber-50 hover:bg-amber-100', activeBg: 'bg-amber-600 text-white shadow-amber-500/30', text: 'text-amber-800', border: 'border-amber-200' },
    4: { bg: 'bg-purple-50 hover:bg-purple-100', activeBg: 'bg-purple-600 text-white shadow-purple-500/30', text: 'text-purple-800', border: 'border-purple-200' },
    5: { bg: 'bg-rose-50 hover:bg-rose-100', activeBg: 'bg-rose-600 text-white shadow-rose-500/30', text: 'text-rose-800', border: 'border-rose-200' },
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="bg-white border-b border-slate-200 shadow-xs sticky top-[105px] md:top-[85px] z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        {/* Grade filter row + Class Actions */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-700 uppercase tracking-wide">
              Lớp Dạy ({classes.length} Lớp):
            </span>
            {selectedClass && (
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                Đang xem: Lớp {selectedClass.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {/* Grade filter chips */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setGradeFilter('all')}
                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                  gradeFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({classes.length})
              </button>
              {[1, 2, 3, 4, 5].map((g) => {
                const countInGrade = classes.filter((c) => c.grade === g).length;
                return (
                  <button
                    key={g}
                    onClick={() => setGradeFilter(g)}
                    className={`px-2 py-1 rounded-lg font-medium transition-all ${
                      gradeFilter === g
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    K{g} ({countInGrade})
                  </button>
                );
              })}
            </div>

            <span className="text-slate-300">|</span>

            {/* Sắp xếp thứ tự lớp */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={classSortBy}
                onChange={(e) => setClassSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-slate-700 cursor-pointer focus:outline-none text-[11px]"
                title="Sắp xếp danh sách các lớp để tiện quản lý"
              >
                <option value="order">Sắp xếp: Thứ tự chuẩn (K1 ➜ K5)</option>
                <option value="name">Sắp xếp: Tên lớp (A ➜ Z)</option>
                <option value="points">Sắp xếp: Điểm thi đua cao nhất</option>
                <option value="students">Sắp xếp: Sĩ số đông nhất</option>
              </select>
            </div>

            <span className="text-slate-300">|</span>

            {/* + Thêm Lớp Quick Button */}
            <button
              onClick={onOpenAddClass}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-2xs active:scale-95"
              title="Thêm một lớp học mới"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Thêm Lớp</span>
            </button>

            {/* Quản lý 23 Lớp */}
            <button
              onClick={onOpenClassManager}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all shadow-2xs"
              title="Xem danh sách chi tiết và quản lý toàn bộ các lớp"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Quản Lý Lớp</span>
            </button>

            {/* Quick delete current class button */}
            {selectedClass && (
              <button
                onClick={() => setConfirmDeleteId(selectedClass.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title={`Xóa Lớp ${selectedClass.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Classes horizontal chips / button list */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-300">
          {filteredClasses.map((cls) => {
            const isSelected = cls.id === selectedClassId;
            const studentCount = getStudentCount(cls.id);
            const totalPoints = getClassTotalPoints(cls.id);
            const colorScheme = gradeColors[cls.grade] || gradeColors[1];

            return (
              <button
                key={cls.id}
                onClick={() => onSelectClass(cls.id)}
                className={`flex-shrink-0 group relative flex flex-col items-center justify-center min-w-[76px] sm:min-w-[88px] px-2.5 py-1.5 rounded-xl border transition-all text-left ${
                  isSelected
                    ? `${colorScheme.activeBg} border-transparent shadow-md scale-102 ring-2 ring-emerald-500 ring-offset-1`
                    : `bg-slate-50 hover:bg-white text-slate-800 border-slate-200/90 hover:border-slate-300 shadow-2xs`
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-base font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {cls.name}
                  </span>
                  <span
                    className={`text-[10px] px-1 rounded-sm font-semibold ${
                      isSelected
                        ? 'bg-black/20 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    K{cls.grade}
                  </span>
                </div>

                <div className="flex items-center justify-between w-full mt-1 text-[11px]">
                  <span className={`flex items-center gap-0.5 ${isSelected ? 'text-white/85' : 'text-slate-500'}`}>
                    <Users className="w-3 h-3" />
                    {studentCount}
                  </span>
                  <span className={`flex items-center gap-0.5 font-bold ${isSelected ? 'text-amber-200' : 'text-amber-600'}`}>
                    <Sparkles className="w-3 h-3" />
                    {totalPoints}
                  </span>
                </div>
              </button>
            );
          })}

          {/* "+ Thêm Lớp" Card at the end of scrollable list */}
          <button
            onClick={onOpenAddClass}
            className="flex-shrink-0 flex flex-col items-center justify-center min-w-[76px] sm:min-w-[88px] px-2.5 py-2 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 transition-all text-xs font-bold"
          >
            <Plus className="w-5 h-5 mb-0.5" />
            <span>Thêm lớp</span>
          </button>
        </div>
      </div>

      {/* Confirmation modal for deleting class */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">
              Xác Nhận Xóa Lớp {classes.find((c) => c.id === confirmDeleteId)?.name}?
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Thao tác này sẽ xóa lớp cùng toàn bộ danh sách học sinh và điểm số của lớp này. Bạn có chắc chắn muốn xóa không?
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  onDeleteClass(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs"
              >
                Xóa Lớp Này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
