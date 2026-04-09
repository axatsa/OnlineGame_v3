from sqlalchemy import text
from database import engine

def fix_schema():
    columns_to_add = [
        ("is_active", "BOOLEAN DEFAULT TRUE"),
        ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ("phone", "VARCHAR"),
        ("school", "VARCHAR"),
        ("tokens_used_this_month", "INTEGER DEFAULT 0"),
        ("tokens_limit", "INTEGER DEFAULT 100000"),
        ("tokens_reset_at", "TIMESTAMP"),
        ("organization_id", "INTEGER REFERENCES organizations(id)"),
        ("onboarding_completed", "BOOLEAN DEFAULT FALSE")
    ]
    
    with engine.connect() as conn:
        print("Starting schema check for table 'users'...")
        for col_name, col_type in columns_to_add:
            try:
                # PostgreSQL specific check for column existence
                check_query = text(f"""
                    SELECT count(*) 
                    FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='{col_name}';
                """)
                exists = conn.execute(check_query).scalar()
                
                if exists == 0:
                    print(f"Adding column '{col_name}'...")
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"))
                    conn.commit()
                    print(f"Successfully added '{col_name}'.")
                else:
                    print(f"Column '{col_name}' already exists.")
            except Exception as e:
                print(f"Error processing column '{col_name}': {e}")
        
        print("Schema update complete.")

if __name__ == "__main__":
    fix_schema()
