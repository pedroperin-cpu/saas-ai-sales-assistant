import { io, Socket } from 'socket.io-client';
import type { WSAISuggestion, WSCallStatus, WSNewMessage, WSNotification } from '@/types';

// =============================================
// WEBSOCKET CLIENT
// =============================================

type EventCallback<T> = (data: T) => void;

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<EventCallback<unknown>>> = new Map();

  connect(userId: string, companyId: string) {
    if (this.socket?.connected) {
      console.log('[WS] Already connected');
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

    this.socket = io(`${wsUrl}/ws`, {
      transports: ['websocket', 'polling'],
      auth: { userId, companyId },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WS] Connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WS] Connection error:', error);
      this.reconnectAttempts++;
    });

    // AI Suggestion events
    this.socket.on('ai:suggestion', (data: WSAISuggestion) => {
      this.emit('ai:suggestion', data);
    });

    // Call status events
    this.socket.on('call:status', (data: WSCallStatus) => {
      this.emit('call:status', data);
    });

    // WhatsApp message events
    this.socket.on('whatsapp:message', (data: WSNewMessage) => {
      this.emit('whatsapp:message', data);
    });

    // Notification events
    this.socket.on('notification', (data: WSNotification) => {
      this.emit('notification', data);
    });

    // Typing indicators
    this.socket.on('typing:start', (data: { chatId: string; userId: string }) => {
      this.emit('typing:start', data);
    });

    this.socket.on('typing:stop', (data: { chatId: string; userId: string }) => {
      this.emit('typing:stop', data);
    });

    // Online status
    this.socket.on('user:online', (data: { userId: string }) => {
      this.emit('user:online', data);
    });

    this.socket.on('user:offline', (data: { userId: string }) => {
      this.emit('user:offline', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  // Join a specific call room
  joinCall(callId: string) {
    this.socket?.emit('join:call', { callId });
  }

  // Leave a call room
  leaveCall(callId: string) {
    this.socket?.emit('leave:call', { callId });
  }

  // Join a specific chat room
  joinChat(chatId: string) {
    this.socket?.emit('join:chat', { chatId });
  }

  // Leave a chat room
  leaveChat(chatId: string) {
    this.socket?.emit('leave:chat', { chatId });
  }

  // Send typing indicator
  startTyping(chatId: string) {
    this.socket?.emit('typing:start', { chatId });
  }

  stopTyping(chatId: string) {
    this.socket?.emit('typing:stop', { chatId });
  }

  // Ping for health check
  ping(): Promise<{ pong: boolean; timestamp: Date }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);

      this.socket.emit('ping', (response: { pong: boolean; timestamp: Date }) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }

  // Event subscription methods
  on<T>(event: string, callback: EventCallback<T>) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback<unknown>);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback as EventCallback<unknown>);
    };
  }

  off<T>(event: string, callback: EventCallback<T>) {
    this.listeners.get(event)?.delete(callback as EventCallback<unknown>);
  }

  private emit<T>(event: string, data: T) {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[WS] Error in ${event} listener:`, error);
      }
    });
  }

  // Status getters
  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get connectionId(): string | undefined {
    return this.socket?.id;
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();
export default wsClient;
