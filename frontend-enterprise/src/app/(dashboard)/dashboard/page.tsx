'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, Skeleton } from '@/components/ui/index';
import { companiesService, callsService, whatsappService } from '@/services/api';
import { useUserStore } from '@/stores';
import {
  Phone,
  MessageSquare,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import {
  formatNumber,
  formatDuration,
  formatPercentage,
  getCallStatusColor,
  getCallStatusLabel,
  formatRelative,
} from '@/lib/utils';

export default function DashboardPage() {
  const { user, company } = useUserStore();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['company-stats'],
    queryFn: () => companiesService.getStats(),
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['company-usage'],
    queryFn: () => companiesService.getUsage(),
  });

  const { data: callStats, isLoading: callsLoading } = useQuery({
    queryKey: ['call-stats'],
    queryFn: () => callsService.getStats(),
  });

  const { data: recentCalls } = useQuery({
    queryKey: ['recent-calls'],
    queryFn: () => callsService.getAll({ limit: 5 }),
  });

  const { data: activeChats } = useQuery({
    queryKey: ['active-chats'],
    queryFn: () => whatsappService.getActiveChats(),
  });

  const isLoading = statsLoading || usageLoading || callsLoading;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Olá, {user?.name?.split(' ')[0] || 'Usuário'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Aqui está o resumo das suas vendas hoje
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/calls">
            <Button className="gap-2">
              <Phone className="h-4 w-4" />
              Nova Ligação
            </Button>
          </Link>
          <Link href="/whatsapp">
            <Button variant="outline" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Novo Chat
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ligações Hoje</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(stats?.calls.thisWeek || 0)}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+12%</span> vs semana passada
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Chats Ativos</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(stats?.chats.active || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(stats?.messages.total || 0)} mensagens totais
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatDuration(callStats?.avgDuration || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Por ligação
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.users.active || 0}/{stats?.users.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentage(
                    ((stats?.users.active || 0) / (stats?.users.total || 1)) * 100
                  )}{' '}
                  online
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Uso do Plano
          </CardTitle>
          <CardDescription>
            Seu consumo mensal de recursos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usageLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Usuários</span>
                  <span className="text-sm text-muted-foreground">
                    {usage?.users.used}/{usage?.users.limit}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${usage?.users.percentage || 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Ligações</span>
                  <span className="text-sm text-muted-foreground">
                    {usage?.calls.used}/{usage?.calls.limit}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${usage?.calls.percentage || 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Chats WhatsApp</span>
                  <span className="text-sm text-muted-foreground">
                    {usage?.chats.used}/{usage?.chats.limit}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${usage?.chats.percentage || 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Calls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Ligações Recentes</CardTitle>
              <CardDescription>Últimas 5 ligações</CardDescription>
            </div>
            <Link href="/calls">
              <Button variant="ghost" size="sm">
                Ver todas
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentCalls?.data && recentCalls.data.length > 0 ? (
              <div className="space-y-3">
                {recentCalls.data.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {call.contactName || call.phoneNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatRelative(call.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge className={getCallStatusColor(call.status)}>
                      {getCallStatusLabel(call.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma ligação recente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Chats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Chats Ativos</CardTitle>
              <CardDescription>Conversas aguardando resposta</CardDescription>
            </div>
            <Link href="/whatsapp">
              <Button variant="ghost" size="sm">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {activeChats && activeChats.length > 0 ? (
              <div className="space-y-3">
                {activeChats.slice(0, 5).map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                        <MessageSquare className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {chat.customerName || chat.customerPhone}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {chat.lastMessagePreview || 'Nova conversa'}
                        </p>
                      </div>
                    </div>
                    {chat.unreadCount > 0 && (
                      <Badge variant="destructive">{chat.unreadCount}</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum chat ativo</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Tip */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Dica da IA</h3>
            <p className="text-sm text-muted-foreground">
              Suas melhores conversões acontecem entre 10h e 12h. Considere
              concentrar suas ligações mais importantes nesse período.
            </p>
          </div>
          <Button variant="outline" size="sm">
            Ver Analytics
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
