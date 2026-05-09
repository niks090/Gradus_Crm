import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadsHub from './pages/LeadsHub';
import Contacts from './pages/Contacts';
import Onboarding from './pages/Onboarding';
import Meetings from './pages/Meetings';
import Brochures from './pages/Brochures';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Target from './pages/Target';
import MasterArchive from './pages/MasterArchive';
import Login from './pages/Login';
import Status from './pages/Status';
import Settings from './pages/Settings';
import { CrmProvider } from './context/CrmContext';
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <CrmProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<LeadsHub />} />
            <Route path="leads/mx" element={<Leads />} />
            <Route path="leads/fx" element={<div className="page-container" style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%'}}><div style={{textAlign:'center'}}><h2 style={{fontSize:'2rem',marginBottom:'1rem',color:'#10b981'}}>FX Leads</h2><p style={{color:'var(--text-secondary)'}}>Awaiting FX Schema Configuration...</p></div></div>} />
            <Route path="leads/internship" element={<div className="page-container" style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%'}}><div style={{textAlign:'center'}}><h2 style={{fontSize:'2rem',marginBottom:'1rem',color:'#8b5cf6'}}>Internship Leads</h2><p style={{color:'var(--text-secondary)'}}>Awaiting Internship Schema Configuration...</p></div></div>} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="meetings" element={<Meetings />} />
            <Route path="status" element={<Status />} />
            <Route path="target" element={<Target />} />
            <Route path="brochures" element={<Brochures />} />
            <Route path="users" element={<Users />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="archive" element={<MasterArchive />} />
            <Route path="*" element={<div className="card">Page not found</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CrmProvider>
  );
}

export default App;
