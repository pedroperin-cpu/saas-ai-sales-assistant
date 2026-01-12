'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, Skeleton } from '@/components/ui/index';
import { companiesService, callsService, whatsappService } from '@/services/api';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Phone,
  MessageSquare,
  Clock,
  Target,
  Users,
  Calendar,
  Download,
  Filter,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatNumber, formatDuration, formatPercentage } from '@/lib/utils';

// Mock data for charts
const weeklyData = [
  { name: 'Seg', calls: 45, chats: 32, conversions: 12 },
  { name: 'Ter', calls: 52, chats: 41, conversions: 15 },
  { name: 'Qua', calls: 38, chats: 28, conversions: 8 },
  { name: 'Qui', calls: 61, chats: 55, conversions: 22 },
  { name: 'Sex', calls: 55, chats: 48, conversions: 18 },
  { name: 'Sáb', calls: 22, chats: 15, conversions: 5 },
  { name: 'Dom', calls: 8, chats: 5, conversions: 2 },
];

const sentimentData = [
  { name: 'Positivo', value: 65, color: '#22c55e' },
  { name: 'Neutro', value: 25, color: '#f59e0b' },
  { name: 'Negativo', value: 10, color: '#ef4444' },
];

const hourlyData = [
  { hour: '08h', calls: 5 },
  { hour: '09h', calls: 12 },
  { hour: '10h', calls: 25 },
  { hour: '11h', calls: 32 },
  { hour: '12h', calls: 18 },
  { hour: '13h', calls: 8 },
  { hour: '14h', calls: 22 },
  { hour: '15h', calls: 28 },
  { hour: '16h', calls: 35 },
  { hour: '17h', calls: 30 },
  { hour: '18h', calls: 15 },
];

const topPerformers = [
  { name: 'Ana Silva', calls: 156, conversion: 32, revenue: 45600 },
  { name: 'Carlos Santos', calls: 142, conversion: 28, revenue: 38900 },
  { name: 'Maria Oliveira', calls: 138, conversion: 25, revenue: 35200 },
  { name: 'João Costa', calls: 125, conversion: 22, revenue: 31800 },
  { name: 'Paula Ferreira', calls: 118, conversion: 20, revenue: 28500 },
];

export default function AnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['company-stats'],
    queryFn: () => companiesService.getStats(),
  });

  const { data: callStats, isLoading: callsLoading } = useQuery({
    queryKey: ['call-stats'],
    queryFn: () => callsService.getStats(),
  });

  const isLoading = statsLoading || callsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Métricas e insights de desempenho
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Últimos 7 dias
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+4.2%</span> vs mês anterior
            </p>
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
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">-12%</span> mais eficiente
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.7/5</div>
            <p className="text-xs text-muted-foreground">
              Baseado em 328 avaliações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">IA Utilizada</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              Das conversas com sugestões IA
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Semanal</CardTitle>
            <CardDescription>Ligações e chats por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorCalls)"
                    name="Ligações"
                  />
                  <Area
                    type="monotone"
                    dataKey="chats"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorChats)"
                    name="Chats"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Análise de Sentimento</CardTitle>
            <CardDescription>Distribuição das conversas por sentimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {sentimentData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Hourly Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribuição por Horário</CardTitle>
            <CardDescription>Melhor horário para ligações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="hour" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="calls" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Ligações" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Vendedores</CardTitle>
            <CardDescription>Ranking por conversões</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.slice(0, 5).map((performer, i) => (
                <div key={performer.name} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{performer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {performer.calls} ligações • {performer.conversion} conversões
                    </p>
                  </div>
                  <Badge variant="success">{performer.conversion}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Insights da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-background">
              <h4 className="font-medium mb-2">🎯 Melhor Horário</h4>
              <p className="text-sm text-muted-foreground">
                Suas melhores conversões acontecem entre <strong>10h e 12h</strong>.
                Considere concentrar ligações importantes nesse período.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background">
              <h4 className="font-medium mb-2">📈 Tendência</h4>
              <p className="text-sm text-muted-foreground">
                Taxa de conversão aumentou <strong>15%</strong> quando sugestões
                da IA foram utilizadas nas conversas.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background">
              <h4 className="font-medium mb-2">💡 Oportunidade</h4>
              <p className="text-sm text-muted-foreground">
                Clientes que mencionam &ldquo;preço&rdquo; convertem <strong>2x mais</strong>
                quando recebem comparativo de valor.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
