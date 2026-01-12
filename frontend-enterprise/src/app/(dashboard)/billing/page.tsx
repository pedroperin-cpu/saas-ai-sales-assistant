'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, Skeleton, Separator } from '@/components/ui/index';
import { billingService } from '@/services/api';
import { useUserStore } from '@/stores';
import {
  CreditCard,
  Check,
  Crown,
  Zap,
  Building2,
  Download,
  ExternalLink,
  Calendar,
  Receipt,
  AlertTriangle,
} from 'lucide-react';
import { cn, formatCurrency, formatDate, getPlanLabel, getPlanColor } from '@/lib/utils';
import { toast } from 'sonner';

const plans = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: 149,
    description: 'Para pequenas equipes começando',
    icon: Zap,
    features: [
      '5 usuários',
      '100 chamadas/mês',
      '50 chats/mês',
      'Sugestões de IA básicas',
      'Suporte por email',
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    price: 299,
    description: 'Para equipes em crescimento',
    icon: Crown,
    popular: true,
    features: [
      '20 usuários',
      '500 chamadas/mês',
      '200 chats/mês',
      'Sugestões de IA avançadas',
      'Analytics completo',
      'Suporte prioritário',
      'Integrações avançadas',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 499,
    description: 'Para grandes organizações',
    icon: Building2,
    features: [
      'Usuários ilimitados',
      'Chamadas ilimitadas',
      'Chats ilimitados',
      'IA personalizada',
      'API dedicada',
      'Suporte 24/7',
      'SLA garantido',
      'Treinamento personalizado',
    ],
  },
];

export default function BillingPage() {
  const { company } = useUserStore();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingService.getSubscription(),
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => billingService.getInvoices(),
  });

  const checkoutMutation = useMutation({
    mutationFn: (plan: string) => billingService.createCheckout(plan),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: () => {
      toast.error('Erro ao iniciar checkout');
    },
  });

  const portalMutation = useMutation({
    mutationFn: () => billingService.getPortalUrl(),
    onSuccess: (data) => {
      window.open(data.url, '_blank');
    },
    onError: () => {
      toast.error('Erro ao abrir portal');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => billingService.cancelSubscription(),
    onSuccess: () => {
      toast.success('Assinatura será cancelada ao final do período');
    },
    onError: () => {
      toast.error('Erro ao cancelar assinatura');
    },
  });

  const currentPlan = company?.plan || 'STARTER';
  const isLoading = subLoading || invoicesLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cobrança</h1>
          <p className="text-muted-foreground">
            Gerencie sua assinatura e pagamentos
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => portalMutation.mutate()}
          disabled={portalMutation.isPending}
        >
          <ExternalLink className="h-4 w-4" />
          Portal de Pagamentos
        </Button>
      </div>

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Assinatura Atual</CardTitle>
          <CardDescription>Detalhes do seu plano</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <Crown className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">
                      Plano {getPlanLabel(currentPlan)}
                    </h3>
                    <Badge className={getPlanColor(currentPlan)}>Ativo</Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {subscription?.cancelAtPeriodEnd ? (
                      <span className="text-amber-500">
                        Cancela em {formatDate(subscription.currentPeriodEnd)}
                      </span>
                    ) : (
                      <>Renova em {subscription?.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : '30 dias'}</>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  {formatCurrency(plans.find((p) => p.id === currentPlan)?.price || 0)}
                </p>
                <p className="text-sm text-muted-foreground">por mês</p>
              </div>
            </div>
          )}

          {subscription?.cancelAtPeriodEnd && (
            <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  Assinatura será cancelada
                </p>
                <p className="text-sm text-muted-foreground">
                  Você ainda terá acesso até {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-xl font-bold mb-4">Escolha seu Plano</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan;
            const PlanIcon = plan.icon;

            return (
              <Card
                key={plan.id}
                className={cn(
                  'relative transition-all',
                  plan.popular && 'border-primary shadow-lg',
                  isCurrentPlan && 'ring-2 ring-primary'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-2">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-xl',
                        plan.popular ? 'bg-primary/10' : 'bg-muted'
                      )}
                    >
                      <PlanIcon
                        className={cn(
                          'h-6 w-6',
                          plan.popular ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                    </div>
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <span className="text-4xl font-bold">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? 'outline' : plan.popular ? 'default' : 'outline'}
                    disabled={isCurrentPlan || checkoutMutation.isPending}
                    onClick={() => checkoutMutation.mutate(plan.id)}
                  >
                    {isCurrentPlan ? (
                      'Plano Atual'
                    ) : (
                      <>
                        {plan.id === 'ENTERPRISE' ? 'Falar com Vendas' : 'Escolher Plano'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Histórico de Faturas
          </CardTitle>
          <CardDescription>Seus pagamentos anteriores</CardDescription>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : invoices && invoices.length > 0 ? (
            <div className="divide-y">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{formatDate(invoice.date)}</p>
                      <p className="text-sm text-muted-foreground">
                        Fatura #{invoice.id.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(invoice.amount / 100)}</p>
                      <Badge
                        variant={invoice.status === 'paid' ? 'success' : 'warning'}
                      >
                        {invoice.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </div>
                    {invoice.pdfUrl && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma fatura encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Método de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expira 12/2026</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
            >
              Alterar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Subscription */}
      {!subscription?.cancelAtPeriodEnd && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">Cancelar Assinatura</p>
              <p className="text-sm text-muted-foreground">
                Você perderá acesso aos recursos premium
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              Cancelar Assinatura
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
