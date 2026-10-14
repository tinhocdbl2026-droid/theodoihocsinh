import React, { useState } from 'react';
import { AppSettings } from '../types';
import { 
  Settings, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  RotateCcw, 
  X, 
  Check, 
  AlertTriangle,
  HardDrive
} from 'lucide-react';

interface SettingsBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onExportJSON: () => void;
  onImportJSON: (jsonString: string) => void;
  onExportAllExcel: () => void;
  onResetDefaultData: () => void;
  classesCount: number;
  studentsCount: number;
}

export const SettingsBackupModal: React.FC<SettingsBackupModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onExportJSON,
  onImportJSON,
  onExportAllExcel,
  onResetDefaultData,
  classesCount,
  studentsCount,
}) => {
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [schoolYear, setSchoolYear] = useState(settings.schoolYear);
  const [teacherName, setTeacherName] = useState(settings.teacherName);
  const [subjectName, setSubjectName] = useState(settings.subjectName);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      schoolName: schoolName.trim() || 'Trường Tiểu Học',
      schoolYear: schoolYear.trim() || '2025 - 2026',
      teacherName: teacherName.trim() || 'Giáo Viên Tin Học',
      subjectName: subjectName.trim() || 'Môn Tin Học',
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        onImportJSON(content);
        onClose();
      } catch (err: any) {
        setImportError('Tệp sao lưu không hợp lệ. Vui lòng kiểm tra lại file .json!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700" />
            Cài Đặt & Sao Lưu Dữ Liệu
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database status banner */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <HardDrive className="w-4 h-4 text-emerald-600" />
            <span>
              Lưu trữ: <strong className="text-slate-900 font-bold">{classesCount} lớp</strong> •{' '}
              <strong className="text-slate-900 font-bold">{studentsCount} học sinh</strong>
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
            IndexedDB An Toàn
          </span>
        </div>

        {/* Section 1: School Information Settings */}
        <form onSubmit={handleSave} className="space-y-3 mt-4 text-xs">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            1. Thông Tin Trường & Năm Học (Xuất file Excel & Báo cáo)
          </h4>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Tên Trường Tiểu Học:</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-sm"
              placeholder="Ví dụ: Trường Tiểu Học Chu Văn An"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Năm Học:</label>
              <input
                type="text"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                placeholder="2025 - 2026"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Họ Tên Giáo Viên:</label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                placeholder="Thầy/Cô..."
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Môn Học:</label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                placeholder="Môn Tin Học"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>{savedSuccess ? 'Đã Lưu Thành Công!' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        </form>

        <hr className="my-5 border-slate-100" />

        {/* Section 2: Backup & Restore */}
        <div className="space-y-3 text-xs">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            2. Sao Lưu & Khôi Phục Dữ Liệu Toàn Diện
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Export JSON */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <Download className="w-4 h-4 text-blue-600" />
                Sao lưu tệp JSON dự phòng
              </div>
              <p className="text-slate-500 text-[11px] mb-3">
                Tải về toàn bộ dữ liệu 23 lớp, học sinh và điểm số 35 tuần về máy tính.
              </p>
              <button
                onClick={onExportJSON}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-xs"
              >
                Tải Tệp Sao Lưu (.json)
              </button>
            </div>

            {/* Import JSON */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <Upload className="w-4 h-4 text-purple-600" />
                Khôi phục từ tệp sao lưu
              </div>
              <p className="text-slate-500 text-[11px] mb-3">
                Nhập dữ liệu đã sao lưu trước đó từ tệp JSON vào ứng dụng.
              </p>
              <label className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-xs cursor-pointer block text-center">
                <span>Chọn Tệp JSON Khôi Phục</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {importError && (
            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {importError}
            </div>
          )}
        </div>

        <hr className="my-5 border-slate-100" />

        {/* Section 3: Excel Multi-sheet Export */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            3. Xuất Tệp Excel Đa Sheet
          </h4>
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                Xuất file Excel gồm 23 sheet (mỗi lớp 1 sheet riêng biệt)
              </div>
              <div className="text-[11px] text-emerald-800 mt-0.5">
                Đầy đủ 35 tuần, công thức SUM tự động, thông tin trường, lớp và bản in chuẩn.
              </div>
            </div>
            <button
              onClick={() => {
                onExportAllExcel();
                onClose();
              }}
              className="flex-shrink-0 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-xs"
            >
              Tải Toàn Bộ 23 Sheet
            </button>
          </div>
        </div>

        <hr className="my-5 border-slate-100" />

        {/* Section 4: Reset Danger Zone */}
        <div className="text-xs">
          <h4 className="font-bold text-rose-700 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Vùng Thận Trọng
          </h4>
          {confirmReset ? (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 space-y-2">
              <p className="font-bold text-rose-900">
                Xác nhận khôi phục dữ liệu ban đầu? Toàn bộ điểm số hiện tại sẽ được thay bằng dữ liệu mẫu ban đầu của 23 lớp!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onResetDefaultData();
                    setConfirmReset(false);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg"
                >
                  Xác Nhận Khôi Phục Gốc
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-800 font-semibold rounded-lg"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Khôi phục lại dữ liệu mẫu ban đầu (23 lớp học)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
