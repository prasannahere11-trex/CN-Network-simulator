from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import api_router

app = FastAPI(
    title="Multi-Area Campus Network Simulator API",
    description="Backend API for Campus Network Simulation across LAN, MAN, and WAN",
    version="2.0.0"
)

# Explicit allowed origins
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes with /api prefix
app.include_router(api_router)


@app.get("/")
def root():
    return {
        "name": "Multi-Area Campus Network Simulator API",
        "version": "2.0.0",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
