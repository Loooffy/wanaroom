"""FastAPI auth dependencies - get_current_user for route guards."""

from uuid import UUID

from fastapi import Depends
from fastapi_jwt_auth2 import AuthJWT

from src.auth.schemas import UserInToken


def get_current_user(Authorize: AuthJWT = Depends()) -> UserInToken:
    """
    Validate JWT token and return user from payload.
    Use as dependency on routes that require authentication.

    :returns: UserInToken with user id from token payload
    :raises AuthJWTException: When token is invalid or expired
    """
    Authorize.jwt_required()
    subject = Authorize.get_jwt_subject()
    return UserInToken(id=UUID(subject))
