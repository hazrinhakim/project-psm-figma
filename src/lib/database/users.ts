import { supabase } from '../supabase';
import { User } from '../../App';

// Get all users
export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }

  return data || [];
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching user:', error);
    throw error;
  }

  return data;
}

// Get user by login ID
export async function getUserByLoginId(loginId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('login_id', loginId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching user by login ID:', error);
    throw error;
  }

  return data;
}

// Create a new user
export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      login_id: user.loginId,
      name: user.name,
      role: user.role,
      email: user.email,
      password: user.password, // In production, this should be hashed
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }

  return {
    id: data.id,
    loginId: data.login_id,
    name: data.name,
    role: data.role,
    email: data.email,
    password: data.password,
  };
}

// Update a user
export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  const updateData: any = {};
  
  if (updates.loginId !== undefined) updateData.login_id = updates.loginId;
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.role !== undefined) updateData.role = updates.role;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.password !== undefined) updateData.password = updates.password;

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    throw error;
  }

  return {
    id: data.id,
    loginId: data.login_id,
    name: data.name,
    role: data.role,
    email: data.email,
    password: data.password,
  };
}

// Delete a user
export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

