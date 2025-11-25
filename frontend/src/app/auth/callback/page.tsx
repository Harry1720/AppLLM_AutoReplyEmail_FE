'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeCodeForToken } from '@/services/api';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      // Get the authorization code from URL
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('Đăng nhập bị hủy hoặc thất bại');
        setIsProcessing(false);
        setTimeout(() => {
          router.push('/');
        }, 3000);
        return;
      }

      if (!code) {
        setError('Không tìm thấy mã xác thực');
        setIsProcessing(false);
        setTimeout(() => {
          router.push('/');
        }, 3000);
        return;
      }

      try {
        // Exchange code for token
        const data = await exchangeCodeForToken(code);
        
        console.log('Login successful:', data);
        
        // Redirect to workspace
        router.push('/workspace');
      } catch (err: any) {
        console.error('Authentication error:', err);
        setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        setIsProcessing(false);
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Đang xác thực...
            </h2>
            <p className="text-gray-600">
              Vui lòng đợi trong giây lát
            </p>
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Lỗi xác thực
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              Đang chuyển hướng về trang chủ...
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
