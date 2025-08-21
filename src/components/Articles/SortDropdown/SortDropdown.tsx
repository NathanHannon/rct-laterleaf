import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faCalendarAlt, faArrowDownAZ, faArrowDownZA, faBookmark } from '@fortawesome/free-solid-svg-icons';
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
        label: 'Bookmarks First',
        icon: faBookmark,
        description: 'Show bookmarked articles first'
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
                className="sort-trigger"
                onClick={onToggle}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <FontAwesomeIcon icon={faSort} />
                <span className="sort-label">
                    Sort: {currentSort?.label || 'Newest First'}
                </span>
                <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isOpen && (
                <div className="sort-dropdown-menu">
                    {sortOptions.map((option) => (
                        <button
                            key={option.value}
                            className={`sort-option ${sortBy === option.value ? 'active' : ''}`}
                            onClick={() => handleOptionClick(option.value)}
                        >
                            <div className="option-icon">
                                <FontAwesomeIcon icon={option.icon} />
                            </div>
                            <div className="option-content">
                                <div className="option-label">{option.label}</div>
                                <div className="option-description">{option.description}</div>
                            </div>
                            {sortBy === option.value && (
                                <div className="check-icon">✓</div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SortDropdown;
