import React, { useState, useEffect, useRef } from 'react';
import { Asset } from '../../App';
import { QrCode, Search, Package } from 'lucide-react';
import { getAssets, getAssetByAssetId, getAssetById } from '../../lib/database/assets';
import jsQR from 'jsqr';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';

export function QRScanner() {
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');
  const [manualInput, setManualInput] = useState('');
  const [scannedAsset, setScannedAsset] = useState<Asset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraSupported, setCameraSupported] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const lastScanRef = useRef<string>('');

  useEffect(() => {
    // Preload assets for any UI that might need them (optional)
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scanMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanMode]);

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

  const parseQrPayload = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (!trimmed.startsWith('{')) return null;
    try {
      const parsed = JSON.parse(trimmed) as {
        id?: string;
        assetNo?: string;
        asset_no?: string;
      };
      return {
        id: parsed.id ?? '',
        assetNo: parsed.assetNo ?? parsed.asset_no ?? ''
      };
    } catch {
      return null;
    }
  };

  const stopCamera = () => {
    if (scanTimerRef.current !== null) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setError(null);
    setScannedAsset(null);

    if (!('mediaDevices' in navigator) || !navigator.mediaDevices.getUserMedia) {
      setCameraSupported(false);
      setCameraError('Camera not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      scanTimerRef.current = window.setInterval(async () => {
        if (!videoRef.current) return;
        try {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!canvas) return;
          const width = video.videoWidth;
          const height = video.videoHeight;
          if (!width || !height) return;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const qr = jsQR(imageData.data, width, height);
          const value = qr?.data ?? '';
          if (!value || value === lastScanRef.current) return;
          lastScanRef.current = value;
          stopCamera();
          await searchAsset(value);
        } catch (scanErr) {
          console.error('QR scan error:', scanErr);
        }
      }, 500);
    } catch (err) {
      console.error('Failed to start camera:', err);
      setCameraError('Failed to access camera. Please allow camera permissions.');
      stopCamera();
    }
  };

  const searchAsset = async (assetIdOrId: string) => {
    setError(null);
    setScannedAsset(null);

    if (!assetIdOrId.trim()) {
      setError('Sila masukkan Asset No atau ID.');
      return;
    }

    setSearching(true);
    try {
      const parsed = parseQrPayload(assetIdOrId);
      const directInput = assetIdOrId.trim();

      if (parsed?.id) {
        const byId = await getAssetById(parsed.id);
        if (byId) {
          setScannedAsset(byId);
          return;
        }
      }

      const assetNoCandidate = parsed?.assetNo || directInput;

      // Try to find by asset_id first (human-friendly ID)
      const byAssetId = await getAssetByAssetId(assetNoCandidate);
      if (byAssetId) {
        setScannedAsset(byAssetId);
        return;
      }

      // Fallback: try by internal id
      const byId = await getAssetById(assetNoCandidate);
      if (byId) {
        setScannedAsset(byId);
        return;
      }

      setError('Aset tidak dijumpai. Sila pastikan Asset No adalah betul.');
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
          Scan asset QR code or enter Asset No manually
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2">
        <Button
          onClick={() => setScanMode('manual')}
          variant={scanMode === 'manual' ? 'default' : 'outline'}
          className="flex-1"
        >
          Manual Entry
        </Button>
        <Button
          onClick={() => setScanMode('camera')}
          variant={scanMode === 'camera' ? 'default' : 'outline'}
          className="flex-1"
        >
          Camera Scan
        </Button>
      </div>

      {/* Scanner Interface */}
      <Card>
        {scanMode === 'manual' ? (
          <CardContent>
            <form onSubmit={handleManualSearch} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm text-slate-700">Enter Asset No</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g., DKP/DKP01/..."
                    className="pl-11"
                  />
                </div>
              </div>
              <Button type="submit" disabled={searching} className="w-full">
                {searching ? 'Mencari...' : 'Search Asset'}
              </Button>
            </form>

            {/* Optional quick list or loader */}
            {loading && <div className="mt-4 text-sm text-slate-500">Loading assets...</div>}
          </CardContent>
        ) : (
          <CardContent className="space-y-4">
            {!cameraSupported ? (
              <div className="text-center py-8">
                <QrCode className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">Camera scanning not available</p>
                <p className="text-sm text-slate-500">
                  Please use manual entry to search for assets.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 relative">
                  <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{cameraActive ? 'Camera is active' : 'Camera is off'}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (cameraActive ? stopCamera() : startCamera())}
                  >
                    {cameraActive ? 'Stop Camera' : 'Start Camera'}
                  </Button>
                </div>
                {cameraError && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded">
                    {cameraError}
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  Tip: camera scanning needs HTTPS or localhost to access the camera.
                </p>
              </div>
            )}
          </CardContent>
        )}

        {error && (
          <CardContent>
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Scanned Asset Details */}
      {scannedAsset && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <CardTitle className="text-base">Asset Details</CardTitle>
              <p className="text-sm text-slate-600">Found asset information</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 text-sm text-slate-700">
              {[
                { label: 'Asset No', value: scannedAsset.assetNo },
                { label: 'Asset Name', value: scannedAsset.assetName },
                { label: 'Category', value: scannedAsset.categoryName },
                { label: 'Type', value: scannedAsset.type },
                { label: 'Year', value: scannedAsset.year },
                { label: 'Department', value: scannedAsset.department },
                { label: 'Unit', value: scannedAsset.unit },
                { label: 'User Name', value: scannedAsset.userName },
                { label: 'Purchase Date', value: scannedAsset.purchaseDate },
                { label: 'Price', value: scannedAsset.price },
                { label: 'Supplier', value: scannedAsset.supplier },
                { label: 'Source', value: scannedAsset.source },
                { label: 'Model', value: scannedAsset.model },
                { label: 'Serial No', value: scannedAsset.serialNo },
                { label: 'Processor', value: scannedAsset.processor },
                { label: 'RAM Capacity', value: scannedAsset.ramCapacity },
                { label: 'HDD Capacity', value: scannedAsset.hddCapacity },
                { label: 'Monitor Model', value: scannedAsset.monitorModel },
                { label: 'Monitor Serial No', value: scannedAsset.monitorSerialNo },
                { label: 'Monitor Asset No', value: scannedAsset.monitorAssetNo },
                { label: 'Keyboard Model', value: scannedAsset.keyboardModel },
                { label: 'Keyboard Serial No', value: scannedAsset.keyboardSerialNo },
                { label: 'Keyboard Asset No', value: scannedAsset.keyboardAssetNo },
                { label: 'Mouse Model', value: scannedAsset.mouseModel },
                { label: 'Mouse Serial No', value: scannedAsset.mouseSerialNo },
                { label: 'Mouse Asset No', value: scannedAsset.mouseAssetNo },
                { label: 'Accessories', value: scannedAsset.accessories },
                { label: 'QR Code', value: scannedAsset.qrCode }
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="text-right text-slate-800">
                    {item.value === null || item.value === undefined || item.value === '' ? '-' : String(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
