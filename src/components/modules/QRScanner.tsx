import React, { useState, useEffect } from 'react';
import { Asset } from '../../App';
import { QrCode, Search, Package } from 'lucide-react';
import { getAssets, getAssetByAssetId, getAssetById } from '../../lib/database/assets';

export function QRScanner() {
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');
  const [manualInput, setManualInput] = useState('');
  const [scannedAsset, setScannedAsset] = useState<Asset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // Preload assets for any UI that might need them (optional)
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAssets();
      setAssets(data ?? []);
    } catch (err) {
      console.error('Failed to load assets:', err);
      setError('Gagal memuatkan aset. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const searchAsset = async (assetIdOrId: string) => {
    setError(null);
    setScannedAsset(null);

    if (!assetIdOrId.trim()) {
      setError('Sila masukkan Asset ID.');
      return;
    }

    setSearching(true);
    try {
      // Try to find by asset_id first (human-friendly ID)
      const byAssetId = await getAssetByAssetId(assetIdOrId.trim());
      if (byAssetId) {
        setScannedAsset(byAssetId);
        return;
      }

      // Fallback: try by internal id
      const byId = await getAssetById(assetIdOrId.trim());
      if (byId) {
        setScannedAsset(byId);
        return;
      }

      setError('Aset tidak dijumpai. Sila pastikan Asset ID adalah betul.');
    } catch (err) {
      console.error('Search error:', err);
      setError('Ralat semasa mencari aset. Sila cuba lagi.');
    } finally {
      setSearching(false);
    }
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await searchAsset(manualInput.trim());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-slate-800">Scan QR Code</h2>
        <p className="text-slate-600 text-sm mt-1">
          Scan asset QR code or enter Asset ID manually
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setScanMode('manual')}
          className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
            scanMode === 'manual'
              ? 'bg-green-600 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Manual Entry
        </button>
        <button
          onClick={() => setScanMode('camera')}
          className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
            scanMode === 'camera'
              ? 'bg-green-600 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Camera Scan
        </button>
      </div>

      {/* Scanner Interface */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        {scanMode === 'manual' ? (
          <div>
            <form onSubmit={handleManualSearch} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-2">Enter Asset ID</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g., LAB-001 or internal id"
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={searching}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searching ? 'Mencari...' : 'Search Asset'}
              </button>
            </form>

            {/* Optional quick list or loader */}
            {loading && <div className="mt-4 text-sm text-slate-500">Loading assets...</div>}
          </div>
        ) : (
          <div className="text-center py-12">
            <QrCode className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">Camera scanning feature</p>
            <p className="text-sm text-slate-500">
              Camera access requires additional browser permissions
            </p>
            <p className="text-sm text-slate-500 mt-4">
              For now, please use manual entry to search for assets
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Scanned Asset Details */}
      {scannedAsset && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-slate-800">Asset Details</h3>
              <p className="text-sm text-slate-600">Found asset information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-500">Asset ID</label>
                <p className="text-slate-800">{scannedAsset.assetId}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Name</label>
                <p className="text-slate-800">{scannedAsset.name}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Category</label>
                <p className="text-slate-800">{scannedAsset.category}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-500">Location</label>
                <p className="text-slate-800">{scannedAsset.location}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Status</label>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    scannedAsset.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : scannedAsset.status === 'maintenance'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {scannedAsset.status}
                </span>
              </div>
              <div>
                <label className="text-sm text-slate-500">Purchase Date</label>
                <p className="text-slate-800">
                  {scannedAsset.purchaseDate ? new Date(scannedAsset.purchaseDate).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </div>

          {scannedAsset.warrantyExpiry && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <label className="text-sm text-slate-500">Warranty Expiry</label>
              <p className="text-slate-800">
                {new Date(scannedAsset.warrantyExpiry).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
