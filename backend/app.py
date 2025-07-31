from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import config
from models.database import db, User, CargoListing, CargoMatch, Vehicle, IndianCity, RouteCache
from utils.matching_engine import MatchingEngine
from utils.route_optimizer import RouteOptimizer

app = Flask(__name__)
app.config.from_object(config['development'])

# Initialize extensions
CORS(app)
jwt = JWTManager(app)
db.init_app(app)

# Initialize engines
matching_engine = MatchingEngine()
route_optimizer = RouteOptimizer()

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "🚛 India Cargo Exchange Platform API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "auth": {
                "/auth/register": "POST - Register new user",
                "/auth/login": "POST - User login",
                "/auth/profile": "GET - Get user profile"
            },
            "cargo": {
                "/cargo/create": "POST - Create cargo listing",
                "/cargo/list": "GET - List all cargo",
                "/cargo/<id>": "GET - Get specific cargo",
                "/cargo/<id>/matches": "GET - Find matches for cargo"
            },
            "matching": {
                "/matching/find": "POST - Find compatible matches",
                "/matching/accept": "POST - Accept a match",
                "/matching/reject": "POST - Reject a match"
            },
            "routes": {
                "/routes/optimize": "POST - Optimize route",
                "/routes/cost": "POST - Calculate route cost",
                "/routes/exchange-points": "POST - Find exchange points"
            }
        }
    })

# Authentication endpoints
@app.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'company_name']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({"error": "Email already registered"}), 400
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({"error": "Username already taken"}), 400
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            company_name=data['company_name'],
            phone=data.get('phone'),
            address=data.get('address'),
            city=data.get('city'),
            state=data.get('state'),
            pincode=data.get('pincode'),
            user_type=data.get('user_type', 'transporter')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            "message": "User registered successfully",
            "user": user.to_dict(),
            "access_token": access_token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({"error": "Email and password required"}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if user and user.check_password(data['password']):
            access_token = create_access_token(identity=user.id)
            return jsonify({
                "message": "Login successful",
                "user": user.to_dict(),
                "access_token": access_token
            })
        else:
            return jsonify({"error": "Invalid email or password"}), 401
            
    except Exception as e:
        return jsonify({"error": f"Login failed: {str(e)}"}), 500

@app.route('/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "user": user.to_dict()
        })
        
    except Exception as e:
        return jsonify({"error": f"Error fetching profile: {str(e)}"}), 500

