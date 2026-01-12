'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Badge, Skeleton, Avatar, AvatarImage, AvatarFallback, Label, Separator } from '@/components/ui/index';
import { usersService } from '@/services/api';
import { useUserStore } from '@/stores';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Mail,
  Phone,
  Shield,
  Trash2,
  Edit,
  UserPlus,
  Crown,
  X,
} from 'lucide-react';
import { cn, getInitials, formatRelative } from '@/lib/utils';
import type { User, UserRole } from '@/types';
import { toast } from 'sonner';

const roleLabels: Record<string, { label: string; color: string }> = {
  OWNER: { label: 'Proprietário', color: 'bg-purple-500/10 text-purple-600' },
  ADMIN: { label: 'Administrador', color: 'bg-blue-500/10 text-blue-600' },
  MANAGER: { label: 'Gerente', color: 'bg-green-500/10 text-green-600' },
  VENDOR: { label: 'Vendedor', color: 'bg-gray-500/10 text-gray-600' },
};

export default function TeamPage() {
  const queryClient = useQueryClient();
  const { user: currentUser, company } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'VENDOR' });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getAll({ limit: 100 }),
  });

  const createUserMutation = useMutation({
    mutationFn: (data: { email: string; name: string; role?: string }) =>
      usersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowInviteModal(false);
      setInviteForm({ email: '', name: '', role: 'VENDOR' });
      toast.success('Convite enviado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao enviar convite');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário removido');
    },
    onError: () => {
      toast.error('Erro ao remover usuário');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      usersService.update(id, { role: role as UserRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Função atualizada');
    },
    onError: () => {
      toast.error('Erro ao atualizar função');
    },
  });

  const filteredUsers = (users?.data || []).filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const usersByRole = {
    OWNER: filteredUsers.filter((u) => u.role === 'OWNER'),
    ADMIN: filteredUsers.filter((u) => u.role === 'ADMIN'),
    MANAGER: filteredUsers.filter((u) => u.role === 'MANAGER'),
    VENDOR: filteredUsers.filter((u) => u.role === 'VENDOR'),
  };

  const handleInvite = () => {
    if (!inviteForm.email || !inviteForm.name) {
      toast.error('Preencha todos os campos');
      return;
    }
    createUserMutation.mutate(inviteForm);
  };

  const canManageUsers =
    currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Equipe</h1>
          <p className="text-muted-foreground">
            Gerencie os membros da sua equipe
          </p>
        </div>
        {canManageUsers && (
          <Button className="gap-2" onClick={() => setShowInviteModal(true)}>
            <UserPlus className="h-4 w-4" />
            Convidar Membro
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users?.data.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total de usuários</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users?.data.filter((u) => u.isActive).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <Shield className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{usersByRole.ADMIN.length + usersByRole.OWNER.length}</p>
                <p className="text-sm text-muted-foreground">Administradores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                <Crown className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {company?.maxUsers || 5}
                </p>
                <p className="text-sm text-muted-foreground">Limite do plano</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
          <CardDescription>
            {filteredUsers.length} de {company?.maxUsers || 5} usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="divide-y">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.name}</p>
                        {user.id === currentUser?.id && (
                          <Badge variant="outline" className="text-xs">
                            Você
                          </Badge>
                        )}
                        {!user.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={roleLabels[user.role]?.color || ''}>
                      {roleLabels[user.role]?.label || user.role}
                    </Badge>
                    {canManageUsers && user.id !== currentUser?.id && user.role !== 'OWNER' && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            const newRole = user.role === 'VENDOR' ? 'MANAGER' : 'VENDOR';
                            updateRoleMutation.mutate({ id: user.id, role: newRole });
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja remover este usuário?')) {
                              deleteUserMutation.mutate(user.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum usuário encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4 animate-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Convidar Membro</CardTitle>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowInviteModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Envie um convite para um novo membro da equipe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-name">Nome</Label>
                <Input
                  id="invite-name"
                  placeholder="Nome do colaborador"
                  value={inviteForm.name}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="email@empresa.com"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Função</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['VENDOR', 'MANAGER', 'ADMIN'] as const).map((role) => (
                    <Button
                      key={role}
                      type="button"
                      variant={inviteForm.role === role ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => setInviteForm({ ...inviteForm, role })}
                    >
                      {roleLabels[role]?.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleInvite}
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? 'Enviando...' : 'Enviar Convite'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
