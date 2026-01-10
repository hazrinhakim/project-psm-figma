import { supabase } from '../supabase';
import { Notification } from '../../App';

// Get all notifications
export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return data || [];
}

// Get notifications by user ID
export async function getNotificationsByUserId(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching notifications by user ID:', error);
    throw error;
  }

  return data || [];
}

// Get unread notifications by user ID
export async function getUnreadNotificationsByUserId(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('read', false)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching unread notifications:', error);
    throw error;
  }

  return data || [];
}

// Create a new notification
export async function createNotification(
  notification: Omit<Notification, 'id'>
): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: notification.userId,
      message: notification.message,
      type: notification.type,
      date: notification.date,
      read: notification.read,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    message: data.message,
    type: data.type,
    date: data.date,
    read: data.read,
  };
}

// Mark notification as read
export async function markNotificationAsRead(id: string): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    message: data.message,
    type: data.type,
    date: data.date,
    read: data.read,
  };
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

// Delete a notification
export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

