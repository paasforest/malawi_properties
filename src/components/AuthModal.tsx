import { X } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    user_type: 'agent' as 'agent' | 'owner', // Only agent or owner
    location_country: '', // Required for agents/owners
    location_city: '', // Required for agents/owners
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Validate location for agents/owners
        if (!formData.location_country || !formData.location_city) {
          setError('Please provide your location (Country and City)');
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Build location string
          const currentLocation = `${formData.location_city}, ${formData.location_country}`;
          const isDiaspora = formData.location_country.toLowerCase() !== 'malawi';

          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            email: formData.email,
            full_name: formData.full_name,
            phone: formData.phone,
            current_location: currentLocation,
            is_diaspora: isDiaspora,
            user_type: formData.user_type,
          });

          if (profileError) throw profileError;

          // If agent, create agent profile
          if (formData.user_type === 'agent') {
            const { error: agentError } = await supabase.from('agents').insert({
              user_id: data.user.id,
              verification_status: 'pending',
            });

            if (agentError && !agentError.message.includes('duplicate')) {
              throw agentError;
            }
          }
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) throw signInError;
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.email) {
        setError('Please enter your email address');
        setLoading(false);
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setResetEmailSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isSignUp ? 'List Your Property' : 'Sign In'}
            </h2>
            {isSignUp && (
              <p className="text-sm text-gray-600 mt-1">
                Sign up to list properties as an Agent or Property Owner
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(true)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required={!showResetPassword}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={showResetPassword}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g., +265 991 123 456"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    I am registering as *
                  </label>
                  <select
                    required
                    value={formData.user_type}
                    onChange={(e) => setFormData({ ...formData, user_type: e.target.value as 'agent' | 'owner' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="agent">Real Estate Agent</option>
                    <option value="owner">Property Owner</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Where are you located? * <span className="text-xs text-gray-500 font-normal">(Required for data mining)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Country *</label>
                      <input
                        type="text"
                        required
                        value={formData.location_country}
                        onChange={(e) => setFormData({ ...formData, location_country: e.target.value })}
                        placeholder="e.g., Malawi, South Africa"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={formData.location_city}
                        onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                        placeholder="e.g., Lilongwe, Johannesburg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This helps us understand where sellers are located for market intelligence.
                  </p>
                </div>
              </>
            )}
          </div>

          {showResetPassword ? (
            <>
              {resetEmailSent ? (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium mb-2">
                    ✅ Password reset email sent!
                  </p>
                  <p className="text-sm text-green-700">
                    Check your email ({formData.email}) for a password reset link. Click the link to reset your password.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetPassword(false);
                      setResetEmailSent(false);
                    }}
                    className="mt-4 text-sm text-blue-600 hover:underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={loading || !formData.email}
                    className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(false)}
                    className="w-full mt-3 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                  >
                    Cancel
                  </button>
                </>
              )}
            </>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          )}

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:underline text-sm"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>

          {isSignUp && (
            <p className="mt-4 text-xs text-center text-gray-500">
              Note: Buyers don't need to sign up. You can browse properties and fill a simple form to see details.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
