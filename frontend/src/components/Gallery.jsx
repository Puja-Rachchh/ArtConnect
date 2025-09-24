import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import AuctionChat from './AuctionChat';
import AuctionTimer from './AuctionTimer';
import { useRole } from '../context/RoleContext';
import apiService from '../services/apiService';
import '../pages/pages.css';

const Gallery = ({ userRole, onUploadClick, refreshTrigger }) => {
  const [paintings, setPaintings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [isAuctionChat, setIsAuctionChat] = useState(false);
  const { user } = useRole();

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

  const handleChatWithArtist = async (painting) => {
    // This function is now removed as per user request
  };

  const closeChatWindow = () => {
    setSelectedChat(null);
    setSelectedAuction(null);
    setIsAuctionChat(false);
  };

  const handleStartAuction = (painting) => {
    setSelectedAuction(painting);
    setShowAuctionModal(true);
  };

  const handleJoinAuction = async (painting) => {
    try {
      const response = await apiService.post(`/auction/paintings/${painting._id}/auction/join`);
      if (response.success) {
        // Open auction chat
        setSelectedChat(painting);
        setIsAuctionChat(true);
      }
    } catch (error) {
      console.error('Error joining auction:', error);
      setError(error.message || 'Failed to join auction');
    }
  };

  const handleBuyNow = async (painting) => {
    if (window.confirm(`Buy "${painting.title}" for $${painting.price}?`)) {
      try {
        // Here you would implement the direct purchase logic
        alert('Purchase functionality to be implemented');
      } catch (error) {
        console.error('Error purchasing painting:', error);
        setError('Failed to purchase painting');
      }
    }
  };

  const renderPaintingActions = (painting) => {
    const isOwner = userRole === 'artist' && painting.artist?._id === user?.id;
    const isAuction = painting.saleType === 'auction';
    const isActiveAuction = painting.auction?.isActive;

    if (isOwner) {
      return (
        <div className="painting-actions">
          {!isActiveAuction && painting.status === 'available' && (
            <button 
              onClick={() => handleStartAuction(painting)}
              className="auction-btn"
            >
              Start Auction
            </button>
          )}
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
      if (isAuction && isActiveAuction) {
        return (
          <div className="painting-actions">
            <div className="auction-info">
              <div className="current-bid">
                Current Bid: ${painting.auction.currentBid || painting.auction.startingPrice}
              </div>
              <div className="participant-count">
                {painting.auction.participantCount || 0} participants
              </div>
            </div>
            <button 
              onClick={() => handleJoinAuction(painting)}
              className="join-auction-btn"
            >
              Take Part in Auction
            </button>
          </div>
        );
      } else if (painting.status === 'available' && painting.saleType === 'direct_sale') {
        return (
          <div className="painting-actions">
            <button 
              onClick={() => handleBuyNow(painting)}
              className="buy-btn"
            >
              Buy Now - ${painting.price}
            </button>
          </div>
        );
      } else if (painting.status === 'sold') {
        return (
          <div className="painting-actions">
            <div className="sold-status">SOLD</div>
          </div>
        );
      } else if (isAuction && !isActiveAuction) {
        return (
          <div className="painting-actions">
            <div className="auction-ended">Auction Ended</div>
            {painting.auction.winner && (
              <div className="winner-info">
                Won for ${painting.auction.currentBid}
              </div>
            )}
          </div>
        );
      }
    }

    return null;
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
                      <div className="price-section">
                        {painting.saleType === 'auction' && painting.auction?.isActive ? (
                          <div className="auction-price">
                            <div className="starting-price">Starting: ${painting.auction.startingPrice}</div>
                            {painting.auction.currentBid > 0 && (
                              <div className="current-bid">Current: ${painting.auction.currentBid}</div>
                            )}
                          </div>
                        ) : (
                          <div className="direct-price">${painting.price}</div>
                        )}
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
                      
                      {painting.saleType === 'auction' && painting.auction?.endTime && (
                        <div className="auction-timer">
                          <AuctionTimer endTime={painting.auction.endTime} />
                        </div>
                      )}
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

      {/* Chat Window */}
      {selectedChat && (
        <div className="chat-overlay">
          {isAuctionChat ? (
            <AuctionChat
              paintingId={selectedChat._id}
              auctionInfo={selectedChat.auction}
              onClose={closeChatWindow}
            />
          ) : null}
        </div>
      )}

      {/* Auction Modal */}
      {showAuctionModal && selectedAuction && (
        <AuctionModal
          painting={selectedAuction}
          onClose={() => {
            setShowAuctionModal(false);
            setSelectedAuction(null);
          }}
          onAuctionStarted={() => {
            fetchPaintings(); // Refresh paintings list
            setShowAuctionModal(false);
            setSelectedAuction(null);
          }}
        />
      )}
    </div>
  );
};

// Auction Modal Component
const AuctionModal = ({ painting, onClose, onAuctionStarted }) => {
  const [auctionData, setAuctionData] = useState({
    duration: 24, // hours
    startingPrice: painting.price,
    bidIncrement: 10
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartAuction = async () => {
    try {
      setIsLoading(true);
      setError('');

      console.log('Starting auction for painting:', painting._id);
      console.log('Auction data:', auctionData);
      console.log('Auth token available:', !!localStorage.getItem('authToken'));

      const response = await apiService.post(`/auction/paintings/${painting._id}/auction/start`, auctionData);
      
      console.log('Auction start response:', response);
      
      if (response.success) {
        onAuctionStarted();
      }
    } catch (error) {
      console.error('Error starting auction:', error);
      setError(error.message || 'Failed to start auction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content auction-modal">
        <div className="modal-header">
          <h2>Start Auction</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          <div className="painting-preview">
            <img src={`http://localhost:3000${painting.imageUrl}`} alt={painting.title} />
            <div>
              <h3>{painting.title}</h3>
              <p>Current Price: ${painting.price}</p>
            </div>
          </div>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <div className="auction-form">
            <div className="form-group">
              <label>Duration (hours)</label>
              <select
                value={auctionData.duration}
                onChange={(e) => setAuctionData(prev => ({...prev, duration: parseInt(e.target.value)}))}
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
                <option value={48}>48 hours</option>
                <option value={72}>72 hours</option>
              </select>
            </div>

            <div className="form-group">
              <label>Starting Price ($)</label>
              <input
                type="number"
                min="1"
                value={auctionData.startingPrice}
                onChange={(e) => setAuctionData(prev => ({...prev, startingPrice: parseFloat(e.target.value)}))}
              />
            </div>

            <div className="form-group">
              <label>Minimum Bid Increment ($)</label>
              <input
                type="number"
                min="1"
                value={auctionData.bidIncrement}
                onChange={(e) => setAuctionData(prev => ({...prev, bidIncrement: parseFloat(e.target.value)}))}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button 
            onClick={handleStartAuction} 
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Starting...' : 'Start Auction'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Gallery;