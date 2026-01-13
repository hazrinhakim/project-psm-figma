import React, { useState, useEffect } from 'react';
import { Asset, User } from '../../App';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Package as PackageIcon,
  MapPin,
  User as UserIcon,
  Calendar,
  Wrench,
  FileText,
  QrCode,
  Download
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset
} from '../../lib/database/assets';
import { getAssetCategories } from '../../lib/database/assetCategories';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { QRScanner } from './QRScanner';

interface AssetManagementProps {
  currentUser: User;
}

export function AssetManagement({ currentUser }: AssetManagementProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [qrAssetId, setQrAssetId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrGenerating, setQrGenerating] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrGeneratedAsset, setQrGeneratedAsset] = useState<Asset | null>(null);
  const [qrScanOpen, setQrScanOpen] = useState(false);

  const [formData, setFormData] = useState({
    assetNo: '',
    assetName: '',
    year: '',
    department: '',
    unit: '',
    userName: '',
    purchaseDate: '',
    price: '',
    supplier: '',
    source: '',
    model: '',
    serialNo: '',
    processor: '',
    ramCapacity: '',
    hddCapacity: '',
    monitorModel: '',
    monitorSerialNo: '',
    monitorAssetNo: '',
    keyboardModel: '',
    keyboardSerialNo: '',
    keyboardAssetNo: '',
    mouseModel: '',
    mouseSerialNo: '',
    mouseAssetNo: '',
    accessories: '',
    categoryId: '',
    type: '',
    qrCode: ''
  });

  useEffect(() => {
    loadAssets();
    loadCategories();
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

  const loadCategories = async () => {
    try {
      const data = await getAssetCategories();
      setCategories(data ?? []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    }
  };

  const handleSelectQrAsset = (assetId: string) => {
    setQrAssetId(assetId);
    const asset = assets.find((item) => item.id === assetId) ?? null;
    setQrGeneratedAsset(asset);
    setQrCodeUrl(asset?.qrCode ?? '');
    setQrError(null);
  };

  const generateQrCodeForAsset = async () => {
    if (!qrAssetId) return;
    const asset = assets.find((item) => item.id === qrAssetId);
    if (!asset) return;

    setQrGenerating(true);
    setQrError(null);

    try {
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

      setQrCodeUrl(url);
      setQrGeneratedAsset(asset);

      try {
        await updateAsset(asset.id, { qrCode: url });
        await loadAssets();
      } catch (dbErr) {
        console.error('Failed to save QR code to DB:', dbErr);
        setQrError('Gagal menyimpan QR code. Tetapi QR telah dijana secara tempatan.');
      }
    } catch (err) {
      console.error('Error generating QR code:', err);
      setQrError('Gagal menjana QR code. Sila cuba lagi.');
    } finally {
      setQrGenerating(false);
    }
  };

  const downloadQrCode = () => {
    if (!qrCodeUrl || !qrGeneratedAsset) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `QR_${qrGeneratedAsset.assetNo || qrGeneratedAsset.id}.png`;
    link.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!formData.categoryId) {
      setError('Sila pilih kategori aset.');
      setSaving(false);
      return;
    }

    try {
      if (editingAsset) {
        // Update existing asset
        await updateAsset(editingAsset.id, {
          assetNo: formData.assetNo,
          assetName: formData.assetName,
          year: formData.year ? Number(formData.year) : null,
          department: formData.department,
          unit: formData.unit,
          userName: formData.userName,
          purchaseDate: formData.purchaseDate || '',
          price: formData.price ? Number(formData.price) : null,
          supplier: formData.supplier,
          source: formData.source,
          model: formData.model,
          serialNo: formData.serialNo,
          processor: formData.processor,
          ramCapacity: formData.ramCapacity,
          hddCapacity: formData.hddCapacity,
          monitorModel: formData.monitorModel,
          monitorSerialNo: formData.monitorSerialNo,
          monitorAssetNo: formData.monitorAssetNo,
          keyboardModel: formData.keyboardModel,
          keyboardSerialNo: formData.keyboardSerialNo,
          keyboardAssetNo: formData.keyboardAssetNo,
          mouseModel: formData.mouseModel,
          mouseSerialNo: formData.mouseSerialNo,
          mouseAssetNo: formData.mouseAssetNo,
          accessories: formData.accessories,
          categoryId: formData.categoryId,
          type: formData.type,
          qrCode: formData.qrCode
        });
      } else {
        // Create new asset
        await createAsset({
          assetNo: formData.assetNo,
          assetName: formData.assetName,
          year: formData.year ? Number(formData.year) : null,
          department: formData.department,
          unit: formData.unit,
          userName: formData.userName,
          purchaseDate: formData.purchaseDate || '',
          price: formData.price ? Number(formData.price) : null,
          supplier: formData.supplier,
          source: formData.source,
          model: formData.model,
          serialNo: formData.serialNo,
          processor: formData.processor,
          ramCapacity: formData.ramCapacity,
          hddCapacity: formData.hddCapacity,
          monitorModel: formData.monitorModel,
          monitorSerialNo: formData.monitorSerialNo,
          monitorAssetNo: formData.monitorAssetNo,
          keyboardModel: formData.keyboardModel,
          keyboardSerialNo: formData.keyboardSerialNo,
          keyboardAssetNo: formData.keyboardAssetNo,
          mouseModel: formData.mouseModel,
          mouseSerialNo: formData.mouseSerialNo,
          mouseAssetNo: formData.mouseAssetNo,
          accessories: formData.accessories,
          categoryId: formData.categoryId,
          type: formData.type,
          qrCode: formData.qrCode
        });
      }

      await loadAssets();
      resetForm();
    } catch (err) {
      console.error('Failed to save asset:', err);
      setError('Gagal menyimpan aset. Sila cuba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      assetNo: asset.assetNo,
      assetName: asset.assetName,
      year: asset.year ? String(asset.year) : '',
      department: asset.department,
      unit: asset.unit,
      userName: asset.userName,
      purchaseDate: asset.purchaseDate,
      price: asset.price !== null && asset.price !== undefined ? String(asset.price) : '',
      supplier: asset.supplier,
      source: asset.source,
      model: asset.model,
      serialNo: asset.serialNo,
      processor: asset.processor,
      ramCapacity: asset.ramCapacity,
      hddCapacity: asset.hddCapacity,
      monitorModel: asset.monitorModel,
      monitorSerialNo: asset.monitorSerialNo,
      monitorAssetNo: asset.monitorAssetNo,
      keyboardModel: asset.keyboardModel,
      keyboardSerialNo: asset.keyboardSerialNo,
      keyboardAssetNo: asset.keyboardAssetNo,
      mouseModel: asset.mouseModel,
      mouseSerialNo: asset.mouseSerialNo,
      mouseAssetNo: asset.mouseAssetNo,
      accessories: asset.accessories,
      categoryId: asset.categoryId,
      type: asset.type,
      qrCode: asset.qrCode ?? ''
    });
    setShowModal(true);
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    setError(null);
    try {
      await deleteAsset(assetId);
      await loadAssets();
    } catch (err) {
      console.error('Failed to delete asset:', err);
      setError('Gagal memadam aset. Sila cuba lagi.');
    }
  };

  const resetForm = () => {
    setFormData({
      assetNo: '',
      assetName: '',
      year: '',
      department: '',
      unit: '',
      userName: '',
      purchaseDate: '',
      price: '',
      supplier: '',
      source: '',
      model: '',
      serialNo: '',
      processor: '',
      ramCapacity: '',
      hddCapacity: '',
      monitorModel: '',
      monitorSerialNo: '',
      monitorAssetNo: '',
      keyboardModel: '',
      keyboardSerialNo: '',
      keyboardAssetNo: '',
      mouseModel: '',
      mouseSerialNo: '',
      mouseAssetNo: '',
      accessories: '',
      categoryId: '',
      type: '',
      qrCode: ''
    });
    setEditingAsset(null);
    setShowModal(false);
  };

  const hasQuery = searchQuery.trim().length > 0;
  const matchesAssignedUser = (assetUserName: string, staffName: string) => {
    const assetName = assetUserName.trim().toLowerCase().replace(/\s+/g, ' ');
    const userName = staffName.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!assetName || !userName) return false;
    return assetName.includes(userName) || userName.includes(assetName);
  };
  const filteredAssets = assets.filter((asset) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return false;
    if (selectedCategory === 'my') {
      if (!matchesAssignedUser(asset.userName, currentUser.fullName)) {
        return false;
      }
    } else if (selectedCategory !== 'all' && asset.categoryId !== selectedCategory) {
      return false;
    }
    return [
      asset.assetNo,
      asset.assetName,
      asset.categoryName,
      asset.department,
      asset.unit,
      asset.userName,
      asset.model,
      asset.serialNo
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(q));
  });

  const formatValue = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  };

  const formatDate = (value: string | null | undefined) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  const getAssetDetails = (asset: Asset) => [
    { label: 'Asset No', value: asset.assetNo },
    { label: 'Asset Name', value: asset.assetName },
    { label: 'Category', value: asset.categoryName },
    { label: 'Type', value: asset.type },
    { label: 'Year', value: asset.year },
    { label: 'Department', value: asset.department },
    { label: 'Unit', value: asset.unit },
    { label: 'User Name', value: asset.userName },
    { label: 'Purchase Date', value: formatDate(asset.purchaseDate) },
    { label: 'Price', value: asset.price ?? null },
    { label: 'Supplier', value: asset.supplier },
    { label: 'Source', value: asset.source },
    { label: 'Model', value: asset.model },
    { label: 'Serial No', value: asset.serialNo },
    { label: 'Processor', value: asset.processor },
    { label: 'RAM Capacity', value: asset.ramCapacity },
    { label: 'HDD Capacity', value: asset.hddCapacity },
    { label: 'Monitor Model', value: asset.monitorModel },
    { label: 'Monitor Serial No', value: asset.monitorSerialNo },
    { label: 'Monitor Asset No', value: asset.monitorAssetNo },
    { label: 'Keyboard Model', value: asset.keyboardModel },
    { label: 'Keyboard Serial No', value: asset.keyboardSerialNo },
    { label: 'Keyboard Asset No', value: asset.keyboardAssetNo },
    { label: 'Mouse Model', value: asset.mouseModel },
    { label: 'Mouse Serial No', value: asset.mouseSerialNo },
    { label: 'Mouse Asset No', value: asset.mouseAssetNo },
    { label: 'Accessories', value: asset.accessories },
    { label: 'QR Code', value: asset.qrCode ?? '' },
    { label: 'Created At', value: formatDate(asset.createdAt ?? '') }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-slate-800">Asset Management</h2>
          <p className="text-slate-600 text-sm mt-1">Register and manage campus assets</p>
        </div>

        <Button
          className="gap-2"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus className="w-5 h-5" />
          Add Asset
        </Button>
      </div>

      {/* Search */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          <SelectItem value="my">My assets</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-slate-800 font-semibold tabular-nums">{assets.length}</div>
            <div className="text-sm text-slate-600">Total Assets</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-slate-800 font-semibold tabular-nums">{categories.length}</div>
            <div className="text-sm text-slate-600">Categories</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-slate-800 font-semibold tabular-nums">
              {assets.filter((a) => a.qrCode).length}
            </div>
            <div className="text-sm text-slate-600">With QR Code</div>
          </CardContent>
        </Card>
      </div>

      {/* QR Tools */}
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <QrCode className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <CardTitle className="text-base">QR Tools</CardTitle>
              <p className="text-sm text-slate-600">Generate or scan asset QR codes</p>
            </div>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => setQrScanOpen(true)}>
            <QrCode className="w-4 h-4" />
            Scan QR
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Asset</Label>
              <Select value={qrAssetId} onValueChange={handleSelectQrAsset} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? 'Loading assets...' : 'Choose an asset...'} />
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
            <Button
              onClick={generateQrCodeForAsset}
              disabled={!qrAssetId || qrGenerating}
              className="w-full"
            >
              {qrGenerating ? 'Generating...' : 'Generate QR Code'}
            </Button>
            {qrError && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded">
                {qrError}
              </div>
            )}
          </div>
          <div className="flex flex-col items-center justify-center gap-4">
            {qrCodeUrl && qrGeneratedAsset ? (
              <>
                <div className="inline-block p-4 bg-white border border-slate-200 rounded-lg">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-800">{qrGeneratedAsset.assetNo || '-'}</p>
                  <p className="text-xs text-slate-600">{qrGeneratedAsset.assetName || '-'}</p>
                </div>
                <Button onClick={downloadQrCode} className="gap-2">
                  <Download className="w-4 h-4" />
                  Download QR
                </Button>
              </>
            ) : (
              <div className="text-center text-sm text-slate-500">
                Select an asset to generate a QR code.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading assets...</div>
      ) : hasQuery ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset) => {
              const statusLabel = asset.userName.trim() ? 'active' : 'inactive';
              const statusClass =
                statusLabel === 'active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600';
              return (
                <Card key={asset.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                  <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center shrink-0">
                        <PackageIcon className="w-5 h-5 text-sky-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <CardTitle className="text-sm truncate">{asset.assetNo || '-'}</CardTitle>
                          <Badge variant="static"
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-normal ${statusClass}`}>
                            {statusLabel}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600">{asset.categoryName || 'Uncategorized'}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-slate-800 font-medium">
                      {asset.assetName || '-'}
                    </div>
                    <div className="space-y-2 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{asset.department || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>{asset.userName || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>Purchased: {formatDate(asset.purchaseDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-slate-400" />
                        <span>Type: {asset.type || '-'}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3 border-t border-slate-200 pt-4">
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <Button
                        variant="outline"
                        size="lg"
                        className="gap-2 rounded-lg text-sm"
                        onClick={() => setViewingAsset(asset)}
                      >
                        <FileText className="w-4 h-4" />
                        View Details
                      </Button>
                      <Button
                        variant="secondary"
                        size="lg"
                        className="gap-2 rounded-lg text-sm"
                        onClick={() => handleEdit(asset)}
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                    </div>
                    <Button
                      variant="destructive"
                      size="lg"
                      className="w-full gap-2 rounded-lg text-sm"
                      onClick={() => handleDelete(asset.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {filteredAssets.length === 0 && (
            <div className="text-center py-12">
              <PackageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No assets found</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <PackageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Masukkan kata kunci untuk paparkan aset.</p>
        </div>
      )}

      {/* Scan QR */}
      <Dialog open={qrScanOpen} onOpenChange={setQrScanOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
          </DialogHeader>
          <QRScanner />
        </DialogContent>
      </Dialog>

      {/* View Details */}
      <Dialog open={!!viewingAsset} onOpenChange={(open) => (!open ? setViewingAsset(null) : null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
          </DialogHeader>
          {viewingAsset && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Asset No</p>
                <p className="text-base text-slate-800">{viewingAsset.assetNo || '-'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {getAssetDetails(viewingAsset).map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
                  >
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-right text-slate-800">{formatValue(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingAsset(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal */}
      <Dialog open={showModal} onOpenChange={(open) => (open ? setShowModal(true) : resetForm())}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAsset ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Asset No</Label>
                <Input
                  type="text"
                  value={formData.assetNo}
                  onChange={(e) => setFormData({ ...formData, assetNo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Asset Name</Label>
                <Input
                  type="text"
                  value={formData.assetName}
                  onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      categoryId: value
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <SelectItem value="__empty" disabled>
                        No categories
                      </SelectItem>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Input
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>User Name</Label>
                <Input
                  type="text"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Purchase Date</Label>
                <Input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Source</Label>
                <Input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Serial No</Label>
                <Input
                  type="text"
                  value={formData.serialNo}
                  onChange={(e) => setFormData({ ...formData, serialNo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Processor</Label>
                <Input
                  type="text"
                  value={formData.processor}
                  onChange={(e) => setFormData({ ...formData, processor: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>RAM Capacity</Label>
                <Input
                  type="text"
                  value={formData.ramCapacity}
                  onChange={(e) => setFormData({ ...formData, ramCapacity: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>HDD Capacity</Label>
                <Input
                  type="text"
                  value={formData.hddCapacity}
                  onChange={(e) => setFormData({ ...formData, hddCapacity: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Monitor Model</Label>
                <Input
                  type="text"
                  value={formData.monitorModel}
                  onChange={(e) => setFormData({ ...formData, monitorModel: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Monitor Serial No</Label>
                <Input
                  type="text"
                  value={formData.monitorSerialNo}
                  onChange={(e) => setFormData({ ...formData, monitorSerialNo: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Monitor Asset No</Label>
                <Input
                  type="text"
                  value={formData.monitorAssetNo}
                  onChange={(e) => setFormData({ ...formData, monitorAssetNo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Keyboard Model</Label>
                <Input
                  type="text"
                  value={formData.keyboardModel}
                  onChange={(e) => setFormData({ ...formData, keyboardModel: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Keyboard Serial No</Label>
                <Input
                  type="text"
                  value={formData.keyboardSerialNo}
                  onChange={(e) => setFormData({ ...formData, keyboardSerialNo: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Keyboard Asset No</Label>
                <Input
                  type="text"
                  value={formData.keyboardAssetNo}
                  onChange={(e) => setFormData({ ...formData, keyboardAssetNo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Mouse Model</Label>
                <Input
                  type="text"
                  value={formData.mouseModel}
                  onChange={(e) => setFormData({ ...formData, mouseModel: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Mouse Serial No</Label>
                <Input
                  type="text"
                  value={formData.mouseSerialNo}
                  onChange={(e) => setFormData({ ...formData, mouseSerialNo: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Mouse Asset No</Label>
                <Input
                  type="text"
                  value={formData.mouseAssetNo}
                  onChange={(e) => setFormData({ ...formData, mouseAssetNo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Accessories</Label>
                <Input
                  type="text"
                  value={formData.accessories}
                  onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>QR Code</Label>
                <Input
                  type="text"
                  value={formData.qrCode}
                  onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (editingAsset ? 'Updating...' : 'Creating...') : editingAsset ? 'Update Asset' : 'Create Asset'}
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
