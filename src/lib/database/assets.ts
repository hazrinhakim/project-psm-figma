import { supabase } from '../supabase';
import { Asset } from '../../App';

type DbAssetRow = {
  id: string;
  asset_no: string | null;
  asset_name: string | null;
  year: number | null;
  department: string | null;
  unit: string | null;
  user_name: string | null;
  purchase_date: string | null;
  price: number | null;
  supplier: string | null;
  source: string | null;
  model: string | null;
  serial_no: string | null;
  processor: string | null;
  ram_capacity: string | null;
  hdd_capacity: string | null;
  monitor_model: string | null;
  monitor_serial_no: string | null;
  monitor_asset_no: string | null;
  keyboard_model: string | null;
  keyboard_serial_no: string | null;
  keyboard_asset_no: string | null;
  mouse_model: string | null;
  mouse_serial_no: string | null;
  mouse_asset_no: string | null;
  accessories: string | null;
  created_at: string | null;
  category_id: string;
  type: string | null;
  qr_code: string | null;
  asset_categories?: {
    name: string | null;
  } | null;
};

// Get all assets
export async function getAssets(): Promise<Asset[]> {
  const { data, error } = await supabase
    .from<DbAssetRow>('assets')
    .select('*, asset_categories(name)')
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
    .select('*, asset_categories(name)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching asset by id:', error);
    throw error;
  }

  return data ? mapRowToAsset(data) : null;
}

// Get asset by asset ID
export async function getAssetByAssetId(assetNo: string): Promise<Asset | null> {
  const { data, error } = await supabase
    .from<DbAssetRow>('assets')
    .select('*, asset_categories(name)')
    .eq('asset_no', assetNo)
    .maybeSingle();

  if (error) {
    console.error('Error fetching asset by asset ID:', error);
    throw error;
  }

  return data ? mapRowToAsset(data) : null;
}

// Create a new asset
export async function createAsset(
  asset: Omit<Asset, 'id' | 'createdAt' | 'categoryName'>
): Promise<Asset> {
  const { data, error } = await supabase
    .from<DbAssetRow>('assets')
    .insert({
      asset_no: asset.assetNo || null,
      asset_name: asset.assetName || null,
      year: asset.year ?? null,
      department: asset.department || null,
      unit: asset.unit || null,
      user_name: asset.userName || null,
      purchase_date: asset.purchaseDate || null,
      price: asset.price ?? null,
      supplier: asset.supplier || null,
      source: asset.source || null,
      model: asset.model || null,
      serial_no: asset.serialNo || null,
      processor: asset.processor || null,
      ram_capacity: asset.ramCapacity || null,
      hdd_capacity: asset.hddCapacity || null,
      monitor_model: asset.monitorModel || null,
      monitor_serial_no: asset.monitorSerialNo || null,
      monitor_asset_no: asset.monitorAssetNo || null,
      keyboard_model: asset.keyboardModel || null,
      keyboard_serial_no: asset.keyboardSerialNo || null,
      keyboard_asset_no: asset.keyboardAssetNo || null,
      mouse_model: asset.mouseModel || null,
      mouse_serial_no: asset.mouseSerialNo || null,
      mouse_asset_no: asset.mouseAssetNo || null,
      accessories: asset.accessories || null,
      category_id: asset.categoryId,
      type: asset.type || null,
      qr_code: asset.qrCode || null,
    })
    .select('*, asset_categories(name)')
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

  if (updates.assetNo !== undefined) updateData.asset_no = updates.assetNo || null;
  if (updates.assetName !== undefined) updateData.asset_name = updates.assetName || null;
  if (updates.year !== undefined) updateData.year = updates.year ?? null;
  if (updates.department !== undefined) updateData.department = updates.department || null;
  if (updates.unit !== undefined) updateData.unit = updates.unit || null;
  if (updates.userName !== undefined) updateData.user_name = updates.userName || null;
  if (updates.purchaseDate !== undefined) updateData.purchase_date = updates.purchaseDate || null;
  if (updates.price !== undefined) updateData.price = updates.price ?? null;
  if (updates.supplier !== undefined) updateData.supplier = updates.supplier || null;
  if (updates.source !== undefined) updateData.source = updates.source || null;
  if (updates.model !== undefined) updateData.model = updates.model || null;
  if (updates.serialNo !== undefined) updateData.serial_no = updates.serialNo || null;
  if (updates.processor !== undefined) updateData.processor = updates.processor || null;
  if (updates.ramCapacity !== undefined) updateData.ram_capacity = updates.ramCapacity || null;
  if (updates.hddCapacity !== undefined) updateData.hdd_capacity = updates.hddCapacity || null;
  if (updates.monitorModel !== undefined) updateData.monitor_model = updates.monitorModel || null;
  if (updates.monitorSerialNo !== undefined) updateData.monitor_serial_no = updates.monitorSerialNo || null;
  if (updates.monitorAssetNo !== undefined) updateData.monitor_asset_no = updates.monitorAssetNo || null;
  if (updates.keyboardModel !== undefined) updateData.keyboard_model = updates.keyboardModel || null;
  if (updates.keyboardSerialNo !== undefined) updateData.keyboard_serial_no = updates.keyboardSerialNo || null;
  if (updates.keyboardAssetNo !== undefined) updateData.keyboard_asset_no = updates.keyboardAssetNo || null;
  if (updates.mouseModel !== undefined) updateData.mouse_model = updates.mouseModel || null;
  if (updates.mouseSerialNo !== undefined) updateData.mouse_serial_no = updates.mouseSerialNo || null;
  if (updates.mouseAssetNo !== undefined) updateData.mouse_asset_no = updates.mouseAssetNo || null;
  if (updates.accessories !== undefined) updateData.accessories = updates.accessories || null;
  if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
  if (updates.type !== undefined) updateData.type = updates.type || null;
  if (updates.qrCode !== undefined) updateData.qr_code = updates.qrCode || null;

  const { data, error } = await supabase
    .from<DbAssetRow>('assets')
    .update(updateData)
    .eq('id', id)
    .select('*, asset_categories(name)')
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
    assetNo: row.asset_no ?? '',
    assetName: row.asset_name ?? '',
    year: row.year ?? null,
    department: row.department ?? '',
    unit: row.unit ?? '',
    userName: row.user_name ?? '',
    purchaseDate: row.purchase_date ?? '',
    price: row.price ?? null,
    supplier: row.supplier ?? '',
    source: row.source ?? '',
    model: row.model ?? '',
    serialNo: row.serial_no ?? '',
    processor: row.processor ?? '',
    ramCapacity: row.ram_capacity ?? '',
    hddCapacity: row.hdd_capacity ?? '',
    monitorModel: row.monitor_model ?? '',
    monitorSerialNo: row.monitor_serial_no ?? '',
    monitorAssetNo: row.monitor_asset_no ?? '',
    keyboardModel: row.keyboard_model ?? '',
    keyboardSerialNo: row.keyboard_serial_no ?? '',
    keyboardAssetNo: row.keyboard_asset_no ?? '',
    mouseModel: row.mouse_model ?? '',
    mouseSerialNo: row.mouse_serial_no ?? '',
    mouseAssetNo: row.mouse_asset_no ?? '',
    accessories: row.accessories ?? '',
    createdAt: row.created_at ?? null,
    categoryId: row.category_id,
    categoryName: row.asset_categories?.name ?? '',
    type: row.type ?? '',
    qrCode: row.qr_code ?? null,
  };
}
