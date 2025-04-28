
import asyncio
import argparse
import logging
import sys
from typing import Dict, Any, List

from config import logger
from db import Database
from generators.vehicle_generator import VehicleGenerator
from generators.congestion_generator import CongestionGenerator
from generators.anomaly_generator import AnomalyGenerator
from generators.trust_generator import TrustGenerator

async def create_tables(db):
    """Create necessary tables if they don't exist"""
    logger.info("Verifying database tables...")
    await db.create_tables()
    logger.info("Database tables verified.")

async def seed_historical_data(db, generators: Dict[str, Any], counts: Dict[str, int]):
    """Seed historical data for all data types"""
    logger.info("Seeding historical data...")
    
    # Vehicle data
    logger.info(f"Seeding {counts['vehicles']} historical vehicle records...")
    vehicle_data = await generators['vehicle'].generate_historical_data(counts['vehicles'])
    if vehicle_data:
        success = await db.insert_data("vehicles", vehicle_data)
        if success:
            logger.info(f"✓ Successfully seeded {len(vehicle_data)} vehicle records")
        else:
            logger.error("✗ Failed to seed vehicle data")
    
    # Congestion data
    logger.info(f"Seeding {counts['congestion']} historical congestion records...")
    congestion_data = await generators['congestion'].generate_historical_data(counts['congestion'])
    if congestion_data:
        success = await db.insert_data("zones_congestion", congestion_data)
        if success:
            logger.info(f"✓ Successfully seeded {len(congestion_data)} congestion records")
        else:
            logger.error("✗ Failed to seed congestion data")
    
    # Anomaly data
    logger.info(f"Seeding {counts['anomalies']} historical anomaly records...")
    anomaly_data = await generators['anomaly'].generate_historical_data(counts['anomalies'])
    if anomaly_data:
        success = await db.insert_data("anomalies", anomaly_data)
        if success:
            logger.info(f"✓ Successfully seeded {len(anomaly_data)} anomaly records")
        else:
            logger.error("✗ Failed to seed anomaly data")
    
    # Trust ledger data
    logger.info(f"Seeding {counts['trust']} historical trust ledger records...")
    trust_data = await generators['trust'].generate_historical_data(counts['trust'])
    if trust_data:
        success = await db.insert_data("trust_ledger", trust_data)
        if success:
            logger.info(f"✓ Successfully seeded {len(trust_data)} trust ledger records")
        else:
            logger.error("✗ Failed to seed trust ledger data")
    
    logger.info("Historical data seeding complete")

async def verify_data_counts(db):
    """Verify that sufficient data has been loaded for each table"""
    logger.info("Verifying data counts...")
    
    tables = ["vehicles", "zones_congestion", "anomalies", "trust_ledger"]
    min_count = 1000
    
    all_good = True
    
    for table in tables:
        count = await db.get_count(table)
        if count >= min_count:
            logger.info(f"✓ {table}: {count} records (sufficient)")
        else:
            logger.warning(f"⚠ {table}: {count} records (below minimum of {min_count})")
            all_good = False
    
    if all_good:
        logger.info("All tables have sufficient data")
    else:
        logger.warning("Some tables do not have sufficient data")
    
    return all_good

async def run_simulations(generators: Dict[str, Any]):
    """Run all simulation generators concurrently"""
    logger.info("Starting continuous data simulation...")
    
    # Create tasks for all generators
    tasks = [
        generators['vehicle'].simulate(),
        generators['congestion'].simulate(),
        generators['anomaly'].simulate(),
        generators['trust'].simulate()
    ]
    
    # Run all simulations concurrently
    await asyncio.gather(*tasks)

async def main(args):
    """Main function to set up database, seed data, and run simulations"""
    try:
        logger.info("Initializing Smart Traffic Management System data simulation")
        
        # Initialize database connection
        db = Database()
        
        # Initialize data generators
        generators = {
            'vehicle': VehicleGenerator(db),
            'congestion': CongestionGenerator(db),
            'anomaly': AnomalyGenerator(db),
            'trust': TrustGenerator(db)
        }
        
        # Create tables if needed
        await create_tables(db)
        
        # Define data counts for historical seeding
        counts = {
            'vehicles': args.vehicles,
            'congestion': args.congestion,
            'anomalies': args.anomalies,
            'trust': args.trust
        }
        
        # Clear existing data if requested
        if args.clear:
            logger.warning("Clearing existing data as requested...")
            for table in ["vehicles", "zones_congestion", "anomalies", "trust_ledger"]:
                await db.clear_table(table)
        
        # Seed historical data
        if args.seed:
            await seed_historical_data(db, generators, counts)
        
        # Verify data counts
        sufficient_data = await verify_data_counts(db)
        
        if not sufficient_data and not args.seed:
            logger.warning("Insufficient data found and seeding was not enabled")
            if input("Would you like to seed historical data now? (y/n): ").lower() == 'y':
                await seed_historical_data(db, generators, counts)
        
        # Run continuous simulations if requested
        if args.simulate:
            logger.info("Starting continuous data simulation...")
            await run_simulations(generators)
        else:
            logger.info("Simulation not requested. Exiting.")
        
    except Exception as e:
        logger.exception(f"Error in main: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Smart Traffic Management System Data Generator")
    
    parser.add_argument("--clear", action="store_true", help="Clear existing data before seeding")
    parser.add_argument("--seed", action="store_true", help="Seed historical data")
    parser.add_argument("--simulate", action="store_true", help="Run continuous simulation")
    
    parser.add_argument("--vehicles", type=int, default=10000, help="Number of historical vehicle records to generate")
    parser.add_argument("--congestion", type=int, default=10000, help="Number of historical congestion records to generate")
    parser.add_argument("--anomalies", type=int, default=10000, help="Number of historical anomaly records to generate")
    parser.add_argument("--trust", type=int, default=1000, help="Number of historical trust ledger records to generate")
    
    args = parser.parse_args()
    
    # If no actions are specified, enable all
    if not (args.clear or args.seed or args.simulate):
        args.seed = True
        args.simulate = True
    
    # Run the main async function
    asyncio.run(main(args))
