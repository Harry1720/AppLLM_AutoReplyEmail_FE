'use client';
//báo hiệu file này là Client Component vì trang này có tương tác  và dùng Hook nên nó phải chạy ở trình duyệt (Client) chứ không phải Server.
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; //điều hướng chuyển trang
import Image from 'next/image';
import { getAuthToken } from '@/services/api';

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to workspace if already logged in
  useEffect(() => {
    const token = getAuthToken(); //Gọi hàm lấy token xem người dùng đã đăng nhập từ trước chưa.
    if (token) {
      router.push('/workspace');
    }
  }, [router]);

  const handleGoogleLogin = () => {
    setIsLoading(true); //Ngay khi bấm, bật chế độ "đang tải"
    
    // Google OAuth URL with all required parameters
    const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({  //Tạo đường link chuẩn OAuth2 của Google.
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '', //Định danh ứng dụng
      redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || '', //Địa chỉ mà Google sẽ trả người dùng về sau khi đăng nhập xong
      response_type: 'code', //Yêu cầu Google trả về một mã định danh (auth code).
      scope: 'email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify',
      /**email, profile: Lấy tên, avatar.
        ...gmail.readonly: Quyền đọc email.
        ...gmail.send: Quyền gửi email thay người dùng.
        ...gmail.modify: Quyền sửa/xóa email. */
      access_type: 'offline',
      prompt: 'select_account' //Luôn hiện bảng chọn tài khoản
    }).toString();
    
    // Redirect to Google OAuth
    window.location.href = googleAuthUrl; //trình duyệt chuyển hướng sang trang của Google (theo chuẩn OAuth2 tạo ở trên).
  };

  return (
    <div className="min-h-screen bg-gradient-to-br to-sky-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div className="space-y-4">

          {/* Logo */}
          <div className="mx-auto mb-0 flex items-center justify-center w-64 h-64">
            <Image
              src="/logo.png"
              alt="Logo"
              width={256}
              height={256}
              className="rounded-2xl"
              priority //priority giúp ảnh này được tải ưu tiên
            />
          </div>

          {/* App Name & Description */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Trợ lý Email thông minh
            </h1>
            <p className="text-gray-600 text-lg">
              Ứng dụng trả lời email tự động thông minh với Trí tuệ nhân tạo
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 text-1xl text-gray-700">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-green-500">✨</span>
              <span>Gợi ý trả lời các email bạn nhận được</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-blue-500">🎯</span>
              <span>Phân tích ngữ cảnh thông minh từ các email bạn đã gửi</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-purple-500">⚡</span>
              <span>Liên kết với Gmail của bạn rất tiện lợi thao tác</span>
            </div>
          </div>
        </div>

        {/* Google Login Button */}
        <div className="pt-6">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading} //Nếu đang tải (isLoading là true) thì nút bị vô hiệu hóa
            className="w-full bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="32px" height="32px">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-18.55z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.28-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.55 10.78l7.98-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>

                <span className='font-semibold'>Đăng nhập bằng Google</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="pt-2 text-1xl text-amber-700">
          <p>Bằng cách đăng nhập, bạn đồng ý với điều khoản sử dụng của chúng tôi.</p>
        </div>
        <div className="pt-2 text-1xl text-black">
          <p>Thực hiện: Quốc Bảo - Thái Bình.</p>
        </div>
      </div>
    </div>
  );
}
