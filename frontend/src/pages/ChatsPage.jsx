import React, { useState, useEffect } from 'react';
import { useRole } from '../context/RoleContext';
import { useSocket } from '../context/SocketContext';
import Chat from '../components/Chat';
import apiService from '../services/apiService';
import './pages.css';

const ChatsPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useRole();
  const { socket } = useSocket();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('new_message', handleNewMessage);
      return () => {
        socket.off('new_message', handleNewMessage);
      };
    }
  }, [socket]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get('/chat/conversations');
      if (response.success) {
        setConversations(response.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    // Update conversation list with new message
    setConversations(prev =>
      prev.map(conv =>
        conv._id === message.conversationId
          ? { ...conv, lastMessage: message, lastMessageAt: new Date() }
          : conv
      )
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getOtherUser = (conversation) => {
    return user.role === 'artist' ? conversation.buyerId : conversation.artistId;
  };

  const getUnreadCount = (conversation) => {
    return user.role === 'artist' 
      ? conversation.unreadCount?.artist || 0
      : conversation.unreadCount?.buyer || 0;
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="loading">Loading conversations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="chats-container">
          <div className="chats-sidebar">
            <div className="chats-header">
              <h2>Conversations</h2>
              {conversations.length > 0 && (
                <span className="conversation-count">
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}

            {conversations.length === 0 ? (
              <div className="no-conversations">
                <h3>No conversations yet</h3>
                <p>
                  {user.role === 'buyer' 
                    ? 'Start a conversation by clicking "Chat with Artist" on any painting you\'re interested in.'
                    : 'Conversations will appear here when buyers reach out about your paintings.'
                  }
                </p>
              </div>
            ) : (
              <div className="conversations-list">
                {conversations.map((conversation) => {
                  const otherUser = getOtherUser(conversation);
                  const unreadCount = getUnreadCount(conversation);
                  
                  return (
                    <div
                      key={conversation._id}
                      className={`conversation-item ${selectedConversation?._id === conversation._id ? 'active' : ''}`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="conversation-painting">
                        <img 
                          src={`http://localhost:3000${conversation.paintingId.imageUrl}`}
                          alt={conversation.paintingId.title}
                        />
                      </div>
                      
                      <div className="conversation-info">
                        <div className="conversation-title">
                          <h4>{conversation.paintingId.title}</h4>
                          <span className="conversation-time">
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                        
                        <div className="conversation-participants">
                          <span className="other-user">
                            {user.role === 'artist' ? 'Buyer' : 'Artist'}: {otherUser.username}
                          </span>
                          <span className="painting-price">
                            ₹{conversation.paintingId.price}
                          </span>
                        </div>
                        
                        {conversation.lastMessage && (
                          <div className="last-message">
                            {conversation.lastMessage.content}
                          </div>
                        )}
                      </div>
                      
                      {unreadCount > 0 && (
                        <div className="unread-badge">
                          {unreadCount}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="chat-main">
            {selectedConversation ? (
              <Chat
                conversationId={selectedConversation._id}
                paintingInfo={selectedConversation.paintingId}
                onClose={() => setSelectedConversation(null)}
              />
            ) : (
              <div className="no-chat-selected">
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the sidebar to start chatting.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatsPage;