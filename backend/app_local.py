from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime, timedelta
import uuid

app = Flask(__name__)
CORS(app)

# Local JSON file storage paths
DATA_DIR = 'local_data'
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
CARGO_FILE = os.path.join(DATA_DIR, 'cargo_listings.json')
MATCHES_FILE = os.path.join(DATA_DIR, 'matches.json')

# Create data directory if it doesn't exist
os.makedirs(DATA_DIR, exist_ok=True)

# Initialize empty JSON files if they don't exist
def init_data_files():
    files = {
        USERS_FILE: [],
        CARGO_FILE: [],
        MATCHES_FILE: []
    }
    
    for file_path, default_data in files.items():
        if not os.path.exists(file_path):
            with open(file_path, 'w') as f:
                json.dump(default_data, f, indent=2)

# Helper functions to read/write JSON files
def read_json_file(file_path):
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def write_json_file(file_path, data):
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2, default=str)

def get_optimal_exchange_point(origin, destination, origin_coords=None, dest_coords=None):
    """Calculate optimal exchange point using Google Maps API or fallback to predefined points"""
    
    # If coordinates are provided, calculate geometric midpoint
    if origin_coords and dest_coords:
        try:
            # Calculate geographic midpoint
            lat1, lng1 = origin_coords['lat'], origin_coords['lng']
            lat2, lng2 = dest_coords['lat'], dest_coords['lng']
            
            mid_lat = (lat1 + lat2) / 2
            mid_lng = (lng1 + lng2) / 2
            
            # Return a nice description with coordinates and nearest major city
            nearest_city = find_nearest_major_city(mid_lat, mid_lng)
            return f"{nearest_city} (Midpoint: {mid_lat:.2f}°N, {mid_lng:.2f}°E)"
            
        except Exception as e:
            print(f"Error calculating midpoint: {e}")
    
    # Fallback to predefined exchange points for major Indian routes
    exchange_points = {
        ('Mumbai', 'Delhi'): 'Udaipur (Rajasthan)',
        ('Delhi', 'Mumbai'): 'Udaipur (Rajasthan)',
        ('Pune', 'Nagpur'): 'Aurangabad (Maharashtra)',
        ('Nagpur', 'Pune'): 'Aurangabad (Maharashtra)',
        ('Bangalore', 'Chennai'): 'Hosur (Tamil Nadu)',
        ('Chennai', 'Bangalore'): 'Hosur (Tamil Nadu)',
        ('Kolkata', 'Bhubaneswar'): 'Cuttack (Odisha)',
        ('Mumbai', 'Bangalore'): 'Belgaum (Karnataka)',
        ('Delhi', 'Kolkata'): 'Dhanbad (Jharkhand)',
        ('Chennai', 'Hyderabad'): 'Tirupati (Andhra Pradesh)',
        ('Mumbai', 'Pune'): 'Lonavala (Maharashtra)',
        ('Delhi', 'Jaipur'): 'Alwar (Rajasthan)',
        ('Bangalore', 'Hyderabad'): 'Anantapur (Andhra Pradesh)',
        ('Mumbai', 'Ahmedabad'): 'Surat (Gujarat)',
        ('Delhi', 'Lucknow'): 'Aligarh (Uttar Pradesh)'
    }
    
    # Try to find specific exchange point
    key = (origin, destination)
    if key in exchange_points:
        return exchange_points[key]
    
    # If not found, return a generic description
    return f"Optimal midpoint between {origin} and {destination}"

