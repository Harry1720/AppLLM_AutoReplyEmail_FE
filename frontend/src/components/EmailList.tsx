'use client';

import { Email } from '@/types/email';

interface EmailListProps {
  emails: Email[];
  selectedEmail: Email | null;
  onEmailSelect: (email: Email) => void;
}

export default function EmailList({ emails, selectedEmail, onEmailSelect }: EmailListProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {emails.map((email) => (
        <div
          key={email.id}
          onClick={() => onEmailSelect(email)}
          className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
            selectedEmail?.id === email.id 
              ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' 
              : ''
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                email.isRead ? 'bg-transparent' : 'bg-blue-500'
              }`} />
              <span className={`font-medium truncate ${
                email.isRead 
                  ? 'text-gray-700 dark:text-gray-300' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                {email.sender}
              </span>
              {email.hasAiSuggestion && (
                <span className="text-yellow-500 text-sm" title="AI suggestion available">
                  ✨
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
              {formatTime(email.timestamp)}
            </span>
          </div>
          
          <h3 className={`text-sm mb-1 truncate ${
            email.isRead 
              ? 'text-gray-700 dark:text-gray-300' 
              : 'text-gray-900 dark:text-white font-medium'
          }`}>
            {email.subject}
          </h3>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {email.snippet}
          </p>
        </div>
      ))}
    </div>
  );
}