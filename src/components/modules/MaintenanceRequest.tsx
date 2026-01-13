import React, { useState, useEffect } from 'react';
import { User, Asset, MaintenanceRequest as MaintenanceRequestType, Notification } from '../../App';
import { Wrench, Send } from 'lucide-react';
import { getAssets } from '../../lib/database/assets';
import {
  createMaintenanceRequest,
  getMaintenanceRequestsByStaffId
} from '../../lib/database/maintenance';
import { createNotification } from '../../lib/database/notifications';
import { getProfilesByRoles } from '../../lib/database/profiles';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface MaintenanceRequestProps {
  user: User;
}

export function MaintenanceRequest({ user }: MaintenanceRequestProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [title, setTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [success, setSuccess] = useState(false);
  const [myRequests, setMyRequests] = useState<MaintenanceRequestType[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matchesAssignedUser = (assetUserName: string, staffName: string) => {
    const assetName = assetUserName.trim().toLowerCase().replace(/\s+/g, ' ');
    const userName = staffName.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!assetName || !userName) return false;
    return assetName.includes(userName) || userName.includes(assetName);
  };

  useEffect(() => {
    loadAssets();
    loadMyRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAssets = async () => {
    setLoadingAssets(true);
    setError(null);
    try {
      const data = await getAssets();
      const assignedAssets = (data ?? []).filter((asset) =>
        matchesAssignedUser(asset.userName, user.fullName)
      );
      setAssets(assignedAssets);
    } catch (err) {
      console.error('Failed to load assets:', err);
      setError('Gagal memuatkan aset. Sila cuba lagi.');
    } finally {
      setLoadingAssets(false);
    }
  };

  const loadMyRequests = async () => {
    setLoadingRequests(true);
    setError(null);
    try {
      const data = await getMaintenanceRequestsByStaffId(user.id);
      setMyRequests(data ?? []);
    } catch (err) {
      console.error('Failed to load my requests:', err);
      setError('Gagal memuatkan permintaan anda. Sila cuba lagi.');
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const asset = assets.find((a) => a.id === selectedAssetId);
    if (!asset) {
      setError('Sila pilih aset yang sah.');
      return;
    }

    setSaving(true);

    const newRequestPayload: Omit<MaintenanceRequestType, 'id'> = {
      assetId: asset.id,
      assetLabel: asset.assetName || asset.assetNo || '',
      requestedBy: user.id,
      requestedByName: user.fullName,
      title,
      description: issueDescription,
      status: 'Pending',
      adminRemark: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Create maintenance request in DB
      await createMaintenanceRequest(newRequestPayload);

      // Notify admin users
      try {
        const adminUsers = await getProfilesByRoles(['admin', 'admin_assistant']);

        // Create notifications for each admin
        await Promise.all(
          adminUsers.map((admin) =>
            createNotification({
              userId: admin.id,
              message: `New maintenance request from ${user.fullName} for ${asset.assetName || asset.assetNo}`,
              type: 'maintenance',
              date: new Date().toISOString(),
              read: false
            } as Omit<Notification, 'id'>)
          )
        );
      } catch (notifErr) {
        console.error('Failed to create notifications for admins:', notifErr);
        // Non-fatal: continue but inform user
      }

      setSuccess(true);
      setSelectedAssetId('');
      setTitle('');
      setIssueDescription('');
      // Refresh user's requests
      await loadMyRequests();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to submit maintenance request:', err);
      setError('Gagal menghantar permintaan. Sila cuba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-slate-800">Submit Maintenance Request</h2>
        <p className="text-slate-600 text-sm mt-1">Report issues with campus assets for maintenance</p>
      </div>

      {/* Request Form */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <Wrench className="w-6 h-6 text-slate-700" />
          </div>
          <CardTitle className="text-base">New Maintenance Request</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Asset</Label>
              <Select value={selectedAssetId} onValueChange={setSelectedAssetId} disabled={loadingAssets}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingAssets ? 'Loading assets...' : 'Choose an asset...'} />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.assetNo} - {asset.assetName || asset.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Printer not turning on"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Issue Description</Label>
              <Textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe the issue or problem with the asset..."
                rows={5}
                required
              />
            </div>

            <Button type="submit" disabled={saving} className="w-full gap-2">
              <Send className="w-5 h-5" />
              {saving ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>

          {success && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">
              Maintenance request submitted successfully!
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="p-4 text-sm text-slate-500">Loading your requests...</div>
          ) : myRequests.length === 0 ? (
            <p className="text-slate-500 text-sm py-4">No requests submitted yet</p>
          ) : (
            <div className="space-y-3">
              {myRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm text-slate-800">{request.assetLabel}</p>
                    <p className="text-xs text-slate-600 mt-1">{request.title}</p>
                    {request.description && (
                      <p className="text-xs text-slate-500 mt-1">{request.description}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
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
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="text-slate-800 mb-3">How to Submit a Request</h3>
        <ol className="space-y-2 text-sm text-slate-700">
          <li>1. Select the asset that needs maintenance from the dropdown</li>
          <li>2. Provide a detailed description of the issue</li>
          <li>3. Click "Submit Request" to notify the maintenance team</li>
          <li>4. You'll receive notifications when the status is updated</li>
          <li>5. Track your requests in the "My Requests" section below</li>
        </ol>
      </div>
    </div>
  );
}
