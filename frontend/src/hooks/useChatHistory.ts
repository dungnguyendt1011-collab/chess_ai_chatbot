import { useState, useEffect, useCallback } from 'react';
import { chatHistoryService, type Conversation, type Message } from '../services/chatHistoryService';

export const useChatHistory = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversations khi component mount
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const convs = await chatHistoryService.getConversations();
      setConversations(convs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages của conversation
  const loadMessages = useCallback(async (conversationId: number) => {
    try {
      setLoading(true);
      setError(null);
      const msgs = await chatHistoryService.getMessages(conversationId);
      setMessages(msgs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Tạo conversation mới
  const createNewConversation = useCallback(async (title: string = 'New Chat') => {
    try {
      setError(null);
      const newConv = await chatHistoryService.createConversation(title);
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversation(newConv);
      setMessages([]); // Clear messages for new conversation
      return newConv;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      return null;
    }
  }, []);

  // Chọn conversation
  const selectConversation = useCallback(async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    await loadMessages(conversation.id);
  }, [loadMessages]);

  // Lưu message
  const saveMessage = useCallback(async (
    role: 'user' | 'assistant',
    content: string,
    images?: any[]
  ) => {
    if (!currentConversation) return null;

    try {
      setError(null);
      const message = await chatHistoryService.saveMessage(
        currentConversation.id,
        role,
        content,
        images
      );
      
      setMessages(prev => [...prev, message]);
      
      // Cập nhật conversation list (move to top)
      setConversations(prev => {
        const updated = prev.filter(c => c.id !== currentConversation.id);
        return [{ ...currentConversation, updated_at: new Date().toISOString() }, ...updated];
      });
      
      return message;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save message');
      return null;
    }
  }, [currentConversation]);

  // Cập nhật title conversation
  const updateConversationTitle = useCallback(async (conversationId: number, title: string) => {
    try {
      setError(null);
      const updatedConv = await chatHistoryService.updateConversationTitle(conversationId, title);
      
      setConversations(prev =>
        prev.map(c => c.id === conversationId ? updatedConv : c)
      );
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(updatedConv);
      }
      
      return updatedConv;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update title');
      return null;
    }
  }, [currentConversation]);

  // Clear current conversation
  const clearCurrentConversation = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
  }, []);

  // Load conversations khi hook được khởi tạo
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    loadConversations,
    createNewConversation,
    selectConversation,
    saveMessage,
    updateConversationTitle,
    clearCurrentConversation,
  };
};