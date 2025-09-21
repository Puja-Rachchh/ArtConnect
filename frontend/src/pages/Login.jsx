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
          <label>Password<input required type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" /></label>
          
          {/* Role suggestion when mismatch detected */}
          {roleSuggestion && (
            <div style={{fontSize:'.75rem', color:'#ffd93d', margin:0, padding:'.75rem', background:'rgba(255,217,61,0.1)', borderRadius:'8px', border:'1px solid rgba(255,217,61,0.3)'}}>
              💡 This email is registered as <strong>{roleSuggestion}</strong>. 
              <button 
                type="button" 
                onClick={() => setRole(roleSuggestion)}
                style={{marginLeft:'.5rem', padding:'.25rem .5rem', fontSize:'.7rem', background:'rgba(255,217,61,0.2)', border:'1px solid rgba(255,217,61,0.4)', borderRadius:'4px', color:'#ffd93d', cursor:'pointer'}}
              >
                Switch to {roleSuggestion}
              </button>
            </div>
          )}
          
          {status.message && <p style={{fontSize:'.75rem', color:'#9ecbff', margin:0}}>{status.message}</p>}
          {status.error && (
            <div style={{fontSize:'.75rem', color:'#ffb3b3', margin:0, padding:'.75rem', background:'rgba(255,179,179,0.1)', borderRadius:'8px', border:'1px solid rgba(255,179,179,0.3)'}}>
              {status.error}
              {status.error.includes('No') && status.error.includes('account found') && (
                <div style={{marginTop:'.5rem'}}>
                  <Link to="/signup" style={{color:'#9ecbff', textDecoration:'underline'}}>
                    Create a {role} account here
                  </Link>
                </div>
              )}
            </div>
          )}
          {!role && <p style={{fontSize:'.7rem', color:'#ffb3b3', margin:0}}>Pick a role first on the Home page.</p>}
          <button type="submit" disabled={!role || status.loading}>{status.loading? 'Verifying…':'Log In'}</button>
          <p className="switch">No account yet? <Link to="/signup">Create one</Link></p>
        </form>
      </div>
    </div>
  );
}
