import React, { createContext, useContext, useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';

const CrmContext = createContext();

const INITIAL_LEADS = [];
const INITIAL_CONTACTS = [];

const INITIAL_ONBOARDINGS = [];

export const CrmProvider = ({ children }) => {
  // One-time data cleanup for existing users to remove demo data from LocalStorage
  useEffect(() => {
    const isCleaned = localStorage.getItem('crm_data_cleaned_v3');
    if (!isCleaned) {
      const keysToClear = [
        'crm_leads', 'crm_contacts', 'crm_onboardings', 
        'crm_activities', 'crm_database_onboardings', 'crm_database_leads'
      ];
      keysToClear.forEach(key => localStorage.removeItem(key));
      localStorage.setItem('crm_data_cleaned_v3', 'true');
      window.location.reload(); // Refresh to ensure state is clean
    }
  }, []);

  const [leads, setLeads] = useState([]);

  // Fetch leads from the database on initial load
  useEffect(() => {
    const loadLeads = async () => {
      const data = await databaseService.fetchLeads(INITIAL_LEADS);
      setLeads(data);
    };
    loadLeads();
  }, []);
  const [contacts, setContacts] = useState(() => {
    const local = localStorage.getItem('crm_contacts');
    return local ? JSON.parse(local) : INITIAL_CONTACTS;
  });
  const [onboardings, setOnboardings] = useState([]);

  // Fetch onboardings from the database on initial load
  useEffect(() => {
    const loadData = async () => {
      const data = await databaseService.fetchOnboardings();
      setOnboardings(data);
    };
    loadData();
  }, []);
  const [activities, setActivities] = useState(() => {
    const local = localStorage.getItem('crm_activities');
    return local ? JSON.parse(local) : [];
  });
  
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('crm_theme_mode') || 'day');
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem('crm_theme_color') || '#4f8ef7');
  const [themeType, setThemeType] = useState(() => localStorage.getItem('crm_theme_type') || 'lite');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync to localStorage for fast dashboard updates during testing
  useEffect(() => {
    if (leads.length > 0) {
      localStorage.setItem('crm_leads', JSON.stringify(leads));
    }
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('crm_contacts', JSON.stringify(contacts));
  }, [contacts]);

  // We no longer strictly need this because databaseService handles its own storage,
  // but we keep it to ensure dashboard stays synced across reloads instantly during testing.
  useEffect(() => {
    if (onboardings.length > 0) {
      localStorage.setItem('crm_onboardings', JSON.stringify(onboardings));
    }
  }, [onboardings]);

  useEffect(() => {
    localStorage.setItem('crm_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('crm_theme_mode', themeMode);
    localStorage.setItem('crm_theme_color', themeColor);
    localStorage.setItem('crm_theme_type', themeType);

    if (themeMode === 'night' || themeType === 'dark') {
      document.documentElement.style.setProperty('--color-surface', '#1a1f36');
      document.documentElement.style.setProperty('--color-background', '#0d1126');
      document.documentElement.style.setProperty('--text-primary', '#f4f6fb');
      document.documentElement.style.setProperty('--text-secondary', '#9aa5be');
      document.documentElement.style.setProperty('--border-color', '#2d3748');
    } else {
      document.documentElement.style.setProperty('--color-surface', '#ffffff');
      document.documentElement.style.setProperty('--color-background', '#f4f6fb');
      document.documentElement.style.setProperty('--text-primary', '#1a1f36');
      document.documentElement.style.setProperty('--text-secondary', '#5a6480');
      document.documentElement.style.setProperty('--border-color', '#e5e9f2');
    }
    document.documentElement.style.setProperty('--color-primary', themeColor);
  }, [themeMode, themeColor, themeType]);

  const addLead = async (lead) => {
    const dbRecord = await databaseService.createLead(lead);
    setLeads([dbRecord, ...leads]);
    addActivity({ type: 'new_lead', text: `New lead ${lead.name} added`, color: 'bg-warning' });
  };

  const bulkAddLeads = async (leadsArray) => {
    const dbRecords = await databaseService.bulkCreateLeads(leadsArray);
    setLeads([...dbRecords, ...leads]);
    addActivity({ type: 'bulk_import', text: `Imported ${leadsArray.length} leads`, color: 'bg-primary' });
    return dbRecords;
  };

  const clearAllLeads = async () => {
    await databaseService.clearAllLeads();
    setLeads([]);
    addActivity({ type: 'delete_all', text: 'All leads have been cleared', color: 'bg-danger' });
  };

  const updateLead = async (id, updates) => {
    await databaseService.updateLead(id, updates);
    setLeads(leads.map(l => (l._id === id || l.id === id) ? { ...l, ...updates } : l));
  };

  const convertToContact = (lead) => {
    const newContact = {
      id: Date.now(),
      name: lead.name,
      title: lead.profession || 'Unknown',
      company: 'Unknown',
      phone: lead.mobile,
      email: lead.email,
    };
    setContacts([...contacts, newContact]);
    addActivity({ type: 'convert', text: `Lead ${lead.name} converted to contact`, color: 'bg-success' });
    // optionally remove lead
    // setLeads(leads.filter(l => l.id !== lead.id));
  };

  const addContact = (contact) => {
    setContacts([...contacts, { ...contact, id: Date.now() }]);
    addActivity({ type: 'new_contact', text: `New contact ${contact.name} added`, color: 'bg-primary' });
  };

  const addOnboarding = async (onboardingData) => {
    // 1. Send data to the separate Database Server Layer
    const dbRecord = await databaseService.createOnboarding(onboardingData);
    
    // 2. Update local UI state
    setOnboardings([dbRecord, ...onboardings]);
    
    // 3. Update the lead status to SALE in DB and State
    const leadToUpdate = leads.find(l => l.mobile === onboardingData.mobile);
    if (leadToUpdate) {
      await databaseService.updateLead(leadToUpdate._id || leadToUpdate.id, { status1: 'SALE' });
      setLeads(leads.map(l => (l._id === (leadToUpdate._id || leadToUpdate.id) || l.id === leadToUpdate.id) ? { ...l, status1: 'SALE' } : l));
    }
    
    // 4. Log the activity
    addActivity({ type: 'onboarding', text: `Lead ${onboardingData.name} successfully onboarded`, color: 'bg-success' });
  };

  const addActivity = (activity) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    setActivities([
      { ...activity, id: Date.now(), time: new Date().toISOString(), performedBy: currentUser.name }, 
      ...activities
    ].slice(0, 30)); // Increased slice to 30 for better audit trail
  };

  return (
    <CrmContext.Provider value={{
      leads, setLeads, addLead, bulkAddLeads, clearAllLeads, updateLead, convertToContact,
      contacts, addContact,
      onboardings, addOnboarding,
      activities,
      themeMode, setThemeMode,
      themeColor, setThemeColor,
      themeType, setThemeType,
      searchQuery, setSearchQuery
    }}>
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = () => useContext(CrmContext);
