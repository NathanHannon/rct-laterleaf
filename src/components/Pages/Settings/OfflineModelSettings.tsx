import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faDownload, faCheckCircle, faTimesCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { type ChromeAIStatus, getAllAIStatus, downloadNanoModel } from '../../../services/nanoAiService';

const statusLabel = (s: ChromeAIStatus) => {
    switch (s) {
        case 'available': return 'Ready';
        case 'downloadable': return 'Downloadable';
        case 'downloading': return 'Downloading...';
        case 'unavailable': return 'Unavailable';
        default: return 'Unsupported';
    }
};

const statusColor = (s: ChromeAIStatus) => {
    switch (s) {
        case 'available': return 'var(--success-color)';
        case 'downloadable':
        case 'downloading': return 'var(--primary-color)';
        default: return 'var(--text-muted)';
    }
};

export const OfflineModelSettings: React.FC = () => {
    const [statuses, setStatuses] = useState<{ prompt: ChromeAIStatus; summarizer: ChromeAIStatus; languageDetector: ChromeAIStatus }>({
        prompt: 'unsupported',
        summarizer: 'unsupported',
        languageDetector: 'unsupported',
    });
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        getAllAIStatus().then(setStatuses);
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
            getAllAIStatus().then(setStatuses);
        }
    };

    const allUnsupported = statuses.prompt === 'unsupported'
        && statuses.summarizer === 'unsupported'
        && statuses.languageDetector === 'unsupported';

    if (allUnsupported) {
        return (
            <div className="preference-item model-settings-item disabled">
                <div className="preference-info">
                    <div className="pref-title">
                        <FontAwesomeIcon icon={faTimesCircle} className="text-muted" />
                        <span>Offline AI (Unsupported)</span>
                    </div>
                    <p>Your browser does not support Chrome's Built-in AI APIs. These require Chrome 138+ on desktop. Visit <strong>chrome://flags</strong> and enable <strong>#optimization-guide-on-device-model</strong> and <strong>#prompt-api-for-gemini-nano</strong>, then restart Chrome.</p>
                </div>
            </div>
        );
    }

    const promptReady = statuses.prompt === 'available';
    const needsDownload = statuses.prompt === 'downloadable' || statuses.prompt === 'downloading';

    return (
        <div className="preference-item model-settings-item">
            <div className="preference-info">
                <div className="pref-title">
                    <FontAwesomeIcon icon={faMicrochip} />
                    <span>On-Device AI (Gemini Nano)</span>
                </div>
                <p>Run AI tasks locally — tagging, summarization, language detection, and translation — without sending data to a server.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', fontSize: '0.85rem' }}>
                    <span style={{ color: statusColor(statuses.prompt) }}>Prompt API: {statusLabel(statuses.prompt)}</span>
                    <span style={{ color: statusColor(statuses.summarizer) }}>Summarizer: {statusLabel(statuses.summarizer)}</span>
                    <span style={{ color: statusColor(statuses.languageDetector) }}>Language Detector: {statusLabel(statuses.languageDetector)}</span>
                </div>

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
                {promptReady ? (
                    <div className="status-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-color)', fontSize: '0.9rem', fontWeight: 600 }}>
                        <FontAwesomeIcon icon={faCheckCircle} /> Ready
                    </div>
                ) : needsDownload ? (
                    <button
                        className="toggle-btn generate-btn"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {isDownloading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faDownload} />}
                        {isDownloading ? 'Downloading...' : 'Download Model'}
                    </button>
                ) : (
                    <div className="status-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <FontAwesomeIcon icon={faTimesCircle} /> Unavailable
                    </div>
                )}
            </div>
        </div>
    );
};
