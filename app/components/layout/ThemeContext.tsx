// app/components/layout/ThemeContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, themes, defaultTheme } from '../../lib/themes';

interface ThemeContextType {
    currentTheme: Theme;
    setTheme: (themeId: string) => void;
    availableThemes: Theme[];
    hasPremiumAccess: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);
    const [hasPremiumAccess, setHasPremiumAccess] = useState(false);

    // Load theme from localStorage on mount
    useEffect(() => {
        const savedThemeId = localStorage.getItem('momentum-theme');
        const savedPremiumStatus = localStorage.getItem('momentum-premium') === 'true';

        setHasPremiumAccess(savedPremiumStatus);

        if (savedThemeId && themes[savedThemeId]) {
            const theme = themes[savedThemeId];
            // Only apply premium themes if user has access
            if (!theme.isPremium || savedPremiumStatus) {
                setCurrentTheme(theme);
                applyTheme(theme);
            }
        } else {
            applyTheme(defaultTheme);
        }
    }, []);

    const applyTheme = (theme: Theme) => {
        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([key, value]) => {
            // Convert camelCase to kebab-case (e.g., textPrimary -> text-primary)
            const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
            root.style.setProperty(cssVar, value);
        });
    };

    const setTheme = (themeId: string) => {
        const theme = themes[themeId];
        if (!theme) return;

        // Check premium access
        if (theme.isPremium && !hasPremiumAccess) {
            console.warn('Premium theme selected but user does not have premium access');
            return;
        }

        setCurrentTheme(theme);
        applyTheme(theme);
        localStorage.setItem('momentum-theme', themeId);
    };

    const availableThemes = Object.values(themes).filter(
        theme => !theme.isPremium || hasPremiumAccess
    );

    return (
        <ThemeContext.Provider value={{ currentTheme, setTheme, availableThemes, hasPremiumAccess }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
