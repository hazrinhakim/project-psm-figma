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
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import icamsLogo from '../styles/ICAMS-1.png';

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
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-50 transition-transform duration-300`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <img
                src={icamsLogo.src ? icamsLogo.src : icamsLogo as unknown as string}
                alt="ICAMS logo"
                className="w-26"
              />
                <Badge 
                variant="outline" 
                className="rounded-lg bg-blue-100 text-blue-700 border-blue-600 text-[10px] py-0 px-1.5 h-5 font-medium">Admin</Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-slate-600 hover:text-slate-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 px-3 py-2 text-sm ${
                        activeModule === item.id
                          ? 'bg-slate-100 text-slate-900 border border-slate-200'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                      onClick={() => {
                        setActiveModule(item.id);
                        setSidebarOpen(false);
                      }}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Notifications */}
          <div className="px-3 py-3">
            <Button
              variant="ghost"
              className="w-full justify-between px-2 text-sm"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-600" />
                <span className="text-sm text-slate-700">Notifications</span>
              </span>
              {unreadCount > 0 && (
                <span className="min-w-6 h-6 px-2 bg-blue-700 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>

            {showNotifications && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm text-slate-800">Notifications</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="link" size="sm" onClick={markAllAsRead}>
                      Mark all
                    </Button>
                    <Button variant="link" size="sm" onClick={loadNotifications}>
                      Refresh
                    </Button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="p-4 text-center text-slate-500 text-sm">Loading...</div>
                  ) : notifError ? (
                    <div className="p-4 text-center text-red-600 text-sm">{notifError}</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">
                      No notifications
                    </div>
                  ) : (
                    <ul>
                      {notifications.map((notification) => (
                        <li
                          key={notification.id}
                          className={`p-3 border-b border-slate-100 hover:bg-white cursor-pointer ${
                            !notification.read ? 'bg-white border-l-2 border-blue-600' : ''
                          }`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <p className="text-xs text-slate-700">
                            {notification.message}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
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

          {/* User Info */}
          <div className="p-3">
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-sm">
                <span className="text-slate-700">{user.fullName.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-800 truncate">{user.fullName}</div>
                <div className="text-xs text-slate-500 capitalize">{user.role.replace('_', ' ')}</div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Module Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="min-h-full rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="mb-4 lg:hidden">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-4 h-4" />
                Menu
              </Button>
            </div>
            {activeModule === 'dashboard' && <DashboardOverview role="admin" />}
            {activeModule === 'users' && <UserManagement />}
            {activeModule === 'assets' && <AssetManagement currentUser={user} />}
            {activeModule === 'qr' && <QRManagement />}
            {activeModule === 'maintenance' && <MaintenanceManagement />}
            {activeModule === 'feedback' && <FeedbackManagement />}
            {activeModule === 'reports' && <Reports />}
          </div>
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
