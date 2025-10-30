// src/views/Login.jsx (REFACTORED for SUPABASE)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      console.log('Login handleSubmit fired');
      // The context now handles the Supabase call
      await login(email, password); 
      console.log('Login successful, navigating to dashboard...');
      navigate('/dashboard');

    } catch (error) {
      // FIX: The error handling is simplified to use the returned error.message.
      const message = error.message || 'Login failed. Check credentials.';
      setError(message);
      console.error('Login Error:', error);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-canvas">
      <div className="p-6 max-w-sm w-full bg-bg-primary rounded-lg shadow-xl border border-border-primary">
        <h2 className="text-xl font-semibold mb-6 text-text-primary text-center">
          Login to Momentum
        </h2>
        
        {error && (
          <div className="bg-signal-error-bg text-signal-error border border-signal-error-border p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="mb-4">
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-action-primary"
              disabled={loading}
              required
            />
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-action-primary"
              disabled={loading}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-action-primary text-action-primary-inverted font-semibold rounded-md hover:bg-action-primary-hover disabled:opacity-50 transition duration-150"
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <p className="text-text-secondary">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-action-primary hover:underline font-medium"
              disabled={loading}
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;