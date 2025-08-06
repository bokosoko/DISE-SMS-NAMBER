from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from src.models.user import User, db
from src.models.message import Message
from src.models.phone_number import PhoneNumber

messages_bp = Blueprint('messages', __name__)

@messages_bp.route('/messages', methods=['GET'])
@jwt_required()
def get_messages():
    """Get SMS messages for user's assigned phone numbers"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        phone_number_id = request.args.get('phone_number_id', type=int)
        message_type = request.args.get('message_type')
        is_read = request.args.get('is_read')
        since = request.args.get('since')
        limit = min(int(request.args.get('limit', 50)), 100)  # Max 100
        offset = int(request.args.get('offset', 0))
        
        # Parse is_read parameter
        if is_read is not None:
            is_read = is_read.lower() in ('true', '1', 'yes')
        
        # Parse since parameter
        since_datetime = None
        if since:
            try:
                since_datetime = datetime.fromisoformat(since.replace('Z', '+00:00'))
            except ValueError:
                return jsonify({
                    'error': 'Validation Error',
                    'message': 'Invalid date format for since parameter',
                    'code': 'INVALID_DATE_FORMAT'
                }), 400
        
        # Validate phone_number_id belongs to user if specified
        if phone_number_id:
            phone_number = PhoneNumber.query.filter_by(
                id=phone_number_id,
                user_id=current_user_id
            ).first()
            if not phone_number:
                return jsonify({
                    'error': 'Forbidden',
                    'message': 'Access denied to this phone number',
                    'code': 'ACCESS_DENIED'
                }), 403
        
        # Get messages using the model method
        messages = Message.get_messages_for_user(
            user_id=current_user_id,
            phone_number_id=phone_number_id,
            message_type=message_type,
            is_read=is_read,
            since=since_datetime,
            limit=limit,
            offset=offset
        )
        
        # Get total count for pagination
        total_query = Message.query.join(PhoneNumber).filter(PhoneNumber.user_id == current_user_id)
        
        if phone_number_id:
            total_query = total_query.filter(Message.phone_number_id == phone_number_id)
        if message_type:
            total_query = total_query.filter(Message.message_type == message_type)
        if is_read is not None:
            total_query = total_query.filter(Message.is_read == is_read)
        if since_datetime:
            total_query = total_query.filter(Message.received_at >= since_datetime)
        
        total = total_query.count()
        
        return jsonify({
            'messages': [message.to_dict() for message in messages],
            'total': total,
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An error occurred while fetching messages',
            'code': 'FETCH_ERROR'
        }), 500

@messages_bp.route('/messages/<int:message_id>', methods=['GET'])
@jwt_required()
def get_message(message_id):
    """Get details of a specific message"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get message with phone number relationship
        message = Message.query.join(PhoneNumber).filter(
            Message.id == message_id,
            PhoneNumber.user_id == current_user_id
        ).first()
        
        if not message:
            return jsonify({
                'error': 'Not Found',
                'message': 'Message not found or access denied',
                'code': 'MESSAGE_NOT_FOUND'
            }), 404
        
        return jsonify(message.to_dict()), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An error occurred while fetching message',
            'code': 'FETCH_ERROR'
        }), 500

@messages_bp.route('/messages/<int:message_id>/read', methods=['PATCH'])
@jwt_required()
def mark_message_read(message_id):
    """Mark a specific message as read"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get message with phone number relationship
        message = Message.query.join(PhoneNumber).filter(
            Message.id == message_id,
            PhoneNumber.user_id == current_user_id
        ).first()
        
        if not message:
            return jsonify({
                'error': 'Not Found',
                'message': 'Message not found or access denied',
                'code': 'MESSAGE_NOT_FOUND'
            }), 404
        
        # Mark as read
        message.mark_as_read()
        
        return jsonify({
            'message': 'Message marked as read',
            'data': message.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An error occurred while marking message as read',
            'code': 'UPDATE_ERROR'
        }), 500

@messages_bp.route('/messages/mark-all-read', methods=['PATCH'])
@jwt_required()
def mark_all_messages_read():
    """Mark all messages as read for the current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters for filtering
        phone_number_id = request.args.get('phone_number_id', type=int)
        message_type = request.args.get('message_type')
        
        # Build query for unread messages
        query = Message.query.join(PhoneNumber).filter(
            PhoneNumber.user_id == current_user_id,
            Message.is_read == False
        )
        
        if phone_number_id:
            # Validate phone_number_id belongs to user
            phone_number = PhoneNumber.query.filter_by(
                id=phone_number_id,
                user_id=current_user_id
            ).first()
            if not phone_number:
                return jsonify({
                    'error': 'Forbidden',
                    'message': 'Access denied to this phone number',
                    'code': 'ACCESS_DENIED'
                }), 403
            
            query = query.filter(Message.phone_number_id == phone_number_id)
        
        if message_type:
            query = query.filter(Message.message_type == message_type)
        
        # Update all matching messages
        updated_count = query.update({'is_read': True})
        db.session.commit()
        
        return jsonify({
            'message': f'Marked {updated_count} messages as read',
            'updated_count': updated_count
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An error occurred while marking messages as read',
            'code': 'UPDATE_ERROR'
        }), 500

