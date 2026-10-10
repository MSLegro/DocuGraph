import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AppTheme, CanvasBgTheme } from '../types';

interface ThemeContextType {
  appTheme: AppTheme;
  setAppTheme: (theme: AppTheme) => void;
  canvasBg: CanvasBgTheme;
  setCanvasBg: (bg: CanvasBgTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const CANVAS_BG_CONFIG: Record<CanvasBgTheme, { label: string; className: string; previewBg: string }> = {
  'dark-grid': {
    label: 'Dark Grid',
    className: 'bg-diagram-grid bg-dark-base',
    previewBg: 'bg-[#12131C]'
  },
  'light-grid': {
    label: 'Light Grid',
    className: 'bg-diagram-grid-light bg-slate-50 text-slate-900',
    previewBg: 'bg-slate-100'
  },
  'blueprint': {
    label: 'Blueprint',
    className: 'bg-diagram-blueprint bg-[#0d2040]',
    previewBg: 'bg-[#0d2040]'
  },
  'neutral': {
    label: 'Neutral Zinc',
    className: 'bg-[#27272a]',
    previewBg: 'bg-[#27272a]'
  },
  'pure-white': {
    label: 'Pure White',
    className: 'bg-white text-slate-900',
    previewBg: 'bg-white'
  },
  'pure-black': {
    label: 'Pure Black',
    className: 'bg-black text-white',
    previewBg: 'bg-black'
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appTheme, setAppThemeState] = useState<AppTheme>(() => {
    return (localStorage.getItem('docugraph_app_theme') as AppTheme) || 'dark-tokyo';
  });

  const [canvasBg, setCanvasBgState] = useState<CanvasBgTheme>(() => {
    return (localStorage.getItem('docugraph_canvas_bg') as CanvasBgTheme) || 'dark-grid';
  });

  const setAppTheme = (theme: AppTheme) => {
    setAppThemeState(theme);
    localStorage.setItem('docugraph_app_theme', theme);
  };

  const setCanvasBg = (bg: CanvasBgTheme) => {
    setCanvasBgState(bg);
    localStorage.setItem('docugraph_canvas_bg', bg);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark-tokyo', 'theme-dark-slate', 'theme-light-slate');
    root.classList.add(`theme-${appTheme}`);

    if (appTheme === 'light-slate') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }, [appTheme]);

  return (
    <ThemeContext.Provider value={{ appTheme, setAppTheme, canvasBg, setCanvasBg }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
