from sqlalchemy import Column, String, Text, DateTime, func
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    decentralized_id = Column(String, primary_key=True, index=True)
    public_key = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    display_name = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())