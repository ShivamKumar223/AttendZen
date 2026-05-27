/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const SOCKET_URL = isLocalhost ? 'http://localhost:5000' : 'https://attendzen.onrender.com';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user && token) {
      // Connect to Socket.IO server
      const newSocket = io(SOCKET_URL); 

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        // Join personal room for personal notifications
        newSocket.emit('join-personal-room', user._id);
      });

      setTimeout(() => {
        setSocket(newSocket);
      }, 0);

      return () => {
        newSocket.disconnect();
      };
    } else if (socket) {
      socket.disconnect();
      setTimeout(() => {
        setSocket(null);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
