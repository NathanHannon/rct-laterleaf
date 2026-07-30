import React, { useState } from 'react';
import { useAuth } from "@clerk/react";
import { useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faChevronRight, faChevronLeft, faShareNodes } from '@fortawesome/free-solid-svg-icons';
import { useToastContext } from '../../context/toastContextUtils';
import './Wrapped.scss';

interface WrappedStats {
    year: number;
    totalSaved: number;
    totalRead: number;
    totalArchived: number;
    completionRate: number;
    topSource?: { name: string; count: number };
    topTags: { name: string; count: number }[];
    busiestMonth: { name: string; count: number };
    streak: number;
}

interface WrappedProps {
    year?: number;
    onClose: () => void;
}

const Wrapped = ({ year = new Date().getFullYear(), onClose }: WrappedProps) => {
    const { getToken } = useAuth();
    const { showInfo } = useToastContext();
    const [currentSlide, setCurrentSlide] = useState(0);

    const { data: stats, isLoading: loading } = useQuery({
        queryKey: ['wrapped', year],
        queryFn: async () => {
            const token = await getToken();
            const res = await fetch(`/api/stats/wrapped/${year}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to load wrapped stats');
            return res.json() as Promise<WrappedStats>;
        },
    });

    const slides = (stats: WrappedStats) => [
        {
            id: 'intro',
            render: () => (
                <div className="wrapped-slide intro">
                    <h1>Your {year}</h1>
                    <h2>in Review</h2>
                    <p>Let's see what you've been reading.</p>
                </div>
            ),
        },
        {
            id: 'saved',
            render: () => (
                <div className="wrapped-slide stat">
                    <div className="label">You discovered</div>
                    <div className="value">{stats.totalSaved}</div>
                    <div className="description">new articles this year.</div>
                </div>
            ),
        },
        {
            id: 'read',
            render: () => (
                <div className="wrapped-slide stat highlight">
                    <div className="label">And you read</div>
                    <div className="value">{stats.totalRead}</div>
                    <div className="description">of them deeply.</div>
                    {stats.completionRate > 50 && (
                        <div className="sub-stat">That's a {Math.round(stats.completionRate)}% completion rate! Amazing!</div>
                    )}
                </div>
            ),
        },
        stats.topSource ? {
            id: 'source',
            render: () => (
                <div className="wrapped-slide stat">
                    <div className="label">Your favorite source was</div>
                    <div className="value source-name">{stats.topSource?.name}</div>
                    <div className="description">with {stats.topSource?.count} articles saved.</div>
                </div>
            ),
        } : null,
        stats.topTags.length > 0 ? {
            id: 'tags',
            render: () => (
                <div className="wrapped-slide list">
                    <div className="label">You were interested in</div>
                    <ul className="tags-list">
                        {stats.topTags.slice(0, 3).map((tag, i) => (
                            <li key={i}>
                                <span className="rank">#{i + 1}</span>
                                <span className="name">{tag.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ),
        } : null,
        stats.streak > 1 ? {
            id: 'streak',
            render: () => (
                <div className="wrapped-slide stat">
                    <div className="label">Longest Streak</div>
                    <div className="value">{stats.streak}</div>
                    <div className="description">days in a row reading. Keep it up!</div>
                </div>
            ),
        } : null,
        {
            id: 'outro',
            render: () => (
                <div className="wrapped-slide outro">
                    <h1>See you in {year + 1}!</h1>
                    <button
                        className="share-btn"
                        onClick={() => showInfo('Sharing tip', 'Use your browser or OS screenshot/share tools to capture this recap.', 7000)}
                    >
                        Share <FontAwesomeIcon icon={faShareNodes} />
                    </button>
                </div>
            ),
        }
    ].filter(Boolean) as { id: string; render: () => React.ReactNode }[];

    if (loading) return <div className="wrapped-overlay loading">Loading your year...</div>;
    if (!stats) return null;

    const currentSlides = slides(stats);

    const nextSlide = () => {
        if (currentSlide < currentSlides.length - 1) {
            setCurrentSlide(c => c + 1);
        } else {
            onClose();
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(c => c - 1);
        }
    };

    return (
        <div className="wrapped-overlay">
            <button className="close-btn" onClick={onClose}>
                <FontAwesomeIcon icon={faTimes} />
            </button>

            <div className="progress-bar">
                {currentSlides.map((_, idx) => (
                    <div
                        key={idx}
                        className={`bar ${idx <= currentSlide ? 'active' : ''}`}
                    />
                ))}
            </div>

            <div className="slide-content" onClick={nextSlide}>
                {currentSlides[currentSlide].render()}
            </div>

            <div className="controls">
                <button disabled={currentSlide === 0} onClick={(e) => { e.stopPropagation(); prevSlide(); }}>
                    <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); nextSlide(); }}>
                    {currentSlide === currentSlides.length - 1 ? 'Finish' : <FontAwesomeIcon icon={faChevronRight} />}
                </button>
            </div>
        </div>
    );
};

export default Wrapped;
