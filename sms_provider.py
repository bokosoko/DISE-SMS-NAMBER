from datetime import datetime
from src.models.user import db

class SMSProvider(db.Model):
    __tablename__ = 'sms_providers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    api_endpoint = db.Column(db.String(255), nullable=False)
    webhook_endpoint = db.Column(db.String(255), nullable=True)
    api_key_encrypted = db.Column(db.Text, nullable=True)
    api_secret_encrypted = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    priority = db.Column(db.Integer, default=1)
    rate_limit_per_minute = db.Column(db.Integer, default=100)
    configuration = db.Column(db.JSON, default={})
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<SMSProvider {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'api_endpoint': self.api_endpoint,
            'webhook_endpoint': self.webhook_endpoint,
            'is_active': self.is_active,
            'priority': self.priority,
            'rate_limit_per_minute': self.rate_limit_per_minute,
            'configuration': self.configuration,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    @classmethod
    def get_active_providers(cls):
        """Get all active SMS providers ordered by priority"""
        return cls.query.filter_by(is_active=True).order_by(cls.priority.asc()).all()
    
    @classmethod
    def get_primary_provider(cls):
        """Get the primary (highest priority) active provider"""
        return cls.query.filter_by(is_active=True).order_by(cls.priority.asc()).first()
    
    def deactivate(self):
        """Deactivate this provider"""
        self.is_active = False
        db.session.commit()
    
    def activate(self):
        """Activate this provider"""
        self.is_active = True
        db.session.commit()

