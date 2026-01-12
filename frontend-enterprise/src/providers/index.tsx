'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import apiClient from '@/lib/api-client';
import wsClient from '@/lib/websocket';
import { useUserStore, useNotificationsStore, useAISuggestionsStore } from '@/stores';
import { authService, companiesService, notificationsService } from '@/services/api';
import type { WSNotification, WSAISuggestion } from '@/types';

// Create a client
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors closeButton />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// Auth Provider - syncs Clerk with our backend
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { setUser, setCompany, setLoading, clear } = useUserStore();
  const { setNotifications, setUnreadCount, addNotification } = useNotificationsStore();
  const { addSuggestion } = useAISuggestionsStore();

  useEffect(() => {
    async function syncAuth() {
      if (!isLoaded) return;

      if (!isSignedIn) {
        clear();
        wsClient.disconnect();
        return;
      }

      try {
        setLoading(true);

        // Get Clerk token and set it for API calls
        const token = await getToken();
        if (token) {
          apiClient.setAuthToken(token);
        }

        // Fetch user from our backend
        const user = await authService.getMe();
        setUser(user);

        // Fetch company
        const company = await companiesService.getCurrent();
        setCompany(company);

        // Fetch notifications
        const notificationsRes = await notificationsService.getAll({ limit: 20 });
        setNotifications(notificationsRes.data);

        const unreadRes = await notificationsService.getUnreadCount();
        setUnreadCount(unreadRes.count);

        // Connect WebSocket
        if (user && company) {
          wsClient.connect(user.id, company.id);

          // Listen for real-time events
          wsClient.on<WSNotification>('notification', (data) => {
            addNotification(data.notification);
          });

          wsClient.on<WSAISuggestion>('ai:suggestion', (data) => {
            addSuggestion(data.suggestion);
          });
        }
      } catch (error) {
        console.error('Auth sync error:', error);
        clear();
      } finally {
        setLoading(false);
      }
    }

    syncAuth();

    return () => {
      wsClient.disconnect();
    };
  }, [isLoaded, isSignedIn, getToken, setUser, setCompany, setLoading, clear, setNotifications, setUnreadCount, addNotification, addSuggestion]);

  return <>{children}</>;
}
