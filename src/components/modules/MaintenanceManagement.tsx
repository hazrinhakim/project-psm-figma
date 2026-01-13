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
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function MaintenanceManagement() {
  const [requests, setRequests] = useState<MaintenanceRequestType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'Pending' | 'In Progress' | 'Resolved'
  >('all');
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
    newStatus: 'Pending' | 'In Progress' | 'Resolved'
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
          updatedAt: new Date().toISOString()
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
        updatedAt: new Date().toISOString()
      });

      // Send notification to staff (createNotification handles DB mapping)
      const req = updatedRequests.find((r) => r.id === requestId);
      if (req && req.requestedBy) {
        const message = `Your maintenance request for ${req.assetLabel} has been updated to: ${newStatus}`;
        await createNotification({
          userId: req.requestedBy,
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
      request.assetLabel.toLowerCase().includes(q) ||
      request.requestedByName.toLowerCase().includes(q) ||
      request.title.toLowerCase().includes(q) ||
      request.description.toLowerCase().includes(q);

    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'Pending').length,
    inProgress: requests.filter((r) => r.status === 'In Progress').length,
    completed: requests.filter((r) => r.status === 'Resolved').length
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-slate-800 font-semibold tabular-nums">{stats.total}</div>
            <div className="text-sm text-slate-600">Total Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-slate-800 font-semibold tabular-nums">{stats.pending}</div>
            <div className="text-sm text-slate-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-slate-800 font-semibold tabular-nums">{stats.inProgress}</div>
            <div className="text-sm text-slate-600">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-slate-800 font-semibold tabular-nums">{stats.completed}</div>
            <div className="text-sm text-slate-600">Resolved</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <Select
            value={filterStatus}
            onValueChange={(value) =>
              setFilterStatus(value as 'all' | 'Pending' | 'In Progress' | 'Resolved')
            }
          >
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading requests...</div>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{request.assetLabel}</CardTitle>
                      <p className="text-sm text-slate-600">{request.title}</p>
                      {request.description && (
                        <p className="text-xs text-slate-500 mt-1">{request.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Submitted by:</span>
                      <span className="text-slate-800 ml-2">{request.requestedByName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Date:</span>
                      <span className="text-slate-800 ml-2">{new Date(request.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <Badge
                    variant="secondary"
                    className={
                      request.status === 'Pending'
                        ? 'bg-slate-100 text-slate-700'
                        : request.status === 'In Progress'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                    }
                  >
                    {request.status.replace('_', ' ')}
                  </Badge>
                  <Button
                    variant="link"
                    className="text-sm text-blue-700"
                    onClick={() => setSelectedRequest(request)}
                  >
                    Update Status
                  </Button>
                </div>
              </CardHeader>
            </Card>
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
      <Dialog open={!!selectedRequest} onOpenChange={(open) => (!open ? setSelectedRequest(null) : null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Request Status</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <>
              <div className="mb-6">
                <p className="text-sm text-slate-600 mb-2">Asset: {selectedRequest.assetLabel}</p>
                <p className="text-sm text-slate-600">Staff: {selectedRequest.requestedByName}</p>
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => updateStatus(selectedRequest.id, 'Pending')}
                  disabled={savingId === selectedRequest.id}
                >
                  Pending
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => updateStatus(selectedRequest.id, 'In Progress')}
                  disabled={savingId === selectedRequest.id}
                >
                  In Progress
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => updateStatus(selectedRequest.id, 'Resolved')}
                  disabled={savingId === selectedRequest.id}
                >
                  Resolved
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" className="w-full" onClick={() => setSelectedRequest(null)}>
                  Cancel
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
