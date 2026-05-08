import { useState, useRef, useEffect } from 'react';
import { FileText, Download, Eye, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { databaseService } from '../services/databaseService';
import './TablePages.css';

export default function Brochures() {
  const { themeColor } = useCrm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [brochures, setBrochures] = useState([]);
  
  // Load heavy data from IndexedDB asynchronously so UI doesn't freeze
  useEffect(() => {
    const loadBrochures = async () => {
      const data = await databaseService.fetchBrochures();
      setBrochures(data);
    };
    loadBrochures();
  }, []);

  const [formData, setFormData] = useState({ title: '', url: '' });
  const fileInputRef = useRef(null);

  // Simple Admin Check
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Admin';

  // Removed saveToLocal since databaseService handles persistence

  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, url: event.target.result }));
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [viewingBrochure, setViewingBrochure] = useState(null);

  const handleAddBrochure = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!formData.title || !formData.url) return;

    // Send the heavy file base64 directly to our new IndexedDB Engine
    const newRecord = await databaseService.createBrochure({
      title: formData.title,
      url: formData.url,
      date: new Date().toISOString().split('T')[0]
    });
    
    // UI update
    setBrochures([newRecord, ...brochures]);
    
    setIsModalOpen(false);
    setFormData({ title: '', url: '' });
    
    // Show center success modal
    setShowSuccessModal(true);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to delete this brochure?')) {
      // Delete from real DB (which moves it to the Master Archive internally)
      await databaseService.deleteBrochure(id);
      
      // Remove from UI
      setBrochures(brochures.filter(b => b._id != id && b.id != id));
    }
  };

  const handleView = (brochure) => {
    if (!brochure || !brochure.url) return;
    setViewingBrochure(brochure);
  };

  return (
    <div className="page-container">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
            <div style={{ 
              width: '64px', height: '64px', borderRadius: '50%', 
              backgroundColor: '#dcfce7', color: '#22c55e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <ShieldAlert size={32} style={{ display: 'none' }} /> {/* Just to keep the import used if it was */}
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h2 style={{ marginBottom: '0.5rem', color: '#166534' }}>Saved Successfully!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Your brochure has been uploaded and is now available.
            </p>
            <button className="btn btn-primary" onClick={() => setShowSuccessModal(false)} style={{ width: '100%' }}>
              Okay
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {viewingBrochure && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '80%', height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2>Preview: {viewingBrochure.title}</h2>
              <button className="modal-close" onClick={() => setViewingBrochure(null)}>&times;</button>
            </div>
            <div style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '0 0 8px 8px', overflow: 'hidden', position: 'relative' }}>
               {viewingBrochure.url.includes('image') || viewingBrochure.url.startsWith('data:image') ? (
                 <img src={viewingBrochure.url} alt={viewingBrochure.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
               ) : (
                 <iframe 
                   src={viewingBrochure.url} 
                   style={{ width: '100%', height: '100%', border: 'none' }}
                   title={viewingBrochure.title}
                 />
               )}
            </div>
          </div>
        </div>
      )}

      <div className="page-header flex-between">
        <div>
          <h1>Brochures</h1>
          <p>View and download course brochures and documents.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Add Brochure
          </button>
        )}
      </div>

      <div className="brochure-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '1.5rem',
        marginTop: '1.5rem' 
      }}>
        {brochures.length === 0 ? (
          <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No brochures available yet.</p>
            {isAdmin && <p style={{ fontSize: '0.875rem' }}>Click "Add Brochure" to upload your first course document.</p>}
          </div>
        ) : (
          brochures.map(brochure => (
            <div key={brochure._id || brochure.id} className="card brochure-card" style={{ padding: '1.25rem', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '8px', 
                  backgroundColor: 'var(--color-background)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--color-primary)'
                }}>
                  <FileText size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>{brochure.title}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Uploaded on {brochure.date}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                  onClick={() => handleView(brochure)}
                  className="btn btn-secondary" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.875rem' }}
                >
                  <Eye size={16} /> View
                </button>
                <a 
                  href={brochure.url} 
                  download={`${brochure.title.replace(/\s+/g, '_')}.pdf`}
                  className="btn btn-primary" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.875rem' }}
                >
                  <Download size={16} /> Download
                </a>
              </div>

              {isAdmin && (
                <button 
                  onClick={() => handleDelete(brochure._id || brochure.id)}
                  style={{ 
                    position: 'absolute', 
                    top: '10px', 
                    right: '10px', 
                    background: 'none', 
                    border: 'none', 
                    color: '#ef4444', 
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title="Delete Brochure"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {!isAdmin && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          backgroundColor: '#fffbeb', 
          border: '1px solid #fef3c7', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#92400e',
          fontSize: '0.875rem'
        }}>
          <ShieldAlert size={18} />
          <span>Note: Only administrators can add or remove brochures.</span>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>Add New Brochure</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddBrochure}>
              <div className="form-group">
                <label>Course / Brochure Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Full Stack Web Development" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>Upload Brochure (PDF/Image)</label>
                <div style={{ 
                  border: '2px dashed var(--border-color)', 
                  padding: '2rem', 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  backgroundColor: formData.url ? '#f0fdf4' : 'transparent',
                  borderColor: formData.url ? '#22c55e' : 'var(--border-color)'
                }}>
                  <input 
                    type="file" 
                    id="brochure-upload"
                    accept=".pdf,image/*" 
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="brochure-upload" style={{ cursor: 'pointer' }}>
                    <div style={{ color: formData.url ? '#166534' : 'var(--color-primary)', fontWeight: '600' }}>
                      {formData.url ? '✅ File Selected' : 'Click to Upload Document'}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {formData.url ? 'Click again to change file' : 'PDF or Images only'}
                    </p>
                  </label>
                </div>
              </div>

              {uploading && <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', textAlign: 'center', marginTop: '1rem' }}>Processing file...</p>}
              
              <div className="modal-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setIsModalOpen(false);
                  setFormData({ title: '', url: '' });
                }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={uploading || !formData.url || !formData.title}>
                  {uploading ? 'Processing...' : 'Save Brochure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
