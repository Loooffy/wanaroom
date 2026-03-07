"""Auth-related Pydantic schemas."""

from uuid import UUID

from pydantic import BaseModel


class TokenPayload(BaseModel):
    """JWT token payload - standard claims."""

    sub: str  # subject (user_id)
    exp: int | None = None  # expiration
    iat: int | None = None  # issued at


class UserInToken(BaseModel):
    """Minimal user representation from JWT - used in request.state."""

    id: UUID

    class Config:
        from_attributes = True
