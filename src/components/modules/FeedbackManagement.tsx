import React, { useState, useEffect } from 'react';
import { Feedback } from '../../App';
import { MessageSquare, Search, CheckCircle } from 'lucide-react';
import { getFeedback, updateFeedback } from '../../lib/database/feedback';

export function FeedbackManagement() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'reviewed'>('all');
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
      feedback.staffName.toLowerCase().includes(q);

    const matchesFilter = filterStatus === 'all' || feedback.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: feedbackList.length,
    new: feedbackList.filter((f) => f.status === 'new').length,
    reviewed: feedbackList.filter((f) => f.status === 'reviewed').length
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-2xl text-slate-800">{stats.total}</div>
          <div className="text-sm text-slate-600">Total Feedback</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-2xl text-purple-600">{stats.new}</div>
          <div className="text-sm text-slate-600">New</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-2xl text-green-600">{stats.reviewed}</div>
          <div className="text-sm text-slate-600">Reviewed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'new' | 'reviewed')}
          className="px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
        </select>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading feedback...</div>
        ) : (
          filteredFeedback.map((feedback) => (
            <div
              key={feedback.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-slate-800">{feedback.staffName}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          feedback.status === 'new'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {feedback.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{feedback.message}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(feedback.submittedDate).toLocaleString()}
                    </p>
                  </div>
                </div>

                {feedback.status === 'new' && (
                  <button
                    onClick={() => markAsReviewed(feedback.id)}
                    disabled={savingId === feedback.id}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex-shrink-0 disabled:opacity-60"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {savingId === feedback.id ? 'Updating...' : 'Mark Reviewed'}
                  </button>
                )}
              </div>
            </div>
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
