# Migration Example: From localStorage to Supabase

This document shows how to migrate your components from using `localStorage` to Supabase.

## Example: AssetManagement Component

### Before (using localStorage)

```typescript
// src/components/modules/AssetManagement.tsx
import { useState, useEffect } from 'react';
import { Asset } from '../../App';

export function AssetManagement() {
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = () => {
    const assetsData = localStorage.getItem('assets');
    if (assetsData) {
      setAssets(JSON.parse(assetsData));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAsset: Asset = {
      id: Date.now().toString(),
      ...formData
    };
    const updatedAssets = [...assets, newAsset];
    setAssets(updatedAssets);
    localStorage.setItem('assets', JSON.stringify(updatedAssets));
  };

  const handleDelete = (assetId: string) => {
    const updatedAssets = assets.filter((a) => a.id !== assetId);
    setAssets(updatedAssets);
    localStorage.setItem('assets', JSON.stringify(updatedAssets));
  };
}
```

### After (using Supabase)

```typescript
// src/components/modules/AssetManagement.tsx
import { useState, useEffect } from 'react';
import { Asset } from '../../App';
import { getAssets, createAsset, updateAsset, deleteAsset } from '../../lib/database/assets';
import { toast } from 'sonner'; // or your preferred toast library

export function AssetManagement() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await getAssets();
      setAssets(data);
    } catch (error) {
      console.error('Failed to load assets:', error);
      toast.error('Failed to load assets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAsset) {
        // Update existing asset
        const updated = await updateAsset(editingAsset.id, formData);
        setAssets(assets.map(a => a.id === updated.id ? updated : a));
        toast.success('Asset updated successfully');
      } else {
        // Create new asset
        const newAsset = await createAsset(formData);
        setAssets([...assets, newAsset]);
        toast.success('Asset created successfully');
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save asset:', error);
      toast.error('Failed to save asset. Please try again.');
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) {
      return;
    }
    try {
      await deleteAsset(assetId);
      setAssets(assets.filter((a) => a.id !== assetId));
      toast.success('Asset deleted successfully');
    } catch (error) {
      console.error('Failed to delete asset:', error);
      toast.error('Failed to delete asset. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading assets...</div>;
  }

  // ... rest of component
}
```

## Key Changes

1. **Import database functions**: Import the specific functions you need from `src/lib/database/`
2. **Make functions async**: Database operations are asynchronous
3. **Add error handling**: Wrap database calls in try-catch blocks
4. **Add loading states**: Show loading indicators while fetching data
5. **Add user feedback**: Use toast notifications to inform users of success/errors
6. **Update state after operations**: Update local state after successful database operations

## Migration Checklist

For each component that uses localStorage:

- [ ] Import the appropriate database functions
- [ ] Convert `load*` functions to async and use `await`
- [ ] Add try-catch error handling
- [ ] Add loading states
- [ ] Update create/update/delete functions to use database calls
- [ ] Add user feedback (toast notifications)
- [ ] Test all CRUD operations
- [ ] Remove localStorage code

## Components to Migrate

1. `src/components/Login.tsx` - User authentication
2. `src/components/modules/AssetManagement.tsx` - Asset CRUD
3. `src/components/modules/UserManagement.tsx` - User CRUD
4. `src/components/modules/MaintenanceManagement.tsx` - Maintenance requests
5. `src/components/modules/FeedbackManagement.tsx` - Feedback
6. `src/components/AdminAssistantDashboard.tsx` - Notifications
7. `src/components/AdminDashboard.tsx` - Notifications
8. `src/components/StaffDashboard.tsx` - Notifications
9. `src/App.tsx` - User session management

## Real-time Updates (Optional)

Supabase supports real-time subscriptions. Here's how to listen for changes:

```typescript
import { supabase } from '../../lib/supabase';

useEffect(() => {
  // Subscribe to asset changes
  const channel = supabase
    .channel('assets-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'assets'
      },
      (payload) => {
        console.log('Asset changed:', payload);
        loadAssets(); // Reload assets
      }
    )
    .subscribe();

  // Cleanup subscription on unmount
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

This will automatically update your UI when assets are changed in the database!

