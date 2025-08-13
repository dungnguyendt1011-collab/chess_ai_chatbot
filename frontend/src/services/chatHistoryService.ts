const API_BASE = import.meta.env.PROD 
  ? 'https://dungnguyen.duckdns.org/api' 
  : 'http://localhost:3002/api';

// Generate simple session ID for browser
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('chat-session-id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('chat-session-id', sessionId);
  }
  return sessionId;
};

const headers = {
  'Content-Type': 'application/json',
  'session-id': getSessionId(),
};

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  images?: any[];
  created_at: string;
}

export const chatHistoryService = {
  // Lấy danh sách conversations
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await fetch(`${API_BASE}/conversations`, {
        headers,
      });
      if (!response.ok) throw new Error('Failed to get conversations');
      const data = await response.json();
      return data.conversations;
    } catch (error) {
      console.error('Failed to get conversations:', error);
      return []; // Return empty array instead of mock data
    }
  },

  // Tạo conversation mới
  async createConversation(title: string = 'New Chat'): Promise<Conversation> {
    try {
      const response = await fetch(`${API_BASE}/conversations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      const data = await response.json();
      return data.conversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      return {
        id: Date.now(),
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  },

  // Lấy messages của conversation
  async getMessages(conversationId: number): Promise<Message[]> {
    try {
      console.log(`Loading messages for conversation ${conversationId}`);
      const response = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
        headers,
      });
      if (!response.ok) {
        console.error(`Failed to get messages - Status: ${response.status}`);
        throw new Error('Failed to get messages');
      }
      const data = await response.json();
      console.log(`Loaded ${data.messages?.length || 0} messages for conversation ${conversationId}`);
      return data.messages || [];
    } catch (error) {
      console.error('Failed to get messages:', error);
      return []; // Return empty array instead of mock data
    }
  },

  // Lưu message
  async saveMessage(
    conversationId: number,
    role: 'user' | 'assistant',
    content: string,
    images?: any[]
  ): Promise<Message> {
    try {
      console.log(`Saving ${role} message to conversation ${conversationId}`);
      const response = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ role, content, images }),
      });
      if (!response.ok) {
        console.error(`Failed to save message - Status: ${response.status}`);
        throw new Error('Failed to save message');
      }
      const data = await response.json();
      console.log(`Message saved successfully: ${data.message?.id}`);
      return data.message;
    } catch (error) {
      console.error('Failed to save message:', error);
      return {
        id: Date.now(),
        conversation_id: conversationId,
        role,
        content,
        images,
        created_at: new Date().toISOString(),
      };
    }
  },

  // Cập nhật title conversation
  async updateConversationTitle(conversationId: number, title: string): Promise<Conversation> {
    try {
      const response = await fetch(`${API_BASE}/conversations/${conversationId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error('Failed to update conversation title');
      const data = await response.json();
      return data.conversation;
    } catch (error) {
      console.error('Failed to update conversation title:', error);
      return {
        id: conversationId,
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  },
};