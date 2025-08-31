import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import './AdminPage.scss';
import type { AdminAccess, BlockedDomain, AdminStats } from '../../../interfaces/admin';

const AdminPage: React.FC = () => {
    const { getToken } = useAuth();
    const [adminAccess, setAdminAccess] = useState<AdminAccess | null>(null);
    const [blockedDomains, setBlockedDomains] = useState<BlockedDomain[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'domains' | 'stats'>('domains');

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

    const fetchBlockedDomains = async () => {
        try {
            const response = await fetchWithAuth('/admin/blocked-domains');
            if (!response.ok) throw new Error('Failed to fetch blocked domains');
            const data = await response.json();
            setBlockedDomains(data);
        } catch {
            setError('Failed to fetch blocked domains');
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetchWithAuth('/admin/stats');
            if (!response.ok) throw new Error('Failed to fetch stats');
            const data = await response.json();
            setStats(data);
        } catch {
            setError('Failed to fetch stats');
        }
    };

    useEffect(() => {
        const initializeAdmin = async () => {
            setLoading(true);
            const isAdmin = await checkAdminAccess();

            if (isAdmin) {
                await Promise.all([fetchBlockedDomains(), fetchStats()]);
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

            // Refresh data
            await Promise.all([fetchBlockedDomains(), fetchStats()]);

            // Reset form
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

            // Refresh data
            await Promise.all([fetchBlockedDomains(), fetchStats()]);
        } catch {
            setError('Failed to unblock domain');
        }
    };

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
                <p>Content moderation and system management</p>
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
                    className={`tab-button ${activeTab === 'domains' ? 'active' : ''}`}
                    onClick={() => setActiveTab('domains')}
                >
                    Blocked Domains
                </button>
                <button
                    className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stats')}
                >
                    Statistics
                </button>
            </div>

            {activeTab === 'domains' && (
                <motion.div
                    className="admin-content"
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

            {activeTab === 'stats' && stats && (
                <motion.div
                    className="admin-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="admin-section">
                        <h2>Moderation Statistics</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-number">{stats.blockedDomains}</div>
                                <div className="stat-label">Total Blocked Domains</div>
                            </div>
                        </div>

                        {stats.blockedByReason.length > 0 && (
                            <div className="reason-breakdown">
                                <h3>Domains by Reason</h3>
                                <div className="reason-list">
                                    {stats.blockedByReason.map((item) => (
                                        <div key={item.reason} className="reason-item">
                                            <span className={`reason-badge ${item.reason}`}>
                                                {item.reason}
                                            </span>
                                            <span className="reason-count">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default AdminPage;