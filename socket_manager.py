from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
from flask import request
from flask_jwt_extended import decode_token, get_jwt_identity
import logging
from datetime import datetime
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SocketManager:
    def __init__(self, app=None):
        self.socketio = None
        self.connected_users = {}  # user_id -> {socket_id, rooms}
        self.user_rooms = {}  # user_id -> [room_names]
        
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize SocketIO with Flask app"""
        self.socketio = SocketIO(
            app,
            cors_allowed_origins="*",
            async_mode='threading',  # Use threading for deployment compatibility
            logger=True,
            engineio_logger=True
        )
        
        # Register event handlers
        self.register_handlers()
        
        return self.socketio
    
    def register_handlers(self):
        """Register all socket event handlers"""
        
        @self.socketio.on('connect')
        def handle_connect(auth):
            """Handle client connection"""
            try:
                # Get token from auth data
                token = auth.get('token') if auth else None
                
                if not token:
                    logger.warning('Connection attempt without token')
                    disconnect()
                    return False
                
                # Decode JWT token to get user info
                try:
                    decoded_token = decode_token(token)
                    user_id = decoded_token['sub']
                except Exception as e:
                    logger.error(f'Invalid token: {str(e)}')
                    disconnect()
                    return False
                
                # Store user connection info
                socket_id = request.sid
                self.connected_users[user_id] = {
                    'socket_id': socket_id,
                    'connected_at': datetime.utcnow().isoformat(),
                    'rooms': []
                }
                
                # Join user to their personal room
                personal_room = f'user_{user_id}'
                join_room(personal_room)
                
                if user_id not in self.user_rooms:
                    self.user_rooms[user_id] = []
                self.user_rooms[user_id].append(personal_room)
                self.connected_users[user_id]['rooms'].append(personal_room)
                
                logger.info(f'User {user_id} connected with socket {socket_id}')
                
                # Send connection confirmation
                emit('connected', {
                    'status': 'connected',
                    'user_id': user_id,
                    'timestamp': datetime.utcnow().isoformat()
                })
                
                return True
                
            except Exception as e:
                logger.error(f'Connection error: {str(e)}')
                disconnect()
                return False
        
        @self.socketio.on('disconnect')
        def handle_disconnect():
            """Handle client disconnection"""
            try:
                socket_id = request.sid
                
                # Find and remove user from connected users
                user_id = None
                for uid, info in self.connected_users.items():
                    if info['socket_id'] == socket_id:
                        user_id = uid
                        break
                
                if user_id:
                    # Leave all rooms
                    if user_id in self.user_rooms:
                        for room in self.user_rooms[user_id]:
                            leave_room(room)
                        del self.user_rooms[user_id]
                    
                    # Remove from connected users
                    del self.connected_users[user_id]
                    
                    logger.info(f'User {user_id} disconnected')
                else:
                    logger.warning(f'Unknown socket {socket_id} disconnected')
                    
            except Exception as e:
                logger.error(f'Disconnect error: {str(e)}')
        
        @self.socketio.on('join_phone_room')
        def handle_join_phone_room(data):
            """Join room for specific phone number updates"""
            try:
                phone_number_id = data.get('phone_number_id')
                if not phone_number_id:
                    emit('error', {'message': 'Phone number ID required'})
                    return
                
                room_name = f'phone_{phone_number_id}'
                join_room(room_name)
                
                # Update user rooms
                user_id = self.get_user_id_from_socket(request.sid)
                if user_id:
                    if user_id not in self.user_rooms:
                        self.user_rooms[user_id] = []
                    if room_name not in self.user_rooms[user_id]:
                        self.user_rooms[user_id].append(room_name)
                        self.connected_users[user_id]['rooms'].append(room_name)
                
                emit('joined_room', {
                    'room': room_name,
                    'phone_number_id': phone_number_id
                })
                
                logger.info(f'User joined room {room_name}')
                
            except Exception as e:
                logger.error(f'Join room error: {str(e)}')
                emit('error', {'message': 'Failed to join room'})
        
        @self.socketio.on('leave_phone_room')
        def handle_leave_phone_room(data):
            """Leave room for specific phone number updates"""
            try:
                phone_number_id = data.get('phone_number_id')
                if not phone_number_id:
                    emit('error', {'message': 'Phone number ID required'})
                    return
                
                room_name = f'phone_{phone_number_id}'
                leave_room(room_name)
                
                # Update user rooms
                user_id = self.get_user_id_from_socket(request.sid)
                if user_id and user_id in self.user_rooms:
                    if room_name in self.user_rooms[user_id]:
                        self.user_rooms[user_id].remove(room_name)
                        self.connected_users[user_id]['rooms'].remove(room_name)
                
                emit('left_room', {
                    'room': room_name,
                    'phone_number_id': phone_number_id
                })
                
                logger.info(f'User left room {room_name}')
                
            except Exception as e:
                logger.error(f'Leave room error: {str(e)}')
                emit('error', {'message': 'Failed to leave room'})
        
        @self.socketio.on('ping')
        def handle_ping():
            """Handle ping for connection health check"""
            emit('pong', {'timestamp': datetime.utcnow().isoformat()})
    
    def get_user_id_from_socket(self, socket_id):
        """Get user ID from socket ID"""
        for user_id, info in self.connected_users.items():
            if info['socket_id'] == socket_id:
                return user_id
        return None
    
    def notify_new_message(self, message_data):
        """Notify users about new SMS message"""
        try:
            phone_number_id = message_data.get('phone_number_id')
            user_id = message_data.get('user_id')
            
            # Prepare notification data
            notification = {
                'type': 'new_message',
                'message': {
                    'id': message_data.get('id'),
                    'phone_number': message_data.get('phone_number'),
                    'sender_number': message_data.get('sender_number'),
                    'message_content': message_data.get('message_content'),
                    'message_type': message_data.get('message_type'),
                    'received_at': message_data.get('received_at'),
                    'is_read': message_data.get('is_read', False)
                },
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Send to user's personal room
            if user_id:
                personal_room = f'user_{user_id}'
                self.socketio.emit('message_notification', notification, room=personal_room)
                logger.info(f'Sent message notification to user {user_id}')
            
            # Send to phone number room
            if phone_number_id:
                phone_room = f'phone_{phone_number_id}'
                self.socketio.emit('message_notification', notification, room=phone_room)
                logger.info(f'Sent message notification to phone room {phone_number_id}')
            
        except Exception as e:
            logger.error(f'Error sending message notification: {str(e)}')
    
    def notify_number_status_change(self, phone_number_data):
        """Notify users about phone number status changes"""
        try:
            phone_number_id = phone_number_data.get('id')
            user_id = phone_number_data.get('user_id')
            
            notification = {
                'type': 'number_status_change',
                'phone_number': {
                    'id': phone_number_id,
                    'phone_number': phone_number_data.get('phone_number'),
                    'status': phone_number_data.get('status'),
                    'expires_at': phone_number_data.get('expires_at'),
                    'assigned_at': phone_number_data.get('assigned_at')
                },
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Send to user's personal room
            if user_id:
                personal_room = f'user_{user_id}'
                self.socketio.emit('number_status_notification', notification, room=personal_room)
                logger.info(f'Sent number status notification to user {user_id}')
            
            # Send to phone number room
            if phone_number_id:
                phone_room = f'phone_{phone_number_id}'
                self.socketio.emit('number_status_notification', notification, room=phone_room)
                logger.info(f'Sent number status notification to phone room {phone_number_id}')
            
        except Exception as e:
            logger.error(f'Error sending number status notification: {str(e)}')
    
    def broadcast_system_message(self, message, message_type='info'):
        """Broadcast system message to all connected users"""
        try:
            notification = {
                'type': 'system_message',
                'message': message,
                'message_type': message_type,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            self.socketio.emit('system_notification', notification, broadcast=True)
            logger.info(f'Broadcasted system message: {message}')
            
        except Exception as e:
            logger.error(f'Error broadcasting system message: {str(e)}')
    
    def get_connected_users_count(self):
        """Get count of connected users"""
        return len(self.connected_users)
    
    def get_user_connection_info(self, user_id):
        """Get connection info for specific user"""
        return self.connected_users.get(user_id)
    
    def is_user_connected(self, user_id):
        """Check if user is connected"""
        return user_id in self.connected_users

# Global socket manager instance
socket_manager = SocketManager()

