import { useState, useRef, useEffect } from 'react';
import { Search, UserPlus, ChevronDown, Check, Phone } from 'lucide-react';
import { telephonyService } from '../services/telephonyService';
import { useCrm } from '../context/CrmContext';
import { databaseService } from '../services/databaseService';
import './TablePages.css';

const StatusPicker = ({ value, options, onChange, disabled, colors, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 180)
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      onClear && onClear();
    }
  };

  const currentStyles = colors[value] || { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };

  return (
    <div 
      className="custom-dropdown" 
      ref={containerRef} 
      onKeyDown={handleKeyDown} 
      tabIndex={disabled ? -1 : 0}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div 
        className="dropdown-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ 
          backgroundColor: currentStyles.bg,
          color: currentStyles.color,
          border: `1px solid ${currentStyles.border}`,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || '---'}
        </span>
        <ChevronDown size={12} style={{ marginLeft: '4px', opacity: 0.6, flexShrink: 0 }} />
      </div>

      {isOpen && (
        <div 
          className="dropdown-menu"
          style={{ 
            position: 'fixed',
            top: coords.top - window.scrollY,
            left: coords.left - window.scrollX,
            width: coords.width,
            margin: 0
          }}
        >
          {options.map((opt) => (
            <div 
              key={opt}
              className={`dropdown-option ${value === opt ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
            >
              <div 
                className="status-dot" 
                style={{ backgroundColor: colors[opt]?.color || '#94a3b8' }}
              ></div>
              <span style={{ whiteSpace: 'nowrap' }}>{opt || '---'}</span>
              {value === opt && <Check size={12} style={{ marginLeft: 'auto' }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const STATUS_OPTIONS = [
  '', 'PROSPECT', 'DNP', 'P2P', 'WFC', 'NI', 'QUALIFIED', 'SO', 'NQ', 'CB', 'ALREADY PAID', 'SALE'
];

const STATUS_COLORS = {
  'PROSPECT':     { bg: '#c7f7e8', color: '#0a6640', border: '#6ee7b7' },
  'DNP':          { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  'P2P':          { bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd' },
  'WFC':          { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  'NI':           { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  'QUALIFIED':    { bg: '#e0f2fe', color: '#075985', border: '#7dd3fc' },
  'SO':           { bg: '#f0fdf4', color: '#166534', border: '#86efac' },
  'NQ':           { bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
  'CB':           { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' },
  'ALREADY PAID': { bg: '#1f2937', color: '#f9fafb', border: '#4b5563' },
  'SALE':         { bg: '#064e3b', color: '#ecfdf5', border: '#059669' },
};

export default function Leads() {
  const { 
    leads, setLeads, addLead, bulkAddLeads, clearAllLeads, updateLead, convertToContact,
    searchQuery 
  } = useCrm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [formData, setFormData] = useState({
    date: '', name: '', mobile: '', email: '', state: '',
    type1: '', type2: '', profession: '', ctc: ''
  });
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [activityModalLead, setActivityModalLead] = useState(null);
  const [viewActivitiesLead, setViewActivitiesLead] = useState(null);
  const [activityData, setActivityData] = useState({ type: '', comment: '', meetingTime: '' });
  const [lastSelectedIndex, setLastSelectedIndex] = useState(-1);

  const [team, setTeam] = useState([]);
  const fileInputRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'Admin';
  const isManager = currentUser.role === 'Manager';
  const isPowerUser = isAdmin || isManager;

  useEffect(() => {
    const loadTeam = async () => {
      const users = await databaseService.fetchUsers();
      // Only show Active users in BDM list
      setTeam(users.filter(u => u.status === 'Active'));
    };
    loadTeam();
  }, []);

  // Advanced CSV Parser to handle commas inside quotes
  const filteredLeads = leads.sort((a, b) => (b.id || 0) - (a.id || 0)).filter(lead => {
    const query = searchQuery.toLowerCase();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = currentUser.role === 'Admin';
    
    // 1. Role-based filtering: Admins and Managers see everything. Users only see assigned.
    const matchesUser = isPowerUser || lead.bdm === currentUser.name;
    
    // 2. Search-based filtering
    const matchesSearch = (
      (lead.leadId && lead.leadId.toLowerCase().includes(query)) ||
      (lead.email && lead.email.toLowerCase().includes(query)) ||
      (lead.mobile && lead.mobile.toLowerCase().includes(query)) ||
      (lead.name && lead.name.toLowerCase().includes(query))
    );

    return matchesUser && matchesSearch;
  });

  const parseCSVRow = (text) => {
    let result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"' && text[i+1] === '"') {
        cur += '"'; i++; // escaped quote
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const handleImportCsv = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
        if (rows.length <= 1) {
          setIsImporting(false);
          return;
        }

        const headers = parseCSVRow(rows[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const findCol = (keywords) => headers.findIndex(h => keywords.some(k => h.includes(k)));

        const colMap = {
          date: findCol(['date', 'created', 'time']),
          name: findCol(['name', 'first', 'last', 'customer', 'client']),
          mobile: findCol(['mobile', 'phone', 'contact', 'number', 'cell']),
          email: findCol(['email', 'mail']),
          state: findCol(['state', 'region', 'city', 'location', 'province']),
          type1: findCol(['type1', 'source', 'leadtype', 'channel']),
          type2: findCol(['type2', 'subsource', 'medium']),
          profession: findCol(['profession', 'job', 'title', 'role', 'occupation']),
          ctc: findCol(['ctc', 'salary', 'income', 'budget']),
        };

        let currentMaxId = leads.length > 0 
          ? Math.max(...leads.map(l => {
              const idStr = l.leadId || l.leadid || '';
              return parseInt(idStr.replace('LD-', '')) || 0;
            }))
          : 1000;

        const newLeads = [];
        const today = new Date().toISOString().split('T')[0];
        
        for (let i = 1; i < rows.length; i++) {
          const values = parseCSVRow(rows[i]);
          if (values.length < 2 || !values.some(v => v)) continue;

          currentMaxId++;
          const getVal = (key, fallbackIndex) => (colMap[key] !== -1 && values[colMap[key]]) ? values[colMap[key]] : (values[fallbackIndex] || '');

          newLeads.push({
            id: Date.now() + i,
            leadId: `LD-${currentMaxId}`,
            date: getVal('date', 0) || today,
            name: getVal('name', 1) || 'Unknown Lead',
            mobile: getVal('mobile', 2),
            email: getVal('email', 3),
            state: getVal('state', 4),
            type1: getVal('type1', 5),
            type2: getVal('type2', 6),
            profession: getVal('profession', 7),
            ctc: getVal('ctc', 8),
            bdm: '' 
          });
        }
        if (newLeads.length > 0) {
          const imported = await bulkAddLeads(newLeads);
          alert(`Successfully imported ${imported.length} leads.`);
        } else {
          alert("No valid leads found in CSV. Please check your column headers.");
        }
      } catch (err) {
        console.error("CSV Import Error:", err);
        alert("Error during import: " + err.message);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    try {
      const nextIdNum = leads.length > 0 
        ? Math.max(...leads.map(l => {
            const idStr = l.leadId || l.leadid || '';
            return parseInt(idStr.replace('LD-', '')) || 0;
          })) + 1 
        : 1001;
      
      await addLead({ 
        id: Date.now(), 
        leadId: `LD-${nextIdNum}`, 
        ...formData 
      });
      
      setIsModalOpen(false);
      setFormData({ date: '', name: '', mobile: '', email: '', state: '', type1: '', type2: '', profession: '', ctc: '' });
    } catch (err) {
      console.error("Error adding lead:", err);
      alert("Failed to add lead: " + err.message);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('CRITICAL ACTION: This will delete ALL leads from the active database. They will still be available in the Master Archive. Proceed?')) {
      await clearAllLeads();
    }
  };

  const handleBdmChange = (leadId, newBdm) => updateLead(leadId, { bdm: newBdm });
  
  const handleStatusChange = async (leadId, value) => {
    try {
      const lead = leads.find(l => (l._id === leadId || l.id === leadId));
      if (!lead) return;

      const oldStatus = lead.status1 || '';
      if (oldStatus === value) return; // no change

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}').name || 'Unknown';
      
      const newHistoryEntry = {
        id: Date.now(),
        type: 'StatusChange',
        oldStatus: oldStatus || 'Unassigned',
        newStatus: value || 'Cleared',
        comment: `Status changed from ${oldStatus || 'Unassigned'} to ${value || 'Cleared'}`,
        date: new Date().toISOString(),
        performedBy: currentUser
      };

      const updatedActivities = [...(lead.leadActivities || []), newHistoryEntry];
      await updateLead(leadId, { status1: value, leadActivities: updatedActivities });
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Error updating status: " + err.message);
    }
  };
  
  const handleSaveActivity = async (e) => {
    e.preventDefault();
    if (!activityData.type || !activityData.comment.trim()) {
      alert("Please select an activity type and enter a comment.");
      return;
    }

    try {
      const activity = {
        id: Date.now(),
        type: activityData.type,
        comment: activityData.comment,
        meetingTime: activityData.type === 'Meeting' ? activityData.meetingTime : null,
        date: new Date().toISOString(),
        performedBy: JSON.parse(localStorage.getItem('user') || '{}').name
      };

      const leadId = activityModalLead._id || activityModalLead.id;
      const lead = leads.find(l => (l._id === leadId || l.id === leadId));
      
      if (!lead) {
        setActivityModalLead(null);
        return;
      }
      
      const updatedActivities = [...(lead.leadActivities || []), activity];
      await updateLead(leadId, { leadActivities: updatedActivities });
      
      // If it's a meeting, also save to central meetings store for notifications
      if (activityData.type === 'Meeting') {
        try {
          await databaseService.createMeeting({
            leadId: leadId,
            leadName: lead.name,
            meetingTime: activityData.meetingTime,
            comment: activityData.comment,
            performedBy: JSON.parse(localStorage.getItem('user') || '{}').name
          });
        } catch (meetErr) {
          console.error("Meeting creation failed but activity was saved to lead:", meetErr);
          // We don't block the UI if just the secondary meeting record fails
        }
      }

      setActivityModalLead(null);
      setActivityData({ type: '', comment: '', meetingTime: '' });
    } catch (err) {
      console.error("Error saving activity:", err);
      alert("Failed to save activity: " + err.message);
    }
  };

  const handleRowClick = (index, event) => {
    const lead = filteredLeads[index];
    if (!lead) return;
    const currentId = lead._id || lead.id;

    if (event.shiftKey && lastSelectedIndex !== -1) {
      // SHIFT + CLICK: Select Range
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = filteredLeads.slice(start, end + 1).map(l => l._id || l.id);
      
      // Usually Shift+Click adds the range to existing or replaces? 
      // Spreadsheet style: replaces current selection with range from anchor to click
      setSelectedLeads(rangeIds);
    } else if (event.ctrlKey || event.metaKey) {
      // CTRL + CLICK: Toggle single
      const isSelected = selectedLeads.includes(currentId);
      if (isSelected) {
        setSelectedLeads(selectedLeads.filter(id => id !== currentId));
      } else {
        setSelectedLeads([...selectedLeads, currentId]);
      }
      setLastSelectedIndex(index);
    } else {
      // SINGLE CLICK: Select one, deselect others
      setSelectedLeads([currentId]);
      setLastSelectedIndex(index);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        if (lastSelectedIndex === -1) return;

        let nextIndex = e.key === 'ArrowDown' 
          ? Math.min(filteredLeads.length - 1, lastSelectedIndex + 1)
          : Math.max(0, lastSelectedIndex - 1);

        if (nextIndex !== lastSelectedIndex) {
          // In Google Sheets, shift+arrows selects range from an anchor
          // For simplicity, we'll just expand selection to the new index
          const start = Math.min(nextIndex, lastSelectedIndex);
          const end = Math.max(nextIndex, lastSelectedIndex);
          const rangeIds = filteredLeads.slice(start, end + 1).map(l => l._id || l.id);
          
          setSelectedLeads(prev => {
            const newSelection = Array.from(new Set([...prev, ...rangeIds]));
            return newSelection;
          });
          setLastSelectedIndex(nextIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lastSelectedIndex, filteredLeads]);
  const handleBulkAssign = async (newBdm) => {
    if (!newBdm) return;
    
    try {
      // 1. Update all selected leads in the database
      const updates = selectedLeads.map(id => databaseService.updateLead(id, { bdm: newBdm }));
      await Promise.all(updates);
      
      // 2. Update local state immediately for better responsiveness
      setLeads(prevLeads => prevLeads.map(lead => {
        const currentId = lead._id || lead.id;
        if (selectedLeads.includes(currentId)) {
          return { ...lead, bdm: newBdm };
        }
        return lead;
      }));
      
      alert(`Successfully assigned ${selectedLeads.length} leads to ${newBdm}`);
      setSelectedLeads([]);
    } catch (err) {
      console.error("Bulk assignment failed:", err);
      alert("Failed to assign leads. Please try again.");
    }
  };

  const handleInlineUpdate = async (id, field, value) => {
    if (!isAdmin) return;
    try {
      const updatedLead = await databaseService.updateLead(id, { [field]: value });
      setLeads(prev => prev.map(l => (l._id === id || l.id === id) ? updatedLead : l));
    } catch (err) {
      console.error("Inline update failed:", err);
    }
  };

  const handleCall = async (phoneNumber) => {
    if (!phoneNumber) return;
    try {
      // Get the most up-to-date user info from DB to avoid stale localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const users = await databaseService.fetchUsers();
      const user = users.find(u => u._id === storedUser._id);
      
      if (!user || !user.smartflo_agent || !user.smartflo_did) {
        alert("Wait! Your Agent Number or DID is not set. Please update your profile or ask the Admin to set it in 'Team Management'.");
        return;
      }

      await telephonyService.initiateCall(user.smartflo_agent, phoneNumber, user.smartflo_did);
      alert(`Request sent! SmartFlo will now call your extension (${user.smartflo_agent}) and then connect to ${phoneNumber}.`);
    } catch (err) {
      alert(err.message);
    }
  };


  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h1>Leads</h1>
          <p>Manage and track your prospective customers.</p>
        </div>
        {isPowerUser && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImportCsv} />
            <button className="btn btn-secondary" disabled={isImporting} onClick={() => fileInputRef.current.click()}>
              {isImporting ? 'Importing...' : 'Upload CSV'}
            </button>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>Add Lead</button>
            {isAdmin && (
              <button className="btn btn-danger" onClick={handleDeleteAll} style={{ backgroundColor: '#ef4444', color: 'white' }}>Delete All</button>
            )}
          </div>
        )}
      </div>

      <div className="card table-container">
        <div className="table-controls flex-between">
          <div style={{ display: 'flex', alignItems: 'center' }}>

          </div>
          <div className="table-stats" style={{ fontSize: '0.75rem', color: '#9aa5be' }}>
            Showing {filteredLeads.length} of {isAdmin ? leads.length : leads.filter(l => l.bdm === currentUser.name).length} leads
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}><input type="checkbox" onChange={(e) => setSelectedLeads(e.target.checked ? leads.map(l => l._id || l.id) : [])} /></th>
                <th>Date</th><th>Lead ID</th><th>Name</th><th>Mobile</th><th>Email</th><th>State</th><th>Type 1</th><th>Type 2</th><th>Profession</th><th>CTC</th><th>BDM</th><th>Status</th><th>Activity</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, index) => {
                const currentId = lead._id || lead.id;
                const isSelected = selectedLeads.includes(currentId);
                return (
                  <tr 
                    key={currentId} 
                    className={isSelected ? 'selected-row' : ''}
                    onClick={(e) => handleRowClick(index, e)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedLeads(checked ? [...selectedLeads, currentId] : selectedLeads.filter(id => id !== currentId));
                          setLastSelectedIndex(index);
                        }} 
                      />
                    </td>
                  <td contentEditable={isAdmin} onBlur={(e) => handleInlineUpdate(currentId, 'date', e.target.innerText)} onKeyDown={(e) => e.key === 'Enter' && e.target.blur()} onClick={(e) => e.stopPropagation()}>{lead.date}</td>
                  <td><span className="badge badge-secondary">{lead.leadId}</span></td>
                  <td contentEditable={isAdmin} onBlur={(e) => handleInlineUpdate(currentId, 'name', e.target.innerText)} onKeyDown={(e) => e.key === 'Enter' && e.target.blur()} onClick={(e) => e.stopPropagation()}>{lead.name}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                      <span 
                        contentEditable={isAdmin}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => handleInlineUpdate(currentId, 'mobile', e.target.innerText)}
                        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                        style={{ flex: 1, outline: 'none' }}
                      >
                        {lead.mobile}
                      </span>
                      <button 
                        className="btn-call-small"
                        contentEditable={false}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCall(lead.mobile); }}
                        style={{ padding: '4px', border: 'none', background: '#ecfdf5', color: '#059669', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Click to Call"
                      >
                        <Phone size={12} />
                      </button>
                    </div>
                  </td>
                  <td contentEditable={isAdmin} onBlur={(e) => handleInlineUpdate(currentId, 'email', e.target.innerText)} onKeyDown={(e) => e.key === 'Enter' && e.target.blur()} onClick={(e) => e.stopPropagation()}>{lead.email}</td>
                  <td contentEditable={isAdmin} onBlur={(e) => handleInlineUpdate(currentId, 'state', e.target.innerText)} onKeyDown={(e) => e.key === 'Enter' && e.target.blur()} onClick={(e) => e.stopPropagation()}>{lead.state}</td>
                  <td contentEditable={isAdmin} onBlur={(e) => handleInlineUpdate(currentId, 'type1', e.target.innerText)} onKeyDown={(e) => e.key === 'Enter' && e.target.blur()} onClick={(e) => e.stopPropagation()}>{lead.type1}</td>
                  <td contentEditable={isAdmin} onBlur={(e) => handleInlineUpdate(currentId, 'type2', e.target.innerText)} onKeyDown={(e) => e.key === 'Enter' && e.target.blur()} onClick={(e) => e.stopPropagation()}>{lead.type2}</td>
                  <td contentEditable={isAdmin} onBlur={(e) => handleInlineUpdate(currentId, 'profession', e.target.innerText)} onKeyDown={(e) => e.key === 'Enter' && e.target.blur()} onClick={(e) => e.stopPropagation()}>{lead.profession}</td>
                  <td contentEditable={isAdmin} onBlur={(e) => handleInlineUpdate(currentId, 'ctc', e.target.innerText)} onKeyDown={(e) => e.key === 'Enter' && e.target.blur()} onClick={(e) => e.stopPropagation()}>{lead.ctc}</td>
                  <td>
                    <select 
                      className="table-select" 
                      value={lead.bdm} 
                      disabled={!isPowerUser}
                      style={{ 
                        cursor: isPowerUser ? 'pointer' : 'not-allowed', 
                        backgroundColor: isPowerUser ? '#fff' : 'transparent', 
                        border: isPowerUser ? '1px solid #e5e9f2' : 'none',
                        fontWeight: isSelected ? '600' : 'normal'
                      }}
                      onClick={(e) => e.stopPropagation()} // Prevent row click toggle when clicking dropdown
                      onChange={(e) => {
                        const newValue = e.target.value;
                        if (isSelected && selectedLeads.length > 1) {
                          handleBulkAssign(newValue);
                        } else {
                          handleBdmChange(currentId, newValue);
                        }
                      }}
                    >
                      <option value="">Unassigned</option>
                      {team.map(mate => <option key={mate._id} value={mate.name}>{mate.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <StatusPicker 
                        value={lead.status1 || ''} 
                        options={STATUS_OPTIONS}
                        colors={STATUS_COLORS}
                        onChange={(val) => handleStatusChange(lead._id || lead.id, val)}
                        onClear={() => handleStatusChange(lead._id || lead.id, '')}
                      />
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto', whiteSpace: 'nowrap' }}
                        onClick={() => setActivityModalLead(lead)}
                      >
                        + Activity
                      </button>
                      {lead.leadActivities && lead.leadActivities.length > 0 && (
                        <button 
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto', backgroundColor: '#e0e7ff', borderColor: '#c7d2fe', color: '#4f46e5' }}
                          onClick={() => setViewActivitiesLead(lead)}
                          title="View Activities"
                        >
                          👁️ {lead.leadActivities.length}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header"><h2>Add New Lead</h2><button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button></div>
            <form onSubmit={handleAddLead}><div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group"><label>Date</label><input type="date" name="date" value={formData.date} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Mobile</label><input type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Email</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>State</label><input type="text" name="state" value={formData.state} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Type 1</label><input type="text" name="type1" value={formData.type1} onChange={handleInputChange} /></div>
              <div className="form-group"><label>Type 2</label><input type="text" name="type2" value={formData.type2} onChange={handleInputChange} /></div>
              <div className="form-group"><label>Profession</label><input type="text" name="profession" value={formData.profession} onChange={handleInputChange} /></div>
              <div className="form-group"><label>CTC</label><input type="text" name="ctc" value={formData.ctc} onChange={handleInputChange} /></div>
            </div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save Lead</button></div></form>
          </div>
        </div>
      )}

      {activityModalLead && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Add Activity</h2>
              <button className="modal-close" onClick={() => setActivityModalLead(null)}>&times;</button>
            </div>
            <form onSubmit={handleSaveActivity}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Activity Type <span style={{ color: 'red' }}>*</span></label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button"
                    onClick={() => setActivityData({...activityData, type: 'Call'})}
                    className={`btn ${activityData.type === 'Call' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                  >
                    📞 Call
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActivityData({...activityData, type: 'Message'})}
                    className={`btn ${activityData.type === 'Message' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                  >
                    💬 Message
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActivityData({...activityData, type: 'Meeting'})}
                    className={`btn ${activityData.type === 'Meeting' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                  >
                    📅 Meeting
                  </button>
                </div>
              </div>

              {activityData.type === 'Meeting' && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Meeting Date & Time <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    type="datetime-local" 
                    value={activityData.meetingTime}
                    onChange={(e) => setActivityData({...activityData, meetingTime: e.target.value})}
                    required
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '0.5rem' }}
                  />
                </div>
              )}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Comment / Note <span style={{ color: 'red' }}>*</span></label>
                <textarea 
                  value={activityData.comment}
                  onChange={(e) => setActivityData({...activityData, comment: e.target.value})}
                  required
                  rows={4}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'vertical' }}
                  placeholder="Enter details about this activity..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setActivityModalLead(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!activityData.type || !activityData.comment.trim()}>
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewActivitiesLead && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Activity Log: {viewActivitiesLead.name}</h2>
              <button className="modal-close" onClick={() => setViewActivitiesLead(null)}>&times;</button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {(!viewActivitiesLead.leadActivities || viewActivitiesLead.leadActivities.length === 0) ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No activities recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {viewActivitiesLead.leadActivities.slice().reverse().map((act) => (
                    <div key={act.id || act.date} style={{ 
                      padding: '1rem', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-background)',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ 
                          fontWeight: '600', 
                          color: act.type === 'Call' ? '#059669' : act.type === 'Meeting' ? '#8b5cf6' : act.type === 'StatusChange' ? '#d97706' : '#2563eb',
                          backgroundColor: act.type === 'Call' ? '#d1fae5' : act.type === 'Meeting' ? '#f5f3ff' : act.type === 'StatusChange' ? '#fef3c7' : '#dbeafe',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem'
                        }}>
                          {act.type === 'Call' ? '📞 Call' : act.type === 'Meeting' ? '📅 Meeting' : act.type === 'StatusChange' ? '🕒 Status' : '💬 Message'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {new Date(act.date).toLocaleString()}
                        </span>
                      </div>
                      {act.type === 'Meeting' && act.meetingTime && (
                        <div style={{ fontSize: '0.75rem', color: '#6d28d9', marginBottom: '0.5rem', fontWeight: '600' }}>
                          Scheduled for: {new Date(act.meetingTime).toLocaleString()}
                        </div>
                      )}
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                        {act.comment}
                      </p>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                        Performed by: {act.performedBy || 'System'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setViewActivitiesLead(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
