import { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { useCrm } from '../context/CrmContext';
import { 
  Target as TargetIcon, TrendingUp, Users, 
  DollarSign, CheckCircle, AlertCircle, Send,
  User, BarChart2
} from 'lucide-react';
import './Target.css';

export default function TargetPage() {
  const { onboardings } = useCrm();
  const [targets, setTargets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Admin Form State
  const [formData, setFormData] = useState({
    userId: '',
    onboardCount: '',
    revenue: '',
    month: new Date().toISOString().slice(0, 7) // YYYY-MM
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'Admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [fetchedTargets, fetchedUsers] = await Promise.all([
        databaseService.fetchTargets(),
        databaseService.fetchUsers()
      ]);
      setTargets(fetchedTargets);
      setUsers(fetchedUsers.filter(u => u.role !== 'Admin')); // Only assign targets to non-admins
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!formData.userId || !formData.onboardCount || !formData.revenue) return;

    const selectedUser = users.find(u => u._id === formData.userId);
    const newTarget = {
      userId: formData.userId,
      userName: selectedUser.name,
      onboardTarget: parseInt(formData.onboardCount),
      revenueTarget: parseFloat(formData.revenue),
      month: formData.month,
      assignedAt: new Date().toISOString()
    };

    // Check if target for this user and month already exists, then update or create
    const existing = targets.find(t => t.userId === formData.userId && t.month === formData.month);
    if (existing) {
      await databaseService.updateTarget(existing._id, newTarget);
    } else {
      await databaseService.createTarget(newTarget);
    }

    setFormData({ ...formData, userId: '', onboardCount: '', revenue: '' });
    loadData();
    alert('Target assigned successfully!');
  };

  // Helper to calculate achieved metrics for a user in a specific month
  const calculateAchieved = (userId, month) => {
    const userOnboardings = onboardings.filter(ob => {
      // Assuming ob.processedBy is the user's name or we match by user name if processedBy is name
      // If processedBy is name, we need to match it.
      const user = users.find(u => u._id === userId);
      return ob.processedBy === user?.name && ob.onboardDate.startsWith(month);
    });

    const achievedCount = userOnboardings.length;
    const achievedRevenue = userOnboardings.reduce((sum, ob) => sum + (parseFloat(ob.feesPaid) || 0), 0);
    
    return { achievedCount, achievedRevenue };
  };

  if (loading) return <div className="page-container"><p>Loading targets...</p></div>;

  // --- USER VIEW ---
  if (!isAdmin) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const userTarget = targets.find(t => t.userId === currentUser._id && t.month === currentMonth);
    const { achievedCount, achievedRevenue } = calculateAchieved(currentUser._id, currentMonth);

    const onboardPct = userTarget ? Math.min((achievedCount / userTarget.onboardTarget) * 100, 100).toFixed(0) : 0;
    const revenuePct = userTarget ? Math.min((achievedRevenue / userTarget.revenueTarget) * 100, 100).toFixed(0) : 0;

    const getSuggestion = (pct, type) => {
      const p = parseFloat(pct);
      if (p >= 100) return `Amazing! You've crushed your ${type} target. Keep it up!`;
      if (p >= 75) return `You're so close! Just a few more to hit your ${type} goal. Finish strong!`;
      if (p >= 50) return `Good progress, but you need to pick up the pace to reach your ${type} target asap.`;
      return `Target is still far. Focus on high-intent leads to boost your ${type} achieved % today!`;
    };

    return (
      <div className="page-container">
        <div className="page-header">
          <h1>My Targets</h1>
          <p>Performance tracking for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>

        {userTarget ? (
          <div className="target-dashboard-grid">
            {/* Onboard Target Card */}
            <div className="card target-status-card">
              <div className="target-card-header">
                <div className="target-icon-box bg-primary-light text-primary">
                  <CheckCircle size={24} />
                </div>
                <span className="target-label">Onboarding Goal</span>
              </div>
              <div className="target-main-stats">
                <div className="target-pct-circle">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="circle" strokeDasharray={`${onboardPct}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <text x="18" y="20.35" className="percentage">{onboardPct}%</text>
                  </svg>
                </div>
                <div className="target-details">
                  <div className="stat-row">
                    <span>Target:</span> <strong>{userTarget.onboardTarget}</strong>
                  </div>
                  <div className="stat-row">
                    <span>Achieved:</span> <strong>{achievedCount}</strong>
                  </div>
                  <div className="stat-row gap">
                    <span>Needed:</span> <strong className="text-warning">{Math.max(userTarget.onboardTarget - achievedCount, 0)}</strong>
                  </div>
                </div>
              </div>
              <div className="target-suggestion">
                <AlertCircle size={16} />
                <p>{getSuggestion(onboardPct, 'onboarding')}</p>
              </div>
            </div>

            {/* Revenue Target Card */}
            <div className="card target-status-card">
              <div className="target-card-header">
                <div className="target-icon-box bg-success-light text-success">
                  <DollarSign size={24} />
                </div>
                <span className="target-label">Revenue Goal</span>
              </div>
              <div className="target-main-stats">
                <div className="target-pct-circle">
                  <svg viewBox="0 0 36 36" className="circular-chart success">
                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="circle" strokeDasharray={`${revenuePct}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <text x="18" y="20.35" className="percentage">{revenuePct}%</text>
                  </svg>
                </div>
                <div className="target-details">
                  <div className="stat-row">
                    <span>Target:</span> <strong>₹{userTarget.revenueTarget.toLocaleString()}</strong>
                  </div>
                  <div className="stat-row">
                    <span>Achieved:</span> <strong>₹{achievedRevenue.toLocaleString()}</strong>
                  </div>
                  <div className="stat-row gap">
                    <span>Needed:</span> <strong className="text-success">₹{Math.max(userTarget.revenueTarget - achievedRevenue, 0).toLocaleString()}</strong>
                  </div>
                </div>
              </div>
              <div className="target-suggestion">
                <AlertCircle size={16} />
                <p>{getSuggestion(revenuePct, 'revenue')}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="card empty-state">
            <TargetIcon size={48} className="text-muted" />
            <h3>No targets assigned yet</h3>
            <p>Your administrator hasn't assigned any targets for this month. Check back later!</p>
          </div>
        )}
      </div>
    );
  }

  // --- ADMIN VIEW ---
  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h1>Target Management</h1>
          <p>Assign and track performance goals for your team.</p>
        </div>
      </div>

      <div className="admin-target-layout">
        <div className="card assign-form-card">
          <h3>Assign New Target</h3>
          <form onSubmit={handleAssign} className="assign-form">
            <div className="form-group">
              <label>Select User</label>
              <div className="select-wrapper">
                <User size={18} className="input-icon" />
                <select 
                  value={formData.userId} 
                  onChange={e => setFormData({...formData, userId: e.target.value})} 
                  required
                >
                  <option value="">Choose a team member...</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Onboard Count Target</label>
              <div className="input-wrapper">
                <BarChart2 size={18} className="input-icon" />
                <input 
                  type="number" 
                  placeholder="e.g. 15" 
                  value={formData.onboardCount} 
                  onChange={e => setFormData({...formData, onboardCount: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Revenue Target (₹)</label>
              <div className="input-wrapper">
                <DollarSign size={18} className="input-icon" />
                <input 
                  type="number" 
                  placeholder="e.g. 50000" 
                  value={formData.revenue} 
                  onChange={e => setFormData({...formData, revenue: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Target Month</label>
              <input 
                type="month" 
                value={formData.month} 
                onChange={e => setFormData({...formData, month: e.target.value})} 
                required 
              />
            </div>

            <button type="submit" className="btn btn-primary w-100">
              <Send size={16} /> Assign Target
            </button>
          </form>
        </div>

        <div className="card targets-list-card">
          <h3>Active Targets</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Month</th>
                  <th>Onboard Goal</th>
                  <th>Revenue Goal</th>
                  <th>Achieved %</th>
                </tr>
              </thead>
              <tbody>
                {targets.map(t => {
                  const { achievedCount, achievedRevenue } = calculateAchieved(t.userId, t.month);
                  const onboardPct = Math.min((achievedCount / t.onboardTarget) * 100, 100).toFixed(0);
                  const revenuePct = Math.min((achievedRevenue / t.revenueTarget) * 100, 100).toFixed(0);
                  
                  return (
                    <tr key={t._id}>
                      <td className="font-medium">{t.userName}</td>
                      <td>{new Date(t.month).toLocaleString('default', { month: 'short', year: 'numeric' })}</td>
                      <td>{achievedCount} / {t.onboardTarget}</td>
                      <td>₹{achievedRevenue.toLocaleString()} / ₹{t.revenueTarget.toLocaleString()}</td>
                      <td>
                        <div className="mini-progress">
                          <div className="progress-bar" style={{ width: `${(parseFloat(onboardPct) + parseFloat(revenuePct)) / 2}%` }}></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