@messages_bp.route('/messages/stats', methods=['GET'])
@jwt_required()
def get_message_stats():
    """Get message statistics for the current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get base query for user's messages
        base_query = Message.query.join(PhoneNumber).filter(PhoneNumber.user_id == current_user_id)
        
        # Calculate statistics
        total_messages = base_query.count()
        unread_messages = base_query.filter(Message.is_read == False).count()
        otp_messages = base_query.filter(Message.message_type == 'otp').count()
        verification_messages = base_query.filter(Message.message_type == 'verification').count()
        sms_messages = base_query.filter(Message.message_type == 'sms').count()
        
        # Get messages from last 24 hours
        from datetime import timedelta
        last_24h = datetime.utcnow() - timedelta(hours=24)
        recent_messages = base_query.filter(Message.received_at >= last_24h).count()
        
        # Get messages by phone number
        phone_number_stats = db.session.query(
            PhoneNumber.phone_number,
            PhoneNumber.id,
            db.func.count(Message.id).label('message_count')
        ).join(Message).filter(
            PhoneNumber.user_id == current_user_id
        ).group_by(PhoneNumber.id, PhoneNumber.phone_number).all()
        
        return jsonify({
            'total_messages': total_messages,
            'unread_messages': unread_messages,
            'messages_by_type': {
                'otp': otp_messages,
                'verification': verification_messages,
                'sms': sms_messages
            },
            'recent_messages_24h': recent_messages,
            'phone_number_stats': [
                {
                    'phone_number': stat.phone_number,
                    'phone_number_id': stat.id,
                    'message_count': stat.message_count
                }
                for stat in phone_number_stats
            ]
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An error occurred while fetching message statistics',
            'code': 'STATS_ERROR'
        }), 500

@messages_bp.route('/messages/search', methods=['GET'])
@jwt_required()
def search_messages():
    """Search messages by content"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        query_text = request.args.get('q', '').strip()
        phone_number_id = request.args.get('phone_number_id', type=int)
        message_type = request.args.get('message_type')
        limit = min(int(request.args.get('limit', 50)), 100)  # Max 100
        offset = int(request.args.get('offset', 0))
        
        if not query_text:
            return jsonify({
                'error': 'Validation Error',
                'message': 'Search query is required',
                'code': 'MISSING_QUERY'
            }), 400
        
        # Build search query
        search_query = Message.query.join(PhoneNumber).filter(
            PhoneNumber.user_id == current_user_id,
            Message.message_content.ilike(f'%{query_text}%')
        )
        
        if phone_number_id:
            # Validate phone_number_id belongs to user
            phone_number = PhoneNumber.query.filter_by(
                id=phone_number_id,
                user_id=current_user_id
            ).first()
            if not phone_number:
                return jsonify({
                    'error': 'Forbidden',
                    'message': 'Access denied to this phone number',
                    'code': 'ACCESS_DENIED'
                }), 403
            
            search_query = search_query.filter(Message.phone_number_id == phone_number_id)
        
        if message_type:
            search_query = search_query.filter(Message.message_type == message_type)
        
        # Get total count
        total = search_query.count()
        
        # Get paginated results
        messages = search_query.order_by(Message.received_at.desc()).offset(offset).limit(limit).all()
        
        return jsonify({
            'messages': [message.to_dict() for message in messages],
            'total': total,
            'limit': limit,
            'offset': offset,
            'query': query_text
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An error occurred while searching messages',
            'code': 'SEARCH_ERROR'
        }), 500

