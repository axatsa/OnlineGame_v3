from database import Base, engine
from models import User, TokenUsage, ClassGroup
import sys

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)

print("Starting database reset...", flush=True)
try:
    print("Dropping all tables...", flush=True)
    Base.metadata.drop_all(bind=engine)
    print("All tables dropped successfully.", flush=True)
except Exception as e:
    print(f"Error dropping tables: {e}", flush=True)
    sys.exit(1)
