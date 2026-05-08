import { useState, useEffect } from 'react';
import { History, Search, Filter, ShieldAlert, User, Clock, Database } from 'lucide-react';
import { databaseService } from '../services/databaseService';
import './TablePages.css';

export default function MasterArchive() {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'Admin';
  const isManager = currentUser.role === 'Manager';
  const isPowerUser = isAdmin || isManager;

  useEffect(() => {
    const loadLogs = async () => {
      setIsLoading(true);
      const data = await databaseService.fetchMasterArchive();
      setLogs(data);
      setIsLoading(false);
    };
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.performedBy?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.collection?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                        <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: '600' }}>{log.collection}</span>
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
                    <td><code style={{ fontSize: '0.7rem', color: '#64748b' }}>{log.originalId}</code></td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        onClick={() => console.log('Log Data:', log.dataSnapshot)}
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
    </div>
  );
}
