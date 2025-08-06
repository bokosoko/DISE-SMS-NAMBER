import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth.jsx';
import toast from 'react-hot-toast';

export const useSocket = () => {
  const { token, authenticated } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    if (!authenticated || !token) {
      // Disconnect if not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      setConnectionError(null);
      toast.success('Connected to real-time updates');
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
      toast.error('Failed to connect to real-time updates');
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionError(null);
      toast.success('Reconnected to real-time updates');
    });

    socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
      setConnectionError(error.message);
    });

    socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      setConnectionError('Failed to reconnect');
      toast.error('Failed to reconnect to real-time updates');
    });

    // Application-specific event handlers
    socket.on('connected', (data) => {
      console.log('Socket authentication successful:', data);
    });

    socket.on('message_notification', (data) => {
      console.log('New message notification:', data);
      
      // Show toast notification
      const message = data.message;
      const isOTP = message.message_type === 'otp';
      
      toast.success(
        `New ${isOTP ? 'OTP' : 'SMS'} received on ${message.phone_number}`,
        {
          duration: 5000,
          icon: isOTP ? '🔐' : '📱',
        }
      );

      // Trigger custom event for components to listen
      window.dispatchEvent(new CustomEvent('newMessage', { detail: data }));
    });

    socket.on('number_status_notification', (data) => {
      console.log('Number status notification:', data);
      
      const phoneNumber = data.phone_number;
      const status = phoneNumber.status;
      
      if (status === 'expired') {
        toast.error(`Phone number ${phoneNumber.phone_number} has expired`);
      } else if (status === 'assigned') {
        toast.success(`Phone number ${phoneNumber.phone_number} assigned successfully`);
      }

      // Trigger custom event for components to listen
      window.dispatchEvent(new CustomEvent('numberStatusChange', { detail: data }));
    });

    socket.on('system_notification', (data) => {
      console.log('System notification:', data);
      
      const { message, message_type } = data;
      
      switch (message_type) {
        case 'info':
          toast(message, { icon: 'ℹ️' });
          break;
        case 'warning':
          toast(message, { icon: '⚠️' });
          break;
        case 'error':
          toast.error(message);
          break;
        case 'success':
          toast.success(message);
          break;
        default:
          toast(message);
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'Socket error occurred');
    });

    socket.on('pong', (data) => {
      console.log('Pong received:', data);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [authenticated, token]);

  // Socket utility functions
  const joinPhoneRoom = (phoneNumberId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_phone_room', { phone_number_id: phoneNumberId });
    }
  };

  const leavePhoneRoom = (phoneNumberId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_phone_room', { phone_number_id: phoneNumberId });
    }
  };

  const ping = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('ping');
    }
  };

  const getSocket = () => socketRef.current;

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    joinPhoneRoom,
    leavePhoneRoom,
    ping,
    getSocket
  };
};

