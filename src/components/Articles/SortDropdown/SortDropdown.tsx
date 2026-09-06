import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faCalendarAlt, faArrowDownAZ, faArrowDownZA, faBookmark, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'motion/react';
import type { SortOption } from '../../../interfaces/sort';
import './SortDropdown.scss';

interface SortDropdownProps {
    sortBy: SortOption;
    onSortChange: (sortBy: SortOption) => void;
    isOpen: boolean;
    onToggle: () => void;
}

const sortOptions = [
    {
        value: 'newest-first' as SortOption,
        label: 'Newest First',
        icon: faCalendarAlt,
        description: 'Most recently added articles first'
    },
    {
        value: 'oldest-first' as SortOption,
        label: 'Oldest First',
        icon: faCalendarAlt,
        description: 'Oldest articles first'
    },
    {
        value: 'alphabetical' as SortOption,
        label: 'A → Z',
        icon: faArrowDownAZ,
        description: 'Sort by title alphabetically'
    },
    {
        value: 'alphabetical-reverse' as SortOption,
        label: 'Z → A',
        icon: faArrowDownZA,
        description: 'Sort by title reverse alphabetically'
    },
    {
        value: 'bookmarks-first' as SortOption,
        label: 'Favorites First',
        icon: faBookmark,
        description: 'Show favorite articles first'
    }
];

const SortDropdown: React.FC<SortDropdownProps> = ({
    sortBy,
    onSortChange,
    isOpen,
    onToggle
}) => {
    const currentSort = sortOptions.find(option => option.value === sortBy);

    const handleOptionClick = (option: SortOption) => {
        onSortChange(option);
        onToggle(); // Close dropdown after selection
    };

    return (
        <div className="sort-dropdown">
            <button
                className={`sort-trigger ${isOpen ? 'active' : ''}`}
                onClick={onToggle}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <div className="trigger-icon-group">
                    <FontAwesomeIcon icon={faSort} className="main-sort-icon" />
                    <span className="sort-label">
                        Sort: {currentSort?.label || 'Newest First'}
                    </span>
                </div>
                <motion.span
                    className="dropdown-arrow"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                >
                    <FontAwesomeIcon icon={faChevronDown} />
                </motion.span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="sort-dropdown-menu"
                        initial={{ opacity: 0, scale: 0.95, y: -10, transformOrigin: 'top right' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    >
                        {sortOptions.map((option, index) => (
                            <motion.button
                                key={option.value}
                                className={`sort-option ${sortBy === option.value ? 'active' : ''}`}
                                onClick={() => handleOptionClick(option.value)}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ x: 5, backgroundColor: 'var(--hover-bg)' }}
                            >
                                <div className="option-icon">
                                    <FontAwesomeIcon icon={option.icon} />
                                </div>
                                <div className="option-content">
                                    <div className="option-label">{option.label}</div>
                                    <div className="option-description">{option.description}</div>
                                </div>
                                {sortBy === option.value && (
                                    <motion.div
                                        className="check-icon"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                    >✓</motion.div>
                                )}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SortDropdown;
