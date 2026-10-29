// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getEmptyDatabase, dbService as legacyDatabase, getAccountDatabase } from '../services/db';
import 'fake-indexeddb/auto';
import { cacheKey, LEGACY_KEY, encodeDatabase, decodeDatabase } from './database';

const mocks = vi.hoisted(() => ({
  user: null as any, listener: null as any,
  load: vi.fn(), save: vi.fn(), login: vi.fn(), logout: vi.fn(),
}));
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, callback: any) => {
    mocks.listener = callback;
    queueMicrotask(() => callback(mocks.user));
    return () => {};
  },
  signInWithPopup: mocks.login, signOut: mocks.logout,
}));
vi.mock('./firebase', () => ({ auth: {}, googleProvider: {}, loadCloud: mocks.load, saveCloud: mocks.save }));
import { AccountWorkspace } from './AccountWorkspace';


const owner = { uid: 'owner-1', email: 'owner@example.test' };
function mount() {
  return render(<AccountWorkspace>{(db, changed) => <Probe initial={db} changed={changed} />}</AccountWorkspace>);
}
function Probe({initial, changed}: {initial: ReturnType<typeof getEmptyDatabase>; changed: (db: ReturnType<typeof getEmptyDatabase>) => void}) {
  const [db, setDb] = React.useState(initial);
  React.useEffect(() => changed(db), [db, changed]);
  return <><p data-testid="school">{db.settings.schoolName}</p><button onClick={() => setDb({...db, settings:{...db.settings, schoolName:'Cấu hình đã sửa'}})}>Sửa cấu hình</button></>;
}
beforeEach(() => {
  localStorage.clear(); mocks.user = owner;
  vi.clearAllMocks();
  vi.spyOn(legacyDatabase, 'readExistingState').mockResolvedValue(null);
  mocks.load.mockResolvedValue({ db: getEmptyDatabase(), revision: 1 });
  mocks.save.mockResolvedValue(2);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('đăng nhập và dữ liệu theo tài khoản', () => {
  it('chưa đăng nhập: giữ nguyên dữ liệu cũ và không ghi lên cloud', async () => {
    mocks.user = null;
    const legacy = JSON.stringify(getEmptyDatabase());
    localStorage.setItem(LEGACY_KEY, legacy);
    mount();
    await screen.findByRole('button', { name: 'Đăng nhập bằng Google' });
    expect(screen.queryByTestId('school')).toBeNull();
    expect(mocks.save).not.toHaveBeenCalled();
    expect(localStorage.getItem(LEGACY_KEY)).toBe(legacy);
  });

  it('tài khoản mới: chỉ chuyển dữ liệu cũ sau khi chọn chuyển', async () => {
    mocks.load.mockResolvedValue(null);
    const data = getEmptyDatabase(); data.settings.schoolName = 'Trường đã cấu hình';
    localStorage.setItem(LEGACY_KEY, JSON.stringify(data));
    mount();
    const migrate = await screen.findByRole('button', { name: 'Chuyển dữ liệu trên máy này lên tài khoản' });
    expect(mocks.save).not.toHaveBeenCalled();
    fireEvent.click(migrate);
    expect(await screen.findByTestId('school')).toHaveProperty('textContent', 'Trường đã cấu hình');
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith(owner.uid, data, 0), { timeout: 4000 });
    expect(localStorage.getItem(LEGACY_KEY)).toBe(JSON.stringify(data));
  });

  it('mở ở máy khác: tải cấu hình từ cloud, không dùng dữ liệu cũ của máy', async () => {
    const old = getEmptyDatabase(); old.settings.schoolName = 'Dữ liệu máy cũ';
    localStorage.setItem(LEGACY_KEY, JSON.stringify(old));
    const remote = getEmptyDatabase(); remote.settings.schoolName = 'Dữ liệu đúng trên Google';
    mocks.load.mockResolvedValue({ db: remote, revision: 9 });
    mount();
    expect(await screen.findByTestId('school')).toHaveProperty('textContent', 'Dữ liệu đúng trên Google');
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('đổi tài khoản: không để lộ hoặc lưu dữ liệu của tài khoản trước', async () => {
    mount(); await screen.findByTestId('school');
    const next = getEmptyDatabase(); next.settings.schoolName = 'Trường của tài khoản hai';
    mocks.load.mockResolvedValue({ db: next, revision: 4 });
    await act(async () => mocks.listener({ uid: 'owner-2', email: 'second@example.test' }));
    await waitFor(() => expect(screen.getByTestId('school').textContent).toBe('Trường của tài khoản hai'));
    expect(mocks.load).toHaveBeenLastCalledWith('owner-2');
    expect(mocks.save).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(cacheKey('owner-2'))!).db.settings.schoolName).toBe('Trường của tài khoản hai');
  });

  it('lưu thay đổi rồi mở phiên mới vẫn nhận được cấu hình đã sửa', async () => {
    const first = mount(); await screen.findByTestId('school');
    fireEvent.click(screen.getByText('Sửa cấu hình'));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1), { timeout: 4000 });
    const saved = mocks.save.mock.calls[0][1];
    first.unmount(); localStorage.clear();
    mocks.load.mockResolvedValue({ db: saved, revision: 2 });
    mount();
    expect(await screen.findByTestId('school')).toHaveProperty('textContent', 'Cấu hình đã sửa');
  });

  it('xung đột từ máy khác: giữ bản nháp và không tự ghi đè', async () => {
    mocks.save.mockRejectedValue(new Error('CLOUD_CONFLICT'));
    mount(); await screen.findByTestId('school');
    fireEvent.click(screen.getByText('Sửa cấu hình'));
    await screen.findByText(/Có thay đổi từ máy khác/, {}, { timeout: 4000 });
    const cached = JSON.parse(localStorage.getItem(cacheKey(owner.uid))!);
    expect(cached.pending).toBe(true);
    expect(cached.db.settings.schoolName).toBe('Cấu hình đã sửa');
    fireEvent.click(screen.getByText('Đăng xuất'));
    expect(mocks.logout).not.toHaveBeenCalled();
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });

  it('bản nháp cũ và cloud khác phiên bản: yêu cầu đối chiếu trước khi mở', async () => {
    const draft = getEmptyDatabase(); draft.settings.schoolName = 'Bản nháp cần giữ';
    localStorage.setItem(cacheKey(owner.uid), JSON.stringify({ db: draft, pending: true, revision: 0 }));
    mount(); await screen.findByText('Tải bản chưa đồng bộ');
    expect(screen.queryByTestId('school')).toBeNull();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('không cho tài khoản khác chuyển hoặc xuất dữ liệu cũ đã thuộc chủ cũ', async () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(getEmptyDatabase()));
    localStorage.setItem('STUDENT_LEGACY_OWNER_V1', 'different-owner');
    mocks.load.mockResolvedValue(null);
    mount();
    await screen.findByRole('button', { name: 'Tạo dữ liệu học sinh mới' });
    expect(screen.queryByRole('button', {name: /Chuyển dữ liệu trên máy/})).toBeNull();
    expect(screen.queryByRole('button', {name: /Sao lưu dữ liệu cũ/})).toBeNull();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('khách chưa đăng nhập không có nút tải dữ liệu học sinh cũ', async () => {
    mocks.user = null;
    localStorage.setItem(LEGACY_KEY, JSON.stringify(getEmptyDatabase()));
    mount();
    await screen.findByRole('button', { name: 'Đăng nhập bằng Google' });
    expect(screen.queryByRole('button', {name: /Sao lưu dữ liệu cũ/})).toBeNull();
  });
});

describe('dữ liệu lớn và Unicode', () => {
  it('khôi phục nguyên vẹn dữ liệu tiếng Việt, emoji ở ranh giới nhiều mảnh', () => {
    const db = getEmptyDatabase();
    db.settings.schoolName = 'Trường 🏫 Tiểu học – cấu hình máy '.repeat(8000);
    const parts = encodeDatabase(db);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every(part => !/[\uD800-\uDBFF]$/.test(part))).toBe(true);
    expect(decodeDatabase(parts)).toEqual(db);
  });
});

