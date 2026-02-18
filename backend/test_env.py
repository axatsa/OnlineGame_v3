try:
    import fastapi
    import sqlalchemy
    import uvicorn
    import dotenv
    print("Imports successful")
except ImportError as e:
    print(f"Import failed: {e}")
    exit(1)
