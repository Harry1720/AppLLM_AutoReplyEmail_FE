# Tóm Tắt Thay Đổi Frontend

## Các tính năng đã triển khai

### 1. ✅ Phân trang EmailList
- **File**: `frontend/src/components/EmailList.tsx`
- Thêm props: `hasNextPage`, `onLoadMore`, `isLoadingMore`
- Hiển thị nút "Tải thêm email" ở cuối danh sách
- Tích hợp với API `GET /emails` có hỗ trợ `page_token`
- Workspace page hỗ trợ append emails khi load more

### 2. ✅ Checkbox chọn email và tạo câu trả lời AI
- **File**: `frontend/src/components/EmailList.tsx`, `frontend/src/app/workspace/page.tsx`
- Mỗi email có checkbox để chọn
- Giới hạn tối đa 5 email được chọn
- Hiển thị nút "Tạo câu trả lời với AI" ở middle panel khi có email được chọn
- Gọi API `POST /ai/generate` cho từng email được chọn
- Hiển thị icon ✓ (check mark) màu xanh tại email đã tạo câu trả lời AI thành công
- Lưu `draftId` vào email state

### 3. ✅ Đồng bộ AI Data sau authentication
- **File**: `frontend/src/app/auth/callback/page.tsx`
- Sau khi Google authentication thành công
- Tự động gọi `POST /ai/sync` (chạy background, không chờ)
- Load emails song song với sync

### 4. ✅ Nút gửi email và xóa draft
- **File**: `frontend/src/components/AiSuggestionPanel.tsx`
- **Nút gửi**: Sử dụng `POST /drafts/{draft_id}/send` thay vì send trực tiếp
- **Nút xóa**: 
  - Hiển thị confirmation dialog
  - Cảnh báo "Bản nháp trên Gmail cũng sẽ bị xóa"
  - Gọi `DELETE /emails/{msg_id}` (truyền draft_id)
  - Sau khi xóa: Disable toàn bộ UI editing cho đến khi tạo lại

### 5. ✅ Kiểm tra và update draft trước khi gửi
- **File**: `frontend/src/components/AiSuggestionPanel.tsx`
- Khi load draft từ backend, lưu `originalDraftContent`
- Trước khi gửi, so sánh `editedContent` với `originalDraftContent`
- Nếu khác nhau: gọi `PUT /drafts/{draft_id}` để update
- Sau đó mới gọi `POST /drafts/{draft_id}/send`

## API Functions đã thêm

**File**: `frontend/src/services/api.ts`

1. `syncAiData()` - POST /ai/sync
2. `generateAiReply(msgId)` - POST /ai/generate
3. `sendDraft(draftId)` - POST /drafts/{draft_id}/send
4. `updateDraft(draftId, to, subject, body)` - PUT /drafts/{draft_id}
5. `getDraftDetail(draftId)` - GET /drafts/{draft_id}

## Type Changes

**File**: `frontend/src/types/email.ts`

```typescript
export interface Email {
  // ... existing fields
  draftId?: string; // ID của draft được tạo bởi AI
  aiReplyGenerated?: boolean; // Đã tạo câu trả lời AI chưa
}
```

## UI/UX Improvements

1. **EmailList**:
   - Icon ✓ màu xanh cho email đã tạo AI reply
   - Checkbox với limit counter (x/5)
   - Load more button với loading state

2. **Middle Panel**:
   - Nút "Tạo câu trả lời với AI" hiển thị khi có email được chọn
   - Badge hiển thị số lượng email được chọn
   - Loading state khi đang generate

3. **AiSuggestionPanel**:
   - Auto-load draft từ backend khi có draftId
   - Show draft deleted state
   - Disable buttons khi draft bị xóa
   - "Tạo lại gợi ý" để regenerate
   - Confirmation dialog cho delete action

## Flow hoàn chỉnh

### Flow 1: Tạo câu trả lời AI
1. User check vào 1-5 emails
2. Click "Tạo câu trả lời với AI"
3. System gọi `POST /ai/generate` cho từng email
4. Backend trả về `draft_id`
5. Email được đánh dấu ✓ trong danh sách

### Flow 2: Gửi email
1. User click vào email đã có AI reply
2. Right panel load draft từ Gmail
3. User có thể edit nội dung
4. Click "Gửi email"
5. System kiểm tra nội dung có thay đổi không
6. Nếu có: update draft trước
7. Gửi draft qua API `POST /drafts/{draft_id}/send`

### Flow 3: Xóa draft
1. User click "Xóa bản nháp"
2. Show confirmation với warning
3. Gọi `DELETE /emails/{draft_id}`
4. UI chuyển sang trạng thái "deleted"
5. Disable tất cả actions cho đến khi regenerate

## Testing Checklist

- [ ] Load emails với pagination hoạt động
- [ ] Checkbox giới hạn 5 emails
- [ ] Tạo AI reply cho nhiều emails cùng lúc
- [ ] Icon ✓ hiển thị đúng sau generate
- [ ] Load draft content từ backend
- [ ] Edit draft và gửi (có update trước)
- [ ] Xóa draft với confirmation
- [ ] Regenerate sau khi xóa
- [ ] AI sync chạy background sau login

## Notes

- Tất cả API calls đều có error handling
- Loading states để feedback cho user
- Confirmation dialogs cho destructive actions
- State management cho draft lifecycle
