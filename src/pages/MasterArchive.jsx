import { useState, useEffect } from 'react';
import { History, Search, Filter, ShieldAlert, User, Clock, Database, Copy, Download, ExternalLink, FileText, Check, SearchCode } from 'lucide-react';
import { databaseService } from '../services/databaseService';
import './TablePages.css';

export default function MasterArchive() {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'Admin';
  const isManager = currentUser.role === 'Manager';
  const isPowerUser = isAdmin || isManager;
  const [copySuccess, setCopySuccess] = useState(false);
  const [payloadSearch, setPayloadSearch] = useState('');

  useEffect(() => {
    const loadLogs = async () => {
      setIsLoading(true);
      const data = await databaseService.fetchMasterArchive();
      setLogs(data);
      setIsLoading(false);
    };
    loadLogs();
  }, []);

  const handleCopy = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog.payload, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownload = () => {
    if (!selectedLog) return;
    const blob = new Blob([JSON.stringify(selectedLog.payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_${selectedLog.table_name}_${selectedLog.action}_${selectedLog.payload?._id || 'log'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleNavigate = () => {
    if (!selectedLog || !selectedLog.table_name) return;
    const moduleMap = {
      'leads': '/leads',
      'users': '/users',
      'meetings': '/meetings',
      'targets': '/targets',
      'onboardings': '/onboarding'
    };
    const path = moduleMap[selectedLog.table_name.toLowerCase()];
    if (path) {
      window.location.hash = path;
      setIsModalOpen(false);
    } else {
      alert(`No direct view available for module: ${selectedLog.table_name}`);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.performedBy?.name?.toLowerCase() || 'system').includes(searchQuery.toLowerCase()) ||
      log.table_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    
    return matchesSearch && matchesAction;
  });

  if (!isPowerUser) {
    return (
      <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <ShieldAlert size={64} style={{ margin: '0 auto 1rem', color: '#ef4444' }} />
          <h2>Access Restricted</h2>
          <p>The Master Archive is an audit-only tool for Administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h1>Master Archive & Audit Logs</h1>
          <p>Real-time record of every change made by every user in the CRM.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div className="search-box" style={{ position: 'relative' }}>
            <Search size={16} className="search-icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9aa5be' }} />
            <input 
              type="text" 
              placeholder="Search by user or action..." 
              style={{ paddingLeft: '32px', height: '32px', fontSize: '0.8rem', width: '240px', border: '1px solid #e5e9f2' }} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="table-select" 
            style={{ height: '32px', fontSize: '0.8rem' }}
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="all">All Actions</option>
            <option value="CREATED">Created</option>
            <option value="UPDATED">Updated</option>
            <option value="DELETED">Deleted</option>
          </select>
        </div>
      </div>

      <div className="card table-container">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Module</th>
                <th>Action</th>
                <th>Record ID</th>
                <th style={{ textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>Fetching logs...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>No matching logs found.</td></tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={log.auditId || idx}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        <Clock size={12} /> {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={14} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ fontWeight: '500' }}>{log.performedBy?.name || 'System'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Database size={14} style={{ color: '#94a3b8' }} />
                        <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: '600' }}>{log.table_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        log.action === 'CREATED' ? 'badge-success' : 
                        log.action === 'DELETED' ? 'badge-danger' : 'badge-secondary'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td><code style={{ fontSize: '0.7rem', color: '#64748b' }}>{log.payload?._id || 'N/A'}</code></td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        onClick={() => {
                          setSelectedLog(log);
                          setIsModalOpen(true);
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedLog && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Data Snapshot Inspector</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem', 
                marginBottom: '1.5rem', 
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '0.85rem' 
              }}>
                <div><span style={{ color: '#64748b', fontWeight: '600' }}>Action:</span> <span className={`badge ${selectedLog.action === 'CREATED' ? 'badge-success' : selectedLog.action === 'DELETED' ? 'badge-danger' : 'badge-secondary'}`} style={{ marginLeft: '4px' }}>{selectedLog.action}</span></div>
                <div><span style={{ color: '#64748b', fontWeight: '600' }}>Module:</span> <span style={{ textTransform: 'uppercase', marginLeft: '4px', fontWeight: '700' }}>{selectedLog.table_name}</span></div>
                <div><span style={{ color: '#64748b', fontWeight: '600' }}>User:</span> <span style={{ marginLeft: '4px', fontWeight: '600' }}>{selectedLog.performedBy?.name || 'System'}</span></div>
                <div><span style={{ color: '#64748b', fontWeight: '600' }}>Record ID:</span> <code style={{ marginLeft: '4px', color: '#0369a1' }}>{selectedLog.payload?._id || 'N/A'}</code></div>
              </div>

              {/* Pro Options Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                    {copySuccess ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                    {copySuccess ? 'Copied!' : 'Copy JSON'}
                  </button>
                  <button className="btn btn-secondary" onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                    <Download size={14} /> Download
                  </button>
                  <button className="btn btn-secondary" onClick={handleNavigate} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                    <ExternalLink size={14} /> View Module
                  </button>
                </div>
                
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    placeholder="Search in payload..." 
                    value={payloadSearch}
                    onChange={(e) => setPayloadSearch(e.target.value)}
                    style={{ 
                      padding: '6px 10px 6px 30px', 
                      fontSize: '0.75rem', 
                      borderRadius: '6px', 
                      border: '1px solid #e2e8f0',
                      width: '180px'
                    }} 
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '0.75rem', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} /> Data Payload:
              </div>
              <div style={{ 
                backgroundColor: '#0f172a', 
                color: '#38bdf8', 
                padding: '1.25rem', 
                borderRadius: '8px', 
                overflow: 'auto',
                maxHeight: '450px',
                fontSize: '0.85rem',
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                lineHeight: '1.6',
                boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
                border: '1px solid #1e293b'
              }}>
                {selectedLog.payload && Object.keys(selectedLog.payload).length > 0 ? (
                  <pre style={{ margin: 0 }}>
                    {payloadSearch 
                      ? JSON.stringify(selectedLog.payload, null, 2)
                          .split('\n')
                          .map((line, i) => line.toLowerCase().includes(payloadSearch.toLowerCase()) 
                            ? <div key={i} style={{ backgroundColor: 'rgba(56, 189, 248, 0.2)', width: 'fit-content', paddingRight: '10px' }}>{line}</div> 
                            : <div key={i}>{line}</div>
                          )
                      : JSON.stringify(selectedLog.payload, null, 2)
                    }
                  </pre>
                ) : (
                  <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>
                    No data snapshot available for this action ({selectedLog.action}).
                  </div>
                )}
              </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => {
                setIsModalOpen(false);
                setPayloadSearch('');
              }}>Close Inspector</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
