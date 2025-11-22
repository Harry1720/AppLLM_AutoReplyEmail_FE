'use client';

import { useState } from 'react';
import { Email } from '@/types/email';
import EmailList from '@/components/EmailList';
import EmailContent from '@/components/EmailContent';
import AiSuggestionPanel from '@/components/AiSuggestionPanel';
import Header from '@/components/Header';

// Mock data
const mockEmails: Email[] = [
  {
    id: '1',
    sender: 'John Doe',
    senderEmail: 'john@example.com',
    subject: 'Meeting Request for Tomorrow',
    snippet: 'Hi there, I would like to schedule a meeting with you tomorrow to discuss...',
    body: `Hi there,

I would like to schedule a meeting with you tomorrow to discuss the new project proposal. 

Could you please let me know your availability between 2 PM and 4 PM?

Best regards,
John Doe`,
    timestamp: '2024-11-22T10:30:00Z',
    hasAiSuggestion: true,
    isRead: false
  },
  {
    id: '2',
    sender: 'Sarah Wilson',
    senderEmail: 'sarah@company.com',  
    subject: 'Project Update Required',
    snippet: 'Hello, I need an update on the current status of the project. Could you...',
    body: `Hello,

I need an update on the current status of the project. Could you please provide me with:

1. Current progress percentage
2. Any blockers or issues
3. Expected completion date

Please reply by end of day.

Thanks,
Sarah Wilson`,
    timestamp: '2024-11-22T09:15:00Z',
    hasAiSuggestion: true,
    isRead: false
  },
  {
    id: '3',
    sender: 'Mike Chen',
    senderEmail: 'mike@startup.io',
    subject: 'Collaboration Opportunity',
    snippet: 'We are interested in exploring a potential collaboration with your team...',
    body: `Hi,

We are interested in exploring a potential collaboration with your team for our upcoming product launch.

Would you be available for a call next week to discuss this further?

Best,
Mike Chen
CEO, Startup Inc.`,
    timestamp: '2024-11-21T16:45:00Z',
    hasAiSuggestion: false,
    isRead: true
  }
];

export default function WorkspacePage() {
  const [emails, setEmails] = useState<Email[]>(mockEmails);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(
    mockEmails.length > 0 ? mockEmails[0] : null
  );

  const handleEmailSelect = (email: Email) => {
    setSelectedEmail(email);
    // Mark as read
    setEmails(prev => prev.map(e => 
      e.id === email.id ? { ...e, isRead: true } : e
    ));
  };

  const handleSendReply = (content: string) => {
    console.log('Sending reply:', content);
    // Here you would integrate with email API
    alert('Email sent successfully!');
  };

  const handleRegenerateAi = (emailId: string) => {
    console.log('Regenerating AI suggestion for:', emailId);
    // Here you would call AI service
    alert('AI suggestion regenerated!');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Email List */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Inbox
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {emails.filter(e => !e.isRead).length} unread
            </p>
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
        <div className="flex-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          {selectedEmail ? (
            <EmailContent email={selectedEmail} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No email selected</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose an email from the list to view its content
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - AI Suggestions */}
        <div className="w-96 bg-white dark:bg-gray-800">
          {selectedEmail ? (
            <AiSuggestionPanel 
              email={selectedEmail}
              onSendReply={handleSendReply}
              onRegenerateAi={handleRegenerateAi}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center px-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">AI Assistant</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Select an email to get AI-powered reply suggestions
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}