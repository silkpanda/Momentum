// src/views/SignUp.jsx (Fixed typo on line 86)

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // --- Uses Auth Context ---

function SignUp() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth(); // --- Gets signup function ---
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!signup) {
      setError('Auth service is not available. Please refresh.');
      console.error('Signup function is missing from AuthContext');
      return;
    }

    try {
      setLoading(true);
      await signup(email, password, firstName); 
      
      console.log('Sign up successful, navigating to dashboard...');
      navigate('/'); // Navigate to the dashboard
    } catch (err) {
      console.error('Sign up failed in component:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
      <div className="max-w-md w-full p-8 bg-bg-primary shadow-md rounded-lg">
        <h2 className="text-3xl font-semibold text-center text-text-primary mb-8">
          Create Account
        </h2>
        
        <form onSubmit={handleSubmit}>
          {/* First Name Input */}
          <div className="mb-4">
            <label htmlFor="firstName" className="block text-sm font-medium text-text-primary mb-2">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-action-primary"
            />
          </div>

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
            </label> {/* --- THIS WAS THE FIX (was </small>) --- */}
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
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </div>
          
          <p className="text-sm text-center text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-action-primary hover:underline">
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignUp;