import { supabase } from '../supabase';
import { Feedback } from '../../App';

// Get all feedback
export async function getFeedback(): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('submitted_date', { ascending: false });

  if (error) {
    console.error('Error fetching feedback:', error);
    throw error;
  }

  return data || [];
}

// Get feedback by ID
export async function getFeedbackById(id: string): Promise<Feedback | null> {
  const { data, error } = await supabase
    .from('feedback')
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

  return data;
}

// Get feedback by staff ID
export async function getFeedbackByStaffId(staffId: string): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('staff_id', staffId)
    .order('submitted_date', { ascending: false });

  if (error) {
    console.error('Error fetching feedback by staff ID:', error);
    throw error;
  }

  return data || [];
}

// Create a new feedback
export async function createFeedback(feedback: Omit<Feedback, 'id'>): Promise<Feedback> {
  const { data, error } = await supabase
    .from('feedback')
    .insert({
      staff_id: feedback.staffId,
      staff_name: feedback.staffName,
      message: feedback.message,
      submitted_date: feedback.submittedDate,
      status: feedback.status,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating feedback:', error);
    throw error;
  }

  return {
    id: data.id,
    staffId: data.staff_id,
    staffName: data.staff_name,
    message: data.message,
    submittedDate: data.submitted_date,
    status: data.status,
  };
}

// Update feedback
export async function updateFeedback(id: string, updates: Partial<Feedback>): Promise<Feedback> {
  const updateData: any = {};
  
  if (updates.staffId !== undefined) updateData.staff_id = updates.staffId;
  if (updates.staffName !== undefined) updateData.staff_name = updates.staffName;
  if (updates.message !== undefined) updateData.message = updates.message;
  if (updates.submittedDate !== undefined) updateData.submitted_date = updates.submittedDate;
  if (updates.status !== undefined) updateData.status = updates.status;

  const { data, error } = await supabase
    .from('feedback')
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
    staffId: data.staff_id,
    staffName: data.staff_name,
    message: data.message,
    submittedDate: data.submitted_date,
    status: data.status,
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

