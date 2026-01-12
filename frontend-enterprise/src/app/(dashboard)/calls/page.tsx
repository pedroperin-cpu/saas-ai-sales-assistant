'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Badge, Skeleton, ScrollArea, Avatar, AvatarFallback } from '@/components/ui/index';
import { callsService, aiService } from '@/services/api';
import { useAISuggestionsStore, useActiveCallStore } from '@/stores';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneMissed,
  Search,
  Plus,
  Sparkles,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  Mic,
  MicOff,
  RefreshCw,
} from 'lucide-react';
import {
  cn,
  formatPhone,
  formatDuration,
  formatRelative,
  getCallStatusColor,
  getCallStatusLabel,
  getInitials,
  getSentimentColor,
  truncate,
} from '@/lib/utils';
import type { Call, AISuggestion } from '@/types';
import { toast } from 'sonner';

export default function CallsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [copiedSuggestion, setCopiedSuggestion] = useState<string | null>(null);

  const { currentSuggestion, suggestions, isGenerating, setGenerating, addSuggestion } =
    useAISuggestionsStore();
  const { isInCall, activeCallId, callDuration } = useActiveCallStore();

  const { data: calls, isLoading } = useQuery({
    queryKey: ['calls', searchQuery],
    queryFn: () => callsService.getAll({ search: searchQuery, limit: 50 }),
  });

  const { data: activeCalls } = useQuery({
    queryKey: ['active-calls'],
    queryFn: () => callsService.getActive(),
    refetchInterval: 5000,
  });

  const generateSuggestionMutation = useMutation({
    mutationFn: (message: string) =>
      aiService.generateSuggestion({
        currentMessage: message,
        context: 'phone_call',
      }),
    onSuccess: (suggestion) => {
      addSuggestion(suggestion);
      toast.success('Sugestão gerada!');
    },
    onError: () => {
      toast.error('Erro ao gerar sugestão');
    },
  });

  const copySuggestion = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSuggestion(text);
    toast.success('Copiado!');
    setTimeout(() => setCopiedSuggestion(null), 2000);
  };

  const handleGenerateSuggestion = () => {
    if (selectedCall?.transcript) {
      generateSuggestionMutation.mutate(selectedCall.transcript);
    } else {
      toast.info('Selecione uma ligação com transcrição');
    }
  };

  const filteredCalls = calls?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ligações</h1>
          <p className="text-muted-foreground">
            Gerencie suas chamadas e receba sugestões de IA em tempo real
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Ligação
        </Button>
      </div>

      {/* Active Call Banner */}
      {activeCalls && activeCalls.length > 0 && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 animate-pulse">
                <PhoneCall className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-400">
                  Ligação em andamento
                </h3>
                <p className="text-sm text-muted-foreground">
                  {activeCalls[0].contactName || activeCalls[0].phoneNumber} •{' '}
                  {formatDuration(activeCalls[0].duration || 0)}
                </p>
              </div>
            </div>
            <Button variant="destructive" className="gap-2">
              <PhoneOff className="h-4 w-4" />
              Encerrar
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calls List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Calls Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Ligações</CardTitle>
              <CardDescription>
                {calls?.meta.total || 0} ligações encontradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredCalls.length > 0 ? (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-2">
                    {filteredCalls.map((call) => (
                      <div
                        key={call.id}
                        onClick={() => setSelectedCall(call)}
                        className={cn(
                          'flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md',
                          selectedCall?.id === call.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback>
                              {call.contactName
                                ? getInitials(call.contactName)
                                : call.phoneNumber.slice(-2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {call.contactName || formatPhone(call.phoneNumber)}
                              </p>
                              {call.direction === 'INBOUND' ? (
                                <ArrowDownLeft className="h-3 w-3 text-blue-500" />
                              ) : (
                                <ArrowUpRight className="h-3 w-3 text-green-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDuration(call.duration)}
                              <span>•</span>
                              {formatRelative(call.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {call.sentiment !== undefined && (
                            <div
                              className={cn(
                                'h-2 w-2 rounded-full',
                                call.sentiment >= 0.6
                                  ? 'bg-green-500'
                                  : call.sentiment >= 0.4
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              )}
                            />
                          )}
                          <Badge className={getCallStatusColor(call.status)}>
                            {getCallStatusLabel(call.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma ligação encontrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Suggestions Panel */}
        <div className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Assistente IA
              </CardTitle>
              <CardDescription>
                Sugestões inteligentes para sua conversa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Generate Button */}
              <Button
                onClick={handleGenerateSuggestion}
                disabled={generateSuggestionMutation.isPending || !selectedCall}
                className="w-full gap-2"
              >
                {generateSuggestionMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar Sugestão
                  </>
                )}
              </Button>

              {/* Current Suggestion */}
              {currentSuggestion && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex items-start justify-between">
                    <Badge variant="info" className="text-xs">
                      {currentSuggestion.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(currentSuggestion.confidence * 100)}% confiança
                    </span>
                  </div>
                  <p className="text-sm">{currentSuggestion.suggestion}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => copySuggestion(currentSuggestion.suggestion)}
                  >
                    {copiedSuggestion === currentSuggestion.suggestion ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Suggestions History */}
              {suggestions.length > 1 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Sugestões anteriores
                  </p>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {suggestions.slice(1).map((suggestion, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-muted/50 text-sm cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => copySuggestion(suggestion.suggestion)}
                        >
                          <p className="line-clamp-2">{suggestion.suggestion}</p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {suggestion.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {!currentSuggestion && suggestions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    Selecione uma ligação e clique em &quot;Gerar Sugestão&quot;
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Call Details */}
          {selectedCall && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalhes da Ligação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contato</p>
                  <p className="font-medium">
                    {selectedCall.contactName || formatPhone(selectedCall.phoneNumber)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duração</p>
                  <p className="font-medium">{formatDuration(selectedCall.duration)}</p>
                </div>
                {selectedCall.summary && (
                  <div>
                    <p className="text-sm text-muted-foreground">Resumo</p>
                    <p className="text-sm">{selectedCall.summary}</p>
                  </div>
                )}
                {selectedCall.keywords && selectedCall.keywords.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Palavras-chave</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedCall.keywords.map((keyword, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
