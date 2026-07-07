import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username.trim() || !email.trim()) { setError('Username and email required'); return; }
    if (newPassword && newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setSaving(true);
    try {
      if (avatar) {
        const fd = new FormData();
        fd.append('username', username);
        fd.append('email', email);
        fd.append('bio', bio);
        fd.append('avatar', avatar);
        if (currentPassword && newPassword) {
          fd.append('currentPassword', currentPassword);
          fd.append('newPassword', newPassword);
        }
        await updateProfile(fd);
      } else {
        const data: any = { username, email, bio };
        if (currentPassword && newPassword) {
          data.currentPassword = currentPassword;
          data.newPassword = newPassword;
        }
        await updateProfile(data);
      }
      setSuccess('Profile updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <h1>Settings</h1>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleSubmit}>
        <div className="settings-avatar">
          <img
            src={avatarPreview || `https://ui-avatars.com/api/?name=${username}&background=red&color=fff&size=128`}
            alt=""
          />
          <label className="change-btn">
            Change Avatar
            <input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setAvatar(f); setAvatarPreview(URL.createObjectURL(f)); }
            }} hidden />
          </label>
        </div>
        <div className="settings-field">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="settings-field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="settings-field">
          <label>Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={500} placeholder="Tell viewers about your channel..." />
        </div>
        <hr />
        <h3>Change Password</h3>
        <div className="settings-field">
          <label>Current Password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="settings-field">
          <label>New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} />
        </div>
        <div className="settings-field">
          <label>Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </form>
    </div>
  );
}
