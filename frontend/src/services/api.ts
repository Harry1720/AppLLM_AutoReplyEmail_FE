const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'; //Xác định địa chỉ server Backend.

// 1/ Quản lý Token xác thực (Authentication Token)
// Store token in sessionStorage --> Lưu token vào bộ nhớ phiên trình duyệt.
export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') { //Đây là kiểm tra bắt buộc trong Next.js, vì Next.js có thể chạy code trên server (nơi không có window hay sessionStorage),đoạn này đảm bảo code chỉ chạy trên trình duyệt (client-side) để tránh lỗi.
    sessionStorage.setItem('auth_token', token);
  }
};

//Lấy token ra để gắn vào Header của các API request sau này.
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('auth_token');
  }
  return null;
};

//Xóa token (dùng khi đăng xuất).
export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('auth_token');
  }
};

// 2/ Quản lý thông tin người dùng
// User interface for sessionStorage
interface UserInfo { //giúp code chặt chẽ và gợi ý code tốt hơn
  id: string;
  email: string;
  name: string;
  picture?: string;
}

// Store user info
export const setUserInfo = (user: UserInfo) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('user_info', JSON.stringify(user)); //JSON.stringify(user) để chuyển object thành chuỗi JSON vì sessionStorage chỉ lưu được chuỗi (string)
  }
};

export const getUserInfo = () => {
  if (typeof window !== 'undefined') {
    const userInfo = sessionStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null; //Lấy chuỗi JSON ra và dùng JSON.parse() để chuyển lại thành object.
  }
  return null;
}
//Xóa thông tin người dùng.
export const removeUserInfo = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('user_info');
  }
};