# Cargo listing endpoints
@app.route('/cargo/create', methods=['POST'])
@jwt_required()
def create_cargo():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'origin_city', 'origin_state', 'destination_city', 
                          'destination_state', 'cargo_type', 'weight', 'pickup_date', 'delivery_date']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Get coordinates for origin and destination
        origin_lat, origin_lng = route_optimizer.get_coordinates(data['origin_city'], data['origin_state'])
        dest_lat, dest_lng = route_optimizer.get_coordinates(data['destination_city'], data['destination_state'])
        
        # Create cargo listing
        cargo = CargoListing(
            user_id=user_id,
            title=data['title'],
            description=data.get('description'),
            origin_city=data['origin_city'],
            origin_state=data['origin_state'],
            origin_lat=origin_lat,
            origin_lng=origin_lng,
            destination_city=data['destination_city'],
            destination_state=data['destination_state'],
            destination_lat=dest_lat,
            destination_lng=dest_lng,
            cargo_type=data['cargo_type'],
            weight=float(data['weight']),
            dimensions=data.get('dimensions'),
            special_requirements=data.get('special_requirements'),
            pickup_date=datetime.strptime(data['pickup_date'], '%Y-%m-%d').date(),
            delivery_date=datetime.strptime(data['delivery_date'], '%Y-%m-%d').date(),
            budget=float(data.get('budget', 0)),
            price_per_km=float(data.get('price_per_km', 0))
        )
        
        db.session.add(cargo)
        db.session.commit()
        
        return jsonify({
            "message": "Cargo listing created successfully",
            "cargo": cargo.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to create cargo listing: {str(e)}"}), 500

@app.route('/cargo/list', methods=['GET'])
@jwt_required()
def list_cargo():
    try:
        # Get query parameters
        status = request.args.get('status', 'active')
        cargo_type = request.args.get('cargo_type')
        origin_city = request.args.get('origin_city')
        destination_city = request.args.get('destination_city')
        
        # Build query
        query = CargoListing.query
        
        if status:
            query = query.filter(CargoListing.status == status)
        if cargo_type:
            query = query.filter(CargoListing.cargo_type == cargo_type)
        if origin_city:
            query = query.filter(CargoListing.origin_city == origin_city)
        if destination_city:
            query = query.filter(CargoListing.destination_city == destination_city)
        
        # Get results
        cargo_listings = query.order_by(CargoListing.created_at.desc()).all()
        
        return jsonify({
            "cargo_listings": [cargo.to_dict() for cargo in cargo_listings],
            "total": len(cargo_listings)
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to fetch cargo listings: {str(e)}"}), 500

@app.route('/cargo/<cargo_id>', methods=['GET'])
@jwt_required()
def get_cargo(cargo_id):
    try:
        cargo = CargoListing.query.get(cargo_id)
        
        if not cargo:
            return jsonify({"error": "Cargo listing not found"}), 404
        
        return jsonify({
            "cargo": cargo.to_dict()
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to fetch cargo: {str(e)}"}), 500

@app.route('/cargo/<cargo_id>/matches', methods=['GET'])
@jwt_required()
def find_matches(cargo_id):
    try:
        cargo = CargoListing.query.get(cargo_id)
        
        if not cargo:
            return jsonify({"error": "Cargo listing not found"}), 404
        
        # Get all active cargo listings
        all_listings = CargoListing.query.filter_by(status='active').all()
        
        # Find compatible matches
        matches = matching_engine.find_compatible_matches(cargo, all_listings)
        
        return jsonify({
            "cargo_id": cargo_id,
            "matches": matches,
            "total_matches": len(matches)
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to find matches: {str(e)}"}), 500

# Matching endpoints
@app.route('/matching/find', methods=['POST'])
@jwt_required()
def find_compatible_matches():
    try:
        data = request.get_json()
        cargo_id = data.get('cargo_id')
        
        if not cargo_id:
            return jsonify({"error": "Cargo ID required"}), 400
        
        cargo = CargoListing.query.get(cargo_id)
        if not cargo:
            return jsonify({"error": "Cargo listing not found"}), 404
        
        # Get all active cargo listings
        all_listings = CargoListing.query.filter_by(status='active').all()
        
        # Find compatible matches
        matches = matching_engine.find_compatible_matches(cargo, all_listings)
        
        return jsonify({
            "cargo": cargo.to_dict(),
            "matches": matches,
            "total_matches": len(matches)
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to find matches: {str(e)}"}), 500

@app.route('/matching/accept', methods=['POST'])
@jwt_required()
def accept_match():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        cargo_id_1 = data.get('cargo_id_1')
        cargo_id_2 = data.get('cargo_id_2')
        exchange_point = data.get('exchange_point')
        
        if not all([cargo_id_1, cargo_id_2, exchange_point]):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Create cargo match
        cargo_match = CargoMatch(
            cargo_listing_1_id=cargo_id_1,
            cargo_listing_2_id=cargo_id_2,
            exchange_point_city=exchange_point['city'],
            exchange_point_state=exchange_point['state'],
            exchange_point_lat=exchange_point['lat'],
            exchange_point_lng=exchange_point['lng'],
            status='accepted'
        )
        
        # Update cargo listing statuses
        cargo1 = CargoListing.query.get(cargo_id_1)
        cargo2 = CargoListing.query.get(cargo_id_2)
        
        if cargo1 and cargo2:
            cargo1.status = 'matched'
            cargo2.status = 'matched'
        
        db.session.add(cargo_match)
        db.session.commit()
        
        return jsonify({
            "message": "Match accepted successfully",
            "match": cargo_match.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to accept match: {str(e)}"}), 500

# Route optimization endpoints
@app.route('/routes/optimize', methods=['POST'])
@jwt_required()
def optimize_route():
    try:
        data = request.get_json()
        origin = data.get('origin')
        destination = data.get('destination')
        
        if not origin or not destination:
            return jsonify({"error": "Origin and destination required"}), 400
        
        # Get route details
        route_details = route_optimizer.get_route_details(origin, destination)
        
        if not route_details:
            return jsonify({"error": "Could not calculate route"}), 400
        
        return jsonify({
            "origin": origin,
            "destination": destination,
            "route_details": route_details
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to optimize route: {str(e)}"}), 500

@app.route('/routes/exchange-points', methods=['POST'])
@jwt_required()
def find_exchange_points():
    try:
        data = request.get_json()
        
        route1_origin = data.get('route1_origin')
        route1_dest = data.get('route1_dest')
        route2_origin = data.get('route2_origin')
        route2_dest = data.get('route2_dest')
        
        if not all([route1_origin, route1_dest, route2_origin, route2_dest]):
            return jsonify({"error": "All route points required"}), 400
        
        # Find exchange points
        exchange_points = route_optimizer.find_exchange_points(
            route1_origin, route1_dest, route2_origin, route2_dest
        )
        
        return jsonify({
            "exchange_points": exchange_points,
            "total_points": len(exchange_points)
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to find exchange points: {str(e)}"}), 500

# Indian cities endpoint
@app.route('/cities/india', methods=['GET'])
def get_indian_cities():
    try:
        # Get query parameters
        state = request.args.get('state')
        major_only = request.args.get('major_only', 'false').lower() == 'true'
        
        query = IndianCity.query
        
        if state:
            query = query.filter(IndianCity.state == state)
        if major_only:
            query = query.filter(IndianCity.is_major_city == True)
        
        cities = query.all()
        
        return jsonify({
            "cities": [city.to_dict() for city in cities],
            "total": len(cities)
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to fetch cities: {str(e)}"}), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    })

if __name__ == '__main__':
    with app.app_context():
        # Create database tables
        db.create_all()
        
        print("🚀 India Cargo Exchange Platform Starting...")
        print("📊 Database tables created successfully")
        print("🌐 API endpoints available at http://localhost:5000")
        print("📖 API documentation available at http://localhost:5000/")
        
    app.run(debug=True, host='0.0.0.0', port=5000) 