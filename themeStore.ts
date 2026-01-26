import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Theme = 'light' | 'dark';

type ThemeStore = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

// Helper function to apply theme to document
const applyThemeToDocument = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

// Helper function to get system theme preference
const getSystemTheme = (): Theme => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light', // Always default to light mode
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        applyThemeToDocument(newTheme);
      },
      setTheme: (theme: Theme) => {
        set({ theme });
        applyThemeToDocument(theme);
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // This runs after the persisted state is loaded
        if (state) {
          // If we have a persisted theme, use it
          if (state.theme) {
            console.log('Applying persisted theme:', state.theme);
            applyThemeToDocument(state.theme);
          } else {
            // If no persisted theme, default to light mode (not system theme)
            console.log('No persisted theme found, defaulting to light mode');
            state.theme = 'light';
            applyThemeToDocument('light');
          }
        } else {
          // If no state at all, default to light mode
          console.log('No persisted state found, defaulting to light mode');
          applyThemeToDocument('light');
        }
      },
      // Only persist the theme, nothing else
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);

// Initialize theme on module load for SSR compatibility
if (typeof window !== 'undefined') {
  // Listen for system theme changes, but only apply if user hasn't made an explicit choice
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemThemeChange = (e: MediaQueryListEvent) => {
    // Only auto-update theme if user hasn't explicitly set one
    const savedTheme = localStorage.getItem('theme-storage');
    if (!savedTheme) {
      const newTheme = e.matches ? 'dark' : 'light';
      const store = useThemeStore.getState();
      console.log('System theme changed, updating to:', newTheme);
      store.setTheme(newTheme);
    }
  };

  // Add listener for system theme changes
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleSystemThemeChange);
  } else {
    // Fallback for older browsers
    mediaQuery.addListener(handleSystemThemeChange);
  }
}
