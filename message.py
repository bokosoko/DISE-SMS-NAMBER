from datetime import datetime
from datetime import timedelta
import re
from src.models.user import db

class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    phone_number_id = db.Column(db.Integer, db.ForeignKey('phone_numbers.id'), nullable=False)
    sender_number = db.Column(db.String(20), nullable=False)
    message_content = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(20), default='sms', nullable=False)
    received_at = db.Column(db.DateTime, default=datetime.utcnow)
    provider_message_id = db.Column(db.String(255), nullable=True)
    provider_id = db.Column(db.Integer, db.ForeignKey('sms_providers.id'), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    extra_data = db.Column(db.JSON, default={})
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    provider = db.relationship('SMSProvider', backref='messages', lazy=True)
    
    def __repr__(self):
        return f'<Message {self.id} from {self.sender_number}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'phone_number_id': self.phone_number_id,
            'phone_number': self.phone_number.phone_number if self.phone_number else None,
            'sender_number': self.sender_number,
            'message_content': self.message_content,
            'message_type': self.message_type,
            'received_at': self.received_at.isoformat(),
            'is_read': self.is_read,
            'metadata': self.extra_data
        }
    
    def mark_as_read(self):
        """Mark this message as read"""
        self.is_read = True
        db.session.commit()
    
    def detect_message_type(self):
        """Automatically detect message type based on content"""
        content = self.message_content.lower()
        
        # OTP detection patterns
        otp_patterns = [
            r'\b\d{4,8}\b',  # 4-8 digit codes
            r'code[:\s]*\d+',  # "code: 123456"
            r'verification[:\s]*\d+',  # "verification: 123456"
            r'otp[:\s]*\d+',  # "otp: 123456"
        ]
        
        verification_keywords = [
            'verification', 'verify', 'confirm', 'authenticate', 
            'code', 'otp', 'pin', 'security'
        ]
        
        # Check for OTP patterns
        for pattern in otp_patterns:
            if re.search(pattern, content):
                if any(keyword in content for keyword in verification_keywords):
                    return 'otp'
        
        # Check for verification keywords
        if any(keyword in content for keyword in verification_keywords):
            return 'verification'
        
        return 'sms'
    
    @classmethod
    def create_from_webhook(cls, phone_number_id, sender_number, content, provider_id=None, provider_message_id=None):
        """Create a new message from webhook data"""
        message = cls(
            phone_number_id=phone_number_id,
            sender_number=sender_number,
            message_content=content,
            provider_id=provider_id,
            provider_message_id=provider_message_id
        )
        
        # Auto-detect message type
        message.message_type = message.detect_message_type()
        
        db.session.add(message)
        db.session.commit()
        return message
    
    @classmethod
    def get_messages_for_user(cls, user_id, phone_number_id=None, message_type=None, is_read=None, since=None, limit=50, offset=0):
        """Get messages for a specific user with filtering options"""
        from src.models.phone_number import PhoneNumber
        
        # Join with phone_numbers to filter by user
        query = cls.query.join(PhoneNumber).filter(PhoneNumber.user_id == user_id)
        
        if phone_number_id:
            query = query.filter(cls.phone_number_id == phone_number_id)
        
        if message_type:
            query = query.filter(cls.message_type == message_type)
        
        if is_read is not None:
            query = query.filter(cls.is_read == is_read)
        
        if since:
            query = query.filter(cls.received_at >= since)
        
        return query.order_by(cls.received_at.desc()).offset(offset).limit(limit).all()
    
    @classmethod
    def cleanup_old_messages(cls, hours=24):
        """Clean up messages older than specified hours"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        old_messages = cls.query.filter(cls.received_at < cutoff_time).all()
        
        for message in old_messages:
            db.session.delete(message)
        
        db.session.commit()
        return len(old_messages)

