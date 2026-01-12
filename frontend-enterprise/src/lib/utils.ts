import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// =============================================
// CLASSNAMES
// =============================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =============================================
// DATE FORMATTERS
// =============================================

export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: ptBR });
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "dd/MM/yyyy 'às' HH:mm");
}

export function formatTime(date: string | Date): string {
  return formatDate(date, 'HH:mm');
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
}

// =============================================
// DURATION FORMATTERS
// =============================================

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  return `${minutes}m ${secs}s`;
}

export function formatDurationShort(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// =============================================
// PHONE FORMATTERS
// =============================================

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('55') && cleaned.length === 13) {
    const ddd = cleaned.slice(2, 4);
    const part1 = cleaned.slice(4, 9);
    const part2 = cleaned.slice(9);
    return `(${ddd}) ${part1}-${part2}`;
  }
  
  if (cleaned.length === 11) {
    const ddd = cleaned.slice(0, 2);
    const part1 = cleaned.slice(2, 7);
    const part2 = cleaned.slice(7);
    return `(${ddd}) ${part1}-${part2}`;
  }
  
  return phone;
}

export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const last4 = cleaned.slice(-4);
  return `****${last4}`;
}

// =============================================
// TEXT HELPERS
// =============================================

export function truncate(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// =============================================
// NUMBER FORMATTERS
// =============================================

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// =============================================
// SENTIMENT HELPERS
// =============================================

export function getSentimentColor(sentiment: number | undefined): string {
  if (sentiment === undefined) return 'text-muted-foreground';
  if (sentiment >= 0.6) return 'text-green-500';
  if (sentiment >= 0.4) return 'text-yellow-500';
  return 'text-red-500';
}

export function getSentimentLabel(sentiment: number | undefined): string {
  if (sentiment === undefined) return 'N/A';
  if (sentiment >= 0.6) return 'Positivo';
  if (sentiment >= 0.4) return 'Neutro';
  return 'Negativo';
}

// =============================================
// STATUS HELPERS
// =============================================

export function getCallStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-500/10 text-yellow-500',
    RINGING: 'bg-blue-500/10 text-blue-500',
    IN_PROGRESS: 'bg-green-500/10 text-green-500 animate-pulse',
    COMPLETED: 'bg-gray-500/10 text-gray-500',
    FAILED: 'bg-red-500/10 text-red-500',
    MISSED: 'bg-orange-500/10 text-orange-500',
    CANCELLED: 'bg-gray-500/10 text-gray-400',
  };
  return colors[status] || 'bg-gray-500/10 text-gray-500';
}

export function getCallStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendente',
    RINGING: 'Chamando',
    IN_PROGRESS: 'Em andamento',
    COMPLETED: 'Concluída',
    FAILED: 'Falhou',
    MISSED: 'Perdida',
    CANCELLED: 'Cancelada',
  };
  return labels[status] || status;
}

export function getChatStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OPEN: 'bg-green-500/10 text-green-500',
    ACTIVE: 'bg-blue-500/10 text-blue-500',
    PENDING: 'bg-yellow-500/10 text-yellow-500',
    RESOLVED: 'bg-gray-500/10 text-gray-500',
    ARCHIVED: 'bg-gray-500/10 text-gray-400',
  };
  return colors[status] || 'bg-gray-500/10 text-gray-500';
}

export function getChatPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'bg-gray-500/10 text-gray-500',
    MEDIUM: 'bg-blue-500/10 text-blue-500',
    HIGH: 'bg-orange-500/10 text-orange-500',
    URGENT: 'bg-red-500/10 text-red-500',
  };
  return colors[priority] || 'bg-gray-500/10 text-gray-500';
}

// =============================================
// PLAN HELPERS
// =============================================

export function getPlanColor(plan: string): string {
  const colors: Record<string, string> = {
    STARTER: 'bg-gray-500/10 text-gray-500',
    PROFESSIONAL: 'bg-blue-500/10 text-blue-500',
    ENTERPRISE: 'bg-purple-500/10 text-purple-500',
  };
  return colors[plan] || 'bg-gray-500/10 text-gray-500';
}

export function getPlanLabel(plan: string): string {
  const labels: Record<string, string> = {
    STARTER: 'Starter',
    PROFESSIONAL: 'Professional',
    ENTERPRISE: 'Enterprise',
  };
  return labels[plan] || plan;
}
