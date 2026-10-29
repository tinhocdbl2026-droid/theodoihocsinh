import { ClassRoom, Student, AppSettings, ScoreHistoryLog } from '../types';

const DB_NAME = 'TinHoc35TuanDB';
const DB_VERSION = 1;
const LOCALSTORAGE_BACKUP_KEY = 'tinhoc35tuan_backup_data';

export interface AppDatabaseState {
  classes: ClassRoom[];
  students: Student[];
  settings: AppSettings;
  history: ScoreHistoryLog[];
}

const DEFAULT_SETTINGS: AppSettings = {
  schoolName: 'Trường Tiểu Học Chu Văn An',
  schoolYear: '2025 - 2026',
  teacherName: 'Giáo Viên Tin Học',
  subjectName: 'Môn Tin Học',
  soundEnabled: true,
  currentWeek: 6,
  selectedClassId: 'c-1-1',
};

// 23 Classes defined specifically for Primary School Informatics teacher
export const INITIAL_23_CLASSES: ClassRoom[] = [
  // Khối 1 (4 lớp)
  { id: 'c-1-1', name: '1/1', grade: 1, order: 1, room: 'Phòng Tin Học 1' },
  { id: 'c-1-2', name: '1/2', grade: 1, order: 2, room: 'Phòng Tin Học 1' },
  { id: 'c-1-3', name: '1/3', grade: 1, order: 3, room: 'Phòng Tin Học 1' },
  { id: 'c-1-4', name: '1/4', grade: 1, order: 4, room: 'Phòng Tin Học 1' },
  // Khối 2 (4 lớp)
  { id: 'c-2-1', name: '2/1', grade: 2, order: 5, room: 'Phòng Tin Học 1' },
  { id: 'c-2-2', name: '2/2', grade: 2, order: 6, room: 'Phòng Tin Học 1' },
  { id: 'c-2-3', name: '2/3', grade: 2, order: 7, room: 'Phòng Tin Học 1' },
  { id: 'c-2-4', name: '2/4', grade: 2, order: 8, room: 'Phòng Tin Học 1' },
  // Khối 3 (5 lớp)
  { id: 'c-3-1', name: '3/1', grade: 3, order: 9, room: 'Phòng Tin Học 2' },
  { id: 'c-3-2', name: '3/2', grade: 3, order: 10, room: 'Phòng Tin Học 2' },
  { id: 'c-3-3', name: '3/3', grade: 3, order: 11, room: 'Phòng Tin Học 2' },
  { id: 'c-3-4', name: '3/4', grade: 3, order: 12, room: 'Phòng Tin Học 2' },
  { id: 'c-3-5', name: '3/5', grade: 3, order: 13, room: 'Phòng Tin Học 2' },
  // Khối 4 (5 lớp)
  { id: 'c-4-1', name: '4/1', grade: 4, order: 14, room: 'Phòng Tin Học 2' },
  { id: 'c-4-2', name: '4/2', grade: 4, order: 15, room: 'Phòng Tin Học 2' },
  { id: 'c-4-3', name: '4/3', grade: 4, order: 16, room: 'Phòng Tin Học 2' },
  { id: 'c-4-4', name: '4/4', grade: 4, order: 17, room: 'Phòng Tin Học 2' },
  { id: 'c-4-5', name: '4/5', grade: 4, order: 18, room: 'Phòng Tin Học 2' },
  // Khối 5 (5 lớp)
  { id: 'c-5-1', name: '5/1', grade: 5, order: 19, room: 'Phòng Tin Học 2' },
  { id: 'c-5-2', name: '5/2', grade: 5, order: 20, room: 'Phòng Tin Học 2' },
  { id: 'c-5-3', name: '5/3', grade: 5, order: 21, room: 'Phòng Tin Học 2' },
  { id: 'c-5-4', name: '5/4', grade: 5, order: 22, room: 'Phòng Tin Học 2' },
  { id: 'c-5-5', name: '5/5', grade: 5, order: 23, room: 'Phòng Tin Học 2' },
];

const SAMPLE_GENDERS: Student['gender'][] = ['nam','nu','nam','nu','nam','nu','nu','nam','nam','nu','nam','nu','nam','nam','nu','nam','nu','nam','nu','nam','nam','nu','nam','nu','nam','nu','nam','nu','nam','nu','nam','nu','nam','nam','nu'];

const VIETNAMESE_NAMES_SEED = [
  'Nguyễn Văn An', 'Trần Thị Bảo An', 'Lê Hoàng Anh', 'Phạm Minh Châu', 'Hoàng Tuấn Dũng',
  'Đỗ Thùy Dung', 'Bùi Gia Hân', 'Vũ Quốc Huy', 'Đặng Nhật Khang', 'Ngô Khánh Linh',
  'Dương Bảo Nam', 'Lý Phương Nga', 'Trịnh Hạo Nhiên', 'Phan Gia Phát', 'Mai Phương Thảo',
  'Hồ Minh Trí', 'Võ Trúc Quỳnh', 'Đinh Khải Uy', 'Tạ Minh Vy', 'Cao Tiến Đạt',
  'Nguyễn Đình Phong', 'Trần Kim Ngân', 'Lê Thái Sơn', 'Phạm Quỳnh Chi', 'Đỗ Minh Quân',
  'Hoàng Diệu Anh', 'Bùi Đức Trọng', 'Vũ Mai Trang', 'Lê Tuấn Tú', 'Nguyễn Hà Phương',
  'Nguyễn Đức Huy', 'Phạm Lan Anh', 'Trần Nhật Minh', 'Vũ Hải Đăng', 'Lê Cẩm Tú'
];

/**
 * Generate initial mock students for all 23 classes
 */
export function generateInitialStudents(): Student[] {
  const students: Student[] = [];

  INITIAL_23_CLASSES.forEach((cls) => {
    // 30 to 35 students per class
    const studentCount = cls.grade === 1 ? 32 : 30;
    for (let i = 1; i <= studentCount; i++) {
      const nameIndex = (i - 1) % VIETNAMESE_NAMES_SEED.length;
      const baseName = VIETNAMESE_NAMES_SEED[nameIndex];
      // slight variation for different classes
      const fullName = cls.name === '1/1' ? baseName : `${baseName}`;
      
      const scores: Record<number, number> = {};
      for (let w = 1; w <= 35; w++) {
        scores[w] = 0;
      }

      // Seed small sample scores for weeks 1 to 5 to make it look active
      if (cls.id === 'c-1-1' || cls.id === 'c-2-1' || cls.id === 'c-3-1') {
        scores[1] = (i * 3) % 4;
        scores[2] = (i * 7) % 5;
        scores[3] = (i * 5) % 3;
        scores[4] = (i * 2) % 4;
        scores[5] = (i * 4) % 3;
      }

      const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

      students.push({
        id: `stu-${cls.id}-${i}`,
        stt: i,
        fullName,
        classId: cls.id,
        scores,
        totalScore,
        notes: i === 1 ? 'Lớp trưởng' : i === 2 ? 'Lớp phó học tập' : '',
        gender: SAMPLE_GENDERS[nameIndex],
      });
    }
  });

  return students;
}

export class DatabaseService {
  constructor(private databaseName = DB_NAME, private backupKey = LOCALSTORAGE_BACKUP_KEY) {}

