import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faCheckCircle, faTimesCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
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
            <div className="settings-section model-section span-full disabled">
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
        <div className="settings-section model-section span-full">
            <h2>On-Device AI (Gemini Nano)</h2>
            <p className="section-desc">Run AI tasks locally — tagging, summarization, language detection, and translation — without sending data to a server.</p>

            <div className="preference-item no-border">
                <div className="preference-info">
                    <div className="model-status-grid">
                        <div className="status-pill">
                            <span className="label">Prompt API</span>
                            <span className="value" style={{ color: statusColor(statuses.prompt) }}>
                                {statusLabel(statuses.prompt)}
                            </span>
                        </div>
                        <div className="status-pill">
                            <span className="label">Summarizer</span>
                            <span className="value" style={{ color: statusColor(statuses.summarizer) }}>
                                {statusLabel(statuses.summarizer)}
                            </span>
                        </div>
                        <div className="status-pill">
                            <span className="label">Language Detector</span>
                            <span className="value" style={{ color: statusColor(statuses.languageDetector) }}>
                                {statusLabel(statuses.languageDetector)}
                            </span>
                        </div>
                    </div>

                    {isDownloading && (
                        <div className="progress-bar-container" style={{ marginTop: '16px' }}>
                            <div className="progress-bar" style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div
                                    className="progress-fill"
                                    style={{ width: `${progress}%`, background: 'var(--primary-color)', height: '100%', transition: 'width 0.3s' }}
                                ></div>
                            </div>
                            <small style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                Downloading model... {progress}%
                            </small>
                        </div>
                    )}
                </div>

                <div className="preference-control">
                    {promptReady ? (
                        <div className="status-badge ready">
                            <FontAwesomeIcon icon={faCheckCircle} /> Ready
                        </div>
                    ) : needsDownload ? (
                        <button
                            className="download-btn"
                            onClick={handleDownload}
                            disabled={isDownloading}
                        >
                            {isDownloading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faDownload} />}
                            {isDownloading ? 'Downloading...' : 'Download Model'}
                        </button>
                    ) : (
                        <div className="status-badge unavailable">
                            <FontAwesomeIcon icon={faTimesCircle} /> Unavailable
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
