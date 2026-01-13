import React, { useState, useEffect } from 'react';
import { Asset, User } from '../../App';
import { Package, Search } from 'lucide-react';
import { getAssets } from '../../lib/database/assets';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AssetViewProps {
  user: User;
}

export function AssetView({ user }: AssetViewProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
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

  const categories = [
    'all',
    ...Array.from(new Set(assets.map((a) => a.categoryName || 'Uncategorized')))
  ];

  const matchesAssignedUser = (assetUserName: string, staffName: string) => {
    const assetName = assetUserName.trim().toLowerCase().replace(/\s+/g, ' ');
    const userName = staffName.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!assetName || !userName) return false;
    return assetName.includes(userName) || userName.includes(assetName);
  };

  const assignedAssets = assets.filter((asset) =>
    matchesAssignedUser(asset.userName, user.fullName)
  );

  const filteredAssets = assignedAssets.filter((asset) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      [
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

    const matchesCategory =
      selectedCategory === 'all' ||
      (asset.categoryName || 'Uncategorized') === selectedCategory;

    return matchesSearch && matchesCategory;
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
      <div>
        <h2 className="text-slate-800">View Assets</h2>
        <p className="text-slate-600 text-sm mt-1">Browse all available campus assets</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
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
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error / Loading */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading assets...</div>
      ) : (
        <>
          {/* Assets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset) => (
              <Card key={asset.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-slate-700" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{asset.assetNo || '-'}</CardTitle>
                      <p className="text-sm text-slate-600">{asset.categoryName || 'Uncategorized'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">{asset.type || '—'}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-2 text-xs text-slate-700">
                    {getAssetDetails(asset).map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-4">
                        <span className="text-slate-500">{item.label}</span>
                        <span className="text-right text-slate-800">{formatValue(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAssets.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No assets found</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
