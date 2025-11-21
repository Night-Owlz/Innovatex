'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DIETARY_PREFERENCES, BUDGET_RANGES } from '@/lib/constants';
import { Eye, EyeOff, ArrowRight, Leaf, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    household_size: 1,
    dietary_preferences: [],
    budget_range: '',
    location: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDietaryPreference = (pref) => {
    setFormData((prev) => ({
      ...prev,
      dietary_preferences: prev.dietary_preferences.includes(pref)
        ? prev.dietary_preferences.filter((p) => p !== pref)
        : [...prev.dietary_preferences, pref],
    }));
  };

  return (
    <div className="min-h-screen flex bg-black text-white overflow-hidden">
      {/* Left Side - Hero/Visuals (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/40 to-black z-10"></div>
        {/* Abstract Shapes */}
        <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-teal-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
        
        <div className="relative z-20 p-12 max-w-xl text-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-[#00FFB1] to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#00FFB1]/20 -rotate-3 hover:-rotate-6 transition-transform duration-500">
                <Leaf className="w-10 h-10 text-black" />
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Start Your Journey
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed">
                Create an account to track your food consumption, reduce waste, and contribute to a sustainable future.
            </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative overflow-y-auto">
        {/* Mobile Background Effects */}
        <div className="absolute inset-0 lg:hidden overflow-hidden pointer-events-none">
             <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-500/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="w-full max-w-2xl space-y-8 relative z-10 py-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-gray-400">Fill in your details to get started</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFB1] focus:border-transparent transition-all outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFB1] focus:border-transparent transition-all outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFB1] focus:border-transparent transition-all outline-none pr-12"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Household Size</label>
                <input
                  type="number"
                  min="1"
                  value={formData.household_size}
                  onChange={(e) => setFormData({ ...formData, household_size: parseInt(e.target.value) })}
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFB1] focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Budget Range</label>
                <div className="relative">
                    <select
                    value={formData.budget_range}
                    onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:ring-2 focus:ring-[#00FFB1] focus:border-transparent transition-all outline-none appearance-none"
                    >
                    <option value="">Select...</option>
                    {BUDGET_RANGES.map((range) => (
                        <option key={range.value} value={range.value} className="bg-gray-900">
                        {range.label}
                        </option>
                    ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FFB1] focus:border-transparent transition-all outline-none"
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300 ml-1">Dietary Preferences</label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_PREFERENCES.map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => toggleDietaryPreference(pref)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                      formData.dietary_preferences.includes(pref)
                        ? 'bg-[#00FFB1] text-black border-[#00FFB1]'
                        : 'bg-gray-900/50 text-gray-400 border-gray-800 hover:border-gray-700 hover:bg-gray-800'
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00FFB1] hover:bg-[#00db9a] text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.01] mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-[#00FFB1] font-medium hover:underline transition-all">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
