import React, { useState, useEffect } from 'react';
import { useRole } from '../context/RoleContext';
import Header from '../components/Header';
import Gallery from '../components/Gallery';
import UploadPainting from '../components/UploadPainting';
import './pages.css';

const ArtistDashboard = () => {
  const { user, isAuthenticated } = useRole();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Give some time for the context to load user data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleUploadClick = () => {
    setShowUploadForm(true);
  };

  const handleUploadSuccess = () => {
    setShowUploadForm(false);
    // Trigger gallery refresh by incrementing the trigger
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUploadCancel = () => {
    setShowUploadForm(false);
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <Header />
        <div className="dashboard-content">
          <div className="loading">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="dashboard-container">
        <Header />
        <div className="dashboard-content">
          <div className="error-box">
            <h3>Authentication Error</h3>
            <p>Please log in to access the artist dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Header />
      <div className="dashboard-content">
        {showUploadForm ? (
          <UploadPainting 
            onUploadSuccess={handleUploadSuccess}
            onCancel={handleUploadCancel}
          />
        ) : (
          <>
            <div className="welcome-section">
              <h1>Welcome back, {user?.name}!</h1>
              <p>Manage your art collection and showcase your creativity</p>
            </div>
            
            <Gallery 
              userRole="artist" 
              onUploadClick={handleUploadClick}
              refreshTrigger={refreshTrigger}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ArtistDashboard;