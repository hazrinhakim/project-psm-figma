import React, { useState } from 'react';
import { User, Feedback } from '../../App';
import { MessageSquare, Send } from 'lucide-react';
import { createFeedback } from '../../lib/database/feedback';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface FeedbackFormProps {
  user: User;
}

export function FeedbackForm({ user }: FeedbackFormProps) {
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const newFeedback: Omit<Feedback, 'id'> = {
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      createdByName: user.fullName,
      role: user.role === 'admin_assistant' ? 'admin_assistant' : 'staff',
      message,
      status: 'open',
      email: user.email
    };

    try {
      await createFeedback(newFeedback);
      setSuccess(true);
      setMessage('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setError('Gagal menghantar maklum balas. Sila cuba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-slate-800">Give Feedback</h2>
        <p className="text-slate-600 text-sm mt-1">
          Share your comments and suggestions with the management team
        </p>
      </div>

      {/* Feedback Form */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-slate-700" />
          </div>
          <CardTitle className="text-base">Submit Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Your Feedback</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your thoughts, suggestions, or concerns about the asset management system..."
                rows={8}
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded">
                {error}
              </div>
            )}

            <Button type="submit" disabled={saving} className="w-full gap-2">
              <Send className="w-5 h-5" />
              {saving ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>

          {success && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">
              Thank you! Your feedback has been submitted successfully.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guidelines */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="text-slate-800 mb-3">Feedback Guidelines</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          <li>Be specific and constructive in your feedback</li>
          <li>Include relevant details about assets or locations if applicable</li>
          <li>Suggest improvements or solutions when possible</li>
          <li>Your feedback helps us improve the asset management system</li>
          <li>All feedback is reviewed by the management team</li>
        </ul>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <h4 className="text-sm text-slate-800 mb-2">System Features</h4>
            <p className="text-xs text-slate-600">
              Suggestions for new features or improvements to existing functionality
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h4 className="text-sm text-slate-800 mb-2">Asset Issues</h4>
            <p className="text-xs text-slate-600">
              General comments about asset conditions or management processes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h4 className="text-sm text-slate-800 mb-2">User Experience</h4>
            <p className="text-xs text-slate-600">
              Feedback about the ease of use and navigation of the system
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
