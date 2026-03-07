from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi_jwt_auth2 import AuthJWT
from fastapi_jwt_auth2.exceptions import AuthJWTException

from .config import settings
from .routers import (shelters)


@AuthJWT.load_config
def get_auth_config():
    return [
        ("authjwt_secret_key", settings.SECRET_KEY),
        ("authjwt_algorithm", settings.ALGORITHM),
    ]


app = FastAPI(
    title=settings.APP_TITLE,
    version="v1.1.0",
    description="Backend API.",
    servers=settings.fast_api_servers
)


@app.exception_handler(AuthJWTException)
def authjwt_exception_handler(_request: Request, exc: AuthJWTException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


app.include_router(shelters.router)