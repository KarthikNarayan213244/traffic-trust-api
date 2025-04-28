
import asyncio
import datetime
import json
import logging
import random
from typing import List, Dict, Any
import uuid

from ..config import (
    VEHICLE_TYPES, LICENSE_PLATE_SERIES, get_traffic_volume_factor, 
    get_random_junction_location, generate_vehicle_id, get_random_name,
    VEHICLE_UPDATE_INTERVAL, get_timestamp_hours_ago
)

logger = logging.getLogger("traffic_simulator.vehicle_generator")

class VehicleGenerator:
    """Class to generate realistic vehicle data"""
    
    def __init__(self, db):
        self.db = db
        self.active_vehicles = {}  # Store currently active vehicles
        
    async def generate_historical_data(self, count: int = 10000) -> List[Dict[str, Any]]:
        """Generate historical vehicle data for the past 24 hours"""
        logger.info(f"Generating {count} historical vehicle records")
        
        vehicles = []
        
        # Create a set of unique vehicle IDs
        unique_vehicle_ids = set()
        
        # Generate unique vehicles first
        num_unique_vehicles = min(count // 10, 1000)  # Each vehicle will have ~10 records
        
        for _ in range(num_unique_vehicles):
            vehicle_id = generate_vehicle_id()
            unique_vehicle_ids.add(vehicle_id)
            
        # Convert to list for random.choices
        vehicle_id_list = list(unique_vehicle_ids)
        
        # Generate historical entries across 24 hours
        now = datetime.datetime.now()
        
        for i in range(count):
            # Random time in the last 24 hours
            hours_ago = random.uniform(0, 24)
            timestamp = now - datetime.timedelta(hours=hours_ago)
            
            # Traffic volume affects how many vehicles are active
            hour_of_day = timestamp.hour
            traffic_factor = get_traffic_volume_factor(hour_of_day)
            
            if random.random() > traffic_factor:
                continue  # Skip this iteration based on traffic factor
                
            # Choose vehicle from our unique set, more activity for some vehicles
            vehicle_id = random.choice(vehicle_id_list)
            
            # Get a random location near a junction
            lat, lng, location = get_random_junction_location()
            
            # Determine vehicle type based on configured distribution
            vehicle_type = random.choices(
                list(VEHICLE_TYPES.keys()),
                weights=list(VEHICLE_TYPES.values())
            )[0]
            
            # Random trust score between 60 and 100
            trust_score = random.randint(60, 100)
            
            # Calculate a speed based on vehicle type and time of day
            base_speed = {
                "Car": 45,
                "Truck": 35, 
                "Bus": 30,
                "Ambulance": 55,
                "Two-Wheeler": 50
            }[vehicle_type]
            
            # Adjust speed based on time of day
            if 23 <= hour_of_day or hour_of_day < 5:  # Late night
                speed_factor = 1.2  # Faster at night due to less traffic
            elif 7 <= hour_of_day < 10 or 17 <= hour_of_day < 20:  # Peak hours
                speed_factor = 0.7  # Slower during peak
            else:
                speed_factor = 1.0  # Normal
                
            speed = base_speed * speed_factor * random.uniform(0.8, 1.2)
            
            vehicle = {
                "vehicle_id": vehicle_id,
                "owner_name": get_random_name(),
                "vehicle_type": vehicle_type,
                "trust_score": trust_score,
                "lat": lat,
                "lng": lng,
                "speed": round(speed, 1),
                "heading": random.randint(0, 359),
                "location": location,
                "timestamp": timestamp.isoformat(),
                "status": "Active",
            }
            
            vehicles.append(vehicle)
            
            if i % 1000 == 0:
                logger.info(f"Generated {i+1}/{count} historical vehicle records")
                
        logger.info(f"Generated {len(vehicles)} historical vehicle records")
        return vehicles
        
    def generate_vehicle(self) -> Dict[str, Any]:
        """Generate a single random vehicle"""
        vehicle_id = generate_vehicle_id()
        lat, lng, location = get_random_junction_location()
        
        # Get a weighted random vehicle type
        vehicle_type = random.choices(
            list(VEHICLE_TYPES.keys()),
            weights=list(VEHICLE_TYPES.values())
        )[0]
        
        vehicle = {
            "vehicle_id": vehicle_id,
            "owner_name": get_random_name(),
            "vehicle_type": vehicle_type,
            "trust_score": random.randint(70, 100),
            "lat": lat,
            "lng": lng,
            "speed": random.randint(0, 80),
            "heading": random.randint(0, 359),
            "location": location,
            "timestamp": datetime.datetime.now().isoformat(),
            "status": "Active"
        }
        
        return vehicle
    
    def update_vehicle_position(self, vehicle: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing vehicle's position based on its speed and heading"""
        speed_km_per_hour = vehicle["speed"]
        heading_degrees = vehicle["heading"]
        
        # Convert speed to degrees latitude/longitude per interval
        # Very rough approximation: 111km per degree
        km_per_degree = 111.0
        speed_deg_per_hour = speed_km_per_hour / km_per_degree
        speed_deg_per_interval = speed_deg_per_hour * (VEHICLE_UPDATE_INTERVAL / 3600)
        
        # Convert heading to radians
        heading_rad = heading_degrees * 3.14159 / 180
        
        # Calculate new position
        lat_change = speed_deg_per_interval * -1 * (0 if heading_rad == 0 else (heading_rad / abs(heading_rad))) * abs(heading_rad ** 0.5)
        lng_change = speed_deg_per_interval * (0 if heading_rad == 0 else (heading_rad / abs(heading_rad)))
        
        # Update position
        vehicle["lat"] += lat_change
        vehicle["lng"] += lng_change
        vehicle["timestamp"] = datetime.datetime.now().isoformat()
        
        # Occasionally change heading and speed
        if random.random() < 0.2:
            # Change heading slightly
            vehicle["heading"] = (vehicle["heading"] + random.randint(-30, 30)) % 360
            
            # Change speed slightly
            vehicle["speed"] = max(0, min(80, vehicle["speed"] + random.randint(-10, 10)))
        
        return vehicle
        
    async def simulate(self):
        """Run continuous simulation of vehicle movements"""
        logger.info("Starting vehicle simulation")
        
        # Initialize with some vehicles
        for _ in range(100):
            vehicle = self.generate_vehicle()
            self.active_vehicles[vehicle["vehicle_id"]] = vehicle
            
        while True:
            current_hour = datetime.datetime.now().hour
            traffic_factor = get_traffic_volume_factor(current_hour)
            
            # Determine how many vehicles should be active based on time of day
            target_active_vehicles = int(500 * traffic_factor)
            current_active_count = len(self.active_vehicles)
            
            # Add or remove vehicles to match target
            if current_active_count < target_active_vehicles:
                # Add some new vehicles
                vehicles_to_add = min(10, target_active_vehicles - current_active_count)
                for _ in range(vehicles_to_add):
                    vehicle = self.generate_vehicle()
                    self.active_vehicles[vehicle["vehicle_id"]] = vehicle
                    
            elif current_active_count > target_active_vehicles:
                # Remove some vehicles
                vehicles_to_remove = min(5, current_active_count - target_active_vehicles)
                for _ in range(vehicles_to_remove):
                    if self.active_vehicles:
                        vehicle_id = random.choice(list(self.active_vehicles.keys()))
                        del self.active_vehicles[vehicle_id]
            
            # Update positions of all active vehicles
            updated_vehicles = []
            for vehicle_id, vehicle in list(self.active_vehicles.items()):
                updated_vehicle = self.update_vehicle_position(vehicle)
                self.active_vehicles[vehicle_id] = updated_vehicle
                updated_vehicles.append(updated_vehicle)
                
            # Insert updated vehicles into database
            if updated_vehicles:
                await self.db.insert_data("vehicles", updated_vehicles)
                logger.info(f"Updated {len(updated_vehicles)} vehicles")
                
            # Wait for next update interval
            await asyncio.sleep(VEHICLE_UPDATE_INTERVAL)
