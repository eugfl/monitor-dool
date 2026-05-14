from fastapi import APIRouter
from app.api.v1.endpoints import edicoes, materias

api_router = APIRouter()

api_router.include_router(edicoes.router, prefix="/edicoes", tags=["Edições"])
api_router.include_router(materias.router, prefix="/materias", tags=["Matérias"])
