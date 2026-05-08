import { useState } from 'react';
import { Search, CheckCircle, Upload } from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import './TablePages.css';

export default function Onboarding() {
  const { leads, onboardings, addOnboarding } = useCrm();
  const [searchNumber, setSearchNumber] = useState('');
  const [searchedLead, setSearchedLead] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOnboarding, setSelectedOnboarding] = useState(null);
  const [viewerImage, setViewerImage] = useState(null);
  
  const [formData, setFormData] = useState({
    feesPaid: '',
    recoveryAmount: '',
    recoveryDate: '',
    screenshotUrls: [], // Initialized as array
    paymentGateway: 'Razorpay', // Default
    razorpayAmount: '',
    propelledAmount: ''
  });

  const totalFees = (Number(formData.feesPaid) || 0) + (Number(formData.recoveryAmount) || 0);

  const handleSearch = (e) => {
    e.preventDefault();
    setHasSearched(true);
    // Search by exact match or substring
    const found = leads.find(l => l.mobile.includes(searchNumber));
    setSearchedLead(found || null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'recoveryAmount' && (Number(value) <= 0 || value === '')) {
      setFormData(prev => ({ ...prev, [name]: value, recoveryDate: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ 
            ...prev, 
            screenshotUrls: [...prev.screenshotUrls, reader.result] 
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleOnboard = async (e) => {
    e.preventDefault();
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : { name: 'Admin' };
    
    const newOnboarding = {
      leadId: searchedLead.leadId || searchedLead.id,
      name: searchedLead.name,
      mobile: searchedLead.mobile,
      email: searchedLead.email,
      state: searchedLead.state,
      profession: searchedLead.profession,
      bdm: searchedLead.bdm,
      ...formData,
      totalFees,
      onboardDate: new Date().toISOString(),
      processedBy: user.name
    };
    
    await addOnboarding(newOnboarding);
    setIsModalOpen(false);
    setSearchedLead(null);
    setSearchNumber('');
    setHasSearched(false);
    setFormData({ 
      feesPaid: '', 
      recoveryAmount: '', 
      recoveryDate: '', 
      screenshotUrls: [],
      paymentGateway: 'Razorpay',
      razorpayAmount: '',
      propelledAmount: ''
    });
  };

  const exportToCSV = () => {
    if (onboardings.length === 0) return;

    const headers = [
      'Date', 'Lead ID', 'Name', 'Mobile', 'Email', 'State', 'Profession', 'Assigned BDM', 
      'Total Fees', 'Fees Paid', 'Recovery Amount', 'Recovery Date', 'Payment Gateway', 
      'Razorpay Amount', 'Propelled Amount', 'Screenshots Attached'
    ];

    const rows = onboardings.map(ob => [
      new Date(ob.onboardDate).toLocaleDateString(),
      ob.leadId ? `\t${ob.leadId}` : '',
      ob.name || '',
      ob.mobile ? `\t${ob.mobile}` : '',
      ob.email || '',
      ob.state || '',
      ob.profession || '',
      ob.bdm || '',
      ob.totalFees || 0,
      ob.feesPaid || 0,
      ob.recoveryAmount || 0,
      ob.recoveryDate || 'N/A',
      ob.paymentGateway || '',
      ob.razorpayAmount || 0,
      ob.propelledAmount || 0,
      ob.screenshotUrls ? ob.screenshotUrls.length : 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Onboardings_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'Admin';

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h1>Onboarding</h1>
          <p>{isAdmin ? 'Search leads by number to complete onboarding.' : 'View your recent successful onboardings.'}</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="search-wrapper" style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9aa5be' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Search by Mobile Number..." 
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
                style={{ paddingLeft: '38px', height: '40px', width: '100%' }} 
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '40px' }}>Search Lead</button>
          </form>

          {hasSearched && (
            <div style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--color-background)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {searchedLead ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{searchedLead.name}</h3>
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      <span><strong>Phone:</strong> {searchedLead.mobile}</span>
                      <span><strong>Email:</strong> {searchedLead.email}</span>
                      <span><strong>Status:</strong> {searchedLead.status1 || 'None'}</span>
                    </div>
                  </div>
                  {searchedLead.status1 === 'SALE' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: '600' }}>
                      <CheckCircle size={20} /> Already Onboarded
                    </div>
                  ) : (
                    <button className="btn btn-primary" onClick={() => {
                      const cleanCtc = searchedLead.ctc ? searchedLead.ctc.replace(/[^0-9]/g, '') : '';
                      setFormData(prev => ({ ...prev, feesPaid: cleanCtc }));
                      setIsModalOpen(true);
                    }}>
                      <CheckCircle size={16} /> Onboard Lead
                    </button>
                  )}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>No lead found with this number.</p>
              )}
            </div>
          )}
        </div>
      

      <div className="card table-card">
        <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Recent Onboardings</h3>
          {isAdmin && (
            <button 
              className="btn btn-secondary" 
              onClick={exportToCSV}
              disabled={onboardings.length === 0}
              style={{ fontSize: '0.875rem', padding: '6px 12px' }}
            >
              Export to CSV
            </button>
          )}
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>NAME</th>
                <th>TOTAL FEES</th>
                <th>GATEWAY</th>
                <th>RECOVERY AMT</th>
                <th>RECOVERY DATE</th>
                <th>SCREENSHOTS</th>
              </tr>
            </thead>
            <tbody>
              {onboardings.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No onboardings yet.</td></tr>
              ) : (
                onboardings.map(ob => (
                  <tr key={ob.id}>
                    <td>{new Date(ob.onboardDate).toLocaleDateString()}</td>
                    <td 
                      className="font-medium" 
                      style={{ cursor: 'pointer', color: 'var(--color-primary)', textDecoration: 'underline' }} 
                      onClick={() => setSelectedOnboarding(ob)}
                    >
                      {ob.name}
                    </td>
                    <td style={{ color: 'var(--color-primary)', fontWeight: '600' }}>₹{ob.totalFees}</td>
                    <td>{ob.paymentGateway}</td>
                    <td>₹{ob.recoveryAmount}</td>
                    <td>{ob.recoveryDate}</td>
                    <td>
                      {ob.screenshotUrls && ob.screenshotUrls.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {ob.screenshotUrls.map((url, idx) => (
                            <button 
                              key={idx} 
                              className="btn-link"
                              style={{ fontSize: '0.75rem', padding: 0 }}
                              onClick={() => setViewerImage(url)}
                            >
                              View {idx + 1}
                            </button>
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && searchedLead && (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '700px' }}>
              <div className="modal-header">
                <h2>Onboard {searchedLead.name}</h2>
                <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
              </div>

              {/* Lead Details Summary */}
              <div className="lead-summary-box" style={{ 
                backgroundColor: 'var(--color-background)', 
                padding: '1.2rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem',
                border: '1px solid var(--border-color)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <div style={{ fontSize: '0.875rem' }}>
                  <p style={{ margin: '0 0 4px 0' }}><strong style={{ color: 'var(--text-secondary)' }}>Lead ID:</strong> {searchedLead.leadId}</p>
                  <p style={{ margin: '0 0 4px 0' }}><strong style={{ color: 'var(--text-secondary)' }}>Mobile:</strong> {searchedLead.mobile}</p>
                  <p style={{ margin: '0 0 4px 0' }}><strong style={{ color: 'var(--text-secondary)' }}>Email:</strong> {searchedLead.email}</p>
                </div>
                <div style={{ fontSize: '0.875rem' }}>
                  <p style={{ margin: '0 0 4px 0' }}><strong style={{ color: 'var(--text-secondary)' }}>Location:</strong> {searchedLead.state}</p>
                  <p style={{ margin: '0 0 4px 0' }}><strong style={{ color: 'var(--text-secondary)' }}>Profession:</strong> {searchedLead.profession}</p>
                  <p style={{ margin: '0 0 4px 0' }}><strong style={{ color: 'var(--text-secondary)' }}>Assigned BDM:</strong> {searchedLead.bdm}</p>
                </div>
              </div>

              <form onSubmit={handleOnboard}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Fees Paid Amount*</label>
                  <input type="number" name="feesPaid" value={formData.feesPaid} onChange={handleInputChange} required placeholder="Enter amount" />
                </div>
                <div className="form-group">
                  <label>Recovery Amount*</label>
                  <input type="number" name="recoveryAmount" value={formData.recoveryAmount} onChange={handleInputChange} required placeholder="Enter recovery amount" />
                </div>
                <div className="form-group">
                  <label>Recovery Date{Number(formData.recoveryAmount) > 0 && '*'}</label>
                  <input 
                    type="date" 
                    name="recoveryDate" 
                    value={formData.recoveryDate} 
                    onChange={handleInputChange} 
                    required={Number(formData.recoveryAmount) > 0} 
                    disabled={Number(formData.recoveryAmount) <= 0}
                    style={Number(formData.recoveryAmount) <= 0 ? { backgroundColor: 'var(--color-surface-hover)', cursor: 'not-allowed', opacity: 0.6 } : {}}
                  />
                </div>
                <div className="form-group">
                  <label>Total Fees (Auto)</label>
                  <input type="text" value={`₹${totalFees}`} disabled style={{ backgroundColor: 'var(--color-surface-hover)', fontWeight: 'bold', color: 'var(--color-primary)' }} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Payment Gateway*</label>
                  <select name="paymentGateway" value={formData.paymentGateway} onChange={handleInputChange} required className="input-field">
                    <option value="Razorpay">Razorpay</option>
                    <option value="Propelled">Propelled</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                {(formData.paymentGateway === 'Razorpay' || formData.paymentGateway === 'Both') && (
                  <div className="form-group">
                    <label>Razorpay Amount*</label>
                    <input type="number" name="razorpayAmount" value={formData.razorpayAmount} onChange={handleInputChange} required placeholder="Enter Razorpay amount" />
                  </div>
                )}

                {(formData.paymentGateway === 'Propelled' || formData.paymentGateway === 'Both') && (
                  <div className="form-group">
                    <label>Propelled Amount*</label>
                    <input type="number" name="propelledAmount" value={formData.propelledAmount} onChange={handleInputChange} required placeholder="Enter Propelled amount" />
                  </div>
                )}

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Payment Screenshot(s)*</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                        <Upload size={16} /> Choose File(s)
                        <input type="file" accept="image/*" multiple onChange={handleFileUpload} style={{ display: 'none' }} required={formData.screenshotUrls.length === 0} />
                      </label>
                      {formData.screenshotUrls.length > 0 && (
                        <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: '600' }}>
                          {formData.screenshotUrls.length} file(s) selected
                        </span>
                      )}
                    </div>
                    {formData.screenshotUrls.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {formData.screenshotUrls.map((url, idx) => (
                          <div key={idx} style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <img src={url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button 
                              type="button" 
                              onClick={() => setFormData(prev => ({ ...prev, screenshotUrls: prev.screenshotUrls.filter((_, i) => i !== idx) }))}
                              style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(239, 68, 68, 0.8)', color: 'white', border: 'none', width: '16px', height: '16px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Complete Onboarding</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOnboarding && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>Onboarding Details: {selectedOnboarding.name}</h2>
              <button className="modal-close" onClick={() => setSelectedOnboarding(null)}>&times;</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '1rem 0' }}>
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Client Profile</h3>
                <p style={{ margin: '0 0 8px 0' }}><strong>Lead ID:</strong> {selectedOnboarding.leadId}</p>
                <p style={{ margin: '0 0 8px 0' }}><strong>Mobile:</strong> {selectedOnboarding.mobile}</p>
                <p style={{ margin: '0 0 8px 0' }}><strong>Email:</strong> {selectedOnboarding.email}</p>
                <p style={{ margin: '0 0 8px 0' }}><strong>Location:</strong> {selectedOnboarding.state}</p>
                <p style={{ margin: '0 0 8px 0' }}><strong>Profession:</strong> {selectedOnboarding.profession}</p>
                <p style={{ margin: '0 0 8px 0' }}><strong>Assigned BDM:</strong> {selectedOnboarding.bdm}</p>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Payment Summary</h3>
                <p style={{ margin: '0 0 8px 0' }}><strong>Total Fees:</strong> <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>₹{selectedOnboarding.totalFees}</span></p>
                <p style={{ margin: '0 0 8px 0' }}><strong>Fees Paid:</strong> ₹{selectedOnboarding.feesPaid}</p>
                <p style={{ margin: '0 0 8px 0' }}><strong>Recovery Amount:</strong> ₹{selectedOnboarding.recoveryAmount}</p>
                <p style={{ margin: '0 0 8px 0' }}><strong>Recovery Date:</strong> {selectedOnboarding.recoveryDate || 'N/A'}</p>
                <p style={{ margin: '0 0 8px 0' }}><strong>Payment Gateway:</strong> {selectedOnboarding.paymentGateway}</p>
                {(selectedOnboarding.paymentGateway === 'Razorpay' || selectedOnboarding.paymentGateway === 'Both') && (
                  <p style={{ margin: '0 0 8px 0' }}><strong>Razorpay Amount:</strong> ₹{selectedOnboarding.razorpayAmount}</p>
                )}
                {(selectedOnboarding.paymentGateway === 'Propelled' || selectedOnboarding.paymentGateway === 'Both') && (
                  <p style={{ margin: '0 0 8px 0' }}><strong>Propelled Amount:</strong> ₹{selectedOnboarding.propelledAmount}</p>
                )}
                
                <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-surface-hover)', borderRadius: '6px' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem' }}><strong>Processed On:</strong> {new Date(selectedOnboarding.onboardDate).toLocaleString()}</p>
                  <p style={{ margin: '0', fontSize: '0.85rem' }}><strong>Processed By:</strong> {selectedOnboarding.processedBy || 'Admin'}</p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Attached Screenshots</h3>
              {selectedOnboarding.screenshotUrls && selectedOnboarding.screenshotUrls.length > 0 ? (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {selectedOnboarding.screenshotUrls.map((url, idx) => (
                    <div 
                      key={idx} 
                      className="cursor-pointer"
                      style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', width: '120px', height: '120px' }}
                      onClick={() => setViewerImage(url)}
                    >
                      <img src={url} alt={`Screenshot ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>No screenshots attached.</p>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '2rem' }}>
              <button className="btn btn-primary" onClick={() => setSelectedOnboarding(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {viewerImage && (
        <div className="modal-overlay" onClick={() => setViewerImage(null)} style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div 
            className="viewer-modal-container" 
            style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              className="modal-close" 
              onClick={() => setViewerImage(null)}
              style={{ position: 'fixed', top: '20px', right: '20px', color: 'white', fontSize: '40px', border: 'none', background: 'none', cursor: 'pointer', zIndex: 4001 }}
            >
              &times;
            </button>
            <div style={{ overflowY: 'auto', maxWidth: '900px', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
              <img 
                src={viewerImage} 
                alt="Screenshot Viewer" 
                style={{ width: '100%', height: 'auto', display: 'block' }} 
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
