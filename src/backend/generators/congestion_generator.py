
import asyncio
import datetime
import logging
import random
from typing import List, Dict, Any
import uuid

from ..config import (
    TRAFFIC_ZONES, get_traffic_volume_factor,
    CONGESTION_UPDATE_INTERVAL, get_timestamp_hours_ago
)

logger = logging.getLogger("traffic_simulator.congestion_generator")

class CongestionGenerator:
    """Class to generate realistic traffic congestion data"""
    
    def __init__(self, db):
        self.db = db
        
    async def generate_historical_data(self, count: int = 10000) -> List[Dict[str, Any]]:
        """Generate historical congestion data for the past 24 hours"""
        logger.info(f"Generating historical congestion data")
        
        congestion_data = []
        now = datetime.datetime.now()
        
        # Calculate how many minutes to generate data for
        minutes_in_day = 24 * 60
        
        # For each zone, generate congestion levels over time
        for zone_name, zone_info in TRAFFIC_ZONES.items():
            # Generate data for the past 24 hours at regular intervals
            for minutes_ago in range(0, minutes_in_day, 5):  # Every 5 minutes
                timestamp = now - datetime.timedelta(minutes=minutes_ago)
                hour_of_day = timestamp.hour
                
                # Base congestion on time of day
                base_congestion = get_traffic_volume_factor(hour_of_day) * 100
                
                # Add randomness
                noise = random.normalvariate(0, 10)  # Normal distribution with mean=0, std=10
                congestion_level = max(0, min(100, int(base_congestion + noise)))
                
                # Add more congestion to certain zones during peak hours
                if zone_name in ["Hitech City", "Gachibowli", "Madhapur"] and 17 <= hour_of_day < 20:
                    # Evening peak in IT areas
                    congestion_level = min(100, congestion_level + random.randint(10, 20))
                elif zone_name in ["Jubilee Hills", "Banjara Hills"] and 7 <= hour_of_day < 10:
                    # Morning peak in residential areas
                    congestion_level = min(100, congestion_level + random.randint(10, 15))
                elif zone_name == "NH65-ORR Interchange":
                    # Highway interchanges are always busy during peaks
                    if 7 <= hour_of_day < 10 or 17 <= hour_of_day < 20:
                        congestion_level = min(100, congestion_level + random.randint(15, 25))
                
                # Create congestion record
                congestion_record = {
                    "zone_name": zone_name,
                    "lat": zone_info["lat"],
                    "lng": zone_info["lng"],
                    "congestion_level": congestion_level,
                    "updated_at": timestamp.isoformat(),
                }
                
                congestion_data.append(congestion_record)
        
        logger.info(f"Generated {len(congestion_data)} historical congestion records")
        return congestion_data
    
    async def simulate(self):
        """Run continuous simulation of congestion levels"""
        logger.info("Starting congestion simulation")
        
        while True:
            current_timestamp = datetime.datetime.now()
            current_hour = current_timestamp.hour
            
            congestion_updates = []
            
            for zone_name, zone_info in TRAFFIC_ZONES.items():
                # Base congestion on time of day
                base_congestion = get_traffic_volume_factor(current_hour) * 100
                
                # Add randomness
                noise = random.normalvariate(0, 10)
                congestion_level = max(0, min(100, int(base_congestion + noise)))
                
                # Add more congestion to certain zones during peak hours
                if zone_name in ["Hitech City", "Gachibowli", "Madhapur"] and 17 <= current_hour < 20:
                    # Evening peak in IT areas
                    congestion_level = min(100, congestion_level + random.randint(10, 20))
                elif zone_name in ["Jubilee Hills", "Banjara Hills"] and 7 <= current_hour < 10:
                    # Morning peak in residential areas
                    congestion_level = min(100, congestion_level + random.randint(10, 15))
                elif zone_name == "NH65-ORR Interchange":
                    # Highway interchanges are always busy during peaks
                    if 7 <= current_hour < 10 or 17 <= current_hour < 20:
                        congestion_level = min(100, congestion_level + random.randint(15, 25))
                
                # Create congestion record
                congestion_record = {
                    "zone_name": zone_name,
                    "lat": zone_info["lat"],
                    "lng": zone_info["lng"],
                    "congestion_level": congestion_level,
                    "updated_at": current_timestamp.isoformat(),
                }
                
                congestion_updates.append(congestion_record)
            
            # Insert congestion updates into database
            if congestion_updates:
                await self.db.insert_data("zones_congestion", congestion_updates)
                logger.info(f"Updated congestion levels for {len(congestion_updates)} zones")
            
            # Wait for next update interval
            await asyncio.sleep(CONGESTION_UPDATE_INTERVAL)
