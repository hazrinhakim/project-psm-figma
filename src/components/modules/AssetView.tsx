import React, { useState, useEffect } from 'react';
import { Asset } from '../../App';
import { Package, Search, MapPin, Calendar } from 'lucide-react';
import { getAssets } from '../../lib/database/assets';

export function AssetView() {
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

  const categories = ['all', ...Array.from(new Set(assets.map((a) => a.category || 'Uncategorized')))];

  const filteredAssets = assets.filter((asset) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      asset.name.toLowerCase().includes(q) ||
      asset.assetId.toLowerCase().includes(q) ||
      asset.location.toLowerCase().includes(q);

    const matchesCategory = selectedCategory === 'all' || (asset.category || 'Uncategorized') === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>
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
              <div key={asset.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-slate-800">{asset.assetId}</h3>
                      <p className="text-sm text-slate-600">{asset.category}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      asset.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : asset.status === 'maintenance'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {asset.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-slate-800">{asset.name}</p>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4" />
                    <span>{asset.location}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Purchased:{' '}
                      {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '—'}
                    </span>
                  </div>

                  {asset.warrantyExpiry && (
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-xs text-slate-600">
                        Warranty until: {new Date(asset.warrantyExpiry).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
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
