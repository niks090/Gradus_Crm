import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
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
            <Route path="leads" element={<Leads />} />
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
