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
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

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
    const category = asset.categoryName || 'Uncategorized';
    const existing = acc.find((item) => item.name === category);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ name: category, count: 1 });
    }
    return acc;
  }, []);

  // Maintenance Status Distribution
  const statusData = [
    { name: 'Pending', value: maintenanceRequests.filter((r) => r.status === 'Pending').length },
    { name: 'In Progress', value: maintenanceRequests.filter((r) => r.status === 'In Progress').length },
    { name: 'Resolved', value: maintenanceRequests.filter((r) => r.status === 'Resolved').length }
  ];

  // Maintenance History by Month
  const maintenanceByMonth = maintenanceRequests.reduce(
    (acc: { month: string; pending: number; inProgress: number; completed: number }[], request) => {
      // Handle date parsing - could be string or Date object
      const date = request.createdAt instanceof Date
        ? request.createdAt
        : new Date(request.createdAt);
      
      // Skip invalid dates
      if (isNaN(date.getTime())) {
        return acc;
      }
      
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      const existing = acc.find((item) => item.month === month);
      if (existing) {
        existing.pending += request.status === 'Pending' ? 1 : 0;
        existing.inProgress += request.status === 'In Progress' ? 1 : 0;
        existing.completed += request.status === 'Resolved' ? 1 : 0;
      } else {
        acc.push({
          month,
          pending: request.status === 'Pending' ? 1 : 0,
          inProgress: request.status === 'In Progress' ? 1 : 0,
          completed: request.status === 'Resolved' ? 1 : 0
        });
      }
      return acc;
    },
    []
  );

  const COLORS = ['#1e3a8a', '#475569', '#94a3b8'];

  const exportReport = () => {
    const reportData = {
      generatedDate: new Date().toISOString(),
      totalAssets: assets.length,
      assetsByCategory: categoryData,
      assetsByStatus: statusData,
      maintenanceRequests: {
        total: maintenanceRequests.length,
        pending: maintenanceRequests.filter((r) => r.status === 'Pending').length,
        inProgress: maintenanceRequests.filter((r) => r.status === 'In Progress').length,
        completed: maintenanceRequests.filter((r) => r.status === 'Resolved').length
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

        <Button onClick={exportReport} className="gap-2">
          <Download className="w-5 h-5" />
          Export Report
        </Button>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedReport === 'distribution' ? 'default' : 'outline'}
          onClick={() => setSelectedReport('distribution')}
        >
          Asset Distribution
        </Button>

        <Button
          variant={selectedReport === 'status' ? 'default' : 'outline'}
          onClick={() => setSelectedReport('status')}
        >
          Maintenance Status
        </Button>

        <Button
          variant={selectedReport === 'maintenance' ? 'default' : 'outline'}
          onClick={() => setSelectedReport('maintenance')}
        >
          Maintenance History
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-slate-800 font-semibold tabular-nums">{assets.length}</div>
            <div className="text-sm text-slate-600">Total Assets</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-slate-800 font-semibold tabular-nums">{categoryData.length}</div>
            <div className="text-sm text-slate-600">Categories</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-slate-800 font-semibold tabular-nums">{maintenanceRequests.length}</div>
            <div className="text-sm text-slate-600">Maintenance Requests</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-slate-800 font-semibold tabular-nums">
              {maintenanceRequests.filter((r) => r.status === 'Resolved').length}
            </div>
            <div className="text-sm text-slate-600">Resolved Requests</div>
          </CardContent>
        </Card>
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
          <Card>
            <CardContent>
            {selectedReport === 'distribution' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-slate-700" />
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
                      <Bar dataKey="count" fill="#1e3a8a" name="Number of Assets" radius={[8, 8, 0, 0]} />
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
                  <BarChart3 className="w-6 h-6 text-slate-700" />
                <h3 className="text-slate-800">Maintenance Status Distribution</h3>
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
                  <BarChart3 className="w-6 h-6 text-slate-700" />
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
                      <Bar dataKey="pending" fill="#94a3b8" name="Pending" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="inProgress" fill="#1e3a8a" name="In Progress" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="completed" fill="#475569" name="Resolved" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-slate-500">No data available</div>
                )}
              </div>
            )}
            </CardContent>
          </Card>

          {/* Table View */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-muted">
                    <TableRow>
                      <TableHead className="text-xs uppercase text-muted-foreground">Asset No</TableHead>
                      <TableHead className="text-xs uppercase text-muted-foreground">Name</TableHead>
                      <TableHead className="text-xs uppercase text-muted-foreground">Category</TableHead>
                      <TableHead className="text-xs uppercase text-muted-foreground">Department</TableHead>
                      <TableHead className="text-xs uppercase text-muted-foreground">Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.slice(0, 10).map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="text-sm text-slate-800">{asset.assetNo}</TableCell>
                        <TableCell className="text-sm text-slate-800">{asset.assetName}</TableCell>
                        <TableCell className="text-sm text-slate-600">{asset.categoryName}</TableCell>
                        <TableCell className="text-sm text-slate-600">{asset.department}</TableCell>
                        <TableCell className="text-sm text-slate-600">{asset.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
