// /src/views/SignUp.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

// Simple styling to start. We'll make this pretty later.
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '400px',
    margin: '50px auto',
    padding: '2rem',
    backgroundColor: 'var(--color-bg-surface)',
    borderRadius: '8px',
    border: '1px solid var(--color-border-primary)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  input: {
    padding: '0.75rem',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-primary)',
    border: '1px solid var(--color-border-primary)',
    borderRadius: '4px',
  },
  button: {
    padding: '0.75rem',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-primary)',
    color: 'var(--color-text-on-action)',
    backgroundColor: 'var(--color-action-primary)',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'var(--font-medium)',
  },
  buttonDisabled: {
    backgroundColor: 'var(--color-bg-muted)',
    cursor: 'not-allowed',
  },
  error: {
    color: 'var(--color-signal-danger)',
    fontSize: 'var(--text-sm)',
    textAlign: 'center',
  },
  link: {
    marginTop: '1rem',
    textAlign: 'center',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-action-primary)',
  },
  title: {
    textAlign: 'center',
    color: 'var(--color-text-primary)',
    margin: '0 0 1.5rem 0',
  }
};

function SignUp() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth(); // Our hook in action
  const navigate = useNavigate(); // For redirecting

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // --- Validation ---
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (firstName.trim() === '') {
        return setError('First name is required');
    }

    try {
      setError('');
      setLoading(true);
      
      // Call the signup function from our AuthContext
      await signup(email, password, firstName);
      
      // On success, our <App /> component's router logic
      // will see we have a currentUser and automatically
      // navigate us to the dashboard.
      // We can also force it here if we want:
      // navigate('/'); 
      
    } catch (err) {
      // Handle Firebase errors
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters');
      } else {
        setError('Failed to create an account. Please try again.');
        console.error(err); // Log the full error for us
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Create Your Account</h2>
      {error && <p style={styles.error}>{error}</p>}
      
      <form style={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="First Name"
          style={styles.input}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          style={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          style={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          style={styles.input}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button 
          type="submit" 
          style={{...styles.button, ...(loading ? styles.buttonDisabled : {})}}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
      
      <div style={styles.link}>
        Already have an account? <Link to="/login">Log In</Link>
      </div>
    </div>
  );
}

export default SignUp;