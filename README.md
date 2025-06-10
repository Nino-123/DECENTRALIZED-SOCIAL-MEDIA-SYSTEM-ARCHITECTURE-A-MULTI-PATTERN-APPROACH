# DeBlog: A Decentralized Blogging Platform

DeBlog is a proof-of-concept decentralized, federated social blogging platform built on a modern microservice architecture. It allows independent instances of the platform to communicate with each other, sharing posts in a decentralized manner without a single central authority.

This project is designed to be a learning tool and a template for building robust, containerized, and federated web applications.

---

## Features

* **Decentralized Federation:** Instances can be linked together by adding them as "peers." New posts are automatically sent to all peer instances.
* **User Authentication:** Secure user registration and login system using JWT (JSON Web Tokens).
* **Post Management:** Logged-in users can create and delete their own posts.
* **User Profiles:** Clickable `user@instance` links that lead to a profile page showing all posts by that specific user.
* **Peer Management UI:** A simple interface for adding and removing peer instances directly from the web app.
* **Dark Mode:** A sleek dark mode with a manual toggle, with the user's preference saved locally.
* **Containerized Architecture:** Fully containerized with Docker and managed with Docker Compose for easy setup and deployment.

---

## Architecture

The platform is built using a six-container microservice architecture, which separates concerns and allows for scalability and maintainability.

1.  **`reverse-proxy` (Nginx):** The single entry point for all web traffic. It routes requests to the appropriate backend service (e.g., `/api/auth/*` goes to the auth service, `/` goes to the frontend).
2.  **`frontend-app` (React):** The user interface that runs in the browser. It's a single-page application built with React and styled with Tailwind CSS.
3.  **`api-gateway` (Node.js/Express):** The main "brain" of the application. It handles core logic like creating/deleting posts, managing user profiles, and acting as a secure proxy to the federation service.
4.  **`auth-service` (Node.js/Express):** A dedicated service for handling user registration, login, and issuing secure JWTs.
5.  **`federation-service` (Python/FastAPI):** The service responsible for the decentralized communication. It sends new posts to peers and receives incoming posts from other instances.
6.  **`database` (PostgreSQL):** The persistent data store for all application data, including users, posts, and the peer list.

---

## Getting Started

### Prerequisites

* Git
* Docker
* Docker Compose (usually included with Docker Desktop or as a plugin on Linux)

### Installation

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/madrazaldi/DeBlog.git](https://github.com/madrazaldi/DeBlog.git)
    cd DeBlog
    ```

2.  **Configure Environment Variables:**
    Create a file named `.env` in the root of the project directory. Copy the contents of `.env.example` into it and fill in the values.

    **`.env` file:**
    ```
    # --- PostgreSQL Database Configuration ---
    POSTGRES_USER=blogadmin
    POSTGRES_PASSWORD=your_super_secret_db_password
    POSTGRES_DB=blog_platform

    # --- Auth Service Configuration ---
    JWT_SECRET=your_super_secret_jwt_key_32_chars_long

    # --- Federation Service Configuration ---
    # The public-facing hostname of THIS specific instance.
    # e.g., INSTANCE_HOSTNAME=192.0.2.100 or INSTANCE_HOSTNAME=my-blog.ngrok-free.app
    INSTANCE_HOSTNAME=your_public_ip_or_domain
    ```

3.  **Build and Run the Application:**
    From the root of the project directory, run the following command. This will build all the service images and start the containers in the background.
    ```bash
    docker compose up -d --build
    ```

4.  **Access the Application:**
    Open your web browser and navigate to the IP address or domain name of your server (e.g., `http://your_server_ip`).

---

## How to Federate

To test the decentralized federation, you need at least two running instances of DeBlog. A common way to test this is to run one instance on a public server (VPS) and one on your local machine using `ngrok`.

1.  **Set up Instance A (VPS):** Follow the installation steps above. For the `.env` file, set `INSTANCE_HOSTNAME` to your VPS's public IP address.

2.  **Set up Instance B (Local Machine):**
    * Follow the installation steps on your local machine.
    * Install `ngrok`.
    * Start a tunnel to your local instance's port 80: `./ngrok http 80`
    * `ngrok` will give you a public URL (e.g., `https://random-string.ngrok-free.app`). Use this as the `INSTANCE_HOSTNAME` in your local `.env` file.
    * Run `docker compose up -d --build` on your local machine.

3.  **Perform the Peer Exchange:**
    * Log into your app on **Instance A**. Go to the "Peer Management" section and add the hostname of **Instance B** (your ngrok URL).
    * Log into your app on **Instance B** (by going to the ngrok URL). Go to "Peer Management" and add the hostname of **Instance A** (your VPS IP).

4.  **Test Federation:**
    Create a post on Instance A. Within a few seconds, it should appear on the main feed of Instance B, and vice-versa.

---

## Technology Stack

* **Frontend:** React, Tailwind CSS
* **Backend (API Gateway & Auth):** Node.js, Express.js
* **Federation Service:** Python, FastAPI, HTTPX
* **Database:** PostgreSQL
* **Infrastructure:** Docker, Docker Compose, Nginx

## Group Members
* Muhammad Razan Alamudi (23/511396/PA/21784)
* Satwika Nino Wandhana (23/516202/PA/22066)