import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const redirectTo = new URLSearchParams(location.search).get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const fullName = String(formData.get('fullName') || '').trim();
    const taxId = String(formData.get('taxId') || '').trim();
    const address = String(formData.get('address') || '').trim();

    try {
      if (isLogin) {
        const response = await api.login({ email, password });
        const data = response.data as {
          token: string;
          user?: { id?: string; name?: string; email?: string; role?: string };
        };

        login(
          {
            id: data.user?.id,
            name: data.user?.name || fullName || email.split('@')[0] || 'User',
            email: data.user?.email || email,
            role: data.user?.role,
          },
          data.token,
        );
      } else {
        await api.register({
          name: fullName,
          email,
          password,
          taxId,
          address,
        });

        const response = await api.login({ email, password });
        const data = response.data as {
          token: string;
          user?: { id?: string; name?: string; email?: string; role?: string };
        };

        login(
          {
            id: data.user?.id,
            name: data.user?.name || fullName || email.split('@')[0] || 'User',
            email: data.user?.email || email,
            role: data.user?.role,
          },
          data.token,
        );
      }

      navigate(redirectTo);
    } catch (err: any) {
      const rawMessage = String(err?.message || '').trim();
      const friendlyMessage =
        isLogin && (!rawMessage || rawMessage.toLowerCase() === 'internal server error')
          ? 'Invalid email or password.'
          : rawMessage || 'Authentication failed. Please try again.';

      setError(friendlyMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const passwordStrength = (() => {
    if (!password) return { score: 0, label: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return { score, label: labels[score] };
  })();

  return (
    <div className="flex min-h-screen bg-white font-sans selection:bg-black selection:text-white">
      {/* Left side: Fashion Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1602107545989-576b14346164?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbGlmZXN0eWxlfGVufDF8fHx8MTc3NDUzNTczOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Fashion Lifestyle"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-black/10" />
        
        <Link 
          to="/" 
          className="absolute top-8 left-8 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md hover:bg-white/30 transition-colors shadow-sm"
        >
          <ArrowLeft size={16} /> Back to Store
        </Link>
      </div>

      {/* Right side: Auth Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12 lg:p-16 bg-[#fafafa]">
        <div className="w-full max-w-md">
          {/* Mobile Back Link */}
          <Link 
            to="/" 
            className="lg:hidden inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Store
          </Link>

          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">AURA.</h1>
            <p className="text-gray-500">
              {isLogin ? 'Welcome back. Please enter your details.' : 'Create an account to join the club.'}
            </p>
          </div>

          {/* Form Container */}
          <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
            {/* Toggle */}
            <div className="flex rounded-lg bg-gray-100 p-1 mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
                  isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
                  !isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Register
              </button>
            </div>

            {/* Forms */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      placeholder="Jane Doe"
                      className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-1.5">Tax ID</label>
                    <input
                      type="text"
                      id="taxId"
                      name="taxId"
                      placeholder="XX-XXXXXXX"
                      className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm transition-colors"
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">E-mail Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="jane@example.com"
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm transition-colors"
                />
              </div>

              {!isLogin && (
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5">Home Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    placeholder="123 Fashion Ave, NY 10001"
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm transition-colors"
                  />
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm transition-colors"
                />
                {!isLogin && password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i <= passwordStrength.score
                              ? passwordStrength.score < 2 ? 'bg-red-500'
                              : passwordStrength.score < 3 ? 'bg-amber-500'
                              : passwordStrength.score < 4 ? 'bg-lime-500'
                              : 'bg-green-600'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 font-medium">{passwordStrength.label}</p>
                  </div>
                )}
              </div>

              {isLogin && (
                <div className="flex items-center justify-end mt-2">
                  <a href="#" className="text-sm font-medium text-gray-600 hover:text-black hover:underline underline-offset-4 transition-colors">
                    Forgot Password?
                  </a>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex w-full justify-center items-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-70"
              >
                {submitting ? (
                  <><span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Please wait…</>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>

              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-400 uppercase tracking-widest font-semibold">Or</span>
                </div>
              </div>
              <p className="mt-6 text-center text-sm text-gray-500">
                {isLogin ? "Don't have an account?" : 'Already a member?'}{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin((v) => !v)}
                  className="font-bold text-black hover:underline underline-offset-4"
                >
                  {isLogin ? 'Create one' : 'Sign in'}
                </button>
              </p>
            </form>
          </div>
          
          <p className="mt-8 text-center text-xs text-gray-500">
            By continuing, you agree to AURA's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
