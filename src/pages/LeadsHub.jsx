import { useNavigate } from 'react-router-dom';
import { Target, TrendingUp, Users, ArrowRight } from 'lucide-react';
import './TablePages.css';

export default function LeadsHub() {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Leads Categories</h1>
        <p>Select a lead category to manage its pipeline and data.</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '2rem', 
        marginTop: '2rem' 
      }}>
        
        {/* MX Leads Card */}
        <div 
          className="card" 
          style={{ cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}
          onClick={() => handleNavigate('/leads/mx')}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <TrendingUp size={32} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>MX Leads</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5', flexGrow: 1 }}>
            Manage the standard MX leads pipeline, including statuses, calls, meetings, and onboardings.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', color: '#3b82f6', fontWeight: '600' }}>
            Open MX Pipeline <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </div>
        </div>

        {/* FX Leads Card */}
        <div 
          className="card" 
          style={{ cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}
          onClick={() => handleNavigate('/leads/fx')}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Target size={32} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>FX Leads</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5', flexGrow: 1 }}>
            Manage Foreign Exchange (FX) leads. Features a custom pipeline and tracking details.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', color: '#10b981', fontWeight: '600' }}>
            Open FX Pipeline <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </div>
        </div>

        {/* Internship Leads Card */}
        <div 
          className="card" 
          style={{ cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}
          onClick={() => handleNavigate('/leads/internship')}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <Users size={32} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Internship Leads</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5', flexGrow: 1 }}>
            Track and process candidates and institutions for internship programs.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', color: '#8b5cf6', fontWeight: '600' }}>
            Open Internships <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </div>
        </div>

      </div>
    </div>
  );
}
