from fastapi import Depends
from .database import get_db
from sqlalchemy.orm import Session

def get_db_dependency():
    return Depends(get_db)