import { useState } from 'react';
import { useCrm } from '../context/CrmContext';
import './TablePages.css';

export default function Contacts() {
  const { contacts, addContact } = useCrm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', title: '', company: '', phone: '', email: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    addContact(formData);
    setIsModalOpen(false);
    setFormData({ name: '', title: '', company: '', phone: '', email: '' });
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'Admin';

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h1>Contacts</h1>
          <p>Your address book of established customers.</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>Add Contact</button>}
      </div>

      <div className="card table-card">
        <div className="table-toolbar">
          <div className="input-group">
            <input type="text" className="input-field" placeholder="Search contacts..." />
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(contact => (
                <tr key={contact.id}>
                  <td className="font-medium">{contact.name}</td>
                  <td>{contact.title}</td>
                  <td>{contact.company}</td>
                  <td>{contact.email}</td>
                  <td>{contact.phone}</td>
                  <td>
                    <button className="btn-link">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Contact</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
