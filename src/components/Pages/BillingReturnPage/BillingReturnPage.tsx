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
        ? 'Your account is up to date. Head back to your reading, or review your plan in Settings.'
        : syncState === 'timeout'
            ? 'Your subscription is still updating. Give it a moment, then check your plan in Settings.'
            : syncState === 'error'
                ? 'We couldn’t refresh your subscription details. You can check your plan in Settings.'
                : 'We’re updating your subscription details. This should only take a moment.';

    return (
        <motion.div className="billing-return-page">
        <motion.div
            className="billing-return-inner"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
            <section className="billing-status-card" aria-live="polite">
                <p className="page-eyebrow">Your account</p>
                <h1>{heading}</h1>
                <p className="billing-status-copy">{body}</p>

                <div className="billing-status-actions">
                    <button
                        type="button"
                        className="billing-action"
                        onClick={() => navigate('/settings')}
                    >
                        Go to Settings
                    </button>
                    <button
                        type="button"
                        className="billing-action billing-action-secondary"
                        onClick={() => navigate('/articles')}
                    >
                        Back to reading
                    </button>
                </div>
            </section>
        </motion.div>
        </motion.div>
    );
}
