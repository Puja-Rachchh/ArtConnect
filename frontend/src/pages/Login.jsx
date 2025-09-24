import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext.jsx';
import ApiService from '../services/api.js';
import './pages.css';

export default function Login() {
  const navigate = useNavigate();
  const { role, setRole, login } = useRole();
  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState({ loading: false, message: '', error: '' });
  const [roleSuggestion, setRoleSuggestion] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear role suggestion when email changes
    if (e.target.name === 'email') {
      setRoleSuggestion(null);
    }
  }

  // Function to check what role the email is registered with
  async function checkEmailRole() {
    if (!form.email) return;
    
    try {
      const response = await ApiService.checkEmail(form.email);
      if (response.exists && response.role !== role) {
        setRoleSuggestion(response.role);
      } else {
        setRoleSuggestion(null);
      }
    } catch (error) {
      console.error('Error checking email:', error);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, message: '', error: '' });

    try {
      const credentials = {
        email: form.email,
        password: form.password,
        role: role // Include the selected role
      };
      
      const response = await ApiService.login(credentials);
      
      // Use the context login method
      login(response.token, response.user);
      
      setStatus({ 
        loading: false, 
        message: `Welcome back, ${response.user.name}! Redirecting to ${role} dashboard...`, 
        error: '' 
      });
      
      // Redirect based on the SELECTED role (not the database role)
      setTimeout(() => {
        if (role === 'artist') {
          navigate('/artist/dashboard');
        } else if (role === 'buyer') {
          navigate('/buyer/marketplace');
        } else {
          navigate('/'); // fallback
        }
      }, 1500);
    } catch (error) {
      // Stay on login page and show error - no redirect
      setStatus({ 
        loading: false, 
        message: '', 
        error: error.message || 'Login failed. Please check your credentials.' 
      });
    }
  }

  return (
    <div className="page auth fade-in">
      <div className="glass-card elevate" style={{padding:'2rem 2.2rem', borderRadius:'var(--radius)'}}>
        <h1 style={{marginTop:0, fontSize:'1.65rem'}}>Welcome back</h1>
        <p className="muted" style={{marginTop:'.25rem'}}>Role: <strong>{role || 'Select on Home page'}</strong></p>
        <form onSubmit={handleSubmit} className="auth-form" style={{marginTop:'1.25rem'}}>
          <label>
            Email
            <input 
              required 
              type="email" 
              name="email" 
              value={form.email} 
              onChange={handleChange} 
              onBlur={checkEmailRole}
              placeholder="you@example.com" 
            />
          </label>
          <label>
            Password
            <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
              <input 
                required 
                type={showPassword ? "text" : "password"} 
                name="password" 
                value={form.password} 
                onChange={handleChange} 
                placeholder="Enter your password"
                style={{width: '100%', paddingRight: '3.5rem'}}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: '#666',
                  fontWeight: '500',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#333'}
                onMouseLeave={(e) => e.target.style.color = '#666'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          
          {/* Role suggestion when mismatch detected */}
          {roleSuggestion && (
            <div className="status-warning">
              💡 This email is registered as <strong>{roleSuggestion}</strong>. 
              <button 
                type="button" 
                onClick={() => setRole(roleSuggestion)}
                style={{marginLeft:'0.5rem', padding:'0.25rem 0.5rem', fontSize:'0.8rem', background:'var(--warning)', border:'1px solid var(--warning)', borderRadius:'6px', color:'#ffffff', cursor:'pointer'}}
              >
                Switch to {roleSuggestion}
              </button>
            </div>
          )}
          
          {status.message && <div className="status-success">{status.message}</div>}
          {status.error && (
            <div className="status-error">
              {status.error}
              {status.error.includes('No') && status.error.includes('account found') && (
                <div style={{marginTop:'0.5rem'}}>
                  <Link to="/signup" style={{color:'var(--error)', fontWeight:'600'}}>
                    Create a {role} account here
                  </Link>
                </div>
              )}
            </div>
          )}
          {!role && <div className="status-error">Pick a role first on the Home page.</div>}
          <button type="submit" disabled={!role || status.loading}>{status.loading? 'Verifying…':'Log In'}</button>
          <p className="switch">No account yet? <Link to="/signup">Create one</Link></p>
        </form>
      </div>
    </div>
  );
}
