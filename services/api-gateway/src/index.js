// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');

// --- Basic Setup ---
const app = express();
app.use(cors());
app.use(express.json());

// --- Database Connection ---
const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    port: 5432,
});

// --- Table Creation ---
const createPostsTable = async () => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user
            FOREIGN KEY(user_id) 
            REFERENCES users(id)
            ON DELETE CASCADE
    );
    `;
    try {
        await pool.query(queryText);
        console.log("'posts' table is ready.");
    } catch (err) {
        console.error("Error creating posts table:", err);
        process.exit(1);
    }
};

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token is invalid or expired' });
        }
        req.user = user;
        next();
    });
};

// --- API Endpoints ---

// POST /posts
app.post('/posts', authenticateToken, async (req, res) => {
    const { content } = req.body;
    const { id: userId, username } = req.user;

    if (!content) {
        return res.status(400).json({ error: 'Post content cannot be empty.' });
    }

    try {
        const newPostQuery = 'INSERT INTO posts(content, user_id) VALUES($1, $2) RETURNING id, content, created_at';
        const result = await pool.query(newPostQuery, [content, userId]);
        const newPost = result.rows[0];

        const federationServiceUrl = process.env.FEDERATION_SERVICE_URL;
        if (federationServiceUrl) {
            console.log('Notifying federation service...');
            axios.post(`${federationServiceUrl}/internal/federate`, {
                post_id: newPost.id,
                username: username,
                content: newPost.content
            }).catch(err => {
                console.error("Failed to notify federation service:", err.message);
            });
        }

        res.status(201).json(newPost);
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /posts
app.get('/posts', async (req, res) => {
    try {
        const localPostsQuery = `
            SELECT p.id, p.content, p.created_at, u.username, 'local' as type 
            FROM posts p JOIN users u ON p.user_id = u.id;
        `;
        const localPostsResult = await pool.query(localPostsQuery);
        const localPosts = localPostsResult.rows.map(post => ({ ...post, isFederated: false }));

        const federatedPostsQuery = `
            SELECT id, content, created_at, original_user_username as username, original_instance_hostname as instance, 'federated' as type
            FROM federated_posts;
        `;
        const federatedPostsResult = await pool.query(federatedPostsQuery);
        const federatedPosts = federatedPostsResult.rows.map(post => ({ ...post, isFederated: true }));

        const allPosts = [...localPosts, ...federatedPosts];
        allPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.status(200).json(allPosts);
    } catch (err) {
        console.error('Error fetching all posts:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /posts/:id
app.delete('/posts/:id', authenticateToken, async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const postQuery = 'SELECT user_id FROM posts WHERE id = $1';
        const postResult = await client.query(postQuery, [postId]);

        if (postResult.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found.' });
        }
        if (postResult.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'You can only delete your own posts.' });
        }

        await client.query('DELETE FROM posts WHERE id = $1', [postId]);
        
        const federationServiceUrl = process.env.FEDERATION_SERVICE_URL;
        if (federationServiceUrl) {
            console.log(`Notifying federation service to delete post ${postId}`);
            axios.post(`${federationServiceUrl}/internal/federate-delete`, {
                post_id: postId
            }).catch(err => {
                console.error("Failed to notify federation service of deletion:", err.message);
            });
        }
        
        await client.query('COMMIT');
        res.status(204).send();

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting post:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// --- Peer Management Endpoints ---

// GET /admin/peers
app.get('/admin/peers', authenticateToken, async (req, res) => {
    try {
        const federationServiceUrl = process.env.FEDERATION_SERVICE_URL;
        const response = await axios.get(`${federationServiceUrl}/peers`);
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Error fetching peers from federation service:", error.message);
        res.status(500).json({ error: "Could not fetch peers." });
    }
});

// POST /admin/peers
app.post('/admin/peers', authenticateToken, async (req, res) => {
    const { hostname } = req.body;
    if (!hostname) {
        return res.status(400).json({ error: 'Hostname is required.' });
    }

    try {
        const federationServiceUrl = process.env.FEDERATION_SERVICE_URL;
        const response = await axios.post(`${federationServiceUrl}/peers`, { hostname });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        console.error("Error adding peer via federation service:", error.message);
        res.status(500).json({ error: "Could not add peer." });
    }
});

// DELETE /admin/peers
app.delete('/admin/peers', authenticateToken, async (req, res) => {
    const { hostname } = req.body;
    if (!hostname) {
        return res.status(400).json({ error: 'Hostname is required.' });
    }

    try {
        const federationServiceUrl = process.env.FEDERATION_SERVICE_URL;
        const response = await axios.delete(`${federationServiceUrl}/peers`, { data: { hostname } });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        console.error("Error deleting peer via federation service:", error.message);
        res.status(500).json({ error: "Could not delete peer." });
    }
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    createPostsTable();
});
