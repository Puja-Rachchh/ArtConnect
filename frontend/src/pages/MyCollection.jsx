import React, { useEffect, useState } from 'react';
import ApiService from '../services/api';
import './pages.css';

const MyCollection = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const resp = await ApiService.getMyOrders();
      setOrders(resp.orders || []);
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError(err.message || 'Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page"><div className="loading">Loading your collection...</div></div>;
  if (error) return <div className="page"><div className="error-box">{error}</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Collection</h1>
        <p>Paintings you purchased</p>
      </div>

      {orders.length === 0 ? (
        <div className="no-paintings" style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>No purchases yet</h3>
          <p>Your purchased paintings will appear here.</p>
        </div>
      ) : (
        <div className="paintings-grid">
          {orders.map(order => (
            <div key={order._id} className="painting-card">
              <div className="painting-image">
                <img src={`http://localhost:3000${order.painting.imageUrl || order.painting.image}`} alt={order.painting.title} />
              </div>
              <div className="painting-info">
                <h3>{order.painting.title}</h3>
                <p className="artist">by {order.artist?.name || order.painting.artistName || 'Artist'}</p>
                <div className="painting-details">
                  <div className="direct-price">₹{order.price}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCollection;
