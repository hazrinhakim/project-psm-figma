import React, { useState, useEffect } from 'react';
import { User, Asset, MaintenanceRequest as MaintenanceRequestType, Notification } from '../../App';
import { Wrench, Send } from 'lucide-react';
import { getAssets } from '../../lib/database/assets';
import {
  createMaintenanceRequest,
  getMaintenanceRequestsByStaffId
} from '../../lib/database/maintenance';
import { createNotification } from '../../lib/database/notifications';
import { getUsers } from '../../lib/database/users';

interface MaintenanceRequestProps {
  user: User;
}

export function MaintenanceRequest({ user }: MaintenanceRequestProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [success, setSuccess] = useState(false);
  const [myRequests, setMyRequests] = useState<MaintenanceRequestType[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setAssets(data ?? []);
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
      assetName: asset.name,
      staffId: user.id,
      staffName: user.name,
      issueDescription,
      status: 'pending',
      submittedDate: new Date().toISOString()
    };

    try {
      // Create maintenance request in DB
      const created = await createMaintenanceRequest(newRequestPayload);

      // Notify admin users
      try {
        const users = await getUsers();
        const adminUsers = (users || []).filter(
          (u) => u.role === 'admin' || u.role === 'admin_assistant'
        );

        // Create notifications for each admin
        await Promise.all(
          adminUsers.map((admin) =>
            createNotification({
              userId: admin.id,
              message: `New maintenance request from ${user.name} for ${asset.name}`,
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
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Wrench className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-slate-800">New Maintenance Request</h3>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-2">Select Asset</label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={loadingAssets}
            >
              <option value="">{loadingAssets ? 'Loading assets...' : 'Choose an asset...'}</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.assetId} - {asset.name} ({asset.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-2">Issue Description</label>
            <textarea
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Describe the issue or problem with the asset..."
              rows={5}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            <Send className="w-5 h-5" />
            {saving ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>

        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            ✓ Maintenance request submitted successfully!
          </div>
        )}
      </div>

      {/* My Requests */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-slate-800 mb-4">My Requests</h3>

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
                  <p className="text-sm text-slate-800">{request.assetName}</p>
                  <p className="text-xs text-slate-600 mt-1">{request.issueDescription}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(request.submittedDate).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ml-4 ${
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
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
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