def find_nearest_major_city(lat, lng):
    """Find the nearest major Indian city to given coordinates"""
    major_cities = [
        {'name': 'Mumbai', 'lat': 19.0760, 'lng': 72.8777},
        {'name': 'Delhi', 'lat': 28.6139, 'lng': 77.2090},
        {'name': 'Bangalore', 'lat': 12.9716, 'lng': 77.5946},
        {'name': 'Chennai', 'lat': 13.0827, 'lng': 80.2707},
        {'name': 'Kolkata', 'lat': 22.5726, 'lng': 88.3639},
        {'name': 'Hyderabad', 'lat': 17.3850, 'lng': 78.4867},
        {'name': 'Pune', 'lat': 18.5204, 'lng': 73.8567},
        {'name': 'Ahmedabad', 'lat': 23.0225, 'lng': 72.5714},
        {'name': 'Jaipur', 'lat': 26.9124, 'lng': 75.7873},
        {'name': 'Surat', 'lat': 21.1702, 'lng': 72.8311},
        {'name': 'Nagpur', 'lat': 21.1458, 'lng': 79.0882},
        {'name': 'Indore', 'lat': 22.7196, 'lng': 75.8577},
        {'name': 'Bhopal', 'lat': 23.2599, 'lng': 77.4126},
        {'name': 'Aurangabad', 'lat': 19.8762, 'lng': 75.3433}  # Good for Pune-Nagpur route
    ]
    
    min_distance = float('inf')
    nearest_city = "Central India"
    
    for city in major_cities:
        # Calculate approximate distance using Haversine formula (simplified)
        dlat = lat - city['lat']
        dlng = lng - city['lng']
        distance = (dlat**2 + dlng**2)**0.5  # Simplified distance calculation
        
        if distance < min_distance:
            min_distance = distance
            nearest_city = f"Near {city['name']}"
    
    return nearest_city

def calculate_real_midpoint_with_google_maps(origin_coords, dest_coords, google_maps_api_key=None):
    """Calculate real midpoint using Google Maps API"""
    try:
        import requests
        
        if not google_maps_api_key:
            return None
            
        # Calculate geometric midpoint
        lat1, lng1 = origin_coords['lat'], origin_coords['lng']
        lat2, lng2 = dest_coords['lat'], dest_coords['lng']
        
        mid_lat = (lat1 + lat2) / 2
        mid_lng = (lng1 + lng2) / 2
        
        # Use Google Maps Geocoding API to find nearest place
        geocoding_url = f"https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            'latlng': f"{mid_lat},{mid_lng}",
            'key': google_maps_api_key,
            'result_type': 'locality|administrative_area_level_3|administrative_area_level_2'
        }
        
        response = requests.get(geocoding_url, params=params)
        if response.status_code == 200:
            data = response.json()
            if data['results']:
                nearest_place = data['results'][0]['formatted_address']
                return {
                    'name': nearest_place,
                    'lat': mid_lat,
                    'lng': mid_lng,
                    'description': f"Midpoint: {nearest_place}"
                }
        
        return {
            'name': f"Coordinates: {mid_lat:.4f}, {mid_lng:.4f}",
            'lat': mid_lat,
            'lng': mid_lng,
            'description': f"Geographic midpoint"
        }
        
    except Exception as e:
        print(f"Error with Google Maps API: {e}")
        return None

