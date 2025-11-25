'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    // Simulate authentication process
    setTimeout(() => {
      router.push('/workspace');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          {/* Logo */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          {/* App Name & Description */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Trợ lý Email thông minh
            </h1>
            <p className="text-gray-600 text-lg">
              Ứng dụng trả lời email tự động thông minh với AI
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-green-500">✨</span>
              <span>Gợi ý trả lời email tự động</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-blue-500">🎯</span>
              <span>Phân tích ngữ cảnh thông minh</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-purple-500">⚡</span>
              <span>Tích hợp seamless với Gmail</span>
            </div>
          </div>
        </div>

        {/* Google Login Button */}
        <div className="pt-6">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Bắt đầu với Google</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="pt-8 text-xs text-gray-400">
          <p>Bằng cách đăng nhập, bạn đồng ý với điều khoản sử dụng của chúng tôi</p>
        </div>
      </div>
    </div>
  );
}
