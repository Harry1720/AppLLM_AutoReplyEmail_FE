'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Email } from '@/types/email';
import EmailList from '@/components/EmailList';
import EmailContent from '@/components/EmailContent';
import AiSuggestionPanel from '@/components/AiSuggestionPanel';
import Header from '@/components/Header';
import { fetchEmails, fetchEmailDetail, getAuthToken, getUserInfo } from '@/services/api';

export default function WorkspacePage() {
  const router = useRouter();
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const token = getAuthToken();
    const userInfo = getUserInfo();

    if (!token || !userInfo) {
      // Redirect to landing page if not authenticated
      router.push('/');
      return;
    }

    // Fetch emails from backend
    loadEmails();
  }, [router]);

  const loadEmails = async (pageToken?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await fetchEmails(20, pageToken);
      
      // Transform backend email format to frontend format
      interface EmailFromAPI {
        id: string;
        threadId?: string;
        subject?: string;
        snippet?: string;
        from?: string;
        date?: string;
        labelIds?: string[];
      }

      const transformedEmails: Email[] = data.emails.map((email: EmailFromAPI) => {
        // Parse "From" header: "Nguyen Van A <nguyen.a@gmail.com>" hoặc "\"Bảo Huỳnh\" <baohuynh4107@gmail.com>"
        const parseFrom = (fromHeader?: string) => {
          if (!fromHeader) return { name: 'Unknown', email: '' };
          
          // Extract email address
          const emailMatch = fromHeader.match(/<(.+?)>/);
          const emailAddr = emailMatch ? emailMatch[1].trim() : fromHeader.trim();
          
          // Extract name and remove quotes
          let name = fromHeader.replace(/<.*>/, '').trim();
          // Remove surrounding quotes (both single and double)
          name = name.replace(/^["']|["']$/g, '');
          // If name is empty, use email username
          name = name || emailAddr.split('@')[0];
          
          return { name: name || 'Unknown', email: emailAddr };
        };

        const { name: senderName, email: senderEmail } = parseFrom(email.from);

        return {
          id: email.id,
          sender: senderName,
          senderEmail: senderEmail,
          subject: email.subject?.trim() || '(No Subject)',
          snippet: email.snippet || '',
          body: email.snippet || '',
          timestamp: email.date || new Date().toISOString(),
          hasAiSuggestion: false,
          // isRead: !email.labelIds?.includes('UNREAD'), // Gmail dùng label UNREAD để đánh dấu chưa đọc
        };
      });
      setEmails(transformedEmails);
      setNextPageToken(data.next_page_token);
      
    } catch (err: unknown) {
      console.error('Error loading emails:', err);
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải email. Vui lòng thử lại.';
      setError(errorMessage);
      
      // If authentication error, redirect to login
      if (err instanceof Error && err.message.includes('Authentication')) {
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSelect = async (email: Email) => {
    try {
      const detailResponse = await fetchEmailDetail(email.id);
      const emailDetail = detailResponse.data;

      const parseFrom = (fromHeader?: string) => {
        if (!fromHeader) return { name: 'Unknown', email: '' };
        
        // Extract email address
        const emailMatch = fromHeader.match(/<(.+?)>/);
        const emailAddr = emailMatch ? emailMatch[1].trim() : fromHeader.trim();
        
        // Extract name and remove quotes
        let name = fromHeader.replace(/<.*>/, '').trim();
        // Remove surrounding quotes (both single and double)
        name = name.replace(/^["']|["']$/g, '');
        // Remove escaped quotes
        name = name.replace(/\\"/g, '"');
        // If name is empty, use email username
        name = name || emailAddr.split('@')[0];
        
        return { name: name || 'Unknown', email: emailAddr };
      };

      const { name: senderName, email: senderEmail } = parseFrom(emailDetail.from);
      
      // Extract body - ưu tiên HTML, fallback về plain text
      let body = emailDetail.body || emailDetail.snippet || '';
      
      // Nếu body là object với parts (multipart email)
      if (typeof body === 'object' && body.parts) {
        // Tìm HTML part trước
        const htmlPart = body.parts.find((p: { mimeType: string }) => p.mimeType === 'text/html');
        const textPart = body.parts.find((p: { mimeType: string }) => p.mimeType === 'text/plain');
        body = htmlPart?.body || textPart?.body || emailDetail.snippet || '';
      }

      const fullEmail: Email = {
        id: email.id,
        sender: senderName || 'Unknown',
        senderEmail: senderEmail || '',
        subject: emailDetail.subject || '(No Subject)',
        snippet: emailDetail.snippet || '',
        body: body,
        timestamp: emailDetail.date || email.timestamp,
        hasAiSuggestion: false,
        isRead: true
      };
      
      setSelectedEmail(fullEmail);
      
      setEmails((prev: Email[]) => prev.map((e: Email) => 
        e.id === email.id ? { ...e, isRead: true } : e
      ));
    } catch (err) {
      console.error('Error loading email detail:', err);
      setSelectedEmail(email);
      setEmails((prev: Email[]) => prev.map((e: Email) => 
        e.id === email.id ? { ...e, isRead: true } : e
      ));
    }
  };

  const handleSendReply = (content: string) => {
    console.log('Sending reply:', content);
    // TODO: Integrate with backend send email API
    alert('Email đã được gửi thành công!');
  };

  const handleRegenerateAi = (emailId: string) => {
    console.log('Regenerating AI suggestion for:', emailId);
    // TODO: Integrate with AI service
    alert('Gợi ý AI đã được tạo lại!');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải email...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => loadEmails()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSyncFromHeader = () => {
    loadEmails(); // Reload emails
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header onSync={handleSyncFromHeader}/>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Email List */}
        <div className="w-90 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Hộp thư của bạn
            </h2>
            {/* <p className="text-sm text-gray-500">
              {emails.filter((e: Email) => !e.isRead).length} thư chưa đọc
            </p> */}
          </div>
          <div className="flex-1 overflow-y-auto">
            <EmailList 
              emails={emails}
              selectedEmail={selectedEmail}
              onEmailSelect={handleEmailSelect}
            />
          </div>
        </div>

        {/* Middle Panel - Email Content */}
        <div className="flex-1 w-2xl bg-white border-r border-gray-200">
          {selectedEmail ? (
            <EmailContent email={selectedEmail} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Email của bạn</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Chọn một email từ danh sách để xem nội dung chi tiết
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - AI Suggestions */}
        <div className="flex-1 max-w-120 bg-white">
          {selectedEmail ? (
            <AiSuggestionPanel 
              email={selectedEmail}
              onSendReply={handleSendReply}
              onRegenerateAi={handleRegenerateAi}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center px-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Trợ lý AI</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Nhận gợi ý trả lời email từ AI
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}