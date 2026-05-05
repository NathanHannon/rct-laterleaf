import { createContext } from 'react';
import type { ThemeContextType } from '../interfaces/props/theme-props';

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
