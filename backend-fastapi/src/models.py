from sqlalchemy import (
    Column, String, DateTime, Integer, Boolean, Text, BigInteger
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from .database import Base

# --- Shelters ---
class Shelter(Base):
    __tablename__ = "shelters"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    link = Column(String)
    status = Column(String, nullable=False)
    capacity = Column(Integer)
    current_occupancy = Column(Integer)
    available_spaces = Column(Integer)
    facilities = Column(JSONB)  # 使用 JSONB 以獲得更佳的效能和功能
    contact_person = Column(String)
    notes = Column(Text)
    coordinates = Column(JSONB)
    opening_hours = Column(String)
    created_at = Column(BigInteger, nullable=False)
    updated_at = Column(BigInteger, nullable=False)
