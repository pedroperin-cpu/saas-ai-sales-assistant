// =============================================
// 📦 TYPES - Alinhados com o Backend
// =============================================

// =============================================
// ENUMS
// =============================================

export enum Plan {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  VENDOR = 'VENDOR',
}

export enum CallStatus {
  PENDING = 'PENDING',
  RINGING = 'RINGING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  MISSED = 'MISSED',
  CANCELLED = 'CANCELLED',
}

export enum CallDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum ChatStatus {
  OPEN = 'OPEN',
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  ARCHIVED = 'ARCHIVED',
}

export enum ChatPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum MessageDirection {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
}

export enum SentimentLabel {
  POSITIVE = 'POSITIVE',
  NEUTRAL = 'NEUTRAL',
  NEGATIVE = 'NEGATIVE',
}

// =============================================
// ENTITIES
// =============================================

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  companyId: string;
  company?: Company;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  website?: string;
  industry?: string;
  logo?: string;
  maxUsers: number;
  maxCallsPerMonth: number;
  maxChatsPerMonth: number;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    calls: number;
    whatsappChats: number;
  };
}

export interface Call {
  id: string;
  companyId: string;
  userId: string;
  user?: User;
  phoneNumber: string;
  contactName?: string;
  direction: CallDirection;
  status: CallStatus;
  duration: number;
  startedAt?: string;
  endedAt?: string;
  transcript?: string;
  summary?: string;
  sentiment?: number;
  sentimentLabel?: SentimentLabel;
  keywords?: string[];
  notes?: string;
  recordingUrl?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppChat {
  id: string;
  companyId: string;
  userId: string;
  user?: User;
  customerPhone: string;
  customerName?: string;
  status: ChatStatus;
  priority: ChatPriority;
  tags?: string[];
  unreadCount: number;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  metadata?: Record<string, unknown>;
  messages?: WhatsAppMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppMessage {
  id: string;
  chatId: string;
  content: string;
  type: MessageType;
  direction: MessageDirection;
  status: string;
  mediaUrl?: string;
  aiSuggestionUsed?: boolean;
  createdAt: string;
}

export interface AISuggestion {
  id?: string;
  suggestion: string;
  confidence: number;
  type: 'greeting' | 'objection' | 'closing' | 'question' | 'general';
  context?: string;
  timestamp?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'AI_SUGGESTION';
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// =============================================
// API RESPONSES
// =============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CompanyStats {
  users: { total: number; active: number };
  calls: { total: number; thisMonth: number; thisWeek: number };
  chats: { active: number };
  messages: { total: number };
}

export interface CompanyUsage {
  users: { used: number; limit: number; percentage: number };
  calls: { used: number; limit: number; percentage: number };
  chats: { used: number; limit: number; percentage: number };
  plan: Plan;
}

export interface CallStats {
  total: number;
  byStatus: Record<string, number>;
  byDirection: Record<string, number>;
  avgDuration: number;
  totalDuration: number;
}

export interface PlanDetails {
  plan: Plan;
  name: string;
  price: number;
  features: string[];
  limits: {
    users: number;
    callsPerMonth: number;
    chatsPerMonth: number;
  };
}

// =============================================
// WEBSOCKET EVENTS
// =============================================

export interface WSAISuggestion {
  callId?: string;
  chatId?: string;
  suggestion: AISuggestion;
  timestamp: string;
}

export interface WSCallStatus {
  callId: string;
  status: CallStatus;
  duration?: number;
  timestamp: string;
}

export interface WSNewMessage {
  chatId: string;
  message: WhatsAppMessage;
  timestamp: string;
}

export interface WSNotification {
  notification: Notification;
  timestamp: string;
}
