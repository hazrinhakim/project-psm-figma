import { supabase } from '../supabase';
import { MaintenanceRequest } from '../../App';

type DbMaintenanceRequestRow = {
  id: string;
  asset_id: string | null;
  requested_by: string | null;
  title: string;
  description: string | null;
  status: string;
  admin_remark: string | null;
  created_at: string | null;
  updated_at: string | null;
  assets?: {
    asset_no: string | null;
    asset_name: string | null;
  } | null;
  profiles?: {
    full_name: string | null;
  } | null;
};

// Get all maintenance requests
export async function getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  const { data, error } = await supabase
    .from<DbMaintenanceRequestRow>('maintenance_requests')
    .select('*, assets(asset_no, asset_name), profiles(full_name)')
    .order('created_at', { ascending: false });

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
    .select('*, assets(asset_no, asset_name), profiles(full_name)')
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
    .select('*, assets(asset_no, asset_name), profiles(full_name)')
    .eq('requested_by', staffId)
    .order('created_at', { ascending: false });

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
      requested_by: request.requestedBy,
      title: request.title,
      description: request.description || null,
      status: request.status,
      admin_remark: request.adminRemark || null,
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
  if (updates.requestedBy !== undefined) updateData.requested_by = updates.requestedBy;
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description || null;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.adminRemark !== undefined) updateData.admin_remark = updates.adminRemark || null;
  if (updates.updatedAt !== undefined) updateData.updated_at = updates.updatedAt || null;

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
    assetId: row.asset_id ?? '',
    assetLabel: row.assets?.asset_name || row.assets?.asset_no || '',
    requestedBy: row.requested_by ?? '',
    requestedByName: row.profiles?.full_name ?? '',
    title: row.title,
    description: row.description ?? '',
    status: row.status as 'Pending' | 'In Progress' | 'Resolved',
    adminRemark: row.admin_remark ?? '',
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  };
}

