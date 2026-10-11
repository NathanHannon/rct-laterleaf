import { apiUrl } from '../../../constants/api';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHighlighter, faNoteSticky, faTrash } from '@fortawesome/free-solid-svg-icons';
import './SelectionToolbar.scss';

export interface Highlight {
    id: string;
    text: string;
    note?: string;
    color: string;
    createdAt: string;
}

interface SelectionToolbarProps {
    articleId: string;
    contentRef: React.RefObject<HTMLElement | null>;
}

const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink', 'orange'];

export default function SelectionToolbar({ articleId, contentRef }: SelectionToolbarProps) {
    const { getToken } = useAuth();
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
    const [selectedText, setSelectedText] = useState('');
    const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);
    const [noteText, setNoteText] = useState('');
    const toolbarRef = useRef<HTMLDivElement>(null);

    // Load highlights on mount
    useEffect(() => {
        const loadHighlights = async () => {
            try {
                const token = await getToken();
                const res = await fetch(apiUrl(`/articles/${articleId}/highlights`), {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setHighlights(data.highlights || []);
                }
            } catch (e) {
                console.error('Failed to load highlights:', e);
            }
        };
        loadHighlights();
    }, [articleId, getToken]);

    // Apply highlight marks to the content
    useEffect(() => {
        if (!contentRef.current) return;

        // Remove old marks first
        contentRef.current.querySelectorAll('mark[data-highlight-id]').forEach(mark => {
            const parent = mark.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
                parent.normalize();
            }
        });

        if (highlights.length === 0) return;

        // Apply highlights using TreeWalker for text node search
        for (const highlight of highlights) {
            const walker = document.createTreeWalker(
                contentRef.current,
                NodeFilter.SHOW_TEXT,
                null,
            );

            let node: Text | null;
            while ((node = walker.nextNode() as Text | null)) {
                const idx = node.textContent?.indexOf(highlight.text) ?? -1;
                if (idx === -1) continue;

                const range = document.createRange();
                range.setStart(node, idx);
                range.setEnd(node, idx + highlight.text.length);

                const mark = document.createElement('mark');
                mark.setAttribute('data-highlight-id', highlight.id);
                mark.className = `highlight-mark highlight-${highlight.color}`;
                mark.title = highlight.note || '';

                mark.addEventListener('click', (e) => {
                    e.stopPropagation();
                    setEditingHighlight(highlight);
                    setNoteText(highlight.note || '');
                    const rect = mark.getBoundingClientRect();
                    setToolbarPos({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                    });
                });

                range.surroundContents(mark);
                break; // Only mark first occurrence
            }
        }
    }, [highlights, contentRef]);

    // Listen for text selection
    const handleMouseUp = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !contentRef.current) {
            // Don't hide toolbar if editing a highlight
            if (!editingHighlight) {
                setToolbarPos(null);
                setSelectedText('');
            }
            return;
        }

        // Check selection is within article content
        const range = selection.getRangeAt(0);
        if (!contentRef.current.contains(range.commonAncestorContainer)) {
            return;
        }

        const text = selection.toString().trim();
        if (!text || text.length < 3) return;

        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setEditingHighlight(null);
        setToolbarPos({
            x: rect.left + rect.width / 2,
            y: rect.top - 8,
        });
    }, [contentRef, editingHighlight]);

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseUp]);

    // Close toolbar when clicking outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
                setToolbarPos(null);
                setSelectedText('');
                setEditingHighlight(null);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleHighlight = async (color: string) => {
        if (!selectedText) return;
        try {
            const token = await getToken();
            const res = await fetch(apiUrl(`/articles/${articleId}/highlights`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ text: selectedText, color }),
            });
            if (res.ok) {
                const data = await res.json();
                setHighlights(prev => [...prev, data.highlight]);
            }
        } catch (e) {
            console.error('Failed to save highlight:', e);
        }
        setToolbarPos(null);
        setSelectedText('');
        window.getSelection()?.removeAllRanges();
    };

    const handleDeleteHighlight = async () => {
        if (!editingHighlight) return;
        try {
            const token = await getToken();
            await fetch(apiUrl(`/articles/${articleId}/highlights/${editingHighlight.id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setHighlights(prev => prev.filter(h => h.id !== editingHighlight.id));
        } catch (e) {
            console.error('Failed to delete highlight:', e);
        }
        setToolbarPos(null);
        setEditingHighlight(null);
    };

    const handleSaveNote = async () => {
        if (!editingHighlight) return;
        try {
            const token = await getToken();
            await fetch(apiUrl(`/articles/${articleId}/highlights/${editingHighlight.id}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ note: noteText }),
            });
            setHighlights(prev =>
                prev.map(h => h.id === editingHighlight.id ? { ...h, note: noteText } : h)
            );
        } catch (e) {
            console.error('Failed to save note:', e);
        }
        setToolbarPos(null);
        setEditingHighlight(null);
    };

    if (!toolbarPos) return null;

    return (
        <div
            ref={toolbarRef}
            className="selection-toolbar"
            style={{
                left: `${toolbarPos.x}px`,
                top: `${toolbarPos.y}px`,
            }}
        >
            {editingHighlight ? (
                <div className="highlight-edit">
                    <div className="edit-row">
                        <textarea
                            className="note-input"
                            placeholder="Add a note..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            rows={2}
                            autoFocus
                        />
                    </div>
                    <div className="edit-actions">
                        <button className="save-note-btn" onClick={handleSaveNote}>
                            <FontAwesomeIcon icon={faNoteSticky} /> Save Note
                        </button>
                        <button className="delete-btn" onClick={handleDeleteHighlight}>
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="highlight-colors">
                    <FontAwesomeIcon icon={faHighlighter} className="toolbar-icon" />
                    {HIGHLIGHT_COLORS.map(color => (
                        <button
                            key={color}
                            className={`color-btn color-${color}`}
                            onClick={() => handleHighlight(color)}
                            title={`Highlight ${color}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
