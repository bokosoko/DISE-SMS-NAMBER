from datetime import datetime, timedelta
from src.models.user import db

class PhoneNumber(db.Model):
    __tablename__ = 'phone_numbers'
    
    id = db.Column(db.Integer, primary_key=True)
    phone_number = db.Column(db.String(20), unique=True, nullable=False)
    country_code = db.Column(db.String(5), nullable=False)
    provider_id = db.Column(db.Integer, db.ForeignKey('sms_providers.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(db.String(20), default='available', nullable=False)
    assigned_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    extra_data = db.Column(db.JSON, default={})
    
    # Relationships
    messages = db.relationship('Message', backref='phone_number', lazy=True, cascade='all, delete-orphan')
    provider = db.relationship('SMSProvider', backref='phone_numbers', lazy=True)
    user = db.relationship('User', backref='assigned_numbers', lazy=True)
    
    def __repr__(self):
        return f'<PhoneNumber {self.phone_number}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'phone_number': self.phone_number,
            'country_code': self.country_code,
            'status': self.status,
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat(),
            'metadata': self.extra_data
        }
    
    def assign_to_user(self, user_id, duration_hours=1):
        """Assign this phone number to a user for a specified duration"""
        self.user_id = user_id
        self.status = 'assigned'
        self.assigned_at = datetime.utcnow()
        self.expires_at = datetime.utcnow() + timedelta(hours=duration_hours)
        db.session.commit()
    
    def release(self):
        """Release this phone number back to available pool"""
        self.user_id = None
        self.status = 'available'
        self.assigned_at = None
        self.expires_at = None
        db.session.commit()
    
    def is_expired(self):
        """Check if the phone number assignment has expired"""
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return True
        return False
    
    @classmethod
    def get_available_numbers(cls, country_code=None, limit=20, offset=0):
        """Get available phone numbers with optional filtering"""
        query = cls.query.filter_by(status='available')
        if country_code:
            query = query.filter_by(country_code=country_code)
        return query.offset(offset).limit(limit).all()
    
    @classmethod
    def cleanup_expired(cls):
        """Clean up expired phone number assignments"""
        expired_numbers = cls.query.filter(
            cls.status == 'assigned',
            cls.expires_at < datetime.utcnow()
        ).all()
        
        for number in expired_numbers:
            number.release()
        
        return len(expired_numbers)

