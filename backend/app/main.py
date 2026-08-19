import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import api_router

app = FastAPI(
    title="Multi-Area Campus Network Simulator API",
    description="Backend API for Campus Network Simulation across LAN, MAN, and WAN",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
