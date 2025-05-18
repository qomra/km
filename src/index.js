import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/main.css';

// Disable WebSocket connection that causes refresh issues
if (typeof window !== 'undefined') {
  // Disable webpack hot module replacement
  window.__webpack_hot_middleware_reporter__ = {
    useCustomOverlay: function() {
      return true;
    }
  };
  
  // Disable React Fast Refresh WebSocket
  window.__REACT_REFRESH_SOCKET__ = null;
  
  // Disable WebSocketClient if it exists
  if (window.WebSocket) {
    const originalWebSocket = window.WebSocket;
    window.WebSocket = function(url, ...args) {
      // Block WebSocket connections to the development server
      if (url && url.includes('localhost:3000/ws')) {
        // WebSocket connection blocked - logging removed for performance
        return {
          addEventListener: () => {},
          removeEventListener: () => {},
          close: () => {},
          send: () => {}
        };
      }
      return new originalWebSocket(url, ...args);
    };
  }
  
  // We don't use global window.handleWordClick anymore
  // We use data attributes and direct event handlers instead
}

// Disable StrictMode to prevent double rendering
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);