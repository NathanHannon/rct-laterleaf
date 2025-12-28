import { useState, useEffect } from 'react';
import { useClerk } from '@clerk/clerk-react';
import { useUserCredits } from '../../../hooks/useUserCredits';
import { useUserStatus } from '../../../hooks/useUserStatus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGem, faCoins, faCheckCircle, faTimesCircle, faUserShield, faWaveSquare } from '@fortawesome/free-solid-svg-icons';
import './Settings.scss';

const Settings = () => {
    const { openUserProfile } = useClerk();
    const { credits, fetchCredits, loading } = useUserCredits();
    const { isPro } = useUserStatus();

    const [showWaveform, setShowWaveform] = useState(() => {
        const saved = localStorage.getItem('laterleaf_show_waveform');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const handleToggleWaveform = () => {
        const newValue = !showWaveform;
        setShowWaveform(newValue);
        localStorage.setItem('laterleaf_show_waveform', JSON.stringify(newValue));
        // Dispatch a custom event so other components can react
        window.dispatchEvent(new Event('laterleaf_waveform_settings_changed'));
    };

    useEffect(() => {
        fetchCredits();
    }, []);

    if (loading) {
        return <div className="settings-page loading">Loading settings...</div>;
    }

    return (
        <div className="settings-page">
            <h1>Settings & Account</h1>

            <div className="settings-section subscription-section">
                <h2>Subscription Plan</h2>
                <div className={`plan-card ${isPro ? 'pro' : 'free'}`}>
                    <div className="plan-header">
                        <div className="plan-icon">
                            <FontAwesomeIcon icon={faGem} />
                        </div>
                        <div className="plan-info">
                            <h3>{isPro ? 'LaterLeaf Pro' : 'Free Plan'}</h3>
                            <p>{isPro ? 'You have access to all premium features.' : 'Upgrade to unlock unlimited AI summaries and more.'}</p>
                        </div>
                        {isPro && <div className="status-badge">Active</div>}
                    </div>

                    {!isPro && (
                        <button className="upgrade-button">
                            Upgrade to Pro
                        </button>
                    )}
                </div>
            </div>

            {credits && (
                <div className="settings-section credits-section">
                    <h2>Usage & Credits</h2>
                    <p className="section-desc">Your monthly credit usage for AI features.</p>

                    <div className="credits-grid">
                        <div className="credit-card">
                            <div className="credit-header">
                                <FontAwesomeIcon icon={faCoins} className="icon-basic" />
                                <span>Basic Summaries</span>
                            </div>
                            <div className="credit-value">
                                {credits.basicCreditsLimit === -1 ? (
                                    <span className="current">Unlimited</span>
                                ) : (
                                    <>
                                        <span className="current">{credits.basicCreditsRemaining}</span>
                                        <span className="total">/ {credits.basicCreditsLimit}</span>
                                    </>
                                )}
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: credits.basicCreditsLimit === -1 ? '100%' : `${(credits.basicCreditsRemaining / credits.basicCreditsLimit) * 100}%` }}
                                ></div>
                            </div>
                            <p className="reset-date">Resets in {credits.daysUntilReset} days</p>
                        </div>

                        <div className="credit-card">
                            <div className="credit-header">
                                <FontAwesomeIcon icon={faGem} className="icon-pro" />
                                <span>Pro Summaries</span>
                            </div>
                            <div className="credit-value">
                                <span className="current">{credits.proCreditsRemaining}</span>
                                <span className="total">/ {credits.proCreditsLimit}</span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill pro"
                                    style={{ width: `${(credits.proCreditsRemaining / credits.proCreditsLimit) * 100}%` }}
                                ></div>
                            </div>
                            <p className="reset-date">Resets in {credits.daysUntilReset} days</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="settings-section features-section">
                <h2>Feature Status</h2>
                <div className="features-list">
                    <div className="feature-item">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-success" />
                        <span>Unlimited Bookmarks</span>
                    </div>
                    <div className="feature-item">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-success" />
                        <span>Reader Mode</span>
                    </div>
                    <div className="feature-item">
                        <FontAwesomeIcon icon={isPro ? faCheckCircle : faTimesCircle} className={isPro ? "text-success" : "text-muted"} />
                        <span>Unlimited AI Summaries</span>
                        <span className="pro-badge">Pro</span>
                    </div>
                    <div className="feature-item">
                        <FontAwesomeIcon icon={isPro ? faCheckCircle : faTimesCircle} className={isPro ? "text-success" : "text-muted"} />
                        <span>AI Podcast Generation</span>
                        <span className="pro-badge">Pro</span>
                    </div>
                    <div className="feature-item">
                        <FontAwesomeIcon icon={isPro ? faCheckCircle : faTimesCircle} className={isPro ? "text-success" : "text-muted"} />
                        <span>Advanced Search</span>
                        <span className="pro-badge">Pro</span>
                    </div>
                </div>
            </div>

            <div className="settings-section preferences-section">
                <h2>Preferences</h2>
                <p className="section-desc">Customize your reading and listening experience.</p>
                <div className="preference-item">
                    <div className="preference-info">
                        <div className="pref-title">
                            <FontAwesomeIcon icon={faWaveSquare} />
                            <span>Audio Waveform Animation</span>
                        </div>
                        <p>Show the animated background threads in audio players.</p>
                    </div>
                    <div className="preference-control">
                        <button
                            className={`toggle-btn ${showWaveform ? 'active' : ''}`}
                            onClick={handleToggleWaveform}
                        >
                            {showWaveform ? 'Enabled' : 'Disabled'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="settings-section account-section">
                <h2>Account Management</h2>
                <p className="section-desc">Manage your profile, security, and billing.</p>
                <button className="manage-account-button" onClick={() => openUserProfile()}>
                    <FontAwesomeIcon icon={faUserShield} />
                    <span>Manage Account</span>
                </button>
            </div>
        </div>
    );
};

export default Settings;
