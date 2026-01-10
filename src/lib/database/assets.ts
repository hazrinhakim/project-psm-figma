import { supabase } from '../supabase';
import { Asset } from '../../App';

type DbAssetRow = {
  id: string;
  asset_id: string;
  name: string;
  category: string;
  location: string;
  purchase_date: string | null;
  warranty_expiry: string | null;
  status: string;
  qr_code: string | null;
  created_at?: string;
};

// Get all assets
export async function getAssets(): Promise<Asset[]> {
  const { data, error } = await supabase
    .from<DbAssetRow>('assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }

  return (data || []).map(mapRowToAsset);
}

// Get asset by ID
export async function getAssetById(id: string): Promise<Asset | null> {
  const { data, error } = await supabase
    .from<DbAssetRow>('assets')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching asset by id:', error);
    throw error;
  }

  return data ? mapRowToAsset(data) : null;
}

// Get asset by asset ID
export async function getAssetByAssetId(assetId: string): Promise<Asset | null> {
  const { data, error } = await supabase
    .from<DbAssetRow>('assets')
    .select('*')
    .eq('asset_id', assetId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching asset by asset ID:', error);
    throw error;
  }

  return data ? mapRowToAsset(data) : null;
}

// Create a new asset
export async function createAsset(asset: Omit<Asset, 'id'>): Promise<Asset> {
  const { data, error } = await supabase
    .from<DbAssetRow>('assets')
    .insert({
      asset_id: asset.assetId,
      name: asset.name,
      category: asset.category,
      location: asset.location,
      purchase_date: asset.purchaseDate || null,
      warranty_expiry: asset.warrantyExpiry || null,
      status: asset.status,
      qr_code: asset.qrCode || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating asset:', error);
    throw error;
  }

  return mapRowToAsset(data);
}

// Update an asset
export async function updateAsset(id: string, updates: Partial<Asset>): Promise<Asset> {
  const updateData: Partial<DbAssetRow> = {};

  if (updates.assetId !== undefined) updateData.asset_id = updates.assetId;
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.location !== undefined) updateData.location = updates.location;
  if (updates.purchaseDate !== undefined) updateData.purchase_date = updates.purchaseDate || null;
  if (updates.warrantyExpiry !== undefined) updateData.warranty_expiry = updates.warrantyExpiry || null;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.qrCode !== undefined) updateData.qr_code = updates.qrCode || null;

  const { data, error } = await supabase
    .from<DbAssetRow>('assets')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating asset:', error);
    throw error;
  }

  return mapRowToAsset(data);
}

// Delete an asset
export async function deleteAsset(id: string): Promise<void> {
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting asset:', error);
    throw error;
  }
}

// Helper: map DB row to Asset type used in app
function mapRowToAsset(row: DbAssetRow): Asset {
  return {
    id: row.id,
    assetId: row.asset_id,
    name: row.name,
    category: row.category,
    location: row.location,
    purchaseDate: row.purchase_date ?? '',
    warrantyExpiry: row.warranty_expiry ?? '',
    status: row.status as 'active' | 'maintenance' | 'inactive',
    qrCode: row.qr_code ?? null,
  };
}
