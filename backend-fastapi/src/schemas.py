from pydantic import BaseModel
from typing import List, Optional

class CollectionBase(BaseModel):
    totalItems: int
    limit: int
    offset: int

class ShelterBase(BaseModel):
    name: str
    location: str
    phone: str
    status: str
    link: Optional[str] = None
    capacity: Optional[int] = None
    current_occupancy: Optional[int] = None
    available_spaces: Optional[int] = None
    facilities: Optional[List[str]] = []
    contact_person: Optional[str] = None
    notes: Optional[str] = None
    opening_hours: Optional[str] = None


class ShelterCreate(ShelterBase):
    pass


class ShelterPatch(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None


class Shelter(ShelterBase):
    id: str
    created_at: int
    updated_at: int

    class Config:
        from_attributes = True


class ShelterCollection(CollectionBase):
    member: List[Shelter]