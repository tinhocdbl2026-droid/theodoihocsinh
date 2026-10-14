import React, { useState } from 'react';
import { ClassRoom, Student, AppSettings } from '../types';
import { 
  FileSpreadsheet, 
  Calendar, 
  BookOpen, 
  Trophy, 
  X, 
  Download, 
  Layers, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import {
  exportWeeklyClassReport,
  exportAllClassesWeeklyReport,
  exportSingleClassToExcel,
  exportAllClassesSemesterReport,
  exportAll23ClassesToExcel,
  exportLeaderboardToExcel,
} from '../services/excel';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassRoom[];
  students: Student[];
  currentClass: ClassRoom;
  settings: AppSettings;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  classes,
  students,
  currentClass,
  settings,
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number>(settings.currentWeek);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentClassStudents = students.filter((s) => s.classId === currentClass.id);

  const showSuccess = (msg: string) => {
    setDownloadSuccessMessage(msg);
    setTimeout(() => setDownloadSuccessMessage(null), 3000);
  };

  // 1. Weekly Exports
  const handleExportWeeklyCurrentClass = () => {
    exportWeeklyClassReport(selectedWeek, currentClass, currentClassStudents, settings);
    showSuccess(`Đã xuất báo cáo Tuần ${selectedWeek} của Lớp ${currentClass.name}!`);
  };

  const handleExportWeeklyAllClasses = () => {
    exportAllClassesWeeklyReport(selectedWeek, classes, students, settings);
    showSuccess(`Đã xuất báo cáo Tuần ${selectedWeek} của tất cả ${classes.length} lớp!`);
  };

  // 2. Semester Exports
  const handleExportSemesterCurrentClass = (sem: 'sem1' | 'sem2') => {
    exportSingleClassToExcel(currentClass, currentClassStudents, settings, sem);
    showSuccess(`Đã xuất báo cáo ${sem === 'sem1' ? 'Học kỳ I' : 'Học kỳ II'} Lớp ${currentClass.name}!`);
  };

  const handleExportSemesterAllClasses = (sem: 'sem1' | 'sem2') => {
    exportAllClassesSemesterReport(sem, classes, students, settings);
    showSuccess(`Đã xuất báo cáo ${sem === 'sem1' ? 'Học kỳ I' : 'Học kỳ II'} của tất cả ${classes.length} lớp!`);
  };

  // 3. Full Year Exports
  const handleExportYearCurrentClass = () => {
    exportSingleClassToExcel(currentClass, currentClassStudents, settings, 'all');
    showSuccess(`Đã xuất sổ theo dõi cả năm Lớp ${currentClass.name}!`);
  };

  const handleExportYearAllClasses = () => {
    exportAll23ClassesToExcel(classes, students, settings);
    showSuccess(`Đã xuất sổ tổng hợp 35 tuần toàn bộ ${classes.length} lớp (23 sheet)!`);
  };

  const handleExportLeaderboard = () => {
    exportLeaderboardToExcel(null, students, settings);
    showSuccess(`Đã xuất Bảng xếp hạng thi đua toàn trường!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 font-black">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">
                TRUNG TÂM XUẤT BÁO CÁO EXCEL
              </h3>
              <p className="text-xs text-slate-500">
                Xuất file Excel theo tuần, theo học kì, và theo cả năm học
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast notification */}
        {downloadSuccessMessage && (
          <div className="my-3 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{downloadSuccessMessage}</span>
          </div>
        )}

        <div className="space-y-4 mt-4 text-xs">
          {/* SECTION 1: XUẤT BÁO CÁO THEO TUẦN */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>1. Báo Cáo Theo Tuần Học</span>
              </div>

              {/* Week selector */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-2xs">
                <span className="text-slate-500 font-semibold">Chọn tuần:</span>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className="bg-transparent font-black text-emerald-700 cursor-pointer focus:outline-none"
                >
                  {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>
                      Tuần {w} {w === settings.currentWeek ? '(Tuần hiện tại)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-slate-500 text-[11px]">
              Báo cáo chi tiết số điểm phát biểu, đánh giá mức độ tích cực (Xuất sắc, Tích cực, Đạt) của tuần {selectedWeek}.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Single Class Weekly */}
              <button
                onClick={handleExportWeeklyCurrentClass}
                className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 transition-all shadow-2xs group text-left"
              >
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-emerald-700">
                    Xuất Tuần {selectedWeek} • Lớp {currentClass.name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {currentClassStudents.length} học sinh của lớp đang chọn
                  </div>
                </div>
                <Download className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              </button>

              {/* All Classes Weekly */}
              <button
                onClick={handleExportWeeklyAllClasses}
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white transition-all shadow-xs group text-left"
              >
                <div>
                  <div className="font-bold">
                    Xuất Tuần {selectedWeek} • Tất Cả {classes.length} Lớp
                  </div>
                  <div className="text-[11px] text-emerald-200">
                    Gồm sheet tổng hợp + sheet từng lớp
                  </div>
                </div>
                <Download className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          {/* SECTION 2: XUẤT BÁO CÁO THEO HỌC KỲ */}
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
            <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>2. Báo Cáo Theo Học Kỳ</span>
            </div>

            {/* Semester 1 */}
            <div>
              <div className="font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <span>📘 Học Kỳ I (Tuần 1 đến Tuần 18):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleExportSemesterCurrentClass('sem1')}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 text-left transition-all shadow-2xs"
                >
                  <span className="font-bold">HK1 • Lớp {currentClass.name}</span>
                  <Download className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={() => handleExportSemesterAllClasses('sem1')}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-left transition-all shadow-xs"
                >
                  <span className="font-bold">HK1 • Tất Cả {classes.length} Lớp</span>
                  <Download className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Semester 2 */}
            <div className="pt-2">
              <div className="font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <span>📙 Học Kỳ II (Tuần 19 đến Tuần 35):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleExportSemesterCurrentClass('sem2')}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 text-left transition-all shadow-2xs"
                >
                  <span className="font-bold">HK2 • Lớp {currentClass.name}</span>
                  <Download className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={() => handleExportSemesterAllClasses('sem2')}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-left transition-all shadow-xs"
                >
                  <span className="font-bold">HK2 • Tất Cả {classes.length} Lớp</span>
                  <Download className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: XUẤT BÁO CÁO CẢ NĂM HỌC (35 TUẦN) */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
            <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>3. Báo Cáo Tổng Hợp Cả Năm Học (35 Tuần)</span>
            </div>

            <p className="text-slate-500 text-[11px]">
              Sổ theo dõi hoàn chỉnh gồm đầy đủ 35 cột tuần, cột tổng cộng, công thức SUM và định dạng chuẩn in ấn.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                onClick={handleExportYearCurrentClass}
                className="p-3 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-800 text-center transition-all shadow-2xs"
              >
                <FileSpreadsheet className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <div className="font-bold text-xs">Sổ Cả Năm Lớp {currentClass.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">35 tuần lớp hiện tại</div>
              </button>

              <button
                onClick={handleExportYearAllClasses}
                className="p-3 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-center transition-all shadow-md shadow-amber-600/20"
              >
                <Layers className="w-5 h-5 text-white mx-auto mb-1" />
                <div className="font-bold text-xs">Sổ 35 Tuần 23 Lớp (23 Sheet)</div>
                <div className="text-[10px] text-amber-200 mt-0.5">Mỗi lớp 1 sheet riêng biệt</div>
              </button>

              <button
                onClick={handleExportLeaderboard}
                className="p-3 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-800 text-center transition-all shadow-2xs"
              >
                <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <div className="font-bold text-xs">Bảng Xếp Hạng Toàn Trường</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Top thi đua phát biểu</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
