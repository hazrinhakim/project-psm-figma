import React, { useState, useEffect } from 'react';
import type { Asset } from '../../App';
import QRCode from 'qrcode';
import { QrCode, Download, Package as PackageIcon } from 'lucide-react';
import { getAssets, updateAsset } from '../../lib/database/assets';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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
        assetNo: asset.assetNo,
        assetName: asset.assetName,
        category: asset.categoryName,
        department: asset.department,
        unit: asset.unit
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
      link.download = `QR_${generatedAsset.assetNo || generatedAsset.id}.png`;
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
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <QrCode className="w-6 h-6 text-slate-700" />
            </div>
            <CardTitle className="text-base">Generate QR Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Asset</Label>
              <Select value={selectedAsset} onValueChange={setSelectedAsset} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? 'Loading assets...' : 'Choose an asset...'} />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.assetNo} - {asset.assetName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!selectedAsset || generating}
              className="w-full"
            >
              {generating ? 'Generating...' : 'Generate QR Code'}
            </Button>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded">
                {error}
              </div>
            )}

            {qrCodeUrl && generatedAsset && (
              <div className="mt-2 pt-6 border-t border-slate-200">
                <div className="text-center">
                  <div className="inline-block p-4 bg-white border border-slate-200 rounded-lg mb-4">
                    <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-slate-800">{generatedAsset.assetNo}</p>
                    <p className="text-sm text-slate-600">{generatedAsset.assetName}</p>
                  </div>
                  <Button onClick={downloadQRCode} className="gap-2">
                    <Download className="w-5 h-5" />
                    Download QR Code
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assets with QR Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assets with QR Codes</CardTitle>
          </CardHeader>
          <CardContent>
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
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <PackageIcon className="w-6 h-6 text-slate-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 truncate">{asset.assetNo}</p>
                      <p className="text-xs text-slate-600 truncate">{asset.assetName}</p>
                    </div>
                    <QrCode className="w-5 h-5 text-blue-700 flex-shrink-0" />
                  </div>
                ))}
              {assets.filter((asset) => asset.qrCode).length === 0 && (
                <div className="text-center py-8">
                  <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 text-sm">No QR codes generated yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        {/* Instructions */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
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
    </div>
  );
}
