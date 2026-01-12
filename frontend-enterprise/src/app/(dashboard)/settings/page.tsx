'use client';

import { useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Badge, Separator, Avatar, AvatarImage, AvatarFallback } from '@/components/ui/index';
import { useUserStore } from '@/stores';
import {
  User,
  Building2,
  Bell,
  Shield,
  Palette,
  Globe,
  Key,
  Smartphone,
  Mail,
  Save,
  Camera,
  Check,
} from 'lucide-react';
import { cn, getInitials, getPlanLabel, getPlanColor } from '@/lib/utils';
import { toast } from 'sonner';

const tabs = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'company', label: 'Empresa', icon: Building2 },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'security', label: 'Segurança', icon: Shield },
  { id: 'appearance', label: 'Aparência', icon: Palette },
  { id: 'integrations', label: 'Integrações', icon: Globe },
];

export default function SettingsPage() {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const { user, company } = useUserStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [companyForm, setCompanyForm] = useState({
    name: company?.name || '',
    website: company?.website || '',
    industry: company?.industry || '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    aiSuggestions: true,
    callAlerts: true,
    chatAlerts: true,
    weeklyReport: true,
  });

  const handleSaveProfile = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('Perfil atualizado com sucesso!');
    setIsSaving(false);
  };

  const handleSaveCompany = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('Dados da empresa atualizados!');
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações da conta
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>
                  Atualize suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={clerkUser?.imageUrl} />
                    <AvatarFallback className="text-lg">
                      {user?.name ? getInitials(user.name) : '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" className="gap-2">
                      <Camera className="h-4 w-4" />
                      Alterar Foto
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG ou GIF. Máximo 2MB.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Form */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, phone: e.target.value })
                      }
                      placeholder="+55 11 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Função</Label>
                    <div className="flex items-center h-10">
                      <Badge className={getPlanColor(user?.role || 'VENDOR')}>
                        {user?.role || 'VENDOR'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={isSaving} className="gap-2">
                    {isSaving ? (
                      'Salvando...'
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Company Tab */}
          {activeTab === 'company' && (
            <Card>
              <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
                <CardDescription>
                  Informações da sua organização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                  <Building2 className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{company?.name || 'Minha Empresa'}</p>
                    <div className="flex items-center gap-2">
                      <Badge className={getPlanColor(company?.plan || 'STARTER')}>
                        {getPlanLabel(company?.plan || 'STARTER')}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {company?.maxUsers || 5} usuários
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nome da Empresa</Label>
                    <Input
                      id="companyName"
                      value={companyForm.name}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={companyForm.website}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, website: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="industry">Setor</Label>
                    <Input
                      id="industry"
                      value={companyForm.industry}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, industry: e.target.value })
                      }
                      placeholder="Ex: Tecnologia, Varejo, Serviços..."
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveCompany} disabled={isSaving} className="gap-2">
                    {isSaving ? (
                      'Salvando...'
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>
                  Escolha como deseja receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { key: 'emailNotifications', label: 'Notificações por Email', description: 'Receba atualizações importantes por email', icon: Mail },
                  { key: 'pushNotifications', label: 'Notificações Push', description: 'Notificações no navegador em tempo real', icon: Bell },
                  { key: 'aiSuggestions', label: 'Sugestões de IA', description: 'Receba sugestões da IA durante conversas', icon: Smartphone },
                  { key: 'callAlerts', label: 'Alertas de Ligação', description: 'Notificações de novas ligações', icon: Bell },
                  { key: 'chatAlerts', label: 'Alertas de Chat', description: 'Notificações de novas mensagens', icon: Bell },
                  { key: 'weeklyReport', label: 'Relatório Semanal', description: 'Resumo de desempenho toda segunda-feira', icon: Mail },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <Button
                      variant={notificationSettings[item.key as keyof typeof notificationSettings] ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        setNotificationSettings({
                          ...notificationSettings,
                          [item.key]: !notificationSettings[item.key as keyof typeof notificationSettings],
                        })
                      }
                    >
                      {notificationSettings[item.key as keyof typeof notificationSettings] ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Ativo
                        </>
                      ) : (
                        'Inativo'
                      )}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>
                  Gerencie a segurança da sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <Key className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Alterar Senha</p>
                      <p className="text-sm text-muted-foreground">
                        Última alteração há 30 dias
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">Alterar</Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <Shield className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Autenticação em 2 Fatores</p>
                      <p className="text-sm text-muted-foreground">
                        Adicione uma camada extra de segurança
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">Ativo</Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <Smartphone className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Dispositivos Conectados</p>
                      <p className="text-sm text-muted-foreground">
                        3 dispositivos ativos
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">Gerenciar</Button>
                </div>

                <Separator />

                <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/5">
                  <h4 className="font-medium text-destructive mb-2">Zona de Perigo</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ações irreversíveis para sua conta
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => signOut()}>
                      Sair de Todos os Dispositivos
                    </Button>
                    <Button variant="destructive">Excluir Conta</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>
                  Personalize a interface do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="mb-3 block">Tema</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {['light', 'dark', 'system'].map((theme) => (
                      <button
                        key={theme}
                        className={cn(
                          'p-4 rounded-lg border-2 transition-colors',
                          'hover:border-primary',
                          theme === 'system' ? 'border-primary' : 'border-transparent'
                        )}
                      >
                        <div
                          className={cn(
                            'h-20 rounded-md mb-2',
                            theme === 'light' ? 'bg-white border' : '',
                            theme === 'dark' ? 'bg-gray-900' : '',
                            theme === 'system' ? 'bg-gradient-to-r from-white to-gray-900' : ''
                          )}
                        />
                        <p className="text-sm font-medium capitalize">{theme === 'system' ? 'Sistema' : theme === 'light' ? 'Claro' : 'Escuro'}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="mb-3 block">Densidade</Label>
                  <div className="flex gap-4">
                    {['Compacto', 'Normal', 'Confortável'].map((density) => (
                      <Button
                        key={density}
                        variant={density === 'Normal' ? 'default' : 'outline'}
                        size="sm"
                      >
                        {density}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <Card>
              <CardHeader>
                <CardTitle>Integrações</CardTitle>
                <CardDescription>
                  Conecte com outras ferramentas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'Twilio', description: 'Telefonia e SMS', connected: true },
                  { name: 'WhatsApp Business', description: 'Mensagens WhatsApp', connected: true },
                  { name: 'Stripe', description: 'Pagamentos e assinaturas', connected: true },
                  { name: 'Slack', description: 'Notificações no Slack', connected: false },
                  { name: 'HubSpot', description: 'CRM integrado', connected: false },
                  { name: 'Zapier', description: 'Automações', connected: false },
                ].map((integration) => (
                  <div
                    key={integration.name}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {integration.description}
                      </p>
                    </div>
                    {integration.connected ? (
                      <Badge variant="success">Conectado</Badge>
                    ) : (
                      <Button variant="outline" size="sm">
                        Conectar
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
