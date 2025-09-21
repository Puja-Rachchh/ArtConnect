import { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext();

export function RoleProvider({ children }) {
  const [role, setRole] = useState(() => {
    return localStorage.getItem('selectedRole') || '';
  });

  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    try {
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('authToken');
    return !!token;
  });

  useEffect(() => {
    if (role) {
      localStorage.setItem('selectedRole', role);
    }
  }, [role]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  const login = (token, userData) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedRole');
    setUser(null);
    setRole('');
    setIsAuthenticated(false);
  };

  const value = { 
    role, 
    setRole, 
    user, 
    setUser, 
    isAuthenticated, 
    setIsAuthenticated,
    login,
    logout
  };
  
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
