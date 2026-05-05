/**
 * Admin / manager access control helpers.
 *
 * Until the backend exposes a proper `role` field on every user, we maintain
 * a small front-end allow-list of email addresses that have manager access
 * (Playground, manager-only routes). Update `BUILTIN_ADMIN_EMAILS` when a
 * teammate needs admin access in their dev/demo environment.
 *
 * You can also override this list at build time by setting the
 * `VITE_ADMIN_EMAILS` env var (comma-separated emails) in `.env.local`.
 *
 * NOTE: This is a defensive UI-side guard only. Sensitive backend endpoints
 * must enforce their own authorization — never trust this list for security.
 */

const BUILTIN_ADMIN_EMAILS: string[] = [
  // Team members (update as needed)
  'stilapp26@gmail.com',
  'baranutkuguler@gmail.com',
  // Seed/demo accounts used during development
  'manager@aura.test',
  'admin@aura.test',
];

const ENV_ADMIN_EMAILS: string[] = (() => {
  try {
    const raw = (import.meta as any)?.env?.VITE_ADMIN_EMAILS as string | undefined;
    if (!raw) return [];
    return raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
})();

const ADMIN_EMAIL_SET = new Set<string>(
  [...BUILTIN_ADMIN_EMAILS, ...ENV_ADMIN_EMAILS].map((e) => e.toLowerCase()),
);

/** Returns true when the given email matches an entry in the admin allow-list. */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAIL_SET.has(email.trim().toLowerCase());
}

/** Returns true when a `User` object's `role` field signals admin/manager access,
 *  OR when their email matches the allow-list. Use this in components. */
export function isAdminUser(user?: { email?: string; role?: string } | null): boolean {
  if (!user) return false;
  const role = (user.role ?? '').toLowerCase();
  if (role === 'admin' || role === 'manager' || role === 'sales_manager' || role === 'product_manager') {
    return true;
  }
  return isAdminEmail(user.email);
}
