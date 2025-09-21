import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import '../pages/pages.css';

const Gallery = ({ userRole, onUploadClick, refreshTrigger }) => {
  const [paintings, setPaintings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPaintings();
  }, [refreshTrigger]); // Add refreshTrigger as dependency

  const fetchPaintings = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log('🎨 Gallery: Fetching paintings...');
      const response = await ApiService.getPaintings();
      console.log('🎨 Gallery: API response received:', response);
      console.log('🎨 Gallery: Paintings array:', response.paintings);
      setPaintings(response.paintings || []);
    } catch (err) {
      console.error('🎨 Gallery: Error fetching paintings:', err);
      setError(err.message || 'Failed to load paintings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePainting = async (paintingId) => {
    if (!window.confirm('Are you sure you want to delete this painting?')) {
      return;
    }

    try {
      await ApiService.deletePainting(paintingId);
      setPaintings(prev => prev.filter(p => p._id !== paintingId));
    } catch (err) {
      setError(err.message || 'Failed to delete painting');
    }
  };

  if (isLoading) {
    console.log('🎨 Gallery: Still loading...');
    return (
      <div className="gallery-container">
        <div className="loading">Loading paintings...</div>
      </div>
    );
  }

  console.log('🎨 Gallery: Render state - isLoading:', isLoading, 'paintings.length:', paintings.length, 'error:', error);

  return (
    <div className="gallery-container">
      <div className="gallery-header">
        <h1>Art Gallery</h1>
        {userRole === 'artist' && (
          <button onClick={onUploadClick} className="upload-btn">
            + Upload New Painting
          </button>
        )}
      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {paintings.length === 0 ? (
        <div className="no-paintings">
          <h3>No paintings available</h3>
          <p>
            {userRole === 'artist' 
              ? 'Upload your first painting to get started!' 
              : 'Check back later for new artwork.'
            }
          </p>
        </div>
      ) : (
        <div className="paintings-grid">
          {paintings.map((painting) => {
            try {
              return (
                <div key={painting._id} className="painting-card">
                  <div className="painting-image">
                    <img 
                      src={`http://localhost:3000${painting.imageUrl || painting.image}`} 
                      alt={painting.title}
                      onError={(e) => {
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                  </div>
                  
                  <div className="painting-info">
                    <h3>{painting.title}</h3>
                    <p className="artist">by {painting.artist?.name || painting.artistName || 'Unknown Artist'}</p>
                    <p className="description">{painting.description}</p>
                    
                    <div className="painting-details">
                      <div className="price">₹{painting.price}</div>
                      {(painting.width || painting.size?.width) && (painting.height || painting.size?.height) && (
                        <div className="size">
                          {painting.width || painting.size?.width} × {painting.height || painting.size?.height} cm
                        </div>
                      )}
                      {painting.materials && (
                        <div className="materials">{painting.materials}</div>
                      )}
                      {painting.tags && (
                        <div className="tags">
                          {Array.isArray(painting.tags) 
                            ? painting.tags.map((tag, index) => (
                                <span key={index} className="tag">{tag}</span>
                              ))
                            : typeof painting.tags === 'string' && painting.tags.trim() && 
                              painting.tags.split(',').map((tag, index) => (
                                <span key={index} className="tag">{tag.trim()}</span>
                              ))
                          }
                        </div>
                      )}
                    </div>

                    {userRole === 'artist' && painting.artist?._id && localStorage.getItem('userId') && 
                     painting.artist._id === localStorage.getItem('userId') && (
                      <div className="painting-actions">
                        <button 
                          onClick={() => handleDeletePainting(painting._id)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </div>
                    )}

                    {userRole === 'buyer' && (
                      <div className="painting-actions">
                        <button className="interest-btn">
                          Show Interest
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            } catch (error) {
              console.error('Error rendering painting:', painting, error);
              return (
                <div key={painting._id || Math.random()} className="painting-card error">
                  <div className="painting-info">
                    <h3>Error Loading Painting</h3>
                    <p>There was an issue displaying this artwork.</p>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
};

export default Gallery;