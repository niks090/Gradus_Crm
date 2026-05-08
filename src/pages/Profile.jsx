import { useState, useEffect } from 'react';
import { User, Mail, Lock, Shield, Save, CheckCircle, Camera } from 'lucide-react';
import { databaseService } from '../services/databaseService';
import './TablePages.css';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    photo: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (storedUser._id) {
      // Re-fetch from DB to get the most up-to-date info (including password)
      const loadUser = async () => {
        const allUsers = await databaseService.fetchUsers();
        const found = allUsers.find(u => u._id === storedUser._id);
        if (found) {
          setUser(found);
          setFormData({
            name: found.name,
            email: found.email,
            password: found.password,
            confirmPassword: found.password,
            photo: found.photo || ''
          });
        }
      };
      loadUser();
    }
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsSaving(false);
      return;
    }

    try {
      await databaseService.updateUser(user._id, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        photo: formData.photo
      });

      // Update local storage too
      const updatedUser = { ...user, name: formData.name, email: formData.email, photo: formData.photo };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update profile. Email might already be in use.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Account</h1>
        <p>Manage your personal profile and security settings.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        {/* Profile Sidebar Card */}
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div 
            style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--color-primary)', 
              color: 'white', 
              fontSize: '2.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem',
              fontWeight: 'bold',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              border: '4px solid var(--border-color)'
            }}
            onClick={() => document.getElementById('photoInput').click()}
          >
            {formData.photo ? (
              <img src={formData.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              formData.name.charAt(0)
            )}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: 'white',
              fontSize: '0.7rem',
              padding: '4px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}>
              <Camera size={12} /> Edit
            </div>
          </div>
          <input 
            type="file" 
            id="photoInput" 
            style={{ display: 'none' }} 
            accept="image/*" 
            onChange={handlePhotoUpload} 
          />
          <h2 style={{ marginBottom: '0.5rem' }}>{formData.name}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{user.role}</p>
          
          <div style={{ textAlign: 'left', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <Shield size={16} /> <span>Account Type: <strong>{user.role}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <CheckCircle size={16} style={{ color: '#10b981' }} /> <span>Status: <strong>{user.status}</strong></span>
            </div>
          </div>
        </div>

        {/* Edit Form Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="form-group">
                <label><User size={14} style={{ marginRight: '4px' }} /> Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label><Mail size={14} style={{ marginRight: '4px' }} /> Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  readOnly={user.role !== 'Admin'}
                  style={{ 
                    cursor: user.role !== 'Admin' ? 'not-allowed' : 'text',
                    backgroundColor: user.role !== 'Admin' ? '#f3f4f6' : '#fff'
                  }}
                  required 
                />
              </div>
              <div className="form-group">
                <label><Lock size={14} style={{ marginRight: '4px' }} /> New Password</label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label><Lock size={14} style={{ marginRight: '4px' }} /> Confirm Password</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
            </div>

            {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              
              {showSuccess && (
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: '500' }}>
                  <CheckCircle size={16} /> Profile updated successfully!
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
