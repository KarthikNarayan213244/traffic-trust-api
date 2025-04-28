
import asyncio
import datetime
import logging
import random
from typing import List, Dict, Any
import uuid

from ..config import (
    TRUST_ACTIONS, get_traffic_volume_factor,
    TRUST_UPDATE_INTERVAL, get_timestamp_hours_ago
)

logger = logging.getLogger("traffic_simulator.trust_generator")

class TrustGenerator:
    """Class to generate realistic trust ledger data"""
    
    def __init__(self, db):
        self.db = db
        
    async def generate_historical_data(self, count: int = 1000) -> List[Dict[str, Any]]:
        """Generate historical trust ledger data for the past 24 hours"""
        logger.info(f"Generating {count} historical trust ledger records")
        
        trust_entries = []
        now = datetime.datetime.now()
        
        # Get active vehicles first to reference in trust ledger
        async with self.db.client.get(
            f"{self.db.base_url}/rest/v1/vehicles?select=vehicle_id,trust_score&limit=1000",
            headers=self.db.headers
        ) as response:
            if response.status_code == 200:
                vehicles = await response.json()
            else:
                # Fallback to generating random vehicle IDs with trust scores
                vehicles = [
                    {"vehicle_id": f"TS0{random.randint(7, 9)}-{random.randint(1000, 9999)}", "trust_score": random.randint(70, 95)}
                    for _ in range(100)
                ]
        
        vehicle_map = {v["vehicle_id"]: v.get("trust_score", random.randint(70, 95)) for v in vehicles}
        vehicle_ids = list(vehicle_map.keys())
        
        # Generate trust entries across 24 hours
        for i in range(count):
            # Random time in the last 24 hours
            hours_ago = random.uniform(0, 24)
            minutes_ago = int(hours_ago * 60)
            timestamp = now - datetime.timedelta(minutes=minutes_ago)
            
            # Trust activity is higher during business hours
            hour_of_day = timestamp.hour
            activity_factor = 1.0
            
            # More activity during business hours (9 AM - 5 PM)
            if 9 <= hour_of_day < 17:
                activity_factor = 1.5
            # Less activity late night (11 PM - 6 AM)
            elif hour_of_day < 6 or hour_of_day >= 23:
                activity_factor = 0.3
                
            # Skip some timestamps during low activity times
            if random.random() > activity_factor and i % 3 != 0:
                continue
                
            # Select random action
            action = random.choice(TRUST_ACTIONS)
            
            # Get a random vehicle
            vehicle_id = random.choice(vehicle_ids)
            current_score = vehicle_map.get(vehicle_id, random.randint(70, 95))
            
            # Handle trust score changes
            old_value = current_score
            
            if action == "Trust Score Update":
                change = random.choice([-5, -3, -2, -1, 1, 2, 3, 5])
                new_value = max(0, min(100, old_value + change))
            elif action == "Stake Token":
                tokens = random.randint(1, 100)
                old_value = tokens
                new_value = tokens
            elif action == "Unstake Token":
                tokens = random.randint(1, 50)
                old_value = tokens
                new_value = 0
            elif action == "Penalize":
                change = -random.randint(5, 15)
                new_value = max(0, old_value + change)
            elif action == "Reward":
                change = random.randint(1, 10)
                new_value = min(100, old_value + change)
            else:  # Certificate Renewal
                old_value = 0
                new_value = 0
                
            # Update the stored trust score
            vehicle_map[vehicle_id] = new_value
            
            # Generate transaction ID
            tx_id = f"TX{timestamp.strftime('%Y%m%d%H%M%S')}-{random.randint(1000, 9999)}"
            
            trust_entry = {
                "tx_id": tx_id,
                "timestamp": timestamp.isoformat(),
                "vehicle_id": vehicle_id,
                "action": action,
                "old_value": old_value,
                "new_value": new_value,
                "details": f"{action} for vehicle {vehicle_id}"
            }
            
            trust_entries.append(trust_entry)
            
            if i % 100 == 0:
                logger.info(f"Generated {i+1}/{count} historical trust ledger records")
                
        logger.info(f"Generated {len(trust_entries)} historical trust ledger records")
        return trust_entries
        
    async def simulate(self):
        """Run continuous simulation of trust ledger updates"""
        logger.info("Starting trust ledger simulation")
        
        while True:
            current_hour = datetime.datetime.now().hour
            
            # Trust activity is higher during business hours
            activity_factor = 1.0
            
            # More activity during business hours (9 AM - 5 PM)
            if 9 <= current_hour < 17:
                activity_factor = 1.5
            # Less activity late night (11 PM - 6 AM)
            elif current_hour < 6 or current_hour >= 23:
                activity_factor = 0.3
                
            # Number of trust updates to generate
            num_updates = max(1, int(random.randint(1, 5) * activity_factor))
            
            # Get active vehicles to reference in trust ledger
            async with self.db.client.get(
                f"{self.db.base_url}/rest/v1/vehicles?select=vehicle_id,trust_score&limit=1000",
                headers=self.db.headers
            ) as response:
                if response.status_code == 200:
                    vehicles = await response.json()
                    vehicle_map = {v["vehicle_id"]: v.get("trust_score", random.randint(70, 95)) for v in vehicles}
                    vehicle_ids = list(vehicle_map.keys())
                else:
                    # Fallback to generating random vehicle IDs with trust scores
                    vehicle_ids = [f"TS0{random.randint(7, 9)}-{random.randint(1000, 9999)}" for _ in range(100)]
                    vehicle_map = {vid: random.randint(70, 95) for vid in vehicle_ids}
            
            trust_updates = []
            
            for _ in range(num_updates):
                # Select random action
                action = random.choice(TRUST_ACTIONS)
                
                # Get a random vehicle
                vehicle_id = random.choice(vehicle_ids)
                current_score = vehicle_map.get(vehicle_id, random.randint(70, 95))
                
                # Handle trust score changes
                old_value = current_score
                
                if action == "Trust Score Update":
                    change = random.choice([-5, -3, -2, -1, 1, 2, 3, 5])
                    new_value = max(0, min(100, old_value + change))
                elif action == "Stake Token":
                    tokens = random.randint(1, 100)
                    old_value = tokens
                    new_value = tokens
                elif action == "Unstake Token":
                    tokens = random.randint(1, 50)
                    old_value = tokens
                    new_value = 0
                elif action == "Penalize":
                    change = -random.randint(5, 15)
                    new_value = max(0, old_value + change)
                elif action == "Reward":
                    change = random.randint(1, 10)
                    new_value = min(100, old_value + change)
                else:  # Certificate Renewal
                    old_value = 0
                    new_value = 0
                    
                # Update the stored trust score
                vehicle_map[vehicle_id] = new_value
                
                # Generate transaction ID
                timestamp = datetime.datetime.now()
                tx_id = f"TX{timestamp.strftime('%Y%m%d%H%M%S')}-{random.randint(1000, 9999)}"
                
                trust_update = {
                    "tx_id": tx_id,
                    "timestamp": timestamp.isoformat(),
                    "vehicle_id": vehicle_id,
                    "action": action,
                    "old_value": old_value,
                    "new_value": new_value,
                    "details": f"{action} for vehicle {vehicle_id}"
                }
                
                trust_updates.append(trust_update)
            
            # Insert trust updates into database
            if trust_updates:
                await self.db.insert_data("trust_ledger", trust_updates)
                logger.info(f"Generated {len(trust_updates)} new trust ledger entries")
                
            # Wait for next update interval with some randomness
            wait_time = TRUST_UPDATE_INTERVAL + random.randint(-300, 300)
            await asyncio.sleep(max(60, wait_time))  # At least 1 minute
