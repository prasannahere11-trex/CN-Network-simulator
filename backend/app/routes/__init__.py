from fastapi import APIRouter
from app.routes.health import router as health_router
from app.routes.devices import router as devices_router
from app.routes.links import router as links_router
from app.routes.packets import router as packets_router
from app.routes.routing import router as routing_router
from app.routes.monitoring import router as monitoring_router
from app.routes.simulation import router as simulation_router

api_router = APIRouter(prefix="/api")

api_router.include_router(health_router)
api_router.include_router(devices_router)
api_router.include_router(links_router)
api_router.include_router(packets_router)
api_router.include_router(routing_router)
api_router.include_router(monitoring_router)
api_router.include_router(simulation_router)
