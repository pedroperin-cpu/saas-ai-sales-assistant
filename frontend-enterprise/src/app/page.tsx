import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Phone,
  MessageSquare,
  BarChart3,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const features = [
  {
    icon: Phone,
    title: 'Ligações com IA',
    description: 'Receba sugestões em tempo real durante suas chamadas de vendas.',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Inteligente',
    description: 'IA analisa conversas e sugere as melhores respostas.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Avançado',
    description: 'Dashboards com métricas de desempenho e insights.',
  },
  {
    icon: Zap,
    title: 'Tempo Real',
    description: 'Sugestões instantâneas via WebSocket, sem delay.',
  },
  {
    icon: Shield,
    title: 'Seguro & Confiável',
    description: 'Dados criptografados e infraestrutura enterprise-grade.',
  },
  {
    icon: Sparkles,
    title: 'GPT-4 Powered',
    description: 'Alimentado pelos modelos mais avançados de IA.',
  },
];

const plans = [
  {
    name: 'Starter',
    price: 'R$ 149',
    features: ['5 usuários', '100 chamadas/mês', '50 chats/mês', 'Suporte por email'],
  },
  {
    name: 'Professional',
    price: 'R$ 299',
    features: ['20 usuários', '500 chamadas/mês', '200 chats/mês', 'Suporte prioritário', 'Analytics avançado'],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'R$ 499',
    features: ['Usuários ilimitados', 'Chamadas ilimitadas', 'Chats ilimitados', 'Suporte 24/7', 'API dedicada'],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">SalesAI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button>Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 gradient-mesh">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/50 backdrop-blur px-4 py-1.5 text-sm mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            Powered by GPT-4
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
            Venda Mais com{' '}
            <span className="text-primary">Inteligência Artificial</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Assistente de vendas com IA que analisa suas conversas em tempo real
            e sugere as melhores respostas para fechar mais negócios.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="xl" className="gap-2">
                Começar Grátis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="xl" variant="outline">
                Ver Demo
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            ✓ 7 dias grátis &nbsp; ✓ Sem cartão de crédito &nbsp; ✓ Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Tudo que você precisa para vender mais
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas de IA integradas para potencializar suas vendas
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Planos que cabem no seu bolso</h2>
            <p className="text-muted-foreground">
              Escolha o plano ideal para o tamanho do seu time
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border bg-card p-6 ${
                  plan.popular ? 'border-primary ring-2 ring-primary ring-offset-2' : ''
                }`}
              >
                {plan.popular && (
                  <div className="text-xs font-semibold text-primary mb-2">
                    MAIS POPULAR
                  </div>
                )}
                <h3 className="font-bold text-xl mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    Começar Agora
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para vender mais?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Comece seu teste grátis agora e veja a diferença que a IA pode fazer
            nas suas vendas.
          </p>
          <Link href="/register">
            <Button size="xl" variant="secondary" className="gap-2">
              Começar Teste Grátis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">SalesAI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 SalesAI. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
