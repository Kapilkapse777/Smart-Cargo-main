import googlemaps
import numpy as np
import pandas as pd
from geopy.distance import geodesic
from geopy.geocoders import Nominatim
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import requests
import json
from datetime import datetime, timedelta
from config import Config

class RouteOptimizer:
    def __init__(self):
        self.gmaps = googlemaps.Client(key=Config.GOOGLE_MAPS_API_KEY)
        self.geolocator = Nominatim(user_agent="cargo_exchange")
        
    def get_coordinates(self, city, state):
        """Get coordinates for a city using geocoding"""
        try:
            # Try with city and state
            location = self.geolocator.geocode(f"{city}, {state}, India")
            if location:
                return location.latitude, location.longitude
            
            # Try with just city
            location = self.geolocator.geocode(f"{city}, India")
            if location:
                return location.latitude, location.longitude
                
            return None, None
        except Exception as e:
            print(f"Error geocoding {city}, {state}: {e}")
            return None, None
    
    def calculate_distance(self, origin, destination):
        """Calculate distance between two points using Google Maps API"""
        try:
            result = self.gmaps.distance_matrix(
                origins=[origin],
                destinations=[destination],
                mode="driving",
                units="metric"
            )
            
            if result['rows'][0]['elements'][0]['status'] == 'OK':
                distance = result['rows'][0]['elements'][0]['distance']['value'] / 1000  # Convert to km
                duration = result['rows'][0]['elements'][0]['duration']['value'] / 60  # Convert to minutes
                return distance, duration
            return None, None
        except Exception as e:
            print(f"Error calculating distance: {e}")
            return None, None
    
    def find_exchange_points(self, route1_origin, route1_dest, route2_origin, route2_dest):
        """Find optimal exchange points between two routes"""
        try:
            # Get coordinates for all points
            coords = {}
            for point in [route1_origin, route1_dest, route2_origin, route2_dest]:
                lat, lng = self.get_coordinates(point['city'], point['state'])
                coords[point['city']] = {'lat': lat, 'lng': lng}
            
            # Calculate midpoint between origins and destinations
            origin_midpoint = self._calculate_midpoint(
                coords[route1_origin['city']], 
                coords[route2_origin['city']]
            )
            
            dest_midpoint = self._calculate_midpoint(
                coords[route1_dest['city']], 
                coords[route2_dest['city']]
            )
            
            # Find cities near the midpoints
            exchange_points = []
            
            # Search for cities near origin midpoint
            origin_cities = self._find_nearby_cities(origin_midpoint, radius_km=50)
            for city in origin_cities:
                score = self._calculate_exchange_score(
                    coords[route1_origin['city']], 
                    coords[route2_origin['city']], 
                    city
                )
                exchange_points.append({
                    'city': city['name'],
                    'state': city['state'],
                    'lat': city['lat'],
                    'lng': city['lng'],
                    'score': score,
                    'type': 'origin_midpoint'
                })
            
            # Search for cities near destination midpoint
            dest_cities = self._find_nearby_cities(dest_midpoint, radius_km=50)
            for city in dest_cities:
                score = self._calculate_exchange_score(
                    coords[route1_dest['city']], 
                    coords[route2_dest['city']], 
                    city
                )
                exchange_points.append({
                    'city': city['name'],
                    'state': city['state'],
                    'lat': city['lat'],
                    'lng': city['lng'],
                    'score': score,
                    'type': 'destination_midpoint'
                })
            
            # Sort by score and return top candidates
            exchange_points.sort(key=lambda x: x['score'], reverse=True)
            return exchange_points[:5]
            
        except Exception as e:
            print(f"Error finding exchange points: {e}")
            return []
    
    def _calculate_midpoint(self, point1, point2):
        """Calculate midpoint between two coordinates"""
        return {
            'lat': (point1['lat'] + point2['lat']) / 2,
            'lng': (point1['lng'] + point2['lng']) / 2
        }
    
    def _find_nearby_cities(self, center_point, radius_km=50):
        """Find cities within radius of center point"""
        # This would typically query a database of Indian cities
        # For now, return some major cities near the center
        major_cities = [
            {'name': 'Mumbai', 'state': 'Maharashtra', 'lat': 19.0760, 'lng': 72.8777},
            {'name': 'Delhi', 'state': 'Delhi', 'lat': 28.7041, 'lng': 77.1025},
            {'name': 'Bangalore', 'state': 'Karnataka', 'lat': 12.9716, 'lng': 77.5946},
            {'name': 'Chennai', 'state': 'Tamil Nadu', 'lat': 13.0827, 'lng': 80.2707},
            {'name': 'Kolkata', 'state': 'West Bengal', 'lat': 22.5726, 'lng': 88.3639},
            {'name': 'Hyderabad', 'state': 'Telangana', 'lat': 17.3850, 'lng': 78.4867},
            {'name': 'Pune', 'state': 'Maharashtra', 'lat': 18.5204, 'lng': 73.8567},
            {'name': 'Ahmedabad', 'state': 'Gujarat', 'lat': 23.0225, 'lng': 72.5714},
            {'name': 'Jaipur', 'state': 'Rajasthan', 'lat': 26.9124, 'lng': 75.7873},
            {'name': 'Lucknow', 'state': 'Uttar Pradesh', 'lat': 26.8467, 'lng': 80.9462}
        ]
        
        nearby_cities = []
        for city in major_cities:
            distance = geodesic(
                (center_point['lat'], center_point['lng']),
                (city['lat'], city['lng'])
            ).kilometers
            
            if distance <= radius_km:
                nearby_cities.append(city)
        
        return nearby_cities
    
    def _calculate_exchange_score(self, point1, point2, exchange_point):
        """Calculate score for an exchange point based on various factors"""
        try:
            # Calculate distances
            dist1 = geodesic(
                (point1['lat'], point1['lng']),
                (exchange_point['lat'], exchange_point['lng'])
            ).kilometers
            
            dist2 = geodesic(
                (point2['lat'], point2['lng']),
                (exchange_point['lat'], exchange_point['lng'])
            ).kilometers
            
            # Calculate balance score (closer to equal distances is better)
            balance_score = 1 - abs(dist1 - dist2) / max(dist1, dist2)
            
            # Calculate accessibility score (shorter total distance is better)
            total_distance = dist1 + dist2
            accessibility_score = 1 / (1 + total_distance / 100)  # Normalize to 0-1
            
            # Population factor (major cities get bonus)
            population_score = 1.2 if exchange_point['name'] in [
                'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'
            ] else 1.0
            
            # Final score
            final_score = (balance_score * 0.4 + accessibility_score * 0.4 + population_score * 0.2) * 100
            
            return final_score
            
        except Exception as e:
            print(f"Error calculating exchange score: {e}")
            return 0
    
    def calculate_cost_savings(self, original_route1, original_route2, new_route1, new_route2):
        """Calculate cost savings from route optimization"""
        try:
            # Original costs
            original_total = original_route1['cost'] + original_route2['cost']
            
            # New costs
            new_total = new_route1['cost'] + new_route2['cost']
            
            # Calculate savings
            savings = original_total - new_total
            savings_percentage = (savings / original_total) * 100 if original_total > 0 else 0
            
            return {
                'original_cost': original_total,
                'new_cost': new_total,
                'savings': savings,
                'savings_percentage': savings_percentage
            }
        except Exception as e:
            print(f"Error calculating cost savings: {e}")
            return None
    
    def estimate_fuel_cost(self, distance_km, fuel_type='Diesel'):
        """Estimate fuel cost for a given distance"""
        try:
            # Average fuel efficiency (km/liter)
            fuel_efficiency = {
                'Petrol': 12,  # km/liter
                'Diesel': 8    # km/liter
            }
            
            # Current fuel prices (INR/liter)
            fuel_prices = Config.FUEL_PRICES
            
            # Calculate fuel consumption
            fuel_consumed = distance_km / fuel_efficiency.get(fuel_type, 8)
            
            # Calculate cost
            fuel_cost = fuel_consumed * fuel_prices.get(fuel_type, 89.0)
            
            return fuel_cost
        except Exception as e:
            print(f"Error estimating fuel cost: {e}")
            return 0
    
    def estimate_toll_charges(self, distance_km, vehicle_type='truck'):
        """Estimate toll charges for a given distance"""
        try:
            # Toll rates per km (INR)
            toll_rates = Config.TOLL_RATES
            
            # Calculate toll charges
            toll_charges = distance_km * toll_rates.get(vehicle_type, 1.0)
            
            return toll_charges
        except Exception as e:
            print(f"Error estimating toll charges: {e}")
            return 0
    
    def get_route_details(self, origin, destination):
        """Get detailed route information including costs"""
        try:
            # Get distance and duration
            distance, duration = self.calculate_distance(origin, destination)
            
            if distance is None:
                return None
            
            # Calculate costs
            fuel_cost = self.estimate_fuel_cost(distance)
            toll_charges = self.estimate_toll_charges(distance)
            
            # Labor cost (driver salary per hour)
            labor_cost_per_hour = 200  # INR
            labor_cost = (duration / 60) * labor_cost_per_hour
            
            # Total cost
            total_cost = fuel_cost + toll_charges + labor_cost
            
            return {
                'distance': distance,
                'duration': duration,
                'fuel_cost': fuel_cost,
                'toll_charges': toll_charges,
                'labor_cost': labor_cost,
                'total_cost': total_cost
            }
        except Exception as e:
            print(f"Error getting route details: {e}")
            return None 