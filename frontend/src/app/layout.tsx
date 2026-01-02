import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthGuard from "@/components/AuthGuard";
// component bảo vệ, kiểm tra xem người dùng đã đăng nhập chưa; nếu chưa, đưa về trang Login.
import { ToastProvider } from "@/components/ToastContainer";  //component quản lý thông báo
import { ConfirmDialogProvider } from "@/components/ConfirmDialogContainer"; //component quản lý hộp thoại xác nhận
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans", // Đặt tên biến CSS
  subsets: ["latin"], //Chỉ tải bộ ký tự Latin
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = { //định nghĩa tiêu đề, mô tả cho SEO (Search Engine Optimization).
  title: "Trợ lý Email thông minh",
  description: "Ứng dụng trả lời email tự động thông minh với AI",
  icons: {
    icon: '/logo_tab.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode; //định nghĩa component này nhận vào một prop tên là children, và children phải là một React Node (div, text, component khác...)
}>) {
  return (
    <html lang="vi" suppressHydrationWarning> 
    {/* suppressHydrationWarning: Một cờ đặc biệt để tắt cảnh báo lỗi "Hydration mismatch". Lỗi này thường xảy ra nếu dùng extension trình duyệt */}
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConfirmDialogProvider>
          <ToastProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
          </ToastProvider>
        </ConfirmDialogProvider>
        {/* ConfirmDialogProvider & ToastProvider đặt ở ngoài cùng để đảm bảo xác nhận hoặc thông báo có thể hiện lên bất cứ lúc nào, kể cả khi đang kiểm tra đăng nhập.
          Ở giữa (AuthGuard): Đóng vai trò gác cổng. Nếu người dùng chưa đăng nhập -> AuthGuard chặn lại, không cho render children (không cho xem nội dung trang). ngược lại -> cho phép render children. */}
      </body>
    </html>
  );
}