// 3. Quy trình đăng nhập (Google OAuth)
// Exchange Google authorization code for JWT token (Gửi "authorization code" (nhận được từ Google sau khi người dùng bấm đăng nhập) xuống Backend để đổi lấy JWT Token)
export const exchangeCodeForToken = async (code: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/google-login`, { //Gửi POST request tới /auth/google-login.
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Authentication failed');
    }

    const data = await response.json(); //Nếu thành công, Backend trả về access_token và thông tin user.
    
    // Store the JWT token and user info (Tự động gọi setAuthToken và setUserInfo để lưu lại phiên làm việc)
    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    if (data.user) {
      setUserInfo(data.user);
    }

    return data;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
};

// 4. Các thao tác với Email
// Fetch emails from backend
export const fetchEmails = async (limit: number = 10, pageToken?: string, folder?: string) => {
  const token = getAuthToken(); // Lấy token để xác thực
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    // Xây dựng URL với các tham số query (limit, page_token, folder)
    let url = `${API_BASE_URL}/emails?limit=${limit}`;
    if (pageToken) {
      url += `&page_token=${pageToken}`;
    }
    if (folder) {
      url += `&folder=${folder}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`, // Gửi token kèm header --> để Backend biết ai đang gửi yêu cầu.
        'Content-Type': 'application/json',
      },
    });

    // Xử lý trường hợp hết hạn phiên đăng nhập (401)
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        removeAuthToken();
        removeUserInfo();
        throw new Error('Authentication expired. Please login again.');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch emails');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
};

// Fetch sent emails from backend
//Tái sử dụng hàm fetchEmails nhưng set cứng tham số folder là 'SENT'.
export const fetchSentEmails = async (limit: number = 10, pageToken?: string) => {
  return fetchEmails(limit, pageToken, 'SENT');
};

// Send email
export const sendEmail = async (to: string, subject: string, body: string, files?: File[]) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    // Chuyển đổi ký tự xuống dòng (\n) thành thẻ <br> để hiển thị đúng trong HTML email
    const htmlBody = `<html><body><div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">${body.replace(/\n/g, '<br>')}</div></body></html>`;
    
    // Sử dụng FormData để gửi dữ liệu bao gồm cả file đính kèm --> Sử dụng FormData thay vì JSON thông thường để hỗ trợ tính năng gửi file đính kèm (files).
    const formData = new FormData();
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('body', htmlBody);
    
    // Add files if provided
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('files', file); // Gửi mảng file
      });
    }

    const response = await fetch(`${API_BASE_URL}/emails/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Không set Content-Type thủ công khi dùng FormData - browser will set it automatically with boundary for FormData
        //Trình duyệt sẽ tự động set là multipart/form-data kèm boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Delete email
export const deleteEmail = async (messageId: string) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/emails/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting email:', error);
    throw error;
  }
};

// Fetch email detail
export const fetchEmailDetail = async (messageId: string) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/emails/${messageId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeAuthToken();
        removeUserInfo();
        throw new Error('Authentication expired. Please login again.');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch email detail');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching email detail:', error);
    throw error;
  }
};

//5.Quản lý tài khoản (User Profile)
// Fetch user profile
export const fetchUserProfile = async () => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeAuthToken();
        removeUserInfo();
        throw new Error('Authentication expired. Please login again.');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Update user profile (Chưa dùng)
export const updateUserProfile = async (name: string, picture?: string) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, picture }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeAuthToken();
        removeUserInfo();
        throw new Error('Authentication expired. Please login again.');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Delete user account
export const deleteUserAccount = async () => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeAuthToken();
        removeUserInfo();
        throw new Error('Authentication expired. Please login again.');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete user account');
    }

    // Clear local storage after successful deletion
    //Nếu xóa tài khoản thành công, code sẽ tự động gọi removeAuthToken() và removeUserInfo() để làm sạch dữ liệu trình duyệt.
    removeAuthToken();
    removeUserInfo();

    return await response.json();
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
};

// Logout function
export const logout = () => {
  removeAuthToken();
  removeUserInfo();
};

//6. Tính năng AI (LLM Integration)
// Sync AI data (POST /ai/sync) yêu cầu Backend quét email sent mới và cập nhật vào Vector DB để AI có dữ liệu học.
export const syncAiData = async () => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/ai/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to sync AI data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error syncing AI data:', error);
    throw error;
  }
};

// Generate AI reply (POST /ai/generate)
export const generateAiReply = async (msgId: string) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/ai/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ msg_id: msgId }), //Gửi ID của email cần trả lời lên. Backend sẽ dùng LLM (Llama 3) để sinh ra nội dung trả lời gợi ý.
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate AI reply');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating AI reply:', error);
    throw error;
  }
};

// Check sync status (GET /ai/sync-status) Kiểm tra xem quá trình đồng bộ hóa email cho AI (sync data) đã xong chưa.
export const checkSyncStatus = async () => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/ai/sync-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to check sync status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking sync status:', error);
    throw error;
  }
};

//7. Quản lý Bản nháp (Drafts)
// Send existing draft (POST /drafts/{draft_id}/send)
export const sendDraft = async (draftId: string, subject?: string, body?: string, recipient?: string) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    // Tạo FormData nếu có nội dung đã chỉnh sửa
    let requestBody = null;
    let headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
    };

    if (subject || body || recipient) {
      const formData = new FormData();
      if (subject) formData.append('subject', subject);
      if (body) formData.append('body', body);
      if (recipient) formData.append('recipient', recipient);
      requestBody = formData;
    } else {
      headers['Content-Type'] = 'application/json';
    }

    //Nếu người dùng có chỉnh sửa (subject, body, recipient khác null), nó dùng FormData để gửi cập nhật. Nếu không sửa gì (gửi nguyên bản), nó chỉ gửi request JSON đơn giản hoặc header.

    const response = await fetch(`${API_BASE_URL}/drafts/${draftId}/send`, {
      method: 'POST',
      headers: headers,
      body: requestBody,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send draft');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending draft:', error);
    throw error;
  }
};

// Update existing draft (PUT /drafts/{draft_id})
export const updateDraft = async (draftId: string, to: string, subject: string, body: string) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const formData = new FormData();
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('body', body);

    const response = await fetch(`${API_BASE_URL}/drafts/${draftId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update draft');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating draft:', error);
    throw error;
  }
};

// Get draft detail (GET /drafts/{draft_id})
export const getDraftDetail = async (draftId: string) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/drafts/${draftId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get draft detail');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting draft detail:', error);
    throw error;
  }
};

// Delete draft (DELETE /drafts/{draft_id})
export const deleteDraft = async (draftId: string) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/drafts/${draftId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete draft');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting draft:', error);
    throw error;
  }
};

// Get all drafts for current user (check which have drafts)
export const getAllDrafts = async () => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/drafts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch drafts');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching drafts:', error);
    throw error;
  }
};

// 8. Get sent email from server (Lấy Email đã gửi từ hệ thống)
export const getSentEmails = async () => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/drafts/sent-emails`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch sent emails');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching sent emails:', error);
    throw error;
  }
};