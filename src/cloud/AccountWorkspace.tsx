import React, { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { Cloud, LogIn, LogOut, Monitor, RefreshCw, Download } from 'lucide-react';
import { auth, googleProvider, loadCloud, saveCloud } from './firebase';
import { cacheKey, downloadBackup, readLegacy, validDatabase, type CloudCopy } from './database';
import { getEmptyDatabase, dbService as legacyDatabase } from '../services/db';
import type { AppDatabaseState as AppDatabase } from '../services/db';

type Cache = CloudCopy & { pending: boolean };
type Props = { children: (db: AppDatabase, changed: (db: AppDatabase) => void, uid: string) => React.ReactNode };
const button = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer';
const primary = `${button} !bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700`;
const LEGACY_OWNER_KEY = 'STUDENT_LEGACY_OWNER_V1';

function errorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === 'auth/popup-closed-by-user') return 'Cửa sổ đăng nhập đã đóng. Bạn có thể đăng nhập lại.';
  if (code === 'auth/popup-blocked') return 'Trình duyệt đang chặn cửa sổ đăng nhập. Hãy cho phép cửa sổ bật lên của trang này.';
  if (code === 'auth/unauthorized-domain') return 'Tên miền này chưa được cho phép đăng nhập Google.';
  if (code === 'auth/operation-not-allowed') return 'Đăng nhập Google chưa được bật trên Firebase.';
  if (code === 'permission-denied') return 'Tài khoản chưa được phép đọc hoặc lưu dữ liệu. Hãy đăng nhập lại.';
  if (!navigator.onLine || code === 'unavailable') return 'Chưa kết nối được máy chủ. Bản trên máy vẫn được giữ; hãy kết nối mạng rồi thử lại.';
  return error instanceof Error ? error.message : 'Chưa thực hiện được. Vui lòng thử lại.';
}

