/**
 * Gradus CRM – Database Service (Supabase Engine)
 *
 * All data is now stored in Supabase (PostgreSQL).
 * The public API is identical to the previous IndexedDB
 * version so no component needs to change.
 *
 * Supabase Tables required:
 *   leads, onboardings, meetings, targets, users, master_archive
 */

import { supabase } from './supabaseClient';

// ─────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────

/** Generate a short unique ID with a prefix */
const uid = (prefix) =>
  `${prefix}_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;

/** Write an audit entry to master_archive */
async function logToArchive(tableName, action, payload) {
  try {
    await supabase.from('master_archive').insert({
      table_name: tableName,
      action,
      payload,
      timestamp: new Date().toISOString(),
    });
  } catch (_) {
    // Non-blocking – archive errors shouldn't break the main operation
  }
}

/** Fetch a single row by _id */
async function getById(table, id) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('_id', id)
    .single();
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────
// LEADS
// ─────────────────────────────────────────────────
/** Normalize lead data to ensure camelCase keys exist */
const normalizeLead = (lead) => {
  if (!lead) return lead;
  return {
    ...lead,
    leadId: lead.leadId || lead.leadid || '',
    type1: lead.type1 || lead.type_1 || '',
    type2: lead.type2 || lead.type_2 || '',
    createdat: lead.createdat || lead.created_at || '',
    updatedat: lead.updatedat || lead.updated_at || '',
  };
};

const fetchLeads = async () => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('createdat', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeLead);
};

const createLead = async (lead) => {
  // Strip out the local 'id' used for UI state to avoid DB conflicts
  const { id, ...leadData } = lead;
  const record = {
    _id: uid('ld'),
    ...leadData,
    createdat: new Date().toISOString(),
    updatedat: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('leads').insert(record).select().single();
  if (error) {
    console.error("Supabase Create Lead Error:", error);
    throw error;
  }
  const normalized = normalizeLead(data);
  await logToArchive('leads', 'CREATED', normalized);
  return normalized;
};

const updateLead = async (id, updates) => {
  const existing = await getById('leads', id);
  const updated = { ...existing, ...updates, updatedat: new Date().toISOString() };
  const { data, error } = await supabase.from('leads').update(updated).eq('_id', id).select().single();
  if (error) throw error;
  await logToArchive('leads', 'UPDATED', data);
  return data;
};

const deleteLead = async (id) => {
  const { error } = await supabase.from('leads').delete().eq('_id', id);
  if (error) throw error;
  await logToArchive('leads', 'DELETED', { _id: id });
  return { success: true };
};

const bulkCreateLeads = async (leadsArray) => {
  const records = leadsArray.map(lead => {
    // Strip out local 'id'
    const { id, ...leadData } = lead;
    return {
      _id: uid('ld'),
      ...leadData,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
    };
  });
  
  const { data, error } = await supabase.from('leads').insert(records).select();
  if (error) {
    console.error("Supabase Bulk Create Lead Error:", error);
    throw error;
  }
  const normalized = (data || []).map(normalizeLead);
  await logToArchive('leads', 'BULK_CREATED', { count: records.length });
  return normalized;
};

const clearAllLeads = async () => {
  const { error } = await supabase.from('leads').delete().neq('_id', 'placeholder'); // Delete all
  if (error) throw error;
  await logToArchive('leads', 'CLEARED_ALL', {});
  return { success: true };
};

// ─────────────────────────────────────────────────
// ONBOARDINGS
// ─────────────────────────────────────────────────
const normalizeOnboarding = (ob) => {
  if (!ob) return ob;
  return {
    ...ob,
    onboardingDate: ob.onboardingDate || ob.onboarding_date || '',
    createdat: ob.createdat || ob.created_at || '',
    updatedat: ob.updatedat || ob.updated_at || '',
  };
};

const fetchOnboardings = async () => {
  const { data, error } = await supabase
    .from('onboardings')
    .select('*')
    .order('createdat', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeOnboarding);
};

const createOnboarding = async (payload) => {
  const record = {
    _id: uid('ob'),
    ...payload,
    createdat: new Date().toISOString(),
    updatedat: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('onboardings').insert(record).select().single();
  if (error) throw error;
  const normalized = normalizeOnboarding(data);
  await logToArchive('onboardings', 'CREATED', normalized);
  return normalized;
};

const updateOnboarding = async (id, updates) => {
  const existing = await getById('onboardings', id);
  const updated = { ...existing, ...updates, updatedat: new Date().toISOString() };
  const { data, error } = await supabase.from('onboardings').update(updated).eq('_id', id).select().single();
  if (error) throw error;
  const normalized = normalizeOnboarding(data);
  await logToArchive('onboardings', 'UPDATED', normalized);
  return normalized;
};

// ─────────────────────────────────────────────────
// MEETINGS
// ─────────────────────────────────────────────────
const normalizeMeeting = (mt) => {
  if (!mt) return mt;
  return {
    ...mt,
    meetingTime: mt.meetingTime || mt.meeting_time || '',
    createdat: mt.createdat || mt.created_at || '',
    updatedat: mt.updatedat || mt.updated_at || '',
  };
};

const fetchMeetings = async () => {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .order('createdat', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeMeeting);
};

const createMeeting = async (payload) => {
  const record = {
    _id: uid('mt'),
    ...payload,
    createdat: new Date().toISOString(),
    updatedat: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('meetings').insert(record).select().single();
  if (error) throw error;
  const normalized = normalizeMeeting(data);
  await logToArchive('meetings', 'CREATED', normalized);
  return normalized;
};

const updateMeeting = async (id, updates) => {
  const existing = await getById('meetings', id);
  const updated = { ...existing, ...updates, updatedat: new Date().toISOString() };
  const { data, error } = await supabase.from('meetings').update(updated).eq('_id', id).select().single();
  if (error) throw error;
  const normalized = normalizeMeeting(data);
  await logToArchive('meetings', 'UPDATED', normalized);
  return normalized;
};

const markMeetingNotified = async (id) => {
  const { data, error } = await supabase.from('meetings').update({ notified: true }).eq('_id', id).select().single();
  if (error) throw error;
  return data;
};

const deleteMeeting = async (id) => {
  const { error } = await supabase.from('meetings').delete().eq('_id', id);
  if (error) throw error;
  await logToArchive('meetings', 'DELETED', { _id: id });
  return { success: true };
};

// ─────────────────────────────────────────────────
// TARGETS
// ─────────────────────────────────────────────────
const fetchTargets = async () => {
  const { data, error } = await supabase
    .from('targets')
    .select('*')
    .order('createdat', { ascending: false });
  if (error) throw error;
  return data;
};

const createTarget = async (payload) => {
  const record = {
    _id: uid('tg'),
    ...payload,
    createdat: new Date().toISOString(),
    updatedat: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('targets').insert(record).select().single();
  if (error) throw error;
  await logToArchive('targets', 'CREATED', data);
  return data;
};

const updateTarget = async (id, updates) => {
  const existing = await getById('targets', id);
  const updated = { ...existing, ...updates, updatedat: new Date().toISOString() };
  const { data, error } = await supabase.from('targets').update(updated).eq('_id', id).select().single();
  if (error) throw error;
  await logToArchive('targets', 'UPDATED', data);
  return data;
};

const deleteTarget = async (id) => {
  const { error } = await supabase.from('targets').delete().eq('_id', id);
  if (error) throw error;
  await logToArchive('targets', 'DELETED', { _id: id });
  return { success: true };
};

// ─────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────
const fetchUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('createdat', { ascending: false });
  if (error) throw error;

  // Seed default admin if table is empty
  if (data.length === 0) {
    const admin = {
      _id: 'usr_admin',
      name: 'Super Admin',
      email: 'admin@gradus.com',
      password: 'admin',
      role: 'Admin',
      status: 'Active',
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
    };
    const { data: seeded, error: seedErr } = await supabase
      .from('users')
      .insert(admin)
      .select()
      .single();
    if (seedErr) throw seedErr;
    await logToArchive('users', 'SEED_ADMIN', seeded);
    return [seeded];
  }
  return data;
};

const createUser = async (userData) => {
  const record = {
    _id: uid('usr'),
    ...userData,
    status: userData.status || 'Active',
    createdat: new Date().toISOString(),
    updatedat: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('users').insert(record).select().single();
  if (error) throw error;
  await logToArchive('users', 'CREATED', { ...data, password: '[REDACTED]' });
  return data;
};

const updateUser = async (id, updates) => {
  const existing = await getById('users', id);
  const updated = { ...existing, ...updates, updatedat: new Date().toISOString() };
  const { data, error } = await supabase.from('users').update(updated).eq('_id', id).select().single();
  if (error) throw error;
  await logToArchive('users', 'UPDATED', { ...data, password: '[REDACTED]' });
  return data;
};

const deleteUser = async (id) => {
  const { error } = await supabase.from('users').delete().eq('_id', id);
  if (error) throw error;
  await logToArchive('users', 'DELETED', { _id: id });
  return { success: true };
};

const verifyLogin = async (email, password) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .eq('status', 'Active')
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // No user found
    throw error;
  }
  return data;
};

const updateUserPassword = async (email, currentPassword, newPassword) => {
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email);
  if (error) throw error;

  const user = users?.[0];
  if (!user) throw new Error('User not found');
  if (user.password !== currentPassword) throw new Error('Incorrect current password');

  const { data, error: updateErr } = await supabase
    .from('users')
    .update({ password: newPassword, updatedat: new Date().toISOString() })
    .eq('_id', user._id)
    .select()
    .single();
  if (updateErr) throw updateErr;
  await logToArchive('users', 'PASSWORD_CHANGED', { email });
  return data;
};

// ─────────────────────────────────────────────────
// MASTER ARCHIVE (read)
// ─────────────────────────────────────────────────
const fetchArchive = async () => {
  const { data, error } = await supabase
    .from('master_archive')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────────
// BROCHURES
// ─────────────────────────────────────────────────
const fetchBrochures = async () => {
  const { data, error } = await supabase
    .from('brochures')
    .select('*')
    .order('createdat', { ascending: false });
  if (error) throw error;
  return data || [];
};

const createBrochure = async (payload) => {
  const record = {
    _id: uid('br'),
    ...payload,
    createdat: new Date().toISOString(),
    updatedat: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('brochures').insert(record).select().single();
  if (error) throw error;
  return data;
};

const deleteBrochure = async (id) => {
  const { error } = await supabase.from('brochures').delete().eq('_id', id);
  if (error) throw error;
  return { success: true };
};

// ─────────────────────────────────────────────────
// Public service object – mirrors old IndexedDB API
// ─────────────────────────────────────────────────
export const databaseService = {
  // Leads
  fetchLeads,
  createLead,
  updateLead,
  deleteLead,
  bulkCreateLeads,
  clearAllLeads,
  // Onboardings
  fetchOnboardings,
  createOnboarding,
  updateOnboarding,
  // Meetings
  fetchMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  markMeetingNotified,
  // Targets
  fetchTargets,
  createTarget,
  updateTarget,
  deleteTarget,
  // Users
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  verifyLogin,
  updateUserPassword,
  // Brochures
  fetchBrochures,
  createBrochure,
  deleteBrochure,
  // Archive
  fetchArchive,
  fetchMasterArchive: fetchArchive,
  logToArchive,
};

export default databaseService;
