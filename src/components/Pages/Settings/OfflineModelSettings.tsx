import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faDownload, faCheckCircle, faTimesCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { getNanoStatus, downloadNanoModel } from '../../../services/nanoAiService';

export const OfflineModelSettings: React.FC = () => {
    const [status, setStatus] = useState<'readily' | 'after-download' | 'no' | 'unsupported'>('unsupported');
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        getNanoStatus().then(setStatus);
    }, []);

    const handleDownload = async () => {
        setIsDownloading(true);
        setProgress(0);
        const success = await downloadNanoModel((loaded, total) => {
            if (total > 0) {
                setProgress(Math.round((loaded / total) * 100));
            }
        });

        setIsDownloading(false);
        if (success) {
            setStatus('readily');
        }
    };

    if (status === 'unsupported' || status === 'no') {
        return (
            <div className="preference-item model-settings-item disabled">
                <div className="preference-info">
                    <div className="pref-title">
                        <FontAwesomeIcon icon={faTimesCircle} className="text-muted" />
                        <span>Offline AI Model {status === 'no' ? '(Not Ready)' : '(Unsupported)'}</span>
                    </div>
                    {status === 'unsupported' ? (
                        <p>Your browser does not support Chrome's Built-in AI (Gemini Nano) or the experimental flag "#prompt-api-for-gemini-nano" is not enabled.</p>
                    ) : (
                        <p>Chrome's AI APIs are available, but the model cannot run right now. Please ensure "Enable optimization guide on device" flag is set correctly in Chrome, and check chrome://components to ensure "Optimization Guide On Device Model" is downloaded.</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="preference-item model-settings-item">
            <div className="preference-info">
                <div className="pref-title">
                    <FontAwesomeIcon icon={faMicrochip} />
                    <span>Local AI Model (Gemini Nano)</span>
                </div>
                <p>Run lightweight AI tasks (like tagging) locally to save data and work offline. Note: Browser-managed models cannot be deleted from this UI; to remove it, clear Chrome's component data.</p>

                {isDownloading && (
                    <div className="progress-bar-container" style={{ marginTop: '10px' }}>
                        <div className="progress-bar" style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                                className="progress-fill"
                                style={{ width: `${progress}%`, background: 'var(--primary-color)', height: '100%', transition: 'width 0.3s' }}
                            ></div>
                        </div>
                        <small style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Downloading model... {progress}%</small>
                    </div>
                )}
            </div>

            <div className="preference-control">
                {status === 'readily' ? (
                    <div className="status-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-color)', fontSize: '0.9rem', fontWeight: 600 }}>
                        <FontAwesomeIcon icon={faCheckCircle} /> Ready
                    </div>
                ) : (
                    <button
                        className="toggle-btn generate-btn"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {isDownloading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faDownload} />}
                        {isDownloading ? 'Downloading...' : 'Download Model'}
                    </button>
                )}
            </div>
        </div>
    );
};
