'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { fetchUserProfile, updateUserProfile, deleteUserAccount, logout, getAuthToken } from '@/services/api';

export default function SettingsPage() {
  const router = useRouter();
  interface UserProfile {
    id: string;
    email: string;
    name: string;
    picture?: string;
  }

  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    // Check authentication
    const token = getAuthToken();
    if (!token) {
      router.push('/');
      return;
    }

    // Load user profile
    loadUserProfile();
  }, [router]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const profile = await fetchUserProfile();
      setUserProfile(profile);
      setEditName(profile.name || '');
    } catch (error: unknown) {
      console.error('Error loading user profile:', error);
      if (error instanceof Error && error.message.includes('Authentication')) {
        router.push('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncEmails = async () => {
    setIsSyncing(true);
    // Simulate email sync
    setTimeout(() => {
      setIsSyncing(false);
      alert('Đồng bộ email thành công!');
    }, 2000);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await updateUserProfile(editName, userProfile?.picture);
      if (userProfile) {
        setUserProfile({ ...userProfile, name: editName });
      }
      setIsEditing(false);
      alert('Cập nhật thông tin thành công!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      alert('Lỗi: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác!')) {
      return;
    }

    try {
      await deleteUserAccount();
      alert('Tài khoản đã được xóa thành công.');
      router.push('/');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      alert('Lỗi: ' + errorMessage);
    }
  };

  const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      logout();
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">
              Cài đặt
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Quản lý tài khoản và tùy chỉnh ứng dụng
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {/* User Information */}
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Thông tin người dùng
              </h2>
              {isLoading ? (
                <div className="animate-pulse flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ) : userProfile ? (
                <>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      {userProfile.picture ? (
                        <img src={userProfile.picture} alt={userProfile.name} className="w-full h-full rounded-full" />
                      ) : (
                        <span className="text-white font-medium text-xl">
                          {userProfile.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="text-lg font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full"
                        />
                      ) : (
                        <h3 className="text-lg font-medium text-gray-900">
                          {userProfile.name || 'Người dùng'}
                        </h3>
                      )}
                      <p className="text-gray-500">
                        {userProfile.email}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        ✓ Đã kết nối với Gmail
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isSaving ? 'Đang lưu...' : 'Lưu'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditName(userProfile.name || '');
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          Hủy
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        Chỉnh sửa
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-red-600">Không thể tải thông tin người dùng</p>
              )}
            </div>

            {/* Email Sync */}
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Đồng bộ Email
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Lần đồng bộ cuối
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date().toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={handleSyncEmails}
                    disabled={isSyncing}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSyncing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang đồng bộ...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Đồng bộ ngay
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="ml-3">
                      {/* <h3 className="text-sm font-medium text-blue-800">
                        Tự động đồng bộ đã bật
                      </h3> */}
                      <p className="mt-1 text-sm text-blue-700">
                        Email của bạn được tự động đồng bộ mỗi 15 phút
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="p-6">
              <div className="space-y-4">
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Đăng xuất
                </button>
                
                <button
                  onClick={handleDeleteAccount}
                  className="inline-flex items-center px-4 py-2 border border-red-600 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Xóa tài khoản
                </button>
              </div>
              <div className="text-center mt-4">
                <button
                  onClick={() => router.push('/workspace')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Trở về trang làm việc
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Workspace */}
      </div>
    </div>
  );
}