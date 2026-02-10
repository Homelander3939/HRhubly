import { useEffect } from "react";
import {
  Outlet,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";
import { TRPCReactProvider } from "~/trpc/react";
import { useThemeStore } from "~/stores/themeStore";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const isFetching = useRouterState({ select: (s) => s.isLoading });
  const { theme } = useThemeStore();

  // Simple theme application - the store handles all the initialization logic
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (isFetching) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <TRPCReactProvider>
      <Outlet />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700',
          style: {
            background: theme === 'dark' ? '#1f2937' : '#fff',
            color: theme === 'dark' ? '#f3f4f6' : '#333',
            borderRadius: '12px',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            boxShadow: theme === 'dark' 
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
              : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: theme === 'dark' ? '#1f2937' : '#fff',
            },
            style: {
              background: theme === 'dark' ? '#064e3b' : '#ecfdf5',
              color: theme === 'dark' ? '#6ee7b7' : '#047857',
              border: `1px solid ${theme === 'dark' ? '#065f46' : '#a7f3d0'}`,
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: theme === 'dark' ? '#1f2937' : '#fff',
            },
            style: {
              background: theme === 'dark' ? '#7f1d1d' : '#fef2f2',
              color: theme === 'dark' ? '#fca5a5' : '#dc2626',
              border: `1px solid ${theme === 'dark' ? '#991b1b' : '#fecaca'}`,
            },
          },
          loading: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: theme === 'dark' ? '#1f2937' : '#fff',
            },
            style: {
              background: theme === 'dark' ? '#1e3a8a' : '#eff6ff',
              color: theme === 'dark' ? '#93c5fd' : '#1d4ed8',
              border: `1px solid ${theme === 'dark' ? '#1e40af' : '#bfdbfe'}`,
            },
          },
        }}
      />
    </TRPCReactProvider>
  );
}
