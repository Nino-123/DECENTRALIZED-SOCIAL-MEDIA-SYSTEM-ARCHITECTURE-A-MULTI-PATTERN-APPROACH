from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    decentralized_id: str
    username: str

class UserCreate(UserBase):
    public_key: str

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class User(UserBase):
    display_name: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True