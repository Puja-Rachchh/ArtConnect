import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useRole } from '../context/RoleContext';
import AuctionTimer from './AuctionTimer';
import apiService from '../services/apiService';
import './Chat.css';

const AuctionChat = ({ paintingId, auctionInfo, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [auctionDetails, setAuctionDetails] = useState(auctionInfo);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState('');
  
  const { socket, joinConversation, leaveConversation } = useSocket();
  const { user } = useRole();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (paintingId) {
      loadAuctionChat();
      loadAuctionDetails();
      
      // Join auction room
      if (socket) {
        socket.emit('join_room', `auction_${paintingId}`);
        
        // Set up socket listeners
        socket.on('new_bid', handleNewBid);
        socket.on('auction_message', handleNewMessage);
        socket.on('user_joined', handleUserJoined);
        socket.on('auction_ended', handleAuctionEnded);
      }

      return () => {
        if (socket) {
          socket.emit('leave_room', `auction_${paintingId}`);
          socket.off('new_bid', handleNewBid);
          socket.off('auction_message', handleNewMessage);
          socket.off('user_joined', handleUserJoined);
          socket.off('auction_ended', handleAuctionEnded);
        }
      };
    }
  }, [paintingId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadAuctionChat = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get(`/auction/paintings/${paintingId}/auction/chat`);
      if (response.success) {
        setMessages(response.messages);
        setParticipants(response.participants);
      }
    } catch (error) {
      console.error('Error loading auction chat:', error);
      setError('Failed to load chat');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuctionDetails = async () => {
    try {
      const response = await apiService.get(`/auction/paintings/${paintingId}/auction`);
      if (response.success) {
        setAuctionDetails(response.auction);
      }
    } catch (error) {
      console.error('Error loading auction details:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewBid = (bidData) => {
    // Update auction details with new bid
    setAuctionDetails(prev => ({
      ...prev,
      currentBid: bidData.currentBid,
      participantCount: bidData.participantCount
    }));

    // Add bid message to chat
    const bidMessage = {
      senderId: { _id: 'system', username: 'System' },
      senderName: 'System',
      content: `${bidData.bidder} placed a bid of $${bidData.amount}`,
      messageType: 'bid_placed',
      bidAmount: bidData.amount,
      timestamp: bidData.timestamp
    };
    
    setMessages(prev => [...prev, bidMessage]);
  };

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleUserJoined = (data) => {
    const joinMessage = {
      senderId: { _id: 'system', username: 'System' },
      senderName: 'System',
      content: data.message,
      messageType: 'system',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, joinMessage]);
  };

  const handleAuctionEnded = (data) => {
    const endMessage = {
      senderId: { _id: 'system', username: 'System' },
      senderName: 'System',
      content: data.winner 
        ? `Auction ended! Winner: ${data.winner} with final bid $${data.finalBid}`
        : 'Auction ended with no bids.',
      messageType: 'auction_ended',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, endMessage]);
    
    // Update auction details
    setAuctionDetails(prev => ({
      ...prev,
      isActive: false,
      winner: data.winner
    }));
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await apiService.post(`/auction/paintings/${paintingId}/auction/chat`, {
        content: newMessage
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const placeBid = async () => {
    if (!bidAmount || isNaN(parseFloat(bidAmount))) {
      setError('Please enter a valid bid amount');
      return;
    }

    const amount = parseFloat(bidAmount);
    const minBid = (auctionDetails.currentBid || auctionDetails.startingPrice) + (auctionDetails.bidIncrement || 1);

    if (amount < minBid) {
      setError(`Minimum bid is $${minBid}`);
      return;
    }

    try {
      setError('');
      const response = await apiService.post(`/auction/paintings/${paintingId}/auction/bid`, {
        amount
      });
      
      if (response.success) {
        setBidAmount('');
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      setError(error.message || 'Failed to place bid');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
    const isSystemMessage = message.messageType === 'system' || message.messageType === 'bid_placed' || message.messageType === 'auction_ended';
    
    return (
      <div key={message._id || Math.random()} className={`message ${isOwnMessage ? 'own' : 'other'} ${isSystemMessage ? 'system' : ''}`}>
        <div className="message-header">
          <span className="sender-name">{message.senderName}</span>
          <span className="message-time">{formatTime(message.timestamp)}</span>
        </div>
        
        <div className="message-content">
          {message.messageType === 'bid_placed' ? (
            <div className="bid-message">
              <span className="bid-icon">💰</span>
              <span className="bid-content">{message.content}</span>
            </div>
          ) : message.messageType === 'auction_ended' ? (
            <div className="auction-end-message">
              <span className="end-icon">🏁</span>
              <span className="end-content">{message.content}</span>
            </div>
          ) : message.messageType === 'system' ? (
            <div className="system-message">
              <span className="system-icon">ℹ️</span>
              <span className="system-content">{message.content}</span>
            </div>
          ) : (
            <p>{message.content}</p>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="chat-loading">Loading auction chat...</div>;
  }

  const minBid = (auctionDetails?.currentBid || auctionDetails?.startingPrice || 0) + (auctionDetails?.bidIncrement || 1);

  return (
    <div className="chat-container auction-chat">
      <div className="chat-header">
        <div className="auction-header-info">
          <h3>Auction Chat</h3>
          <div className="auction-status">
            <div className="current-bid">
              Current Bid: ${auctionDetails?.currentBid || auctionDetails?.startingPrice || 0}
            </div>
            <div className="participants">
              {auctionDetails?.participantCount || 0} participants
            </div>
          </div>
        </div>
        
        {auctionDetails?.endTime && (
          <AuctionTimer endTime={auctionDetails.endTime} />
        )}
        
        <button onClick={onClose} className="close-chat-btn">×</button>
      </div>

      <div className="auction-details">
        <div className="bid-history">
          <h4>Latest Bids</h4>
          <div className="bid-list">
            {auctionDetails?.bids?.slice(-5).reverse().map((bid, index) => (
              <div key={index} className="bid-item">
                <span className="bidder">{bid.bidderName}</span>
                <span className="amount">${bid.amount}</span>
                <span className="time">{formatTime(bid.timestamp)}</span>
              </div>
            )) || <div className="no-bids">No bids yet</div>}
          </div>
        </div>
      </div>

      <div className="messages-container">
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      <div className="chat-input-area">
        {user.role === 'buyer' && auctionDetails?.isActive && (
          <div className="bid-section">
            <div className="bid-input-container">
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Min bid: $${minBid}`}
                step="0.01"
                min={minBid}
              />
              <button onClick={placeBid} className="bid-btn">
                Place Bid
              </button>
            </div>
          </div>
        )}

        <div className="message-input-container">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows="2"
          />
          <button onClick={sendMessage} disabled={!newMessage.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuctionChat;