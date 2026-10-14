import React from 'react';
import { 
  Zap, 
  Table, 
  Trophy, 
  Users, 
  Dices, 
  Volume2, 
  VolumeX, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  FileSpreadsheet, 
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { AppSettings, ViewMode } from '../types';

interface NavbarProps {
  settings: AppSettings;
  currentMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  onUpdateWeek: (week: number) => void;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onExportAllExcel: () => void;
  onOpenReportExport: () => void;
  onOpenRandomPicker: () => void;
  lastSavedTime: Date | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  currentMode,
  onSelectMode,
  onUpdateWeek,
  onToggleSound,
  onOpenSettings,
  onExportAllExcel,
  onOpenReportExport,
  onOpenRandomPicker,
  lastSavedTime,
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40 border-b border-slate-800">
      {/* Top micro bar with school & teacher info + quick actions */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5 flex flex-wrap items-center justify-between text-xs text-slate-300 border-b border-slate-800/60">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="font-semibold text-emerald-400 flex items-center gap-1">
            🏫 {settings.schoolName}
          </span>
          <span className="hidden md:inline text-slate-500">•</span>
          <span className="hidden md:inline bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-medium">
            Năm học {settings.schoolYear}
          </span>
          <span className="hidden lg:inline text-slate-500">•</span>
          <span className="hidden lg:inline text-slate-300">
            GV: <strong className="text-white">{settings.teacherName}</strong> ({settings.subjectName})
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
          {/* Auto-save indicator */}
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Lưu tự động</span>
          </div>

          {/* Sound toggle */}
          <button
            onClick={onToggleSound}
            title={settings.soundEnabled ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh hiệu ứng'}
            className={`p-1 rounded hover:bg-slate-800 transition-colors flex items-center gap-1 ${
              settings.soundEnabled ? 'text-amber-400' : 'text-slate-500'
            }`}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-[11px] hidden sm:inline">{settings.soundEnabled ? 'Âm thanh' : 'Tắt tiếng'}</span>
          </button>

          {/* Export Reports Center */}
          <button
            onClick={onOpenReportExport}
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded font-bold transition-all shadow-sm active:scale-95 text-[11px]"
            title="Xuất báo cáo theo tuần, học kì, cả năm cho lớp và các lớp dạy"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Báo Cáo</span>
          </button>

          {/* Export All Excel */}
          <button
            onClick={onExportAllExcel}
            className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-0.5 rounded font-medium transition-all shadow-sm active:scale-95 text-[11px]"
            title="Xuất file Excel gồm 23 sheet cho 23 lớp"
          >
            <span className="hidden md:inline">Excel 23 Sheet</span>
            <span className="md:hidden">23 Sheet</span>
          </button>

          {/* Settings & Backup Modal */}
          <button
            onClick={onOpenSettings}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
            title="Cài đặt & Sao lưu dữ liệu"
          >
            <Settings className="w-4 h-4" />
            <span className="text-[11px] hidden lg:inline">Sao lưu & Cài đặt</span>
          </button>
        </div>
      </div>

      {/* Main navigation & week controller bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* App Title & Week Selector */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 font-black text-lg">
              35
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>THEO DÕI HỌC SINH 35 TUẦN</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">
                  Tin Học
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Quản lý thi đua & phát biểu 23 lớp tiểu học</p>
            </div>
          </div>

          {/* Week Selector Control - Centerpiece */}
          <div className="flex items-center bg-slate-800 border border-slate-700/80 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => onUpdateWeek(Math.max(1, settings.currentWeek - 1))}
              disabled={settings.currentWeek <= 1}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Tuần:</span>
              <select
                value={settings.currentWeek}
                onChange={(e) => onUpdateWeek(Number(e.target.value))}
                className="bg-slate-900 text-amber-300 font-bold text-sm px-2.5 py-1 rounded-lg border border-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Tuần {w} {w <= 18 ? '(HK I)' : '(HK II)'}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-400 font-mono">/ 35</span>
            </div>

            <button
              onClick={() => onUpdateWeek(Math.min(35, settings.currentWeek + 1))}
              disabled={settings.currentWeek >= 35}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
              title="Tuần kế tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode Switcher Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => onSelectMode('quick-score')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              currentMode === 'quick-score'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Chấm Điểm Nhanh</span>
          </button>

          <button
            onClick={() => onSelectMode('matrix-35')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              currentMode === 'matrix-35'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Bảng 35 Tuần</span>
          </button>

          <button
            onClick={() => onSelectMode('statistics')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              currentMode === 'statistics'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>Thống Kê & Top</span>
          </button>

          <button
            onClick={() => onSelectMode('class-manager')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              currentMode === 'class-manager'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Quản Lý 23 Lớp</span>
          </button>

          <button
            onClick={onOpenRandomPicker}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-300 hover:text-white hover:bg-rose-950/50 border border-rose-900/60 transition-all whitespace-nowrap"
            title="Bốc thăm ngẫu nhiên học sinh phát biểu"
          >
            <Dices className="w-4 h-4 text-rose-400" />
            <span>Bốc Thăm</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
