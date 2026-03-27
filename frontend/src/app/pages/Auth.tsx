import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const fullName = formData.get('fullName') as string;
    
    // Simulate login/registration
    if (email) {
      login(email, fullName);
      navigate('/');
    }
  };

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
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm transition-colors"
                />
              </div>

              {isLogin && (
                <div className="flex items-center justify-end mt-2">
                  <a href="#" className="text-sm font-medium text-gray-600 hover:text-black hover:underline underline-offset-4 transition-colors">
                    Forgot Password?
                  </a>
                </div>
              )}

              <button
                type="submit"
                className="mt-6 flex w-full justify-center rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
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
