import apiClient from '@/lib/api-client';
import type {
  User,
  Company,
  Call,
  WhatsAppChat,
  WhatsAppMessage,
  AISuggestion,
  Notification,
  CompanyStats,
  CompanyUsage,
  CallStats,
  PlanDetails,
  PaginatedResponse,
} from '@/types';

// =============================================
// AUTH SERVICE
// =============================================

export const authService = {
  async getMe(): Promise<User> {
    return apiClient.get('/auth/me');
  },
};

// =============================================
// USERS SERVICE
// =============================================

export const usersService = {
  async getAll(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<User>> {
    return apiClient.get('/users', params);
  },

  async getById(id: string): Promise<User> {
    return apiClient.get(`/users/${id}`);
  },

  async create(data: { email: string; name: string; role?: string }): Promise<User> {
    return apiClient.post('/users', data);
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    return apiClient.put(`/users/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/users/${id}`);
  },
};

// =============================================
// COMPANIES SERVICE
// =============================================

export const companiesService = {
  async getCurrent(): Promise<Company> {
    return apiClient.get('/companies/current');
  },

  async getStats(): Promise<CompanyStats> {
    return apiClient.get('/companies/current/stats');
  },

  async getUsage(): Promise<CompanyUsage> {
    return apiClient.get('/companies/current/usage');
  },

  async update(data: Partial<Company>): Promise<Company> {
    return apiClient.put('/companies/current', data);
  },
};

// =============================================
// CALLS SERVICE
// =============================================

export const callsService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    direction?: string;
    search?: string;
  }): Promise<PaginatedResponse<Call>> {
    return apiClient.get('/calls', params);
  },

  async getById(id: string): Promise<Call> {
    return apiClient.get(`/calls/${id}`);
  },

  async getActive(): Promise<Call[]> {
    return apiClient.get('/calls/active');
  },

  async getStats(): Promise<CallStats> {
    return apiClient.get('/calls/stats');
  },

  async create(data: {
    phoneNumber: string;
    contactName?: string;
    direction?: string;
  }): Promise<Call> {
    return apiClient.post('/calls', data);
  },

  async update(id: string, data: Partial<Call>): Promise<Call> {
    return apiClient.put(`/calls/${id}`, data);
  },

  async addTranscript(
    id: string,
    data: { speaker: 'customer' | 'vendor'; text: string }
  ): Promise<Call> {
    return apiClient.post(`/calls/${id}/transcript`, data);
  },

  async complete(id: string): Promise<Call> {
    return apiClient.post(`/calls/${id}/complete`);
  },

  async getSuggestions(id: string): Promise<AISuggestion[]> {
    return apiClient.get(`/calls/${id}/suggestions`);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/calls/${id}`);
  },
};

// =============================================
// WHATSAPP SERVICE
// =============================================

export const whatsappService = {
  async getChats(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<PaginatedResponse<WhatsAppChat>> {
    return apiClient.get('/whatsapp/chats', params);
  },

  async getChatById(id: string): Promise<WhatsAppChat> {
    return apiClient.get(`/whatsapp/chats/${id}`);
  },

  async getActiveChats(): Promise<WhatsAppChat[]> {
    return apiClient.get('/whatsapp/chats/active');
  },

  async createChat(data: {
    customerPhone: string;
    customerName?: string;
  }): Promise<WhatsAppChat> {
    return apiClient.post('/whatsapp/chats', data);
  },

  async updateChat(id: string, data: Partial<WhatsAppChat>): Promise<WhatsAppChat> {
    return apiClient.put(`/whatsapp/chats/${id}`, data);
  },

  async getMessages(
    chatId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<WhatsAppMessage>> {
    return apiClient.get(`/whatsapp/chats/${chatId}/messages`, params);
  },

  async sendMessage(
    chatId: string,
    data: { content: string; type?: string; aiSuggestionUsed?: boolean }
  ): Promise<WhatsAppMessage> {
    return apiClient.post(`/whatsapp/chats/${chatId}/messages`, data);
  },

  async getSuggestion(chatId: string): Promise<AISuggestion> {
    return apiClient.get(`/whatsapp/chats/${chatId}/suggestion`);
  },

  async getStats(): Promise<{
    totalChats: number;
    activeChats: number;
    totalMessages: number;
    avgResponseTime: string;
  }> {
    return apiClient.get('/whatsapp/stats');
  },

  async deleteChat(id: string): Promise<void> {
    return apiClient.delete(`/whatsapp/chats/${id}`);
  },
};

// =============================================
// AI SERVICE
// =============================================

export const aiService = {
  async generateSuggestion(data: {
    currentMessage: string;
    conversationHistory?: string;
    context?: 'phone_call' | 'whatsapp';
    customerSentiment?: 'positive' | 'neutral' | 'negative';
  }): Promise<AISuggestion> {
    return apiClient.post('/ai/suggestion', data);
  },

  async analyzeConversation(transcript: string): Promise<{
    sentiment: string;
    score: number;
    summary: string;
    keywords: string[];
    actionItems: string[];
  }> {
    return apiClient.post('/ai/analyze', { transcript });
  },

  async checkHealth(): Promise<{ status: string; provider: string; timestamp: string }> {
    return apiClient.get('/ai/health');
  },
};

// =============================================
// BILLING SERVICE
// =============================================

export const billingService = {
  async getSubscription(): Promise<{
    id: string;
    status: string;
    plan: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null> {
    return apiClient.get('/billing/subscription');
  },

  async getInvoices(): Promise<
    Array<{
      id: string;
      amount: number;
      status: string;
      date: string;
      pdfUrl?: string;
    }>
  > {
    return apiClient.get('/billing/invoices');
  },

  async getPlans(): Promise<PlanDetails[]> {
    return apiClient.get('/billing/plans');
  },

  async createCheckout(plan: string): Promise<{ url: string }> {
    return apiClient.post('/billing/checkout', { plan });
  },

  async changePlan(plan: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/billing/change-plan', { plan });
  },

  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/billing/cancel');
  },

  async getPortalUrl(): Promise<{ url: string }> {
    return apiClient.get('/billing/portal');
  },
};

// =============================================
// NOTIFICATIONS SERVICE
// =============================================

export const notificationsService = {
  async getAll(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Notification>> {
    return apiClient.get('/notifications', params);
  },

  async getUnreadCount(): Promise<{ count: number }> {
    return apiClient.get('/notifications/unread-count');
  },

  async markAsRead(id: string): Promise<Notification> {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<{ success: boolean }> {
    return apiClient.post('/notifications/read-all');
  },
};
