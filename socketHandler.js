const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketHandler = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.userId).select('-password -refreshTokens');
      
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      // Add user to socket
      socket.user = user;
      next();

    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Handle connections
  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`User ${user.email} connected via socket: ${socket.id}`);

    // Join user-specific room
    socket.join(`user_${user._id}`);

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to DispoSMS real-time service',
      userId: user._id,
      timestamp: new Date().toISOString()
    });

    // Handle user status updates
    socket.on('user_status', (data) => {
      console.log(`User ${user.email} status update:`, data);
      
      // Broadcast to user's room (for multiple devices)
      socket.to(`user_${user._id}`).emit('user_status_update', {
        userId: user._id,
        status: data.status,
        timestamp: new Date().toISOString()
      });
    });

    // Handle message read status updates
    socket.on('mark_message_read', async (data) => {
      try {
        const { messageId } = data;
        
        // Emit confirmation back to client
        socket.emit('message_read_confirmed', {
          messageId,
          timestamp: new Date().toISOString()
        });

        // Broadcast to other devices
        socket.to(`user_${user._id}`).emit('message_read_update', {
          messageId,
          isRead: true,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error handling message read update:', error);
        socket.emit('error', {
          message: 'Failed to update message read status',
          code: 'MESSAGE_READ_ERROR'
        });
      }
    });

    // Handle typing indicators (for future chat features)
    socket.on('typing_start', (data) => {
      socket.to(`user_${user._id}`).emit('user_typing', {
        userId: user._id,
        phoneNumberId: data.phoneNumberId,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(`user_${user._id}`).emit('user_stopped_typing', {
        userId: user._id,
        phoneNumberId: data.phoneNumberId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle phone number assignment updates
    socket.on('number_assigned', (data) => {
      socket.to(`user_${user._id}`).emit('number_assignment_update', {
        type: 'assigned',
        phoneNumber: data.phoneNumber,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('number_released', (data) => {
      socket.to(`user_${user._id}`).emit('number_assignment_update', {
        type: 'released',
        phoneNumber: data.phoneNumber,
        timestamp: new Date().toISOString()
      });
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', {
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User ${user.email} disconnected: ${reason}`);
      
      // Leave user room
      socket.leave(`user_${user._id}`);

      // Broadcast disconnect to other devices
      socket.to(`user_${user._id}`).emit('user_disconnected', {
        userId: user._id,
        reason,
        timestamp: new Date().toISOString()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${user.email}:`, error);
    });

    // Handle custom events
    socket.on('custom_event', (data) => {
      console.log(`Custom event from user ${user.email}:`, data);
      
      // Echo back to sender
      socket.emit('custom_event_response', {
        received: data,
        timestamp: new Date().toISOString()
      });
    });
  });

  // Helper function to emit to specific user
  const emitToUser = (userId, event, data) => {
    io.to(`user_${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  };

  // Helper function to emit to all connected users
  const emitToAll = (event, data) => {
    io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  };

  // Helper function to get connected users count
  const getConnectedUsersCount = () => {
    return io.engine.clientsCount;
  };

  // Helper function to get user's socket count
  const getUserSocketCount = (userId) => {
    const room = io.sockets.adapter.rooms.get(`user_${userId}`);
    return room ? room.size : 0;
  };

  // Periodic cleanup of expired connections
  setInterval(() => {
    const connectedClients = io.engine.clientsCount;
    console.log(`Socket.IO Status: ${connectedClients} connected clients`);
  }, 60000); // Every minute

  // Export helper functions for use in other parts of the application
  return {
    emitToUser,
    emitToAll,
    getConnectedUsersCount,
    getUserSocketCount
  };
};

module.exports = socketHandler;

