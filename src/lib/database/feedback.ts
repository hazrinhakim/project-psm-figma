import { supabase } from '../supabase';
import { Feedback } from '../../App';

type DbFeedbackRow = {
  id: string;
  created_at: string;
  created_by: string;
  role: string;
  message: string;
  status: string;
  email: string | null;
};

type DbProfileRow = {
  id: string;
  full_name: string | null;
};

// Get all feedback
export async function getFeedback(): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from<DbFeedbackRow>('feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching feedback:', error);
    throw error;
  }

  const rows = data || [];
  if (rows.length === 0) {
    return [];
  }

  const ids = Array.from(new Set(rows.map((row) => row.created_by)));
  const { data: profiles, error: profileError } = await supabase
    .from<DbProfileRow>('profiles')
    .select('id, full_name')
    .in('id', ids);

  if (profileError) {
    console.error('Error fetching feedback profiles:', profileError);
    throw profileError;
  }

  const profileMap = new Map(
    (profiles || []).map((profile) => [profile.id, profile.full_name ?? ''])
  );

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    createdBy: row.created_by,
    createdByName: profileMap.get(row.created_by) ?? '',
    role: row.role as 'staff' | 'admin_assistant',
    message: row.message,
    status: row.status as 'open' | 'reviewed' | 'closed',
    email: row.email ?? ''
  }));
}

// Get feedback by ID
export async function getFeedbackById(id: string): Promise<Feedback | null> {
  const { data, error } = await supabase
    .from<DbFeedbackRow>('feedback')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching feedback:', error);
    throw error;
  }

  const { data: profiles } = await supabase
    .from<DbProfileRow>('profiles')
    .select('id, full_name')
    .eq('id', data.created_by)
    .maybeSingle();

  return {
    id: data.id,
    createdAt: data.created_at,
    createdBy: data.created_by,
    createdByName: profiles?.full_name ?? '',
    role: data.role as 'staff' | 'admin_assistant',
    message: data.message,
    status: data.status as 'open' | 'reviewed' | 'closed',
    email: data.email ?? ''
  };
}

// Get feedback by staff ID
export async function getFeedbackByStaffId(staffId: string): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from<DbFeedbackRow>('feedback')
    .select('*')
    .eq('created_by', staffId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching feedback by staff ID:', error);
    throw error;
  }

  const rows = data || [];
  if (rows.length === 0) {
    return [];
  }

  const { data: profiles } = await supabase
    .from<DbProfileRow>('profiles')
    .select('id, full_name')
    .in('id', rows.map((row) => row.created_by));

  const profileMap = new Map(
    (profiles || []).map((profile) => [profile.id, profile.full_name ?? ''])
  );

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    createdBy: row.created_by,
    createdByName: profileMap.get(row.created_by) ?? '',
    role: row.role as 'staff' | 'admin_assistant',
    message: row.message,
    status: row.status as 'open' | 'reviewed' | 'closed',
    email: row.email ?? ''
  }));
}

// Create a new feedback
export async function createFeedback(feedback: Omit<Feedback, 'id'>): Promise<Feedback> {
  const { data, error } = await supabase
    .from<DbFeedbackRow>('feedback')
    .insert({
      created_by: feedback.createdBy,
      role: feedback.role,
      message: feedback.message,
      status: feedback.status,
      email: feedback.email || null
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating feedback:', error);
    throw error;
  }

  return {
    id: data.id,
    createdAt: data.created_at,
    createdBy: data.created_by,
    createdByName: feedback.createdByName ?? '',
    role: data.role as 'staff' | 'admin_assistant',
    message: data.message,
    status: data.status as 'open' | 'reviewed' | 'closed',
    email: data.email ?? ''
  };
}

// Update feedback
export async function updateFeedback(id: string, updates: Partial<Feedback>): Promise<Feedback> {
  const updateData: any = {};
  
  if (updates.createdBy !== undefined) updateData.created_by = updates.createdBy;
  if (updates.role !== undefined) updateData.role = updates.role;
  if (updates.message !== undefined) updateData.message = updates.message;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.email !== undefined) updateData.email = updates.email || null;

  const { data, error } = await supabase
    .from<DbFeedbackRow>('feedback')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating feedback:', error);
    throw error;
  }

  return {
    id: data.id,
    createdAt: data.created_at,
    createdBy: data.created_by,
    createdByName: updates.createdByName ?? '',
    role: data.role as 'staff' | 'admin_assistant',
    message: data.message,
    status: data.status as 'open' | 'reviewed' | 'closed',
    email: data.email ?? ''
  };
}

// Delete feedback
export async function deleteFeedback(id: string): Promise<void> {
  const { error } = await supabase
    .from('feedback')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting feedback:', error);
    throw error;
  }
}

