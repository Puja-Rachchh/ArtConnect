import React, { useState, useEffect } from 'react';
import { useRole } from '../context/RoleContext';
import ApiService from '../services/api';
import './pages.css';

const MyPaintings = () => {
  const [paintings, setPaintings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPainting, setEditingPainting] = useState(null);
  const { user } = useRole();

  useEffect(() => {
    fetchMyPaintings();
  }, []);

  const fetchMyPaintings = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await ApiService.getPaintings();
      // Filter paintings to only show the current user's paintings
      const myPaintings = response.paintings.filter(painting => 
        painting.artist?._id === user?.id || painting.artist === user?.id
      );
      setPaintings(myPaintings);
    } catch (err) {
      console.error('Error fetching my paintings:', err);
      setError(err.message || 'Failed to load paintings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (painting) => {
    setEditingPainting(painting);
    setShowEditModal(true);
  };

  const handleDelete = async (paintingId) => {
    if (!window.confirm('Are you sure you want to delete this painting?')) {
      return;
    }

    try {
      await ApiService.deletePainting(paintingId);
      setPaintings(prev => prev.filter(p => p._id !== paintingId));
      alert('Painting deleted successfully!');
    } catch (error) {
      console.error('Error deleting painting:', error);
      alert('Failed to delete painting. Please try again.');
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingPainting(null);
  };

  const handleUpdateSuccess = () => {
    closeEditModal();
    fetchMyPaintings(); // Refresh the list
  };

  if (isLoading) {
    return (
      <div className="page">
        <div className="loading">Loading your paintings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-box">{error}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Paintings</h1>
        <p>Manage all your uploaded artwork</p>
      </div>

      {paintings.length === 0 ? (
        <div className="no-paintings" style={{
          textAlign: 'center',
          padding: '3rem',
          color: 'var(--text-secondary)'
        }}>
          <h3>No paintings uploaded yet</h3>
          <p>Start by uploading your first artwork to share with buyers!</p>
        </div>
      ) : (
        <div className="my-paintings-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '2rem',
          marginTop: '2rem'
        }}>
          {paintings.map((painting) => (
            <div key={painting._id} className="my-painting-card" style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <img
                  src={`http://localhost:3000${painting.imageUrl || painting.image}`}
                  alt={painting.title}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: 'var(--text-primary)',
                  fontSize: '1.2rem'
                }}>
                  {painting.title}
                </h3>
                <p style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem'
                }}>
                  {painting.description}
                </p>
                <div style={{ 
                  fontWeight: '600', 
                  color: 'var(--success)',
                  fontSize: '1.1rem',
                  marginBottom: '0.5rem'
                }}>
                  ₹{painting.price}
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  flexWrap: 'wrap',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: painting.saleType === 'auction' ? 'var(--accent-light)' : 'var(--success-light)',
                    color: painting.saleType === 'auction' ? 'var(--accent)' : 'var(--success)',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}>
                    {painting.saleType === 'auction' ? 'Auction' : 'Direct Sale'}
                  </span>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: painting.status === 'available' ? 'var(--success-light)' : 'var(--error-light)',
                    color: painting.status === 'available' ? 'var(--success)' : 'var(--error)',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}>
                    {painting.status}
                  </span>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '0.75rem',
                justifyContent: 'space-between'
              }}>
                <button
                  onClick={() => handleEdit(painting)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(painting._id)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: 'var(--error)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingPainting && (
        <EditPaintingModal
          painting={editingPainting}
          onClose={closeEditModal}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

// Edit Painting Modal Component
const EditPaintingModal = ({ painting, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: painting.title || '',
    description: painting.description || '',
    price: painting.price || '',
    materials: painting.materials || '',
    width: painting.width || '',
    height: painting.height || '',
    tags: Array.isArray(painting.tags) ? painting.tags.join(', ') : (painting.tags || ''),
    saleType: painting.saleType || 'direct_sale'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        ...formData,
        price: parseFloat(formData.price),
        width: formData.width ? parseFloat(formData.width) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await ApiService.updatePainting(painting._id, updateData);
      alert('Painting updated successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error updating painting:', error);
      alert('Failed to update painting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        maxWidth: '600px',
        width: '90%',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ margin: 0, color: '#1f2937', fontSize: '1.5rem' }}>
            Edit Painting
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="1"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Sale Type
                </label>
                <select
                  name="saleType"
                  value={formData.saleType}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                >
                  <option value="direct_sale">Direct Sale</option>
                  <option value="auction">Auction</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Width (cm)
                </label>
                <input
                  type="number"
                  name="width"
                  value={formData.width}
                  onChange={handleInputChange}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Height (cm)
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Materials
              </label>
              <input
                type="text"
                name="materials"
                value={formData.materials}
                onChange={handleInputChange}
                placeholder="e.g., Oil on canvas, Acrylic"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Tags (comma separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g., abstract, modern, colorful"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: isSubmitting ? '#9ca3af' : '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600'
              }}
            >
              {isSubmitting ? 'Updating...' : 'Update Painting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MyPaintings;