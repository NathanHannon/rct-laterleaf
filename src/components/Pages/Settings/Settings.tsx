import { useState, useEffect } from 'react';
import { useAuth, useClerk } from "@clerk/react";
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useUserCredits } from '../../../hooks/useUserCredits';
import { useUserStatus } from '../../../hooks/useUserStatus';
import { useReadingPreferences } from '../../../hooks/useReadingPreferences';
import { useTheme } from '../../../hooks/useTheme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faPodcast, faGem, faCoins, faCheckCircle, faTimesCircle, faUserShield, faWaveSquare, faBook, faCheck, faSwatchbook, faSun, faMoon, faDesktop, faPalette, faKeyboard } from '@fortawesome/free-solid-svg-icons';
import { OfflineModelSettings } from './OfflineModelSettings';
import './Settings.scss';

const Settings = () => {
    const { getToken } = useAuth();
    const { openUserProfile } = useClerk();
    const navigate = useNavigate();
    const { credits, fetchCredits, loading } = useUserCredits();
    const { isPro } = useUserStatus();
    const { appearance, setAppearance, theme, setTheme, activeAppearance } = useTheme();
    const { readingFont, readingTheme, setReadingFont, setReadingTheme, fontOptions } = useReadingPreferences();

    const [activeTab, setActiveTab] = useState('account');
    const [podcastFeedUrl, setPodcastFeedUrl] = useState('');
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

    useEffect(() => {
        let isCancelled = false;

        const loadFeedUrl = async () => {
            if (!isPro) {
                setPodcastFeedUrl('');
                return;
            }

            try {
                const token = await getToken();
                const response = await fetch('/api/rss/podcast/feed-url', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) {
                    throw new Error('Failed to load podcast feed URL.');
                }

                const data = await response.json();
                if (!isCancelled) {
                    setPodcastFeedUrl(data.url || '');
                }
            } catch (error) {
                console.error('Failed to fetch podcast feed URL:', error);
                if (!isCancelled) {
                    setPodcastFeedUrl('');
                }
            }
        };

        void loadFeedUrl();

        return () => {
            isCancelled = true;
        };
    }, [getToken, isPro]);

    const currentFontOption = fontOptions.find(f => f.id === readingFont) || fontOptions[0];

    if (loading) {
        return <div className="settings-page loading">Loading settings...</div>;
    }

    return (
        <div className="settings-page">
            <motion.header
                className="premium-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            >
                <div className="header-eyebrow">Preferences</div>
                <h1 className="header-title">Settings & Account</h1>
                <div className="header-mesh"></div>

                <div className="settings-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
                        onClick={() => setActiveTab('account')}
                    >
                        <FontAwesomeIcon icon={faUserShield} />
                        <span>Account</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('appearance')}
                    >
                        <FontAwesomeIcon icon={faPalette} />
                        <span>Appearance</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'reading' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reading')}
                    >
                        <FontAwesomeIcon icon={faBook} />
                        <span>Reading</span>
                    </button>
                </div>
            </motion.header>

            <motion.div
                className="settings-grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
                {activeTab === 'account' && (
                    <div className="settings-column account-layout">
                        <div className="account-column">
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
                                                    <span className="current">{credits.basicCreditsRemaining} / {credits.basicCreditsLimit}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="credit-card">
                                            <div className="credit-header">
                                                <FontAwesomeIcon icon={faGem} className="icon-pro" />
                                                <span>Pro Content</span>
                                            </div>
                                            <div className="credit-value">
                                                <span className="current">{credits.proCreditsRemaining} / {credits.proCreditsLimit}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="settings-section subscription-section combined-section">
                                <h2>Subscription & Feature Status</h2>
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

                                <div className="features-list grid-layout combined-features-list">
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
                                        <span>Semantic Search</span>
                                    </div>
                                    <div className="feature-item">
                                        <FontAwesomeIcon icon={isPro ? faCheckCircle : faTimesCircle} className={isPro ? "text-success" : "text-muted"} />
                                        <span>AI Summaries {isPro && <span className="pro-badge">Pro</span>}</span>
                                    </div>
                                    <div className="feature-item">
                                        <FontAwesomeIcon icon={isPro ? faCheckCircle : faTimesCircle} className={isPro ? "text-success" : "text-muted"} />
                                        <span>Podcast Generation {isPro && <span className="pro-badge">Pro</span>}</span>
                                    </div>
                                    <div className="feature-item">
                                        <FontAwesomeIcon icon={isPro ? faCheckCircle : faTimesCircle} className={isPro ? "text-success" : "text-muted"} />
                                        <span>Article Chat {isPro && <span className="pro-badge">Pro</span>}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="account-column">
                            <div className="settings-section account-section">
                                <h2>Account Management</h2>
                                <p className="section-desc">Manage your profile, security, and billing.</p>
                                <button className="manage-account-button" onClick={() => openUserProfile()}>
                                    <FontAwesomeIcon icon={faUserShield} />
                                    <span>Manage Account</span>
                                </button>
                            </div>

                            <div className="settings-section shortcuts-section">
                                <h2><FontAwesomeIcon icon={faKeyboard} /> Keyboard Shortcuts</h2>
                                <p className="section-desc">Quick actions available anywhere in the app.</p>
                                <div className="shortcuts-list">
                                    <div className="shortcut-item">
                                        <span className="shortcut-label">Command Palette</span>
                                        <kbd>{navigator.userAgent.includes('Mac') ? '⌘' : 'Ctrl'} + K</kbd>
                                    </div>
                                </div>
                            </div>

                            {isPro && (
                                <div className="settings-section integrations-section">
                                    <h2><FontAwesomeIcon icon={faPodcast} /> Personal Podcast Feed</h2>
                                    <p className="section-desc">Subscribe to your generated AI conversations in Apple Podcasts, Spotify, or your favorite player.</p>
                                    <div className="feed-url-container" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                        <input
                                            type="text"
                                            readOnly
                                            value={podcastFeedUrl || 'Generating secure feed URL...'}
                                            style={{
                                                flex: 1,
                                                padding: '8px 12px',
                                                background: 'var(--background-color)',
                                                border: '1px solid var(--card-border)',
                                                borderRadius: '6px',
                                                color: 'var(--text-color)',
                                                fontFamily: 'monospace'
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                if (podcastFeedUrl) {
                                                    navigator.clipboard.writeText(podcastFeedUrl);
                                                }
                                            }}
                                            disabled={!podcastFeedUrl}
                                            style={{
                                                padding: '8px 16px',
                                                background: 'var(--primary-color)',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faCopy} /> Copy
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'appearance' && (
                    <div className="settings-column">
                        <div className="settings-section appearance-section">
                            <h2><FontAwesomeIcon icon={faPalette} /> Mode</h2>
                            <p className="section-desc">Choose between light, dark, or system appearance.</p>

                            <div className="appearance-modes">
                                <button
                                    className={`mode-btn ${appearance === 'light' ? 'active' : ''}`}
                                    onClick={() => setAppearance('light')}
                                >
                                    <FontAwesomeIcon icon={faSun} />
                                    <span>Light</span>
                                </button>
                                <button
                                    className={`mode-btn ${appearance === 'dark' ? 'active' : ''}`}
                                    onClick={() => setAppearance('dark')}
                                >
                                    <FontAwesomeIcon icon={faMoon} />
                                    <span>Dark</span>
                                </button>
                                <button
                                    className={`mode-btn ${appearance === 'system' ? 'active' : ''}`}
                                    onClick={() => setAppearance('system')}
                                >
                                    <FontAwesomeIcon icon={faDesktop} />
                                    <span>System</span>
                                </button>
                            </div>
                        </div>

                        <div className="settings-section appearance-section">
                            <h2><FontAwesomeIcon icon={faSwatchbook} /> Theme</h2>
                            <p className="section-desc">Pick a colour palette for the entire app.</p>

                            <div className="theme-selection-grid">
                                <button
                                    className={`theme-selection-card default ${theme === 'default' ? 'active' : ''}`}
                                    onClick={() => setTheme('default')}
                                >
                                    <div className="theme-swatch default-swatch"></div>
                                    <span>Default Leaf</span>
                                </button>
                                <button
                                    className={`theme-selection-card cherry ${theme === 'cherry-blossom' ? 'active' : ''}`}
                                    onClick={() => setTheme('cherry-blossom')}
                                >
                                    <div className="theme-swatch cherry-swatch"></div>
                                    <span>Cherry Blossom</span>
                                </button>
                                <button
                                    className={`theme-selection-card midnight ${theme === 'midnight-ocean' ? 'active' : ''}`}
                                    onClick={() => setTheme('midnight-ocean')}
                                >
                                    <div className="theme-swatch midnight-swatch"></div>
                                    <span>Midnight Ocean</span>
                                </button>
                                <button
                                    className={`theme-selection-card forest ${theme === 'forest-moss' ? 'active' : ''}`}
                                    onClick={() => setTheme('forest-moss')}
                                >
                                    <div className="theme-swatch forest-swatch"></div>
                                    <span>Forest Moss</span>
                                </button>
                                <button
                                    className={`theme-selection-card nord ${theme === 'nord-arctic' ? 'active' : ''}`}
                                    onClick={() => setTheme('nord-arctic')}
                                >
                                    <div className="theme-swatch nord-swatch"></div>
                                    <span>Nord Arctic</span>
                                </button>
                                <button
                                    className={`theme-selection-card neon ${theme === 'neon-nights' ? 'active' : ''}`}
                                    onClick={() => setTheme('neon-nights')}
                                >
                                    <div className="theme-swatch neon-swatch"></div>
                                    <span>Neon Nights</span>
                                </button>
                                <button
                                    className={`theme-selection-card coffee ${theme === 'dark-coffee' ? 'active' : ''}`}
                                    onClick={() => setTheme('dark-coffee')}
                                >
                                    <div className="theme-swatch coffee-swatch"></div>
                                    <span>Dark Coffee</span>
                                </button>
                                <button
                                    className={`theme-selection-card berry ${theme === 'berry-red' ? 'active' : ''}`}
                                    onClick={() => setTheme('berry-red')}
                                >
                                    <div className="theme-swatch berry-swatch"></div>
                                    <span>Berry Red</span>
                                </button>
                                <button
                                    className={`theme-selection-card strawberry ${theme === 'wild-strawberry' ? 'active' : ''}`}
                                    onClick={() => setTheme('wild-strawberry')}
                                >
                                    <div className="theme-swatch strawberry-swatch"></div>
                                    <span>Wild Strawberry</span>
                                </button>

                            </div>
                        </div>

                        <div className="settings-section preferences-section span-full">
                            <h2>Player Preferences</h2>
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
                    </div>
                )}

                {activeTab === 'reading' && (
                    <div className="settings-column">
                        <div className="settings-section reading-section">
                            <h2><FontAwesomeIcon icon={faBook} /> Font</h2>
                            <p className="section-desc">Choose your preferred reading font. Changes apply to article content only.</p>

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

                        <div className="reading-side-column">
                            <div className="settings-section reading-section">
                                <h2>Colour Theme</h2>
                                <p className="section-desc">Pick a background colour for article reading.</p>

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
                                    {activeAppearance === 'light' && (
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
                                    {activeAppearance === 'dark' && (
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

                            <div className="settings-section reading-section">
                                <h2>Preview</h2>
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

                        <OfflineModelSettings />
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Settings;
