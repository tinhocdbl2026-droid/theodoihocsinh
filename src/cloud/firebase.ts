import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { decodeDatabase, encodeDatabase, type CloudCopy } from './database';
import type { AppDatabaseState as AppDatabase } from '../services/db';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: 'theodoihocsinh-ced29.firebaseapp.com',
  projectId: 'theodoihocsinh-ced29',
  appId: '1:1060359981486:web:8de288c9d1140c207ea03f',
});
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
const firestore = getFirestore(app, 'ai-studio-ngnhngkimtraai-08038e21-4822-46d4-92ef-26e72b0351e7');
const root = (uid: string) => doc(firestore, 'studentAccounts', uid, 'state', 'main');
const part = (uid: string, index: number) => doc(firestore, 'studentAccounts', uid, 'chunks', String(index));

export async function loadCloud(uid: string): Promise<CloudCopy | null> {
  return runTransaction(firestore, async transaction => {
    const head = await transaction.get(root(uid));
    if (!head.exists()) {
      // Read an existing private snapshot from the previous release.
      // Keep it intact; the first new save creates the chunked account copy.
      const previous = await transaction.get(doc(firestore, 'studentTracker', uid));
      if (!previous.exists()) return null;
      const payload = previous.data().payload;
      if (typeof payload !== 'string') throw new Error('Bản lưu cũ chưa đúng định dạng.');
      return { db: decodeDatabase([payload]), revision: 0 };
    }
    const { revision, count } = head.data();
    if (!Number.isInteger(revision) || !Number.isInteger(count) || count < 1 || count > 250) {
      throw new Error('Thông tin bản lưu trên tài khoản không hợp lệ.');
    }
    const parts = await Promise.all(Array.from({ length: count }, (_, i) => transaction.get(part(uid, i))));
    return {
      revision,
      db: decodeDatabase(parts.map(snapshot => {
        const value = snapshot.data();
        if (!value || value.revision !== revision || typeof value.text !== 'string') {
          throw new Error('Bản lưu chưa đầy đủ. Vui lòng tải lại dữ liệu.');
        }
        return value.text;
      })),
    };
  });
}

export async function saveCloud(uid: string, db: AppDatabase, expectedRevision: number): Promise<number> {
  const parts = encodeDatabase(db);
  return runTransaction(firestore, async transaction => {
    const head = await transaction.get(root(uid));
    const current = head.exists() ? head.data().revision : 0;
    if (current !== expectedRevision) throw new Error('CLOUD_CONFLICT');
    const revision = current + 1;
    parts.forEach((text, i) => transaction.set(part(uid, i), { revision, text }));
    transaction.set(root(uid), { revision, count: parts.length, updatedAt: serverTimestamp() });
    return revision;
  });
}
