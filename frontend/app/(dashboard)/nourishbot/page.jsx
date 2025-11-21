'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, Send, Trash2, User, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

// Generate UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function NourishBotPage() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [currentModel, setCurrentModel] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize session
  useEffect(() => {
    const storedSessionId = localStorage.getItem('nourishbot_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
      loadSessionMessages(storedSessionId);
    } else {
      const newSessionId = generateUUID();
      localStorage.setItem('nourishbot_session_id', newSessionId);
      setSessionId(newSessionId);
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: '👋 Hi! I\'m NourishBot, your AI food management assistant. I can help you with recipes, nutrition advice, meal planning, and reducing food waste. How can I help you today?',
        timestamp: new Date().toISOString(),
      }]);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessionMessages = async (sid) => {
    // Add welcome message for existing sessions
    setMessages([{
      role: 'assistant',
      content: '👋 Welcome back! How can I assist you today?',
      timestamp: new Date().toISOString(),
    }]);
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || isTyping) return;

    const userMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setError(null);
    setIsTyping(true);

    try {
      const response = await api.sendChatMessage({
        sessionId: sessionId,
        message: userMessage.content,
      });

      const botMessage = {
        role: 'assistant',
        content: response.reply || response.message || 'I apologize, but I couldn\'t generate a response.',
        timestamp: new Date().toISOString(),
      };

      // Update current model if provided
      if (response.model) {
        setCurrentModel(response.model);
      }

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message. Please try again.');

      // Add error message to chat
      const errorMessage = {
        role: 'assistant',
        content: '❌ I\'m sorry, I encountered an error processing your message. Please try again or start a new chat session.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = async () => {
    if (confirm('Are you sure you want to start a new chat session? This will clear all messages.')) {
      try {
        // Try to delete the old session on the server
        if (sessionId) {
          await api.deleteChatSession(sessionId).catch(() => {
            // Ignore errors if session doesn't exist on server
          });
        }
      } catch (err) {
        console.error('Error deleting session:', err);
      }

      // Create new session
      const newSessionId = generateUUID();
      localStorage.setItem('nourishbot_session_id', newSessionId);
      setSessionId(newSessionId);
      setMessages([{
        role: 'assistant',
        content: '👋 New chat session started! How can I help you today?',
        timestamp: new Date().toISOString(),
      }]);
      setError(null);
      setInputMessage('');
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[900px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-lime-500 to-emerald-500 rounded-t-lg p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Bot className="h-7 w-7 text-lime-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                NourishBot
                <Sparkles className="h-4 w-4" />
              </h1>
              <p className="text-xs text-white/80">Your AI Food Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentModel && (
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-white/10 rounded-md text-xs text-white/70" title="Current AI Model">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                <span className="font-mono">{currentModel.split('/')[1] || currentModel}</span>
              </div>
            )}
            <button
              onClick={clearChat}
              className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm"
              title="Start new chat"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-card border-x border-border p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`flex gap-2 max-w-[85%] sm:max-w-[75%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                : 'bg-gradient-to-br from-lime-500 to-emerald-500'
                }`}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-2xl px-4 py-3 ${message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-sm'
                  : 'bg-muted border border-border text-foreground rounded-tl-sm'
                  }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground mt-1 px-1">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex gap-2 max-w-[75%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-lime-500 to-emerald-500 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-muted border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-sm text-red-500 max-w-md">
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="bg-card border border-t-0 rounded-b-lg p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything about food, recipes, nutrition..."
            disabled={isTyping}
            className="flex-1 px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="px-6 py-3 bg-gradient-to-r from-lime-500 to-emerald-500 text-white rounded-lg hover:from-lime-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-lime-500/20 flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          NourishBot uses AI to provide helpful suggestions. Always verify important information.
        </p>
      </form>
    </div>
  );
}
