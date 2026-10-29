# Tài khoản riêng cho Theo dõi học sinh

Trang sử dụng: https://theodoihocsinh-ced29.web.app/

- Đăng nhập Google trước khi mở dữ liệu học sinh. Mỗi tài khoản có dữ liệu lớp, học sinh, điểm 35 tuần, lịch sử và cấu hình riêng.
- Trên máy cũ, chọn chuyển dữ liệu trên máy lên tài khoản nếu tài khoản chưa có bản lưu. Bản cũ vẫn được giữ. Nếu tài khoản đã có dữ liệu, có thể dùng nút chuyển dữ liệu cũ với xác nhận và sao lưu bản hiện tại trước khi thay thế.
- Chờ “Đã lưu trên tài khoản Google” trước khi chuyển máy. Đăng nhập cùng Google trên máy khác để tiếp tục.
- Đăng xuất hoặc đổi tài khoản không chia sẻ dữ liệu giữa các tài khoản. IndexedDB, bộ nhớ dự phòng và bản nháp đều được đặt tên theo UID.
- Khi nhiều máy cùng sửa một phiên bản, ứng dụng chặn ghi đè, giữ bản nháp và yêu cầu đối chiếu với bản từ tài khoản.
- Bản lưu Firebase cũ trong `studentTracker/{uid}` tiếp tục đọc được bởi chính chủ. Bản lưu mới dùng `studentAccounts/{uid}` với các mảnh dữ liệu được ghi cùng giao dịch.
- Dữ liệu ở tên miền khác (ví dụ GitHub Pages hoặc AI Studio) cần xuất JSON tại tên miền đó, rồi nhập trong “Sao lưu & Cài đặt” sau khi đăng nhập ở Firebase. Website không thể tự đọc bộ nhớ của máy hoặc tên miền khác.

## Kiểm tra và triển khai

Node.js >=24.12. Tạo `.env.local` với `VITE_FIREBASE_API_KEY` từ Firebase Project settings, rồi chạy:

```sh
npm ci
npm run lint
npx vitest run src/cloud/AccountWorkspace.test.tsx
npm run build
firebase deploy --only firestore,hosting --project theodoihocsinh-ced29
```

Rules được hợp nhất với chính sách của những ứng dụng đang dùng chung cơ sở dữ liệu; cần kiểm tra rules đang chạy trước lần triển khai sau. Không commit token, OAuth client secret, `.env.local` hoặc dữ liệu học sinh lên GitHub. JSON đồng bộ tối đa 6 MB/tài khoản; bản sao lưu JSON và Excel vẫn có thể tải về từ ứng dụng.
