from flask import Flask, jsonify, request
from flask_cors import CORS
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Simple in-memory storage for demo
users = []
cargo_listings = []
matches = []

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "🚛 India Cargo Exchange Platform API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "auth": {
                "/auth/register": "POST - Register new user",
                "/auth/login": "POST - User login"
            },
            "cargo": {
                "/cargo/create": "POST - Create cargo listing",
                "/cargo/list": "GET - List all cargo"
            },
            "matching": {
                "/matching/find": "POST - Find compatible matches"
            }
        }
    })

@app.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Simple validation
        if not data or 'username' not in data or 'email' not in data:
            return jsonify({"error": "Missing required fields"}), 400
        
        # Check if user exists
        for user in users:
            if user['email'] == data['email']:
                return jsonify({"error": "Email already registered"}), 400
        
        # Create user
        new_user = {
            'id': len(users) + 1,
            'username': data['username'],
            'email': data['email'],
            'company_name': data.get('company_name', ''),
            'created_at': datetime.now().isoformat()
        }
        
        users.append(new_user)
        
        return jsonify({
            "message": "User registered successfully",
            "user": new_user
        }), 201
        
    except Exception as e:
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or 'email' not in data:
            return jsonify({"error": "Email required"}), 400
        
        # Find user
        user = None
        for u in users:
            if u['email'] == data['email']:
                user = u
                break
        
        if user:
            return jsonify({
                "message": "Login successful",
                "user": user
            })
        else:
            return jsonify({"error": "User not found"}), 404
            
    except Exception as e:
        return jsonify({"error": f"Login failed: {str(e)}"}), 500

@app.route('/cargo/create', methods=['POST'])
def create_cargo():
    try:
        data = request.get_json()
        
        # Simple validation
        required_fields = ['title', 'origin_city', 'destination_city', 'cargo_type', 'weight']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Create cargo listing
        new_cargo = {
            'id': len(cargo_listings) + 1,
            'title': data['title'],
            'origin_city': data['origin_city'],
            'origin_state': data.get('origin_state', ''),
            'destination_city': data['destination_city'],
            'destination_state': data.get('destination_state', ''),
            'cargo_type': data['cargo_type'],
            'weight': float(data['weight']),
            'description': data.get('description', ''),
            'budget': float(data.get('budget', 0)),
            'status': 'active',
            'created_at': datetime.now().isoformat()
        }
        
        cargo_listings.append(new_cargo)
        
        return jsonify({
            "message": "Cargo listing created successfully",
            "cargo": new_cargo
        }), 201
        
    except Exception as e:
        return jsonify({"error": f"Failed to create cargo listing: {str(e)}"}), 500

@app.route('/cargo/list', methods=['GET'])
def list_cargo():
    try:
        return jsonify({
            "cargo_listings": cargo_listings,
            "total": len(cargo_listings)
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to fetch cargo listings: {str(e)}"}), 500

@app.route('/matching/find', methods=['POST'])
def find_matches():
    try:
        data = request.get_json()
        cargo_id = data.get('cargo_id')
        
        if not cargo_id:
            return jsonify({"error": "Cargo ID required"}), 400
        
        # Find the cargo listing
        target_cargo = None
        for cargo in cargo_listings:
            if cargo['id'] == int(cargo_id):
                target_cargo = cargo
                break
        
        if not target_cargo:
            return jsonify({"error": "Cargo listing not found"}), 404
        
        # Simple matching logic
        compatible_matches = []
        for cargo in cargo_listings:
            if cargo['id'] != int(cargo_id):
                # Check if routes are compatible (A→C and C→A pattern)
                if (cargo['origin_city'] == target_cargo['destination_city'] and 
                    cargo['destination_city'] == target_cargo['origin_city']):
                    
                    # Calculate simple compatibility score
                    compatibility_score = 85  # High score for perfect match
                    
                    match_data = {
                        'cargo_listing': cargo,
                        'compatibility_score': compatibility_score,
                        'exchange_points': [
                            {
                                'city': 'Jaipur',
                                'state': 'Rajasthan',
                                'lat': 26.9124,
                                'lng': 75.7873,
                                'score': 90
                            }
                        ],
                        'cost_savings': {
                            'original_cost': 15000,
                            'new_cost': 9000,
                            'savings': 6000,
                            'savings_percentage': 40
                        }
                    }
                    
                    compatible_matches.append(match_data)
        
        return jsonify({
            "cargo": target_cargo,
            "matches": compatible_matches,
            "total_matches": len(compatible_matches)
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to find matches: {str(e)}"}), 500

@app.route('/cities/india', methods=['GET'])
def get_indian_cities():
    cities = [
        {'city_name': 'Mumbai', 'state': 'Maharashtra', 'latitude': 19.0760, 'longitude': 72.8777},
        {'city_name': 'Delhi', 'state': 'Delhi', 'latitude': 28.7041, 'longitude': 77.1025},
        {'city_name': 'Bangalore', 'state': 'Karnataka', 'latitude': 12.9716, 'longitude': 77.5946},
        {'city_name': 'Chennai', 'state': 'Tamil Nadu', 'latitude': 13.0827, 'longitude': 80.2707},
        {'city_name': 'Kolkata', 'state': 'West Bengal', 'latitude': 22.5726, 'longitude': 88.3639},
        {'city_name': 'Hyderabad', 'state': 'Telangana', 'latitude': 17.3850, 'longitude': 78.4867},
        {'city_name': 'Pune', 'state': 'Maharashtra', 'latitude': 18.5204, 'longitude': 73.8567},
        {'city_name': 'Ahmedabad', 'state': 'Gujarat', 'latitude': 23.0225, 'longitude': 72.5714},
        {'city_name': 'Jaipur', 'state': 'Rajasthan', 'latitude': 26.9124, 'longitude': 75.7873},
        {'city_name': 'Lucknow', 'state': 'Uttar Pradesh', 'latitude': 26.8467, 'longitude': 80.9462}
    ]
    
    return jsonify({
        "cities": cities,
        "total": len(cities)
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "users_count": len(users),
        "cargo_count": len(cargo_listings)
    })

if __name__ == '__main__':
    print("🚀 India Cargo Exchange Platform Starting...")
    print("📊 Simple API server (no database required)")
    print("🌐 API endpoints available at http://localhost:5000")
    print("📖 API documentation available at http://localhost:5000/")
    print("💡 This is a demo version with in-memory storage")
    
    app.run(debug=True, host='0.0.0.0', port=5000) 