import React, { useState } from 'react';
import ApiService from '../services/api';
import '../pages/pages.css';

const UploadPainting = ({ onUploadSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    width: '',
    height: '',
    materials: '',
    tags: ''
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setImage(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!image) {
      setError('Please select an image for your painting');
      return;
    }

    // Validate required fields
    if (!formData.title || !formData.description || !formData.price) {
      setError('Please fill in all required fields');
      return;
    }

    if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('width', formData.width);
      data.append('height', formData.height);
      data.append('materials', formData.materials);
      data.append('tags', formData.tags);
      data.append('image', image);

      await ApiService.uploadPainting(data);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        price: '',
        width: '',
        height: '',
        materials: '',
        tags: ''
      });
      setImage(null);
      setPreview(null);
      
      onUploadSuccess && onUploadSuccess();
    } catch (err) {
      setError(err.message || 'Failed to upload painting');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-form">
        <h2>Upload New Painting</h2>
        
        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter painting title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your painting..."
              rows="4"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price (₹) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="materials">Materials Used</label>
              <input
                type="text"
                id="materials"
                name="materials"
                value={formData.materials}
                onChange={handleInputChange}
                placeholder="Oil on canvas, Acrylic, etc."
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="width">Width (cm)</label>
              <input
                type="number"
                id="width"
                name="width"
                value={formData.width}
                onChange={handleInputChange}
                placeholder="Width"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="height">Height (cm)</label>
              <input
                type="number"
                id="height"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                placeholder="Height"
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="landscape, portrait, abstract (comma separated)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Painting Image *</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              required
            />
            {preview && (
              <div className="image-preview">
                <img src={preview} alt="Preview" />
              </div>
            )}
          </div>

          <div className="button-group">
            <button
              type="button"
              onClick={onCancel}
              className="cancel-btn"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Uploading...' : 'Upload Painting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadPainting;