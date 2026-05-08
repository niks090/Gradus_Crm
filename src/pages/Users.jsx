import { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, UserCheck, UserX, Trash2, Edit2, ShieldAlert } from 'lucide-react';
import { databaseService } from '../services/databaseService';
import './TablePages.css';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'User', status: 'Active',
    smartflo_did: '', smartflo_agent: ''
  });
  const [editingUserId, setEditingUserId] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'Admin';

  const loadUsers = async () => {
    const data = await databaseService.fetchUsers();
    setUsers(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      if (editingUserId) {
        await databaseService.updateUser(editingUserId, formData);
        alert("User updated successfully!");
      } else {
        await databaseService.createUser(formData);
        alert("User created successfully!");
      }
      
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'User', status: 'Active', smartflo_did: '', smartflo_agent: '' });
      setEditingUserId(null);
      loadUsers(); // Refresh
    } catch (err) {
      console.error("User save failed:", err);
      alert(`Failed to save user: ${err.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (window.confirm("Are you sure you want to delete this user?")) {
      await databaseService.deleteUser(id);
      loadUsers();
    }
  };

  const handleEdit = (user) => {
    setEditingUserId(user._id);
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password, // Careful in real apps!
      role: user.role,
      status: user.status,
      smartflo_did: user.smartflo_did || '',
      smartflo_agent: user.smartflo_agent || ''
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (user) => {
    if (!isAdmin) return;
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    await databaseService.updateUser(user._id, { status: newStatus });
    loadUsers();
  };

  if (!isAdmin) {
    return (
      <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <ShieldAlert size={64} style={{ margin: '0 auto 1rem', color: '#ef4444' }} />
          <h2>Access Restricted</h2>
          <p>You need Administrator privileges to view and manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h1>Team Management</h1>
          <p>Manage CRM users, roles, and access permissions.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            setEditingUserId(null);
            setFormData({ name: '', email: '', password: '', role: 'User', status: 'Active' });
            setIsModalOpen(true);
          }}
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="card table-container">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>DID</th>
                <th>Agent No</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'Admin' ? 'badge-primary' : 'badge-secondary'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{user.smartflo_did || '-'}</td>
                  <td>{user.smartflo_agent || '-'}</td>
                  <td>{user.createdat ? new Date(user.createdat).toLocaleDateString() : '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px', backgroundColor: user.status === 'Active' ? '#fee2e2' : '#d1fae5', color: user.status === 'Active' ? '#991b1b' : '#065f46', border: 'none' }}
                        onClick={() => handleToggleStatus(user)}
                        title={user.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                      >
                        {user.status === 'Active' ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px' }}
                        onClick={() => handleEdit(user)}
                        title="Edit User"
                      >
                        <Edit2 size={16} />
                      </button>
                      {user.email !== 'admin@gradus.com' && (
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '6px' }}
                          onClick={() => handleDelete(user._id)}
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingUserId ? 'Edit User' : 'Add New User'}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Email Address *</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Password *</label>
                <input type="text" name="password" value={formData.password} onChange={handleInputChange} required />
              </div>
              <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label>Role</label>
                  <select name="role" value={formData.role} onChange={handleInputChange}>
                    <option value="User">User</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label>SmartFlo DID (Caller ID)</label>
                  <select name="smartflo_did" value={formData.smartflo_did} onChange={handleInputChange}>
                    <option value="">Select DID</option>
                    <option value="918065909568">918065909568</option>
                    <option value="918065909569">918065909569</option>
                    <option value="918065909570">918065909570</option>
                    <option value="918065909571">918065909571</option>
                    <option value="918065909572">918065909572</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>SmartFlo Agent No (Ext)</label>
                  <input type="text" name="smartflo_agent" value={formData.smartflo_agent} onChange={handleInputChange} placeholder="e.g. 101" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingUserId ? 'Update User' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
