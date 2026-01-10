import { supabase } from '../supabase';
import { MaintenanceRequest } from '../../App';

type DbMaintenanceRequestRow = {
  id: string;
  asset_id: string;
  asset_name: string;
  staff_id: string;
  staff_name: string;
  issue_description: string;
  status: string;
  submitted_date: string;
  completed_date: string | null;
  created_at?: string;
  updated_at?: string;
};

// Get all maintenance requests
export async function getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  const { data, error } = await supabase
    .from<DbMaintenanceRequestRow>('maintenance_requests')
    .select('*')
    .order('submitted_date', { ascending: false });

  if (error) {
    console.error('Error fetching maintenance requests:', error);
    throw error;
  }

  return (data || []).map(mapRowToMaintenanceRequest);
}

// Get maintenance request by ID
export async function getMaintenanceRequestById(id: string): Promise<MaintenanceRequest | null> {
  const { data, error } = await supabase
    .from<DbMaintenanceRequestRow>('maintenance_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching maintenance request:', error);
    throw error;
  }

  return data ? mapRowToMaintenanceRequest(data) : null;
}

// Get maintenance requests by staff ID
export async function getMaintenanceRequestsByStaffId(staffId: string): Promise<MaintenanceRequest[]> {
  const { data, error } = await supabase
    .from<DbMaintenanceRequestRow>('maintenance_requests')
    .select('*')
    .eq('staff_id', staffId)
    .order('submitted_date', { ascending: false });

  if (error) {
    console.error('Error fetching maintenance requests by staff ID:', error);
    throw error;
  }

  return (data || []).map(mapRowToMaintenanceRequest);
}

// Create a new maintenance request
export async function createMaintenanceRequest(
  request: Omit<MaintenanceRequest, 'id'>
): Promise<MaintenanceRequest> {
  const { data, error } = await supabase
    .from<DbMaintenanceRequestRow>('maintenance_requests')
    .insert({
      asset_id: request.assetId,
      asset_name: request.assetName,
      staff_id: request.staffId,
      staff_name: request.staffName,
      issue_description: request.issueDescription,
      status: request.status,
      submitted_date: request.submittedDate,
      completed_date: request.completedDate || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating maintenance request:', error);
    throw error;
  }

  return mapRowToMaintenanceRequest(data);
}

// Update a maintenance request
export async function updateMaintenanceRequest(
  id: string,
  updates: Partial<MaintenanceRequest>
): Promise<MaintenanceRequest> {
  const updateData: Partial<DbMaintenanceRequestRow> = {};
  
  if (updates.assetId !== undefined) updateData.asset_id = updates.assetId;
  if (updates.assetName !== undefined) updateData.asset_name = updates.assetName;
  if (updates.staffId !== undefined) updateData.staff_id = updates.staffId;
  if (updates.staffName !== undefined) updateData.staff_name = updates.staffName;
  if (updates.issueDescription !== undefined) updateData.issue_description = updates.issueDescription;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.submittedDate !== undefined) updateData.submitted_date = updates.submittedDate;
  if (updates.completedDate !== undefined) updateData.completed_date = updates.completedDate || null;

  const { data, error } = await supabase
    .from<DbMaintenanceRequestRow>('maintenance_requests')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating maintenance request:', error);
    throw error;
  }

  return mapRowToMaintenanceRequest(data);
}

// Delete a maintenance request
export async function deleteMaintenanceRequest(id: string): Promise<void> {
  const { error } = await supabase
    .from('maintenance_requests')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting maintenance request:', error);
    throw error;
  }
}

// Helper: map DB row to MaintenanceRequest type used in app
function mapRowToMaintenanceRequest(row: DbMaintenanceRequestRow): MaintenanceRequest {
  return {
    id: row.id,
    assetId: row.asset_id,
    assetName: row.asset_name,
    staffId: row.staff_id,
    staffName: row.staff_name,
    issueDescription: row.issue_description,
    status: row.status as 'pending' | 'in_progress' | 'completed',
    submittedDate: row.submitted_date,
    completedDate: row.completed_date || undefined,
  };
}

