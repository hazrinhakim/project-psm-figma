import React, { useState } from 'react';
import { Lock, User as UserIcon } from 'lucide-react';
import { User } from '../App';
import { supabase } from '../lib/supabase';
import { getProfileById } from '../lib/database/profiles';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import icamsLogo from '../styles/ICAMS-1.png';

interface LoginProps {
  onLogin: (user: User) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      const sessionUser = data.user;
      if (!sessionUser) {
        setError('Login failed. Please try again.');
        return;
      }

      const profile = await getProfileById(sessionUser.id);
      onLogin({
        id: sessionUser.id,
        fullName: profile?.fullName ?? '',
        role: profile?.role ?? 'staff',
        email: sessionUser.email ?? ''
      });
    } catch (err) {
      console.error('Login error:', err);
      setError('System error. Please try again later.');
    }
  };

  if (showForgotPassword) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-50">
        <div className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-emerald-200/50 blur-3xl" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-lg items-center px-4 py-12">
          <Card className="w-full border-slate-200/70 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
                <Lock className="h-6 w-6" />
              </div>
              <CardTitle>Forgot Password</CardTitle>
              <CardDescription>
                Please contact your system administrator to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setShowForgotPassword(false)}
                variant="outline"
                className="w-full"
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-sky-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-emerald-200/50 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-5xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6 text-slate-900">
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Secure access for staff and administrators
          </div>
          <div className="space-y-3">
            <img
              src={icamsLogo.src ? icamsLogo.src : icamsLogo as unknown as string}
              alt="ICAMS logo"
              className="w-32"
            />
            <p className="max-w-md text-base text-slate-600">
              ICT Asset Management System for Pejabat Daerah Kampar. Manage assets,
              requests, and reports with a streamlined, modern workflow.
            </p>
          </div>
          <div className="grid max-w-md grid-cols-2 gap-4 text-sm text-slate-600">
            <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 shadow-sm">
              Role-based access
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 shadow-sm">
              Fast approvals
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 shadow-sm">
              Real-time insights
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 shadow-sm">
              Asset tracking
            </div>
          </div>
        </div>

        <Card className="w-full border-slate-200/70 shadow-xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to continue managing your assets.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-10"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-10"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="h-11 w-full">
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                type="button"
                variant="link"
                className="text-sm text-slate-600"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot Password?
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
