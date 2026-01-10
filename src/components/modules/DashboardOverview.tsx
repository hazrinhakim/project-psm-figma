import React, { useState, useEffect } from 'react';
import { Asset, MaintenanceRequest, Feedback } from '../../App';
import { Package, Wrench, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react';
import { getAssets } from '../../lib/database/assets';
import {
  getMaintenanceRequests
} from '../../lib/database/maintenance';
import { getFeedback } from '../../lib/database/feedback';

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

  const pendingMaintenance = maintenanceRequests.filter((m) => m.status === 'pending').length;
  const inProgressMaintenance = maintenanceRequests.filter((m) => m.status === 'in_progress').length;
  const activeAssets = assets.filter((a) => a.status === 'active').length;
  const inProgressAssetIds = new Set(
    maintenanceRequests.filter((m) => m.status === 'in_progress').map((m) => m.assetId)
  );
  const maintenanceAssets = assets.filter(
    (asset) =>
      asset.status === 'maintenance' ||
      inProgressAssetIds.has(asset.id) ||
      inProgressAssetIds.has(asset.assetId)
  ).length;
  const unreadFeedback = feedback.filter((f) => f.status === 'new').length;

  const stats = [
    {
      label: 'Total Assets',
      value: assets.length,
      icon: Package,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      label: 'Active Assets',
      value: activeAssets,
      icon: TrendingUp,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      label: 'Pending Maintenance',
      value: pendingMaintenance,
      icon: AlertCircle,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      label: 'New Feedback',
      value: unreadFeedback,
      icon: MessageSquare,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600'
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
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${stat.lightColor} p-3 rounded-lg`}>
                      <Icon className={`w-6 h-6 ${stat.textColor}`} />
                    </div>
                  </div>
                  <div className="text-3xl text-slate-800 mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Maintenance Requests */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <Wrench className="w-5 h-5 text-slate-600" />
                <h3 className="text-slate-800">Recent Maintenance Requests</h3>
                <button
                  onClick={loadData}
                  className="ml-auto text-xs text-slate-500 hover:underline"
                >
                  Refresh
                </button>
              </div>
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
                        <p className="text-sm text-slate-800 truncate">{request.assetName}</p>
                        <p className="text-xs text-slate-500 mt-1">By {request.staffName}</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          request.status === 'pending'
                            ? 'bg-orange-100 text-orange-700'
                            : request.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Asset Status Overview */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-5 h-5 text-slate-600" />
                <h3 className="text-slate-800">Asset Status Overview</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Active</span>
                    <span className="text-sm text-slate-800">{activeAssets} assets</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${assets.length > 0 ? (activeAssets / assets.length) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Under Maintenance</span>
                    <span className="text-sm text-slate-800">{maintenanceAssets} assets</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{
                        width: `${assets.length > 0 ? (maintenanceAssets / assets.length) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Inactive</span>
                    <span className="text-sm text-slate-800">
                      {assets.filter((a) => a.status === 'inactive').length} assets
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-slate-400 h-2 rounded-full"
                      style={{
                        width: `${
                          assets.length > 0
                            ? (assets.filter((a) => a.status === 'inactive').length / assets.length) *
                              100
                            : 0
                        }%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>


        </>
      )}
    </div>
  );
}
