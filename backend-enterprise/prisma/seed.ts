// =============================================
// 🌱 DATABASE SEED
// =============================================
// Creates demo data for development/testing
// Run with: pnpm prisma db seed
// =============================================

import { PrismaClient, Plan, UserRole, CallDirection, CallStatus, ChatStatus, MessageDirection, MessageStatus, SuggestionType, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // =============================================
  // 1. CREATE DEMO COMPANY
  // =============================================
  console.log('📦 Creating demo company...');
  
  const company = await prisma.company.upsert({
    where: { slug: 'acme-sales' },
    update: {},
    create: {
      name: 'ACME Sales Corp',
      slug: 'acme-sales',
      plan: Plan.PROFESSIONAL,
      billingEmail: 'billing@acme-sales.com',
      website: 'https://acme-sales.com',
      industry: 'Technology',
      size: 'MEDIUM',
      maxUsers: 20,
      maxCallsPerMonth: 500,
      maxChatsPerMonth: 200,
      settings: {
        aiEnabled: true,
        autoSuggestions: true,
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      },
    },
  });
  
  console.log(`   ✅ Company: ${company.name} (${company.id})\n`);

  // =============================================
  // 2. CREATE USERS
  // =============================================
  console.log('👥 Creating users...');

  const users = [
    {
      clerkId: 'clerk_owner_001',
      email: 'owner@acme-sales.com',
      name: 'Carlos Owner',
      role: UserRole.OWNER,
      phone: '+5511999990001',
    },
    {
      clerkId: 'clerk_admin_001',
      email: 'admin@acme-sales.com',
      name: 'Ana Admin',
      role: UserRole.ADMIN,
      phone: '+5511999990002',
    },
    {
      clerkId: 'clerk_manager_001',
      email: 'manager@acme-sales.com',
      name: 'Roberto Manager',
      role: UserRole.MANAGER,
      phone: '+5511999990003',
    },
    {
      clerkId: 'clerk_vendor_001',
      email: 'vendor1@acme-sales.com',
      name: 'Maria Vendas',
      role: UserRole.VENDOR,
      phone: '+5511999990004',
    },
    {
      clerkId: 'clerk_vendor_002',
      email: 'vendor2@acme-sales.com',
      name: 'João Vendas',
      role: UserRole.VENDOR,
      phone: '+5511999990005',
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { clerkId: userData.clerkId },
      update: {},
      create: {
        ...userData,
        companyId: company.id,
        notificationPreferences: {
          email: true,
          push: true,
          inApp: true,
        },
      },
    });
    createdUsers.push(user);
    console.log(`   ✅ User: ${user.name} (${user.role})`);
  }
  console.log('');

  // =============================================
  // 3. CREATE SAMPLE CALLS
  // =============================================
  console.log('📞 Creating sample calls...');

  const vendorUser = createdUsers.find(u => u.role === UserRole.VENDOR)!;

  const calls = [
    {
      phoneNumber: '+5511988887777',
      contactName: 'Cliente Premium LTDA',
      direction: CallDirection.OUTBOUND,
      status: CallStatus.COMPLETED,
      duration: 420,
      transcript: `
Vendedor: Olá, bom dia! Aqui é a Maria da ACME Sales. Como vai?
Cliente: Bom dia, Maria! Tudo bem, e você?
Vendedor: Tudo ótimo! Estou ligando para apresentar nossa nova solução de vendas com IA.
Cliente: Interessante! Conte-me mais.
Vendedor: Nossa plataforma analisa conversas em tempo real e sugere as melhores respostas para fechar vendas.
Cliente: Qual é o preço?
Vendedor: Temos planos a partir de R$ 149/mês. Posso enviar uma proposta personalizada?
Cliente: Sim, pode enviar para meu email.
Vendedor: Perfeito! Qual seu melhor email?
Cliente: contato@clientepremium.com.br
Vendedor: Anotado! Enviarei ainda hoje. Muito obrigada pelo seu tempo!
Cliente: Obrigado, aguardo a proposta.
      `.trim(),
      sentiment: 0.75,
      sentimentLabel: 'POSITIVE',
      keywords: ['preço', 'proposta', 'IA', 'vendas'],
      summary: 'Ligação produtiva com cliente interessado. Solicitou proposta comercial por email. Alto potencial de conversão.',
    },
    {
      phoneNumber: '+5511977776666',
      contactName: 'Tech Solutions SA',
      direction: CallDirection.INBOUND,
      status: CallStatus.COMPLETED,
      duration: 180,
      transcript: `
Cliente: Oi, boa tarde! Vi vocês no LinkedIn e queria saber mais.
Vendedor: Boa tarde! Que bom que nos encontrou! Em que posso ajudar?
Cliente: Preciso de uma solução para minha equipe de vendas.
Vendedor: Perfeito! Quantos vendedores vocês têm?
Cliente: Somos 15 pessoas no time comercial.
Vendedor: Excelente! Nosso plano Professional seria ideal. Posso agendar uma demo?
Cliente: Pode sim, na quinta-feira às 14h?
Vendedor: Agendado! Enviarei o convite por email.
      `.trim(),
      sentiment: 0.85,
      sentimentLabel: 'VERY_POSITIVE',
      keywords: ['demo', 'equipe', 'vendas', 'LinkedIn'],
      summary: 'Lead inbound qualificado via LinkedIn. Demo agendada para quinta-feira. Time de 15 vendedores - fit perfeito para Professional.',
    },
    {
      phoneNumber: '+5511966665555',
      contactName: 'Startup XYZ',
      direction: CallDirection.OUTBOUND,
      status: CallStatus.COMPLETED,
      duration: 90,
      transcript: `
Vendedor: Olá! Posso falar com o responsável comercial?
Cliente: Sou eu. Mas já temos um sistema de vendas.
Vendedor: Entendo! Nosso diferencial é a IA que sugere respostas em tempo real.
Cliente: Interessante, mas agora não é o momento.
Vendedor: Sem problemas! Posso enviar material informativo para quando for conveniente?
Cliente: Pode enviar sim.
Vendedor: Obrigada! Tenha um ótimo dia!
      `.trim(),
      sentiment: 0.35,
      sentimentLabel: 'NEUTRAL',
      keywords: ['sistema', 'IA', 'momento'],
      summary: 'Cliente já possui solução. Não é prioridade no momento, mas aceitou receber material. Follow-up em 3 meses.',
    },
  ];

  for (const callData of calls) {
    const call = await prisma.call.create({
      data: {
        ...callData,
        companyId: company.id,
        userId: vendorUser.id,
        startedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        endedAt: new Date(),
      },
    });
    
    // Create AI suggestion for the call
    await prisma.aISuggestion.create({
      data: {
        callId: call.id,
        userId: vendorUser.id,
        type: SuggestionType.CLOSING,
        content: 'Ótimo momento para propor uma demonstração personalizada!',
        confidence: 0.87,
        triggerText: 'Interessante! Conte-me mais.',
        wasUsed: true,
        usedAt: new Date(),
        model: 'gpt-4',
        latencyMs: 450,
      },
    });
    
    console.log(`   ✅ Call: ${call.contactName} (${call.status})`);
  }
  console.log('');

  // =============================================
  // 4. CREATE WHATSAPP CHATS
  // =============================================
  console.log('💬 Creating WhatsApp chats...');

  const chats = [
    {
      customerPhone: '+5511955554444',
      customerName: 'Roberto Interessado',
      status: ChatStatus.ACTIVE,
      priority: 'HIGH',
      messages: [
        { content: 'Oi! Vi o anúncio de vocês no Instagram', direction: MessageDirection.INCOMING },
        { content: 'Olá Roberto! Tudo bem? Que bom que nos encontrou! 😊', direction: MessageDirection.OUTGOING },
        { content: 'Quanto custa o plano mais completo?', direction: MessageDirection.INCOMING },
        { content: 'Nosso plano Enterprise é R$ 499/mês e inclui usuários ilimitados e suporte 24/7!', direction: MessageDirection.OUTGOING },
        { content: 'Interessante! Vocês fazem teste grátis?', direction: MessageDirection.INCOMING },
      ],
    },
    {
      customerPhone: '+5511944443333',
      customerName: 'Carla Dúvida',
      status: ChatStatus.OPEN,
      priority: 'NORMAL',
      messages: [
        { content: 'Boa tarde! Tenho uma dúvida sobre integração', direction: MessageDirection.INCOMING },
        { content: 'Boa tarde Carla! Claro, pode perguntar!', direction: MessageDirection.OUTGOING },
        { content: 'Vocês integram com o Pipedrive?', direction: MessageDirection.INCOMING },
      ],
    },
  ];

  for (const chatData of chats) {
    const chat = await prisma.whatsappChat.create({
      data: {
        companyId: company.id,
        userId: vendorUser.id,
        customerPhone: chatData.customerPhone,
        customerName: chatData.customerName,
        status: chatData.status as ChatStatus,
        lastMessageAt: new Date(),
        lastMessagePreview: chatData.messages[chatData.messages.length - 1].content.substring(0, 100),
      },
    });

    for (const msg of chatData.messages) {
      await prisma.whatsappMessage.create({
        data: {
          chatId: chat.id,
          content: msg.content,
          direction: msg.direction,
          status: MessageStatus.DELIVERED,
        },
      });
    }

    // Create AI suggestion for chat
    await prisma.aISuggestion.create({
      data: {
        chatId: chat.id,
        userId: vendorUser.id,
        type: SuggestionType.INFORMATION,
        content: 'Sim, oferecemos 14 dias de teste grátis! Posso criar sua conta agora mesmo.',
        confidence: 0.92,
        triggerText: 'Vocês fazem teste grátis?',
        wasUsed: false,
        model: 'gpt-4',
        latencyMs: 380,
      },
    });

    console.log(`   ✅ Chat: ${chat.customerName} (${chatData.messages.length} messages)`);
  }
  console.log('');

  // =============================================
  // 5. CREATE NOTIFICATIONS
  // =============================================
  console.log('🔔 Creating notifications...');

  const notifications = [
    {
      type: NotificationType.SYSTEM,
      title: 'Bem-vindo ao SaaS AI Sales!',
      message: 'Sua conta foi criada com sucesso. Comece explorando o dashboard.',
      read: true,
    },
    {
      type: NotificationType.AI_SUGGESTION,
      title: 'Nova sugestão de IA disponível',
      message: 'Uma nova sugestão foi gerada para sua chamada em andamento.',
      read: false,
    },
    {
      type: NotificationType.NEW_MESSAGE,
      title: 'Nova mensagem no WhatsApp',
      message: 'Roberto Interessado enviou uma mensagem.',
      read: false,
    },
  ];

  for (const notif of notifications) {
    await prisma.notification.create({
      data: {
        ...notif,
        companyId: company.id,
        userId: vendorUser.id,
        readAt: notif.read ? new Date() : null,
      },
    });
    console.log(`   ✅ Notification: ${notif.title}`);
  }
  console.log('');

  // =============================================
  // 6. CREATE AUDIT LOG
  // =============================================
  console.log('📝 Creating audit logs...');

  await prisma.auditLog.create({
    data: {
      companyId: company.id,
      userId: createdUsers[0].id,
      action: 'CREATE',
      resource: 'company',
      resourceId: company.id,
      description: 'Company created during setup',
      newValues: { name: company.name, plan: company.plan },
      ipAddress: '127.0.0.1',
      userAgent: 'Seed Script',
    },
  });
  console.log('   ✅ Audit log created\n');

  // =============================================
  // SUMMARY
  // =============================================
  console.log('═══════════════════════════════════════════');
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════');
  console.log(`
📊 Summary:
   • 1 Company: ${company.name}
   • ${createdUsers.length} Users
   • ${calls.length} Calls with transcripts
   • ${chats.length} WhatsApp chats
   • ${notifications.length} Notifications
   • AI Suggestions generated
   • Audit logs created

🔐 Demo Login:
   Email: vendor1@acme-sales.com
   Company: ${company.slug}
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
