from flask import Flask, jsonify, request
import json
import os
from datetime import datetime
import uuid

app = Flask(__name__)

# Simple in-memory storage (no files for now)
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
        
        if not data or 'username' not in data or 'email' not in data:
            return jsonify({"error": "Missing username or email"}), 400
        
        # Check if user exists
        for user in users:
            if user['email'] == data['email']:
                return jsonify({"error": "Email already registered"}), 400
        
        # Create user
        new_user = {
            'id': str(uuid.uuid4()),
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
        return jsonify({"error": str(e)}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or 'email' not in data:
            return jsonify({"error": "Email required"}), 400
        
        # Find user
        for user in users:
            if user['email'] == data['email']:
                return jsonify({
                    "message": "Login successful",
                    "user": user
                })
        
        return jsonify({"error": "User not found"}), 404
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/cargo/create', methods=['POST'])
def create_cargo():
    try:
        data = request.get_json()
        
        required_fields = ['title', 'origin_city', 'destination_city', 'cargo_type', 'weight']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400
        
        new_cargo = {
            'id': str(uuid.uuid4()),
            'title': data['title'],
            'origin_city': data['origin_city'],
            'destination_city': data['destination_city'],
            'cargo_type': data['cargo_type'],
            'weight': float(data['weight']),
            'status': 'active',
            'created_at': datetime.now().isoformat()
        }
        
        cargo_listings.append(new_cargo)
        
        return jsonify({
            "message": "Cargo created successfully",
            "cargo": new_cargo
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/cargo/list', methods=['GET'])
def list_cargo():
    return jsonify({
        "cargo_listings": cargo_listings,
        "total": len(cargo_listings)
    })

@app.route('/matching/find', methods=['POST'])
def find_matches():
    try:
        data = request.get_json()
        cargo_id = data.get('cargo_id')
        
        if not cargo_id:
            return jsonify({"error": "Cargo ID required"}), 400
        
        # Find target cargo
        target_cargo = None
        for cargo in cargo_listings:
            if cargo['id'] == cargo_id:
                target_cargo = cargo
                break
        
        if not target_cargo:
            return jsonify({"error": "Cargo not found"}), 404
        
        # Find matches (A→C and C→A pattern)
        matches = []
        for cargo in cargo_listings:
            if (cargo['id'] != cargo_id and 
                cargo['origin_city'] == target_cargo['destination_city'] and 
                cargo['destination_city'] == target_cargo['origin_city']):
                
                match_data = {
                    'cargo_listing': cargo,
                    'compatibility_score': 85,
                    'savings': {
                        'original_cost': 15000,
                        'new_cost': 9000,
                        'savings': 6000
                    }
                }
                matches.append(match_data)
        
        return jsonify({
            "cargo": target_cargo,
            "matches": matches,
            "total_matches": len(matches)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "users": len(users),
        "cargo": len(cargo_listings),
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🚛 India Cargo Exchange Platform")
    print("🌐 Backend running at: http://localhost:5000")
    print("📊 In-memory storage (no dependencies)")
    print("✅ Ready to accept requests!")
    
    app.run(debug=True, port=5000) 