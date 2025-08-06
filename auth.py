from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, timedelta
import re
from src.models.user import User, db

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    return True, "Password is valid"

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'error': 'Validation Error',
                    'message': f'{field} is required',
                    'code': 'MISSING_FIELD'
                }), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        
        # Validate email format
        if not validate_email(email):
            return jsonify({
                'error': 'Validation Error',
                'message': 'Invalid email format',
                'code': 'INVALID_EMAIL'
            }), 400
        
        # Validate password strength
        is_valid, message = validate_password(password)
        if not is_valid:
            return jsonify({
                'error': 'Validation Error',
                'message': message,
                'code': 'WEAK_PASSWORD'
            }), 400
        
        # Check if user already exists
        existing_user = User.find_by_email(email)
        if existing_user:
            return jsonify({
                'error': 'Conflict',
                'message': 'User with this email already exists',
                'code': 'EMAIL_EXISTS'
            }), 409
        
        # Create new user
        user = User.create_user(
            email=email,
            password=password,
            first_name=first_name if first_name else None,
            last_name=last_name if last_name else None
        )
        
        return jsonify({
            'message': 'User registered successfully',
            'user_id': user.id,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An error occurred during registration',
            'code': 'REGISTRATION_ERROR'
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT tokens"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({
                'error': 'Validation Error',
                'message': 'Email and password are required',
                'code': 'MISSING_CREDENTIALS'
            }), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Find user by email
        user = User.find_by_email(email)
        if not user or not user.check_password(password):
            return jsonify({
                'error': 'Authentication Failed',
                'message': 'Invalid email or password',
                'code': 'INVALID_CREDENTIALS'
            }), 401
        
        # Check if user is active
        if not user.is_active:
            return jsonify({
                'error': 'Authentication Failed',
                'message': 'Account is deactivated',
                'code': 'ACCOUNT_DEACTIVATED'
            }), 401
        
        # Update last login
        user.update_last_login()
        
        # Create JWT tokens
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(hours=1)
        )
        refresh_token = create_refresh_token(
            identity=user.id,
            expires_delta=timedelta(days=30)
        )
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'expires_in': 3600,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An error occurred during login',
            'code': 'LOGIN_ERROR'
        }), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token using refresh token"""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify user still exists and is active
        user = User.query.get(current_user_id)
        if not user or not user.is_active:
            return jsonify({
                'error': 'Authentication Failed',
                'message': 'Invalid or expired refresh token',
                'code': 'INVALID_REFRESH_TOKEN'
            }), 401
        
        # Create new access token
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(hours=1)
        )
        
        return jsonify({
            'access_token': access_token,
            'expires_in': 3600
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An error occurred during token refresh',
            'code': 'REFRESH_ERROR'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client-side token removal)"""
    # In a production environment, you might want to blacklist the token
    # For now, we'll just return a success message
    return jsonify({
        'message': 'Successfully logged out'
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'error': 'Not Found',
                'message': 'User not found',
                'code': 'USER_NOT_FOUND'
            }), 404
        
        return jsonify({
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An error occurred while fetching profile',
            'code': 'PROFILE_ERROR'
        }), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user profile"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'error': 'Not Found',
                'message': 'User not found',
                'code': 'USER_NOT_FOUND'
            }), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'first_name' in data:
            user.first_name = data['first_name'].strip() if data['first_name'] else None
        
        if 'last_name' in data:
            user.last_name = data['last_name'].strip() if data['last_name'] else None
        
        # Email update requires validation
        if 'email' in data:
            new_email = data['email'].lower().strip()
            if not validate_email(new_email):
                return jsonify({
                    'error': 'Validation Error',
                    'message': 'Invalid email format',
                    'code': 'INVALID_EMAIL'
                }), 400
            
            # Check if email is already taken by another user
            existing_user = User.find_by_email(new_email)
            if existing_user and existing_user.id != user.id:
                return jsonify({
                    'error': 'Conflict',
                    'message': 'Email is already taken',
                    'code': 'EMAIL_TAKEN'
                }), 409
            
            user.email = new_email
            user.email_verified = False  # Reset verification status
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An error occurred while updating profile',
            'code': 'UPDATE_ERROR'
        }), 500

