import { useState, useEffect } from 'react';
import { 
  Bell, Search, Plus, HelpCircle, LogOut, 
  ChevronDown, Sun, Moon, Monitor, MessageSquare, 
  Headphones, Mail, Users, ExternalLink, Power,
  Info, Calendar
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCrm } from '../context/CrmContext';
import { databaseService } from '../services/databaseService';
import './Header.css';

const PAGE_TITLES = {
  '/': 'Home',
  '/leads': 'Leads',
  '/contacts': 'Contacts',
  '/deals': 'Deals',
  '/forecasts': 'Forecasts',
  '/documents': 'Documents',
  '/campaigns': 'Campaigns',
  '/tasks': 'Tasks',
  '/meetings': 'Meetings',
  '/calls': 'Calls',
  '/settings': 'Settings',
};

const THEME_COLORS = [
  '#4f8ef7', '#0d9488', '#166534', '#a16207', '#b45309', 
  '#c2410c', '#b91c1c', '#831843', '#4c1d95', '#1e3a8a', 
  '#1e40af', '#0e7490', '#422006'
];

export default function Header() {
  const { 
    themeMode, setThemeMode, themeColor, setThemeColor, themeType, setThemeType,
    searchQuery, setSearchQuery 
  } = useCrm();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [activeToast, setActiveToast] = useState(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const pageTitle = PAGE_TITLES[pathname] || 'Gradus CRM';
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'Admin';

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Meeting Notification Logic
  useEffect(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    const checkMeetings = async () => {
      try {
        const allMeetings = await databaseService.fetchMeetings();
        // Filter out very old meetings and sort by time
        const now = new Date();
        const upcomingMeetings = allMeetings
          .filter(m => new Date(m.meetingTime) > new Date(now.getTime() - 24 * 60 * 60000)) // Last 24h onwards
          .sort((a, b) => new Date(a.meetingTime) - new Date(b.meetingTime));
        
        setMeetings(upcomingMeetings);
        
        const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000);

        for (const meeting of upcomingMeetings) {
          if (meeting.notified) continue;

          const meetingTime = new Date(meeting.meetingTime);
          // Trigger if meeting is starting within 30 minutes
          if (meetingTime > now && meetingTime <= thirtyMinutesFromNow) {
            // Play Notification Sound
            audio.play().catch(e => console.log('Audio playback requires user interaction first:', e));

            // Trigger In-App Toast
            setActiveToast({
              title: `Meeting: ${meeting.leadName}`,
              time: meetingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              leadId: meeting.leadId
            });

            // Auto-hide toast after 10 seconds
            setTimeout(() => setActiveToast(null), 15000);
            
            // Mark as notified in DB so toast doesn't repeat
            await databaseService.markMeetingNotified(meeting._id);
          }
        }
      } catch (err) {
        console.error("Failed to check meetings:", err);
      }
    };

    // Initial check
    checkMeetings();
    // Check every 30 seconds for better responsiveness
    const interval = setInterval(checkMeetings, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header" style={{ backgroundColor: themeMode === 'night' || themeType === 'dark' ? 'var(--color-surface)' : 'var(--color-primary)' }}>
      {/* Page Title */}
      <div className="header-title" style={{ color: '#ffffff' }}>{pageTitle}</div>

      {/* Search */}
      <div className="header-search">
        <Search className="search-icon" size={15} />
        <input
          type="text"
          placeholder="Search records..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="header-actions">
        {isAdmin && (
          <button className="icon-btn header-add-btn" title="New Record" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>
            <Plus size={16} />
          </button>
        )}
        <button className="icon-btn" title="Help" style={{ color: '#ffffff' }} onClick={() => setShowHelp(true)}>
          <HelpCircle size={19} />
        </button>
        <button 
          className={`icon-btn ${showNotifications ? 'active' : ''}`} 
          title="Notifications" 
          style={{ color: '#ffffff', backgroundColor: showNotifications ? 'rgba(255,255,255,0.1)' : 'transparent' }}
          onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
        >
          <Bell size={19} />
          {meetings.filter(m => !m.notified).length > 0 && (
            <span className="badge-dot" style={{ borderColor: 'var(--color-primary)' }}></span>
          )}
        </button>
        
        {/* User Profile Trigger */}
        <div className="user-profile" onClick={() => setShowProfile(!showProfile)}>
          <div className="user-avatar" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', overflow: 'hidden' }}>
            {JSON.parse(localStorage.getItem('user') || '{}').photo ? (
              <img src={JSON.parse(localStorage.getItem('user') || '{}').photo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              JSON.parse(localStorage.getItem('user') || '{}').name?.split(' ').map(n => n[0]).join('') || 'U'
            )}
          </div>
          <div className="user-info">
            <span className="user-name" style={{ color: '#ffffff' }}>{JSON.parse(localStorage.getItem('user') || '{}').name || 'User'}</span>
            <span className="user-role" style={{ color: 'rgba(255,255,255,0.7)' }}>{JSON.parse(localStorage.getItem('user') || '{}').role || 'Guest'}</span>
          </div>
          <ChevronDown size={14} className={`dropdown-arrow ${showProfile ? 'open' : ''}`} style={{ color: '#ffffff' }} />
        </div>
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <>
          <div className="profile-panel-overlay" onClick={() => setShowNotifications(false)}></div>
          <div className="notification-panel">
            <div className="notification-header">
              <h3>Notifications</h3>
              <span className="notification-count">{meetings.filter(m => !m.notified).length} New</span>
            </div>
            <div className="notification-list">
              {meetings.length === 0 ? (
                <div className="notification-empty">
                  <Bell size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>No new notifications</p>
                </div>
              ) : (
                meetings.slice(0, 10).map(meeting => (
                  <div key={meeting._id} className={`notification-item ${!meeting.notified ? 'unread' : ''}`}>
                    <div className="notification-icon meeting">
                      <Calendar size={14} />
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">Meeting with {meeting.leadName}</div>
                      <div className="notification-time">
                        {new Date(meeting.meetingTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="notification-desc">{meeting.comment || 'No additional notes'}</div>
                    </div>
                    {!meeting.notified && <div className="unread-dot"></div>}
                  </div>
                ))
              )}
            </div>
            <div className="notification-footer">
              <button onClick={() => navigate('/archive')}>View All Activity</button>
            </div>
          </div>
        </>
      )}

      {/* In-App Notification Toast */}
      {activeToast && (
        <div className="notification-toast" onClick={() => { navigate('/leads'); setActiveToast(null); }}>
          <div className="toast-icon"><Calendar size={18} /></div>
          <div className="toast-content">
            <div className="toast-title">Upcoming {activeToast.title}</div>
            <div className="toast-subtitle">Starting at {activeToast.time}</div>
          </div>
          <button className="toast-close" onClick={(e) => { e.stopPropagation(); setActiveToast(null); }}>&times;</button>
        </div>
      )}

      {/* Zoho Style Profile Panel */}
      {showProfile && (
        <>
          <div className="profile-panel-overlay" onClick={() => setShowProfile(false)}></div>
          <div className="profile-panel">
            <div className="profile-panel-header" style={{ backgroundColor: 'var(--color-primary)' }}>
              <div className="profile-header-user">
                <div className="profile-large-avatar" style={{ overflow: 'hidden' }}>
                  {JSON.parse(localStorage.getItem('user') || '{}').photo ? (
                    <img src={JSON.parse(localStorage.getItem('user') || '{}').photo} alt="Large Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    JSON.parse(localStorage.getItem('user') || '{}').name?.charAt(0) || 'U'
                  )}
                </div>
                <div className="profile-header-info">
                  <h3>{JSON.parse(localStorage.getItem('user') || '{}').name || 'User'}</h3>
                  <p>User Id: 60071221858</p>
                </div>
              </div>
            </div>

            <div className="profile-panel-body">
              {/* Edition Section */}


              {/* Mode Selector */}
              <div className="profile-section-card">
                <h4>Mode</h4>
                <div className="mode-selector" style={{ backgroundColor: 'var(--color-background)' }}>
                  <button className={`mode-btn ${themeMode === 'day' ? 'active' : ''}`} onClick={() => setThemeMode('day')} style={themeMode === 'day' ? { backgroundColor: 'var(--color-primary)' } : {}}><Sun size={16} /> Day</button>
                  <button className={`mode-btn ${themeMode === 'night' ? 'active' : ''}`} onClick={() => setThemeMode('night')} style={themeMode === 'night' ? { backgroundColor: 'var(--color-primary)' } : {}}><Moon size={16} /> Night</button>
                  <button className={`mode-btn ${themeMode === 'auto' ? 'active' : ''}`} onClick={() => setThemeMode('auto')} style={themeMode === 'auto' ? { backgroundColor: 'var(--color-primary)' } : {}}><Monitor size={16} /> Auto <Info size={12} /></button>
                </div>

                <div className="theme-options">
                  <div className="theme-type">
                    <span>Themes</span>
                    <div className="theme-radios">
                      <label><input type="radio" name="theme" checked={themeType === 'dark'} onChange={() => setThemeType('dark')} /> Dark</label>
                      <label><input type="radio" name="theme" checked={themeType === 'lite'} onChange={() => setThemeType('lite')} /> Lite</label>
                    </div>
                  </div>
                  <div className="color-palette">
                    {THEME_COLORS.map(color => (
                      <div 
                        key={color} 
                        className="color-circle" 
                        style={{ backgroundColor: color, border: themeColor === color ? '2px solid white' : 'none', outline: themeColor === color ? '2px solid #000' : 'none' }}
                        onClick={() => setThemeColor(color)}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Need Help Section */}
              <div className="help-section">
                <h4>Need Help?</h4>
                <div className="help-grid">
                  <div className="help-item"><MessageSquare size={16} /> Chat with us</div>
                  <div className="help-item"><Headphones size={16} /> Talk with us</div>
                  <div className="help-item"><Mail size={16} /> Write to us</div>
                  <div className="help-item"><Users size={16} /> Community</div>
                </div>
              </div>
            </div>

            <div className="profile-panel-footer">
              <button className="footer-link" onClick={() => { navigate('/profile'); setShowProfile(false); }}>
                <ExternalLink size={16} /> My Account
              </button>
              <button className="footer-link sign-out" onClick={handleLogout}>
                <Power size={16} /> Sign Out
              </button>
            </div>
          </div>
        </>
      )}
      {/* Help Center Modal */}
      {showHelp && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content help-modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div className="flex-align" style={{ gap: '12px' }}>
                <HelpCircle size={24} className="text-primary" />
                <h2>Gradus Help Center</h2>
              </div>
              <button className="modal-close" onClick={() => setShowHelp(false)}>&times;</button>
            </div>
            
            <div className="help-modal-body" style={{ padding: '1.5rem 0' }}>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Quick answers about your Gradus CRM access and features.</p>

              <div className="help-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                <div className="help-card-item">
                  <div className="help-card-icon bg-primary-light text-primary"><MessageSquare size={20} /></div>
                  <div className="help-card-info">
                    <h4>Live Chat</h4>
                    <p>Chat with our support team in real-time.</p>
                  </div>
                </div>
                <div className="help-card-item">
                  <div className="help-card-icon bg-success-light text-success"><Headphones size={20} /></div>
                  <div className="help-card-info">
                    <h4>Phone Support</h4>
                    <p>Talk to an expert: +1 (800) GRADUS</p>
                  </div>
                </div>
                <div className="help-card-item">
                  <div className="help-card-icon bg-warning-light text-warning"><Mail size={20} /></div>
                  <div className="help-card-info">
                    <h4>Email Support</h4>
                    <p>Get a response within 24 hours.</p>
                  </div>
                </div>
                <div className="help-card-item">
                  <div className="help-card-icon bg-secondary-light text-secondary"><Users size={20} /></div>
                  <div className="help-card-info">
                    <h4>Community</h4>
                    <p>Browse forums and user discussions.</p>
                  </div>
                </div>
              </div>

              <div className="quick-links" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                <h4 style={{ marginBottom: '1.5rem', color: 'var(--color-primary)' }}>User Access Q&A</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="faq-item">
                    <p style={{ fontWeight: '600', marginBottom: '4px', fontSize: '0.9rem' }}>Q: What can I access as a standard User?</p>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>A: You can manage your Leads, view your own Meetings/Tasks, and track your individual Performance Targets. Access to Team Management and Master Archive is restricted to Admins.</p>
                  </div>
                  <div className="faq-item">
                    <p style={{ fontWeight: '600', marginBottom: '4px', fontSize: '0.9rem' }}>Q: How do I onboard a new client?</p>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>A: Go to the 'Onboarding' tab, search for the client by their mobile number, and click 'Onboard Lead' to fill out payment details and upload screenshots.</p>
                  </div>
                  <div className="faq-item">
                    <p style={{ fontWeight: '600', marginBottom: '4px', fontSize: '0.9rem' }}>Q: Can I export my data to CSV?</p>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>A: For security reasons, the Export feature is currently available only to Administrators. Please contact your manager if you need a report.</p>
                  </div>
                  <div className="faq-item">
                    <p style={{ fontWeight: '600', marginBottom: '4px', fontSize: '0.9rem' }}>Q: How do I track my monthly targets?</p>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>A: Click on 'Target' in the sidebar. Your progress is updated automatically based on your successful onboardings and revenue generated.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => setShowHelp(false)}>Close Help Center</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

