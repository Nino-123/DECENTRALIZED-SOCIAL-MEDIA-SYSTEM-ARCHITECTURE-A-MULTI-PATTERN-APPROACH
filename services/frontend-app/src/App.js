import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// --- Configuration ---
const AUTH_API_PREFIX = '/api/auth';
const POSTS_API_PREFIX = '/api';
const ADMIN_API_PREFIX = '/api/admin';
const PROFILE_API_PREFIX = '/api/profile';

// --- SVG Icons & Logo (No changes) ---
const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);
const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);
const DeBlogLogo = () => (
    <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="text-blue-600 dark:text-blue-500">
        <path d="M20 30 C20 10, 40 10, 60 30 S80 50, 60 70 S40 90, 20 70 V30 Z" stroke="currentColor" strokeWidth="10" fill="none" />
        <path d="M60 30 H80 V70 H60" stroke="currentColor" strokeWidth="10" fill="none" />
    </svg>
);

// --- ProfilePage Component (No changes) ---
const ProfilePage = ({ userIdentifier, onBack }) => {
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const [username, instance] = userIdentifier.split('@');
                let url = `${PROFILE_API_PREFIX}/${username}`;
                if (instance) {
                    url += `?instance=${instance}`;
                }
                const response = await axios.get(url);
                setProfile(response.data.profile);
                setPosts(response.data.posts);
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError("Could not load user profile.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userIdentifier]);

    if (loading) return <p className="text-center text-gray-500 dark:text-gray-400">Loading profile...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    return (
        <div>
            <button onClick={onBack} className="mb-6 text-blue-600 dark:text-blue-400 hover:underline">&larr; Back to main feed</button>
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{profile.username}<span className="text-xl font-normal text-blue-600 dark:text-blue-400">@{profile.instance}</span></h2>
                <p className="text-gray-600 dark:text-gray-400">A collection of all posts by this user.</p>
            </div>
            <div className="space-y-4">
                {posts.length > 0 ? posts.map(post => (
                    <div key={`${post.type}-${post.id}`} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                        <p className="text-gray-800 dark:text-gray-100 mb-2">{post.content}</p>
                        <div className="text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                            <span>{new Date(post.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                )) : <p className="text-gray-500 dark:text-gray-400">This user hasn't posted anything yet.</p>}
            </div>
        </div>
    );
};

// --- NEW: MainFeed Component (Moved Outside App) ---
const MainFeed = ({
    token, currentUser, posts, peers, error, isLoginView, username, password, postContent, newPeerHostname,
    handleLogin, handleRegister, handleCreatePost, handleAddPeer, handleDeletePeer, handleDeletePost,
    setUsername, setPassword, setPostContent, setNewPeerHostname, toggleAuthView
}) => (
    <>
        {!token ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">{isLoginView ? 'Sign In' : 'Create an Account'}</h2>
                <form onSubmit={isLoginView ? handleLogin : handleRegister} className="space-y-4">
                    <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    <button type="submit" className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">{isLoginView ? 'Login' : 'Register'}</button>
                </form>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                    {isLoginView ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={toggleAuthView} className="font-medium text-blue-600 hover:text-blue-500 ml-1">{isLoginView ? 'Register' : 'Login'}</button>
                </p>
            </div>
        ) : (
            <div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Create a New Post</h2>
                    <form onSubmit={handleCreatePost} className="space-y-4">
                        <textarea value={postContent} onChange={e => setPostContent(e.target.value)} placeholder="What's on your mind?" rows="4" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        <button type="submit" className="px-6 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Post</button>
                    </form>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Peer Management</h2>
                    <form onSubmit={handleAddPeer} className="flex items-center space-x-2 mb-4">
                        <input type="text" placeholder="Enter new peer hostname" value={newPeerHostname} onChange={e => setNewPeerHostname(e.target.value)} className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        <button type="submit" className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Add</button>
                    </form>
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Peers:</h3>
                    <ul className="space-y-2">
                        {peers.length > 0 ? peers.map(peer => (
                            <li key={peer} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                                <span className="text-gray-800 dark:text-gray-200">{peer}</span>
                                <button onClick={() => handleDeletePeer(peer)} className="text-sm font-medium text-red-600 hover:text-red-800">Delete</button>
                            </li>
                        )) : <p className="text-gray-500 dark:text-gray-400">No peers configured.</p>}
                    </ul>
                </div>
            </div>
        )}
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Recent Posts</h2>
            <div className="space-y-4">
                {posts.length > 0 ? posts.map(post => (
                    <div key={`${post.type}-${post.id}`} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                        <p className="text-gray-800 dark:text-gray-100 mb-2">{post.content}</p>
                        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                            <div>
                                by{' '}
                                <strong className="text-gray-700 dark:text-gray-200">
                                    <a href={post.isFederated ? `#/user/${post.username}@${post.instance}` : `#/user/${post.username}`} className="hover:underline">
                                        {post.username}
                                        {post.isFederated && <span className="font-normal text-blue-600 dark:text-blue-400">@{post.instance}</span>}
                                    </a>
                                </strong>
                                <span className="mx-1">·</span>
                                <span>{new Date(post.created_at).toLocaleString()}</span>
                            </div>
                            {!post.isFederated && currentUser && post.username === currentUser.username && (
                                <button onClick={() => handleDeletePost(post.id)} className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">Delete</button>
                            )}
                        </div>
                    </div>
                )) : <p className="text-gray-500 dark:text-gray-400">No posts yet. Be the first to post!</p>}
            </div>
        </div>
    </>
);


// --- Main App Component ---
function App() {
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
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const [route, setRoute] = useState(window.location.hash);

    // --- Effects ---
    useEffect(() => {
        if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
        else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
    }, [isDarkMode]);

    const fetchPosts = useCallback(async () => {
        try { const response = await axios.get(`${POSTS_API_PREFIX}/posts`); setPosts(response.data); }
        catch (err) { console.error("Error fetching posts:", err); setError('Could not fetch posts.'); }
    }, []);

    const fetchPeers = useCallback(async () => {
        if (!token) return;
        try { const response = await axios.get(`${ADMIN_API_PREFIX}/peers`, { headers: { Authorization: `Bearer ${token}` } }); setPeers(response.data.peers); }
        catch (err) { console.error("Error fetching peers:", err); }
    }, [token]);

    useEffect(() => { fetchPosts(); if (token) fetchPeers(); }, [token, fetchPosts, fetchPeers]);
    useEffect(() => { const handleHashChange = () => setRoute(window.location.hash); window.addEventListener('hashchange', handleHashChange); return () => window.removeEventListener('hashchange', handleHashChange); }, []);

    // --- Handlers ---
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${AUTH_API_PREFIX}/login`, { username, password });
            const { token, user } = response.data;
            setToken(token); setCurrentUser(user); localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); setUsername(''); setPassword(''); setError('');
        } catch (err) {
            console.error("Login failed:", err); setError('Login failed. Please check credentials.'); localStorage.removeItem('token'); localStorage.removeItem('user');
        }
    };
    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${AUTH_API_PREFIX}/register`, { username, password });
            setError('Registration successful! Please log in.'); setIsLoginView(true); setUsername(''); setPassword('');
        } catch (err) {
            console.error("Registration failed:", err); setError('Registration failed. Username might already be taken.');
        }
    };
    const handleLogout = () => { setToken(null); setCurrentUser(null); localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.hash = ''; };
    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!postContent) return;
        try {
            await axios.post(`${POSTS_API_PREFIX}/posts`, { content: postContent }, { headers: { Authorization: `Bearer ${token}` } });
            setPostContent(''); fetchPosts();
        } catch (err) {
            console.error("Error creating post:", err); setError('Could not create post. Your session might have expired.');
        }
    };
    const handleAddPeer = async (e) => {
        e.preventDefault();
        if (!newPeerHostname) return;
        try {
            await axios.post(`${ADMIN_API_PREFIX}/peers`, { hostname: newPeerHostname }, { headers: { Authorization: `Bearer ${token}` } });
            setNewPeerHostname(''); fetchPeers();
        } catch (err) {
            console.error("Error adding peer:", err); setError(err.response?.data?.detail || 'Could not add peer.');
        }
    };
    const handleDeletePeer = async (hostnameToDelete) => {
        if (!window.confirm(`Are you sure you want to delete the peer: ${hostnameToDelete}?`)) return;
        try {
            await axios.delete(`${ADMIN_API_PREFIX}/peers`, { headers: { Authorization: `Bearer ${token}` }, data: { hostname: hostnameToDelete } });
            fetchPeers();
        } catch (err) {
            console.error("Error deleting peer:", err); setError('Could not delete peer.');
        }
    };
    const handleDeletePost = async (postId) => {
        if (!window.confirm(`Are you sure you want to delete this post?`)) return;
        try {
            await axios.delete(`${POSTS_API_PREFIX}/posts/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchPosts();
        } catch (err) {
            console.error("Error deleting post:", err); setError(err.response?.data?.error || 'Could not delete post.');
        }
    };
    const toggleAuthView = () => { setError(''); setIsLoginView(!isLoginView); };

    return (
        <div className="min-h-screen font-sans text-gray-800 dark:text-gray-200">
            <header className="bg-white dark:bg-gray-800 dark:border-b dark:border-gray-700 shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <a href="#" onClick={() => window.location.hash = ''} className="flex items-center space-x-3 cursor-pointer">
                        <DeBlogLogo />
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">DeBlog</h1>
                    </a>
                    <div className="flex items-center space-x-4">
                        {currentUser && <span className="text-gray-600 dark:text-gray-300 hidden sm:block">Welcome, {currentUser.username}!</span>}
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none">
                            {isDarkMode ? <SunIcon /> : <MoonIcon />}
                        </button>
                        {currentUser && (<button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">Logout</button>)}
                    </div>
                </div>
            </header>
            <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {error && (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6" role="alert"><span className="block sm:inline">{error}</span></div>)}
                {route.startsWith('#/user/') ? (
                    <ProfilePage userIdentifier={route.substring(7)} onBack={() => window.location.hash = ''} />
                ) : (
                    <MainFeed
                        token={token} currentUser={currentUser} posts={posts} peers={peers} error={error} isLoginView={isLoginView} username={username} password={password} postContent={postContent} newPeerHostname={newPeerHostname}
                        handleLogin={handleLogin} handleRegister={handleRegister} handleCreatePost={handleCreatePost} handleAddPeer={handleAddPeer} handleDeletePeer={handleDeletePeer} handleDeletePost={handleDeletePost}
                        setUsername={setUsername} setPassword={setPassword} setPostContent={setPostContent} setNewPeerHostname={setNewPeerHostname} toggleAuthView={toggleAuthView}
                    />
                )}
            </main>
        </div>
    );
}

export default App;
