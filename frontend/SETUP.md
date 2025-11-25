# Hướng dẫn chạy ứng dụng Email AI

## Yêu cầu

- Python 3.8+ (cho backend)
- Node.js 18+ (cho frontend)
- Tài khoản Google Cloud với Gmail API được bật

## Cài đặt và chạy Backend

1. Chuyển sang nhánh backend:
```bash
git checkout backend
```

2. Cài đặt dependencies:
```bash
pip install -r requirements.txt
```

3. Tạo file `.env` trong thư mục gốc với nội dung:
```
GOOGLE_CLIENT_ID=280948850816-0s5nb712jucaa3c7v5jam0ub32c4hkgt.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
JWT_SECRET=your_jwt_secret_here
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

4. Chạy backend server:
```bash
cd app
uvicorn main:app --reload --port 8000
```

Backend sẽ chạy tại: http://localhost:8000

## Cài đặt và chạy Frontend

1. Mở terminal mới và chuyển sang nhánh frontend:
```bash
git checkout frontend
```

2. Di chuyển vào thư mục frontend:
```bash
cd frontend
```

3. Cài đặt dependencies:
```bash
npm install
```

4. File `.env.local` đã được tạo sẵn với cấu hình:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=280948850816-0s5nb712jucaa3c7v5jam0ub32c4hkgt.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

5. Chạy frontend development server:
```bash
npm run dev
```

Frontend sẽ chạy tại: http://localhost:3000

## Luồng đăng nhập

1. Truy cập http://localhost:3000
2. Click vào nút "Bắt đầu với Google"
3. Đăng nhập bằng tài khoản Google
4. Cấp quyền cho ứng dụng truy cập Gmail
5. Sau khi đăng nhập thành công, bạn sẽ được chuyển đến workspace với danh sách email

## Cấu trúc luồng xác thực

1. **Landing Page** (`/`) - Người dùng click "Bắt đầu với Google"
2. **Google OAuth** - Chuyển hướng đến Google để xác thực
3. **Callback Page** (`/auth/callback`) - Nhận authorization code từ Google
4. **Backend API** (`POST /auth/google-login`) - Đổi code lấy token
5. **Workspace Page** (`/workspace`) - Hiển thị danh sách email từ Gmail

## API Endpoints

### Authentication
- `POST /auth/google-login` - Đổi Google authorization code lấy JWT token

### Email
- `GET /emails?limit=10&page_token=xxx` - Lấy danh sách email
- `POST /emails/send` - Gửi email
- `DELETE /emails/{msg_id}` - Xóa email (chuyển vào thùng rác)

## Troubleshooting

### Lỗi xác thực
- Kiểm tra `redirect_uri` trong Google Cloud Console phải khớp với `http://localhost:3000/auth/callback`
- Đảm bảo backend đang chạy trước khi đăng nhập

### Không tải được email
- Kiểm tra JWT token có được lưu trong localStorage
- Xem console log để debug lỗi API
- Đảm bảo đã cấp đủ quyền Gmail cho ứng dụng

### CORS errors
- Backend FastAPI đã có CORS middleware, đảm bảo `http://localhost:3000` được cho phép

## Công nghệ sử dụng

### Backend
- FastAPI
- Google OAuth 2.0
- Gmail API
- Supabase (Database)
- JWT Authentication

### Frontend
- Next.js 14 (App Router)
- React
- TypeScript
- Tailwind CSS
- LocalStorage (Token management)
