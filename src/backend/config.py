
import os
from dotenv import load_dotenv
import random
import datetime
import time
import json
from typing import List, Dict, Any, Tuple, Optional
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("traffic_simulator")

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ompvafpbdbwsmelomnla.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tcHZhZnBiZGJ3c21lbG9tbmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NjQ3NDIsImV4cCI6MjA2MTQ0MDc0Mn0.kxbVyt1n0jpqlFHbQqWmuTh-3mfM64-lJ7FqODqoVKY")

# Hyderabad geographic parameters
# City center coordinates (Charminar)
CITY_CENTER_LAT = 17.3616
CITY_CENTER_LNG = 78.4747

# Major zones and their coordinates
TRAFFIC_ZONES = {
    "Hitech City": {"lat": 17.4435, "lng": 78.3772, "radius": 2.5},
    "Gachibowli": {"lat": 17.4401, "lng": 78.3489, "radius": 2.0},
    "Banjara Hills": {"lat": 17.4156, "lng": 78.4347, "radius": 2.2},
    "Jubilee Hills": {"lat": 17.4321, "lng": 78.4075, "radius": 2.0},
    "Secunderabad": {"lat": 17.4399, "lng": 78.4983, "radius": 2.5},
    "LB Nagar": {"lat": 17.3468, "lng": 78.5548, "radius": 1.8},
    "Dilsukhnagar": {"lat": 17.3687, "lng": 78.5247, "radius": 1.5},
    "KPHB Colony": {"lat": 17.4858, "lng": 78.3909, "radius": 1.8},
    "Madhapur": {"lat": 17.4484, "lng": 78.3908, "radius": 2.0},
    "Begumpet": {"lat": 17.4400, "lng": 78.4635, "radius": 1.7},
    "Ameerpet": {"lat": 17.4374, "lng": 78.4487, "radius": 1.5},
    "NH65-ORR Interchange": {"lat": 17.4046, "lng": 78.3032, "radius": 1.2}
}

# Key junctions for vehicle clusters
KEY_JUNCTIONS = {
    "NH65-ORR Interchange": {"lat": 17.4046, "lng": 78.3032},
    "LB Nagar Junction": {"lat": 17.3468, "lng": 78.5548},
    "Gachibowli Junction": {"lat": 17.4401, "lng": 78.3489},
    "Miyapur X Roads": {"lat": 17.4937, "lng": 78.3428},
    "Paradise Junction": {"lat": 17.4432, "lng": 78.4982},
    "Panjagutta Junction": {"lat": 17.4256, "lng": 78.4502},
    "Dilsukhnagar Bus Stand": {"lat": 17.3687, "lng": 78.5247},
    "JNTU Junction": {"lat": 17.4947, "lng": 78.3996},
    "Begumpet Flyover": {"lat": 17.4400, "lng": 78.4635},
    "MG Bus Station": {"lat": 17.3834, "lng": 78.4783}
}

# Traffic volume patterns based on time of day
def get_traffic_volume_factor(hour: int) -> float:
    """Return traffic volume factor (0-1) based on hour of day"""
    if 7 <= hour < 10:  # Morning peak
        return 0.8 + random.uniform(0.1, 0.2)
    elif 17 <= hour < 20:  # Evening peak
        return 0.85 + random.uniform(0.1, 0.15)
    elif 11 <= hour < 15:  # Midday lull
        return 0.4 + random.uniform(0.1, 0.2)
    elif 23 <= hour or hour < 5:  # Late night
        return 0.1 + random.uniform(0.05, 0.1)
    else:  # Other times
        return 0.5 + random.uniform(0.1, 0.15)

# Vehicle types and their distribution
VEHICLE_TYPES = {
    "Car": 0.6,  # 60% of vehicles are cars
    "Truck": 0.1,  # 10% of vehicles are trucks
    "Bus": 0.05,  # 5% of vehicles are buses
    "Ambulance": 0.03,  # 3% of vehicles are ambulances
    "Two-Wheeler": 0.22,  # 22% of vehicles are two-wheelers
}

# License plate series and their distribution
LICENSE_PLATE_SERIES = ["TS07", "TS08", "TS09"]

# Anomaly types and their probabilities
ANOMALY_TYPES = {
    "Overspeed": 0.35,
    "Emergency Braking": 0.2,
    "RSU Offline": 0.15,
    "Signal Tampering": 0.1,
    "GPS Spoofing": 0.1,
    "Unauthorized Access": 0.05,
    "Software Malfunction": 0.05,
}

