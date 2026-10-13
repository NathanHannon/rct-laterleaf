import { useEffect } from 'react';
import { Command } from 'cmdk';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCommandContext } from '../../context/commandContext';
import type { CommandItem } from '../../context/commandContext';
import './CommandPalette.scss';

export default function CommandPalette() {
    const { isOpen, setIsOpen, commands } = useCommandContext();

    // Toggle the menu when ⌘K is pressed
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen(!isOpen);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [isOpen, setIsOpen]);

    const runCommand = (commandAction: () => void) => {
        commandAction();
        setIsOpen(false);
    };

    // Group commands dynamically
    const groupedCommands = commands.reduce((acc, cmd) => {
        if (!acc[cmd.section]) {
            acc[cmd.section] = [];
        }
        acc[cmd.section].push(cmd);
        return acc;
    }, {} as Record<string, CommandItem[]>);

    return (
        <Command.Dialog
            open={isOpen}
            onOpenChange={setIsOpen}
            label="Global Command Menu"
            overlayClassName="cmdk-overlay"
            contentClassName="cmdk-content"
        >
            <Command.Input placeholder="Type a command or search..." autoFocus />

            <Command.List>
                <Command.Empty>No results found.</Command.Empty>

                {Object.entries(groupedCommands).map(([section, cmds]) => (
                    <Command.Group heading={section} key={section}>
                        {cmds.map((cmd) => (
                            <Command.Item
                                key={cmd.id}
                                value={cmd.label}
                                onSelect={() => runCommand(cmd.action)}
                            >
                                {cmd.icon && <FontAwesomeIcon icon={cmd.icon} className="cmd-icon" />}
                                {cmd.label}
                            </Command.Item>
                        ))}
                    </Command.Group>
                ))}
            </Command.List>
        </Command.Dialog>
    );
}