export function AccountWorkspace({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [seed, setSeed] = useState<AppDatabase | null>(null);
  const [generation, setGeneration] = useState(0);
  const [chooseInitial, setChooseInitial] = useState(false);
  const [recovery, setRecovery] = useState<{ cloud: CloudCopy | null; cache: Cache } | null>(null);
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);
  const [busy, setBusy] = useState(false);
  const latest = useRef<AppDatabase | null>(null);
  const currentUser = useRef<User | null>(null);
  const revision = useRef(0);
  const savedJson = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const conflicted = useRef(false);
  const [legacySource, setLegacySource] = useState<AppDatabase | null>(() => readLegacy());
  const legacyRef = useRef(legacySource);
  const [legacyOwner, setLegacyOwner] = useState(() => localStorage.getItem(LEGACY_OWNER_KEY));
  const legacy = user && (!legacyOwner || legacyOwner === user.uid) ? legacySource : null;
  useEffect(() => { let active = true; legacyDatabase.readExistingState().then(data => { if (active && data) { legacyRef.current = data; setLegacySource(data); } }).catch(() => {}); return () => { active = false; }; }, []);
  const claimLegacy = useCallback(() => {
    const uid = currentUser.current?.uid;
    const owner = localStorage.getItem(LEGACY_OWNER_KEY);
    if (!uid || (owner && owner !== uid)) throw new Error('Dữ liệu phiên bản cũ đã thuộc một tài khoản khác.');
    localStorage.setItem(LEGACY_OWNER_KEY, uid);
    setLegacyOwner(uid);
  }, []);

  const cache = useCallback((db: AppDatabase, pending: boolean) => {
    const uid = currentUser.current?.uid;
    if (!uid) return;
    localStorage.setItem(cacheKey(uid), JSON.stringify({ db, revision: revision.current, pending } satisfies Cache));
  }, []);

  const flush = useCallback(async (): Promise<boolean> => {
    if (inFlight.current) return inFlight.current;
    const owner = currentUser.current;
    if (!owner || !latest.current || conflicted.current) return false;
    const task = (async () => {
      setBusy(true);
      try {
        while (currentUser.current?.uid === owner.uid && latest.current && JSON.stringify(latest.current) !== savedJson.current) {
          const data = latest.current;
          const json = JSON.stringify(data);
          setMessage('Đang lưu lên tài khoản Google…');
          const next = await saveCloud(owner.uid, data, revision.current);
          if (currentUser.current?.uid !== owner.uid) return false;
          revision.current = next;
          savedJson.current = json;
          cache(latest.current, JSON.stringify(latest.current) !== json);
        }
        setHasError(false);
        setMessage('Đã lưu trên tài khoản Google');
        return true;
      } catch (error) {
        const conflict = error instanceof Error && error.message === 'CLOUD_CONFLICT';
        conflicted.current = conflict;
        setHasError(true);
        setMessage(conflict
          ? 'Có thay đổi từ máy khác. Bản trên máy này vẫn được giữ. Hãy tải bản sao lưu rồi bấm “Tải từ tài khoản” để đối chiếu.'
          : errorMessage(error));
        return false;
      } finally { setBusy(false); }
    })();
    inFlight.current = task;
    try { return await task; } finally { inFlight.current = null; }
  }, [cache]);

  const changed = useCallback((db: AppDatabase) => {
    latest.current = db;
    const pending = JSON.stringify(db) !== savedJson.current;
    try { cache(db, pending); }
    catch { setHasError(true); setMessage('Bộ nhớ trên máy đã đầy. Hãy tải bản sao lưu và kiểm tra trạng thái lưu trên tài khoản.'); }
    clearTimeout(timer.current);
    if (pending && !conflicted.current) {
      setMessage('Có thay đổi đang chờ lưu…');
      timer.current = setTimeout(() => void flush(), 1200);
    }
  }, [cache, flush]);

  const openCopy = useCallback((db: AppDatabase, cloudRevision: number, cloudJson: string) => {
    if (legacyRef.current && JSON.stringify(legacyRef.current) === JSON.stringify(db) && !localStorage.getItem(LEGACY_OWNER_KEY)) {
      try { claimLegacy(); } catch { /* retain unclaimed local backup if storage is unavailable */ }
    }
    revision.current = cloudRevision;
    savedJson.current = cloudJson;
    latest.current = db;
    conflicted.current = false;
    setHasError(false);
    setChooseInitial(false);
    setRecovery(null);
    setSeed(db);
    setGeneration(n => n + 1);
    setMessage(cloudJson === JSON.stringify(db) ? 'Đã tải dữ liệu từ tài khoản Google' : 'Đang chuyển dữ liệu lên tài khoản…');
  }, [claimLegacy]);

  const load = useCallback(async (owner: User) => {
    clearTimeout(timer.current);
    setLoading(true); setHasError(false); setMessage('Đang tải dữ liệu tài khoản…');
    try {
      const remote = await loadCloud(owner.uid);
      if (currentUser.current?.uid !== owner.uid) return;
      let local: Cache | null = null;
      try {
        const stored = JSON.parse(localStorage.getItem(cacheKey(owner.uid)) || 'null');
        if (stored && validDatabase(stored.db) && Number.isInteger(stored.revision)) local = stored;
      } catch { /* preserve the original cache if it cannot be read */ }
      if (local?.pending && JSON.stringify(local.db) !== JSON.stringify(remote?.db)) {
        if (local.revision === (remote?.revision || 0)) {
          openCopy(local.db, remote?.revision || 0, remote ? JSON.stringify(remote.db) : '');
        } else { setSeed(null); setRecovery({ cloud: remote, cache: local }); }
      } else if (remote) {
        openCopy(remote.db, remote.revision, JSON.stringify(remote.db));
      } else { setSeed(null); setChooseInitial(true); }
    } catch (error) { setHasError(true); setMessage(errorMessage(error)); }
    finally { if (currentUser.current?.uid === owner.uid) setLoading(false); }
  }, [openCopy]);

  useEffect(() => onAuthStateChanged(auth, owner => {
    clearTimeout(timer.current);
    currentUser.current = owner;
    latest.current = null;
    setUser(owner); setSeed(null); setRecovery(null); setChooseInitial(false); setChecking(false);
    if (owner) void load(owner);
  }, error => { setChecking(false); setHasError(true); setMessage(errorMessage(error)); }), [load]);

  useEffect(() => {
    const online = () => { if (latest.current) void flush(); };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (latest.current && JSON.stringify(latest.current) !== savedJson.current) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('online', online);
    window.addEventListener('beforeunload', beforeUnload);
    return () => { clearTimeout(timer.current); window.removeEventListener('online', online); window.removeEventListener('beforeunload', beforeUnload); };
  }, [flush]);

  const login = async () => {
    setBusy(true); setHasError(false); setMessage('');
    try { await signInWithPopup(auth, googleProvider); }
    catch (error) { setHasError(true); setMessage(errorMessage(error)); }
    finally { setBusy(false); }
  };
  const logout = async () => {
    clearTimeout(timer.current);
    if (latest.current && JSON.stringify(latest.current) !== savedJson.current && !(await flush())) return;
    try { await signOut(auth); } catch (error) { setHasError(true); setMessage(errorMessage(error)); }
  };
  const reloadCloud = async () => {
    if (!user || busy) return;
    clearTimeout(timer.current);
    if (latest.current && JSON.stringify(latest.current) !== savedJson.current) {
      if (!window.confirm('Máy này có thay đổi chưa đồng bộ. Tải bản sao lưu rồi lấy bản trên tài khoản?')) {
        if (!conflicted.current) timer.current = setTimeout(() => void flush(), 1200);
        return;
      }
      downloadBackup(latest.current);
      // Preserve the draft independently before choosing the server copy.
      try { localStorage.setItem(`${cacheKey(user.uid)}_backup`, JSON.stringify(latest.current)); }
      catch { setMessage('Chưa giữ được bản nháp trên máy. Hãy lưu tệp sao lưu trước khi tải lại.'); return; }
    }
    try {
      setLoading(true);
      const remote = await loadCloud(user.uid);
      if (!remote) throw new Error('Tài khoản chưa có bản lưu để tải.');
      openCopy(remote.db, remote.revision, JSON.stringify(remote.db));
    } catch (error) { setHasError(true); setMessage(errorMessage(error)); }
    finally { setLoading(false); }
  };
  const transferLegacy = () => {
    if (!legacy || !user || busy || loading || !latest.current) return;
    if (!window.confirm(`Chuyển dữ liệu phiên bản cũ trên trình duyệt này (${legacy.students.length} học sinh, ${legacy.classes.length} lớp) lên tài khoản ${user.email}? Bản hiện tại sẽ được tải xuống để sao lưu trước khi thay thế. Dữ liệu không được gộp tự động.`)) return;
    clearTimeout(timer.current);
    downloadBackup(latest.current);
    try { localStorage.setItem(`${cacheKey(user.uid)}_backup`, JSON.stringify(latest.current)); }
    catch { setHasError(true); setMessage('Chưa giữ được bản hiện tại trên máy. Hãy kiểm tra tệp sao lưu trước khi chuyển dữ liệu.'); return; }
    try { claimLegacy(); } catch (error) { setHasError(true); setMessage(errorMessage(error)); return; }
    openCopy(legacy, revision.current, savedJson.current);
  };

  if (checking) return <Screen><p>Đang kiểm tra đăng nhập…</p></Screen>;
  if (!user) return <Screen>
    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white"><Monitor size={30} /></div>
    <h1 className="text-2xl font-bold text-slate-900">Theo dõi học sinh 35 tuần</h1>
    <p className="mt-3 mb-6 leading-relaxed text-slate-600">Đăng nhập bằng Google để lưu cấu hình, lớp học, danh sách học sinh, điểm 35 tuần và báo cáo. Dùng cùng tài khoản trên máy khác để tiếp tục với dữ liệu đã lưu.</p>
    <button onClick={login} disabled={busy} className={`${primary} w-full`}><LogIn size={18} />{busy ? 'Đang đăng nhập…' : 'Đăng nhập bằng Google'}</button>
    {legacySource && <p className="mt-5 text-sm text-slate-600">Trình duyệt này có dữ liệu phiên bản cũ. Hãy đăng nhập tài khoản đã dùng để tiếp tục.</p>}
    {message && <p role="alert" className="mt-4 text-sm text-rose-700">{message}</p>}
  </Screen>;

  if (!seed) return <Screen>
    <h1 className="text-xl font-bold">Dữ liệu học sinh của bạn</h1>
    <p className="my-3 text-sm text-slate-600 break-all">{user.email}</p>
    {loading ? <p>Đang tải dữ liệu…</p> : recovery ? <>
      <p className="my-4 text-sm">Có bản trên máy chưa đồng bộ và bản trên tài khoản đã thay đổi. Hãy giữ bản sao lưu trước khi tiếp tục.</p>
      <button className={button} onClick={() => downloadBackup(recovery.cache.db)}>Tải bản chưa đồng bộ</button>
      {recovery.cloud && <button className={`${primary} mt-3`} onClick={() => {
        try { localStorage.setItem(`${cacheKey(user.uid)}_backup`, JSON.stringify(recovery.cache.db)); }
        catch { setMessage('Hãy tải bản sao lưu trước; bộ nhớ trình duyệt đã đầy.'); return; }
        openCopy(recovery.cloud!.db, recovery.cloud!.revision, JSON.stringify(recovery.cloud!.db));
      }}>Dùng bản trên tài khoản</button>}
    </> : chooseInitial ? <>
      <p className="my-4 text-sm text-slate-600">Tài khoản chưa có dữ liệu học sinh. Chọn dữ liệu để lưu lần đầu.</p>
      {legacy && <button className={`${primary} w-full mb-3`} onClick={() => openCopy(legacy, 0, '')}>Chuyển dữ liệu trên máy này lên tài khoản</button>}
      <button className={`${button} w-full`} onClick={() => openCopy(getEmptyDatabase(), 0, '')}>Tạo dữ liệu học sinh mới</button>
    </> : <button className={button} onClick={() => void load(user)}>Thử tải lại dữ liệu</button>}
    {hasError && <p role="alert" className="mt-4 text-sm text-rose-700">{message}</p>}
    <button className={`${button} mt-5`} onClick={logout}>Đăng xuất</button>
  </Screen>;

  return <div className="flex flex-col h-screen w-full overflow-hidden">
    <div className="no-print shrink-0 border-b border-blue-100 bg-blue-50 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div className="min-w-0"><div className="font-semibold text-blue-950 flex items-center gap-2"><Cloud size={15} /><span className="break-all">{user.email}</span></div><div role="status" className={`mt-1 max-w-2xl ${hasError ? 'text-rose-700' : 'text-blue-800'}`}>{message}</div></div>
      <div className="flex flex-wrap gap-2">
        {hasError && !conflicted.current && <button className={button} disabled={busy} onClick={() => void flush()}>Thử lưu lại</button>}
        <button className={button} disabled={busy || loading} onClick={reloadCloud}><RefreshCw size={14} />Tải từ tài khoản</button>
        <button className={button} onClick={() => latest.current && downloadBackup(latest.current)} title="Tải bản sao lưu dữ liệu hiện tại"><Download size={14} />Sao lưu</button>
        {legacy && <button className={button} onClick={() => downloadBackup(legacy)} title="Giữ nguyên dữ liệu của phiên bản cũ">Sao lưu dữ liệu cũ</button>}
        {legacy && JSON.stringify(legacy) !== savedJson.current && <button className={button} disabled={busy || loading} onClick={transferLegacy}>Chuyển dữ liệu cũ lên tài khoản</button>}
        <button className={button} disabled={busy} onClick={logout}><LogOut size={14} />Đăng xuất</button>
      </div>
    </div>
    <div key={`${user.uid}-${generation}`} className={`flex-1 min-h-0 overflow-auto ${loading ? 'pointer-events-none opacity-50' : ''}`}>
      {children(seed, changed, user.uid)}
    </div>
  </div>;
}

function Screen({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-slate-100 flex items-center justify-center p-5 font-sans"><section className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-8 shadow-xl text-center">{children}</section></main>;
}
