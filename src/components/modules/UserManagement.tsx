import React, { useState, useEffect } from 'react';
import { User } from '../../App';
import { Edit2, Trash2, Search, UserPlus } from 'lucide-react';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser
} from '../../lib/database/users';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'staff' as 'admin' | 'admin_assistant' | 'staff'
  });

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data ?? []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Gagal memuatkan pengguna. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingUser) {
        const updates: Partial<User> = {
          fullName: formData.fullName,
          role: formData.role
        };

        await updateUser(editingUser.id, updates);
      } else {
        if (!formData.email || formData.email.trim() === '') {
          setError('Email is required for new users.');
          setSaving(false);
          return;
        }

        await createUser({
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role
        });
      }

      await loadUsers();
      resetForm();
    } catch (err) {
      console.error('Failed to save user:', err);
      setError('Gagal menyimpan pengguna. Sila cuba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      role: user.role
    });
    setShowModal(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    setError(null);
    try {
      await deleteUser(userId);
      // Refresh list
      await loadUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Gagal memadam pengguna. Sila cuba lagi.');
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      role: 'staff'
    });
    setEditingUser(null);
    setShowModal(false);
    setError(null);
  };

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-slate-800">User Management</h2>
          <p className="text-slate-600 text-sm mt-1">Invite users and manage their roles</p>
        </div>

        <Button
          className="gap-2"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <UserPlus className="w-5 h-5" />
          Invite User
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <TableHead className="text-xs uppercase text-muted-foreground">Name</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Email</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Role</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-slate-500">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-slate-500">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-sm text-slate-800">{user.fullName}</TableCell>
                    <TableCell className="text-sm text-slate-600">{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="static"
                        className={
                          user.role === 'admin'
                            ? 'bg-blue-100 text-blue-700'
                            : user.role === 'admin_assistant'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }
                      >
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={(open) => (open ? setShowModal(true) : resetForm())}>
        <DialogContent className="max-w-md">
          <DialogHeader>
          <DialogTitle>{editingUser ? 'Edit User' : 'Invite New User'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {editingUser && (
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required={!editingUser}
                disabled={!!editingUser}
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as 'admin' | 'admin_assistant' | 'staff' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin_assistant">Admin Assistant</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-3">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (editingUser ? 'Updating...' : 'Inviting...') : editingUser ? 'Update User' : 'Send Invite'}
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
