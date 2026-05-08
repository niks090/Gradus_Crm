import { BarChart3, TrendingUp, Users, IndianRupee } from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import './Dashboard.css';

export default function Dashboard() {
  const { onboardings, leads, activities } = useCrm();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'Admin';

  // Filter data based on role
  const dashboardLeads = leads.filter(l => isAdmin || l.bdm === currentUser.name);
  const dashboardOnboardings = onboardings.filter(o => isAdmin || o.bdm === currentUser.name);

  // Calculate total revenue from onboardings
  const totalRevenue = dashboardOnboardings.reduce((sum, ob) => sum + (Number(ob.totalFees) || 0), 0);
  
  const wonDeals = dashboardOnboardings.length;
  const totalCompletedDeals = dashboardOnboardings.length; 
  const winRate = totalCompletedDeals > 0 ? 100 : 0; 

  // Use local date for "Today" to match user's timezone
  const today = new Date().toLocaleDateString('en-CA'); 
  const freshLeadsToday = dashboardLeads.filter(l => {
    const leadDate = l.date; // Usually YYYY-MM-DD
    const systemDate = l.createdat ? new Date(l.createdat).toLocaleDateString('en-CA') : null;
    return leadDate === today || systemDate === today;
  }).length;
  const newLeadsCount = dashboardLeads.length;

  const formatTimeAgo = (isoString) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const salesConversion = newLeadsCount > 0 
    ? ((dashboardOnboardings.length / newLeadsCount) * 100).toFixed(1) 
    : 0;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {currentUser.name || 'User'}! Here's what's happening with your sales today.</p>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon bg-primary-light text-primary">
            <IndianRupee size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value">₹{totalRevenue.toLocaleString()}</span>
          </div>
          <div className="stat-trend positive">
            <TrendingUp size={16} />
            <span>+12.5%</span>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon bg-success-light text-success">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Leads</span>
            <span className="stat-value">{newLeadsCount}</span>
          </div>
          <div className="stat-trend positive">
            <TrendingUp size={16} />
            <span>+5.2%</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon bg-warning-light text-warning">
            <BarChart3 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Fresh Leads Today</span>
            <span className="stat-value">{freshLeadsToday}</span>
          </div>
          <div className="stat-trend positive">
            <TrendingUp size={16} />
            <span>Today</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
            <BarChart3 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Sales Conversion</span>
            <span className="stat-value">{salesConversion}%</span>
          </div>
          <div className="stat-trend positive">
            <TrendingUp size={16} />
            <span>Target</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="card chart-card">
          <h2>Revenue Overview</h2>
          <div className="placeholder-chart">
            <div className="chart-bar" style={{height: '60%'}}></div>
            <div className="chart-bar" style={{height: '80%'}}></div>
            <div className="chart-bar" style={{height: '40%'}}></div>
            <div className="chart-bar" style={{height: '90%'}}></div>
            <div className="chart-bar" style={{height: '70%'}}></div>
            <div className="chart-bar" style={{height: '50%'}}></div>
          </div>
        </div>
        <div className="card activity-card">
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Recent Activity</h2>
          </div>
          <ul className="activity-list">
            {activities
              .filter(a => isAdmin || a.performedBy === currentUser.name)
              .map(activity => (
              <li key={activity.id} className="activity-item">
                <div className={`activity-dot ${activity.color}`}></div>
                <div className="activity-text">
                  <p>{activity.text}</p>
                  <span className="activity-time">{formatTimeAgo(activity.time)}</span>
                </div>
              </li>
            ))}
            {activities.filter(a => isAdmin || a.performedBy === currentUser.name).length === 0 && (
              <li className="activity-item">
                <div className="activity-text"><p>No recent activity</p></div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
