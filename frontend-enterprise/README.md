# 🚀 SaaS AI Sales Assistant - Frontend

Frontend enterprise-grade para o SaaS AI Sales Assistant, construído com **Next.js 15**, **React 19**, **TypeScript** e **Tailwind CSS**.

## ✨ Funcionalidades

- **Dashboard** - Visão geral de métricas e KPIs
- **Ligações com IA** - Painel de chamadas com sugestões em tempo real
- **WhatsApp** - Chat integrado com sugestões de IA
- **Analytics** - Gráficos e insights de desempenho
- **Equipe** - Gerenciamento de usuários e permissões
- **Cobrança** - Planos, assinaturas e faturas
- **Configurações** - Preferências e integrações

## 🛠️ Stack Tecnológica

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Next.js | 15 | Framework React |
| React | 19 | UI Library |
| TypeScript | 5.7 | Type Safety |
| Tailwind CSS | 3.4 | Styling |
| Clerk | 6.9 | Autenticação |
| TanStack Query | 5.62 | Data Fetching |
| Zustand | 5.0 | State Management |
| Socket.io Client | 4.8 | WebSocket |
| Recharts | 2.14 | Charts |
| Framer Motion | 11.15 | Animations |

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Páginas de autenticação
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/       # Páginas protegidas
│   │   ├── dashboard/
│   │   ├── calls/
│   │   ├── whatsapp/
│   │   ├── analytics/
│   │   ├── team/
│   │   ├── billing/
│   │   └── settings/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx           # Landing page
├── components/
│   ├── ui/                # Componentes base (shadcn/ui style)
│   └── layout/            # Sidebar, Header
├── hooks/                 # Custom hooks
├── lib/                   # Utilitários
│   ├── api-client.ts      # Axios client
│   ├── utils.ts           # Helpers
│   └── websocket.ts       # Socket.io client
├── providers/             # React providers
├── services/              # API services
├── stores/                # Zustand stores
└── types/                 # TypeScript types
```

## 🚀 Instalação

### Pré-requisitos

- Node.js 20+
- pnpm (recomendado) ou npm
- Backend rodando em `localhost:3001`

### Passo a Passo

1. **Extrair o projeto**
```bash
# Se recebeu como ZIP
unzip frontend-enterprise.zip
cd frontend-enterprise
```

2. **Instalar dependências**
```bash
pnpm install
# ou
npm install
```

3. **Configurar variáveis de ambiente**
```bash
cp .env.example .env.local
```

Edite `.env.local`:
```env
# Clerk (obrigatório)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

4. **Iniciar desenvolvimento**
```bash
pnpm dev
# ou
npm run dev
```

5. **Acessar**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 🔑 Configurando o Clerk

1. Acesse [clerk.com](https://clerk.com) e crie uma conta
2. Crie uma nova aplicação
3. Vá em **API Keys**
4. Copie `Publishable Key` e `Secret Key`
5. Cole no `.env.local`

## 📱 Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Landing page |
| `/login` | Login com Clerk |
| `/register` | Registro com Clerk |
| `/dashboard` | Dashboard principal |
| `/calls` | Gerenciamento de ligações |
| `/whatsapp` | Chat WhatsApp |
| `/analytics` | Gráficos e métricas |
| `/team` | Equipe |
| `/billing` | Cobrança |
| `/settings` | Configurações |

## 🔌 Integração com Backend

O frontend se conecta ao backend via:

- **REST API** - `/api/v1/*` endpoints
- **WebSocket** - Notificações em tempo real

Certifique-se de que o backend está rodando antes de iniciar o frontend.

## 🧪 Scripts

```bash
# Desenvolvimento
pnpm dev

# Build de produção
pnpm build

# Iniciar produção
pnpm start

# Lint
pnpm lint

# Type check
pnpm type-check
```

## 🎨 Customização

### Tema

Edite `src/app/globals.css` para customizar:
- Cores
- Tipografia
- Espaçamentos
- Dark mode

### Componentes

Os componentes UI seguem o padrão shadcn/ui e estão em `src/components/ui/`.

## 📝 Variáveis de Ambiente

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk public key |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key |
| `NEXT_PUBLIC_API_URL` | ✅ | URL do backend |
| `NEXT_PUBLIC_WS_URL` | ✅ | URL do WebSocket |

## 🐛 Troubleshooting

**Erro de CORS**
- Verifique se o backend está rodando
- Confirme as URLs no `.env.local`

**Clerk não funciona**
- Verifique as API keys
- Confira se criou a aplicação no Clerk

**WebSocket não conecta**
- Backend precisa estar rodando
- Verifique `NEXT_PUBLIC_WS_URL`

## 📄 Licença

Proprietário - Todos os direitos reservados.

---

Construído com ❤️ para vendedores que querem vender mais com IA.
