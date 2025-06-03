from fastapi import FastAPI
from database import engine, Base
from routers import users, auth
import models

# Create the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SkyLink User Service",
    description="Handles decentralized identity and user profiles for SkyLink",
    version="0.1.0",
)

app.include_router(auth.router)
app.include_router(users.router)

@app.get("/")
def read_root():
    return {"message": "SkyLink User Service"}