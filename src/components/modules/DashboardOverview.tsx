import React, { useState, useEffect } from 'react';
import { Asset, MaintenanceRequest, Feedback } from '../../App';
import { Package, Wrench, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react';
import { getAssets } from '../../lib/database/assets';
import {
  getMaintenanceRequests
} from '../../lib/database/maintenance';
import { getFeedback } from '../../lib/database/feedback';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface DashboardOverviewProps {
  role: 'admin' | 'admin_assistant';
}

export function DashboardOverview({ role }: DashboardOverviewProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [assetsData, maintenanceData, feedbackData] = await Promise.all([
        getAssets(),
        getMaintenanceRequests(),
        getFeedback()
      ]);

      setAssets(assetsData ?? []);
      setMaintenanceRequests(maintenanceData ?? []);
      setFeedback(feedbackData ?? []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Gagal memuatkan data. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const pendingMaintenance = maintenanceRequests.filter((m) => m.status === 'Pending').length;
  const inProgressMaintenance = maintenanceRequests.filter((m) => m.status === 'In Progress').length;
  const resolvedMaintenance = maintenanceRequests.filter((m) => m.status === 'Resolved').length;
  const openFeedback = feedback.filter((f) => f.status === 'open').length;
  const activeAssets = assets.filter((asset) => asset.userName.trim().length > 0).length;
  const maintenanceAssetIds = new Set(
    maintenanceRequests
      .filter((request) => request.status !== 'Resolved')
      .map((request) => request.assetId)
  );
  const underMaintenanceAssets = maintenanceAssetIds.size;
  const inactiveAssets = Math.max(assets.length - activeAssets, 0);

  const stats = [
    {
      label: 'Total Assets',
      value: assets.length,
      icon: Package,
      lightColor: 'bg-sky-100',
      textColor: 'text-sky-700',
      description: 'All registered items'
    },
    {
      label: 'Active Assets',
      value: activeAssets,
      icon: TrendingUp,
      lightColor: 'bg-emerald-100',
      textColor: 'text-emerald-700',
      description: 'Assigned to staff'
    },
    {
      label: 'Pending Maintenance',
      value: pendingMaintenance,
      icon: AlertCircle,
      lightColor: 'bg-amber-100',
      textColor: 'text-amber-700',
      description: 'Awaiting action'
    },
    {
      label: 'New Feedback',
      value: openFeedback,
      icon: MessageSquare,
      lightColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      description: 'Latest staff input'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-slate-800 mb-2">Welcome to ICAMS</h2>
        <p className="text-slate-600">Here's an overview of your asset management system</p>
      </div>

      {/* Error / Loading */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading dashboard...</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="bg-white border-slate-200/80 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className={`${stat.lightColor} p-3 rounded-2xl`}>
                      <Icon className={`w-6 h-6 ${stat.textColor}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl text-slate-900 mb-1">{stat.value}</div>
                    <div className="text-sm text-slate-700">{stat.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{stat.description}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Maintenance Requests */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <Wrench className="w-5 h-5 text-slate-600" />
                <CardTitle className="text-base">Recent Maintenance Requests</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-xs text-sky-600 hover:text-sky-700"
                  onClick={loadData}
                >
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
              <div className="space-y-3">
                {maintenanceRequests.slice(0, 5).length === 0 ? (
                  <p className="text-slate-500 text-sm">No maintenance requests yet</p>
                ) : (
                  maintenanceRequests.slice(0, 5).map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 truncate">{request.assetLabel}</p>
                        <p className="text-xs text-slate-500 mt-1">By {request.requestedByName}</p>
                      </div>
                      <span
                        className="text-xs"
                      >
                        <Badge
                          variant="secondary"
                          className={
                            request.status === 'In Progress'
                              ? 'bg-blue-100 text-blue-700'
                              : request.status === 'Pending'
                                ? 'bg-amber-100 text-amber-700'
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
              </CardContent>
            </Card>

            {/* Asset Status Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <Package className="w-5 h-5 text-slate-600" />
                <div>
                  <CardTitle className="text-base">Asset Status Overview</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">Current asset activity snapshot</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Active</span>
                    <span className="text-sm text-slate-800">{activeAssets} assets</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{
                        width: `${
                          assets.length > 0 ? (activeAssets / assets.length) * 100 : 0
                        }%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Under Maintenance</span>
                    <span className="text-sm text-slate-800">{underMaintenanceAssets} assets</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{
                        width: `${
                          assets.length > 0 ? (underMaintenanceAssets / assets.length) * 100 : 0
                        }%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Inactive</span>
                    <span className="text-sm text-slate-800">{inactiveAssets} assets</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-slate-400 h-2 rounded-full"
                      style={{
                        width: `${
                          assets.length > 0 ? (inactiveAssets / assets.length) * 100 : 0
                        }%`
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
