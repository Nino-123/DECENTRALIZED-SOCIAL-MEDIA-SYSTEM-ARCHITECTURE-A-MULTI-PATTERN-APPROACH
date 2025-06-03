from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..schemas import UserCreate
from .. import models, auth
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=UserCreate)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    # Check if username already exists
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Verify the user owns the decentralized_id by checking a signature
    # This is a mock - in reality you'd have a signed message from the user
    signature_valid = auth.verify_signature(
        public_key=user.public_key,
        signature="mock-signature",
        message=f"Register:{user.decentralized_id}"
    )
    if not signature_valid:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Create the user
    db_user = models.User(
        decentralized_id=user.decentralized_id,
        public_key=user.public_key,
        username=user.username
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # In a decentralized system, this would work differently
    # This is a simplified version for demonstration
    
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Normally you'd verify a cryptographic signature here
    # For demo, we're just checking the password is the username reversed
    if form_data.password != user.username[::-1]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(
        data={"sub": user.decentralized_id}
    )
    return {"access_token": access_token, "token_type": "bearer"}