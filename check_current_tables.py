#!/usr/bin/env python3

import psycopg2

POSTGRES_CONFIG = {
    'host': 'health-platform-dev-db.c5njva4wrrhe.us-east-1.rds.amazonaws.com',
    'port': 5432,
    'database': 'health_platform_dev',
    'user': 'healthadmin',
    'password': 'HealthPlatform2024!'
}

def main():
    try:
        conn = psycopg2.connect(**POSTGRES_CONFIG)
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """)
            
            tables = cursor.fetchall()
            print(f"Current PostgreSQL tables ({len(tables)} total):")
            for table in tables:
                print(f"  - {table[0]}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
