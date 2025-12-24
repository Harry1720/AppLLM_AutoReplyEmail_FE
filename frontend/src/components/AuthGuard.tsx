'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAuthToken } from '@/services/api';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    // Hàm getAuthToken lấy từ sessionStorage
    const token = getAuthToken();
    
    // Danh sách các trang không cần login
    const publicRoutes = ['/', '/auth/callback'];

    // Nếu không có token & đang cố vào trang trong
    if (!token && !publicRoutes.includes(pathname)) {
      router.push('/'); // về trang login
    }
    
    // Nếu có token + đang ở trang Login
    else if (token && pathname === '/') {
      router.push('/workspace'); // Đá sang workspace
    }
    
    // Đã kiểm tra xong
    setIsChecked(true);
    
  }, [pathname, router]);

  return <>{children}</>;
}