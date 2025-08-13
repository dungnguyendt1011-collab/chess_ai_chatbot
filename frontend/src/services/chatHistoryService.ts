const API_BASE = 'http://localhost:3002/api';

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
      // Return mock data for testing when database is not available
      console.warn('Database not available, using mock data');
      return [
        {
          id: 1,
          title: 'Quantum Computing Discussion',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 2,
          title: 'Python Functions Help',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: 3,
          title: 'Travel Planning',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          updated_at: new Date(Date.now() - 259200000).toISOString(),
        },
      ];
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
      // Return mock conversation for testing
      console.warn('Database not available, creating mock conversation');
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
      const response = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
        headers,
      });
      if (!response.ok) throw new Error('Failed to get messages');
      const data = await response.json();
      return data.messages;
    } catch (error) {
      // Return mock messages for testing
      console.warn('Database not available, using mock messages');
      if (conversationId === 1) {
        return [
          {
            id: 1,
            conversation_id: 1,
            role: 'user',
            content: 'Can you explain quantum computing?',
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 2,
            conversation_id: 1,
            role: 'assistant',
            content: 'Quantum computing is a type of computation that uses quantum mechanical phenomena...',
            created_at: new Date(Date.now() - 86399000).toISOString(),
          },
        ];
      }
      return [];
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
      const response = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ role, content, images }),
      });
      if (!response.ok) throw new Error('Failed to save message');
      const data = await response.json();
      return data.message;
    } catch (error) {
      // Return mock message for testing
      console.warn('Database not available, creating mock message');
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
      // Return mock updated conversation for testing
      console.warn('Database not available, creating mock updated conversation');
      return {
        id: conversationId,
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  },
};