# Initialize data files
init_data_files()

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "🚛 India Cargo Exchange Platform API",
        "version": "1.0.0",
        "status": "running",
        "storage": "Local JSON Files",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "auth": {
                "/auth/register": "POST - Register new user",
                "/auth/login": "POST - User login"
            },
            "cargo": {
                "/cargo/create": "POST - Create cargo listing",
                "/cargo/list": "GET - List all cargo",
                "/cargo/<id>": "GET - Get specific cargo"
            },
            "matching": {
                "/matching/find": "POST - Find compatible matches",
                "/matching/accept": "POST - Accept a match"
            },
            "cities": {
                "/cities/india": "GET - Get Indian cities list"
            }
        }
    })

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields - match frontend field names
        required_fields = ['name', 'email', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Read existing users
        users = read_json_file(USERS_FILE)
        
        # Check if user already exists
        for user in users:
            if user['email'] == data['email']:
                return jsonify({"error": "Email already registered"}), 400
        
        # Create new user
        new_user = {
            'id': str(uuid.uuid4()),
            'name': data['name'],  # Frontend sends 'name', not 'username'
            'email': data['email'],
            'password': data['password'],  # In production, hash this!
            'company_name': data.get('company_name', ''),
            'phone': data.get('phone', ''),
            'user_type': data.get('user_type', 'shipper'),
            'is_verified': False,
            'created_at': datetime.now().isoformat()
        }
        
        users.append(new_user)
        write_json_file(USERS_FILE, users)
        
        # Generate a simple token (user ID for demo)
        token = new_user['id']
        
        return jsonify({
            "message": "User registered successfully",
            "user": {
                "id": new_user['id'],
                "name": new_user['name'],
                "email": new_user['email'],
                "company_name": new_user['company_name'],
                "user_type": new_user['user_type']
            },
            "access_token": token
        }), 201
        
    except Exception as e:
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({"error": "Email and password required"}), 400
        
        users = read_json_file(USERS_FILE)
        
        # Find user and check password
        user = None
        for u in users:
            if u['email'] == data['email'] and u.get('password') == data['password']:
                user = u
                break
        
        if user:
            # Generate token (user ID for demo)
            token = user['id']
            
            return jsonify({
                "message": "Login successful",
                "user": {
                    "id": user['id'],
                    "name": user['name'],
                    "email": user['email'],
                    "company_name": user.get('company_name', ''),
                    "user_type": user.get('user_type', 'shipper')
                },
                "access_token": token
            })
        else:
            return jsonify({"error": "Invalid email or password"}), 401
            
    except Exception as e:
        return jsonify({"error": f"Login failed: {str(e)}"}), 500

@app.route('/api/auth/profile', methods=['GET'])
def get_profile():
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "No token provided"}), 401
        
        token = auth_header.split(' ')[1]
        users = read_json_file(USERS_FILE)
        
        # Find user by token (token is user ID in our simple implementation)
        user = None
        for u in users:
            if u['id'] == token:
                user = u
                break
        
        if user:
            return jsonify({
                "user": {
                    "id": user['id'],
                    "name": user['name'],
                    "email": user['email'],
                    "company_name": user.get('company_name', ''),
                    "user_type": user.get('user_type', 'shipper')
                }
            })
        else:
            return jsonify({"error": "Invalid token"}), 401
            
    except Exception as e:
        return jsonify({"error": f"Profile fetch failed: {str(e)}"}), 500

@app.route('/api/cargo', methods=['POST'])
def create_cargo():
    try:
        data = request.get_json()
        
        # Validate required fields (match frontend field names)
        required_fields = ['cargo_type', 'origin', 'destination', 'weight', 'pickup_date', 'delivery_date', 'budget']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Read existing cargo listings
        cargo_listings = read_json_file(CARGO_FILE)
        
        # Create new cargo listing (match frontend field names)
        new_cargo = {
            'id': str(uuid.uuid4()),
            'user_id': data.get('user_id', 'anonymous'),
            'cargo_type': data['cargo_type'],
            'origin': data['origin'],
            'destination': data['destination'],
            'origin_coords': data.get('origin_coords'),
            'destination_coords': data.get('destination_coords'),
            'weight': float(data['weight']),
            'volume': float(data.get('volume', 0)),
            'special_requirements': data.get('special_requirements', ''),
            'pickup_date': data['pickup_date'],
            'delivery_date': data['delivery_date'],
            'budget': float(data['budget']),
            'status': 'active',
            'created_at': datetime.now().isoformat()
        }
        
        cargo_listings.append(new_cargo)
        write_json_file(CARGO_FILE, cargo_listings)
        
        return jsonify({
            "message": "Cargo listing created successfully",
            "cargo": new_cargo
        }), 201
        
    except Exception as e:
        return jsonify({"error": f"Failed to create cargo listing: {str(e)}"}), 500

