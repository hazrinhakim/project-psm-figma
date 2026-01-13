import { supabase } from '../supabase';

export type Profile = {
  id: string;
  fullName: string;
  role: 'admin' | 'admin_assistant' | 'staff';
  createdAt: string | null;
};

type DbProfileRow = {
  id: string;
  full_name: string | null;
  role: 'admin' | 'admin_assistant' | 'staff';
  created_at: string | null;
};

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from<DbProfileRow>('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    fullName: data.full_name ?? '',
    role: data.role,
    createdAt: data.created_at ?? null
  };
}

export async function getProfilesByRoles(
  roles: Array<'admin' | 'admin_assistant' | 'staff'>
): Promise<Profile[]> {
  const { data, error } = await supabase
    .from<DbProfileRow>('profiles')
    .select('*')
    .in('role', roles)
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching profiles by roles:', error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    fullName: row.full_name ?? '',
    role: row.role,
    createdAt: row.created_at ?? null
  }));
}

