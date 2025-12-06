'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAuthToken } from '@/services/api';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    // Hàm getAuthToken đã sửa để lấy từ sessionStorage
    const token = getAuthToken();
    
    // Danh sách các trang ai cũng vào được (không cần login)
    const publicRoutes = ['/', '/auth/callback'];

    // Nếu không có token VÀ đang cố vào trang nội bộ (không phải public)
    if (!token && !publicRoutes.includes(pathname)) {
      router.push('/'); // Đá về trang login
    }
    
    // Nếu có token VÀ đang ở trang Login
    else if (token && pathname === '/') {
      router.push('/workspace'); // Đá sang workspace
    }
    
    // Đã kiểm tra xong
    setIsChecked(true);
    
  }, [pathname, router]);

  // (Tùy chọn) Có thể hiện Loading trong lúc đang check token để tránh nháy giao diện
  // if (!isChecked) return <div>Loading...</div>;

  return <>{children}</>;
}