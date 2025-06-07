import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// --- Configuration ---
const AUTH_API_PREFIX = '/api/auth';
const POSTS_API_PREFIX = '/api';
const ADMIN_API_PREFIX = '/api/admin';

const styles = {
    container: { fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px', backgroundColor: '#f9f9f9' },
    form: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px', backgroundColor: 'white' },
    input: { padding: '10px', fontSize: '1em', borderRadius: '5px', border: '1px solid #ccc' },
    button: { padding: '10px 15px', fontSize: '1em', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' },
    post: { border: '1px solid #e0e0e0', padding: '15px', borderRadius: '8px', marginBottom: '15px', backgroundColor: 'white' },
    postHeader: { fontSize: '0.8em', color: '#555', marginTop: '10px' }
};

function App() {
    // --- State Management ---
    const [posts, setPosts] = useState([]);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [postContent, setPostContent] = useState('');
    const [isLoginView, setIsLoginView] = useState(true);
    const [error, setError] = useState('');
    const [peers, setPeers] = useState([]);
    const [newPeerHostname, setNewPeerHostname] = useState('');

    // --- Data Fetching ---
    const fetchPosts = useCallback(async () => {
        try {
            const response = await axios.get(`${POSTS_API_PREFIX}/posts`);
            setPosts(response.data);
        } catch (err) {
            console.error("Error fetching posts:", err);
            setError('Could not fetch posts.');
        }
    }, []);

    const fetchPeers = useCallback(async () => {
        if (!token) return;
        try {
            const response = await axios.get(`${ADMIN_API_PREFIX}/peers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPeers(response.data.peers);
        } catch (err) {
            console.error("Error fetching peers:", err);
        }
    }, [token]);

    useEffect(() => {
        fetchPosts();
        if (token) {
            fetchPeers();
        }
    }, [token, fetchPosts, fetchPeers]);

    // --- Handlers ---
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${AUTH_API_PREFIX}/login`, { username, password });
            const { token, user } = response.data;
            setToken(token);
            setCurrentUser(user);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUsername('');
            setPassword('');
            setError('');
        } catch (err) {
            console.error("Login failed:", err);
            setError('Login failed. Please check credentials.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${AUTH_API_PREFIX}/register`, { username, password });
            setError('Registration successful! Please log in.');
            setIsLoginView(true);
            setUsername('');
            setPassword('');
        } catch (err) {
            console.error("Registration failed:", err);
            setError('Registration failed. Username might already be taken.');
        }
    };
    
    const handleLogout = () => {
        setToken(null);
        setCurrentUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!postContent) return;
        try {
            await axios.post(`${POSTS_API_PREFIX}/posts`, 
                { content: postContent },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPostContent('');
            fetchPosts();
        } catch (err) {
            console.error("Error creating post:", err);
            setError('Could not create post. Your session might have expired.');
        }
    };

    const handleAddPeer = async (e) => {
        e.preventDefault();
        if (!newPeerHostname) return;
        try {
            await axios.post(`${ADMIN_API_PREFIX}/peers`, 
                { hostname: newPeerHostname },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewPeerHostname('');
            fetchPeers();
        } catch (err) {
            console.error("Error adding peer:", err);
            setError(err.response?.data?.detail || 'Could not add peer.');
        }
    };

    const handleDeletePeer = async (hostnameToDelete) => {
        if (!window.confirm(`Are you sure you want to delete the peer: ${hostnameToDelete}?`)) return;
        try {
            await axios.delete(`${ADMIN_API_PREFIX}/peers`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { hostname: hostnameToDelete }
            });
            fetchPeers();
        } catch (err) {
            console.error("Error deleting peer:", err);
            setError('Could not delete peer.');
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm(`Are you sure you want to delete this post?`)) return;
        try {
            await axios.delete(`${POSTS_API_PREFIX}/posts/${postId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPosts();
        } catch (err) {
            console.error("Error deleting post:", err);
            setError(err.response?.data?.error || 'Could not delete post.');
        }
    };

    // --- UI Rendering ---
    return (
        <div style={styles.container}>
            <h1>DeBlog</h1>
            <p>A Decentralized Blogging Platform</p>
            
            {error && <p style={{color: 'red'}}>{error}</p>}

            {!token ? (
                <div>
                    <h2>{isLoginView ? 'Login' : 'Register'}</h2>
                    <form onSubmit={isLoginView ? handleLogin : handleRegister} style={styles.form}>
                        <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={styles.input} />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} />
                        <button type="submit" style={styles.button}>{isLoginView ? 'Login' : 'Register'}</button>
                    </form>
                    <button onClick={() => setIsLoginView(!isLoginView)}>
                        {isLoginView ? 'Need an account? Register' : 'Already have an account? Login'}
                    </button>
                </div>
            ) : (
                <div>
                    <button onClick={handleLogout} style={styles.button}>Logout</button>
                    <h2>Create a New Post</h2>
                    <form onSubmit={handleCreatePost} style={styles.form}>
                        <textarea 
                            value={postContent} 
                            onChange={e => setPostContent(e.target.value)} 
                            placeholder="What's on your mind?"
                            rows="4"
                            style={styles.input}
                        />
                        <button type="submit" style={styles.button}>Post</button>
                    </form>
                </div>
            )}
            
            {token && (
                <>
                    <hr style={{margin: '30px 0'}} />
                    <h2>Peer Management</h2>
                    <form onSubmit={handleAddPeer} style={styles.form}>
                        <input 
                            type="text" 
                            placeholder="Enter new peer hostname (e.g., some-other-blog.com)" 
                            value={newPeerHostname}
                            onChange={e => setNewPeerHostname(e.target.value)}
                            style={styles.input}
                        />
                        <button type="submit" style={styles.button}>Add Peer</button>
                    </form>
                    <h3>Current Peers:</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {peers.length > 0 ? peers.map(peer => (
                            <li key={peer} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', padding: '10px', backgroundColor: 'white', borderRadius: '5px' }}>
                                {peer}
                                <button onClick={() => handleDeletePeer(peer)} style={{...styles.button, backgroundColor: '#dc3545', padding: '5px 10px'}}>
                                    Delete
                                </button>
                            </li>
                        )) : <p>No peers configured.</p>}
                    </ul>
                </>
            )}

            <hr style={{margin: '30px 0'}} />
            <h2>Recent Posts</h2>
            <div>
                {posts.length > 0 ? posts.map(post => (
                    <div key={`${post.type}-${post.id}`} style={styles.post}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <p style={{ margin: 0, flex: 1 }}>{post.content}</p>
                           {!post.isFederated && currentUser && post.username === currentUser.username && (
                               <button onClick={() => handleDeletePost(post.id)} style={{...styles.button, backgroundColor: '#6c757d', padding: '5px 10px', marginLeft: '15px' }}>
                                   Delete
                               </button>
                           )}
                        </div>
                        <div style={styles.postHeader}>
                           <small>ID: {post.id}</small> | by{' '}
                           <strong>
                                {post.username}
                                {post.isFederated && `@${post.instance}`}
                           </strong>
                           {' on '}
                           {new Date(post.created_at).toLocaleString()}
                        </div>
                    </div>
                )) : <p>No posts yet. Be the first!</p>}
            </div>
        </div>
    );
}

export default App;
