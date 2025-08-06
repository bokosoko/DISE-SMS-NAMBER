import os
import sys
from datetime import timedelta
from datetime import datetime
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import models
from src.models.user import db
from src.models.phone_number import PhoneNumber
from src.models.message import Message
from src.models.sms_provider import SMSProvider

# Import routes
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.numbers import numbers_bp
from src.routes.messages import messages_bp
from src.routes.webhooks import webhooks_bp

# Import realtime
from src.realtime.socket_manager import socket_manager

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-super-secret-jwt-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600)))
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(seconds=int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 2592000)))

# Database configuration
database_url = os.getenv('DATABASE_URL', "sqlite:///app.db")
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SocketIO
socketio = socket_manager.init_app(app)

# Initialize database
db.init_app(app)

# Initialize JWT
jwt = JWTManager(app)

# CORS configuration
cors_origins = os.getenv('CORS_ORIGINS', '*')
if cors_origins == '*':
    CORS(app)
else:
    CORS(app, origins=cors_origins.split(','))

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(numbers_bp, url_prefix='/api')
app.register_blueprint(messages_bp, url_prefix='/api')
app.register_blueprint(webhooks_bp, url_prefix='/api')

# JWT error handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return {
        'error': 'Token Expired',
        'message': 'The JWT token has expired',
        'code': 'TOKEN_EXPIRED'
    }, 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return {
        'error': 'Invalid Token',
        'message': 'The JWT token is invalid',
        'code': 'INVALID_TOKEN'
    }, 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return {
        'error': 'Authorization Required',
        'message': 'JWT token is required',
        'code': 'MISSING_TOKEN'
    }, 401

# Routes and error handlers will be registered here
# Database initialization will be done in main block

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    }, 200

# API info endpoint
@app.route('/api', methods=['GET'])
def api_info():
    return {
        'name': 'Disposable SMS Platform API',
        'version': '1.0.0',
        'description': 'API for managing temporary phone numbers and receiving SMS messages',
        'endpoints': {
            'auth': '/api/auth',
            'numbers': '/api/numbers',
            'messages': '/api/messages',
            'webhooks': '/api/webhooks'
        }
    }, 200

# Serve frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "Frontend not available", 404

if __name__ == '__main__':
    # Create database tables and seed data
    try:
        with app.app_context():
            db.create_all()
            print("Database tables created successfully")
            
            # Seed SMS providers if they don't exist
            if SMSProvider.query.count() == 0:
                # Add Twilio provider
                twilio_provider = SMSProvider(
                    name='twilio',
                    display_name='Twilio',
                    is_active=True,
                    priority=1,
                    config={
                        'account_sid': os.getenv('TWILIO_ACCOUNT_SID', ''),
                        'auth_token': os.getenv('TWILIO_AUTH_TOKEN', ''),
                        'webhook_url': f"{os.getenv('BASE_URL', 'http://localhost:5000')}/webhooks/sms?provider=twilio"
                    }
                )
                db.session.add(twilio_provider)
                
                # Add Nexmo provider
                nexmo_provider = SMSProvider(
                    name='nexmo',
                    display_name='Vonage (Nexmo)',
                    is_active=True,
                    priority=2,
                    config={
                        'api_key': os.getenv('NEXMO_API_KEY', ''),
                        'api_secret': os.getenv('NEXMO_API_SECRET', ''),
                        'webhook_url': f"{os.getenv('BASE_URL', 'http://localhost:5000')}/webhooks/sms?provider=nexmo"
                    }
                )
                db.session.add(nexmo_provider)
                
                db.session.commit()
                print("SMS providers seeded successfully")
                
            # Seed some test phone numbers if they don't exist
            if PhoneNumber.query.count() == 0:
                test_numbers = [
                    '+1234567890',
                    '+1234567891',
                    '+1234567892',
                    '+1234567893',
                    '+1234567894'
                ]
                
                twilio_provider = SMSProvider.query.filter_by(name='twilio').first()
                
                for number in test_numbers:
                    phone_number = PhoneNumber(
                        phone_number=number,
                        country_code='US',
                        provider_id=twilio_provider.id if twilio_provider else None,
                        status='available'
                    )
                    db.session.add(phone_number)
                
                db.session.commit()
                print("Test phone numbers seeded successfully")
                
    except Exception as e:
        print(f"Database setup error: {e}")
        # Continue anyway for development
    
    # Use socketio.run instead of app.run for Socket.IO support
    socketio.run(
        app, 
        host='0.0.0.0', 
        port=5000, 
        debug=True,
        allow_unsafe_werkzeug=True
    )