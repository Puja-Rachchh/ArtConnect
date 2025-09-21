import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRole } from '../context/RoleContext.jsx';
import ApiService from '../services/api.js';
import './pages.css';

export default function Signup() {
  const navigate = useNavigate();
  const { role } = useRole();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [status, setStatus] = useState({ loading: false, message: '', error: '' });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, message: '', error: '' });

    try {
      const userData = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: role
      };

      const response = await ApiService.signup(userData);
      
      // Save auth data
      ApiService.saveAuthData(response.token, response.user);
      
      setStatus({ 
        loading: false, 
        message: 'Account created successfully! Redirecting to login...', 
        error: '' 
      });
      
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      setStatus({ 
        loading: false, 
        message: '', 
        error: error.message || 'Failed to create account. Please try again.' 
      });
    }
  }

  return (
    <div className="page auth fade-in">
      <div className="glass-card elevate" style={{padding:'2rem 2.2rem', borderRadius:'var(--radius)'}}>
        <h1 style={{marginTop:0, fontSize:'1.65rem'}}>Create your account</h1>
        <p className="muted" style={{marginTop:'.25rem'}}>Role: <strong>{role || 'Select on Home page'}</strong></p>
        <form onSubmit={handleSubmit} className="auth-form" style={{marginTop:'1.25rem'}}>
          <label>Name<input required name="name" value={form.name} onChange={handleChange} placeholder="Your display name" /></label>
          <label>Email<input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" /></label>
          <label>Password<input required type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" /></label>
          {status.message && <p style={{fontSize:'.75rem', color:'#9ecbff', margin:0}}>{status.message}</p>}
          {status.error && (
            <div style={{fontSize:'.75rem', color:'#ffb3b3', margin:0, padding:'.75rem', background:'rgba(255,179,179,0.1)', borderRadius:'8px', border:'1px solid rgba(255,179,179,0.3)'}}>
              {status.error}
            </div>
          )}
          {!role && <p style={{fontSize:'.7rem', color:'#ffb3b3', margin:0}}>Pick a role first on the Home page.</p>}
          <button type="submit" disabled={!role || status.loading}>{status.loading? 'Creating…':'Sign Up'}</button>
          <p className="switch">Already have an account? <Link to="/login">Log In</Link></p>
        </form>
      </div>
    </div>
  );
}
