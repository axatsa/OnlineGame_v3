from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from config import DATABASE_URL
from database import engine, Base
from routes import auth, classes, generator, admin

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ClassPlay Backend")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"REQUEST: {request.method} {request.url}")
    print(f"HEADERS: {request.headers}")
    try:
        response = await call_next(request)
        print(f"RESPONSE STATUS: {response.status_code}")
        return response
    except Exception as e:
        print(f"REQUEST FAILED: {str(e)}")
        raise e

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://bekhruzabdullaev.uz",
    "http://bekhruzabdullaev.uz:8090",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(classes.router)
app.include_router(generator.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to ClassPlay API"}

@app.get("/health")
def health_check():
    return {"status": "ok", "database_url_configured": bool(DATABASE_URL)}
