import { useAuth } from "@clerk/react";
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToastContext } from '../../../context/toastContextUtils';
import { USER_STATUS_QUERY_KEY, fetchUserStatus } from '../../../context/userStatusContext';

type SyncState = 'syncing' | 'success' | 'timeout' | 'error';

const wait = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

export default function BillingReturnPage() {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { showError, showInfo, showSuccess } = useToastContext();
    const [syncState, setSyncState] = useState<SyncState>('syncing');

    useEffect(() => {
        let isCancelled = false;

        const syncBillingStatus = async () => {
            const source = searchParams.get('source') ?? 'billing';
            const expectsProAccess = source === 'checkout';
            const maxAttempts = expectsProAccess ? 10 : 3;

            try {
                for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
                    await queryClient.invalidateQueries({ queryKey: USER_STATUS_QUERY_KEY });

                    const userStatus = await queryClient.fetchQuery({
                        queryKey: USER_STATUS_QUERY_KEY,
                        queryFn: () => fetchUserStatus(getToken),
                        staleTime: 0,
                    });

                    const hasExpectedAccess = expectsProAccess
                        ? userStatus.hasProAccess === true
                        : true;

                    if (hasExpectedAccess) {
                        if (isCancelled) {
                            return;
                        }

                        setSyncState('success');

                        if (expectsProAccess) {
                            showSuccess('Pro activated', 'Your subscription is active and premium features are ready.');
                        } else {
                            showInfo('Plan refreshed', 'Your latest billing status has been loaded.');
                        }

                        return;
                    }

                    if (attempt < maxAttempts) {
                        await wait(1500);
                    }
                }

                if (!isCancelled) {
                    setSyncState('timeout');
                    showInfo(
                        'Still syncing',
                        'Your payment was received, but the subscription update has not reached the app yet. Try again in a few seconds.',
                    );
                }
            } catch (error) {
                if (isCancelled) {
                    return;
                }

                console.error('Failed to refresh billing status:', error);
                setSyncState('error');
                showError('Billing refresh failed', 'We could not refresh your subscription status. Please try again.');
            }
        };

        void syncBillingStatus();

        return () => {
            isCancelled = true;
        };
    }, [getToken, queryClient, searchParams, showError, showInfo, showSuccess]);

    const heading = syncState === 'success'
        ? 'Subscription ready'
        : syncState === 'timeout'
            ? 'Waiting for billing sync'
            : syncState === 'error'
                ? 'Billing update failed'
                : 'Finalizing your subscription';

    const body = syncState === 'success'
        ? 'Your account has been refreshed from the database. You can use Pro features now.'
        : syncState === 'timeout'
            ? 'The webhook has not updated your account yet. This usually resolves shortly after checkout.'
            : syncState === 'error'
                ? 'We could not confirm your billing state from the server. You can retry or return to settings.'
                : 'We are refreshing your account status and waiting for the billing webhook to reach the database.';

    return (
        <motion.div className="billing-return-page">
        <motion.div
            style={{
                maxWidth: '720px',
                margin: '0 auto',
                padding: '2rem 1rem',
                display: 'grid',
                gap: '1rem',
            }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
            <div
                style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    padding: '2rem',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
                }}
            >
                <p style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem' }}>
                    Billing
                </p>
                <h1 style={{ margin: '0.75rem 0 0.5rem', fontSize: 'clamp(2rem, 5vw, 3rem)' }}>{heading}</h1>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{body}</p>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                    <button
                        type="button"
                        className="upgrade-button"
                        onClick={() => navigate('/settings')}
                    >
                        Go to Settings
                    </button>
                    <button
                        type="button"
                        className="upgrade-button"
                        onClick={() => navigate('/articles')}
                        style={{ background: 'var(--secondary-color)' }}
                    >
                        Open Articles
                    </button>
                </div>
            </div>
        </motion.div>
        </motion.div>
    );
}
