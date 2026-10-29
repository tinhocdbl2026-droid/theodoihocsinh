export interface Student {
  id: string;
  stt: number;
  fullName: string;
  classId: string;
  scores: Record<number, number>; // week 1..35 -> points
  totalScore: number;
  notes?: string;
  gender?: 'nam' | 'nu' | '';
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "1/1", "1/2", "2/1", etc.
  grade: number; // 1, 2, 3, 4, 5
  room?: string;
  notes?: string;
  order: number;
}

export interface AppSettings {
  schoolName: string;
  schoolYear: string;
  teacherName: string;
  subjectName: string;
  soundEnabled: boolean;
  currentWeek: number; // 1..35
  selectedClassId: string;
}

export interface ScoreHistoryLog {
  id: string;
  timestamp: number;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  week: number;
  delta: number;
  newScore: number;
  newTotal: number;
}

export type ViewMode = 'quick-score' | 'matrix-35' | 'statistics' | 'class-manager' | 'random-picker';

export type SemesterFilter = 'all' | 'sem1' | 'sem2';
