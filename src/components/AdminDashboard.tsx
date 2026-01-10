import React, { useState, useEffect } from 'react';
import { User, Asset, MaintenanceRequest, Feedback, Notification } from '../App';
import {
  LayoutDashboard,
  Users,
  Package,
  QrCode,
  Wrench,
  MessageSquare,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { UserManagement } from './modules/UserManagement';
import { AssetManagement } from './modules/AssetManagement';
import { QRManagement } from './modules/QRManagement';
import { MaintenanceManagement } from './modules/MaintenanceManagement';
import { FeedbackManagement } from './modules/FeedbackManagement';
import { Reports } from './modules/Reports';
import { DashboardOverview } from './modules/DashboardOverview';
import {
  getNotificationsByUserId,
  markNotificationAsRead as dbMarkNotificationAsRead,
  markAllNotificationsAsRead as dbMarkAllNotificationsAsRead
} from '../lib/database/notifications';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

type Module =
  | 'dashboard'
  | 'users'
  | 'assets'
  | 'qr'
  | 'maintenance'
  | 'feedback'
  | 'reports';

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNotifications = async () => {
    setLoadingNotifications(true);
    setNotifError(null);
    try {
      const data = await getNotificationsByUserId(user.id);
      // Ensure consistent ordering (newest first)
      const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setNotifications(sorted);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setNotifError('Failed to load notifications.');
    } finally {
      setLoadingNotifications(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markNotificationAsRead = async (notificationId: string) => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
    try {
      await dbMarkNotificationAsRead(notificationId);
      // Optionally reload to ensure consistency
      // await loadNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert optimistic update on error
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: false } : n)));
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await dbMarkAllNotificationsAsRead(user.id);
      // await loadNotifications();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      // Reload from server to restore correct state
      await loadNotifications();
    }
  };

  const menuItems = [
    { id: 'dashboard' as Module, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users' as Module, label: 'User Management', icon: Users },
    { id: 'assets' as Module, label: 'Asset Management', icon: Package },
    { id: 'qr' as Module, label: 'QR Code Management', icon: QrCode },
    { id: 'maintenance' as Module, label: 'Maintenance', icon: Wrench },
    { id: 'feedback' as Module, label: 'Feedback', icon: MessageSquare },
    { id: 'reports' as Module, label: 'Reports & Analytics', icon: BarChart3 }
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-transform duration-300`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-slate-800">ICAMS</div>
                <div className="text-xs text-slate-500">Admin Portal</div>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-600 hover:text-slate-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveModule(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeModule === item.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600">{user.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-800 truncate">{user.name}</div>
                <div className="text-xs text-slate-500 capitalize">{user.role.replace('_', ' ')}</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-600 hover:text-slate-800"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-slate-800">
                  {menuItems.find((m) => m.id === activeModule)?.label}
                </h1>
                <p className="text-sm text-slate-500">
                  Welcome back, {user.name}
                </p>
              </div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-slate-800">Notifications</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Mark all read
                      </button>
                      <button
                        onClick={loadNotifications}
                        className="text-xs text-slate-500 hover:underline"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="p-6 text-center text-slate-500">Loading...</div>
                    ) : notifError ? (
                      <div className="p-6 text-center text-red-600">{notifError}</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                        No notifications
                      </div>
                    ) : (
                      <ul>
                        {notifications.map((notification) => (
                          <li
                            key={notification.id}
                            className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            <p className="text-sm text-slate-700">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(notification.date).toLocaleDateString()}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Module Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeModule === 'dashboard' && <DashboardOverview role="admin" />}
          {activeModule === 'users' && <UserManagement />}
          {activeModule === 'assets' && <AssetManagement />}
          {activeModule === 'qr' && <QRManagement />}
          {activeModule === 'maintenance' && <MaintenanceManagement />}
          {activeModule === 'feedback' && <FeedbackManagement />}
          {activeModule === 'reports' && <Reports />}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
