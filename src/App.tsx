'use client';

import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminAssistantDashboard } from './components/AdminAssistantDashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { supabase } from './lib/supabase';
import { getProfileById } from './lib/database/profiles';

export interface User {
  id: string;
  fullName: string;
  role: 'admin' | 'admin_assistant' | 'staff';
  email: string;
}

export interface Asset {
  id: string;
  assetNo: string;
  assetName: string;
  year: number | null;
  department: string;
  unit: string;
  userName: string;
  purchaseDate: string;
  price: number | null;
  supplier: string;
  source: string;
  model: string;
  serialNo: string;
  processor: string;
  ramCapacity: string;
  hddCapacity: string;
  monitorModel: string;
  monitorSerialNo: string;
  monitorAssetNo: string;
  keyboardModel: string;
  keyboardSerialNo: string;
  keyboardAssetNo: string;
  mouseModel: string;
  mouseSerialNo: string;
  mouseAssetNo: string;
  accessories: string;
  createdAt: string | null;
  categoryId: string;
  categoryName: string;
  type: string;
  qrCode?: string | null;
}

export interface MaintenanceRequest {
  id: string;
  assetId: string;
  assetLabel: string;
  requestedBy: string;
  requestedByName: string;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  adminRemark: string;
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  id: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  role: 'staff' | 'admin_assistant';
  message: string;
  status: 'open' | 'reviewed' | 'closed';
  email: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'maintenance' | 'warranty' | 'general';
  date: string;
  read: boolean;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const setUserFromSession = async (sessionUser: { id: string; email?: string | null }) => {
      try {
        const profile = await getProfileById(sessionUser.id);
        if (!isActive) return;
        setCurrentUser({
          id: sessionUser.id,
          fullName: profile?.fullName ?? '',
          role: profile?.role ?? 'staff',
          email: sessionUser.email ?? ''
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
        if (!isActive) return;
        setCurrentUser({
          id: sessionUser.id,
          fullName: '',
          role: 'staff',
          email: sessionUser.email ?? ''
        });
      }
    };

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!isActive) return;

      if (session?.user) {
        await setUserFromSession(session.user);
      } else {
        setCurrentUser(null);
      }

      setIsLoading(false);
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isActive) return;

      if (session?.user) {
        await setUserFromSession(session.user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      isActive = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      {currentUser.role === 'admin' && (
        <AdminDashboard user={currentUser} onLogout={handleLogout} />
      )}
      {currentUser.role === 'admin_assistant' && (
        <AdminAssistantDashboard user={currentUser} onLogout={handleLogout} />
      )}
      {currentUser.role === 'staff' && (
        <StaffDashboard user={currentUser} onLogout={handleLogout} />
      )}
    </>
  );
}
