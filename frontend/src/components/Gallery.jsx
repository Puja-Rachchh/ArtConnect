import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import ShippingModal from './ShippingModal';
import { useRole } from '../context/RoleContext';
import apiService from '../services/apiService';
import '../pages/pages.css';

const Gallery = ({ userRole, onUploadClick, refreshTrigger }) => {
  const [paintings, setPaintings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // Auction feature removed — kept bidding/offers flow for direct sales
  const [selectedPainting, setSelectedPainting] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [paintingToBuy, setPaintingToBuy] = useState(null);
  const { user } = useRole();

  useEffect(() => {
    fetchPaintings();
  }, [refreshTrigger]); // Add refreshTrigger as dependency

  const fetchPaintings = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log('Fetching paintings...');
      const response = await ApiService.getPaintings();
      console.log('API response received:', response);
      console.log(' Paintings array:', response.paintings);
      setPaintings(response.paintings || []);
    } catch (err) {
      console.error('Error fetching paintings:', err);
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

  const handleChatWithArtist = async (painting) => {
    // Live chat removed per requirement — kept as placeholder
  };

  // Bid UI state
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');

  // place a bid (buyers)
  const handlePlaceBid = async (painting, amount) => {
    try {
      setBidError('');
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        setBidError('Enter a valid bid amount');
        return;
      }

      const resp = await ApiService.placeBid(painting._id, Number(amount));
      if (resp.success) {
        alert('Bid placed successfully');
        // refresh paintings so currentBid updates
        fetchPaintings();
        // clear local bid input
        setBidAmount('');
      }
    } catch (err) {
      console.error('Error placing bid:', err);
      setBidError(err.message || 'Failed to place bid');
    }
  };

  const handleViewPainting = (painting) => {
    setSelectedPainting(painting);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedPainting(null);
    setShowDetailModal(false);
  };

  // Start auction removed

  // (old auction chat/join removed)

  const handleBuyNow = async (painting) => {
    // Open shipping modal instead of immediate purchase
    setPaintingToBuy(painting);
    setShowShippingModal(true);
  };

  const handleShippingSubmit = async (shippingData) => {
    try {
      // Here you would typically send the purchase request with shipping data to your backend
      const purchaseData = {
        paintingId: paintingToBuy._id,
        shippingDetails: shippingData,
        totalAmount: paintingToBuy.price,
        paymentMethod: 'pending' // You can add payment method selection later
      };

      // Make API call to process purchase
      // const response = await apiService.post('/purchases', purchaseData);
      
      // For now, just simulate the purchase
      console.log('Purchase data:', purchaseData);
      
      // Show success message
      alert(`Purchase successful! Your "${paintingToBuy.title}" will be shipped to ${shippingData.address}, ${shippingData.city}.`);
      
      // Close modal and refresh paintings
      setShowShippingModal(false);
      setPaintingToBuy(null);
      fetchPaintings(); // Refresh the paintings list
      
    } catch (error) {
      console.error('Error processing purchase:', error);
      alert('Purchase failed. Please try again.');
    }
  };

  const closeShippingModal = () => {
    setShowShippingModal(false);
    setPaintingToBuy(null);
  };

  const renderPaintingActions = (painting) => {
    const isOwner = userRole === 'artist' && painting.artist?._id === user?.id;
  // Auction removed; use direct sale / offer flow

    // Always show view button first
    const viewButton = (
      <button 
        onClick={() => handleViewPainting(painting)}
        className="view-btn"
        style={{
          background: '#6366f1',
          color: '#ffffff',
          border: '1px solid #4f46e5',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius)',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: '500',
          marginRight: '0.5rem',
          transition: 'all 0.2s ease'
        }}
      >
        View Details
      </button>
    );

    if (isOwner) {
      return (
        <div className="painting-actions">
          {viewButton}
          <button 
            onClick={() => handleDeletePainting(painting._id)}
            className="delete-btn"
          >
            Delete
          </button>
        </div>
      );
    }

    if (userRole === 'buyer') {
      if (painting.status === 'available') {
        return (
          <div className="painting-actions">
            {viewButton}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number"
                min={painting.price}
                step="1"
                placeholder={`Minimum ₹${painting.price}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '140px' }}
              />
              <button
                onClick={() => handlePlaceBid(painting, bidAmount)}
                className="bid-btn"
                style={{ padding: '0.65rem 1rem', border: 'none', backgroundColor: 'var(--accent)', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
              >
                Bid Now
              </button>
            </div>
          </div>
        );
      } else if (painting.status === 'sold') {
        return (
          <div className="painting-actions">
            {viewButton}
            <div className="sold-status">SOLD</div>
          </div>
        );
      }
    }

    // For users who are not logged in or other cases
    return (
      <div className="painting-actions">
        {viewButton}
      </div>
    );
  };

  if (isLoading) {
    console.log(' Still loading...');
    return (
      <div className="gallery-container">
        <div className="loading">Loading paintings...</div>
      </div>
    );
  }

  console.log(' Render state - isLoading:', isLoading, 'paintings.length:', paintings.length, 'error:', error);

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
                      <div className="price-section">
                        <div className="direct-price">₹{painting.price}</div>
                      </div>
                      
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
                      
                      {/* Auction timer removed — only direct sale UI shown */}
                    </div>

                    {renderPaintingActions(painting)}
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

      {/* Chat Window removed per requirement (live auction chat disabled) */}

      {/* Auction functionality removed */}

      {/* Painting Detail Modal */}
      {showDetailModal && selectedPainting && (
        <PaintingDetailModal
          painting={selectedPainting}
          userRole={userRole}
          onClose={closeDetailModal}
          onBuyNow={handleBuyNow}
        />
      )}

      {/* Shipping Modal */}
      <ShippingModal
        isOpen={showShippingModal}
        onClose={closeShippingModal}
        painting={paintingToBuy}
        onSubmit={handleShippingSubmit}
      />
    </div>
  );
};

// Auction functionality removed — auction modal and start-auction flows are no longer supported.

// Painting Detail Modal Component
const PaintingDetailModal = ({ painting, userRole, onClose, onBuyNow }) => {
  // Auction removed — keep direct sale / bid-offer flow
  const canBuy = userRole === 'buyer' && painting.status === 'available';

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="modal-content painting-detail-modal" style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius)',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: 'var(--shadow-xl)'
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-light)'
        }}>
          <h2 style={{margin: 0, color: 'var(--text-primary)'}}>Painting Details</h2>
          <button onClick={onClose} className="modal-close" style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: '0.5rem'
          }}>×</button>
        </div>

        <div className="modal-body" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          padding: '2rem'
        }}>
          {/* Image Section */}
          <div className="painting-image-large" style={{
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <img 
              src={`http://localhost:3000${painting.imageUrl || painting.image}`} 
              alt={painting.title}
              style={{
                width: '100%',
                height: 'auto',
                minHeight: '300px',
                objectFit: 'cover',
                display: 'block'
              }}
              onError={(e) => {
                e.target.src = '/placeholder-image.jpg';
              }}
            />
          </div>

          {/* Details Section */}
          <div className="painting-details-full">
            <h1 style={{
              fontSize: '2rem',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)'
            }}>{painting.title}</h1>
            
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              marginBottom: '1rem'
            }}>by {painting.artist?.name || painting.artistName || 'Unknown Artist'}</p>

            {/* Price Section (direct sale only) */}
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius)',
              marginBottom: '1.5rem'
            }}>
              <div>
                <div style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem'}}>
                  Price
                </div>
                <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)'}}>
                  ₹{painting.price}
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{marginBottom: '1.5rem'}}>
              <h3 style={{marginBottom: '0.5rem', color: 'var(--text-primary)'}}>Description</h3>
              <p style={{
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                fontSize: '1rem'
              }}>{painting.description}</p>
            </div>

            {/* Additional Details */}
            <div style={{marginBottom: '2rem'}}>
              <h3 style={{marginBottom: '1rem', color: 'var(--text-primary)'}}>Details</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                {(painting.width || painting.size?.width) && (painting.height || painting.size?.height) && (
                  <div>
                    <strong>Dimensions:</strong><br/>
                    {painting.width || painting.size?.width} × {painting.height || painting.size?.height} cm
                  </div>
                )}
                {painting.materials && (
                  <div>
                    <strong>Materials:</strong><br/>
                    {painting.materials}
                  </div>
                )}
                <div>
                  <strong>Sale Type:</strong><br/>
                  Direct Sale
                </div>
                <div>
                  <strong>Status:</strong><br/>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    backgroundColor: painting.status === 'available' ? 'var(--accent-light)' : 'var(--bg-secondary)',
                    color: painting.status === 'available' ? 'var(--accent)' : 'var(--text-muted)'
                  }}>
                    {painting.status || 'available'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {painting.tags && (
              <div style={{marginBottom: '2rem'}}>
                <h3 style={{marginBottom: '0.5rem', color: 'var(--text-primary)'}}>Tags</h3>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                  {Array.isArray(painting.tags) 
                    ? painting.tags.map((tag, index) => (
                        <span key={index} style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: 'var(--accent-light)',
                          color: 'var(--accent)',
                          borderRadius: '999px',
                          fontSize: '0.85rem'
                        }}>{tag}</span>
                      ))
                    : typeof painting.tags === 'string' && painting.tags.trim() && 
                      painting.tags.split(',').map((tag, index) => (
                        <span key={index} style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: 'var(--accent-light)',
                          color: 'var(--accent)',
                          borderRadius: '999px',
                          fontSize: '0.85rem'
                        }}>{tag.trim()}</span>
                      ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-footer" style={{
          padding: '1.5rem',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem'
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              border: '1px solid var(--border-medium)',
              backgroundColor: '#ffffff',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontSize: '0.95rem'
            }}
          >
            Close
          </button>
          
          {/* Auction bidding removed; buyers can place offers via Bid Now below when painting is available */}
          
          {canBuy && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number"
                min={painting.price}
                step="1"
                placeholder={`Minimum ₹${painting.price}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '160px' }}
              />
              <button
                onClick={() => { handlePlaceBid(painting, bidAmount); onClose(); }}
                style={{ padding: '0.75rem 1.25rem', border: 'none', backgroundColor: 'var(--success)', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600' }}
              >
                Bid Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gallery;