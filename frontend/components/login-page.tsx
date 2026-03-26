'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../lib/api';
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
  type StoredSession,
} from '../lib/session';

interface ProfileRecord {
  id: string;
  name: string;
  email: string;
  address?: string;
  taxId?: string;
}

const initialRegister = {
  name: 'Talha Dunderici',
  email: 'talha@example.com',
  password: 'Talha123!',
  taxId: 'TR1234567890',
  address: 'Istanbul / Kadikoy',
};

const initialLogin = {
  email: 'talha@example.com',
  password: 'Talha123!',
};

export function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [session, setSession] = useState<StoredSession | null>(() =>
    typeof window === 'undefined' ? null : readStoredSession(),
  );
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [message, setMessage] = useState('Create an account or start a session.');

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.id) {
        setProfile(null);
        return;
      }

      try {
        const payload = await apiRequest<ProfileRecord>(`/users/${session.user.id}`, {
          method: 'GET',
        });
        setProfile(payload);
      } catch {
        setProfile(null);
      }
    }

    void loadProfile();
  }, [session?.user?.id]);

  const displayProfile = profile || session?.user || null;
  const initials = useMemo(() => displayProfile?.name || session?.user.name || 'Profile', [
    displayProfile?.name,
    session?.user.name,
  ]);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(stripEmpty(registerForm)),
      });
      setMessage('Customer registered successfully. You can log in now.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Register failed');
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const payload = await apiRequest<StoredSession>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
      });
      writeStoredSession(payload);
      setSession(payload);
      setMessage('Login successful. Storefront card creation is now enabled.');
      router.push('/');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login failed');
    }
  }

  function handleLogout() {
    clearStoredSession();
    setSession(null);
    setProfile(null);
    setMessage('You have been logged out.');
    router.push('/login');
  }

  async function handleDeleteAccount() {
    if (!session?.user?.id) {
      return;
    }

    try {
      await apiRequest(`/users/${session.user.id}`, { method: 'DELETE' });
      clearStoredSession();
      setSession(null);
      setProfile(null);
      setMessage('Your account has been deleted.');
      router.push('/');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Delete account failed');
    }
  }

  return (
    <div className="page-stack">
      {session ? (
        <section className="profile-shell">
          <div className="profile-card">
            <p className="eyebrow">My Account</p>
            <div className="profile-header">
              <div className="profile-avatar" aria-hidden="true">
                <ProfileIcon />
              </div>
              <div>
                <h1>{displayProfile?.name || session.user.name}</h1>
                <p className="profile-subtitle">Personal details and account information.</p>
              </div>
            </div>
            <div className="profile-details">
              <div className="profile-line">
                <span>Name</span>
                <strong>{displayProfile?.name || initials}</strong>
              </div>
              <div className="profile-line">
                <span>Email</span>
                <strong>{displayProfile?.email || session.user.email}</strong>
              </div>
              <div className="profile-line">
                <span>Address</span>
                <strong>{profile?.address || 'No address saved yet.'}</strong>
              </div>
              <div className="profile-line">
                <span>Tax ID</span>
                <strong>{profile?.taxId || 'No tax ID added yet.'}</strong>
              </div>
            </div>
            <section className="message-strip is-plain">
              <strong>Profile</strong>
              <span>{message}</span>
            </section>
          </div>

          <div className="profile-side-card">
            <p className="eyebrow">Account Overview</p>
            <h2>Your profile is ready.</h2>
            <p>
              You are signed in and your storefront actions now work with your active account.
            </p>
            <div className="profile-actions">
              <button type="button" className="primary-button" onClick={() => router.push('/')}>
                Back to Store
              </button>
              <button type="button" className="text-button" onClick={handleLogout}>
                Log out
              </button>
              <button type="button" className="danger-button" onClick={() => void handleDeleteAccount()}>
                Delete account
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="login-layout">
          <div className="login-form-panel">
            <div className="login-tabs">
              <button
                type="button"
                className={activeTab === 'login' ? 'login-tab is-active' : 'login-tab'}
                onClick={() => setActiveTab('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={activeTab === 'register' ? 'login-tab is-active' : 'login-tab'}
                onClick={() => setActiveTab('register')}
              >
                Create Account
              </button>
            </div>

            <section className="message-strip is-plain">
              <strong>Auth</strong>
              <span>{message}</span>
            </section>

            {activeTab === 'login' ? (
              <form className="auth-form" onSubmit={(event) => void handleLogin(event)}>
                <div className="field-stack">
                  {Object.entries(loginForm).map(([key, value]) => (
                    <label key={key} className="field">
                      <span>{toLabel(key)}</span>
                      <input
                        value={value}
                        type={key === 'password' ? 'password' : 'text'}
                        placeholder={key === 'email' ? 'Email *' : 'Password *'}
                        onChange={(event) =>
                          setLoginForm((current) => ({ ...current, [key]: event.target.value }))
                        }
                      />
                    </label>
                  ))}
                </div>

                <div className="login-meta-row">
                  <label className="remember-row">
                    <input type="checkbox" />
                    <span>Remember me</span>
                  </label>
                  <button type="button" className="link-button">
                    Forgot password
                  </button>
                </div>

                <button type="submit" className="primary-button login-submit">
                  Sign In
                </button>
                <button type="button" className="link-button centered-link">
                  Continue without account
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={(event) => void handleRegister(event)}>
                <div className="field-stack">
                  {Object.entries(registerForm).map(([key, value]) => (
                    <label key={key} className="field">
                      <span>{toLabel(key)}</span>
                      <input
                        value={value}
                        type={key === 'password' ? 'password' : 'text'}
                        onChange={(event) =>
                          setRegisterForm((current) => ({ ...current, [key]: event.target.value }))
                        }
                      />
                    </label>
                  ))}
                </div>
                <button type="submit" className="primary-button login-submit">
                  Create Account
                </button>
              </form>
            )}

            <div className="session-box login-session-box">
              <span>Active session</span>
              <strong>None</strong>
              <small>No active sign-in yet.</small>
            </div>
          </div>

          <div className="login-visual-panel">
            <img
              src="https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1600&q=80"
              alt="Minimal fashion campaign"
            />
          </div>
        </section>
      )}
    </div>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M4.5 20c1.5-3.3 4.2-5 7.5-5s6 1.7 7.5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function stripEmpty<T extends Record<string, string>>(values: T) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value.trim() !== ''),
  );
}

function toLabel(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}
