import os
from datetime import timedelta

class Config:
    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    DEBUG = True
    
    # Database Configuration - Using SQLite for quick setup
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///cargo_exchange.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Redis Configuration (optional for now)
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    
    # Google Maps API
    GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY') or 'your-google-maps-api-key'
    
    # OpenWeatherMap API
    OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY') or 'your-openweather-api-key'
    
    # Fuel Price API
    FUEL_PRICE_API_KEY = os.environ.get('FUEL_PRICE_API_KEY') or 'your-fuel-api-key'
    
    # File Upload Configuration
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # India-specific Configuration
    INDIA_BOUNDS = {
        'north': 37.6,  # Kashmir
        'south': 6.8,   # Kanyakumari
        'east': 97.4,   # Arunachal Pradesh
        'west': 68.1    # Gujarat
    }
    
    # Major Indian Cities (for quick access)
    MAJOR_CITIES = {
        'Mumbai': {'lat': 19.0760, 'lng': 72.8777, 'state': 'Maharashtra'},
        'Delhi': {'lat': 28.7041, 'lng': 77.1025, 'state': 'Delhi'},
        'Bangalore': {'lat': 12.9716, 'lng': 77.5946, 'state': 'Karnataka'},
        'Chennai': {'lat': 13.0827, 'lng': 80.2707, 'state': 'Tamil Nadu'},
        'Kolkata': {'lat': 22.5726, 'lng': 88.3639, 'state': 'West Bengal'},
        'Hyderabad': {'lat': 17.3850, 'lng': 78.4867, 'state': 'Telangana'},
        'Pune': {'lat': 18.5204, 'lng': 73.8567, 'state': 'Maharashtra'},
        'Ahmedabad': {'lat': 23.0225, 'lng': 72.5714, 'state': 'Gujarat'},
        'Jaipur': {'lat': 26.9124, 'lng': 75.7873, 'state': 'Rajasthan'},
        'Lucknow': {'lat': 26.8467, 'lng': 80.9462, 'state': 'Uttar Pradesh'}
    }
    
    # Fuel Prices (approximate - will be updated via API)
    FUEL_PRICES = {
        'Petrol': 96.0,  # INR per liter
        'Diesel': 89.0   # INR per liter
    }
    
    # Toll Charges (approximate - will be updated via API)
    TOLL_RATES = {
        'car': 0.5,      # INR per km
        'truck': 1.0,    # INR per km
        'bus': 0.8       # INR per km
    }

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
} 