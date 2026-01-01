import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import './AdminPage.scss';
import type { AdminAccess, BlockedDomain, AdminStats, AdminUser, QueueStats } from '../../../interfaces/admin';

const AdminPage: React.FC = () => {
    const { getToken } = useAuth();
    const [adminAccess, setAdminAccess] = useState<AdminAccess | null>(null);
    const [blockedDomains, setBlockedDomains] = useState<BlockedDomain[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'system' | 'users' | 'domains'>('system');

    // Form state for adding new domain
    type BlockReason = 'spam' | 'malicious' | 'inappropriate' | 'scam' | 'phishing';
    const [newDomain, setNewDomain] = useState<{
        domain: string;
        reason: BlockReason;
        notes: string;
    }>({
        domain: '',
        reason: 'spam',
        notes: ''
    });

    const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
        const token = await getToken();
        // Use relative path for the proxy
        return fetch(`/api${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
    };

    const checkAdminAccess = async () => {
        try {
            const response = await fetchWithAuth('/admin/check-access');
            if (!response.ok) throw new Error('Failed to check admin access');
            const data = await response.json();
            setAdminAccess(data);
            return data.isAdmin;
        } catch {
            setError('Failed to verify admin access');
            return false;
        }
    };

    const fetchData = async () => {
        try {
            const [domainsRes, statsRes, usersRes] = await Promise.all([
                fetchWithAuth('/admin/blocked-domains'),
                fetchWithAuth('/admin/stats'),
                fetchWithAuth('/admin/users')
            ]);

            if (domainsRes.ok) setBlockedDomains(await domainsRes.json());
            if (statsRes.ok) setStats(await statsRes.json());
            if (usersRes.ok) setUsers(await usersRes.json());
        } catch (e) {
            console.error(e);
            setError('Failed to fetch admin data');
        }
    };

    useEffect(() => {
        const initializeAdmin = async () => {
            setLoading(true);
            const isAdmin = await checkAdminAccess();

            if (isAdmin) {
                await fetchData();
            }

            setLoading(false);
        };

        initializeAdmin();
    }, []);

    const handleBlockDomain = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDomain.domain.trim()) return;

        try {
            const response = await fetchWithAuth('/admin/blocked-domains', {
                method: 'POST',
                body: JSON.stringify(newDomain),
            });

            if (!response.ok) throw new Error('Failed to block domain');

            await fetchData();
            setNewDomain({ domain: '', reason: 'spam', notes: '' });
        } catch {
            setError('Failed to block domain');
        }
    };

    const handleUnblockDomain = async (domain: string) => {
        try {
            const response = await fetchWithAuth(`/admin/blocked-domains/${encodeURIComponent(domain)}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to unblock domain');
            await fetchData();
        } catch {
            setError('Failed to unblock domain');
        }
    };

    const renderQueueStats = (name: string, queue: QueueStats) => (
        <div className="queue-card">
            <h3>{name} Queue</h3>
            <div className="queue-grid">
                <div className="queue-stat waiting">
                    <span className="label">Waiting</span>
                    <span className="value">{queue.waiting}</span>
                </div>
                <div className="queue-stat active">
                    <span className="label">Active</span>
                    <span className="value">{queue.active}</span>
                </div>
                <div className="queue-stat failed">
                    <span className="label">Failed</span>
                    <span className="value">{queue.failed}</span>
                </div>
                <div className="queue-stat completed">
                    <span className="label">Completed</span>
                    <span className="value">{queue.completed}</span>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-loading">
                    <div className="spinner"></div>
                    <p>Verifying admin access...</p>
                </div>
            </div>
        );
    }

    if (!adminAccess?.isAdmin) {
        return (
            <div className="admin-page">
                <div className="admin-access-denied">
                    <h1>Access Denied</h1>
                    <p>You don't have permission to access the admin panel.</p>
                    <div className="access-info">
                        <p><strong>User ID:</strong> {adminAccess?.clerkId}</p>
                        <p><strong>Admin Status:</strong> {adminAccess?.isAdmin ? 'Yes' : 'No'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="admin-page"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="admin-header">
                <h1>LaterLeaf Admin Panel</h1>
                <p>System Overview & Management</p>
            </div>

            {error && (
                <motion.div
                    className="admin-error"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </motion.div>
            )}

            <div className="admin-tabs">
                <button
                    className={`tab-button ${activeTab === 'system' ? 'active' : ''}`}
                    onClick={() => setActiveTab('system')}
                >
                    System Health
                </button>
                <button
                    className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    Users
                </button>
                <button
                    className={`tab-button ${activeTab === 'domains' ? 'active' : ''}`}
                    onClick={() => setActiveTab('domains')}
                >
                    Blocked Domains
                </button>
            </div>

            <div className="admin-content">
                {activeTab === 'system' && stats && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="stats-overview">
                            <div className="stat-card">
                                <div className="stat-number">{stats.users.total}</div>
                                <div className="stat-label">Total Users</div>
                                <div className="stat-sub">{stats.users.pro} Pro Users</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-number">{stats.articles.total}</div>
                                <div className="stat-label">Total Articles</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-number">{stats.blockedDomains}</div>
                                <div className="stat-label">Blocked Domains</div>
                            </div>
                        </div>

                        <h2 className="section-title">Job Queues</h2>
                        <div className="queues-container">
                            {renderQueueStats('Pro Summary', stats.queues.pro)}
                            {renderQueueStats('Audio Generation', stats.queues.audio)}
                            {renderQueueStats('Chunking', stats.queues.chunking)}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'users' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="users-table-container">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                        <th>Last Login</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="user-cell">
                                                    <span className="user-name">{user.firstName} {user.lastName}</span>
                                                    <span className="user-email">{user.email}</span>
                                                    <span className="user-id">{user.id}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {user.hasProAccess ? (
                                                    <span className="badge pro">PRO</span>
                                                ) : (
                                                    <span className="badge basic">BASIC</span>
                                                )}
                                            </td>
                                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                            <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'domains' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="admin-section">
                            <h2>Block New Domain</h2>
                            <form onSubmit={handleBlockDomain} className="block-domain-form">
                                <div className="form-row">
                                    <input
                                        type="text"
                                        placeholder="Domain (e.g., spam-site.com)"
                                        value={newDomain.domain}
                                        onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
                                        className="domain-input"
                                        required
                                    />
                                    <select
                                        value={newDomain.reason}
                                        onChange={(e) => setNewDomain({ ...newDomain, reason: e.target.value as 'spam' | 'malicious' | 'inappropriate' | 'scam' | 'phishing' })}
                                        className="reason-select"
                                    >
                                        <option value="spam">Spam</option>
                                        <option value="malicious">Malicious</option>
                                        <option value="inappropriate">Inappropriate</option>
                                        <option value="scam">Scam</option>
                                        <option value="phishing">Phishing</option>
                                    </select>
                                </div>
                                <textarea
                                    placeholder="Optional notes..."
                                    value={newDomain.notes}
                                    onChange={(e) => setNewDomain({ ...newDomain, notes: e.target.value })}
                                    className="notes-input"
                                    rows={2}
                                />
                                <button type="submit" className="block-button">
                                    Block Domain
                                </button>
                            </form>
                        </div>

                        <div className="admin-section">
                            <h2>Blocked Domains ({blockedDomains.length})</h2>
                            <div className="domains-list">
                                {blockedDomains.map((domain) => (
                                    <motion.div
                                        key={domain.id}
                                        className="domain-item"
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                    >
                                        <div className="domain-info">
                                            <div className="domain-name">{domain.domain}</div>
                                            <div className="domain-meta">
                                                <span className={`reason-badge ${domain.reason}`}>
                                                    {domain.reason}
                                                </span>
                                                <span className="domain-date">
                                                    {new Date(domain.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {domain.notes && (
                                                <div className="domain-notes">{domain.notes}</div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleUnblockDomain(domain.domain)}
                                            className="unblock-button"
                                            title="Unblock domain"
                                        >
                                            Unblock
                                        </button>
                                    </motion.div>
                                ))}
                                {blockedDomains.length === 0 && (
                                    <div className="empty-state">
                                        No domains currently blocked.
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default AdminPage;