# Anomaly severity levels
ANOMALY_SEVERITY = ["Low", "Medium", "High", "Critical"]
ANOMALY_SEVERITY_WEIGHTS = [0.4, 0.3, 0.2, 0.1]  # Weights for random selection

# Trust ledger action types
TRUST_ACTIONS = [
    "Trust Score Update",
    "Stake Token",
    "Unstake Token",
    "Penalize",
    "Reward",
    "Certificate Renewal"
]

# Batch size for database operations
DB_BATCH_SIZE = 100

# Simulation time settings
SIMULATION_SPEED = 1.0  # 1.0 means real-time, 2.0 means twice as fast
VEHICLE_UPDATE_INTERVAL = 5  # seconds
CONGESTION_UPDATE_INTERVAL = 60  # seconds
ANOMALY_UPDATE_INTERVAL = 900  # 15 minutes
TRUST_UPDATE_INTERVAL = 1800  # 30 minutes

# Random seed for reproducibility
RANDOM_SEED = 42
random.seed(RANDOM_SEED)

# Helper functions
def get_random_location_in_zone(zone_name: str) -> Tuple[float, float]:
    """Generate a random location within the specified zone"""
    zone = TRAFFIC_ZONES[zone_name]
    
    # Calculate a random point within the zone radius
    # Using a simple approximation for small distances
    r = zone["radius"] * random.uniform(0, 1)
    theta = random.uniform(0, 2 * 3.14159)
    
    # Convert to lat/lng offset
    # This is a simple approximation that works for small distances
    lat_offset = r * 0.009 * random.uniform(0.5, 1.0) * (1 if random.random() > 0.5 else -1)
    lng_offset = r * 0.009 * random.uniform(0.5, 1.0) * (1 if random.random() > 0.5 else -1)
    
    return zone["lat"] + lat_offset, zone["lng"] + lng_offset

def get_random_junction_location() -> Tuple[float, float, str]:
    """Return a random junction location and its name"""
    junction_name = random.choice(list(KEY_JUNCTIONS.keys()))
    junction = KEY_JUNCTIONS[junction_name]
    
    # Add some randomness to avoid all vehicles being at exact same spot
    lat_offset = random.uniform(-0.001, 0.001)
    lng_offset = random.uniform(-0.001, 0.001)
    
    return junction["lat"] + lat_offset, junction["lng"] + lng_offset, junction_name

def generate_vehicle_id() -> str:
    """Generate a random vehicle ID with specified license plate series"""
    series = random.choice(LICENSE_PLATE_SERIES)
    numbers = ''.join(random.choices('0123456789', k=4))
    letters = ''.join(random.choices('ABCDEFGHJKLMNPQRSTUVWXYZ', k=2))
    return f"{series}-{numbers}-{letters}"

def generate_rsu_id() -> str:
    """Generate a random RSU ID"""
    return f"RSU-{random.randint(1000, 9999)}"

def get_random_name() -> str:
    """Generate a random Indian name"""
    first_names = [
        "Raj", "Amit", "Vijay", "Sanjay", "Rahul", "Deepak", "Suresh", "Rajesh", 
        "Priya", "Anjali", "Deepa", "Sunita", "Anita", "Kavita", "Pooja", "Neha",
        "Mohammed", "Abdul", "Ali", "Aryan", "Kiran", "Rohan", "Vikram", "Aditya",
        "Lakshmi", "Sarita", "Usha", "Geeta", "Meena", "Sita", "Radha", "Shanti"
    ]
    last_names = [
        "Kumar", "Singh", "Sharma", "Patel", "Verma", "Gupta", "Jha", "Chatterjee",
        "Reddy", "Rao", "Nair", "Menon", "Iyer", "Khan", "Ahmed", "Chowdhury", 
        "Desai", "Patil", "Joshi", "Kapoor", "Malhotra", "Trivedi", "Shah", "Mehta",
        "Banerjee", "Das", "Dutta", "Mukherjee", "Ghosh", "Sinha", "Sen", "Bose"
    ]
    
    return f"{random.choice(first_names)} {random.choice(last_names)}"

def get_timestamp_hours_ago(hours: int) -> str:
    """Get ISO timestamp for specified hours ago"""
    return (datetime.datetime.now() - datetime.timedelta(hours=hours)).isoformat()
