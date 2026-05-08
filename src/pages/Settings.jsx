import { useState, useEffect } from 'react';
import { 
  User, Lock, Bell, Shield, Palette, 
  Camera, CheckCircle, AlertCircle, Save 
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { databaseService } from '../services/databaseService';
import './TablePages.css';

export default function Settings() {
  const { 
    themeMode, setThemeMode, themeColor, setThemeColor, themeType, setThemeType 
  } = useCrm();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [profileData, setProfileData] = useState({
    name: user.name || '',
    email: user.email || '',
    photo: user.photo || ''
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In a real app, we'd update the DB. For now, we update local storage and simulate.
      const updatedUser = { ...user, ...profileData };
      
      // Update in our mock DB (Users store)
      const allUsers = await databaseService.fetchUsers();
      const userInDb = allUsers.find(u => u.email === user.email);
      if (userInDb) {
        await databaseService.updateUser(userInDb._id, profileData);
      }

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match!' });
      return;
    }

    setLoading(true);
    try {
      // Simulate password check and update
      await databaseService.updateUserPassword(user.email, passwordData.current, passwordData.new);
      setPasswordData({ current: '', new: '', confirm: '' });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account preferences and security settings.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem', marginTop: '1rem' }}>
        {/* Sidebar Tabs */}
        <div className="card" style={{ padding: '1rem', height: 'fit-content' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-link'}`}
              onClick={() => setActiveTab('profile')}
              style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '12px' }}
            >
              <User size={18} style={{ marginRight: '10px' }} /> Profile
            </button>
            <button 
              className={`btn ${activeTab === 'security' ? 'btn-primary' : 'btn-link'}`}
              onClick={() => setActiveTab('security')}
              style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '12px' }}
            >
              <Lock size={18} style={{ marginRight: '10px' }} /> Security
            </button>
            <button 
              className={`btn ${activeTab === 'appearance' ? 'btn-primary' : 'btn-link'}`}
              onClick={() => setActiveTab('appearance')}
              style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '12px' }}
            >
              <Palette size={18} style={{ marginRight: '10px' }} /> Appearance
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="card" style={{ padding: '2rem' }}>
          {message && (
            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate}>
              <h3 style={{ marginBottom: '1.5rem' }}>Public Profile</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f1f5f9', border: '2px solid var(--color-primary)' }}>
                    {profileData.photo ? (
                      <img src={profileData.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#94a3b8' }}>
                        {profileData.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <label 
                    style={{ 
                      position: 'absolute', bottom: '0', right: '0', 
                      backgroundColor: 'var(--color-primary)', color: 'white', 
                      width: '32px', height: '32px', borderRadius: '50%', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', border: '2px solid white'
                    }}
                  >
                    <Camera size={16} />
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                  </label>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0' }}>Profile Picture</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>PNG, JPG or GIF. Max 2MB.</p>
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    value={profileData.email}
                    disabled
                    style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Email cannot be changed manually. Contact admin.</span>
                </div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Save size={18} style={{ marginRight: '8px' }} /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordUpdate}>
              <h3 style={{ marginBottom: '1.5rem' }}>Change Password</h3>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input 
                    type="password" 
                    className="input-field" 
                    value={passwordData.current}
                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    className="input-field" 
                    value={passwordData.new}
                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input 
                    type="password" 
                    className="input-field" 
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Shield size={18} style={{ marginRight: '8px' }} /> {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'appearance' && (
            <div>
              <h3 style={{ marginBottom: '1.5rem' }}>Appearance Settings</h3>
              
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '600' }}>Theme Mode</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div 
                    className={`mode-card ${themeMode === 'day' ? 'active' : ''}`}
                    onClick={() => setThemeMode('day')}
                    style={{ 
                      flex: 1, padding: '1.5rem', borderRadius: '12px', 
                      border: themeMode === 'day' ? '2px solid var(--color-primary)' : '1px solid #e2e8f0',
                      cursor: 'pointer', textAlign: 'center'
                    }}
                  >
                    <div style={{ marginBottom: '10px' }}><Palette size={24} style={{ color: '#f59e0b' }} /></div>
                    <div style={{ fontWeight: '600' }}>Day Mode</div>
                  </div>
                  <div 
                    className={`mode-card ${themeMode === 'night' ? 'active' : ''}`}
                    onClick={() => setThemeMode('night')}
                    style={{ 
                      flex: 1, padding: '1.5rem', borderRadius: '12px', 
                      border: themeMode === 'night' ? '2px solid var(--color-primary)' : '1px solid #e2e8f0',
                      cursor: 'pointer', textAlign: 'center', backgroundColor: '#0f172a', color: 'white'
                    }}
                  >
                    <div style={{ marginBottom: '10px' }}><Palette size={24} style={{ color: '#38bdf8' }} /></div>
                    <div style={{ fontWeight: '600' }}>Night Mode</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '600' }}>Primary Theme Color</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {['#4f8ef7', '#0d9488', '#166534', '#a16207', '#b45309', '#c2410c', '#b91c1c', '#831843', '#4c1d95'].map(color => (
                    <div 
                      key={color}
                      onClick={() => setThemeColor(color)}
                      style={{ 
                        width: '40px', height: '40px', borderRadius: '50%', 
                        backgroundColor: color, cursor: 'pointer',
                        border: themeColor === color ? '3px solid white' : 'none',
                        outline: themeColor === color ? `2px solid ${color}` : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
