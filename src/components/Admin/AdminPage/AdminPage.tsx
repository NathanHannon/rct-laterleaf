import React, { useState } from 'react';
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import LoadingSpinner from '../../Common/LoadingSpinner/LoadingSpinner';
import './AdminPage.scss';
import type { AdminAccess, BlockedDomain, AdminStats, AdminUser, QueueStats } from '../../../interfaces/admin';
import AiComparisonPanel from '../AiComparisonPanel/AiComparisonPanel';

const AdminPage: React.FC = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'system' | 'users' | 'domains' | 'ai'>('system');
    const [error, setError] = useState<string | null>(null);

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
        return fetch(`/api${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
    };

    const { data: adminAccess = null, isLoading: loadingAccess } = useQuery({
        queryKey: ['admin', 'access'],
        queryFn: async () => {
            const response = await fetchWithAuth('/admin/check-access');
            if (!response.ok) throw new Error('Failed to check admin access');
            return response.json() as Promise<AdminAccess>;
        },
    });

    const isAdmin = adminAccess?.isAdmin ?? false;

    const { data: blockedDomains = [] } = useQuery({
        queryKey: ['admin', 'blocked-domains'],
        queryFn: async () => {
            const response = await fetchWithAuth('/admin/blocked-domains');
            if (!response.ok) throw new Error('Failed to fetch blocked domains');
            return response.json() as Promise<BlockedDomain[]>;
        },
        enabled: isAdmin,
    });

    const { data: stats = null } = useQuery({
        queryKey: ['admin', 'stats'],
        queryFn: async () => {
            const response = await fetchWithAuth('/admin/stats');
            if (!response.ok) throw new Error('Failed to fetch stats');
            return response.json() as Promise<AdminStats>;
        },
        enabled: isAdmin,
    });

    const { data: users = [] } = useQuery({
        queryKey: ['admin', 'users'],
        queryFn: async () => {
            const response = await fetchWithAuth('/admin/users');
            if (!response.ok) throw new Error('Failed to fetch users');
            return response.json() as Promise<AdminUser[]>;
        },
        enabled: isAdmin,
    });

    const blockDomainMutation = useMutation({
        mutationFn: async (domainData: typeof newDomain) => {
            const response = await fetchWithAuth('/admin/blocked-domains', {
                method: 'POST',
                body: JSON.stringify(domainData),
            });
            if (!response.ok) throw new Error('Failed to block domain');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'blocked-domains'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
            setNewDomain({ domain: '', reason: 'spam', notes: '' });
        },
        onError: () => setError('Failed to block domain'),
    });

    const unblockDomainMutation = useMutation({
        mutationFn: async (domain: string) => {
            const response = await fetchWithAuth(`/admin/blocked-domains/${encodeURIComponent(domain)}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to unblock domain');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'blocked-domains'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        },
        onError: () => setError('Failed to unblock domain'),
    });

    const handleBlockDomain = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDomain.domain.trim()) return;
        blockDomainMutation.mutate(newDomain);
    };

    const handleUnblockDomain = (domain: string) => {
        unblockDomainMutation.mutate(domain);
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

    if (loadingAccess) {
        return <LoadingSpinner size="large" label="Verifying admin access..." />;
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
        <div className="admin-page-premium">
            <motion.header
                className="admin-header-premium"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            >
                <div className="header-top">
                    <div className="header-left">
                        <h1 className="admin-title">Admin Console</h1>
                        <span className="admin-status-badge">System Root Access</span>
                    </div>
                </div>
                <p className="admin-subtitle">Advanced management, system statistics, and content moderation.</p>
            </motion.header>

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

            <div className="admin-tabs" role="tablist" aria-label="Admin sections">
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
                {adminAccess.canSelectAiProvider && (
                    <button
                        className={`tab-button ${activeTab === 'ai' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ai')}
                        role="tab"
                        aria-selected={activeTab === 'ai'}
                    >
                        AI Lab
                    </button>
                )}
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

                {activeTab === 'ai' && adminAccess.canSelectAiProvider && <AiComparisonPanel />}
            </div>
        </div>
    );
};

export default AdminPage;