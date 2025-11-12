import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useRole } from '../context/RoleContext.jsx';
import ApiService from '../services/api';
import './header.css';

export default function Header() {
  const { role, user, isAuthenticated, logout } = useRole();
  const location = useLocation();
  const navigate = useNavigate();
  const hideOnLanding = location.pathname === '/';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [showNotif, setShowNotif] = useState(false);

  return (
    <header className={`site-header ${hideOnLanding ? 'landing-transparent' : ''}`}>
      <div className="inner">
        <Link to="/" className="brand">🎨 ArtConnect</Link>
        <nav className="nav-links">
          {isAuthenticated && user?.role === 'artist' && (
            <Link to="/artist/dashboard">Dashboard</Link>
          )}
          {/* Hide Chats link for artist users per requirement; show for other authenticated users */}
          {isAuthenticated && user?.role !== 'artist' && (
            <Link to="/chats">Chats</Link>
          )}
          {isAuthenticated && user?.role === 'buyer' && (
            <Link to="/my-collection">My Collection</Link>
          )}
          {isAuthenticated && user?.role === 'artist' && (
            <Link to="/my-paintings">My Paintings</Link>
          )}
          {!isAuthenticated ? (
            <>
              <Link to="/signup">Sign Up</Link>
              <Link to="/login">Login</Link>
            </>
          ) : (
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          )}
        </nav>
        <div className="right">
          {/* Notification system removed */}

          {isAuthenticated && user && (
            <span className="pill user-pill">
              {user.name} ({user.role})
            </span>
          )}
          {role && !isAuthenticated && <span className="pill role-pill">{role}</span>}
        </div>
      </div>
    </header>
  );
}
