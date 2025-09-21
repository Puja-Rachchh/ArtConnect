import React from 'react';
import { useRole } from '../context/RoleContext';
import Header from '../components/Header';
import Gallery from '../components/Gallery';
import './pages.css';

const BuyerMarketplace = () => {
  const { user } = useRole();

  return (
    <div className="dashboard-container">
      <Header />
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome to the Art Marketplace, {user?.name}!</h1>
          <p>Discover and collect beautiful artworks from talented artists</p>
        </div>
        
        <Gallery userRole="buyer" />
      </div>
    </div>
  );
};

export default BuyerMarketplace;