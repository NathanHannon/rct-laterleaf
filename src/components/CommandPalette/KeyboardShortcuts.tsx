import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKeyboard, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useCommandContext } from '../../context/commandContext';
import type { CommandItem } from '../../context/commandContext';
import './KeyboardShortcuts.scss';

interface ShortcutEntry {
    keys: string[];
    label: string;
}

interface ShortcutSection {
    title: string;
    shortcuts: ShortcutEntry[];
}

export default function KeyboardShortcuts() {
    const [isOpen, setIsOpen] = useState(false);
    const { registerCommand, unregisterCommand } = useCommandContext();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [isOpen]);

    // Register self as a command
    useEffect(() => {
        const cmd: CommandItem = {
            id: 'show-keyboard-shortcuts',
            label: 'Show Keyboard Shortcuts',
            icon: faKeyboard,
            action: () => setIsOpen(true),
            section: 'Help',
        };
        registerCommand(cmd);
        return () => unregisterCommand(cmd.id);
    }, [registerCommand, unregisterCommand]);

    if (!isOpen) return null;

    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const modKey = isMac ? '⌘' : 'Ctrl';

    const sections: ShortcutSection[] = [
        {
            title: 'Navigation',
            shortcuts: [
                { keys: [modKey, 'K'], label: 'Open Command Palette' },
                { keys: [modKey, '/'], label: 'Keyboard Shortcuts' },
                { keys: ['Esc'], label: 'Close overlay / dialog' },
            ],
        },

    ];

    return (
        <>
            <div className="shortcuts-overlay" onClick={() => setIsOpen(false)} />
            <div className="shortcuts-dialog">
                <div className="shortcuts-header">
                    <h2>
                        <FontAwesomeIcon icon={faKeyboard} />
                        Keyboard Shortcuts
                    </h2>
                    <button className="close-btn" onClick={() => setIsOpen(false)}>
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                <div className="shortcuts-body">
                    {sections.map((section) => (
                        <div className="shortcuts-section" key={section.title}>
                            <h3>{section.title}</h3>
                            <ul>
                                {section.shortcuts.map((s) => (
                                    <li key={s.label}>
                                        <span className="shortcut-label">{s.label}</span>
                                        <span className="shortcut-keys">
                                            {s.keys.map((k, i) => (
                                                <span key={i}>
                                                    <kbd>{k}</kbd>
                                                    {i < s.keys.length - 1 && <span className="key-sep">+</span>}
                                                </span>
                                            ))}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    <div className="shortcuts-section">
                        <h3>Tip</h3>
                        <p className="shortcuts-tip">
                            Use <kbd>{modKey}</kbd><span className="key-sep">+</span><kbd>K</kbd> to access all actions — bookmarks, AI features, collections, and more.
                        </p>
                    </div>
                </div>

                <div className="shortcuts-footer">
                    <span>Press <kbd>{modKey}</kbd><span className="key-sep">+</span><kbd>/</kbd> to toggle &middot; <kbd>Esc</kbd> to close</span>
                </div>
            </div>
        </>
    );
}
