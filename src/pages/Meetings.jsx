import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { databaseService } from '../services/databaseService';
import { useCrm } from '../context/CrmContext';
import { 
  Calendar, Clock, User, MessageSquare, 
  ChevronRight, ExternalLink, Filter, Search, X
} from 'lucide-react';
import './Meetings.css';
import './TablePages.css';

export default function MeetingsPage() {
  const navigate = useNavigate();
  const { setSearchQuery: setGlobalSearchQuery } = useCrm();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('upcoming'); // upcoming, past, all
  const [actionMeeting, setActionMeeting] = useState(null);
  const [actionData, setActionData] = useState({ type: '', comment: '', newTime: '' });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'Admin';

  useEffect(() => {
    loadMeetings();
  }, [filter]);

  const loadMeetings = async () => {
    try {
      const data = await databaseService.fetchMeetings();
      // Filter by user role (Admins see all, others see their own)
      const filtered = data.filter(m => isAdmin || m.performedBy === currentUser.name);
      
      // Sort: Upcoming (Soonest first), Past/All (Latest first)
      const sorted = filtered.sort((a, b) => {
        const dateA = new Date(a.meetingTime);
        const dateB = new Date(b.meetingTime);
        if (filter === 'upcoming') return dateA - dateB;
        return dateB - dateA;
      });

      setMeetings(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMeetings = meetings.filter(m => {
    const mTime = new Date(m.meetingTime);
    const now = new Date();
    
    // Status Filter
    if (filter === 'upcoming' && mTime < now) return false;
    if (filter === 'past' && mTime >= now) return false;

    // Search Filter
    const query = searchQuery.toLowerCase();
    return (
      m.leadName.toLowerCase().includes(query) ||
      m.comment.toLowerCase().includes(query) ||
      m.performedBy.toLowerCase().includes(query)
    );
  });

  const handleAction = async (e) => {
    e.preventDefault();
    if (!actionMeeting) return;

    const updates = {
      status: actionData.type,
      comment: actionData.comment,
    };

    if (actionData.type === 'Rescheduled') {
      updates.meetingTime = actionData.newTime;
      // Add a note to history if we had a history field, for now we just update
      updates.comment = `[Rescheduled] ${actionData.comment}`;
    }

    await databaseService.updateMeeting(actionMeeting._id, updates);
    setActionMeeting(null);
    setActionData({ type: '', comment: '', newTime: '' });
    loadMeetings();
  };

  const getStatusBadge = (meeting) => {
    // If it has a manual status, show it
    if (meeting.status === 'Cancelled') return <span className="badge badge-danger">Cancelled</span>;
    if (meeting.status === 'Completed') return <span className="badge badge-success">Completed</span>;
    if (meeting.status === 'Rescheduled') return <span className="badge badge-warning">Rescheduled</span>;

    // If no manual status, show "(add response)" with time-based hints
    const mTime = new Date(meeting.meetingTime);
    const now = new Date();
    
    if (mTime < now) {
      return <span className="badge badge-outline-secondary">(add response)</span>;
    }
    
    const diffHours = (mTime - now) / (1000 * 60 * 60);
    if (diffHours < 2) return <span className="badge badge-outline-danger">(add response)</span>;
    return <span className="badge badge-outline-primary">(add response)</span>;
  };

  if (loading) return <div className="page-container"><p>Loading meetings...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h1>Meetings</h1>
          <p>Track all scheduled interactions with your leads.</p>
        </div>
      </div>

      <div className="card table-card">
        <div className="table-toolbar flex-between">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="search-wrapper" style={{ position: 'relative', width: '300px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Search meetings..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
                onClick={() => setFilter('upcoming')}
              >
                Upcoming
              </button>
              <button 
                className={`filter-tab ${filter === 'past' ? 'active' : ''}`}
                onClick={() => setFilter('past')}
              >
                Past
              </button>
              <button 
                className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
            </div>
          </div>
          <div className="meeting-stats">
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Showing {filteredMeetings.length} meetings
            </span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Lead Name</th>
                <th>Status</th>
                <th>Comment / Objective</th>
                <th>Organized By</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMeetings.map(meeting => (
                <tr key={meeting._id}>
                  <td>
                    <div className="flex-align" style={{ gap: '8px' }}>
                      <Calendar size={14} className="text-muted" />
                      <span className="font-medium">{new Date(meeting.meetingTime).toLocaleDateString()}</span>
                      <Clock size={14} className="text-muted" style={{ marginLeft: '4px' }} />
                      <span style={{ color: '#64748b' }}>{new Date(meeting.meetingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex-align" style={{ gap: '8px' }}>
                      <User size={14} className="text-primary" />
                      <span className="font-semibold">{meeting.leadName}</span>
                    </div>
                  </td>
                  <td>
                    <div 
                      className="cursor-pointer" 
                      onClick={() => setActionMeeting(meeting)}
                      title="Update Meeting Status"
                    >
                      {getStatusBadge(meeting)}
                    </div>
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    <div className="flex-align" style={{ gap: '8px' }}>
                      <MessageSquare size={14} className="text-muted" />
                      <span className="truncate" title={meeting.comment}>{meeting.comment}</span>
                    </div>
                  </td>
                  <td>
                    <span className="user-badge">{meeting.performedBy}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn-link"
                      onClick={() => {
                        setGlobalSearchQuery(meeting.leadName);
                        navigate('/leads');
                      }}
                    >
                      View Lead <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredMeetings.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="empty-meetings">
                      <Calendar size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                      <h3 style={{ color: '#1e293b' }}>No {filter} meetings found</h3>
                      <p style={{ color: '#64748b' }}>Schedule new meetings via the Leads section to see them here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {actionMeeting && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>Update Meeting: {actionMeeting.leadName}</h2>
              <button className="modal-close" onClick={() => setActionMeeting(null)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAction} className="action-form" style={{ padding: '1rem 0' }}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Select Outcome</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    className={`btn ${actionData.type === 'Completed' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActionData({ ...actionData, type: 'Completed' })}
                    style={{ fontSize: '0.8rem' }}
                  >
                    Complete
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${actionData.type === 'Rescheduled' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActionData({ ...actionData, type: 'Rescheduled' })}
                    style={{ fontSize: '0.8rem' }}
                  >
                    Reschedule
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${actionData.type === 'Cancelled' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActionData({ ...actionData, type: 'Cancelled' })}
                    style={{ fontSize: '0.8rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {actionData.type === 'Rescheduled' && (
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>New Meeting Date & Time</label>
                  <input 
                    type="datetime-local" 
                    className="input-field"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                    value={actionData.newTime}
                    onChange={(e) => setActionData({ ...actionData, newTime: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Comment / Reason</label>
                <textarea 
                  className="input-field" 
                  rows={4}
                  placeholder="Add a note about this outcome..."
                  style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', borderRadius: '8px' }}
                  value={actionData.comment}
                  onChange={(e) => setActionData({ ...actionData, comment: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="modal-actions" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActionMeeting(null)}>Close</button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={!actionData.type || !actionData.comment.trim() || (actionData.type === 'Rescheduled' && !actionData.newTime)}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
