#!/usr/bin/env python3

import psycopg2
import sys
import json
from psycopg2.extras import RealDictCursor

# Database connections
AURORA_CONFIG = {
    'host': 'temp-restore-instance.c5njva4wrrhe.us-east-1.rds.amazonaws.com',
    'port': 5432,
    'database': 'health_platform_dev',
    'user': 'healthadmin',
    'password': 'HealthPlatform2024!'
}

POSTGRES_CONFIG = {
    'host': 'health-platform-dev-db.c5njva4wrrhe.us-east-1.rds.amazonaws.com',
    'port': 5432,
    'database': 'health_platform_dev',
    'user': 'healthadmin',
    'password': 'HealthPlatform2024!'
}

# Final 4 tables with array issues
ARRAY_TABLES = [
    'medications_database',
    'protocol_rules', 
    'supplements_database',
    'symptoms_database'
]

def convert_json_array_to_pg_array(value):
    """Convert JSON array string to PostgreSQL array format"""
    if value is None:
        return None
    
    if isinstance(value, str):
        try:
            # Parse JSON string to Python list
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return parsed  # Return as Python list, psycopg2 will handle conversion
        except json.JSONDecodeError:
            pass
    
    if isinstance(value, list):
        return value
    
    return value

def migrate_array_table(aurora_conn, postgres_conn, table_name):
    """Migrate table with special array handling"""
    print(f"Final migration attempt for {table_name}...")
    
    # Drop and recreate table
    try:
        with postgres_conn.cursor() as cursor:
            cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
            postgres_conn.commit()
    except Exception as e:
        postgres_conn.rollback()
    
    # Get schema and create table
    with aurora_conn.cursor() as cursor:
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default,
                   character_maximum_length, udt_name
            FROM information_schema.columns 
            WHERE table_name = %s AND table_schema = 'public'
            ORDER BY ordinal_position
        """, (table_name,))
        
        columns = cursor.fetchall()
        
        create_sql = f"CREATE TABLE IF NOT EXISTS {table_name} (\n"
        column_defs = []
        
        for col in columns:
            col_name, data_type, is_nullable, default, max_length, udt_name = col
            
            # Handle data types
            if udt_name == '_text' or data_type == 'ARRAY':
                col_type = "TEXT[]"
            elif data_type == 'character varying':
                col_type = f"VARCHAR({max_length})" if max_length else "TEXT"
            elif data_type == 'uuid':
                col_type = "UUID"
            elif data_type == 'boolean':
                col_type = "BOOLEAN"
            elif data_type == 'text':
                col_type = "TEXT"
            elif data_type == 'timestamp without time zone':
                col_type = "TIMESTAMP"
            else:
                col_type = data_type.upper()
            
            nullable = "" if is_nullable == 'YES' else " NOT NULL"
            
            default_clause = ""
            if default and 'uuid_generate_v4()' in default.lower():
                default_clause = " DEFAULT gen_random_uuid()"
            
            column_defs.append(f"    {col_name} {col_type}{nullable}{default_clause}")
        
        create_sql += ",\n".join(column_defs) + "\n);"
    
    # Create table
    try:
        with postgres_conn.cursor() as cursor:
            cursor.execute(create_sql)
            postgres_conn.commit()
            print(f"  {table_name}: Table structure created")
    except Exception as e:
        print(f"  {table_name}: Error creating table - {e}")
        postgres_conn.rollback()
        return False
    
    # Get data and migrate with array conversion
    try:
        with aurora_conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(f"SELECT * FROM {table_name}")
            rows = cursor.fetchall()
        
        if not rows:
            print(f"  {table_name}: No data to migrate")
            return True
        
        print(f"  {table_name}: Migrating {len(rows)} rows with array conversion")
        
        columns = list(rows[0].keys())
        
        # Get column types to identify array columns
        with aurora_conn.cursor() as cursor:
            cursor.execute("""
                SELECT column_name, udt_name, data_type
                FROM information_schema.columns 
                WHERE table_name = %s AND table_schema = 'public'
            """, (table_name,))
            column_types = {row[0]: {'udt_name': row[1], 'data_type': row[2]} for row in cursor.fetchall()}
        
        # Insert rows one by one with proper array conversion
        with postgres_conn.cursor() as cursor:
            for i, row in enumerate(rows):
                # Convert array columns
                converted_values = []
                for col in columns:
                    value = row[col]
                    col_info = column_types.get(col, {})
                    
                    # Convert arrays stored as JSON strings
                    if col_info.get('udt_name') == '_text' or col_info.get('data_type') == 'ARRAY':
                        value = convert_json_array_to_pg_array(value)
                    
                    converted_values.append(value)
                
                placeholders = ', '.join(['%s'] * len(columns))
                insert_sql = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
                
                try:
                    cursor.execute(insert_sql, converted_values)
                    if (i + 1) % 10 == 0:
                        postgres_conn.commit()
                        print(f"  {table_name}: Inserted {i + 1} rows")
                except Exception as e:
                    print(f"  {table_name}: Error inserting row {i + 1}: {e}")
                    postgres_conn.rollback()
                    return False
            
            postgres_conn.commit()
        
        print(f"  {table_name}: Migration complete - {len(rows)} rows")
        return True
        
    except Exception as e:
        print(f"  {table_name}: Error migrating data - {e}")
        postgres_conn.rollback()
        return False

def main():
    print("Final migration attempt for array tables...")
    
    try:
        aurora_conn = psycopg2.connect(**AURORA_CONFIG)
        postgres_conn = psycopg2.connect(**POSTGRES_CONFIG)
        print("Database connections established")
    except Exception as e:
        print(f"Connection error: {e}")
        return False
    
    success_count = 0
    final_failures = []
    
    for table_name in ARRAY_TABLES:
        print(f"\n--- Final attempt: {table_name} ---")
        
        if migrate_array_table(aurora_conn, postgres_conn, table_name):
            success_count += 1
        else:
            final_failures.append(table_name)
    
    aurora_conn.close()
    postgres_conn.close()
    
    print(f"\n=== Final Migration Summary ===")
    print(f"Successfully migrated: {success_count} tables")
    print(f"Final failures: {len(final_failures)} tables")
    
    if final_failures:
        print(f"Final failed tables: {', '.join(final_failures)}")
    else:
        print("🎉 ALL TABLES SUCCESSFULLY MIGRATED! 🎉")
    
    return len(final_failures) == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
