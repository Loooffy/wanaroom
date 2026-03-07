"""JWT token utilities - use AuthJWT for encoding/decoding.

For creating tokens in login endpoints:
    Authorize: AuthJWT = Depends()
    access_token = Authorize.create_access_token(subject=str(user.id))
"""
