from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime
from src.models.user import User, db
from src.models.phone_number import PhoneNumber
from src.models.sms_provider import SMSProvider

numbers_bp = Blueprint('numbers', __name__)

@numbers_bp.route('/numbers', methods=['GET'])
def get_numbers():
    """Get available phone numbers with optional filtering"""
    try:
        # Get query parameters
        country_code = request.args.get('country_code')
        status = request.args.get('status', 'available')
        limit = min(int(request.args.get('limit', 20)), 100)  # Max 100
        offset = int(request.args.get('offset', 0))
        
        # Build query
        query = PhoneNumber.query
        
        if status:
            query = query.filter_by(status=status)
        
        if country_code:
            query = query.filter_by(country_code=country_code.upper())
        
        # Get total count
        total = query.count()
        
        # Get paginated results
        numbers = query.offset(offset).limit(limit).all()
        
        return jsonify({
            'numbers': [number.to_dict() for number in numbers],
            'total': total,
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An error occurred while fetching numbers',
            'code': 'FETCH_ERROR'
        }), 500

@numbers_bp.route('/numbers', methods=['POST'])
@jwt_required()
def assign_number():
    """Assign an available phone number to the authenticated user"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('phone_number_id'):
            return jsonify({
                'error': 'Validation Error',
                'message': 'phone_number_id is required',
                'code': 'MISSING_FIELD'
            }), 400
        
        phone_number_id = data['phone_number_id']
        duration_hours = data.get('duration_hours', 1)
        
        # Validate duration
        if duration_hours < 1 or duration_hours > 24:
            return jsonify({
                'error': 'Validation Error',
                'message': 'Duration must be between 1 and 24 hours',
                'code': 'INVALID_DURATION'
            }), 400
        
        # Get the phone number
        phone_number = PhoneNumber.query.get(phone_number_id)
        if not phone_number:
            return jsonify({
                'error': 'Not Found',
                'message': 'Phone number not found',
                'code': 'NUMBER_NOT_FOUND'
            }), 404
        
        # Check if number is available
        if phone_number.status != 'available':
            return jsonify({
                'error': 'Conflict',
                'message': 'Phone number is not available',
                'code': 'NUMBER_NOT_AVAILABLE'
            }), 409
        
        # Check if user already has an active number
        existing_assignment = PhoneNumber.query.filter_by(
            user_id=current_user_id,
            status='assigned'
        ).first()
        
        if existing_assignment and not existing_assignment.is_expired():
            return jsonify({
                'error': 'Conflict',
                'message': 'You already have an active phone number assignment',
                'code': 'ALREADY_ASSIGNED',
                'details': {
                    'existing_number': existing_assignment.to_dict()
                }
            }), 409
        
        # Assign the number
        phone_number.assign_to_user(current_user_id, duration_hours)
        
        return jsonify(phone_number.to_dict()), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An error occurred while assigning number',
            'code': 'ASSIGNMENT_ERROR'
        }), 500

@numbers_bp.route('/numbers/<int:number_id>', methods=['GET'])
@jwt_required()
def get_number(number_id):
    """Get details of a specific phone number"""
    try:
        current_user_id = get_jwt_identity()
        
        phone_number = PhoneNumber.query.get(number_id)
        if not phone_number:
            return jsonify({
                'error': 'Not Found',
                'message': 'Phone number not found',
                'code': 'NUMBER_NOT_FOUND'
            }), 404
        
        # Check if user has access to this number
        if phone_number.user_id != current_user_id and phone_number.status != 'available':
            return jsonify({
                'error': 'Forbidden',
                'message': 'Access denied to this phone number',
                'code': 'ACCESS_DENIED'
            }), 403
        
        return jsonify(phone_number.to_dict()), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An error occurred while fetching number details',
            'code': 'FETCH_ERROR'
        }), 500

@numbers_bp.route('/numbers/<int:number_id>', methods=['DELETE'])
@jwt_required()
def release_number(number_id):
    """Release an assigned phone number back to available pool"""
    try:
        current_user_id = get_jwt_identity()
        
        phone_number = PhoneNumber.query.get(number_id)
        if not phone_number:
            return jsonify({
                'error': 'Not Found',
                'message': 'Phone number not found',
                'code': 'NUMBER_NOT_FOUND'
            }), 404
        
        # Check if user owns this number
        if phone_number.user_id != current_user_id:
            return jsonify({
                'error': 'Forbidden',
                'message': 'You are not authorized to release this number',
                'code': 'NOT_AUTHORIZED'
            }), 403
        
        # Release the number
        phone_number.release()
        
        return jsonify({
            'message': 'Phone number released successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An error occurred while releasing number',
            'code': 'RELEASE_ERROR'
        }), 500

@numbers_bp.route('/numbers/my', methods=['GET'])
@jwt_required()
def get_my_numbers():
    """Get phone numbers assigned to the current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get user's assigned numbers
        numbers = PhoneNumber.query.filter_by(user_id=current_user_id).all()
        
        # Clean up expired numbers
        for number in numbers:
            if number.is_expired() and number.status == 'assigned':
                number.release()
        
        # Refresh the query after cleanup
        numbers = PhoneNumber.query.filter_by(user_id=current_user_id).all()
        
        return jsonify({
            'numbers': [number.to_dict() for number in numbers]
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An error occurred while fetching your numbers',
            'code': 'FETCH_ERROR'
        }), 500

@numbers_bp.route('/numbers/<int:number_id>/extend', methods=['POST'])
@jwt_required()
def extend_number(number_id):
    """Extend the assignment duration of a phone number"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        additional_hours = data.get('additional_hours', 1)
        
        # Validate additional hours
        if additional_hours < 1 or additional_hours > 24:
            return jsonify({
                'error': 'Validation Error',
                'message': 'Additional hours must be between 1 and 24',
                'code': 'INVALID_DURATION'
            }), 400
        
        phone_number = PhoneNumber.query.get(number_id)
        if not phone_number:
            return jsonify({
                'error': 'Not Found',
                'message': 'Phone number not found',
                'code': 'NUMBER_NOT_FOUND'
            }), 404
        
        # Check if user owns this number
        if phone_number.user_id != current_user_id:
            return jsonify({
                'error': 'Forbidden',
                'message': 'You are not authorized to extend this number',
                'code': 'NOT_AUTHORIZED'
            }), 403
        
        # Check if number is still assigned
        if phone_number.status != 'assigned':
            return jsonify({
                'error': 'Conflict',
                'message': 'Phone number is not currently assigned',
                'code': 'NOT_ASSIGNED'
            }), 409
        
        # Extend the assignment
        if phone_number.expires_at:
            # If not expired, extend from current expiry time
            if not phone_number.is_expired():
                phone_number.expires_at = phone_number.expires_at + timedelta(hours=additional_hours)
            else:
                # If expired, extend from current time
                phone_number.expires_at = datetime.utcnow() + timedelta(hours=additional_hours)
        else:
            # If no expiry set, set from current time
            phone_number.expires_at = datetime.utcnow() + timedelta(hours=additional_hours)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Phone number assignment extended successfully',
            'number': phone_number.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An error occurred while extending number assignment',
            'code': 'EXTEND_ERROR'
        }), 500

