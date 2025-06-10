# DeBlog – A Decentralized Blogging Platform

> A proof-of-concept decentralized, federated social blogging platform built using a modern microservice architecture. DeBlog enables communication between independent instances without central authority, designed as a learning tool for scalable, federated, and containerized systems.

---

## 🚀 Overview

DeBlog is a decentralized social blogging platform that embraces the principles of federation and autonomy. Each instance operates independently but can connect to other instances by adding them as "peers," allowing shared content across networks. It aims to:

* Demonstrate containerized microservice architecture
* Support secure user and post management
* Enable instance-to-instance communication
* Provide a UI-rich user experience (including dark mode)

---

## 🌟 Features

* **Decentralized Federation**: Add peer instances to receive and propagate posts across networks
* **JWT-based Authentication**: Secure login and registration
* **User Profile Pages**: Accessible via `user@instance` links
* **Post Management**: Create/delete personal blog posts
* **Peer Management Interface**: Add/remove peers from within the app
* **Dark Mode Support**: Toggle interface theme with preference saved locally
* **Fully Containerized**: Docker + Docker Compose setup for rapid deployment

---

## 📆 Architecture Overview

DeBlog uses a 6-container microservice architecture, optimized for modularity and horizontal scaling:

| Service              | Description                                                        |
| -------------------- | ------------------------------------------------------------------ |
| `reverse-proxy`      | Nginx router that directs traffic to appropriate services          |
| `frontend-app`       | React + Tailwind SPA client                                        |
| `api-gateway`        | Node.js Express backend to manage posts, profiles, and proxy logic |
| `auth-service`       | Node.js Express service for handling JWT-based auth                |
| `federation-service` | FastAPI-based microservice for peer communication                  |
| `database`           | PostgreSQL datastore                                               |


Frontend (Web UI)         Backend Services                          Databases / Storage

┌─ frontend-app           ┌─ auth-service       (localhost:8001)    ┌─ userdb      (PostgreSQL: 5432)
│  (React, Tailwind)      │  • JWT signup/login │                    │
│                         │                      ├─ api-gateway   (localhost:8002) ─── PostgreSQL / Peers & Posts
│  • Users login          │                      │
│  • Write posts          ├─ federation-service (localhost:8003)    └─ media storage (if included)
│  • View feeds           │  • HTTPX → peers    │
└─────────────────────────┘                      │
                                                 └─ reverse-proxy (Nginx: 80/443)
                                                    • Routes /api/auth → auth-service
                                                    • /api/* → api-gateway
                                                    • Federation callbacks → federation-service


---

## 📂 Project Structure

decentralized-social-media/
├─ docker-compose.yml        # Orchestrates all services
├─ README.md                 # Project documentation
├─ frontend-app/            # React SPA
│   ├─ src/
│   │   ├─ App.js           # Main UI
│   │   ├─ components/      # UI pieces: PostForm, Feed, PeerList, DarkModeToggle
│   │   └─ api/             # Frontend API clients (auth.js, posts.js, federation.js)
│   └─ package.json
├─ auth-service/            # Node.js + Express + JWT
│   ├─ routes.js           # /register, /login
│   ├─ auth.js             # JWT logic & middleware
│   ├─ models.js           # User schema for PostgreSQL
│   └─ Dockerfile
├─ api-gateway/            # Node.js + Express
│   ├─ routes/
│   │   ├─ posts.js        # Create, delete posts
│   │   ├─ users.js        # Profile endpoints
│   │   └─ peers.js        # Manage peer instances
│   ├─ federation-client.js# RPC to federation service
│   └─ Dockerfile
├─ federation-service/     # Python + FastAPI + HTTPX
│   ├─ main.py             # /incoming-post endpoint
│   ├─ peers.py            # Send outbound posts
│   └─ Dockerfile
└─ database/               # PostgreSQL (launched via Docker Compose)

---

## 🚪 Getting Started

### Prerequisites

* Git
* Docker
* Docker Compose

### Installation Steps

1. **Clone the Repository**

```bash
git clone https://github.com/madrazaldi/DeBlog.git
cd DeBlog
```

2. **Environment Configuration**
   Create a `.env` file in the project root:

```bash
.env
```

Edit the values in `.env` as needed:

```env
# .env
# NEVER commit this file to version control.

# --- PostgreSQL Database Configuration ---
POSTGRES_USER=blogadmin
POSTGRES_PASSWORD=lollmaoxd
POSTGRES_DB=blog_platform
INSTANCE_HOSTNAME=localhost

# --- Auth Service Configuration ---
# Use a long, random, and secret string for production.
# You can generate one using: openssl rand -base64 32
JWT_SECRET=QMadMUO0/D9UuZjhlypbVixijaDKJyXvWztc2SknFLM=
```

3. **Build and Launch the Application**

```bash
docker compose up -d --build
```

4. **Access the Web App**
   Open a browser at `http://<your_instance_ip_or_domain>`

---

## 🧰 Federation Guide

To test DeBlog's decentralized federation:

### ① Setup Instance A (Public Server)

* Install as above on your VPS
* Set `INSTANCE_HOSTNAME` to public IP/domain

### ② Setup Instance B (Local Machine with ngrok)

* Install locally as above
* Start an ngrok tunnel:

```bash
./ngrok http 80
```

* Use the provided ngrok URL as `INSTANCE_HOSTNAME` in `.env`

### ③ Perform Peer Exchange

* On Instance A, add ngrok URL of B as peer
* On Instance B, add IP/domain of A as peer

### ④ Test Cross-Instance Posting

* Create posts from either instance and observe them appear on the peer feed

---

## 📚 Tech Stack

| Layer          | Tech                          |
| -------------- | ----------------------------- |
| Frontend       | React, Tailwind CSS           |
| API Gateway    | Node.js, Express.js           |
| Authentication | Node.js, Express.js, JWT      |
| Federation     | Python, FastAPI, HTTPX        |
| Database       | PostgreSQL                    |
| Infrastructure | Docker, Docker Compose, Nginx |

---

## 💼 Contributors

* Muhammad Razan Alamudi
  `23/511396/PA/21784`
* Satwika Nino Wandhana
  `23/516202/PA/22066`

---

## 📖 License

This project is intended for educational use and prototyping.
