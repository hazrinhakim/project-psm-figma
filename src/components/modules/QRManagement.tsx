import React, { useState, useEffect } from 'react';
import { Asset } from '../../App';
import QRCode from 'qrcode';
import { QrCode, Download, Package as PackageIcon } from 'lucide-react';
import { getAssets, updateAsset } from '../../lib/database/assets';

export function QRManagement() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [generatedAsset, setGeneratedAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

  const generateQRCode = async (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;

    setGenerating(true);
    setError(null);

    try {
      // Prepare QR payload (keep minimal info or an ID/URL depending on your scanning flow)
      const qrData = JSON.stringify({
        id: asset.id,
        assetId: asset.assetId,
        name: asset.name,
        category: asset.category,
        location: asset.location
      });

      const url = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      // Update UI
      setQrCodeUrl(url);
      setGeneratedAsset(asset);

      // Persist QR code URL to Supabase (update asset record)
      try {
        await updateAsset(asset.id, { qrCode: url });
        // Refresh assets list to reflect saved qrCode
        await loadAssets();
      } catch (dbErr) {
        console.error('Failed to save QR code to DB:', dbErr);
        setError('Gagal menyimpan QR code. Tetapi QR telah dijana secara tempatan.');
      }
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Gagal menjana QR code. Sila cuba lagi.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = () => {
    if (selectedAsset) {
      generateQRCode(selectedAsset);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeUrl && generatedAsset) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `QR_${generatedAsset.assetId}.png`;
      link.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-slate-800">QR Code Management</h2>
        <p className="text-slate-600 text-sm mt-1">Generate QR codes for asset identification</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <QrCode className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-slate-800">Generate QR Code</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-700 mb-2">Select Asset</label>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">{loading ? 'Loading assets...' : 'Choose an asset...'}</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.assetId} - {asset.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!selectedAsset || generating}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating...' : 'Generate QR Code'}
            </button>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded">
                {error}
              </div>
            )}
          </div>

          {qrCodeUrl && generatedAsset && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="text-center">
                <div className="inline-block p-4 bg-white border-2 border-slate-200 rounded-lg mb-4">
                  <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                </div>
                <div className="mb-4">
                  <p className="text-sm text-slate-800">{generatedAsset.assetId}</p>
                  <p className="text-sm text-slate-600">{generatedAsset.name}</p>
                </div>
                <button
                  onClick={downloadQRCode}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mx-auto"
                >
                  <Download className="w-5 h-5" />
                  Download QR Code
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Assets with QR Codes */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-slate-800 mb-4">Assets with QR Codes</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {assets
              .filter((asset) => asset.qrCode)
              .map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedAsset(asset.id);
                    generateQRCode(asset.id);
                  }}
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <PackageIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 truncate">{asset.assetId}</p>
                    <p className="text-xs text-slate-600 truncate">{asset.name}</p>
                  </div>
                  <QrCode className="w-5 h-5 text-green-600 flex-shrink-0" />
                </div>
              ))}
            {assets.filter((asset) => asset.qrCode).length === 0 && (
              <div className="text-center py-8">
                <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 text-sm">No QR codes generated yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-slate-800 mb-3">How to use QR Codes</h3>
        <ol className="space-y-2 text-sm text-slate-700">
          <li>1. Select an asset from the dropdown menu</li>
          <li>2. Click "Generate QR Code" to create a unique QR code</li>
          <li>3. Download the QR code image</li>
          <li>4. Print and attach the QR code to the physical asset</li>
          <li>5. Staff can scan the QR code to view asset details or submit maintenance requests</li>
        </ol>
      </div>
    </div>
  );
}
