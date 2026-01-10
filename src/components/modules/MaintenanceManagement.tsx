import React, { useState, useEffect } from 'react';
import { MaintenanceRequest as MaintenanceRequestType, Notification } from '../../App';
import { Wrench, Search, Filter } from 'lucide-react';
import {
  getMaintenanceRequests,
  updateMaintenanceRequest
} from '../../lib/database/maintenance';
import {
  createNotification
} from '../../lib/database/notifications';

export function MaintenanceManagement() {
  const [requests, setRequests] = useState<MaintenanceRequestType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>(
    'all'
  );
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequestType | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMaintenanceRequests();
      setRequests(data ?? []);
    } catch (err) {
      console.error('Failed to load maintenance requests:', err);
      setError('Gagal memuatkan permintaan penyelenggaraan. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    requestId: string,
    newStatus: 'pending' | 'in_progress' | 'completed'
  ) => {
    setError(null);
    setSavingId(requestId);

    // Optimistic update locally
    const prev = requests;
    const updatedRequests = requests.map((r) => {
      if (r.id === requestId) {
        return {
          ...r,
          status: newStatus,
          completedDate: newStatus === 'completed' ? new Date().toISOString() : r.completedDate
        };
      }
      return r;
    });
    setRequests(updatedRequests);
    setSelectedRequest(null);

    try {
      // Update in DB
      await updateMaintenanceRequest(requestId, {
        status: newStatus,
        completedDate: newStatus === 'completed' ? new Date().toISOString() : undefined
      });

      // Send notification to staff (createNotification handles DB mapping)
      const req = updatedRequests.find((r) => r.id === requestId);
      if (req && req.staffId) {
        const message = `Your maintenance request for ${req.assetName} has been updated to: ${newStatus.replace(
          '_',
          ' '
        )}`;
        await createNotification({
          userId: req.staffId,
          message,
          type: 'maintenance',
          date: new Date().toISOString(),
          read: false
        } as Omit<Notification, 'id'>);
      }
    } catch (err) {
      console.error('Failed to update maintenance request:', err);
      setError('Gagal mengemaskini status. Sila cuba lagi.');
      // Revert optimistic update
      setRequests(prev);
    } finally {
      setSavingId(null);
    }
  };

  const filteredRequests = requests.filter((request) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      request.assetName.toLowerCase().includes(q) ||
      request.staffName.toLowerCase().includes(q) ||
      request.issueDescription.toLowerCase().includes(q);

    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    inProgress: requests.filter((r) => r.status === 'in_progress').length,
    completed: requests.filter((r) => r.status === 'completed').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-slate-800">Maintenance Management</h2>
        <p className="text-slate-600 text-sm mt-1">Review and manage maintenance requests</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-2xl text-slate-800">{stats.total}</div>
          <div className="text-sm text-slate-600">Total Requests</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-2xl text-orange-600">{stats.pending}</div>
          <div className="text-sm text-slate-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-2xl text-blue-600">{stats.inProgress}</div>
          <div className="text-sm text-slate-600">In Progress</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-2xl text-green-600">{stats.completed}</div>
          <div className="text-sm text-slate-600">Completed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as 'all' | 'pending' | 'in_progress' | 'completed')
            }
            className="px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading requests...</div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-slate-800">{request.assetName}</h3>
                      <p className="text-sm text-slate-600">{request.issueDescription}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Submitted by:</span>
                      <span className="text-slate-800 ml-2">{request.staffName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Date:</span>
                      <span className="text-slate-800 ml-2">
                        {new Date(request.submittedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      request.status === 'pending'
                        ? 'bg-orange-100 text-orange-700'
                        : request.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {request.status.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {!loading && filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No maintenance requests found</p>
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-slate-800 mb-4">Update Request Status</h3>
            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-2">Asset: {selectedRequest.assetName}</p>
              <p className="text-sm text-slate-600">Staff: {selectedRequest.staffName}</p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => updateStatus(selectedRequest.id, 'pending')}
                disabled={savingId === selectedRequest.id}
                className="w-full px-4 py-3 text-left bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-60"
              >
                Pending
              </button>
              <button
                onClick={() => updateStatus(selectedRequest.id, 'in_progress')}
                disabled={savingId === selectedRequest.id}
                className="w-full px-4 py-3 text-left bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-60"
              >
                In Progress
              </button>
              <button
                onClick={() => updateStatus(selectedRequest.id, 'completed')}
                disabled={savingId === selectedRequest.id}
                className="w-full px-4 py-3 text-left bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-60"
              >
                Completed
              </button>
            </div>
            <button
              onClick={() => setSelectedRequest(null)}
              className="w-full mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
