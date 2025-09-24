import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useRole } from '../context/RoleContext';
import apiService from '../services/apiService';
import './Chat.css';

const Chat = ({ conversationId, paintingInfo, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showAuctionForm, setShowAuctionForm] = useState(false);
  const [auctionOffer, setAuctionOffer] = useState({
    offerPrice: '',
    offerDescription: ''
  });
  
  const { socket, joinConversation, leaveConversation, sendMessage, startTyping, stopTyping } = useSocket();
  const { user } = useRole();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      joinConversation(conversationId);

      // Set up socket listeners
      if (socket) {
        socket.on('new_message', handleNewMessage);
        socket.on('user_typing', handleTyping);
        socket.on('auction_update', handleAuctionUpdate);
      }

      return () => {
        leaveConversation(conversationId);
        if (socket) {
          socket.off('new_message', handleNewMessage);
          socket.off('user_typing', handleTyping);
          socket.off('auction_update', handleAuctionUpdate);
        }
      };
    }
  }, [conversationId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get(`/chat/conversations/${conversationId}/messages`);
      if (response.success) {
        setMessages(response.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleTyping = ({ userId, typing }) => {
    if (userId !== user.id) {
      setTypingUsers(prev => {
        if (typing) {
          return [...prev.filter(id => id !== userId), userId];
        } else {
          return prev.filter(id => id !== userId);
        }
      });
    }
  };

  const handleAuctionUpdate = ({ messageId, status }) => {
    setMessages(prev =>
      prev.map(msg =>
        msg._id === messageId
          ? { ...msg, auctionDetails: { ...msg.auctionDetails, status } }
          : msg
      )
    );
  };

  const sendTextMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await apiService.post(`/chat/conversations/${conversationId}/messages`, {
        content: newMessage,
        messageType: 'text'
      });

      if (response.success) {
        setNewMessage('');
        stopTyping(conversationId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendAuctionOffer = async () => {
    if (!auctionOffer.offerPrice || !auctionOffer.offerDescription) return;

    try {
      const response = await apiService.post(`/chat/conversations/${conversationId}/messages`, {
        content: `Auction offer: $${auctionOffer.offerPrice}`,
        messageType: 'auction_offer',
        auctionDetails: {
          offerPrice: parseFloat(auctionOffer.offerPrice),
          offerDescription: auctionOffer.offerDescription,
          status: 'pending'
        }
      });

      if (response.success) {
        setAuctionOffer({ offerPrice: '', offerDescription: '' });
        setShowAuctionForm(false);
      }
    } catch (error) {
      console.error('Error sending auction offer:', error);
    }
  };

  const handleAuctionResponse = async (messageId, status) => {
    try {
      await apiService.patch(`/chat/messages/${messageId}/auction`, { status });
    } catch (error) {
      console.error('Error updating auction status:', error);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Handle typing indicators
    startTyping(conversationId);
    
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId);
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessage = (message) => {
    const isOwnMessage = message.senderId._id === user.id;
    
    return (
      <div key={message._id} className={`message ${isOwnMessage ? 'own' : 'other'}`}>
        <div className="message-header">
          <span className="sender-name">{message.senderId.username}</span>
          <span className="message-time">{formatTime(message.createdAt)}</span>
        </div>
        
        <div className="message-content">
          {message.messageType === 'auction_offer' ? (
            <div className="auction-offer">
              <div className="auction-price">
                Offer: ${message.auctionDetails.offerPrice}
              </div>
              <div className="auction-description">
                {message.auctionDetails.offerDescription}
              </div>
              <div className={`auction-status ${message.auctionDetails.status}`}>
                Status: {message.auctionDetails.status}
              </div>
              
              {!isOwnMessage && message.auctionDetails.status === 'pending' && user.role === 'artist' && (
                <div className="auction-actions">
                  <button 
                    onClick={() => handleAuctionResponse(message._id, 'accepted')}
                    className="accept-btn"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleAuctionResponse(message._id, 'declined')}
                    className="decline-btn"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p>{message.content}</p>
          )}
        </div>
        
        {message.isRead && isOwnMessage && (
          <div className="read-indicator">✓✓</div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div className="chat-loading">Loading chat...</div>;
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-painting-info">
          <img src={`http://localhost:3000${paintingInfo.imageUrl}`} alt={paintingInfo.title} />
          <div>
            <h4>{paintingInfo.title}</h4>
            <p>${paintingInfo.price}</p>
          </div>
        </div>
        <button onClick={onClose} className="close-chat-btn">×</button>
      </div>

      <div className="messages-container">
        {messages.map(renderMessage)}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <span>Someone is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        {user.role === 'buyer' && (
          <div className="auction-controls">
            <button 
              onClick={() => setShowAuctionForm(!showAuctionForm)}
              className="auction-btn"
            >
              Make Offer
            </button>
          </div>
        )}

        {showAuctionForm && (
          <div className="auction-form">
            <input
              type="number"
              placeholder="Offer price"
              value={auctionOffer.offerPrice}
              onChange={(e) => setAuctionOffer(prev => ({...prev, offerPrice: e.target.value}))}
            />
            <textarea
              placeholder="Describe your offer..."
              value={auctionOffer.offerDescription}
              onChange={(e) => setAuctionOffer(prev => ({...prev, offerDescription: e.target.value}))}
            />
            <div className="auction-form-actions">
              <button onClick={sendAuctionOffer} className="send-offer-btn">Send Offer</button>
              <button onClick={() => setShowAuctionForm(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        )}

        <div className="message-input-container">
          <textarea
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows="2"
          />
          <button onClick={sendTextMessage} disabled={!newMessage.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;