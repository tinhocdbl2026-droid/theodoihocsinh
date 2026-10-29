import type { AppDatabaseState as AppDatabase } from '../services/db';

export const LEGACY_KEY = 'tinhoc35tuan_backup_data';
export type CloudCopy = { db: AppDatabase; revision: number };
export const cacheKey = (uid: string) => `STUDENT_GOOGLE_V1_${uid}`;

export function validDatabase(value: unknown): value is AppDatabase {
  const db = value as AppDatabase;
  return !!db && !!db.settings && typeof db.settings.schoolName === 'string' &&
    Array.isArray(db.classes) && db.classes.every(c => typeof c.id === 'string' && typeof c.name === 'string') &&
    Array.isArray(db.students) && db.students.every(s => typeof s.id === 'string' && typeof s.classId === 'string' && typeof s.fullName === 'string' && !!s.scores && typeof s.scores === 'object') &&
    Array.isArray(db.history);
}

export function readLegacy(): AppDatabase | null {
  try { const db = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null'); return validDatabase(db) ? db : null; }
  catch { return null; }
}

export function downloadBackup(db: AppDatabase) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `hoc-sinh-sao-luu-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Bounded chunks keep each document well below Firestore's 1 MiB limit,
// including Vietnamese text. One transaction publishes all chunks atomically.
export function encodeDatabase(db: AppDatabase): string[] {
  if (!validDatabase(db)) throw new Error('Dữ liệu học sinh không hợp lệ.');
  const json = JSON.stringify(db);
  if (new TextEncoder().encode(json).length > 6_000_000) {
    throw new Error('Dữ liệu vượt 6 MB. Hãy xuất bản sao lưu và lưu trữ bớt nhật ký cũ trước khi đồng bộ.');
  }
  const parts: string[] = [];
  for (let start = 0; start < json.length;) {
    let end = Math.min(start + 24000, json.length);
    const last = json.charCodeAt(end - 1);
    if (end < json.length && last >= 0xD800 && last <= 0xDBFF) end--;
    parts.push(json.slice(start, end));
    start = end;
  }
  return parts;
}

export function decodeDatabase(parts: string[]): AppDatabase {
  const db: unknown = JSON.parse(parts.join(''));
  if (!validDatabase(db)) throw new Error('Bản lưu trên tài khoản chưa đúng định dạng.');
  return db;
}
