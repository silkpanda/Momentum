// /src/views/Login.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

// We can (and should) pull these styles into a shared CSS file later.
// For now, just re-using them is fine.
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

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth(); // <-- Using the login function now
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      
      // Call the login function from our AuthContext
      await login(email, password);
      
      // On success, our <App /> component's logic will
      // see we have a currentUser and navigate us
      // to the dashboard automatically.
      
    } catch (err) {
      // Handle Firebase errors
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else {
        setError('Failed to log in. Please try again.');
        console.error(err); // Log the full error for us
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Welcome Back</h2>
      {error && <p style={styles.error}>{error}</p>}
      
      <form style={styles.form} onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          style={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          types="password"
          placeholder="Password"
          style={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button 
          type="submit" 
          style={{...styles.button, ...(loading ? styles.buttonDisabled : {})}}
          disabled={loading}
        >
          {loading ? 'Logging In...' : 'Log In'}
        </button>
      </form>
      
      <div style={styles.link}>
        Need an account? <Link to="/signup">Sign Up</Link>
      </div>
    </div>
  );
}

export default Login;