// client/src/pages/ProfilePage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import { useAuth } from '../app/AuthContext';
import { clearAccessToken } from '../lib/tokenStore';
import { useToast } from '../app/ToastContext';

export default function ProfilePage() {
  const { showToast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    apiClient.get('/profile').then(({ data }) => {
      setProfile(data.user);
      setName(data.user.name);
    });
  }, []);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaveMessage('');
    try {
      const { data } = await apiClient.patch('/profile', { name });
      setProfile(data.user);
     setSaveMessage('Profile updated.');
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordMessage('');
    try {
      await apiClient.post('/profile/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordMessage('Password changed. Please log in again.');
      showToast('Password changed. Please log in again.', 'success');
      setTimeout(async () => {
        await logout();
        navigate('/login');
      }, 1500);
    } catch (err) {
      setPasswordMessage(err.response?.data?.message || 'Failed to change password.');
    }
  }

  async function handleDeleteAccount() {
    await apiClient.delete('/profile');
    clearAccessToken();
    navigate('/');
  }

  if (!profile) return <div className="p-6 text-gray-500">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Profile Settings</h1>

      <form onSubmit={handleSaveProfile} className="glass rounded-2xl shadow-soft p-6 space-y-4">
        <h2 className="font-medium">Basic Info</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            value={profile.email}
            disabled
            className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 px-4 py-2 text-gray-500"
          />
        </div>
        {saveMessage && <p className="text-sm text-primary">{saveMessage}</p>}
        <button className="rounded-xl bg-primary text-white px-4 py-2 text-sm font-medium shadow-soft hover:bg-primary-600 transition">
          Save Changes
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="glass rounded-2xl shadow-soft p-6 space-y-4">
        <h2 className="font-medium">Change Password</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Current Password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 px-4 py-2"
          />
        </div>
        {passwordMessage && <p className="text-sm text-primary">{passwordMessage}</p>}
        <button className="rounded-xl bg-primary text-white px-4 py-2 text-sm font-medium shadow-soft hover:bg-primary-600 transition">
          Change Password
        </button>
      </form>

      <div className="glass rounded-2xl shadow-soft p-6 space-y-3 border border-danger/30">
        <h2 className="font-medium text-danger">Danger Zone</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Deleting your account is permanent and cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-xl border border-danger text-danger px-4 py-2 text-sm font-medium hover:bg-danger/10 transition"
          >
            Delete Account
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleDeleteAccount}
              className="rounded-xl bg-danger text-white px-4 py-2 text-sm font-medium hover:bg-red-600 transition"
            >
              Yes, delete permanently
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}