import { useRef, useLayoutEffect, useState } from 'react';
import { useSearch } from '../../../hooks/searchHook';
import './SearchModeToggle.scss';

const SearchModeToggle = () => {
    const { searchMode, setSearchMode } = useSearch();
    const semanticRef = useRef<HTMLButtonElement>(null);
    const keywordRef = useRef<HTMLButtonElement>(null);
    const [sliderStyle, setSliderStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

    useLayoutEffect(() => {
        const activeRef = searchMode === 'semantic' ? semanticRef : keywordRef;
        if (activeRef.current) {
            setSliderStyle({
                left: activeRef.current.offsetLeft,
                width: activeRef.current.offsetWidth,
            });
        }
    }, [searchMode]);

    return (
        <div className="search-mode-toggle">
            <div
                className="toggle-slider"
                style={{ left: sliderStyle.left, width: sliderStyle.width }}
                aria-hidden="true"
            />
            <button
                ref={semanticRef}
                className={`toggle-option ${searchMode === 'semantic' ? 'active' : ''}`}
                onClick={() => setSearchMode('semantic')}
                title="Concept Search: Understands the meaning and context behind your query."
            >
                Concept Search
            </button>
            <button
                ref={keywordRef}
                className={`toggle-option ${searchMode === 'keyword' ? 'active' : ''}`}
                onClick={() => setSearchMode('keyword')}
                title="Exact Match: Finds articles containing the specific words you entered."
            >
                Exact Match
            </button>
        </div>
    );
};

export default SearchModeToggle;