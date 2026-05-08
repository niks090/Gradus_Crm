import { useState } from 'react';
import { useCrm } from '../context/CrmContext';
import { 
  Users, Target, PhoneOff, Clock, UserMinus, 
  CheckCircle2, Star, UserX, RotateCcw, CreditCard, 
  CheckCircle, ChevronLeft, Search
} from 'lucide-react';
import './Status.css';
import './TablePages.css';

const STATUS_CONFIG = {
  'PROSPECT':     { icon: Target,       color: '#059669', bg: '#ecfdf5' },
  'DNP':          { icon: PhoneOff,     color: '#2563eb', bg: '#eff6ff' },
  'P2P':          { icon: Clock,        color: '#7c3aed', bg: '#f5f3ff' },
  'WFC':          { icon: Users,        color: '#d97706', bg: '#fffbeb' },
  'NI':           { icon: UserX,        color: '#dc2626', bg: '#fef2f2' },
  'QUALIFIED':    { icon: Star,         color: '#0891b2', bg: '#ecfeff' },
  'SO':           { icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4' },
  'NQ':           { icon: UserMinus,    color: '#92400e', bg: '#fff9c4' },
  'CB':           { icon: RotateCcw,    color: '#4b5563', bg: '#f3f4f6' },
  'ALREADY PAID': { icon: CreditCard,   color: '#111827', bg: '#f9fafb' },
  'SALE':         { icon: CheckCircle,  color: '#059669', bg: '#064e3b', isDark: true },
};

export default function StatusPage() {
  const { leads } = useCrm();
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'Admin';

  // Filter leads by user role first
  const userLeads = leads.filter(l => isAdmin || l.bdm === currentUser.name);
  const totalLeads = userLeads.length;

  // Calculate status summaries
  const statusSummaries = Object.keys(STATUS_CONFIG).map(status => {
    const count = userLeads.filter(l => l.status1 === status).length;
    const percentage = totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(1) : 0;
    return { status, count, percentage, ...STATUS_CONFIG[status] };
  });

  const filteredLeads = userLeads.filter(l => {
    const matchesStatus = l.status1 === selectedStatus;
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         l.mobile.includes(searchQuery) ||
                         l.leadId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (selectedStatus) {
    return (
      <div className="page-container">
        <div className="page-header flex-between">
          <div className="flex-align" style={{ gap: '1rem' }}>
            <button className="back-btn" onClick={() => setSelectedStatus(null)}>
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selectedStatus} Leads
                <span className="badge-pill" style={{ 
                  backgroundColor: STATUS_CONFIG[selectedStatus].bg, 
                  color: STATUS_CONFIG[selectedStatus].isDark ? '#fff' : STATUS_CONFIG[selectedStatus].color,
                  fontSize: '0.8rem'
                }}>
                  {filteredLeads.length}
                </span>
              </h1>
              <p>Viewing all leads currently marked as {selectedStatus}.</p>
            </div>
          </div>
        </div>

        <div className="card table-card">
          <div className="table-toolbar">
            <div className="search-wrapper" style={{ position: 'relative', maxWidth: '300px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Search leads..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lead ID</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>State</th>
                  <th>Profession</th>
                  <th>Assigned BDM</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr key={lead.id}>
                    <td><span className="badge badge-secondary">{lead.leadId}</span></td>
                    <td className="font-medium">{lead.name}</td>
                    <td>{lead.mobile}</td>
                    <td>{lead.state}</td>
                    <td>{lead.profession}</td>
                    <td>{lead.bdm || 'Unassigned'}</td>
                    <td>
                      <span className="status-indicator-pill" style={{ 
                        backgroundColor: STATUS_CONFIG[lead.status1]?.bg, 
                        color: STATUS_CONFIG[lead.status1]?.isDark ? '#fff' : STATUS_CONFIG[lead.status1]?.color 
                      }}>
                        {lead.status1}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      No leads found in this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Lead Status Dashboard</h1>
        <p>Overview of your pipeline distribution by status.</p>
      </div>

      <div className="status-grid-dashboard">
        {statusSummaries.map(item => (
          <div 
            key={item.status} 
            className="status-summary-card" 
            onClick={() => setSelectedStatus(item.status)}
            style={{ '--hover-color': item.color }}
          >
            <div className="status-card-header">
              <span className="status-percentage">{item.percentage}%</span>
              <div className="status-card-icon" style={{ backgroundColor: item.bg, color: item.isDark ? '#fff' : item.color }}>
                <item.icon size={20} />
              </div>
            </div>
            <div className="status-card-info">
              <h3 className="status-name">{item.status}</h3>
              <div className="status-count-row">
                <span className="status-count">{item.count}</span>
                <span className="status-label">Leads</span>
              </div>
            </div>
            <div className="status-card-footer">
              <span>View Records</span>
              <ChevronLeft className="rotate-180" size={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