describe('bộ nhớ IndexedDB tách theo tài khoản', () => {
  it('tài khoản B không đọc được cấu hình và học sinh của tài khoản A', async () => {
    const first = getEmptyDatabase();
    first.settings.schoolName = 'Trường của A';
    first.students = [{id:'test-student',stt:1,fullName:'Học sinh thử nghiệm',classId:first.classes[0].id,scores:{1:3},totalScore:3}];
    const second = getEmptyDatabase(); second.settings.schoolName = 'Trường của B';
    const a = getAccountDatabase('storage-test-A');
    const b = getAccountDatabase('storage-test-B');
    await a.saveAll(first);
    expect(await b.readExistingState()).toBeNull();
    await b.saveAll(second);
    expect((await a.readExistingState())?.students.length).toBe(1);
    expect((await b.readExistingState())?.students.length).toBe(0);
    expect((await b.readExistingState())?.settings.schoolName).toBe('Trường của B');
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
  });

  it('danh sách học sinh rỗng được giữ khi đóng và mở lại dữ liệu tài khoản', async () => {
    const service = getAccountDatabase('storage-test-empty');
    const db = getEmptyDatabase();
    db.settings.schoolName = 'Cấu hình chưa nhập học sinh';
    await service.saveAll(db);
    const restored = await service.readExistingState();
    expect(restored?.students).toEqual([]);
    expect(restored?.settings.schoolName).toBe(db.settings.schoolName);
  });
});
