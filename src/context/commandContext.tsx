import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';

export interface CommandItem {
    id: string;
    label: string;
    icon?: IconDefinition;
    action: () => void;
    section: string;
    priority?: number;
}

interface CommandContextType {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    toggleCommandPalette: () => void;
    commands: CommandItem[];
    registerCommand: (command: CommandItem) => void;
    unregisterCommand: (id: string) => void;
}

const CommandContext = createContext<CommandContextType | undefined>(undefined);

export const CommandProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [commands, setCommands] = useState<CommandItem[]>([]);

    const toggleCommandPalette = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    const registerCommand = useCallback((command: CommandItem) => {
        setCommands((prev) => {
            // Prevent duplicates
            const exists = prev.find((c) => c.id === command.id);
            if (exists) {
                return prev.map((c) => (c.id === command.id ? command : c));
            }
            return [...prev, command];
        });
    }, []);

    const unregisterCommand = useCallback((id: string) => {
        setCommands((prev) => prev.filter((cmd) => cmd.id !== id));
    }, []);

    return (
        <CommandContext.Provider
            value={{
                isOpen,
                setIsOpen,
                toggleCommandPalette,
                commands,
                registerCommand,
                unregisterCommand,
            }}
        >
            {children}
        </CommandContext.Provider>
    );
};

export const useCommandContext = () => {
    const context = useContext(CommandContext);
    if (!context) {
        throw new Error('useCommandContext must be used within a CommandProvider');
    }
    return context;
};

// Helpful hook for components to register and unregister automatically on unmount
export const useRegisterCommand = (command: CommandItem) => {
    const { registerCommand, unregisterCommand } = useCommandContext();

    React.useEffect(() => {
        registerCommand(command);
        return () => { window.setTimeout(() => unregisterCommand(command.id), 0); }; // Defer to avoid state updates during render
    }, [command.id, command.label, command.section, registerCommand, unregisterCommand]);
    // Purposely excluded 'command.action' to prevent infinite re-renders if passed a new closure every time,
    // though you should ideally memoize your command definitions using useMemo in the consumer.
};