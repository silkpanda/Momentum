// src/views/Login.jsx (Fixed navigation path)

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login handleSubmit fired');
    setError('');

    if (!login) {
      setError('Auth service is not available. Please refresh.');
      console.error('Login function is missing from AuthContext');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      console.log('Login successful, navigating to dashboard...');
      
      // --- THIS IS THE FIX ---
      // Your App.jsx routes the dashboard to "/", not "/dashboard"
      navigate('/'); // Was '/dashboard'

    } catch (err) {
      console.error('Login failed in component:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
      <div className="max-w-md w-full p-8 bg-bg-primary shadow-md rounded-lg">
        <h2 className="text-3xl font-semibold text-center text-text-primary mb-8">
          Log In
        </h2>
        
        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-action-primary"
            />
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-action-primary"
            />
          </div>
          
          {/* Error Display */}
          {error && <p className="text-sm text-signal-error mt-4 mb-4 text-center">{error}</p>}

          {/* Submit Button */}
          <div className="mb-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-action-primary text-action-primary-inverted py-2 px-4 rounded-md font-medium hover:bg-action-primary-hover focus:outline-none focus:ring-2 focus:ring-action-primary focus:ring-opacity-50 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </div>
          
          <p className="text-sm text-center text-text-secondary">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-action-primary hover:underline">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;