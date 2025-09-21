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
        <h1 style={{background:'linear-gradient(90deg,#ffffff,#9aa8ff)', WebkitBackgroundClip:'text', color:'transparent'}}>
          A marketplace for living art
        </h1>
        <p className="tagline" style={{marginTop:'1rem'}}>
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
                  padding:'1.25rem 1.1rem 1.35rem',
                  position:'relative',
                  border: active? '1px solid var(--accent)':'1px solid var(--border)',
                  boxShadow: active ? 'var(--accent-glow)' : '0 2px 12px -4px rgba(0,0,0,0.6)',
                  transform: active? 'translateY(-4px)':'translateY(0)',
                  transition:'all .35s'
                }}
              >
                <span style={{fontSize:'1.9rem', lineHeight:1}}>{card.icon}</span>
                <h3 style={{margin:'0.75rem 0 0.35rem', fontSize:'1.15rem'}}>{card.title}</h3>
                <p style={{margin:0, fontSize:'.8rem', lineHeight:1.3, opacity:.85}}>{card.tagline}</p>
                {active && <span className="pill" style={{position:'absolute', top:'.6rem', right:'.6rem'}}>Selected</span>}
              </button>
            );
          })}
        </div>
        <div style={{marginTop:'2.5rem', display:'flex', gap:'1rem', flexWrap:'wrap'}}>
          <button style={{flex:'1 1 200px'}} onClick={()=>go('/signup')}>Create an account</button>
          <button style={{flex:'1 1 200px'}} className="secondary" onClick={()=>go('/login')}>I already have an account</button>
        </div>
        {!role && intendedPath && (
          <p style={{color:'#ffb3b3', fontSize:'.8rem', marginTop:'.85rem'}}>Please choose a role above to continue.</p>
        )}
      </section>
    </div>
  );
}
