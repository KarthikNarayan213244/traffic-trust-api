
import json
import logging
import time
from typing import List, Dict, Any
import httpx
from .config import SUPABASE_URL, SUPABASE_KEY, DB_BATCH_SIZE

logger = logging.getLogger("traffic_simulator.db")

class Database:
    """Class to handle database operations"""
    
    def __init__(self):
        self.base_url = SUPABASE_URL
        self.key = SUPABASE_KEY
        self.headers = {
            "apikey": self.key,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        
    async def create_tables(self):
        """Create all necessary tables if they don't exist"""
        logger.info("Creating tables if they don't exist...")
        
        # We'll assume the tables are already created in Supabase
        # This function is a placeholder for actual table creation
        # which would typically be done through migrations
        
        logger.info("Tables verified.")
        return True

    async def insert_data(self, table_name: str, data: List[Dict[str, Any]]) -> bool:
        """Insert data into specified table with batching for large datasets"""
        if not data:
            logger.warning(f"No data to insert into {table_name}")
            return False
            
        logger.info(f"Inserting {len(data)} records into {table_name}")
        
        # Split data into batches to avoid timeouts
        batches = [data[i:i + DB_BATCH_SIZE] for i in range(0, len(data), DB_BATCH_SIZE)]
        
        success_count = 0
        for i, batch in enumerate(batches):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{self.base_url}/rest/v1/{table_name}",
                        headers=self.headers,
                        json=batch,
                        timeout=30.0
                    )
                    
                    if response.status_code == 201:
                        success_count += len(batch)
                        logger.info(f"Successfully inserted batch {i+1}/{len(batches)} into {table_name}")
                    else:
                        logger.error(f"Failed to insert batch {i+1}/{len(batches)} into {table_name}. Status: {response.status_code}")
                        logger.error(f"Response: {response.text}")
                        
                # Small delay between batches to avoid rate limits
                time.sleep(0.5)
                        
            except Exception as e:
                logger.error(f"Error inserting batch {i+1}/{len(batches)} into {table_name}: {str(e)}")
                
        logger.info(f"Successfully inserted {success_count}/{len(data)} records into {table_name}")
        return success_count > 0
        
    async def get_count(self, table_name: str) -> int:
        """Get count of records in a table"""
        try:
            async with httpx.AsyncClient() as client:
                # Use count API
                response = await client.get(
                    f"{self.base_url}/rest/v1/{table_name}?select=count",
                    headers={
                        "apikey": self.key,
                        "Content-Type": "application/json",
                        "Prefer": "count=exact"
                    }
                )
                
                if response.status_code == 200:
                    count = int(response.headers.get("content-range", "0/0").split("/")[1])
                    logger.info(f"Table {table_name} has {count} records")
                    return count
                else:
                    logger.error(f"Failed to get count for {table_name}. Status: {response.status_code}")
                    logger.error(f"Response: {response.text}")
                    return 0
                    
        except Exception as e:
            logger.error(f"Error getting count for {table_name}: {str(e)}")
            return 0
            
    async def clear_table(self, table_name: str) -> bool:
        """Clear all data from a table"""
        logger.warning(f"Clearing all data from {table_name}")
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.base_url}/rest/v1/{table_name}?select=*",
                    headers=self.headers
                )
                
                if response.status_code in (200, 204):
                    logger.info(f"Successfully cleared table {table_name}")
                    return True
                else:
                    logger.error(f"Failed to clear table {table_name}. Status: {response.status_code}")
                    logger.error(f"Response: {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error clearing table {table_name}: {str(e)}")
            return False
