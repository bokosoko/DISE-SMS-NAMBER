from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
from src.models.message import Message
from src.models.phone_number import PhoneNumber
from src.models.sms_provider import SMSProvider
from src.models.user import db
from src.realtime.socket_manager import socket_manager

webhooks_bp = Blueprint('webhooks', __name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def validate_twilio_webhook(request_data):
    """Validate Twilio webhook data"""
    required_fields = ['From', 'To', 'Body']
    for field in required_fields:
        if field not in request_data:
            return False, f'Missing required field: {field}'
    return True, 'Valid'

def validate_nexmo_webhook(request_data):
    """Validate Nexmo/Vonage webhook data"""
    required_fields = ['msisdn', 'to', 'text']
    for field in required_fields:
        if field not in request_data:
            return False, f'Missing required field: {field}'
    return True, 'Valid'

def normalize_phone_number(phone_number):
    """Normalize phone number format"""
    # Remove any non-digit characters except +
    normalized = ''.join(c for c in phone_number if c.isdigit() or c == '+')
    
    # Ensure it starts with +
    if not normalized.startswith('+'):
        normalized = '+' + normalized
    
    return normalized

def process_sms_webhook(provider_name, webhook_data):
    """Process incoming SMS webhook from any provider"""
    try:
        # Get provider configuration
        provider = SMSProvider.query.filter_by(name=provider_name, is_active=True).first()
        if not provider:
            logger.error(f'Provider {provider_name} not found or inactive')
            return False, f'Provider {provider_name} not configured'
        
        # Extract message data based on provider
        if provider_name.lower() == 'twilio':
            sender_number = normalize_phone_number(webhook_data.get('From', ''))
            recipient_number = normalize_phone_number(webhook_data.get('To', ''))
            message_content = webhook_data.get('Body', '')
            provider_message_id = webhook_data.get('MessageSid', '')
            
        elif provider_name.lower() == 'nexmo':
            sender_number = normalize_phone_number(webhook_data.get('msisdn', ''))
            recipient_number = normalize_phone_number(webhook_data.get('to', ''))
            message_content = webhook_data.get('text', '')
            provider_message_id = webhook_data.get('messageId', '')
            
        else:
            # Generic webhook format
            sender_number = normalize_phone_number(webhook_data.get('from', webhook_data.get('sender', '')))
            recipient_number = normalize_phone_number(webhook_data.get('to', webhook_data.get('recipient', '')))
            message_content = webhook_data.get('message', webhook_data.get('text', webhook_data.get('body', '')))
            provider_message_id = webhook_data.get('message_id', webhook_data.get('id', ''))
        
        if not all([sender_number, recipient_number, message_content]):
            return False, 'Missing required message data'
        
        # Find the phone number in our system
        phone_number = PhoneNumber.query.filter_by(phone_number=recipient_number).first()
        if not phone_number:
            logger.warning(f'Phone number {recipient_number} not found in system')
            return False, f'Phone number {recipient_number} not registered'
        
        # Create message record
        message = Message.create_from_webhook(
            phone_number_id=phone_number.id,
            sender_number=sender_number,
            content=message_content,
            provider_id=provider.id,
            provider_message_id=provider_message_id
        )
        
        logger.info(f'Message {message.id} created from {provider_name} webhook')
        
        # Trigger real-time notification to connected clients
        try:
            message_data = {
                'id': message.id,
                'phone_number_id': phone_number.id,
                'phone_number': phone_number.phone_number,
                'user_id': phone_number.user_id,
                'sender_number': sender_number,
                'message_content': message_content,
                'message_type': message.message_type,
                'received_at': message.received_at.isoformat(),
                'is_read': message.is_read
            }
            socket_manager.notify_new_message(message_data)
            logger.info(f'Real-time notification sent for message {message.id}')
        except Exception as e:
            logger.error(f'Failed to send real-time notification: {str(e)}')
        
        return True, f'Message processed successfully: {message.id}'
        
    except Exception as e:
        logger.error(f'Error processing webhook from {provider_name}: {str(e)}')
        return False, f'Error processing webhook: {str(e)}'

@webhooks_bp.route('/webhooks/sms', methods=['POST'])
def receive_sms_webhook():
    """Receive SMS webhook from providers"""
    try:
        # Get provider from query parameter
        provider_name = request.args.get('provider', '').lower()
        if not provider_name:
            return jsonify({
                'error': 'Missing provider parameter'
            }), 400
        
        # Get webhook data
        if request.content_type == 'application/x-www-form-urlencoded':
            webhook_data = request.form.to_dict()
        elif request.content_type == 'application/json':
            webhook_data = request.get_json() or {}
        else:
            webhook_data = request.form.to_dict()
        
        logger.info(f'Received webhook from {provider_name}: {webhook_data}')
        
        # Validate webhook data based on provider
        if provider_name == 'twilio':
            is_valid, error_msg = validate_twilio_webhook(webhook_data)
        elif provider_name == 'nexmo':
            is_valid, error_msg = validate_nexmo_webhook(webhook_data)
        else:
            # Generic validation
            is_valid = bool(webhook_data)
            error_msg = 'No data received' if not is_valid else 'Valid'
        
        if not is_valid:
            logger.error(f'Invalid webhook data from {provider_name}: {error_msg}')
            return jsonify({
                'error': f'Invalid webhook data: {error_msg}'
            }), 400
        
        # Process the webhook
        success, message = process_sms_webhook(provider_name, webhook_data)
        
        if success:
            # Return appropriate response based on provider
            if provider_name == 'twilio':
                return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>', 200, {'Content-Type': 'text/xml'}
            else:
                return 'OK', 200
        else:
            logger.error(f'Failed to process webhook: {message}')
            return jsonify({
                'error': message
            }), 500
            
    except Exception as e:
        logger.error(f'Webhook processing error: {str(e)}')
        return jsonify({
            'error': 'Internal server error'
        }), 500

@webhooks_bp.route('/webhooks/delivery', methods=['POST'])
def receive_delivery_webhook():
    """Receive delivery status webhook from providers"""
    try:
        provider_name = request.args.get('provider', '').lower()
        if not provider_name:
            return jsonify({
                'error': 'Missing provider parameter'
            }), 400
        
        # Get webhook data
        if request.content_type == 'application/x-www-form-urlencoded':
            webhook_data = request.form.to_dict()
        elif request.content_type == 'application/json':
            webhook_data = request.get_json() or {}
        else:
            webhook_data = request.form.to_dict()
        
        logger.info(f'Received delivery webhook from {provider_name}: {webhook_data}')
        
        # TODO: Process delivery status and update delivery_reports table
        # This can be implemented based on specific provider requirements
        
        return 'OK', 200
        
    except Exception as e:
        logger.error(f'Delivery webhook processing error: {str(e)}')
        return jsonify({
            'error': 'Internal server error'
        }), 500

@webhooks_bp.route('/webhooks/test', methods=['POST'])
def test_webhook():
    """Test webhook endpoint for development and testing"""
    try:
        data = request.get_json() or request.form.to_dict()
        
        # Log the test webhook
        logger.info(f'Test webhook received: {data}')
        
        # Extract test data
        phone_number = data.get('to', '+1234567890')
        sender = data.get('from', '+0987654321')
        message = data.get('message', 'Test message')
        
        # Find phone number
        phone_number_obj = PhoneNumber.query.filter_by(phone_number=phone_number).first()
        if not phone_number_obj:
            return jsonify({
                'error': f'Phone number {phone_number} not found'
            }), 404
        
        # Create test message
        test_message = Message.create_from_webhook(
            phone_number_id=phone_number_obj.id,
            sender_number=sender,
            content=message,
            provider_id=None,
            provider_message_id=f'test_{datetime.utcnow().timestamp()}'
        )
        
        return jsonify({
            'message': 'Test webhook processed successfully',
            'message_id': test_message.id,
            'data': test_message.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f'Test webhook error: {str(e)}')
        return jsonify({
            'error': f'Test webhook error: {str(e)}'
        }), 500

@webhooks_bp.route('/webhooks/status', methods=['GET'])
def webhook_status():
    """Get webhook endpoint status and configuration"""
    try:
        # Get active providers
        providers = SMSProvider.get_active_providers()
        
        webhook_info = {
            'status': 'active',
            'endpoints': {
                'sms': '/api/webhooks/sms?provider={provider_name}',
                'delivery': '/api/webhooks/delivery?provider={provider_name}',
                'test': '/api/webhooks/test'
            },
            'active_providers': [
                {
                    'name': provider.name,
                    'webhook_url': f'/api/webhooks/sms?provider={provider.name.lower()}',
                    'priority': provider.priority
                }
                for provider in providers
            ],
            'supported_content_types': [
                'application/x-www-form-urlencoded',
                'application/json'
            ]
        }
        
        return jsonify(webhook_info), 200
        
    except Exception as e:
        return jsonify({
            'error': f'Status check error: {str(e)}'
        }), 500

