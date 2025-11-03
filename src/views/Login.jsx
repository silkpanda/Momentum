import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate(); // We keep this for the Link to /signup

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    console.log('Login handleSubmit fired'); // Log line 28

    try {
      const { error: loginError } = await login(email, password);
      if (loginError) {
        throw loginError;
      }
      console.log('Login successful. Auth state will now update.'); // MODIFIED
      // We no longer navigate from here.
      // The App.jsx component will observe the auth state change and redirect.
      // navigate('/dashboard'); // <-- REMOVED
    } catch (err) {
      console.error('Login Error:', err);
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-canvas">
      <div className="w-full max-w-md p-8 space-y-6 bg-bg-surface rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-center text-text-primary">
          Log In to Momentum
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-text-secondary"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm bg-bg-input border-border-default focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-text-secondary"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm bg-bg-input border-border-default focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>

          {error && (
            <p className="text-sm text-center text-red-500">{error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-medium text-white rounded-md bg-brand-primary hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50"
            >
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-text-secondary">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-medium text-brand-primary hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}