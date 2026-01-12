'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Badge, Skeleton, ScrollArea, Avatar, AvatarFallback, Separator } from '@/components/ui/index';
import { whatsappService, aiService } from '@/services/api';
import { useAISuggestionsStore, useActiveChatStore } from '@/stores';
import wsClient from '@/lib/websocket';
import {
  MessageSquare,
  Search,
  Plus,
  Send,
  Sparkles,
  Phone,
  MoreVertical,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Copy,
  RefreshCw,
  User,
  Clock,
} from 'lucide-react';
import {
  cn,
  formatPhone,
  formatRelative,
  formatTime,
  getChatStatusColor,
  getChatPriorityColor,
  getInitials,
  truncate,
} from '@/lib/utils';
import type { WhatsAppChat, WhatsAppMessage, AISuggestion } from '@/types';
import { toast } from 'sonner';

export default function WhatsAppPage() {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<WhatsAppChat | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [copiedSuggestion, setCopiedSuggestion] = useState(false);

  const { currentSuggestion, setCurrentSuggestion, addSuggestion } = useAISuggestionsStore();
  const { setActiveChat, otherUserTyping } = useActiveChatStore();

  // Fetch chats
  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ['whatsapp-chats', searchQuery],
    queryFn: () => whatsappService.getChats({ search: searchQuery, limit: 50 }),
  });

  // Fetch messages for selected chat
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', selectedChat?.id],
    queryFn: () => whatsappService.getMessages(selectedChat!.id, { limit: 100 }),
    enabled: !!selectedChat?.id,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      whatsappService.sendMessage(selectedChat!.id, { content }),
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedChat?.id] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-chats'] });
    },
    onError: () => {
      toast.error('Erro ao enviar mensagem');
    },
  });

  // Generate AI suggestion mutation
  const generateSuggestionMutation = useMutation({
    mutationFn: () => whatsappService.getSuggestion(selectedChat!.id),
    onSuccess: (suggestion) => {
      setCurrentSuggestion(suggestion);
      addSuggestion(suggestion);
    },
    onError: () => {
      toast.error('Erro ao gerar sugestão');
    },
  });

  // WebSocket setup
  useEffect(() => {
    if (selectedChat?.id) {
      wsClient.joinChat(selectedChat.id);
      setActiveChat(selectedChat.id);

      return () => {
        wsClient.leaveChat(selectedChat.id);
        setActiveChat(null);
      };
    }
  }, [selectedChat?.id, setActiveChat]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChat) return;
    sendMessageMutation.mutate(messageInput.trim());
  };

  const handleUseSuggestion = () => {
    if (currentSuggestion) {
      setMessageInput(currentSuggestion.suggestion);
      setCopiedSuggestion(true);
      setTimeout(() => setCopiedSuggestion(false), 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const chatList = chats?.data || [];
  const messageList = messages?.data || [];

  return (
    <div className="h-[calc(100vh-7rem)]">
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* Chat List */}
        <div className="col-span-4 xl:col-span-3 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversas
                </CardTitle>
                <Button size="icon-sm" variant="ghost">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              {chatsLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : chatList.length > 0 ? (
                <ScrollArea className="h-full">
                  <div className="divide-y">
                    {chatList.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={cn(
                          'flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/50',
                          selectedChat?.id === chat.id && 'bg-muted'
                        )}
                      >
                        <Avatar>
                          <AvatarFallback className="bg-green-500/10 text-green-600">
                            {chat.customerName
                              ? getInitials(chat.customerName)
                              : chat.customerPhone.slice(-2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">
                              {chat.customerName || formatPhone(chat.customerPhone)}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {chat.lastMessageAt && formatRelative(chat.lastMessageAt)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {chat.lastMessagePreview || 'Nova conversa'}
                          </p>
                        </div>
                        {chat.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                  <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
                  <p>Nenhuma conversa</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Window */}
        <div className="col-span-8 xl:col-span-6 flex flex-col">
          <Card className="flex-1 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-green-500/10 text-green-600">
                          {selectedChat.customerName
                            ? getInitials(selectedChat.customerName)
                            : selectedChat.customerPhone.slice(-2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {selectedChat.customerName || formatPhone(selectedChat.customerPhone)}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          {otherUserTyping ? (
                            <span className="text-green-500">Digitando...</span>
                          ) : (
                            <>
                              <span className="h-2 w-2 rounded-full bg-green-500" />
                              Online
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getChatPriorityColor(selectedChat.priority)}>
                        {selectedChat.priority}
                      </Badge>
                      <Button size="icon-sm" variant="ghost">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button size="icon-sm" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-4 overflow-hidden">
                  {messagesLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className={cn('h-12 w-48', i % 2 === 0 ? '' : 'ml-auto')} />
                      ))}
                    </div>
                  ) : (
                    <ScrollArea className="h-full pr-4">
                      <div className="space-y-4">
                        {messageList.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              'flex',
                              message.direction === 'OUTGOING' ? 'justify-end' : 'justify-start'
                            )}
                          >
                            <div
                              className={cn(
                                'max-w-[70%] rounded-2xl px-4 py-2',
                                message.direction === 'OUTGOING'
                                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                                  : 'bg-muted rounded-bl-sm'
                              )}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <div
                                className={cn(
                                  'flex items-center justify-end gap-1 mt-1',
                                  message.direction === 'OUTGOING'
                                    ? 'text-primary-foreground/70'
                                    : 'text-muted-foreground'
                                )}
                              >
                                <span className="text-[10px]">
                                  {formatTime(message.createdAt)}
                                </span>
                                {message.direction === 'OUTGOING' && (
                                  message.status === 'read' ? (
                                    <CheckCheck className="h-3 w-3 text-blue-400" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )
                                )}
                              </div>
                              {message.aiSuggestionUsed && (
                                <div className="flex items-center gap-1 mt-1 text-[10px] opacity-70">
                                  <Sparkles className="h-3 w-3" />
                                  IA
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-end gap-2">
                    <Button size="icon" variant="ghost">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Digite sua mensagem..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="pr-10"
                      />
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                      >
                        <Smile className="h-5 w-5" />
                      </Button>
                    </div>
                    <Button
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Selecione uma conversa</p>
                <p className="text-sm">Escolha um chat para começar</p>
              </div>
            )}
          </Card>
        </div>

        {/* AI Panel */}
        <div className="col-span-12 xl:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Assistente IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => generateSuggestionMutation.mutate()}
                disabled={!selectedChat || generateSuggestionMutation.isPending}
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

              {currentSuggestion && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="info">{currentSuggestion.type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(currentSuggestion.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-sm">{currentSuggestion.suggestion}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={handleUseSuggestion}
                  >
                    {copiedSuggestion ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Usar Sugestão
                      </>
                    )}
                  </Button>
                </div>
              )}

              {!currentSuggestion && (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    Selecione um chat e gere sugestões inteligentes
                  </p>
                </div>
              )}

              {/* Chat Info */}
              {selectedChat && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Informações do Chat</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedChat.customerName || 'Não identificado'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{formatPhone(selectedChat.customerPhone)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Iniciado {formatRelative(selectedChat.createdAt)}</span>
                      </div>
                    </div>
                    {selectedChat.tags && selectedChat.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedChat.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
