import React, { useState, useMemo } from 'react';
import { Student, ClassRoom, AppSettings } from '../types';
import { 
  Trophy, 
  Medal, 
  Star, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  Award,
  Plus,
  Printer
} from 'lucide-react';
import { exportLeaderboardToExcel } from '../services/excel';

interface StatisticsViewProps {
  currentClass: ClassRoom;
  students: Student[];
  settings: AppSettings;
  onScoreChange: (studentId: string, week: number, delta: number) => void;
  onOpenPrintCertificate: (student: Student, rank: number) => void;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  currentClass,
  students,
  settings,
  onScoreChange,
  onOpenPrintCertificate,
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'unscored' | 'low-score' | 'chart'>('leaderboard');
  const [topCount, setTopCount] = useState<5 | 10 | 20>(10);

  const currentWeek = settings.currentWeek;

  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === currentClass.id);
  }, [students, currentClass.id]);

  // Sorted by total score descending with tied ranking support
  const rankedStudents = useMemo(() => {
    const list = [...classStudents].sort((a, b) => {
      const diff = b.totalScore - a.totalScore;
      if (diff !== 0) return diff;
      return a.stt - b.stt;
    });

    // Compute ranks (same score = same rank)
    let currentRank = 1;
    return list.map((stu, idx) => {
      if (idx > 0 && stu.totalScore < list[idx - 1].totalScore) {
        currentRank = idx + 1;
      }
      return { ...stu, calculatedRank: currentRank };
    });
  }, [classStudents]);

  // Students who haven't participated this week
  const unscoredThisWeek = useMemo(() => {
    return classStudents.filter((s) => (s.scores[currentWeek] || 0) === 0);
  }, [classStudents, currentWeek]);

  // Students with low overall points (bottom 25%)
  const lowScoredStudents = useMemo(() => {
    return [...rankedStudents].reverse().slice(0, 10);
  }, [rankedStudents]);

  // Weekly aggregate trend data for SVG chart (Week 1..35)
  const weeklyTrendData = useMemo(() => {
    const data: { week: number; totalPoints: number }[] = [];
    for (let w = 1; w <= 35; w++) {
      const sum = classStudents.reduce((acc, s) => acc + (s.scores[w] || 0), 0);
      data.push({ week: w, totalPoints: sum });
    }
    return data;
  }, [classStudents]);

  const maxWeeklyPoints = useMemo(() => {
    return Math.max(...weeklyTrendData.map((d) => d.totalPoints), 10);
  }, [weeklyTrendData]);

  const totalClassPoints = useMemo(() => {
    return classStudents.reduce((sum, s) => sum + s.totalScore, 0);
  }, [classStudents]);

  const avgPointsPerStudent = useMemo(() => {
    return classStudents.length > 0 ? (totalClassPoints / classStudents.length).toFixed(1) : '0';
  }, [classStudents, totalClassPoints]);

  const participationRate = useMemo(() => {
    const activeKids = classStudents.filter((s) => s.totalScore > 0).length;
    return classStudents.length > 0 ? Math.round((activeKids / classStudents.length) * 100) : 0;
  }, [classStudents]);

  const handleExportExcel = () => {
    exportLeaderboardToExcel(currentClass, classStudents, settings);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Top Banner & Metrics */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              Thống Kê & Xếp Hạng Thi Đua • Lớp {currentClass.name}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ghi nhận và tôn vinh tinh thần học tập tích cực, không dùng để quy đổi điểm số học bạ chính thức.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs self-start md:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Xuất Bảng Xếp Hạng Excel</span>
        </button>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <Users className="w-4 h-4 text-blue-500" />
            Sĩ số học sinh
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">{classStudents.length} em</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            {participationRate}% đã từng phát biểu
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500" />
            Tổng điểm cả lớp
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">{totalClassPoints} ⭐</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Trung bình: <strong>{avgPointsPerStudent}</strong> điểm/em
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Đã có điểm Tuần {currentWeek}
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {classStudents.length - unscoredThisWeek.length} em
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Lượt cộng T{currentWeek}: +{classStudents.reduce((sum, s) => sum + (s.scores[currentWeek] || 0), 0)}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            Chưa có điểm Tuần {currentWeek}
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">{unscoredThisWeek.length} em</div>
          <div className="text-[11px] text-rose-600 font-medium mt-0.5">
            Cần gọi phát biểu tuần này!
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-2.5 px-3 flex items-center gap-1.5 transition-all border-b-2 ${
            activeTab === 'leaderboard'
              ? 'border-amber-500 text-amber-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Bảng Vàng Thi Đua (Top Điểm)</span>
        </button>

        <button
          onClick={() => setActiveTab('unscored')}
          className={`pb-2.5 px-3 flex items-center gap-1.5 transition-all border-b-2 ${
            activeTab === 'unscored'
              ? 'border-rose-500 text-rose-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Chưa Phát Biểu Tuần {currentWeek} ({unscoredThisWeek.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('chart')}
          className={`pb-2.5 px-3 flex items-center gap-1.5 transition-all border-b-2 ${
            activeTab === 'chart'
              ? 'border-blue-500 text-blue-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Biểu Đồ 35 Tuần</span>
        </button>

        <button
          onClick={() => setActiveTab('low-score')}
          className={`pb-2.5 px-3 flex items-center gap-1.5 transition-all border-b-2 ${
            activeTab === 'low-score'
              ? 'border-purple-500 text-purple-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Học Sinh Cần Khích Lệ</span>
        </button>
      </div>

      {/* TAB CONTENT: 1. Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="font-semibold text-slate-600">
              Hiển thị danh sách xếp hạng từ cao xuống thấp:
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                onClick={() => setTopCount(5)}
                className={`px-2.5 py-1 rounded font-bold ${topCount === 5 ? 'bg-white shadow-2xs text-amber-600' : 'text-slate-600'}`}
              >
                Top 5
              </button>
              <button
                onClick={() => setTopCount(10)}
                className={`px-2.5 py-1 rounded font-bold ${topCount === 10 ? 'bg-white shadow-2xs text-amber-600' : 'text-slate-600'}`}
              >
                Top 10
              </button>
              <button
                onClick={() => setTopCount(20)}
                className={`px-2.5 py-1 rounded font-bold ${topCount === 20 ? 'bg-white shadow-2xs text-amber-600' : 'text-slate-600'}`}
              >
                Tất cả ({rankedStudents.length})
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {rankedStudents.slice(0, topCount).map((stu) => {
              const rank = stu.calculatedRank;
              let medalBadge = (
                <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                  #{rank}
                </span>
              );

              if (rank === 1) {
                medalBadge = (
                  <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black text-sm flex items-center justify-center shadow-md shadow-amber-500/30">
                    🥇
                  </span>
                );
              } else if (rank === 2) {
                medalBadge = (
                  <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-300 to-slate-200 text-slate-800 font-black text-sm flex items-center justify-center shadow-sm">
                    🥈
                  </span>
                );
              } else if (rank === 3) {
                medalBadge = (
                  <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-700 to-amber-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                    🥉
                  </span>
                );
              }

              return (
                <div
                  key={stu.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    rank === 1
                      ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
                      : rank <= 3
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {medalBadge}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">
                          {stu.fullName}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">STT: {stu.stt}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {stu.notes || (rank <= 3 ? 'Gương mẫu, tích cực phát biểu' : 'Chăm chỉ tham gia')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg sm:text-xl font-black text-amber-600">
                        {stu.totalScore} ⭐
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Tuần {currentWeek}: +{stu.scores[currentWeek] || 0}
                      </div>
                    </div>

                    {/* Print Certificate button for Top students */}
                    <button
                      onClick={() => onOpenPrintCertificate(stu, rank)}
                      title="In Phiếu Khen / Giấy Khen Tuyên Dương"
                      className="p-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors text-xs font-semibold flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Giấy khen</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. Students unscored this week */}
      {activeTab === 'unscored' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <div>
              <strong className="font-bold">Gợi ý cho giáo viên trong tiết học:</strong> Đây là {unscoredThisWeek.length} học sinh chưa phát biểu lần nào trong Tuần {currentWeek}. Thầy/Cô hãy ưu tiên gọi tên các em dưới đây để tạo cơ hội ghi điểm!
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {unscoredThisWeek.map((stu) => (
              <div
                key={stu.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors shadow-2xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {stu.stt}. {stu.fullName}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Tổng cả năm: <strong className="text-amber-600">{stu.totalScore} ⭐</strong>
                  </div>
                </div>

                <button
                  onClick={() => onScoreChange(stu.id, currentWeek, 1)}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-xs active:scale-95 transition-all flex-shrink-0"
                  title="Cộng 1 điểm phát biểu ngay"
                >
                  <Plus className="w-3.5 h-3.5" />
                  +1
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. 35-Week Bar Chart */}
      {activeTab === 'chart' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Biểu Đồ Lượt Phát Biểu Qua 35 Tuần • Lớp {currentClass.name}
            </h3>
            <p className="text-xs text-slate-500">
              Cột màu cam biểu thị tuần đang học hiện tại (Tuần {currentWeek}).
            </p>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-64 sm:h-72 w-full flex items-end gap-1 sm:gap-1.5 pt-6 pb-2 px-2 overflow-x-auto border-b border-slate-200">
            {weeklyTrendData.map((item) => {
              const heightPercent = Math.max((item.totalPoints / maxWeeklyPoints) * 100, 4);
              const isCurrent = item.week === currentWeek;

              return (
                <div
                  key={item.week}
                  className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group relative h-full justify-end"
                >
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-1.5 rounded pointer-events-none whitespace-nowrap z-20 shadow-md">
                    Tuần {item.week}: {item.totalPoints} lượt
                  </div>

                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900">
                    {item.totalPoints > 0 ? item.totalPoints : ''}
                  </span>

                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-t from-amber-500 to-yellow-400 shadow-md'
                        : item.totalPoints > 0
                        ? 'bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300'
                        : 'bg-slate-200'
                    }`}
                  />

                  <span
                    className={`text-[9px] font-semibold mt-1 ${
                      isCurrent ? 'text-amber-600 font-black' : 'text-slate-500'
                    }`}
                  >
                    T{item.week}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. Low score / Needs encouragement */}
      {activeTab === 'low-score' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div className="bg-purple-50 border border-purple-200 text-purple-900 p-3 rounded-xl text-xs flex items-center gap-2">
            <Award className="w-5 h-5 flex-shrink-0 text-purple-600" />
            <div>
              <strong className="font-bold">Danh sách học sinh cần khích lệ:</strong> Các em có tổng điểm còn khiêm tốn. Giáo viên nên giao các câu hỏi vừa sức hoặc khuyến khích tinh thần xung phong để các em tự tin hơn trong các giờ Tin học tiếp theo.
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {lowScoredStudents.map((stu) => (
              <div key={stu.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-6 text-center font-bold text-slate-400">{stu.stt}</span>
                  <span className="font-bold text-slate-900">{stu.fullName}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-600">
                    Tổng điểm: <strong className="text-purple-600">{stu.totalScore} ⭐</strong>
                  </span>
                  <button
                    onClick={() => onScoreChange(stu.id, currentWeek, 1)}
                    className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-md"
                  >
                    <Plus className="w-3 h-3" />
                    +1 Tuần {currentWeek}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
