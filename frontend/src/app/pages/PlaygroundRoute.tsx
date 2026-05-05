import React from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { isAdminUser } from '../utils/admin';
import Playground from './Playground';

/**
 * Admin-only wrapper around the Playground page.
 *
 * Guards the staff/manager Playground from regular customers. Anonymous users
 * are sent to the auth screen with `?redirect=/playground` so they bounce back
 * after signing in. Customers without admin privileges land on the home page.
 *
 * This wrapper exists separately from `Playground.tsx` so that the underlying
 * page component's hook order stays untouched — the guard runs first and never
 * mounts the heavy Playground until access is confirmed.
 */
export default function PlaygroundRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth?redirect=/playground" replace />;
  }
  if (!isAdminUser(user)) {
    return <Navigate to="/" replace />;
  }

  return <Playground />;
}
