#!/usr/bin/env python3

import psycopg2
import sys
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

# All tables to migrate (excluding the 3 we already migrated)
TABLES_TO_MIGRATE = [
    'anonymous_data_pool',
    'content_items',
    'detox_types',
    'dietary_protocols',
    'food_categories',
    'food_category_mappings',
    'food_nutritional_data',
    'food_protocol_relationships',
    'foods',
    'medications_database',
    'protocol_food_rules',
    'supplements_database',
    'symptoms_database',
    'user_custom_foods',
    'user_dietary_protocols',
    'user_frequent_items',
    'user_meal_ingredients',
    'user_meals',
    'user_preferences',
    'user_sessions',
    'patient_content',
    'user_health_metrics',
    'user_symptoms',
    'user_medications',
    'user_supplements',
    'user_detox_sessions',
    'user_protocol_adherence',
    'user_food_reactions',
    'user_meal_ratings',
    'user_progress_notes',
    'system_notifications',
    'user_notifications',
    'audit_logs',
    'data_export_requests',
    'user_data_sharing',
    'platform_analytics'
]

def get_table_schema(aurora_conn, table_name):
    """Get CREATE TABLE statement for a table"""
    with aurora_conn.cursor() as cursor:
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default,
                   character_maximum_length, numeric_precision, numeric_scale
            FROM information_schema.columns 
            WHERE table_name = %s AND table_schema = 'public'
            ORDER BY ordinal_position
        """, (table_name,))
        
        columns = cursor.fetchall()
        if not columns:
            return None
            
        # Get constraints
        cursor.execute("""
            SELECT constraint_name, constraint_type, column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = %s AND tc.table_schema = 'public'
        """, (table_name,))
        
        constraints = cursor.fetchall()
        
        # Build CREATE TABLE statement
        create_sql = f"CREATE TABLE IF NOT EXISTS {table_name} (\n"
        
        column_defs = []
        for col in columns:
            col_name, data_type, is_nullable, default, max_length, precision, scale = col
            
            # Handle data type
            if data_type == 'character varying':
                if max_length:
                    col_type = f"VARCHAR({max_length})"
                else:
                    col_type = "TEXT"
            elif data_type == 'numeric' and precision and scale:
                col_type = f"NUMERIC({precision},{scale})"
            elif data_type == 'timestamp without time zone':
                col_type = "TIMESTAMP"
            elif data_type == 'timestamp with time zone':
                col_type = "TIMESTAMPTZ"
            else:
                col_type = data_type.upper()
            
            # Handle nullable
            nullable = "" if is_nullable == 'YES' else " NOT NULL"
            
            # Handle default
            default_clause = ""
            if default:
                if 'nextval' in default:
                    default_clause = " DEFAULT nextval('seq_name')"
                elif default not in ['NULL', 'null']:
                    default_clause = f" DEFAULT {default}"
            
            column_defs.append(f"    {col_name} {col_type}{nullable}{default_clause}")
        
        create_sql += ",\n".join(column_defs)
        
        # Add primary key constraint
        pk_cols = [c[2] for c in constraints if c[1] == 'PRIMARY KEY']
        if pk_cols:
            create_sql += f",\n    PRIMARY KEY ({', '.join(pk_cols)})"
        
        create_sql += "\n);"
        
        return create_sql

def migrate_table_data(aurora_conn, postgres_conn, table_name):
    """Migrate data from Aurora to PostgreSQL"""
    print(f"Migrating {table_name}...")
    
    # Get row count
    with aurora_conn.cursor() as cursor:
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        row_count = cursor.fetchone()[0]
        
    if row_count == 0:
        print(f"  {table_name}: No data to migrate")
        return True
        
    print(f"  {table_name}: {row_count} rows to migrate")
    
    # Get all data
    with aurora_conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
    
    if not rows:
        return True
        
    # Get column names
    columns = list(rows[0].keys())
    
    # Insert data in batches
    batch_size = 1000
    with postgres_conn.cursor() as cursor:
        for i in range(0, len(rows), batch_size):
            batch = rows[i:i + batch_size]
            
            # Build INSERT statement
            placeholders = ', '.join(['%s'] * len(columns))
            insert_sql = f"""
                INSERT INTO {table_name} ({', '.join(columns)}) 
                VALUES ({placeholders})
                ON CONFLICT DO NOTHING
            """
            
            # Prepare values
            values = []
            for row in batch:
                values.append(tuple(row[col] for col in columns))
            
            try:
                cursor.executemany(insert_sql, values)
                postgres_conn.commit()
                print(f"  {table_name}: Inserted batch {i//batch_size + 1}")
            except Exception as e:
                print(f"  {table_name}: Error inserting batch: {e}")
                postgres_conn.rollback()
                return False
    
    print(f"  {table_name}: Migration complete")
    return True

def main():
    print("Starting complete table migration from Aurora to PostgreSQL...")
    
    # Connect to databases
    try:
        aurora_conn = psycopg2.connect(**AURORA_CONFIG)
        postgres_conn = psycopg2.connect(**POSTGRES_CONFIG)
        print("Database connections established")
    except Exception as e:
        print(f"Connection error: {e}")
        return False
    
    success_count = 0
    failed_tables = []
    
    for table_name in TABLES_TO_MIGRATE:
        try:
            print(f"\n--- Processing {table_name} ---")
            
            # Check if table exists in Aurora
            with aurora_conn.cursor() as cursor:
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' AND table_name = %s
                    )
                """, (table_name,))
                
                if not cursor.fetchone()[0]:
                    print(f"  {table_name}: Table not found in Aurora, skipping")
                    continue
            
            # Get table schema
            schema_sql = get_table_schema(aurora_conn, table_name)
            if not schema_sql:
                print(f"  {table_name}: Could not get schema, skipping")
                failed_tables.append(table_name)
                continue
            
            # Create table in PostgreSQL
            with postgres_conn.cursor() as cursor:
                cursor.execute(schema_sql)
                postgres_conn.commit()
                print(f"  {table_name}: Table created")
            
            # Migrate data
            if migrate_table_data(aurora_conn, postgres_conn, table_name):
                success_count += 1
            else:
                failed_tables.append(table_name)
                
        except Exception as e:
            print(f"  {table_name}: Error - {e}")
            failed_tables.append(table_name)
            postgres_conn.rollback()
    
    # Close connections
    aurora_conn.close()
    postgres_conn.close()
    
    # Summary
    print(f"\n=== Migration Summary ===")
    print(f"Successfully migrated: {success_count} tables")
    print(f"Failed migrations: {len(failed_tables)} tables")
    
    if failed_tables:
        print(f"Failed tables: {', '.join(failed_tables)}")
        return False
    
    print("All table migrations completed successfully!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
