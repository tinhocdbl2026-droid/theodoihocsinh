import React from 'react';
import { Student, AppSettings } from '../types';
import { Award, Printer, X, Sparkles, Trophy } from 'lucide-react';

interface PrintCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  rank: number;
  className: string;
  settings: AppSettings;
}

export const PrintCertificateModal: React.FC<PrintCertificateModalProps> = ({
  isOpen,
  onClose,
  student,
  rank,
  className,
  settings,
}) => {
  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative print:border-none print:shadow-none print:max-w-none print:w-full">
        {/* Modal Controls (Hidden in print) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-base">
              Phiếu Khen Thưởng Thi Đua Phát Biểu
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>In Phiếu Khen</span>
            </button>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Layout */}
        <div className="p-8 sm:p-10 border-4 border-double border-amber-500/80 rounded-2xl bg-amber-50/20 text-center relative overflow-hidden mt-4 print:mt-0 print:border-amber-600">
          <div className="absolute top-2 left-2 text-amber-400 text-xl">✦</div>
          <div className="absolute top-2 right-2 text-amber-400 text-xl">✦</div>
          <div className="absolute bottom-2 left-2 text-amber-400 text-xl">✦</div>
          <div className="absolute bottom-2 right-2 text-amber-400 text-xl">✦</div>

          <div className="text-xs uppercase tracking-widest text-slate-600 font-bold mb-1">
            {settings.schoolName.toUpperCase()}
          </div>
          <div className="text-xs font-semibold text-slate-500 mb-4">
            BỘ MÔN TIN HỌC TIỂU HỌC • NĂM HỌC {settings.schoolYear}
          </div>

          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-amber-950 font-black shadow-md mb-2">
            <Trophy className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-amber-900 tracking-tight mb-2 uppercase">
            PHIẾU KHEN THƯỞNG
          </h2>

          <p className="text-xs text-slate-600 italic mb-4">
            Tuyên dương học sinh có thành tích phát biểu và học tập tích cực xuất sắc
          </p>

          <div className="text-sm text-slate-700">Khen tặng em:</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 py-2 border-b-2 border-amber-300 max-w-md mx-auto my-1">
            {student.fullName}
          </div>

          <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-2">
            Học sinh: <strong className="text-amber-800 font-bold">Lớp {className}</strong> • Số thứ tự: <strong className="font-bold">{student.stt}</strong>
          </div>

          <div className="bg-white/80 border border-amber-200 rounded-xl p-3 max-w-sm mx-auto my-4 text-xs font-bold text-amber-900 shadow-2xs">
            Đạt thành tích: <span className="text-emerald-700 font-black">Hạng {rank}</span> với{' '}
            <span className="text-amber-600 font-black text-sm">{student.totalScore} Điểm Cộng</span> trong 35 tuần học tập!
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-4 mt-8 pt-4 text-xs text-slate-700">
            <div>
              <div className="font-bold">Ban Thi Đua Lớp</div>
              <div className="text-[11px] text-slate-400 italic mt-8">(Đã ký)</div>
            </div>
            <div>
              <div className="font-bold">Giáo Viên Phụ Trách</div>
              <div className="text-[11px] text-slate-500 italic mt-8 font-semibold">
                {settings.teacherName}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
