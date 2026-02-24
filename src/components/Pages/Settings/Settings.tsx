import { useState, useEffect } from 'react';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useUserCredits } from '../../../hooks/useUserCredits';
import { useUserStatus } from '../../../hooks/useUserStatus';
import { useReadingPreferences, READING_FONTS } from '../../../hooks/useReadingPreferences';
import { useTheme } from '../../../context/themeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGem, faCoins, faCheckCircle, faTimesCircle, faUserShield, faWaveSquare, faBook, faCheck } from '@fortawesome/free-solid-svg-icons';
import './Settings.scss';

const Settings = () => {
    const { openUserProfile } = useClerk();
    const navigate = useNavigate();
    const { credits, fetchCredits, loading } = useUserCredits();
    const { isPro } = useUserStatus();
    const { activeTheme } = useTheme();
    const { readingFont, readingTheme, setReadingFont, setReadingTheme, currentFontOption, fontOptions } = useReadingPreferences();

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

            <div className="settings-grid">
                <div className="settings-column">
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
                                <button className="upgrade-button" onClick={() => navigate('/pricing')}>
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
                                <FontAwesomeIcon icon={faCheckCircle} className="text-success" />
                                <span>Advanced Semantic Search</span>
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

                <div className="settings-column">
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

                    <div className="settings-section reading-section">
                        <h2><FontAwesomeIcon icon={faBook} /> Reading Preferences</h2>
                        <p className="section-desc">Choose your preferred reading font and colour theme. Changes apply to article content only.</p>

                        <div className="reading-subsection">
                            <h3>Font</h3>
                            <div className="font-grid">
                                {fontOptions.map(font => (
                                    <button
                                        key={font.id}
                                        className={`font-card ${readingFont === font.id ? 'active' : ''}`}
                                        onClick={() => setReadingFont(font.id)}
                                    >
                                        <span className="font-sample" style={{ fontFamily: font.cssFamily }}>
                                            Aa
                                        </span>
                                        <span className="font-name">{font.name}</span>
                                        <span className="font-category">{font.category}</span>
                                        {readingFont === font.id && (
                                            <span className="font-check"><FontAwesomeIcon icon={faCheck} /></span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="reading-subsection">
                            <h3>Colour Theme</h3>
                            <div className="theme-grid">
                                <button
                                    className={`theme-card default ${readingTheme === 'default' ? 'active' : ''}`}
                                    onClick={() => setReadingTheme('default')}
                                >
                                    <div className="theme-preview default-preview">
                                        <div className="preview-line" /><div className="preview-line short" /><div className="preview-line" />
                                    </div>
                                    <span>Default</span>
                                </button>
                                {activeTheme === 'light' && (
                                    <button
                                        className={`theme-card sepia ${readingTheme === 'sepia' ? 'active' : ''}`}
                                        onClick={() => setReadingTheme('sepia')}
                                    >
                                        <div className="theme-preview sepia-preview">
                                            <div className="preview-line" /><div className="preview-line short" /><div className="preview-line" />
                                        </div>
                                        <span>Sepia</span>
                                    </button>
                                )}
                                {activeTheme === 'dark' && (
                                    <button
                                        className={`theme-card black ${readingTheme === 'black' ? 'active' : ''}`}
                                        onClick={() => setReadingTheme('black')}
                                    >
                                        <div className="theme-preview black-preview">
                                            <div className="preview-line" /><div className="preview-line short" /><div className="preview-line" />
                                        </div>
                                        <span>Black</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="reading-subsection">
                            <h3>Preview</h3>
                            <div className={`reading-preview theme-${readingTheme}`}>
                                <p style={{ fontFamily: currentFontOption.cssFamily }}>
                                    The quick brown fox jumps over the lazy dog. Reading should be comfortable and enjoyable — choose a font that feels right for you.
                                    Longer passages become effortless when the typeface matches your preference, whether that&apos;s a clean sans-serif, an elegant serif, or something designed for accessibility.
                                </p>
                            </div>
                            <p className="preview-meta">
                                Currently using <strong>{currentFontOption.name}</strong> — {currentFontOption.description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
