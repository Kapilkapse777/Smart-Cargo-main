#!/usr/bin/env python3
"""
Setup script for India Cargo Exchange Platform
Initializes database with sample data and creates admin user
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from backend.app import app, db
from backend.models.database import User, IndianCity
from backend.config import Config

def create_sample_cities():
    """Create sample Indian cities in the database"""
    cities_data = [
        # Major Metro Cities
        {'city_name': 'Mumbai', 'state': 'Maharashtra', 'latitude': 19.0760, 'longitude': 72.8777, 'population': 20411274, 'is_major_city': True},
        {'city_name': 'Delhi', 'state': 'Delhi', 'latitude': 28.7041, 'longitude': 77.1025, 'population': 16787941, 'is_major_city': True},
        {'city_name': 'Bangalore', 'state': 'Karnataka', 'latitude': 12.9716, 'longitude': 77.5946, 'population': 12425304, 'is_major_city': True},
        {'city_name': 'Chennai', 'state': 'Tamil Nadu', 'latitude': 13.0827, 'longitude': 80.2707, 'population': 7088000, 'is_major_city': True},
        {'city_name': 'Kolkata', 'state': 'West Bengal', 'latitude': 22.5726, 'longitude': 88.3639, 'population': 4496694, 'is_major_city': True},
        {'city_name': 'Hyderabad', 'state': 'Telangana', 'latitude': 17.3850, 'longitude': 78.4867, 'population': 6809970, 'is_major_city': True},
        
        # Tier-2 Cities
        {'city_name': 'Pune', 'state': 'Maharashtra', 'latitude': 18.5204, 'longitude': 73.8567, 'population': 3124458, 'is_major_city': True},
        {'city_name': 'Ahmedabad', 'state': 'Gujarat', 'latitude': 23.0225, 'longitude': 72.5714, 'population': 5570585, 'is_major_city': True},
        {'city_name': 'Jaipur', 'state': 'Rajasthan', 'latitude': 26.9124, 'longitude': 75.7873, 'population': 3073350, 'is_major_city': True},
        {'city_name': 'Lucknow', 'state': 'Uttar Pradesh', 'latitude': 26.8467, 'longitude': 80.9462, 'population': 2817101, 'is_major_city': True},
        {'city_name': 'Kanpur', 'state': 'Uttar Pradesh', 'latitude': 26.4499, 'longitude': 80.3319, 'population': 2767031, 'is_major_city': False},
        {'city_name': 'Nagpur', 'state': 'Maharashtra', 'latitude': 21.1458, 'longitude': 79.0882, 'population': 2405665, 'is_major_city': False},
        {'city_name': 'Indore', 'state': 'Madhya Pradesh', 'latitude': 22.7196, 'longitude': 75.8577, 'population': 1994391, 'is_major_city': False},
        {'city_name': 'Thane', 'state': 'Maharashtra', 'latitude': 19.2183, 'longitude': 72.9781, 'population': 1841488, 'is_major_city': False},
        {'city_name': 'Bhopal', 'state': 'Madhya Pradesh', 'latitude': 23.2599, 'longitude': 77.4126, 'population': 1798218, 'is_major_city': False},
        {'city_name': 'Visakhapatnam', 'state': 'Andhra Pradesh', 'latitude': 17.6868, 'longitude': 83.2185, 'population': 1728128, 'is_major_city': False},
        {'city_name': 'Patna', 'state': 'Bihar', 'latitude': 25.5941, 'longitude': 85.1376, 'population': 2046652, 'is_major_city': False},
        {'city_name': 'Vadodara', 'state': 'Gujarat', 'latitude': 22.3072, 'longitude': 73.1812, 'population': 1670806, 'is_major_city': False},
        {'city_name': 'Ghaziabad', 'state': 'Uttar Pradesh', 'latitude': 28.6692, 'longitude': 77.4538, 'population': 1648643, 'is_major_city': False},
        {'city_name': 'Ludhiana', 'state': 'Punjab', 'latitude': 30.9010, 'longitude': 75.8573, 'population': 1618879, 'is_major_city': False},
    ]
    
    for city_data in cities_data:
        # Check if city already exists
        existing_city = IndianCity.query.filter_by(
            city_name=city_data['city_name'],
            state=city_data['state']
        ).first()
        
        if not existing_city:
            city = IndianCity(**city_data)
            db.session.add(city)
            print(f"Added city: {city_data['city_name']}, {city_data['state']}")
        else:
            print(f"City already exists: {city_data['city_name']}, {city_data['state']}")

def create_admin_user():
    """Create an admin user for testing"""
    admin_data = {
        'username': 'admin',
        'email': 'admin@cargoexchange.com',
        'company_name': 'Cargo Exchange Admin',
        'phone': '+91-9876543210',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'user_type': 'transporter'
    }
    
    # Check if admin user already exists
    existing_admin = User.query.filter_by(email=admin_data['email']).first()
    
    if not existing_admin:
        admin = User(**admin_data)
        admin.set_password('admin123')
        admin.is_verified = True
        db.session.add(admin)
        print("Created admin user: admin@cargoexchange.com / admin123")
    else:
        print("Admin user already exists")

def main():
    """Main setup function"""
    print("🚀 Setting up India Cargo Exchange Platform...")
    
    with app.app_context():
        # Create database tables
        print("📊 Creating database tables...")
        db.create_all()
        
        # Create sample cities
        print("🏙️ Adding sample Indian cities...")
        create_sample_cities()
        
        # Create admin user
        print("👤 Creating admin user...")
        create_admin_user()
        
        # Commit all changes
        db.session.commit()
        
        print("✅ Setup completed successfully!")
        print("\n📋 Next steps:")
        print("1. Start the backend: cd backend && python app.py")
        print("2. Start the frontend: cd frontend && npm install && npm start")
        print("3. Access the application at http://localhost:3000")
        print("4. Login with admin@cargoexchange.com / admin123")

if __name__ == '__main__':
    main() 