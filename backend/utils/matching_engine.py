import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta
from geopy.distance import geodesic
from .route_optimizer import RouteOptimizer

class MatchingEngine:
    def __init__(self):
        self.route_optimizer = RouteOptimizer()
        self.scaler = StandardScaler()
        
    def find_compatible_matches(self, cargo_listing, all_listings, max_matches=10):
        """Find compatible cargo matches for a given listing"""
        try:
            compatible_matches = []
            
            for other_listing in all_listings:
                # Skip if same user or same listing
                if other_listing.id == cargo_listing.id or other_listing.user_id == cargo_listing.user_id:
                    continue
                
                # Check if routes are compatible for exchange
                if self._are_routes_compatible(cargo_listing, other_listing):
                    # Calculate compatibility score
                    compatibility_score = self._calculate_compatibility_score(cargo_listing, other_listing)
                    
                    if compatibility_score > 50:  # Minimum threshold
                        # Find optimal exchange points
                        exchange_points = self._find_optimal_exchange_points(cargo_listing, other_listing)
                        
                        if exchange_points:
                            # Calculate cost savings
                            cost_savings = self._calculate_cost_savings(cargo_listing, other_listing, exchange_points[0])
                            
                            match_data = {
                                'cargo_listing': other_listing.to_dict(),
                                'compatibility_score': compatibility_score,
                                'exchange_points': exchange_points,
                                'cost_savings': cost_savings,
                                'match_id': f"{cargo_listing.id}_{other_listing.id}"
                            }
                            
                            compatible_matches.append(match_data)
            
            # Sort by compatibility score and return top matches
            compatible_matches.sort(key=lambda x: x['compatibility_score'], reverse=True)
            return compatible_matches[:max_matches]
            
        except Exception as e:
            print(f"Error finding compatible matches: {e}")
            return []
    
    def _are_routes_compatible(self, listing1, listing2):
        """Check if two cargo routes are compatible for exchange"""
        try:
            # Check if routes are opposite (A->C and C->A pattern)
            route1_origin = f"{listing1.origin_city}, {listing1.origin_state}"
            route1_dest = f"{listing1.destination_city}, {listing1.destination_state}"
            route2_origin = f"{listing2.origin_city}, {listing2.origin_state}"
            route2_dest = f"{listing2.destination_city}, {listing2.destination_state}"
            
            # Check for A->C and C->A pattern
            if (route1_origin == route2_dest and route1_dest == route2_origin):
                return True
            
            # Check for partial compatibility (shared origin or destination)
            if (route1_origin == route2_origin or route1_dest == route2_dest):
                return True
            
            # Check for nearby cities (within 50km)
            if self._are_cities_nearby(listing1.origin_city, listing2.destination_city) and \
               self._are_cities_nearby(listing1.destination_city, listing2.origin_city):
                return True
            
            return False
            
        except Exception as e:
            print(f"Error checking route compatibility: {e}")
            return False
    
    def _are_cities_nearby(self, city1, city2, max_distance_km=50):
        """Check if two cities are nearby"""
        try:
            # Get coordinates for both cities
            coords1 = self.route_optimizer.get_coordinates(city1, "")
            coords2 = self.route_optimizer.get_coordinates(city2, "")
            
            if coords1[0] and coords2[0]:
                distance = geodesic(coords1, coords2).kilometers
                return distance <= max_distance_km
            
            return False
        except Exception as e:
            print(f"Error checking if cities are nearby: {e}")
            return False
    
    def _calculate_compatibility_score(self, listing1, listing2):
        """Calculate compatibility score between two cargo listings"""
        try:
            score = 0
            max_score = 100
            
            # 1. Route compatibility (40 points)
            route_score = self._calculate_route_compatibility(listing1, listing2)
            score += route_score * 0.4
            
            # 2. Cargo compatibility (30 points)
            cargo_score = self._calculate_cargo_compatibility(listing1, listing2)
            score += cargo_score * 0.3
            
            # 3. Timeline compatibility (20 points)
            timeline_score = self._calculate_timeline_compatibility(listing1, listing2)
            score += timeline_score * 0.2
            
            # 4. Budget compatibility (10 points)
            budget_score = self._calculate_budget_compatibility(listing1, listing2)
            score += budget_score * 0.1
            
            return min(score, max_score)
            
        except Exception as e:
            print(f"Error calculating compatibility score: {e}")
            return 0
    
    def _calculate_route_compatibility(self, listing1, listing2):
        """Calculate route compatibility score"""
        try:
            score = 0
            
            # Perfect match: A->C and C->A
            if (listing1.origin_city == listing2.destination_city and 
                listing1.destination_city == listing2.origin_city):
                score = 100
            # Partial match: shared origin or destination
            elif (listing1.origin_city == listing2.origin_city or 
                  listing1.destination_city == listing2.destination_city):
                score = 70
            # Nearby cities
            elif self._are_cities_nearby(listing1.origin_city, listing2.destination_city) and \
                 self._are_cities_nearby(listing1.destination_city, listing2.origin_city):
                score = 60
            else:
                score = 30
            
            return score
            
        except Exception as e:
            print(f"Error calculating route compatibility: {e}")
            return 0
    
    def _calculate_cargo_compatibility(self, listing1, listing2):
        """Calculate cargo compatibility score"""
        try:
            score = 0
            
            # Cargo type compatibility
            if listing1.cargo_type == listing2.cargo_type:
                score += 40
            elif self._are_cargo_types_compatible(listing1.cargo_type, listing2.cargo_type):
                score += 30
            else:
                score += 10
            
            # Weight compatibility
            weight_diff = abs(listing1.weight - listing2.weight)
            weight_ratio = min(listing1.weight, listing2.weight) / max(listing1.weight, listing2.weight)
            
            if weight_ratio > 0.8:  # Within 20% of each other
                score += 30
            elif weight_ratio > 0.6:  # Within 40% of each other
                score += 20
            else:
                score += 10
            
            # Special requirements compatibility
            if listing1.special_requirements == listing2.special_requirements:
                score += 30
            elif not listing1.special_requirements and not listing2.special_requirements:
                score += 20
            else:
                score += 10
            
            return min(score, 100)
            
        except Exception as e:
            print(f"Error calculating cargo compatibility: {e}")
            return 0
    
    def _are_cargo_types_compatible(self, type1, type2):
        """Check if cargo types are compatible"""
        compatible_groups = {
            'electronics': ['electronics', 'gadgets', 'appliances'],
            'textiles': ['textiles', 'clothing', 'fabrics'],
            'machinery': ['machinery', 'equipment', 'industrial'],
            'food': ['food', 'agriculture', 'perishables'],
            'chemicals': ['chemicals', 'pharmaceuticals', 'industrial']
        }
        
        for group, types in compatible_groups.items():
            if type1.lower() in types and type2.lower() in types:
                return True
        
        return False
    
    def _calculate_timeline_compatibility(self, listing1, listing2):
        """Calculate timeline compatibility score"""
        try:
            score = 0
            
            # Check pickup date compatibility
            pickup_diff = abs((listing1.pickup_date - listing2.pickup_date).days)
            if pickup_diff <= 1:
                score += 50
            elif pickup_diff <= 3:
                score += 30
            elif pickup_diff <= 7:
                score += 20
            else:
                score += 10
            
            # Check delivery date compatibility
            delivery_diff = abs((listing1.delivery_date - listing2.delivery_date).days)
            if delivery_diff <= 1:
                score += 50
            elif delivery_diff <= 3:
                score += 30
            elif delivery_diff <= 7:
                score += 20
            else:
                score += 10
            
            return min(score, 100)
            
        except Exception as e:
            print(f"Error calculating timeline compatibility: {e}")
            return 0
    
    def _calculate_budget_compatibility(self, listing1, listing2):
        """Calculate budget compatibility score"""
        try:
            score = 0
            
            if listing1.budget and listing2.budget:
                budget_diff = abs(listing1.budget - listing2.budget)
                budget_ratio = min(listing1.budget, listing2.budget) / max(listing1.budget, listing2.budget)
                
                if budget_ratio > 0.8:  # Within 20% of each other
                    score = 100
                elif budget_ratio > 0.6:  # Within 40% of each other
                    score = 70
                elif budget_ratio > 0.4:  # Within 60% of each other
                    score = 40
                else:
                    score = 20
            else:
                score = 50  # Neutral score if budget not specified
            
            return score
            
        except Exception as e:
            print(f"Error calculating budget compatibility: {e}")
            return 0
    
    def _find_optimal_exchange_points(self, listing1, listing2):
        """Find optimal exchange points for two cargo listings"""
        try:
            route1_origin = {
                'city': listing1.origin_city,
                'state': listing1.origin_state
            }
            route1_dest = {
                'city': listing1.destination_city,
                'state': listing1.destination_state
            }
            route2_origin = {
                'city': listing2.origin_city,
                'state': listing2.origin_state
            }
            route2_dest = {
                'city': listing2.destination_city,
                'state': listing2.destination_state
            }
            
            exchange_points = self.route_optimizer.find_exchange_points(
                route1_origin, route1_dest, route2_origin, route2_dest
            )
            
            return exchange_points
            
        except Exception as e:
            print(f"Error finding optimal exchange points: {e}")
            return []
    
    def _calculate_cost_savings(self, listing1, listing2, exchange_point):
        """Calculate cost savings from cargo exchange"""
        try:
            # Original routes
            original_route1 = self.route_optimizer.get_route_details(
                f"{listing1.origin_city}, {listing1.origin_state}",
                f"{listing1.destination_city}, {listing1.destination_state}"
            )
            
            original_route2 = self.route_optimizer.get_route_details(
                f"{listing2.origin_city}, {listing2.origin_state}",
                f"{listing2.destination_city}, {listing2.destination_state}"
            )
            
            # New routes via exchange point
            new_route1 = self.route_optimizer.get_route_details(
                f"{listing1.origin_city}, {listing1.origin_state}",
                f"{exchange_point['city']}, {exchange_point['state']}"
            )
            
            new_route2 = self.route_optimizer.get_route_details(
                f"{listing2.origin_city}, {listing2.origin_state}",
                f"{exchange_point['city']}, {exchange_point['state']}"
            )
            
            if all([original_route1, original_route2, new_route1, new_route2]):
                savings = self.route_optimizer.calculate_cost_savings(
                    original_route1, original_route2, new_route1, new_route2
                )
                return savings
            
            return None
            
        except Exception as e:
            print(f"Error calculating cost savings: {e}")
            return None 