@app.route('/cargo/list', methods=['GET'])
def list_cargo():
    try:
        # Get query parameters
        status = request.args.get('status', 'active')
        cargo_type = request.args.get('cargo_type')
        origin_city = request.args.get('origin_city')
        destination_city = request.args.get('destination_city')
        
        cargo_listings = read_json_file(CARGO_FILE)
        
        # Filter cargo listings
        filtered_listings = []
        for cargo in cargo_listings:
            if status and cargo.get('status') != status:
                continue
            if cargo_type and cargo.get('cargo_type') != cargo_type:
                continue
            if origin_city and cargo.get('origin_city') != origin_city:
                continue
            if destination_city and cargo.get('destination_city') != destination_city:
                continue
            filtered_listings.append(cargo)
        
        return jsonify({
            "cargo_listings": filtered_listings,
            "total": len(filtered_listings)
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to fetch cargo listings: {str(e)}"}), 500

@app.route('/cargo/<cargo_id>', methods=['GET'])
def get_cargo(cargo_id):
    try:
        cargo_listings = read_json_file(CARGO_FILE)
        
        # Find cargo by ID
        cargo = None
        for c in cargo_listings:
            if c['id'] == cargo_id:
                cargo = c
                break
        
        if not cargo:
            return jsonify({"error": "Cargo listing not found"}), 404
        
        return jsonify({
            "cargo": cargo
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to fetch cargo: {str(e)}"}), 500

# New API endpoints for frontend compatibility
@app.route('/api/cargo', methods=['GET'])
def api_get_cargo():
    try:
        cargo_listings = read_json_file(CARGO_FILE)
        return jsonify(cargo_listings)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch cargo: {str(e)}"}), 500

@app.route('/api/cargo/<cargo_id>', methods=['GET'])
def api_get_cargo_by_id(cargo_id):
    try:
        cargo_listings = read_json_file(CARGO_FILE)
        cargo = next((c for c in cargo_listings if c['id'] == cargo_id), None)
        if cargo:
            return jsonify(cargo)
        else:
            return jsonify({"error": "Cargo not found"}), 404
    except Exception as e:
        return jsonify({"error": f"Failed to fetch cargo: {str(e)}"}), 500

@app.route('/api/matches', methods=['GET'])
def api_get_matches():
    try:
        # Find matches between cargo listings (A→C and C→A pattern)
        cargo_listings = read_json_file(CARGO_FILE)
        matches = []
        
        for i, cargo1 in enumerate(cargo_listings):
            for j, cargo2 in enumerate(cargo_listings):
                if i >= j:  # Avoid duplicates and self-matching
                    continue
                
                # Check if it's an A→C and C→A pattern
                if (cargo1['origin'] == cargo2['destination'] and 
                    cargo1['destination'] == cargo2['origin']):
                    
                    # Calculate potential savings (simple estimation)
                    avg_budget = (cargo1['budget'] + cargo2['budget']) / 2
                    cost_savings = avg_budget * 0.3  # 30% savings estimation
                    
                    # Determine optimal exchange point using coordinates if available
                    origin_coords = cargo1.get('origin_coords')
                    dest_coords = cargo1.get('destination_coords')
                    exchange_point = get_optimal_exchange_point(
                        cargo1['origin'], 
                        cargo1['destination'],
                        origin_coords,
                        dest_coords
                    )
                    
                    match = {
                        'id': len(matches) + 1,
                        'cargo1_id': cargo1['id'],
                        'cargo2_id': cargo2['id'],
                        'cargo1_route': f"{cargo1['origin']} → {cargo1['destination']}",
                        'cargo2_route': f"{cargo2['origin']} → {cargo2['destination']}",
                        'exchange_point': exchange_point,
                        'cost_savings': round(cost_savings),
                        'compatibility_score': 85,  # Mock score
                        'status': 'pending',
                        'created_at': cargo1['created_at']
                    }
                    matches.append(match)
        
        return jsonify(matches)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch matches: {str(e)}"}), 500

@app.route('/api/find-matches', methods=['POST'])
def api_find_matches():
    try:
        # This endpoint is called when user clicks "Find New Matches"
        # We'll just return the existing matches for now
        cargo_listings = read_json_file(CARGO_FILE)
        matches_found = 0
        
        # Count potential matches
        for i, cargo1 in enumerate(cargo_listings):
            for j, cargo2 in enumerate(cargo_listings):
                if i >= j:
                    continue
                if (cargo1['origin'] == cargo2['destination'] and 
                    cargo1['destination'] == cargo2['origin']):
                    matches_found += 1
        
        return jsonify({
            "message": f"Found {matches_found} new matches!",
            "matches_found": matches_found
        })
    except Exception as e:
        return jsonify({"error": f"Failed to find matches: {str(e)}"}), 500

@app.route('/api/optimize-route', methods=['POST'])
def api_optimize_route():
    try:
        data = request.get_json()
        
        # Extract route data
        origin = data.get('origin')
        destination = data.get('destination')
        origin_coords = data.get('origin_coords')
        dest_coords = data.get('destination_coords')
        cargo_weight = float(data.get('cargo_weight', 1000))
        vehicle_type = data.get('vehicle_type', 'truck')
        fuel_efficiency = float(data.get('fuel_efficiency', 6))
        
        if not origin or not destination:
            return jsonify({"error": "Origin and destination required"}), 400
        
        # Calculate distance and costs
        if origin_coords and dest_coords:
            # Calculate distance using coordinates (Haversine formula - simplified)
            lat1, lng1 = origin_coords['lat'], origin_coords['lng']
            lat2, lng2 = dest_coords['lat'], dest_coords['lng']
            
            # Simplified distance calculation (in km)
            dlat = lat2 - lat1
            dlng = lng2 - lng1
            distance = ((dlat * 111)**2 + (dlng * 111 * 0.8)**2)**0.5  # Approximate km
        else:
            # Fallback distance estimation
            distance = 500  # Default estimate
        
        # Calculate costs (Indian rates)
        fuel_cost = (distance / fuel_efficiency) * 95  # ₹95 per liter diesel
        toll_cost = distance * 2.5  # ₹2.5 per km average toll
        driver_cost = distance * 8  # ₹8 per km driver cost
        total_cost = fuel_cost + toll_cost + driver_cost
        
        # Calculate estimated time
        avg_speed = 50  # km/h average including stops
        estimated_hours = distance / avg_speed
        estimated_time = f"{int(estimated_hours)}h {int((estimated_hours % 1) * 60)}m"
        
        optimization_result = {
            "route": f"{origin} → {destination}",
            "distance": round(distance, 1),
            "estimated_time": estimated_time,
            "fuel_cost": round(fuel_cost),
            "toll_cost": round(toll_cost),
            "driver_cost": round(driver_cost),
            "total_cost": round(total_cost),
            "recommendations": [
                "Consider travel during off-peak hours to avoid traffic",
                "Plan fuel stops at competitive stations",
                "Check for alternate routes to avoid heavy traffic",
                f"Vehicle type '{vehicle_type}' is suitable for {cargo_weight}kg cargo"
            ]
        }
        
        return jsonify(optimization_result)
        
    except Exception as e:
        return jsonify({"error": f"Route optimization failed: {str(e)}"}), 500

@app.route('/api/find-exchange-point', methods=['POST'])
def api_find_exchange_point():
    try:
        data = request.get_json()
        
        route1 = data.get('route1', {})
        route2 = data.get('route2', {})
        
        origin1 = route1.get('origin')
        dest1 = route1.get('destination')
        origin1_coords = route1.get('origin_coords')
        dest1_coords = route1.get('destination_coords')
        
        origin2 = route2.get('origin')
        dest2 = route2.get('destination')
        origin2_coords = route2.get('origin_coords')
        dest2_coords = route2.get('destination_coords')
        
        if not all([origin1, dest1, origin2, dest2]):
            return jsonify({"error": "Both routes must have origin and destination"}), 400
        
        # Find optimal exchange point
        if origin1_coords and dest1_coords and origin2_coords and dest2_coords:
            # Calculate midpoint of route 1
            mid1_lat = (origin1_coords['lat'] + dest1_coords['lat']) / 2
            mid1_lng = (origin1_coords['lng'] + dest1_coords['lng']) / 2
            
            # Calculate midpoint of route 2  
            mid2_lat = (origin2_coords['lat'] + dest2_coords['lat']) / 2
            mid2_lng = (origin2_coords['lng'] + dest2_coords['lng']) / 2
            
            # Find exchange point (midpoint between route midpoints)
            exchange_lat = (mid1_lat + mid2_lat) / 2
            exchange_lng = (mid1_lng + mid2_lng) / 2
            
            nearest_city = find_nearest_major_city(exchange_lat, exchange_lng)
            exchange_point = f"{nearest_city} ({exchange_lat:.2f}°N, {exchange_lng:.2f}°E)"
            
            # Calculate potential savings (30% of average costs)
            avg_cost = 15000  # Estimated average route cost
            cost_savings = avg_cost * 0.3
        else:
            # Fallback to predefined exchange points
            exchange_point = get_optimal_exchange_point(origin1, dest1, origin1_coords, dest1_coords)
            cost_savings = 5000  # Default savings
        
        result = {
            "route1": f"{origin1} → {dest1}",
            "route2": f"{origin2} → {dest2}", 
            "exchange_point": exchange_point,
            "cost_savings": round(cost_savings),
            "recommendations": [
                "Both parties meet at the exchange point",
                "Swap cargo containers/packages",
                "Continue to respective final destinations",
                "Coordinate timing for simultaneous arrival"
            ]
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": f"Exchange point calculation failed: {str(e)}"}), 500

@app.route('/matching/find', methods=['POST'])
def find_matches():
    try:
        data = request.get_json()
        cargo_id = data.get('cargo_id')
        
        if not cargo_id:
            return jsonify({"error": "Cargo ID required"}), 400
        
        cargo_listings = read_json_file(CARGO_FILE)
        
        # Find the target cargo
        target_cargo = None
        for cargo in cargo_listings:
            if cargo['id'] == cargo_id:
                target_cargo = cargo
                break
        
        if not target_cargo:
            return jsonify({"error": "Cargo listing not found"}), 404
        
        # Simple matching logic
        compatible_matches = []
        for cargo in cargo_listings:
            if cargo['id'] != cargo_id and cargo.get('status') == 'active':
                # Check for A→C and C→A pattern
                if (cargo['origin_city'] == target_cargo['destination_city'] and 
                    cargo['destination_city'] == target_cargo['origin_city']):
                    
                    # Calculate compatibility score
                    compatibility_score = 85  # High score for perfect route match
                    
                    # Add cargo type compatibility
                    if cargo['cargo_type'] == target_cargo['cargo_type']:
                        compatibility_score += 10
                    
                    # Add weight compatibility
                    weight_diff = abs(float(cargo['weight']) - float(target_cargo['weight']))
                    if weight_diff <= 1:  # Within 1 ton
                        compatibility_score += 5
                    
                    match_data = {
                        'cargo_listing': cargo,
                        'compatibility_score': min(compatibility_score, 100),
                        'exchange_points': [
                            {
                                'city': 'Jaipur',
                                'state': 'Rajasthan',
                                'lat': 26.9124,
                                'lng': 75.7873,
                                'score': 90,
                                'type': 'midpoint'
                            }
                        ],
                        'cost_savings': {
                            'original_cost': 15000,
                            'new_cost': 9000,
                            'savings': 6000,
                            'savings_percentage': 40
                        },
                        'match_id': f"{target_cargo['id']}_{cargo['id']}"
                    }
                    
                    compatible_matches.append(match_data)
        
        return jsonify({
            "cargo": target_cargo,
            "matches": compatible_matches,
            "total_matches": len(compatible_matches)
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to find matches: {str(e)}"}), 500

@app.route('/matching/accept', methods=['POST'])
def accept_match():
    try:
        data = request.get_json()
        
        cargo_id_1 = data.get('cargo_id_1')
        cargo_id_2 = data.get('cargo_id_2')
        exchange_point = data.get('exchange_point', {})
        
        if not all([cargo_id_1, cargo_id_2]):
            return jsonify({"error": "Both cargo IDs required"}), 400
        
        matches = read_json_file(MATCHES_FILE)
        
        # Create match record
        new_match = {
            'id': str(uuid.uuid4()),
            'cargo_listing_1_id': cargo_id_1,
            'cargo_listing_2_id': cargo_id_2,
            'exchange_point': exchange_point,
            'status': 'accepted',
            'created_at': datetime.now().isoformat()
        }
        
        matches.append(new_match)
        write_json_file(MATCHES_FILE, matches)
        
        # Update cargo status
        cargo_listings = read_json_file(CARGO_FILE)
        for cargo in cargo_listings:
            if cargo['id'] in [cargo_id_1, cargo_id_2]:
                cargo['status'] = 'matched'
        
        write_json_file(CARGO_FILE, cargo_listings)
        
        return jsonify({
            "message": "Match accepted successfully",
            "match": new_match
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to accept match: {str(e)}"}), 500

@app.route('/cities/india', methods=['GET'])
def get_indian_cities():
    cities = [
        {'city_name': 'Mumbai', 'state': 'Maharashtra', 'latitude': 19.0760, 'longitude': 72.8777, 'is_major_city': True},
        {'city_name': 'Delhi', 'state': 'Delhi', 'latitude': 28.7041, 'longitude': 77.1025, 'is_major_city': True},
        {'city_name': 'Bangalore', 'state': 'Karnataka', 'latitude': 12.9716, 'longitude': 77.5946, 'is_major_city': True},
        {'city_name': 'Chennai', 'state': 'Tamil Nadu', 'latitude': 13.0827, 'longitude': 80.2707, 'is_major_city': True},
        {'city_name': 'Kolkata', 'state': 'West Bengal', 'latitude': 22.5726, 'longitude': 88.3639, 'is_major_city': True},
        {'city_name': 'Hyderabad', 'state': 'Telangana', 'latitude': 17.3850, 'longitude': 78.4867, 'is_major_city': True},
        {'city_name': 'Pune', 'state': 'Maharashtra', 'latitude': 18.5204, 'longitude': 73.8567, 'is_major_city': True},
        {'city_name': 'Ahmedabad', 'state': 'Gujarat', 'latitude': 23.0225, 'longitude': 72.5714, 'is_major_city': True},
        {'city_name': 'Jaipur', 'state': 'Rajasthan', 'latitude': 26.9124, 'longitude': 75.7873, 'is_major_city': True},
        {'city_name': 'Lucknow', 'state': 'Uttar Pradesh', 'latitude': 26.8467, 'longitude': 80.9462, 'is_major_city': True},
        {'city_name': 'Kanpur', 'state': 'Uttar Pradesh', 'latitude': 26.4499, 'longitude': 80.3319, 'is_major_city': False},
        {'city_name': 'Nagpur', 'state': 'Maharashtra', 'latitude': 21.1458, 'longitude': 79.0882, 'is_major_city': False},
        {'city_name': 'Indore', 'state': 'Madhya Pradesh', 'latitude': 22.7196, 'longitude': 75.8577, 'is_major_city': False},
        {'city_name': 'Thane', 'state': 'Maharashtra', 'latitude': 19.2183, 'longitude': 72.9781, 'is_major_city': False},
        {'city_name': 'Bhopal', 'state': 'Madhya Pradesh', 'latitude': 23.2599, 'longitude': 77.4126, 'is_major_city': False},
        {'city_name': 'Visakhapatnam', 'state': 'Andhra Pradesh', 'latitude': 17.6868, 'longitude': 83.2185, 'is_major_city': False},
        {'city_name': 'Patna', 'state': 'Bihar', 'latitude': 25.5941, 'longitude': 85.1376, 'is_major_city': False},
        {'city_name': 'Vadodara', 'state': 'Gujarat', 'latitude': 22.3072, 'longitude': 73.1812, 'is_major_city': False},
        {'city_name': 'Ghaziabad', 'state': 'Uttar Pradesh', 'latitude': 28.6692, 'longitude': 77.4538, 'is_major_city': False},
        {'city_name': 'Ludhiana', 'state': 'Punjab', 'latitude': 30.9010, 'longitude': 75.8573, 'is_major_city': False}
    ]
    
    return jsonify({
        "cities": cities,
        "total": len(cities)
    })

@app.route('/health', methods=['GET'])
def health_check():
    try:
        users_count = len(read_json_file(USERS_FILE))
        cargo_count = len(read_json_file(CARGO_FILE))
        matches_count = len(read_json_file(MATCHES_FILE))
        
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0",
            "storage": "Local JSON Files",
            "data": {
                "users_count": users_count,
                "cargo_count": cargo_count,
                "matches_count": matches_count
            }
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 India Cargo Exchange Platform Starting...")
    print("📊 Using Local JSON File Storage (No Database Required)")
    print("🌐 API endpoints available at http://localhost:5000")
    print("📖 API documentation available at http://localhost:5000/")
    print("📁 Data stored in: ./local_data/")
    print("💡 This version works completely offline!")
    
    app.run(debug=True, host='0.0.0.0', port=5000) 