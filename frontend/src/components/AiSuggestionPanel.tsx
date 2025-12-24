'use client';

import { useState, useEffect, useRef } from 'react';
import { Email } from '@/types/email';
import { sendDraft, updateDraft, deleteDraft, getDraftDetail } from '@/services/api';
import { useToast } from './ToastContainer';
import { useConfirm } from './ConfirmDialogContainer';

interface AiSuggestionPanelProps {
  email: Email;
  onSendReply: (content: string) => Promise<void>;
  onRegenerateAi: (emailId: string) => Promise<void>;
}

export default function AiSuggestionPanel({ email, onSendReply, onRegenerateAi }: AiSuggestionPanelProps) {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [originalDraftContent, setOriginalDraftContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [isDraftDeleted, setIsDraftDeleted] = useState(false);
  const editableRef = useRef<HTMLDivElement>(null);

  // Load draft when email changes or has draftId
  useEffect(() => {
    const loadDraft = async () => {
      console.log('AiSuggestionPanel: email.id=', email.id, 'draftId=', email.draftId, 'isDraftDeleted=', isDraftDeleted);
      if (email.draftId && !isDraftDeleted) {
        console.log('Loading draft with ID:', email.draftId);
        setIsLoadingDraft(true);
        try {
          const draftResponse = await getDraftDetail(email.draftId);
          console.log('Draft response:', draftResponse);
          const draftBody = draftResponse.data?.body || '';
          console.log('Draft body:', draftBody);
          setAiSuggestion(draftBody);
          setOriginalDraftContent(draftBody);
          setEditedContent(draftBody);
        } catch (err) {
          console.error('Error loading draft:', err);
          // If draft not found, clear the content
          setAiSuggestion('');
          setOriginalDraftContent('');
          setEditedContent('');
        } finally {
          setIsLoadingDraft(false);
        }
      } else if (!email.draftId) {
        console.log('No draftId, clearing content');
        setAiSuggestion('');
        setOriginalDraftContent('');
        setEditedContent('');
      }
    };

    loadDraft();
    setIsDraftDeleted(false); // Reset deleted state when email changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email.id, email.draftId]);

  const handleRegenerate = async () => {
    // Delete old draft first if exists
    if (email.draftId && !isDraftDeleted) {
      try {
        await deleteDraft(email.draftId);
        console.log('Old draft deleted before regenerating');
      } catch (err) {
        console.error('Error deleting old draft:', err);
      }
    }
    
    // Show loading state during AI generation
    setIsLoadingDraft(true);
    setAiSuggestion('');
    setEditedContent('');
    setOriginalDraftContent('');
    
    try {
      await onRegenerateAi(email.id);
    } finally {
      setIsLoadingDraft(false);
    }
  };

  const handleSend = async () => {
    if (isDraftDeleted) {
      showToast('Bản nháp đã bị xóa. Vui lòng tạo lại câu trả lời.', 'error');
      return;
    }

    if (!email.draftId) {
      showToast('Không có draft ID. Vui lòng tạo câu trả lời AI trước.', 'error');
      return;
    }

    setIsSending(true);
    try {
      // Kiểm tra xem nội dung có thay đổi không
      const contentChanged = editedContent.trim() !== originalDraftContent.trim();
      
      // Chuẩn bị thông tin email
      const replySubject = email.subject.startsWith('Re: ') 
        ? email.subject 
        : `Re: ${email.subject}`;
      
      // Gửi draft - nếu có thay đổi thì gửi kèm nội dung mới để cập nhật Supabase
      if (contentChanged) {
        console.log('Content changed, sending with updated content to Supabase...');
        await sendDraft(email.draftId, replySubject, editedContent, email.senderEmail);
      } else {
        // Không có thay đổi, chỉ gửi draft bình thường
        await sendDraft(email.draftId);
      }
      
      // Call parent callback to update email state
      await onSendReply(editedContent);
      
      showToast('Email đã được gửi thành công!', 'success');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to send email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể gửi email';
      showToast(`Lỗi: ${errorMessage}`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!email.draftId) {
      showToast('Không có bản nháp để xóa.', 'warning');
      return;
    }

    const confirmed = await confirm({
      title: 'Xóa bản nháp',
      message: 'Bạn có chắc chắn muốn xóa bản nháp này?\nLưu ý: Nếu xóa, bản nháp trên Gmail cũng sẽ bị mất!',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      // Delete draft using dedicated endpoint (deletes from both Gmail and Supabase)
      const result = await deleteDraft(email.draftId);
      
      // Clear the content and mark as deleted
      setAiSuggestion('');
      setEditedContent('');
      setOriginalDraftContent('');
      setIsDraftDeleted(true);
      
      // Show detailed message
      if (result.supabase_deleted) {
        showToast('Bản nháp đã được xóa thành công ở Gmail!\nVui lòng tải lại trang để cập nhật sự thay đổi.', 'success');
      } else {
        showToast('Bản nháp đã được xóa từ Gmail (không tìm thấy trong Supabase).', 'success');
      }
    } catch (error) {
      console.error('Failed to delete draft:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể xóa bản nháp';
      showToast(`Lỗi: ${errorMessage}`, 'error');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(aiSuggestion);
    // Set innerHTML after state update
    setTimeout(() => {
      if (editableRef.current) {
        editableRef.current.innerHTML = aiSuggestion;
      }
    }, 0);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(aiSuggestion);
  };

  const handleSaveEdit = () => {
    setAiSuggestion(editedContent);
    setIsEditing(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Trợ lý AI
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          {email.replySent
            ? 'Đã gửi trả lời'
            : isDraftDeleted 
            ? 'Bản nháp đã bị xóa' 
            : 'Gợi ý trả lời thông minh bởi AI'}
        </p>
      </div>

      {/* AI Suggestion Content */}
      <div className="flex-1 p-4 overflow-y-auto">{email.replySent ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="font-semibold text-green-900">Nội dung đã trả lời</h3>
              </div>
              <div 
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: aiSuggestion }}
              />
            </div>
          </div>
        ) : isLoadingDraft ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-gray-500 font-medium">{email.draftId ? 'Đang tải bản nháp...' : 'Đang tạo câu trả lời...'}</p>
              <p className="text-xs text-gray-400 mt-1">Vui lòng đợi trong giây lát</p>
            </div>
          </div>
        ) : !aiSuggestion && !email.draftId ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-sm text-gray-700 font-medium mb-2">Chưa có câu trả lời từ AI</p>
              <p className="text-xs text-gray-500">Chọn email và nhấn &ldquo;Tạo câu trả lời với AI&rdquo; để bắt đầu</p>
            </div>
          </div>
        ) : (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">
                Gợi ý trả lời
              </h3>
            </div>
            
            <div className="relative">
              {isEditing ? (
                <div className="relative">
                  <div 
                    ref={editableRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => setEditedContent(e.currentTarget.innerHTML)}
                    className="w-full min-h-64 max-h-96 p-3 border border-gray-200 rounded-lg overflow-y-auto bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent prose prose-sm max-w-none"
                    style={{ whiteSpace: 'pre-wrap' }}
                  />
                </div>
              ) : (
                <div className="relative">
                  <div 
                    className="w-full min-h-64 max-h-96 p-3 border border-gray-200 rounded-lg overflow-y-auto bg-gray-50 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: aiSuggestion }}
                  />
                  {!isDraftDeleted && aiSuggestion && (
                    <button
                      onClick={handleEdit}
                      className="absolute top-2 right-2 p-1 bg-white rounded shadow-sm text-gray-400 hover:text-gray-600 cursor-pointer"
                      title="Chỉnh sửa gợi ý"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {isEditing ? (
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Lưu thay đổi
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={handleSend}
                  disabled={isSending || !editedContent.trim() || isDraftDeleted}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Gửi email</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleRegenerate}
                  disabled={isDraftDeleted}
                  className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Tạo lại gợi ý</span>
                </button>
                
                <button
                  onClick={handleDeleteDraft}
                  disabled={isSending || isDraftDeleted || !email.draftId}
                  className="w-full border border-red-300 text-red-600 py-2 px-4 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Xóa bản nháp</span>
                </button>
              </>
            )}
          </div>
        </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Gợi ý AI được hỗ trợ bởi Llama3. Đôi khi mô hình có thể đưa ra kết quả không tốt.</span>
        </div>
      </div>
    </div>
  );
}