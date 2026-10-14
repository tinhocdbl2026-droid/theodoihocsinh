/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ClassRoom, 
  Student, 
  AppSettings, 
  ViewMode, 
  ScoreHistoryLog 
} from './types';
import { dbService, generateInitialStudents, INITIAL_23_CLASSES } from './services/db';
import { soundService } from './services/sound';
import { exportAll23ClassesToExcel } from './services/excel';
import { Navbar } from './components/Navbar';
import { ClassSelectorBar } from './components/ClassSelectorBar';
import { QuickScoreView } from './components/QuickScoreView';
import { WeekMatrixView } from './components/WeekMatrixView';
import { StatisticsView } from './components/StatisticsView';
import { ClassManagerView } from './components/ClassManagerView';
import { RandomPickerModal } from './components/RandomPickerModal';
import { SettingsBackupModal } from './components/SettingsBackupModal';
import { PrintCertificateModal } from './components/PrintCertificateModal';
import { ReportExportModal } from './components/ReportExportModal';
import { Loader2, X } from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    schoolName: 'Trường Tiểu Học Chu Văn An',
    schoolYear: '2025 - 2026',
    teacherName: 'Giáo Viên Tin Học',
    subjectName: 'Môn Tin Học',
    soundEnabled: true,
    currentWeek: 6,
    selectedClassId: 'c-1-1',
  });
  const [currentMode, setCurrentMode] = useState<ViewMode>('quick-score');
  const [history, setHistory] = useState<ScoreHistoryLog[]>([]);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // Modals
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRandomPickerOpen, setIsRandomPickerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [certificateData, setCertificateData] = useState<{ student: Student; rank: number } | null>(null);

  // Quick Add Class Modal
  const [isQuickAddClassModalOpen, setIsQuickAddClassModalOpen] = useState(false);
  const [newClassNameInput, setNewClassNameInput] = useState('');
  const [newClassGradeInput, setNewClassGradeInput] = useState<number>(1);
  const [newClassRoomInput, setNewClassRoomInput] = useState('Phòng Tin Học 1');

  // Load initial state from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        const state = await dbService.loadState();
        setClasses(state.classes);
        setStudents(state.students);
        setSettings(state.settings);
        setHistory(state.history || []);
        setLastSavedTime(new Date());
      } catch (err) {
        console.error('Failed to load database state:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Current active class
  const currentClass = useMemo(() => {
    return classes.find((c) => c.id === settings.selectedClassId) || classes[0] || INITIAL_23_CLASSES[0];
  }, [classes, settings.selectedClassId]);

  // Handle switching class
  const handleSelectClass = useCallback((classId: string) => {
    setSettings((prev) => {
      const next = { ...prev, selectedClassId: classId };
      dbService.saveSettings(next);
      return next;
    });
  }, []);

  // Handle week change
  const handleUpdateWeek = useCallback((week: number) => {
    const clampedWeek = Math.max(1, Math.min(35, week));
    setSettings((prev) => {
      const next = { ...prev, currentWeek: clampedWeek };
      dbService.saveSettings(next);
      return next;
    });
  }, []);

  // Toggle sound
  const handleToggleSound = useCallback(() => {
    setSettings((prev) => {
      const next = { ...prev, soundEnabled: !prev.soundEnabled };
      dbService.saveSettings(next);
      return next;
    });
  }, []);

  // Save Settings
  const handleSaveSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    dbService.saveSettings(newSettings);
  }, []);

  // Helper to recompute student total
  const computeTotal = (scores: Record<number, number>): number => {
    return Object.values(scores).reduce((sum, val) => sum + (val || 0), 0);
  };

  /**
   * Fast In-Class Score Adjustment (+1 or -1)
   */
  const handleScoreChange = useCallback(
    (studentId: string, week: number, delta: number) => {
      setStudents((prev) => {
        const targetIndex = prev.findIndex((s) => s.id === studentId);
        if (targetIndex === -1) return prev;

        const target = prev[targetIndex];
        const oldScore = target.scores[week] || 0;
        const newScore = Math.max(0, oldScore + delta);

        if (newScore === oldScore) {
          return prev;
        }

        const newScores = { ...target.scores, [week]: newScore };
        const newTotal = computeTotal(newScores);

        const updatedStudent: Student = {
          ...target,
          scores: newScores,
          totalScore: newTotal,
        };

        // Sound feedback
        if (delta > 0) {
          soundService.playPlusPoint(settings.soundEnabled);
        } else {
          soundService.playMinusPoint(settings.soundEnabled);
        }

        // History item
        const cls = classes.find((c) => c.id === target.classId);
        const historyItem: ScoreHistoryLog = {
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          studentId: target.id,
          studentName: target.fullName,
          classId: target.classId,
          className: cls?.name || '',
          week,
          delta,
          newScore,
          newTotal,
        };

        setHistory((hPrev) => [...hPrev.slice(-100), historyItem]);

        // Background persistence
        dbService.updateStudentScore(updatedStudent, historyItem).then(() => {
          setLastSavedTime(new Date());
        });

        const next = [...prev];
        next[targetIndex] = updatedStudent;
        return next;
      });
    },
    [settings.soundEnabled, classes]
  );

  /**
   * Direct score assignment
   */
  const handleSetScoreDirect = useCallback(
    (studentId: string, week: number, newScore: number) => {
      setStudents((prev) => {
        const targetIndex = prev.findIndex((s) => s.id === studentId);
        if (targetIndex === -1) return prev;

        const target = prev[targetIndex];
        const safeScore = Math.max(0, newScore);
        const newScores = { ...target.scores, [week]: safeScore };
        const newTotal = computeTotal(newScores);

        const updatedStudent: Student = {
          ...target,
          scores: newScores,
          totalScore: newTotal,
        };

        dbService.saveStudent(updatedStudent).then(() => {
          setLastSavedTime(new Date());
        });

        const next = [...prev];
        next[targetIndex] = updatedStudent;
        return next;
      });
    },
    []
  );

  /**
   * Undo last score action
   */
  const handleUndoLastScore = useCallback(() => {
    if (history.length === 0) return;
    const lastAction = history[history.length - 1];

    handleScoreChange(lastAction.studentId, lastAction.week, -lastAction.delta);
    setHistory((prev) => prev.slice(0, -1));
  }, [history, handleScoreChange]);

  // Class Management Handlers
  const handleAddClass = useCallback((newClassData: Omit<ClassRoom, 'id' | 'order'>) => {
    setClasses((prev) => {
      const newClass: ClassRoom = {
        ...newClassData,
        id: `c-${Date.now()}`,
        order: prev.length + 1,
      };
      const next = [...prev, newClass];
      dbService.saveClass(newClass);
      // Auto select the new class
      handleSelectClass(newClass.id);
      return next;
    });
  }, [handleSelectClass]);

  const handleUpdateClass = useCallback((updatedClass: ClassRoom) => {
    setClasses((prev) => {
      const next = prev.map((c) => (c.id === updatedClass.id ? updatedClass : c));
      dbService.saveClass(updatedClass);
      return next;
    });
  }, []);

  const handleDeleteClass = useCallback(
    (classId: string) => {
      setClasses((prev) => {
        const next = prev.filter((c) => c.id !== classId);
        if (settings.selectedClassId === classId && next.length > 0) {
          handleSelectClass(next[0].id);
        }
        return next;
      });
      setStudents((prev) => prev.filter((s) => s.classId !== classId));
      dbService.deleteClass(classId);
    },
    [settings.selectedClassId, handleSelectClass]
  );

  // Student Management Handlers
  const handleAddStudent = useCallback(
    (newStudentData: Omit<Student, 'id' | 'totalScore'>) => {
      const totalScore = computeTotal(newStudentData.scores);
      const newStudent: Student = {
        ...newStudentData,
        id: `stu-${newStudentData.classId}-${Date.now()}`,
        totalScore,
      };

      setStudents((prev) => {
        const next = [...prev, newStudent];
        dbService.saveStudent(newStudent);
        return next;
      });
    },
    []
  );

  const handleBatchAddStudents = useCallback(
    (classId: string, names: string[]) => {
      const existingInClass = students.filter((s) => s.classId === classId);
      let currentStt = existingInClass.length + 1;

      const newBatch: Student[] = names.map((name, idx) => {
        const scores: Record<number, number> = {};
        for (let w = 1; w <= 35; w++) scores[w] = 0;

        return {
          id: `stu-${classId}-${Date.now()}-${idx}`,
          stt: currentStt++,
          fullName: name,
          classId,
          scores,
          totalScore: 0,
          gender: 'nam',
        };
      });

      setStudents((prev) => {
        const next = [...prev, ...newBatch];
        newBatch.forEach((s) => dbService.saveStudent(s));
        return next;
      });
    },
    [students]
  );

  const handleUpdateStudent = useCallback((updatedStudent: Student) => {
    setStudents((prev) => {
      const total = computeTotal(updatedStudent.scores);
      const studentWithTotal = { ...updatedStudent, totalScore: total };
      const next = prev.map((s) => (s.id === studentWithTotal.id ? studentWithTotal : s));
      dbService.saveStudent(studentWithTotal);
      return next;
    });
  }, []);

  const handleDeleteStudent = useCallback((studentId: string) => {
    setStudents((prev) => {
      const next = prev.filter((s) => s.id !== studentId);
      dbService.deleteStudent(studentId);
      return next;
    });
  }, []);

  // Transfer student to another class with option to keep 35-week scores
  const handleTransferStudent = useCallback(
    (studentId: string, targetClassId: string, keepScores: boolean) => {
      setStudents((prev) => {
        const targetIndex = prev.findIndex((s) => s.id === studentId);
        if (targetIndex === -1) return prev;

        const stu = prev[targetIndex];
        const targetClassStudents = prev.filter((s) => s.classId === targetClassId);
        const newStt = targetClassStudents.length + 1;

        let scores = stu.scores;
        let totalScore = stu.totalScore;

        if (!keepScores) {
          scores = {};
          for (let w = 1; w <= 35; w++) scores[w] = 0;
          totalScore = 0;
        }

        const updatedStudent: Student = {
          ...stu,
          classId: targetClassId,
          stt: newStt,
          scores,
          totalScore,
        };

        const next = [...prev];
        next[targetIndex] = updatedStudent;
        dbService.saveStudent(updatedStudent);
        return next;
      });
    },
    []
  );

  // Auto re-order STT from 1 to N
  const handleAutoReorderSTT = useCallback((classId: string) => {
    setStudents((prev) => {
      const classStudents = prev.filter((s) => s.classId === classId);
      const otherStudents = prev.filter((s) => s.classId !== classId);

      const reordered = classStudents.map((stu, idx) => ({
        ...stu,
        stt: idx + 1,
      }));

      reordered.forEach((s) => dbService.saveStudent(s));
      return [...otherStudents, ...reordered];
    });
  }, []);

  // Excel / CSV roster import replacement or append
  const handleImportStudentsSuccess = useCallback((importedStudents: Student[]) => {
    setStudents((prev) => {
      const targetClassId = importedStudents[0]?.classId;
      if (!targetClassId) return prev;

      const otherStudents = prev.filter((s) => s.classId !== targetClassId);
      const next = [...otherStudents, ...importedStudents];

      importedStudents.forEach((s) => dbService.saveStudent(s));
      return next;
    });
  }, []);

  // Clear all students in a specific class
  const handleClearClassStudents = useCallback((classId: string) => {
    setStudents((prev) => {
      const studentsToRemove = prev.filter((s) => s.classId === classId);
      studentsToRemove.forEach((s) => dbService.deleteStudent(s.id));
      return prev.filter((s) => s.classId !== classId);
    });
  }, []);

  // Reorder classes (drag/sort order)
  const handleReorderClasses = useCallback((reorderedClasses: ClassRoom[]) => {
    setClasses(reorderedClasses);
    reorderedClasses.forEach((c) => dbService.saveClass(c));
  }, []);

  // Export all 23 classes to Excel
  const handleExportAllExcel = useCallback(() => {
    exportAll23ClassesToExcel(classes, students, settings);
  }, [classes, students, settings]);

  // JSON Full Backup
  const handleExportJSON = useCallback(() => {
    const backupState = {
      classes,
      students,
      settings,
      history,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(backupState, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sao_Luu_23_Lop_35_Tuan_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [classes, students, settings, history]);

  // JSON Restore
  const handleImportJSON = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.classes && parsed.students) {
        setClasses(parsed.classes);
        setStudents(parsed.students);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.history) setHistory(parsed.history);

        dbService.saveAll({
          classes: parsed.classes,
          students: parsed.students,
          settings: parsed.settings || settings,
          history: parsed.history || [],
        });
      }
    } catch {
      alert('Không thể khôi phục dữ liệu: Định dạng tệp không hợp lệ');
    }
  }, [settings]);

  // Reset to default seed
  const handleResetDefaultData = useCallback(() => {
    const initClasses = INITIAL_23_CLASSES;
    const initStudents = generateInitialStudents();
    setClasses(initClasses);
    setStudents(initStudents);
    setHistory([]);
    dbService.saveAll({
      classes: initClasses,
      students: initStudents,
      settings,
      history: [],
    });
  }, [settings]);

  // Quick Add Class Form Submit
  const handleQuickAddClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassNameInput.trim()) return;

    handleAddClass({
      name: newClassNameInput.trim(),
      grade: newClassGradeInput,
      room: newClassRoomInput.trim(),
    });

    setNewClassNameInput('');
    setIsQuickAddClassModalOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
        <h2 className="text-lg font-bold">Đang tải dữ liệu 23 lớp học...</h2>
        <p className="text-xs text-slate-400 mt-1">Hệ thống lưu trữ bền vững IndexedDB</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Main Navigation */}
      <Navbar
        settings={settings}
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        onUpdateWeek={handleUpdateWeek}
        onToggleSound={handleToggleSound}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onExportAllExcel={handleExportAllExcel}
        onOpenReportExport={() => setIsReportModalOpen(true)}
        onOpenRandomPicker={() => setIsRandomPickerOpen(true)}
        lastSavedTime={lastSavedTime}
      />

      {/* Class Selector Bar (Available across modes for fast navigation between 23 classes) */}
      <ClassSelectorBar
        classes={classes}
        students={students}
        selectedClassId={settings.selectedClassId}
        onSelectClass={handleSelectClass}
        onOpenAddClass={() => setIsQuickAddClassModalOpen(true)}
        onOpenClassManager={() => setCurrentMode('class-manager')}
        onDeleteClass={handleDeleteClass}
      />

      {/* Main View Mode Content */}
      <main className="flex-1 pb-16">
        {currentMode === 'quick-score' && (
          <QuickScoreView
            currentClass={currentClass}
            students={students}
            settings={settings}
            onScoreChange={handleScoreChange}
            onSetScoreDirect={handleSetScoreDirect}
            lastHistoryLog={history.length > 0 ? history[history.length - 1] : null}
            onUndoLastScore={handleUndoLastScore}
            onAddStudent={handleAddStudent}
            onBatchAddStudents={handleBatchAddStudents}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onImportStudentsSuccess={handleImportStudentsSuccess}
            onOpenReportExport={() => setIsReportModalOpen(true)}
            onClearClassStudents={handleClearClassStudents}
          />
        )}

        {currentMode === 'matrix-35' && (
          <WeekMatrixView
            currentClass={currentClass}
            students={students}
            settings={settings}
            onSetScoreDirect={handleSetScoreDirect}
            onSelectWeek={handleUpdateWeek}
          />
        )}

        {currentMode === 'statistics' && (
          <StatisticsView
            currentClass={currentClass}
            students={students}
            settings={settings}
            onScoreChange={handleScoreChange}
            onOpenPrintCertificate={(student, rank) => {
              setCertificateData({ student, rank });
            }}
          />
        )}

        {currentMode === 'class-manager' && (
          <ClassManagerView
            classes={classes}
            students={students}
            currentClass={currentClass}
            settings={settings}
            onSelectClass={handleSelectClass}
            onAddClass={handleAddClass}
            onUpdateClass={handleUpdateClass}
            onDeleteClass={handleDeleteClass}
            onAddStudent={handleAddStudent}
            onBatchAddStudents={handleBatchAddStudents}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onTransferStudent={handleTransferStudent}
            onAutoReorderSTT={handleAutoReorderSTT}
            onImportStudentsSuccess={handleImportStudentsSuccess}
            onClearClassStudents={handleClearClassStudents}
            onReorderClasses={handleReorderClasses}
          />
        )}
      </main>

      {/* Quick Add Class Modal (Accessible from anywhere) */}
      {isQuickAddClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Tạo Lớp Học Mới</h3>
              <button
                onClick={() => setIsQuickAddClassModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddClassSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tên lớp (ví dụ: 1/1, 2/1, 3/5, 4A, 5B...):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 1/5"
                  value={newClassNameInput}
                  onChange={(e) => setNewClassNameInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Khối lớp:</label>
                <select
                  value={newClassGradeInput}
                  onChange={(e) => setNewClassGradeInput(Number(e.target.value))}
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
                <label className="font-semibold text-slate-700 block mb-1">Phòng học:</label>
                <input
                  type="text"
                  placeholder="Phòng Tin Học..."
                  value={newClassRoomInput}
                  onChange={(e) => setNewClassRoomInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickAddClassModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs"
                >
                  Tạo Lớp & Mở Dạy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Export Center Modal */}
      <ReportExportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        classes={classes}
        students={students}
        currentClass={currentClass}
        settings={settings}
      />

      {/* Random Student Wheel Modal */}
      <RandomPickerModal
        isOpen={isRandomPickerOpen}
        onClose={() => setIsRandomPickerOpen(false)}
        currentClass={currentClass}
        students={students}
        settings={settings}
        onAwardPoint={(studentId, week) => handleScoreChange(studentId, week, 1)}
      />

      {/* Settings & Backup Modal */}
      <SettingsBackupModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onExportAllExcel={handleExportAllExcel}
        onResetDefaultData={handleResetDefaultData}
        classesCount={classes.length}
        studentsCount={students.length}
      />

      {/* Printable Certificate Modal */}
      <PrintCertificateModal
        isOpen={certificateData !== null}
        onClose={() => setCertificateData(null)}
        student={certificateData?.student || null}
        rank={certificateData?.rank || 1}
        className={currentClass.name}
        settings={settings}
      />
    </div>
  );
}

