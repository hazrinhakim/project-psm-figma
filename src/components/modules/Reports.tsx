import React, { useState, useEffect } from 'react';
import { Asset, MaintenanceRequest } from '../../App';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { BarChart3, Download } from 'lucide-react';
import { getAssets } from '../../lib/database/assets';
import { getMaintenanceRequests } from '../../lib/database/maintenance';

export function Reports() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [selectedReport, setSelectedReport] = useState<'distribution' | 'maintenance' | 'status'>(
    'distribution'
  );
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
      const [assetsData, maintenanceData] = await Promise.all([getAssets(), getMaintenanceRequests()]);
      setAssets(assetsData ?? []);
      setMaintenanceRequests(maintenanceData ?? []);
    } catch (err) {
      console.error('Failed to load reports data:', err);
      setError('Gagal memuatkan data laporan. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Asset Distribution by Category
  const categoryData = assets.reduce((acc: { name: string; count: number }[], asset) => {
    const category = asset.category || 'Uncategorized';
    const existing = acc.find((item) => item.name === category);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ name: category, count: 1 });
    }
    return acc;
  }, []);

  // Asset Status Distribution
  const statusData = [
    { name: 'Active', value: assets.filter((a) => a.status === 'active').length },
    { name: 'Maintenance', value: assets.filter((a) => a.status === 'maintenance').length },
    { name: 'Inactive', value: assets.filter((a) => a.status === 'inactive').length }
  ];

  // Maintenance History by Month
  const maintenanceByMonth = maintenanceRequests.reduce(
    (acc: { month: string; pending: number; inProgress: number; completed: number }[], request) => {
      // Handle date parsing - could be string or Date object
      const date = request.submittedDate instanceof Date 
        ? request.submittedDate 
        : new Date(request.submittedDate);
      
      // Skip invalid dates
      if (isNaN(date.getTime())) {
        return acc;
      }
      
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      const existing = acc.find((item) => item.month === month);
      if (existing) {
        existing.pending += request.status === 'pending' ? 1 : 0;
        existing.inProgress += request.status === 'in_progress' ? 1 : 0;
        existing.completed += request.status === 'completed' ? 1 : 0;
      } else {
        acc.push({
          month,
          pending: request.status === 'pending' ? 1 : 0,
          inProgress: request.status === 'in_progress' ? 1 : 0,
          completed: request.status === 'completed' ? 1 : 0
        });
      }
      return acc;
    },
    []
  );

  const COLORS = ['#10b981', '#f59e0b', '#64748b'];

  const exportReport = () => {
    const reportData = {
      generatedDate: new Date().toISOString(),
      totalAssets: assets.length,
      assetsByCategory: categoryData,
      assetsByStatus: statusData,
      maintenanceRequests: {
        total: maintenanceRequests.length,
        pending: maintenanceRequests.filter((r) => r.status === 'pending').length,
        inProgress: maintenanceRequests.filter((r) => r.status === 'in_progress').length,
        completed: maintenanceRequests.filter((r) => r.status === 'completed').length
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ICAMS_Report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-slate-800">Reports & Analytics</h2>
          <p className="text-slate-600 text-sm mt-1">Visualize asset data and maintenance patterns</p>
        </div>

        <button
          onClick={exportReport}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          Export Report
        </button>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedReport('distribution')}
          className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            selectedReport === 'distribution' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Asset Distribution
        </button>

        <button
          onClick={() => setSelectedReport('status')}
          className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            selectedReport === 'status' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Asset Status
        </button>

        <button
          onClick={() => setSelectedReport('maintenance')}
          className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            selectedReport === 'maintenance' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Maintenance History
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-2xl text-slate-800">{assets.length}</div>
          <div className="text-sm text-slate-600">Total Assets</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-2xl text-blue-600">{categoryData.length}</div>
          <div className="text-sm text-slate-600">Categories</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-2xl text-orange-600">{maintenanceRequests.length}</div>
          <div className="text-sm text-slate-600">Maintenance Requests</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-2xl text-green-600">{assets.filter((a) => a.status === 'active').length}</div>
          <div className="text-sm text-slate-600">Active Assets</div>
        </div>
      </div>

      {/* Error / Loading */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading reports...</div>
      ) : (
        <>
          {/* Charts */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            {selectedReport === 'distribution' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  <h3 className="text-slate-800">Asset Distribution by Category</h3>
                </div>

                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6" name="Number of Assets" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-slate-500">No data available</div>
                )}
              </div>
            )}

            {selectedReport === 'status' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  <h3 className="text-slate-800">Asset Status Distribution</h3>
                </div>

                {statusData.some((d) => d.value > 0) ? (
                  <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                    <ResponsiveContainer width="100%" height={400} className="max-w-md">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="space-y-3">
                      {statusData.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-slate-700">
                            {item.name}: {item.value} assets
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">No data available</div>
                )}
              </div>
            )}

            {selectedReport === 'maintenance' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  <h3 className="text-slate-800">Maintenance Request History</h3>
                </div>

                {maintenanceByMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={maintenanceByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="inProgress" fill="#3b82f6" name="In Progress" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-slate-500">No data available</div>
                )}
              </div>
            )}
          </div>

          {/* Table View */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-slate-800 mb-4">Recent Assets</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase">Asset ID</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {assets.slice(0, 10).map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-800">{asset.assetId}</td>
                      <td className="px-4 py-3 text-sm text-slate-800">{asset.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{asset.category}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{asset.location}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            asset.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : asset.status === 'maintenance'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {asset.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
