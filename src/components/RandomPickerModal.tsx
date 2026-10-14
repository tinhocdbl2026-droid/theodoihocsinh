import React, { useState, useEffect } from 'react';
import { Student, ClassRoom, AppSettings } from '../types';
import { Dices, Sparkles, X, Trophy, Plus, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundService } from '../services/sound';

interface RandomPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: ClassRoom;
  students: Student[];
  settings: AppSettings;
  onAwardPoint: (studentId: string, week: number) => void;
}

export const RandomPickerModal: React.FC<RandomPickerModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  students,
  settings,
  onAwardPoint,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'unscored'>('unscored');
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayedName, setDisplayedName] = useState<string>('Bấm nút để quay...');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [hasAwarded, setHasAwarded] = useState(false);

  const currentWeek = settings.currentWeek;

  // Candidate pool
  const candidateStudents = students.filter((s) => {
    if (s.classId !== currentClass.id) return false;
    if (filterMode === 'unscored') {
      return (s.scores[currentWeek] || 0) === 0;
    }
    return true;
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedStudent(null);
      setHasAwarded(false);
      setDisplayedName(
        candidateStudents.length > 0
          ? `Sẵn sàng (${candidateStudents.length} em)`
          : 'Không có học sinh trong danh sách'
      );
    }
  }, [isOpen, filterMode, currentClass.id]);

  if (!isOpen) return null;

  const startSpin = () => {
    if (candidateStudents.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setSelectedStudent(null);
    setHasAwarded(false);

    let counter = 0;
    const totalIterations = 25;
    const intervalTime = 70;

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * candidateStudents.length);
      const tempStudent = candidateStudents[randomIndex];
      setDisplayedName(`${tempStudent.stt}. ${tempStudent.fullName}`);
      counter++;

      if (counter >= totalIterations) {
        clearInterval(interval);
        setIsSpinning(false);

        // Pick final student
        const finalStudent = candidateStudents[Math.floor(Math.random() * candidateStudents.length)];
        setSelectedStudent(finalStudent);
        setDisplayedName(`${finalStudent.stt}. ${finalStudent.fullName}`);

        // Trigger fanfare & confetti
        soundService.playFanfare(settings.soundEnabled);
        try {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      }
    }, intervalTime);
  };

  const handlePlusFromPicker = () => {
    if (!selectedStudent || hasAwarded) return;
    onAwardPoint(selectedStudent.id, currentWeek);
    setHasAwarded(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-rose-500/25 mb-3">
            <Dices className={`w-8 h-8 ${isSpinning ? 'animate-spin' : ''}`} />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            VÒNG QUAY GỌI TÊN PHÁT BIỂU
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Lớp {currentClass.name} • Tuần {currentWeek}
          </p>
        </div>

        {/* Filter pool option */}
        <div className="mt-4 flex items-center justify-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setFilterMode('unscored')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              filterMode === 'unscored'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chưa có điểm T{currentWeek} ({students.filter((s) => s.classId === currentClass.id && (s.scores[currentWeek] || 0) === 0).length})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả học sinh ({students.filter((s) => s.classId === currentClass.id).length})
          </button>
        </div>

        {/* Display Roulette Box */}
        <div className="my-6 p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800 text-white text-center shadow-inner border border-slate-700 min-h-[140px] flex flex-col items-center justify-center relative">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Học sinh may mắn
          </div>

          <div
            className={`text-2xl sm:text-3xl font-black tracking-tight transition-transform ${
              isSpinning ? 'scale-105 text-amber-300' : selectedStudent ? 'text-emerald-400 scale-105' : 'text-slate-300'
            }`}
          >
            {displayedName}
          </div>

          {selectedStudent && (
            <div className="text-xs text-slate-300 mt-2 flex items-center gap-2">
              <span>Đã có: <strong className="text-amber-400 font-bold">{selectedStudent.totalScore} ⭐</strong> cả năm</span>
              <span>•</span>
              <span>Tuần {currentWeek}: {selectedStudent.scores[currentWeek] || 0} điểm</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={startSpin}
            disabled={isSpinning || candidateStudents.length === 0}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 active:from-rose-700 active:to-amber-600 text-white font-black text-base shadow-lg shadow-rose-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Dices className="w-5 h-5" />
            <span>{isSpinning ? 'Đang quay ngẫu nhiên...' : 'QUAY BỐC THĂM'}</span>
          </button>

          {/* Quick point award button right here if student answered correctly! */}
          {selectedStudent && (
            <button
              onClick={handlePlusFromPicker}
              disabled={hasAwarded}
              className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                hasAwarded
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 active:scale-98'
              }`}
            >
              {hasAwarded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đã cộng +1 điểm cho em thành công!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Trả Lời Đúng (+1 Điểm Tuần {currentWeek})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
