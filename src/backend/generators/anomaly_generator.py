
import asyncio
import datetime
import logging
import random
from typing import List, Dict, Any
import uuid

from ..config import (
    ANOMALY_TYPES, ANOMALY_SEVERITY, ANOMALY_SEVERITY_WEIGHTS,
    get_traffic_volume_factor, ANOMALY_UPDATE_INTERVAL,
    get_timestamp_hours_ago
)

logger = logging.getLogger("traffic_simulator.anomaly_generator")

class AnomalyGenerator:
    """Class to generate realistic traffic anomaly data"""
    
    def __init__(self, db):
        self.db = db
        
    async def generate_historical_data(self, count: int = 10000) -> List[Dict[str, Any]]:
        """Generate historical anomaly data for the past 24 hours"""
        logger.info(f"Generating {count} historical anomaly records")
        
        anomalies = []
        now = datetime.datetime.now()
        
        # Get active vehicles first to reference in anomalies
        async with self.db.client.get(
            f"{self.db.base_url}/rest/v1/vehicles?select=vehicle_id,vehicle_type&limit=1000",
            headers=self.db.headers
        ) as response:
            if response.status_code == 200:
                vehicles = await response.json()
            else:
                # Fallback to generating random vehicle IDs
                logger.warning("Failed to fetch vehicles, using random IDs")
                vehicles = [{"vehicle_id": f"TS0{random.randint(7, 9)}-{random.randint(1000, 9999)}"} for _ in range(100)]
        
        vehicle_ids = [v["vehicle_id"] for v in vehicles] if vehicles else []
        
        # Generate anomalies across 24 hours
        for i in range(count):
            # Random time in the last 24 hours
            hours_ago = random.uniform(0, 24)
            minutes_ago = int(hours_ago * 60)
            timestamp = now - datetime.timedelta(minutes=minutes_ago)
            
            # Anomaly frequency is higher during peak hours
            hour_of_day = timestamp.hour
            traffic_factor = get_traffic_volume_factor(hour_of_day)
            
            # Skip some timestamps during low traffic times
            if random.random() > traffic_factor * 1.5 and i % 3 != 0:
                continue
                
            # Select random anomaly type based on configured probabilities
            anomaly_type = random.choices(
                list(ANOMALY_TYPES.keys()),
                weights=list(ANOMALY_TYPES.values())
            )[0]
            
            # Select random severity
            severity = random.choices(
                ANOMALY_SEVERITY,
                weights=ANOMALY_SEVERITY_WEIGHTS
            )[0]
            
            # Get a random vehicle
            vehicle_id = random.choice(vehicle_ids) if vehicle_ids else f"TS0{random.randint(7, 9)}-{random.randint(1000, 9999)}"
            
            # Generate descriptive message based on anomaly type
            messages = {
                "Overspeed": [
                    f"Vehicle {vehicle_id} detected at excess speed",
                    f"Speed limit violation detected for {vehicle_id}",
                    f"High speed alert for {vehicle_id}"
                ],
                "Emergency Braking": [
                    f"Hard braking event detected for {vehicle_id}",
                    f"Emergency stop by {vehicle_id}",
                    f"Sudden deceleration alert for {vehicle_id}"
                ],
                "RSU Offline": [
                    f"Lost connection with RSU near {vehicle_id}",
                    f"RSU communication failure in {vehicle_id} zone",
                    f"RSU offline alert in traffic zone"
                ],
                "Signal Tampering": [
                    f"Suspicious signal activity detected from {vehicle_id}",
                    f"Possible tampering attempt by {vehicle_id}",
                    f"Signal integrity violation for {vehicle_id}"
                ],
                "GPS Spoofing": [
                    f"GPS position mismatch detected for {vehicle_id}",
                    f"Location spoofing attempt by {vehicle_id}",
                    f"Suspicious location data from {vehicle_id}"
                ],
                "Unauthorized Access": [
                    f"Security breach attempt on {vehicle_id}",
                    f"Unauthorized control signal for {vehicle_id}",
                    f"Access violation detected for {vehicle_id}"
                ],
                "Software Malfunction": [
                    f"Software error reported by {vehicle_id}",
                    f"System malfunction in {vehicle_id}",
                    f"Diagnostic error code from {vehicle_id}"
                ]
            }
            
            message = random.choice(messages.get(anomaly_type, [f"{anomaly_type} alert for {vehicle_id}"]))
            
            anomaly = {
                "id": str(uuid.uuid4()),
                "timestamp": timestamp.isoformat(),
                "vehicle_id": vehicle_id,
                "type": anomaly_type,
                "severity": severity,
                "message": message,
                "status": "Detected" if random.random() < 0.7 else "Resolved",
            }
            
            anomalies.append(anomaly)
            
            if i % 1000 == 0:
                logger.info(f"Generated {i+1}/{count} historical anomaly records")
                
        logger.info(f"Generated {len(anomalies)} historical anomaly records")
        return anomalies
        
    async def simulate(self):
        """Run continuous simulation of anomaly detection"""
        logger.info("Starting anomaly simulation")
        
        while True:
            current_hour = datetime.datetime.now().hour
            traffic_factor = get_traffic_volume_factor(current_hour)
            
            # Number of anomalies to generate is based on time of day
            # During peak hours, generate more anomalies
            num_anomalies = max(1, int(random.randint(2, 5) * traffic_factor))
            
            # Get active vehicles to reference in anomalies
            async with self.db.client.get(
                f"{self.db.base_url}/rest/v1/vehicles?select=vehicle_id,vehicle_type&limit=1000",
                headers=self.db.headers
            ) as response:
                if response.status_code == 200:
                    vehicles = await response.json()
                    vehicle_ids = [v["vehicle_id"] for v in vehicles]
                else:
                    # Fallback to generating random vehicle IDs
                    vehicle_ids = [f"TS0{random.randint(7, 9)}-{random.randint(1000, 9999)}" for _ in range(100)]
            
            anomalies = []
            
            for _ in range(num_anomalies):
                # Select random anomaly type based on configured probabilities
                anomaly_type = random.choices(
                    list(ANOMALY_TYPES.keys()),
                    weights=list(ANOMALY_TYPES.values())
                )[0]
                
                # Select random severity
                severity = random.choices(
                    ANOMALY_SEVERITY,
                    weights=ANOMALY_SEVERITY_WEIGHTS
                )[0]
                
                # Get a random vehicle
                vehicle_id = random.choice(vehicle_ids)
                
                # Generate descriptive message based on anomaly type
                messages = {
                    "Overspeed": [
                        f"Vehicle {vehicle_id} detected at excess speed",
                        f"Speed limit violation detected for {vehicle_id}",
                        f"High speed alert for {vehicle_id}"
                    ],
                    "Emergency Braking": [
                        f"Hard braking event detected for {vehicle_id}",
                        f"Emergency stop by {vehicle_id}",
                        f"Sudden deceleration alert for {vehicle_id}"
                    ],
                    "RSU Offline": [
                        f"Lost connection with RSU near {vehicle_id}",
                        f"RSU communication failure in {vehicle_id} zone",
                        f"RSU offline alert in traffic zone"
                    ],
                    "Signal Tampering": [
                        f"Suspicious signal activity detected from {vehicle_id}",
                        f"Possible tampering attempt by {vehicle_id}",
                        f"Signal integrity violation for {vehicle_id}"
                    ],
                    "GPS Spoofing": [
                        f"GPS position mismatch detected for {vehicle_id}",
                        f"Location spoofing attempt by {vehicle_id}",
                        f"Suspicious location data from {vehicle_id}"
                    ],
                    "Unauthorized Access": [
                        f"Security breach attempt on {vehicle_id}",
                        f"Unauthorized control signal for {vehicle_id}",
                        f"Access violation detected for {vehicle_id}"
                    ],
                    "Software Malfunction": [
                        f"Software error reported by {vehicle_id}",
                        f"System malfunction in {vehicle_id}",
                        f"Diagnostic error code from {vehicle_id}"
                    ]
                }
                
                message = random.choice(messages.get(anomaly_type, [f"{anomaly_type} alert for {vehicle_id}"]))
                
                anomaly = {
                    "id": str(uuid.uuid4()),
                    "timestamp": datetime.datetime.now().isoformat(),
                    "vehicle_id": vehicle_id,
                    "type": anomaly_type,
                    "severity": severity,
                    "message": message,
                    "status": "Detected",
                }
                
                anomalies.append(anomaly)
            
            # Insert anomalies into database
            if anomalies:
                await self.db.insert_data("anomalies", anomalies)
                logger.info(f"Generated {len(anomalies)} new anomalies")
                
            # Wait for next update interval with some randomness
            wait_time = ANOMALY_UPDATE_INTERVAL + random.randint(-60, 60)
            await asyncio.sleep(max(60, wait_time))  # At least 1 minute
