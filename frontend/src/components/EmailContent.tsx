'use client';

import { Email } from '@/types/email';
import { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';

interface EmailContentProps {
  email: Email;
}

export default function EmailContent({ email }: EmailContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    });
  };

  // Sanitize và render HTML content
  const getSanitizedHTML = (html: string) => {
    // Cấu hình DOMPurify để cho phép các thẻ cần thiết
    const config = {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'i', 'em', 'u', 'a', 'img', 
        'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'blockquote', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
        'div', 'span', 'pre', 'code'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'style',
        'width', 'height', 'target', 'rel'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    };

    return DOMPurify.sanitize(html, config);
  };

  // Xử lý styles cho email content
  useEffect(() => {
    if (contentRef.current) {
      // Reset các styles không mong muốn
      const emailBody = contentRef.current;
      
      // Remove inline styles có thể gây lỗi layout
      const elements = emailBody.querySelectorAll('*');
      elements.forEach(el => {
        const element = el as HTMLElement;
        // Loại bỏ các style có thể làm vỡ layout
        if (element.style.position === 'absolute' || element.style.position === 'fixed') {
          element.style.position = 'relative';
        }
        if (element.style.width && parseInt(element.style.width) > 800) {
          element.style.width = '100%';
        }
      });

      // Xử lý links - mở trong tab mới
      const links = emailBody.querySelectorAll('a');
      links.forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      });

      // Xử lý images - responsive
      const images = emailBody.querySelectorAll('img');
      images.forEach(img => {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
      });
    }
  }, [email.body]);

  // Kiểm tra xem content có phải HTML không
  const isHTML = email.body.trim().startsWith('<');

  return (
    <div className="h-full flex flex-col">
      {/* Email Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            {email.subject}
          </h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {email.sender.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {email.sender}
                </p>
                <p className="text-sm text-gray-500">
                  {email.senderEmail}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {formatDateTime(email.timestamp)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {isHTML ? (
          <div 
            ref={contentRef}
            className="email-content"
            dangerouslySetInnerHTML={{ 
              __html: getSanitizedHTML(email.body) 
            }}
          />
        ) : (
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {email.body}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {/* <div className="border-t border-gray-200 p-6">
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span>Reply</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Forward</span>
          </button>

          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>Archive</span>
          </button>
        </div>
      </div> */}
    </div>
  );
}