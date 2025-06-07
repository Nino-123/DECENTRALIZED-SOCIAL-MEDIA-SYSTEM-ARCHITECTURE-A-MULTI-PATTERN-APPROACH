import os
import psycopg2
import httpx
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel

# --- Basic Setup ---
app = FastAPI()

# --- Database Connection ---
def get_db_connection():
    conn = psycopg2.connect(
        host=os.environ.get("POSTGRES_HOST"),
        database=os.environ.get("POSTGRES_DB"),
        user=os.environ.get("POSTGRES_USER"),
        password=os.environ.get("POSTGRES_PASSWORD")
    )
    return conn

# --- Database Initialization ---
def initialize_database():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS peers (
        id SERIAL PRIMARY KEY,
        hostname VARCHAR(255) UNIQUE NOT NULL
    );
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS federated_posts (
        id SERIAL PRIMARY KEY,
        original_post_id INTEGER,
        original_user_username VARCHAR(255),
        original_instance_hostname VARCHAR(255),
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()
    cur.close()
    conn.close()
    print("'peers' and 'federated_posts' tables are ready.")

initialize_database()

# --- Pydantic Models for Data Validation ---
class PostData(BaseModel):
    content: str
    username: str
    post_id: int

class PeerData(BaseModel):
    hostname: str

# --- API Endpoints ---

# Endpoint for receiving a new post from another instance
@app.post("/receive")
async def receive_post(post_data: PostData, request: Request):
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        sender_hostname = x_forwarded_for.split(',')[0].strip()
    else:
        sender_hostname = request.client.host

    print(f"Receiving post from {sender_hostname}: {post_data.content}")
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO federated_posts (original_post_id, original_user_username, original_instance_hostname, content) VALUES (%s, %s, %s, %s)",
        (post_data.post_id, post_data.username, sender_hostname, post_data.content)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Post received successfully"}

# Internal endpoint called by our own API gateway to broadcast a new post
@app.post("/internal/federate")
async def federate_post(post_data: PostData):
    print(f"Starting federation for post: {post_data.post_id}")
    own_hostname = os.environ.get("INSTANCE_HOSTNAME")
    if not own_hostname:
        return {"message": "Federation skipped, INSTANCE_HOSTNAME not configured."}

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT hostname FROM peers")
    peers = cur.fetchall()
    cur.close()
    conn.close()
    
    headers = {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'DeBlogFederationService/1.0'
    }

    async with httpx.AsyncClient() as client:
        for peer in peers:
            peer_hostname = peer[0]
            if peer_hostname == own_hostname:
                print(f"Skipping self-federation to {peer_hostname}")
                continue

            try:
                protocol = "https" if "ngrok-free.app" in peer_hostname else "http"
                url = f"{protocol}://{peer_hostname}/api/federation/receive"
                print(f"Sending post to {url}")
                await client.post(url, json=post_data.dict(), headers=headers, timeout=5.0)
            except httpx.RequestError as exc:
                print(f"Could not send post to {peer_hostname}. Error: {exc}")
    
    return {"message": "Federation process initiated"}

# Internal endpoint to broadcast a post deletion
@app.post("/internal/federate-delete")
async def federate_delete(data: dict):
    post_id = data.get("post_id")
    if not post_id:
        raise HTTPException(status_code=400, detail="post_id is required")

    own_hostname = os.environ.get("INSTANCE_HOSTNAME")
    if not own_hostname:
        return {"message": "Federation skipped, INSTANCE_HOSTNAME not configured."}

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT hostname FROM peers")
    peers = cur.fetchall()
    cur.close()
    conn.close()
    
    headers = {'ngrok-skip-browser-warning': 'true'}

    async with httpx.AsyncClient() as client:
        for peer in peers:
            peer_hostname = peer[0]
            if peer_hostname == own_hostname:
                continue
            
            try:
                protocol = "https" if "ngrok-free.app" in peer_hostname else "http"
                url = f"{protocol}://{peer_hostname}/api/federation/posts/{post_id}"
                print(f"Sending delete request for post {post_id} to {url}")
                await client.delete(url, headers=headers, timeout=5.0)
            except httpx.RequestError as exc:
                print(f"Could not send delete request to {peer_hostname}. Error: {exc}")
                
    return {"message": "Federated delete process initiated"}

# Public endpoint for receiving a delete notice from another instance
@app.delete("/posts/{post_id}")
async def receive_delete(post_id: int, request: Request):
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        sender_hostname = x_forwarded_for.split(',')[0].strip()
    else:
        sender_hostname = request.client.host

    print(f"Received delete request for post {post_id} from {sender_hostname}")
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM federated_posts WHERE original_post_id = %s AND original_instance_hostname = %s",
        (post_id, sender_hostname)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Federated post deletion acknowledged."}

# Endpoint to add a new peer
@app.post("/peers")
async def add_peer(peer_data: PeerData):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO peers (hostname) VALUES (%s)", (peer_data.hostname,))
        conn.commit()
    except psycopg2.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=409, detail="Peer already exists")
    finally:
        cur.close()
        conn.close()
    return {"message": f"Peer {peer_data.hostname} added."}

# Endpoint to get all peers
@app.get("/peers")
async def get_peers():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT hostname FROM peers")
    peers = [row[0] for row in cur.fetchall()]
    cur.close()
    conn.close()
    return {"peers": peers}

# Endpoint to delete a peer
@app.delete("/peers")
async def delete_peer(peer_data: PeerData):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM peers WHERE hostname = %s", (peer_data.hostname,))
    conn.commit()
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Peer not found")
    cur.close()
    conn.close()
    return {"message": f"Peer {peer_data.hostname} deleted."}
