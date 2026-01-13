import React, { useState, useEffect } from 'react';
import { MaintenanceRequest, Asset } from '../../App';
import { Package, Wrench, Clock, CheckCircle } from 'lucide-react';
import { getAssets } from '../../lib/database/assets';
import { getMaintenanceRequestsByStaffId } from '../../lib/database/maintenance';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface StaffDashboardOverviewProps {
  userId: string;
}

export function StaffDashboardOverview({ userId }: StaffDashboardOverviewProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [myRequests, setMyRequests] = useState<MaintenanceRequest[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadData = async () => {
    setError(null);
    setLoadingAssets(true);
    setLoadingRequests(true);

    try {
      const [assetsData, requestsData] = await Promise.all([
        getAssets(),
        getMaintenanceRequestsByStaffId(userId)
      ]);

      setAssets(assetsData ?? []);
      setMyRequests(requestsData ?? []);
    } catch (err) {
      console.error('Failed to load staff dashboard data:', err);
      setError('Gagal memuatkan data. Sila cuba lagi.');
    } finally {
      setLoadingAssets(false);
      setLoadingRequests(false);
    }
  };

  const pendingRequests = myRequests.filter((r) => r.status === 'Pending').length;
  const inProgressRequests = myRequests.filter((r) => r.status === 'In Progress').length;
  const completedRequests = myRequests.filter((r) => r.status === 'Resolved').length;

  const stats = [
    {
      label: 'Total Assets',
      value: assets.length,
      icon: Package,
      color: 'bg-slate-700',
      lightColor: 'bg-slate-100',
      textColor: 'text-slate-700'
    },
    {
      label: 'Pending Requests',
      value: pendingRequests,
      icon: Clock,
      color: 'bg-slate-700',
      lightColor: 'bg-slate-100',
      textColor: 'text-slate-700'
    },
    {
      label: 'In Progress',
      value: inProgressRequests,
      icon: Wrench,
      color: 'bg-slate-700',
      lightColor: 'bg-slate-100',
      textColor: 'text-slate-700'
    },
    {
      label: 'Resolved',
      value: completedRequests,
      icon: CheckCircle,
      color: 'bg-slate-700',
      lightColor: 'bg-slate-100',
      textColor: 'text-slate-700'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-slate-800 mb-2">Welcome to ICAMS</h2>
        <p className="text-slate-600">Manage your maintenance requests and browse campus assets</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className={`${stat.lightColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-slate-800 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Wrench className="w-5 h-5 text-slate-600" />
          <CardTitle className="text-base">My Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="p-4 text-sm text-slate-500">Loading your requests...</div>
          ) : (
            <div className="space-y-3">
              {myRequests.slice(0, 5).length === 0 ? (
                <p className="text-slate-500 text-sm py-4">No maintenance requests yet</p>
              ) : (
                myRequests.slice(0, 5).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 truncate">{request.assetLabel}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs">
                      <Badge
                        variant="secondary"
                        className={
                          request.status === 'In Progress'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }
                      >
                        {request.status}
                      </Badge>
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Tips */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="text-slate-800 mb-3">Tips for Using ICAMS</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          <li>Use the QR Scanner to confirm asset information</li>
          <li>Submit maintenance requests as soon as you notice issues</li>
          <li>Check your notifications for updates on your requests</li>
          <li>Share feedback to help improve the system</li>
        </ul>
      </div>
    </div>
  );
}