  async readExistingState(): Promise<AppDatabaseState | null> {
    try {
      const databases = await indexedDB.databases();
      if (!databases.some(database => database.name === this.databaseName)) return null;
      const db = await this.openDB();
      const classes = await this.getAllFromStore<ClassRoom>(db, 'classes');
      const students = await this.getAllFromStore<Student>(db, 'students');
      const settingsRecords = await this.getAllFromStore<{key: string; value: AppSettings}>(db, 'settings');
      const history = await this.getAllFromStore<ScoreHistoryLog>(db, 'history');
      const saved = settingsRecords.find(record => record.key === 'app_settings');
      if (!saved || !classes.length) return null;
      return { classes: classes.sort((a,b) => a.order-b.order), students: students.sort((a,b) => a.stt-b.stt), settings: saved.value, history };
    } catch { return null; }
  }

  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported'));
        return;
      }

      const request = indexedDB.open(this.databaseName, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('classes')) {
          db.createObjectStore('classes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('students')) {
          const studentStore = db.createObjectStore('students', { keyPath: 'id' });
          studentStore.createIndex('classId', 'classId', { unique: false });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Load entire state from IndexedDB (fallback to localStorage or seed)
   */
  async loadState(): Promise<AppDatabaseState> {
    try {
      const db = await this.openDB();

      const classes = await this.getAllFromStore<ClassRoom>(db, 'classes');
      const students = await this.getAllFromStore<Student>(db, 'students');
      const settingsRecords = await this.getAllFromStore<{ key: string; value: AppSettings }>(db, 'settings');
      const history = await this.getAllFromStore<ScoreHistoryLog>(db, 'history');

      let settings: AppSettings = DEFAULT_SETTINGS;
      const savedSetting = settingsRecords.find((r) => r.key === 'app_settings');
      if (savedSetting) {
        settings = savedSetting.value;
      }

      if (classes.length > 0 && students.length > 0) {
        // Sort classes by order
        classes.sort((a, b) => a.order - b.order);
        students.sort((a, b) => a.stt - b.stt);
        const fixedStudents = students.map(s => {
          const match = /^stu-c-[1-5]-[1-5]-(\d+)$/.exec(s.id);
          const index = match ? Number(match[1]) - 1 : -1;
          return index >= 0 && s.fullName === VIETNAMESE_NAMES_SEED[index] && s.gender === (index % 2 === 1 ? 'nu' : 'nam') && !localStorage.getItem(this.backupKey + '_sample_gender_v2') ? {...s, gender:SAMPLE_GENDERS[index]} : s;
        });
        const state: AppDatabaseState = { classes, students: fixedStudents, settings, history };
        if (!localStorage.getItem(this.backupKey + '_sample_gender_v2')) { await this.saveAll(state); localStorage.setItem(this.backupKey + '_sample_gender_v2','1'); }
        this.backupToLocalStorage(state);
        return state;
      }
    } catch {
      // IndexedDB failed or empty, check localstorage fallback
    }

    // Try localStorage backup
    try {
      const backupJson = localStorage.getItem(this.backupKey);
      if (backupJson) {
        const parsed = JSON.parse(backupJson) as AppDatabaseState;
        if (parsed.classes && parsed.classes.length > 0 && parsed.students && parsed.students.length > 0) {
          // Re-populate IndexedDB in background
          this.saveAll(parsed).catch(() => {});
          return parsed;
        }
      }
    } catch {
      // Ignore
    }

    // Initialize fresh default data with all 23 classes
    const initialClasses = INITIAL_23_CLASSES;
    const initialStudents = generateInitialStudents();
    const initialState: AppDatabaseState = {
      classes: initialClasses,
      students: initialStudents,
      settings: DEFAULT_SETTINGS,
      history: [],
    };

    await this.saveAll(initialState);
    return initialState;
  }

  /**
   * Save all data to IndexedDB and mirror in localStorage
   */
  async saveAll(state: AppDatabaseState): Promise<void> {
    this.backupToLocalStorage(state);

    try {
      const db = await this.openDB();
      const tx = db.transaction(['classes', 'students', 'settings', 'history'], 'readwrite');

      // Clear & set classes
      const classStore = tx.objectStore('classes');
      classStore.clear();
      state.classes.forEach((c) => classStore.put(c));

      // Clear & set students
      const studentStore = tx.objectStore('students');
      studentStore.clear();
      state.students.forEach((s) => studentStore.put(s));

      // Set settings
      const settingsStore = tx.objectStore('settings');
      settingsStore.put({ key: 'app_settings', value: state.settings });

      // Keep recent 200 history logs
      const historyStore = tx.objectStore('history');
      historyStore.clear();
      state.history.slice(-200).forEach((h) => historyStore.put(h));

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // localStorage backup already recorded
    }
  }

  /**
   * Fast micro-update: Update a single student's score without rewriting all data
   */
  async updateStudentScore(student: Student, historyItem?: ScoreHistoryLog): Promise<void> {
    try {
      const db = await this.openDB();
      const stores = historyItem ? ['students', 'history'] : ['students'];
      const tx = db.transaction(stores, 'readwrite');

      tx.objectStore('students').put(student);
      if (historyItem) {
        tx.objectStore('history').put(historyItem);
      }

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Fallback
    }
  }

  /**
   * Update student record
   */
  async saveStudent(student: Student): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction('students', 'readwrite');
      tx.objectStore('students').put(student);
    } catch {
      // Fallback
    }
  }

  /**
   * Delete student
   */
  async deleteStudent(studentId: string): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction('students', 'readwrite');
      tx.objectStore('students').delete(studentId);
    } catch {
      // Fallback
    }
  }

  /**
   * Save class
   */
  async saveClass(cls: ClassRoom): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction('classes', 'readwrite');
      tx.objectStore('classes').put(cls);
    } catch {
      // Fallback
    }
  }

  /**
   * Delete class and its students
   */
  async deleteClass(classId: string): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(['classes', 'students'], 'readwrite');
      tx.objectStore('classes').delete(classId);

      const studentStore = tx.objectStore('students');
      const req = studentStore.openCursor();
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          if (cursor.value.classId === classId) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    } catch {
      // Fallback
    }
  }

  /**
   * Save settings
   */
  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction('settings', 'readwrite');
      tx.objectStore('settings').put({ key: 'app_settings', value: settings });
    } catch {
      // Fallback
    }
  }

  private backupToLocalStorage(state: AppDatabaseState) {
    try {
      localStorage.setItem(this.backupKey, JSON.stringify(state));
    } catch {
      // In case quota exceeded, keep working without crashing
    }
  }

  private getAllFromStore<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }
}

export const dbService = new DatabaseService();

const accountDatabases = new Map<string, DatabaseService>();
export function getAccountDatabase(uid: string): DatabaseService {
  if (!uid) throw new Error('Cần đăng nhập trước khi truy cập dữ liệu.');
  const key = encodeURIComponent(uid);
  if (!accountDatabases.has(key)) accountDatabases.set(key, new DatabaseService(`${DB_NAME}_account_${key}`, `student_account_backup_${key}`));
  return accountDatabases.get(key)!;
}

export function getEmptyDatabase(): AppDatabaseState {
  return { classes: INITIAL_23_CLASSES.map(cls => ({...cls})), students: [], settings: {...DEFAULT_SETTINGS}, history: [] };
}
