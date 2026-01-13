import React, { useState, useEffect } from 'react';
import { Feedback } from '../../App';
import { MessageSquare, Search, CheckCircle } from 'lucide-react';
import { getFeedback, updateFeedback } from '../../lib/database/feedback';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function FeedbackManagement() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'reviewed' | 'closed'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    loadFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFeedback();
      setFeedbackList(data ?? []);
    } catch (err) {
      console.error('Failed to load feedback:', err);
      setError('Gagal memuatkan maklum balas. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const markAsReviewed = async (feedbackId: string) => {
    // Optimistic UI update
    const prev = feedbackList;
    const updated = feedbackList.map((f) =>
      f.id === feedbackId ? { ...f, status: 'reviewed' as const } : f
    );
    setFeedbackList(updated);
    setSavingId(feedbackId);
    setError(null);

    try {
      await updateFeedback(feedbackId, { status: 'reviewed' });
      setSavingId(null);
    } catch (err) {
      console.error('Failed to mark feedback as reviewed:', err);
      setError('Gagal mengemaskini status. Sila cuba lagi.');
      // Revert optimistic update
      setFeedbackList(prev);
      setSavingId(null);
    }
  };

  const filteredFeedback = feedbackList.filter((feedback) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      feedback.message.toLowerCase().includes(q) ||
      feedback.createdByName.toLowerCase().includes(q) ||
      feedback.email.toLowerCase().includes(q);

    const matchesFilter = filterStatus === 'all' || feedback.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: feedbackList.length,
    open: feedbackList.filter((f) => f.status === 'open').length,
    reviewed: feedbackList.filter((f) => f.status === 'reviewed').length,
    closed: feedbackList.filter((f) => f.status === 'closed').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-slate-800">Feedback Management</h2>
        <p className="text-slate-600 text-sm mt-1">Review feedback from staff members</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-slate-800 font-semibold tabular-nums">{stats.total}</div>
            <div className="text-sm text-slate-600">Total Feedback</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-slate-800 font-semibold tabular-nums">{stats.open}</div>
            <div className="text-sm text-slate-600">Open</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-slate-800 font-semibold tabular-nums">{stats.reviewed}</div>
            <div className="text-sm text-slate-600">Reviewed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl text-slate-800 font-semibold tabular-nums">{stats.closed}</div>
            <div className="text-sm text-slate-600">Closed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11"
          />
        </div>
        <Select
          value={filterStatus}
          onValueChange={(value) => setFilterStatus(value as 'all' | 'open' | 'reviewed' | 'closed')}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading feedback...</div>
        ) : (
          filteredFeedback.map((feedback) => (
            <Card key={feedback.id}>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-slate-700" />
                </div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{feedback.createdByName || 'Unknown'}</CardTitle>
                  <Badge
                    variant="secondary"
                    className={
                      feedback.status === 'open'
                        ? 'bg-blue-50 text-blue-700'
                        : feedback.status === 'closed'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-slate-100 text-slate-700'
                    }
                  >
                    {feedback.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-slate-600 mb-2">{feedback.message}</p>
                  <p className="text-xs text-slate-500">Role: {feedback.role.replace('_', ' ')}</p>
                  {feedback.email && (
                    <p className="text-xs text-slate-500">Email: {feedback.email}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    {new Date(feedback.createdAt).toLocaleString()}
                  </p>
                </div>
                {feedback.status === 'open' && (
                  <Button
                    variant="outline"
                    onClick={() => markAsReviewed(feedback.id)}
                    disabled={savingId === feedback.id}
                    className="gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {savingId === feedback.id ? 'Updating...' : 'Mark Reviewed'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}

        {!loading && filteredFeedback.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No feedback found</p>
          </div>
        )}
      </div>
    </div>
  );
}
