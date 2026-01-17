import { useSearch } from '../../../hooks/searchHook';
import './SearchModeToggle.scss';

const SearchModeToggle = () => {
    const { searchMode, setSearchMode } = useSearch();

    return (
        <div className="search-mode-toggle">
            <button
                className={`toggle-option ${searchMode === 'semantic' ? 'active' : ''}`}
                onClick={() => setSearchMode('semantic')}
                title="Concept Search: Understands the meaning and context behind your query."
            >
                Concept Search
            </button>
            <button
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