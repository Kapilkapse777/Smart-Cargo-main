from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime
import uuid

db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    company_name = db.Column(db.String(200))
    phone = db.Column(db.String(15))
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    pincode = db.Column(db.String(10))
    user_type = db.Column(db.String(20), default='transporter')  # transporter, shipper, both
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    cargo_listings = db.relationship('CargoListing', backref='user', lazy=True)
    vehicles = db.relationship('Vehicle', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'company_name': self.company_name,
            'phone': self.phone,
            'city': self.city,
            'state': self.state,
            'user_type': self.user_type,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat()
        }

class Vehicle(db.Model):
    __tablename__ = 'vehicles'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    vehicle_type = db.Column(db.String(50), nullable=False)  # truck, trailer, container, etc.
    capacity = db.Column(db.Float, nullable=False)  # in tons
    dimensions = db.Column(db.JSON)  # length, width, height
    registration_number = db.Column(db.String(20), unique=True)
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_type': self.vehicle_type,
            'capacity': self.capacity,
            'dimensions': self.dimensions,
            'registration_number': self.registration_number,
            'is_available': self.is_available
        }

class CargoListing(db.Model):
    __tablename__ = 'cargo_listings'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    # Origin and Destination
    origin_city = db.Column(db.String(100), nullable=False)
    origin_state = db.Column(db.String(100), nullable=False)
    origin_lat = db.Column(db.Float)
    origin_lng = db.Column(db.Float)
    
    destination_city = db.Column(db.String(100), nullable=False)
    destination_state = db.Column(db.String(100), nullable=False)
    destination_lat = db.Column(db.Float)
    destination_lng = db.Column(db.Float)
    
    # Cargo Details
    cargo_type = db.Column(db.String(100), nullable=False)  # electronics, textiles, machinery, etc.
    weight = db.Column(db.Float, nullable=False)  # in tons
    dimensions = db.Column(db.JSON)  # length, width, height
    special_requirements = db.Column(db.Text)  # temperature, handling, etc.
    
    # Timeline and Budget
    pickup_date = db.Column(db.Date, nullable=False)
    delivery_date = db.Column(db.Date, nullable=False)
    budget = db.Column(db.Float)  # in INR
    price_per_km = db.Column(db.Float)  # in INR
    
    # Status
    status = db.Column(db.String(20), default='active')  # active, matched, completed, cancelled
    is_exchange_eligible = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    matches = db.relationship('CargoMatch', backref='cargo_listing', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'origin_city': self.origin_city,
            'origin_state': self.origin_state,
            'origin_lat': self.origin_lat,
            'origin_lng': self.origin_lng,
            'destination_city': self.destination_city,
            'destination_state': self.destination_state,
            'destination_lat': self.destination_lat,
            'destination_lng': self.destination_lng,
            'cargo_type': self.cargo_type,
            'weight': self.weight,
            'dimensions': self.dimensions,
            'pickup_date': self.pickup_date.isoformat() if self.pickup_date else None,
            'delivery_date': self.delivery_date.isoformat() if self.delivery_date else None,
            'budget': self.budget,
            'price_per_km': self.price_per_km,
            'status': self.status,
            'is_exchange_eligible': self.is_exchange_eligible,
            'created_at': self.created_at.isoformat()
        }

class CargoMatch(db.Model):
    __tablename__ = 'cargo_matches'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cargo_listing_1_id = db.Column(db.String(36), db.ForeignKey('cargo_listings.id'), nullable=False)
    cargo_listing_2_id = db.Column(db.String(36), db.ForeignKey('cargo_listings.id'), nullable=False)
    
    # Exchange Point Details
    exchange_point_city = db.Column(db.String(100), nullable=False)
    exchange_point_state = db.Column(db.String(100), nullable=False)
    exchange_point_lat = db.Column(db.Float, nullable=False)
    exchange_point_lng = db.Column(db.Float, nullable=False)
    
    # Route Details
    route_1_distance = db.Column(db.Float)  # km
    route_2_distance = db.Column(db.Float)  # km
    total_distance_saved = db.Column(db.Float)  # km
    cost_savings = db.Column(db.Float)  # INR
    
    # Match Score
    compatibility_score = db.Column(db.Float)  # 0-100
    
    # Status
    status = db.Column(db.String(20), default='proposed')  # proposed, accepted, rejected, completed
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'cargo_listing_1_id': self.cargo_listing_1_id,
            'cargo_listing_2_id': self.cargo_listing_2_id,
            'exchange_point_city': self.exchange_point_city,
            'exchange_point_state': self.exchange_point_state,
            'exchange_point_lat': self.exchange_point_lat,
            'exchange_point_lng': self.exchange_point_lng,
            'route_1_distance': self.route_1_distance,
            'route_2_distance': self.route_2_distance,
            'total_distance_saved': self.total_distance_saved,
            'cost_savings': self.cost_savings,
            'compatibility_score': self.compatibility_score,
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }

class IndianCity(db.Model):
    __tablename__ = 'indian_cities'
    
    id = db.Column(db.Integer, primary_key=True)
    city_name = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    population = db.Column(db.Integer)
    is_major_city = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'city_name': self.city_name,
            'state': self.state,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'population': self.population,
            'is_major_city': self.is_major_city
        }

class RouteCache(db.Model):
    __tablename__ = 'route_cache'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    origin_city = db.Column(db.String(100), nullable=False)
    destination_city = db.Column(db.String(100), nullable=False)
    distance = db.Column(db.Float)
    duration = db.Column(db.Integer)  # in minutes
    toll_charges = db.Column(db.Float)
    fuel_cost = db.Column(db.Float)
    route_data = db.Column(db.JSON)  # Google Maps route data
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'origin_city': self.origin_city,
            'destination_city': self.destination_city,
            'distance': self.distance,
            'duration': self.duration,
            'toll_charges': self.toll_charges,
            'fuel_cost': self.fuel_cost,
            'route_data': self.route_data
        } 