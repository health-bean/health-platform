#!/usr/bin/env python3

import psycopg2
import sys
from psycopg2.extras import RealDictCursor

# Database connections (using private endpoints from bastion)
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

def check_existing_tables(postgres_conn):
    """Check what tables already exist in PostgreSQL"""
    with postgres_conn.cursor() as cursor:
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        return [row[0] for row in cursor.fetchall()]

def get_all_aurora_tables(aurora_conn):
    """Get all tables from Aurora"""
    with aurora_conn.cursor() as cursor:
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        return [row[0] for row in cursor.fetchall()]

def migrate_table_structure_and_data(aurora_conn, postgres_conn, table_name):
    """Migrate both structure and data for a table"""
    print(f"Migrating {table_name}...")
    
    # Get table structure using pg_dump approach
    with aurora_conn.cursor() as cursor:
        # Get column definitions
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default,
                   character_maximum_length, numeric_precision, numeric_scale
            FROM information_schema.columns 
            WHERE table_name = %s AND table_schema = 'public'
            ORDER BY ordinal_position
        """, (table_name,))
        
        columns = cursor.fetchall()
        if not columns:
            print(f"  {table_name}: No columns found, skipping")
            return False
        
        # Build CREATE TABLE statement
        create_sql = f"CREATE TABLE IF NOT EXISTS {table_name} (\n"
        column_defs = []
        
        for col in columns:
            col_name, data_type, is_nullable, default, max_length, precision, scale = col
            
            # Map data types
            if data_type == 'character varying':
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
            else:
                col_type = data_type.upper()
            
            nullable = "" if is_nullable == 'YES' else " NOT NULL"
            
            # Handle defaults
            default_clause = ""
            if default and default.lower() not in ['null', '']:
                if 'nextval' in default.lower():
                    # Skip sequence defaults for now
                    pass
                elif 'uuid_generate_v4()' in default.lower():
                    default_clause = " DEFAULT gen_random_uuid()"
                elif default.startswith("'") or default.lower() in ['true', 'false']:
                    default_clause = f" DEFAULT {default}"
            
            column_defs.append(f"    {col_name} {col_type}{nullable}{default_clause}")
        
        create_sql += ",\n".join(column_defs) + "\n);"
    
    # Create table in PostgreSQL
    try:
        with postgres_conn.cursor() as cursor:
            cursor.execute(create_sql)
            postgres_conn.commit()
            print(f"  {table_name}: Table structure created")
    except Exception as e:
        print(f"  {table_name}: Error creating table - {e}")
        postgres_conn.rollback()
        return False
    
    # Migrate data
    try:
        with aurora_conn.cursor() as cursor:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            row_count = cursor.fetchone()[0]
            
        if row_count == 0:
            print(f"  {table_name}: No data to migrate")
            return True
            
        print(f"  {table_name}: Migrating {row_count} rows")
        
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
            
            # Insert in batches
            batch_size = 500
            with postgres_conn.cursor() as cursor:
                for i in range(0, len(rows), batch_size):
                    batch = rows[i:i + batch_size]
                    values = [tuple(row[col] for col in columns) for row in batch]
                    
                    cursor.executemany(insert_sql, values)
                    postgres_conn.commit()
                    print(f"  {table_name}: Inserted batch {i//batch_size + 1}")
        
        print(f"  {table_name}: Migration complete")
        return True
        
    except Exception as e:
        print(f"  {table_name}: Error migrating data - {e}")
        postgres_conn.rollback()
        return False

def main():
    print("Starting complete table migration from Aurora to PostgreSQL...")
    
    try:
        aurora_conn = psycopg2.connect(**AURORA_CONFIG)
        postgres_conn = psycopg2.connect(**POSTGRES_CONFIG)
        print("Database connections established")
    except Exception as e:
        print(f"Connection error: {e}")
        return False
    
    # Get existing tables
    existing_tables = check_existing_tables(postgres_conn)
    print(f"Existing PostgreSQL tables: {existing_tables}")
    
    # Get all Aurora tables
    aurora_tables = get_all_aurora_tables(aurora_conn)
    print(f"Aurora tables found: {len(aurora_tables)} total")
    
    # Tables to migrate (exclude already migrated ones)
    tables_to_migrate = [t for t in aurora_tables if t not in existing_tables]
    print(f"Tables to migrate: {len(tables_to_migrate)}")
    
    success_count = 0
    failed_tables = []
    
    for table_name in tables_to_migrate:
        print(f"\n--- Processing {table_name} ---")
        
        if migrate_table_structure_and_data(aurora_conn, postgres_conn, table_name):
            success_count += 1
        else:
            failed_tables.append(table_name)
    
    aurora_conn.close()
    postgres_conn.close()
    
    print(f"\n=== Migration Summary ===")
    print(f"Successfully migrated: {success_count} tables")
    print(f"Failed migrations: {len(failed_tables)} tables")
    
    if failed_tables:
        print(f"Failed tables: {', '.join(failed_tables)}")
    
    print("Migration completed!")
    return len(failed_tables) == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
