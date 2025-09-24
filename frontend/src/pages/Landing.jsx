import { useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext.jsx';
import './pages.css';
import { useState } from 'react';

const ROLE_CARDS = [
  {
    id: 'artist',
    title: 'Artist',
    tagline: 'Upload your masterpieces, set reserve prices, and engage with collectors globally.',
    icon: '🖌️'
  },
  {
    id: 'buyer',
    title: 'Buyer',
    tagline: 'Discover emerging art, bid in live auctions, and build a unique collection.',
    icon: '🛍️'
  }
];

export default function Landing() {
  const navigate = useNavigate();
  const { role, setRole } = useRole();
  const [intendedPath, setIntendedPath] = useState(null);

  function go(path){
    if(!role){
      setIntendedPath(path); // store where user wanted to go
      return; // show inline helper
    }
    navigate(path);
  }

  // Auto-continue once role picked after user clicked a CTA
  if(role && intendedPath){
    navigate(intendedPath);
  }

  return (
    <div className="page landing fade-in" style={{paddingTop:'2rem'}}>
      <header className="hero" style={{marginTop:'2rem'}}>
        <h1 style={{
          background:'linear-gradient(135deg, var(--accent), var(--accent-hover))', 
          WebkitBackgroundClip:'text', 
          WebkitTextFillColor:'transparent',
          backgroundClip:'text',
          fontSize:'clamp(2.5rem, 6vw, 4rem)',
          fontWeight:'700',
          lineHeight:'1.2'
        }}>
          ArtConnect : Connect to artists globally
        </h1>
        <p className="tagline" style={{
          marginTop:'1.5rem',
          color:'var(--text-secondary)',
          fontSize:'1.25rem',
          fontWeight:'400',
          lineHeight:'1.7'
        }}>
          Empowering creators and connecting passionate collectors through transparent, real-time auctions.
        </p>
      </header>
      <section style={{marginTop:'3rem'}}>
        <div style={{display:'grid', gap:'1.5rem', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))'}}>
          {ROLE_CARDS.map(card => {
            const active = role === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setRole(card.id)}
                className="glass-card role-card"
                style={{
                  textAlign:'left',
                  padding:'1.5rem',
                  position:'relative',
                  border: active? `2px solid var(--accent)`:`1px solid var(--border-medium)`,
                  backgroundColor: active ? 'var(--accent-light)' : '#ffffff',
                  boxShadow: active ? 'var(--shadow-lg)' : 'var(--shadow-md)',
                  transform: active? 'translateY(-4px)':'translateY(0)',
                  transition:'all 0.3s ease',
                  cursor:'pointer'
                }}
              >
                <span style={{fontSize:'2rem', lineHeight:1, display:'block'}}>{card.icon}</span>
                <h3 style={{
                  margin:'1rem 0 0.5rem', 
                  fontSize:'1.25rem',
                  fontWeight:'600',
                  color:'var(--text-primary)'
                }}>{card.title}</h3>
                <p style={{
                  margin:0, 
                  fontSize:'0.95rem', 
                  lineHeight:1.5, 
                  color:'var(--text-secondary)'
                }}>{card.tagline}</p>
                {active && <span className="pill" style={{position:'absolute', top:'1rem', right:'1rem'}}>Selected</span>}
              </button>
            );
          })}
        </div>
        <div style={{marginTop:'2.5rem', display:'flex', gap:'1rem', flexWrap:'wrap'}}>
          <button style={{flex:'1 1 200px'}} onClick={()=>go('/signup')}>Create an account</button>
          <button style={{flex:'1 1 200px'}} className="secondary" onClick={()=>go('/login')}>I already have an account</button>
        </div>
        {!role && intendedPath && (
          <div className="status-error" style={{textAlign:'center', marginTop:'1rem'}}>
            Please choose a role above to continue.
          </div>
        )}
      </section>
    </div>
  );
}
