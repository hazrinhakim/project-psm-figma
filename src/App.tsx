'use client';

import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminAssistantDashboard } from './components/AdminAssistantDashboard';
import { StaffDashboard } from './components/StaffDashboard';

export interface User {
  id: string;
  loginId: string;
  name: string;
  role: 'admin' | 'admin_assistant' | 'staff';
  email: string;
  password: string;
}

export interface Asset {
  id: string;
  assetId: string;
  name: string;
  category: string;
  location: string;
  purchaseDate: string;
  warrantyExpiry?: string;
  status: 'active' | 'maintenance' | 'inactive';
  qrCode?: string;
}

export interface MaintenanceRequest {
  id: string;
  assetId: string;
  assetName: string;
  staffId: string;
  staffName: string;
  issueDescription: string;
  status: 'pending' | 'in_progress' | 'completed';
  submittedDate: string;
  completedDate?: string;
}

export interface Feedback {
  id: string;
  staffId: string;
  staffName: string;
  message: string;
  submittedDate: string;
  status: 'new' | 'reviewed';
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
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setIsLoading(false);

    // Initialize demo data if not exists
    if (!localStorage.getItem('users')) {
      initializeDemoData();
    }
  }, []);

  const initializeDemoData = () => {
    const demoUsers: User[] = [
      {
        id: '1',
        loginId: 'admin',
        name: 'Admin User',
        role: 'admin',
        email: 'admin@icams.edu',
        password: 'admin123'
      },
      {
        id: '2',
        loginId: 'assistant',
        name: 'Admin Assistant',
        role: 'admin_assistant',
        email: 'assistant@icams.edu',
        password: 'assist123'
      },
      {
        id: '3',
        loginId: 'staff',
        name: 'Staff Member',
        role: 'staff',
        email: 'staff@icams.edu',
        password: 'staff123'
      }
    ];

    const demoAssets: Asset[] = [
      {
        id: '1',
        assetId: 'LAB-001',
        name: 'Dell Optiplex 7090',
        category: 'Computer',
        location: 'Computer Lab 1',
        purchaseDate: '2023-01-15',
        warrantyExpiry: '2026-01-15',
        status: 'active'
      },
      {
        id: '2',
        assetId: 'PROJ-045',
        name: 'Epson EB-2250U Projector',
        category: 'Projector',
        location: 'Conference Room A',
        purchaseDate: '2023-03-20',
        warrantyExpiry: '2025-03-20',
        status: 'active'
      },
      {
        id: '3',
        assetId: 'FURN-102',
        name: 'Office Desk Herman Miller',
        category: 'Furniture',
        location: 'Office Block B',
        purchaseDate: '2022-11-10',
        status: 'active'
      }
    ];

    localStorage.setItem('users', JSON.stringify(demoUsers));
    localStorage.setItem('assets', JSON.stringify(demoAssets));
    localStorage.setItem('maintenanceRequests', JSON.stringify([]));
    localStorage.setItem('feedback', JSON.stringify([]));
    localStorage.setItem('notifications', JSON.stringify([]));
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
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
