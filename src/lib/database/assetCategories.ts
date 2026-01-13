import { supabase } from '../supabase';

export type AssetCategory = {
  id: string;
  name: string;
  createdAt: string | null;
};

type DbAssetCategoryRow = {
  id: string;
  name: string;
  created_at: string | null;
};

export async function getAssetCategories(): Promise<AssetCategory[]> {
  const { data, error } = await supabase
    .from<DbAssetCategoryRow>('asset_categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching asset categories:', error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.created_at ?? null
  }));
}
