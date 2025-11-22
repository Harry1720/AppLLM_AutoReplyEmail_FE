export interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  body: string;
  timestamp: string;
  hasAiSuggestion?: boolean;
  isRead?: boolean;
}

export interface AiSuggestion {
  id: string;
  emailId: string;
  content: string;
  confidence: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface EmailThread {
  id: string;
  emails: Email[];
  participants: string[];
  subject: string;
  lastActivity: string;
}