#!/usr/bin/env python3

import psycopg2
import sys
import json
from psycopg2.extras import RealDictCursor, Json

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

# Failed tables to retry
FAILED_TABLES = [
    'anonymous_data_pool',
    'content_items', 
    'dietary_protocols',
    'foods',
    'medications_database',
    'protocol_change_events',
    'protocol_rules',
    'simplified_foods_backup',
    'simplified_foods_view',
    'simplified_foods_with_nutrition',
    'supplements_database',
    'symptoms_database',
    'user_dietary_protocols',
    'user_preferences'
]

def get_table_schema_improved(aurora_conn, table_name):
    """Get CREATE TABLE statement with proper ARRAY and JSONB handling"""
    with aurora_conn.cursor() as cursor:
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default,
                   character_maximum_length, numeric_precision, numeric_scale,
                   udt_name
            FROM information_schema.columns 
            WHERE table_name = %s AND table_schema = 'public'
            ORDER BY ordinal_position
        """, (table_name,))
        
        columns = cursor.fetchall()
        if not columns:
            return None
        
        create_sql = f"CREATE TABLE IF NOT EXISTS {table_name} (\n"
        column_defs = []
        
        for col in columns:
            col_name, data_type, is_nullable, default, max_length, precision, scale, udt_name = col
            
            # Handle data types with special cases
            if udt_name == '_text':  # Array of text
                col_type = "TEXT[]"
            elif udt_name == '_varchar':  # Array of varchar
                col_type = "VARCHAR[]"
            elif data_type == 'ARRAY':
                col_type = "TEXT[]"  # Default array type
            elif data_type == 'character varying':
                col_type = f"VARCHAR({max_length})" if max_length else "TEXT"
            elif data_type == 'numeric' and precision and scale:
                col_type = f"NUMERIC({precision},{scale})"
            elif data_type == 'timestamp without time zone':
                col_type = "TIMESTAMP"
            elif data_type == 'timestamp with time zone':
                col_type = "TIMESTAMPTZ"
            elif data_type == 'uuid':
                col_type = "UUID"
            elif data_type == 'boolean':
                col_type = "BOOLEAN"
            elif data_type == 'integer':
                col_type = "INTEGER"
            elif data_type == 'bigint':
                col_type = "BIGINT"
            elif data_type == 'text':
                col_type = "TEXT"
            elif data_type == 'jsonb':
                col_type = "JSONB"
            elif data_type == 'json':
                col_type = "JSONB"
            else:
                col_type = data_type.upper()
            
            nullable = "" if is_nullable == 'YES' else " NOT NULL"
            
            # Handle defaults
            default_clause = ""
            if default and default.lower() not in ['null', '']:
                if 'nextval' in default.lower():
                    pass  # Skip sequence defaults
                elif 'uuid_generate_v4()' in default.lower():
                    default_clause = " DEFAULT gen_random_uuid()"
                elif default.startswith("'") or default.lower() in ['true', 'false']:
                    default_clause = f" DEFAULT {default}"
            
            column_defs.append(f"    {col_name} {col_type}{nullable}{default_clause}")
        
        create_sql += ",\n".join(column_defs) + "\n);"
        return create_sql

def convert_value_for_postgres(value, column_name, data_type):
    """Convert values for PostgreSQL compatibility"""
    if value is None:
        return None
    
    # Handle JSON/JSONB columns
    if isinstance(value, dict) or isinstance(value, list):
        return Json(value)
    
    # Handle arrays
    if isinstance(value, list) and all(isinstance(x, str) for x in value):
        return value  # PostgreSQL can handle string arrays directly
    
    return value

def migrate_failed_table(aurora_conn, postgres_conn, table_name):
    """Migrate a previously failed table with improved handling"""
    print(f"Retrying migration of {table_name}...")
    
    # Drop existing table if it exists
    try:
        with postgres_conn.cursor() as cursor:
            cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
            postgres_conn.commit()
    except Exception as e:
        print(f"  {table_name}: Warning dropping table - {e}")
        postgres_conn.rollback()
    
    # Get improved schema
    schema_sql = get_table_schema_improved(aurora_conn, table_name)
    if not schema_sql:
        print(f"  {table_name}: Could not get schema")
        return False
    
    # Create table
    try:
        with postgres_conn.cursor() as cursor:
            cursor.execute(schema_sql)
            postgres_conn.commit()
            print(f"  {table_name}: Table structure created")
    except Exception as e:
        print(f"  {table_name}: Error creating table - {e}")
        postgres_conn.rollback()
        return False
    
    # Get data with proper handling
    try:
        with aurora_conn.cursor() as cursor:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            row_count = cursor.fetchone()[0]
            
        if row_count == 0:
            print(f"  {table_name}: No data to migrate")
            return True
            
        print(f"  {table_name}: Migrating {row_count} rows")
        
        # Get column info for data conversion
        with aurora_conn.cursor() as cursor:
            cursor.execute("""
                SELECT column_name, data_type, udt_name
                FROM information_schema.columns 
                WHERE table_name = %s AND table_schema = 'public'
                ORDER BY ordinal_position
            """, (table_name,))
            column_info = {row[0]: {'data_type': row[1], 'udt_name': row[2]} for row in cursor.fetchall()}
        
        # Get all data
        with aurora_conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(f"SELECT * FROM {table_name}")
            rows = cursor.fetchall()
        
        if rows:
            columns = list(rows[0].keys())
            placeholders = ', '.join(['%s'] * len(columns))
            insert_sql = f"""
                INSERT INTO {table_name} ({', '.join(columns)}) 
                VALUES ({placeholders})
                ON CONFLICT DO NOTHING
            """
            
            # Convert data and insert in batches
            batch_size = 100  # Smaller batches for complex data
            with postgres_conn.cursor() as cursor:
                for i in range(0, len(rows), batch_size):
                    batch = rows[i:i + batch_size]
                    
                    # Convert values for each row
                    converted_batch = []
                    for row in batch:
                        converted_row = []
                        for col in columns:
                            col_info = column_info.get(col, {})
                            converted_value = convert_value_for_postgres(
                                row[col], col, col_info.get('data_type')
                            )
                            converted_row.append(converted_value)
                        converted_batch.append(tuple(converted_row))
                    
                    cursor.executemany(insert_sql, converted_batch)
                    postgres_conn.commit()
                    print(f"  {table_name}: Inserted batch {i//batch_size + 1}")
        
        print(f"  {table_name}: Migration complete")
        return True
        
    except Exception as e:
        print(f"  {table_name}: Error migrating data - {e}")
        postgres_conn.rollback()
        return False

def main():
    print("Starting retry migration for failed tables...")
    
    try:
        aurora_conn = psycopg2.connect(**AURORA_CONFIG)
        postgres_conn = psycopg2.connect(**POSTGRES_CONFIG)
        print("Database connections established")
    except Exception as e:
        print(f"Connection error: {e}")
        return False
    
    success_count = 0
    still_failed = []
    
    for table_name in FAILED_TABLES:
        print(f"\n--- Retrying {table_name} ---")
        
        if migrate_failed_table(aurora_conn, postgres_conn, table_name):
            success_count += 1
        else:
            still_failed.append(table_name)
    
    aurora_conn.close()
    postgres_conn.close()
    
    print(f"\n=== Retry Migration Summary ===")
    print(f"Successfully migrated: {success_count} tables")
    print(f"Still failed: {len(still_failed)} tables")
    
    if still_failed:
        print(f"Still failed tables: {', '.join(still_failed)}")
    else:
        print("All previously failed tables have been successfully migrated!")
    
    return len(still_failed) == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
