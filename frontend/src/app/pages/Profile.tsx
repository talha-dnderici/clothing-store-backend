import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { Pencil, Shield, User, X } from 'lucide-react';
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

type ProfileForm = {
  name: string;
  email: string;
  taxId: string;
  address: string;
  password: string;
};

function readToken() {
  if (typeof window === 'undefined') return '';
  return window.sessionStorage.getItem('token') ?? '';
}

function toForm(profile: UserProfile): ProfileForm {
  return {
    name: profile.name ?? '',
    email: profile.email ?? '',
    taxId: profile.taxId?.trim() ?? '',
    address: profile.address?.trim() ?? '',
    password: '',
  };
}

function ProfileRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-gray-100 py-4 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 break-all">{value}</dd>
    </div>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2 border-b border-gray-100 py-4 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-4">
      <label htmlFor={`profile-${label}`} className="text-sm font-semibold text-gray-500">
        {label}
      </label>
      <input
        id={`profile-${label}`}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
      />
    </div>
  );
}

export default function Profile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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
          const nextProfile = response.data as UserProfile;
          setProfile(nextProfile);
          setForm(toForm(nextProfile));
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

  const startEditing = () => {
    setForm(toForm(display));
    setSaveError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setForm(toForm(display));
    setSaveError(null);
    setEditing(false);
  };

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user.id || !form) return;

    setSaving(true);
    setSaveError(null);

    const payload: Record<string, string> = {
      name: form.name.trim(),
      email: form.email.trim(),
      taxId: form.taxId.trim(),
      address: form.address.trim(),
    };

    if (form.password.trim()) {
      if (form.password.trim().length < 6) {
        setSaveError('Password must be at least 6 characters.');
        setSaving(false);
        return;
      }
      payload.password = form.password.trim();
    }

    try {
      const response = await api.updateUser(token, user.id, payload);
      const updated = response.data as UserProfile;
      setProfile(updated);
      setForm(toForm(updated));
      setEditing(false);
      login(
        {
          id: user.id,
          name: updated.name,
          email: updated.email,
          role: updated.role ?? user.role,
        },
        token,
      );
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Profile could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
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
        {!loading && !error && !editing ? (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            <Pencil size={16} />
            Edit profile
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Customer properties</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{editing ? form?.name || display.name : display.name}</p>
        </div>

        {loading ? (
          <p className="px-6 py-8 text-sm text-gray-500">Loading profile…</p>
        ) : error ? (
          <p className="px-6 py-8 text-sm text-rose-600">{error}</p>
        ) : editing && form ? (
          <form onSubmit={handleSave} className="px-6 pb-6">
            <ProfileRow label="ID" value={display.id || '—'} />
            <ProfileField
              label="Name"
              value={form.name}
              onChange={(value) => updateField('name', value)}
              required
            />
            <ProfileField
              label="Tax ID"
              value={form.taxId}
              onChange={(value) => updateField('taxId', value)}
              placeholder="Optional"
            />
            <ProfileField
              label="E-mail address"
              value={form.email}
              onChange={(value) => updateField('email', value)}
              type="email"
              required
            />
            <ProfileField
              label="Home address"
              value={form.address}
              onChange={(value) => updateField('address', value)}
              placeholder="Street, city, country"
            />
            <ProfileField
              label="New password"
              value={form.password}
              onChange={(value) => updateField('password', value)}
              type="password"
              placeholder="Leave blank to keep current password"
            />

            {saveError ? <p className="mt-4 text-sm text-rose-600">{saveError}</p> : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl className="px-6">
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
          </dl>
        )}
      </div>
    </div>
  );
}
