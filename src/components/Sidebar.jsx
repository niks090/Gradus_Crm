import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Contact, Briefcase, BarChart2,
  FileText, Target, CheckSquare, Calendar, Phone,
  TrendingUp, ChevronDown, ChevronUp, Settings, Search, ClipboardCheck,
  ShieldAlert, Database
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import './Sidebar.css';

const NAV_GROUPS = [
  {
    label: 'Sales',
    items: [
      { icon: LayoutDashboard, label: 'Home', path: '/' },
      { icon: Users, label: 'Leads', path: '/leads' },
      {icon: Contact, label: 'Contacts', path: '/contacts' },
      { icon: ClipboardCheck, label: 'Onboarding', path: '/onboarding' },
      { icon: TrendingUp, label: 'Status', path: '/status' },
      { icon: FileText, label: 'Brochures', path: '/brochures' },
      { icon: Target, label: 'Target', path: '/target' },
    ],
  },
  {
    label: 'Activities',
    items: [
      { icon: Calendar, label: 'Meetings', path: '/meetings' },
      { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
      { icon: Phone, label: 'Calls', path: '/calls' },
    ],
  },
];

export default function Sidebar() {
  const { themeColor, themeMode, themeType } = useCrm();
  const [collapsed, setCollapsed] = useState({});
  const [search, setSearch] = useState('');

  // Generate a darker/bluer version of the theme color for the sidebar
  const sidebarStyle = {
    '--sidebar-bg': (themeMode === 'night' || themeType === 'dark') 
      ? '#0d1126' 
      : `${themeColor}cc` // semi-transparent overlay to keep it tinted
  };

  const toggle = (label) =>
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));

  // Get current user to check role
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'Admin';
  const isManager = currentUser.role === 'Manager';
  const isPowerUser = isAdmin || isManager;

  const groupsToRender = [...NAV_GROUPS];
  if (isPowerUser) {
    const adminItems = [
      { icon: ShieldAlert, label: 'Team Management', path: '/users' },
      { icon: Database, label: 'Master Archive', path: '/archive' }
    ];
    
    if (isAdmin) {
      adminItems.push({ icon: Clock, label: 'Requests', path: '/requests' });
    }

    groupsToRender.push({
      label: 'Administration',
      items: adminItems
    });
  }

  return (
    <aside className="sidebar" style={sidebarStyle}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-logo">G</div>
        <span className="brand-text">Gradus CRM</span>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <Search size={14} className="sidebar-search-icon" />
        <input
          type="text"
          className="sidebar-search-input"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {groupsToRender.map((group) => (
          <div key={group.label} className="nav-group">
            <button
              className="nav-group-header"
              onClick={() => toggle(group.label)}
            >
              <span>{group.label}</span>
              {collapsed[group.label] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>

            {!collapsed[group.label] && (
              <div className="nav-group-items">
                {group.items
                  .filter((item) =>
                    item.label.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        `nav-item ${isActive ? 'active' : ''}`
                      }
                    >
                      <item.icon className="nav-icon" size={16} />
                      <span className="nav-label">{item.label}</span>
                    </NavLink>
                  ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <NavLink to="/settings" className="nav-item">
          <Settings className="nav-icon" size={16} />
          <span className="nav-label">Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
