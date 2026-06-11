import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  taxId?: string;
  address?: string;
  role?: string;
};

function readToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('token') ?? '';
}

function ProfileRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-gray-100 py-4 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 break-all">{value}</dd>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = readToken();

  useEffect(() => {
    if (!user?.id || !token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .getUser(token, user.id)
      .then((response) => {
        if (!cancelled) {
          setProfile(response.data as UserProfile);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Profile could not be loaded.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, token]);

  if (!user || !token) {
    return <Navigate to="/auth?redirect=/profile" replace />;
  }

  const display = profile ?? {
    id: user.id ?? '—',
    name: user.name,
    email: user.email,
    taxId: '',
    address: '',
    role: user.role,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1
          className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-gray-900"
          data-testid="profile-title"
        >
          <User size={28} className="text-gray-700" />
          My Profile
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Your account details stored in the clothing store platform.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Customer properties</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{display.name}</p>
        </div>

        <dl className="px-6">
          {loading ? (
            <p className="py-8 text-sm text-gray-500">Loading profile…</p>
          ) : error ? (
            <p className="py-8 text-sm text-rose-600">{error}</p>
          ) : (
            <>
              <ProfileRow label="ID" value={display.id || '—'} />
              <ProfileRow label="Name" value={display.name || '—'} />
              <ProfileRow label="Tax ID" value={display.taxId?.trim() || '—'} />
              <ProfileRow label="E-mail address" value={display.email || '—'} />
              <ProfileRow
                label="Home address"
                value={display.address?.trim() || 'No address saved yet.'}
              />
              <ProfileRow
                label="Password"
                value={
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden className="font-mono tracking-widest text-gray-400">
                      ••••••••
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      <Shield size={12} />
                      Stored securely (hashed)
                    </span>
                  </span>
                }
              />
            </>
          )}
        </dl>
      </div>
    </div>
  );
}
