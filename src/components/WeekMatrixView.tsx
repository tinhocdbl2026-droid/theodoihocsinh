import React, { useState, useMemo } from 'react';
import { Student, ClassRoom, AppSettings, SemesterFilter } from '../types';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Sparkles, 
  Calendar, 
  Trophy,
  ArrowUpDown,
  Download
} from 'lucide-react';
import { searchVietnamese, compareVietnameseNames } from '../utils/vietnamese';
import { exportSingleClassToExcel } from '../services/excel';

interface WeekMatrixViewProps {
  currentClass: ClassRoom;
  students: Student[];
  settings: AppSettings;
  onSetScoreDirect: (studentId: string, week: number, newScore: number) => void;
  onSelectWeek: (week: number) => void;
}

export const WeekMatrixView: React.FC<WeekMatrixViewProps> = ({
  currentClass,
  students,
  settings,
  onSetScoreDirect,
  onSelectWeek,
}) => {
  const [semesterFilter, setSemesterFilter] = useState<SemesterFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'stt' | 'name' | 'total-desc'>('stt');

  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === currentClass.id);
  }, [students, currentClass.id]);

  const weeksToDisplay = useMemo(() => {
    if (semesterFilter === 'sem1') {
      return Array.from({ length: 18 }, (_, i) => i + 1); // 1..18
    }
    if (semesterFilter === 'sem2') {
      return Array.from({ length: 17 }, (_, i) => i + 19); // 19..35
    }
    return Array.from({ length: 35 }, (_, i) => i + 1); // 1..35
  }, [semesterFilter]);

  // Filtered & sorted
  const displayStudents = useMemo(() => {
    let result = classStudents.filter((s) =>
      searchVietnamese(searchQuery, s.fullName) || String(s.stt).includes(searchQuery.trim())
    );

    result.sort((a, b) => {
      if (sortBy === 'stt') return a.stt - b.stt;
      if (sortBy === 'name') return compareVietnameseNames(a.fullName, b.fullName);
      if (sortBy === 'total-desc') return b.totalScore - a.totalScore;
      return 0;
    });

    return result;
  }, [classStudents, searchQuery, sortBy]);

  // Week totals across class
  const weekTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    for (let w = 1; w <= 35; w++) {
      totals[w] = classStudents.reduce((sum, s) => sum + (s.scores[w] || 0), 0);
    }
    return totals;
  }, [classStudents]);

  const grandClassTotal = useMemo(() => {
    return classStudents.reduce((sum, s) => sum + s.totalScore, 0);
  }, [classStudents]);

  const handleCellBlur = (studentId: string, week: number, valueStr: string) => {
    const val = parseInt(valueStr, 10);
    if (!isNaN(val) && val >= 0) {
      onSetScoreDirect(studentId, week, val);
    }
  };

  const handleExportExcel = () => {
    exportSingleClassToExcel(currentClass, classStudents, settings, semesterFilter);
  };

  // Cell heatmap background
  const getCellColor = (score: number, isCurrentWeek: boolean) => {
    if (isCurrentWeek && score === 0) return 'bg-amber-50/70 border-amber-300 font-medium';
    if (score === 0) return 'text-slate-300';
    if (score === 1) return 'bg-emerald-50 text-emerald-800 font-bold';
    if (score === 2) return 'bg-emerald-100 text-emerald-900 font-bold';
    if (score >= 3) return 'bg-amber-100 text-amber-900 font-extrabold';
    return '';
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Header bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Bảng Tổng Hợp 35 Tuần • Lớp {currentClass.name}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              Sĩ số: {classStudents.length} HS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem và chỉnh sửa trực tiếp điểm số của từng học sinh trong cả 35 tuần năm học.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Semester Selector */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setSemesterFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                semesterFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cả năm (35T)
            </button>
            <button
              onClick={() => setSemesterFilter('sem1')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                semesterFilter === 'sem1'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Học kỳ I (T1-18)
            </button>
            <button
              onClick={() => setSemesterFilter('sem2')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                semesterFilter === 'sem2'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Học kỳ II (T19-35)
            </button>
          </div>

          {/* Export Class Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95"
            title="Xuất bảng điểm lớp này ra tệp Excel chuẩn"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel Lớp {currentClass.name}</span>
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Lọc tên hoặc STT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-slate-500 font-medium">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700"
          >
            <option value="stt">Theo STT</option>
            <option value="name">Theo Tên (A - Z)</option>
            <option value="total-desc">Tổng điểm cao nhất</option>
          </select>
        </div>
      </div>

      {/* 35-Week Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto max-h-[68vh] relative">
          <table className="w-full border-collapse text-xs text-left">
            <thead className="bg-slate-900 text-white uppercase text-[11px] font-bold sticky top-0 z-20 shadow-sm">
              <tr>
                {/* Sticky Left: STT & Student Name */}
                <th className="p-2.5 text-center w-12 sticky left-0 z-30 bg-slate-900 border-r border-slate-800">
                  STT
                </th>
                <th className="p-2.5 min-w-[180px] sticky left-12 z-30 bg-slate-900 border-r border-slate-800">
                  Họ và tên
                </th>

                {/* 35 Week Headers */}
                {weeksToDisplay.map((w) => {
                  const isCurrent = w === settings.currentWeek;
                  return (
                    <th
                      key={w}
                      onClick={() => onSelectWeek(w)}
                      className={`p-1.5 text-center min-w-[42px] cursor-pointer hover:bg-slate-800 transition-colors border-r border-slate-800 ${
                        isCurrent ? 'bg-amber-500 text-slate-950 font-black' : ''
                      }`}
                      title={`Tuần ${w} ${isCurrent ? '(Đang chọn) - Bấm để chuyển tuần' : '- Bấm để chọn làm tuần chấm'}`}
                    >
                      <div className="flex flex-col items-center">
                        <span>T{w}</span>
                        {isCurrent && <span className="text-[9px] font-bold">★</span>}
                      </div>
                    </th>
                  );
                })}

                {/* Sticky Right: Total Score */}
                <th className="p-2.5 text-center min-w-[70px] sticky right-0 z-30 bg-amber-600 text-white font-black border-l border-amber-700">
                  TỔNG
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {displayStudents.map((student, idx) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  {/* Sticky STT */}
                  <td className="p-2 text-center font-bold text-slate-600 sticky left-0 z-10 bg-inherit border-r border-slate-200">
                    {student.stt}
                  </td>

                  {/* Sticky Student Name */}
                  <td className="p-2 font-bold text-slate-900 sticky left-12 z-10 bg-inherit border-r border-slate-200 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{student.fullName}</span>
                      {student.notes && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-slate-600 font-normal">
                          {student.notes}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Week Cells (Editable) */}
                  {weeksToDisplay.map((w) => {
                    const score = student.scores[w] || 0;
                    const isCurrent = w === settings.currentWeek;
                    const cellStyle = getCellColor(score, isCurrent);

                    return (
                      <td
                        key={w}
                        className={`p-0 text-center border-r border-slate-100 ${cellStyle}`}
                      >
                        <input
                          type="number"
                          min="0"
                          defaultValue={score > 0 ? score : ''}
                          key={`${student.id}-${w}-${score}`}
                          onBlur={(e) => handleCellBlur(student.id, w, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          placeholder="-"
                          className="w-full h-8 text-center bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-xs"
                          title={`${student.fullName} - Tuần ${w}: ${score} điểm`}
                        />
                      </td>
                    );
                  })}

                  {/* Sticky Total Score */}
                  <td className="p-2 text-center font-black text-amber-700 text-sm sticky right-0 z-10 bg-amber-50/90 border-l border-amber-200">
                    {student.totalScore}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Bottom Row: Total class score for each week */}
            <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-800 sticky bottom-0 z-20">
              <tr>
                <td className="p-2.5 text-center sticky left-0 z-30 bg-slate-100 border-r border-slate-300 font-black">
                  Σ
                </td>
                <td className="p-2.5 sticky left-12 z-30 bg-slate-100 border-r border-slate-300 uppercase tracking-wider text-[11px] font-black">
                  TỔNG CẢ LỚP:
                </td>

                {weeksToDisplay.map((w) => {
                  const wSum = weekTotals[w] || 0;
                  const isCurrent = w === settings.currentWeek;
                  return (
                    <td
                      key={w}
                      className={`p-2 text-center border-r border-slate-200 font-extrabold ${
                        isCurrent ? 'bg-amber-200 text-amber-950' : 'text-slate-800'
                      }`}
                    >
                      {wSum}
                    </td>
                  );
                })}

                <td className="p-2 text-center text-sm font-black sticky right-0 z-30 bg-amber-500 text-slate-950 border-l border-amber-600">
                  {grandClassTotal}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
