import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext.jsx';
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

  return (
    <header className={`site-header ${hideOnLanding ? 'landing-transparent' : ''}`}>
      <div className="inner">
        <Link to="/" className="brand">🎨 ArtConnect</Link>
        <nav className="nav-links">
          <Link to="/">Home</Link>
          {isAuthenticated && (
            <Link to="/chats">Chats</Link>
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
