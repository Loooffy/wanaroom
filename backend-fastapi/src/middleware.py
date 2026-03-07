from uuid import UUID
from typing import Callable

from fastapi_jwt_auth2 import AuthJWT
from fastapi_jwt_auth2.exceptions import AuthJWTException, MissingTokenError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

from src.auth.schemas import UserInToken


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request - validate JWT and set request.state.user."""
        authorize = AuthJWT(request)
        try:
            authorize.jwt_required()
            subject = authorize.get_jwt_subject()
            request.state.user = UserInToken(id=UUID(subject))
        except MissingTokenError:
            request.state.user = None  # anonymous users
        except AuthJWTException as exc:
            return JSONResponse(
                status_code=getattr(exc, "status_code", 401),
                content={"detail": getattr(exc, "message", str(exc))},
            )

        response = await call_next(request)
        return response
