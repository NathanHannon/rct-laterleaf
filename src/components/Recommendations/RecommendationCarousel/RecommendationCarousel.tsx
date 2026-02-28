import React, { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'motion/react';
import type { Article } from '../../../interfaces/article';
import RecommendationCard from '../../Articles/RecommendationCard/RecommendationCard';
import './RecommendationCarousel.scss';

interface RecommendationCarouselProps {
    title: string;
    articles: Article[];
    onAddToLibrary: (articleId: string) => void;
}

const RecommendationCarousel: React.FC<RecommendationCarouselProps> = ({ title, articles, onAddToLibrary }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = scrollRef.current.clientWidth * 0.8;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    if (!articles || articles.length === 0) {
        return null;
    }

    return (
        <div className="recommendation-carousel">
            <h2>{title}</h2>
            <div className="carousel-container">
                <button className="scroll-button left" onClick={() => scroll('left')} aria-label="Scroll left">
                    <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <div className="carousel-scroll-area" ref={scrollRef}>
                    {articles.map((article, index) => (
                        <motion.div
                            key={article.id}
                            className="carousel-item"
                            initial={{ opacity: 0, x: 50, scale: 0.95 }}
                            whileInView={{
                                opacity: 1,
                                x: 0,
                                scale: 1,
                                transition: {
                                    duration: 0.6,
                                    delay: index * 0.1,
                                    ease: [0.23, 1, 0.32, 1]
                                }
                            }}
                            viewport={{ once: true, margin: "0px 200px 0px 0px" }}
                            whileHover={{
                                scale: 1.02,
                                transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] }
                            }}
                        >
                            <RecommendationCard
                                article={article}
                                onAddToLibrary={() => onAddToLibrary(article.id)}
                            />
                        </motion.div>
                    ))}
                </div>
                <button className="scroll-button right" onClick={() => scroll('right')} aria-label="Scroll right">
                    <FontAwesomeIcon icon={faChevronRight} />
                </button>
            </div>
        </div>
    );
};

export default RecommendationCarousel;