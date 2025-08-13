import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Tạo connection pool đến PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false, // Tắt SSL cho VPS local
  max: 20, // Maximum number of clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Tăng timeout lên 10s
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

export { pool };

// Database helper functions
export class ChatHistoryDB {
  // Tạo hoặc lấy user bằng session_id
  static async getOrCreateUser(sessionId: string) {
    const client = await pool.connect();
    try {
      // Tìm user theo session_id
      let result = await client.query(
        'SELECT * FROM users WHERE session_id = $1',
        [sessionId]
      );

      if (result.rows.length === 0) {
        // Tạo user mới nếu chưa có
        result = await client.query(
          'INSERT INTO users (session_id) VALUES ($1) RETURNING *',
          [sessionId]
        );
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Tạo conversation mới
  static async createConversation(userId: number, title: string = 'New Chat') {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING *',
        [userId, title]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Lấy tất cả conversations của user
  static async getUserConversations(userId: number) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC',
        [userId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Lưu message
  static async saveMessage(conversationId: number, role: string, content: string, images?: any) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO messages (conversation_id, role, content, images) VALUES ($1, $2, $3, $4) RETURNING *',
        [conversationId, role, content, images ? JSON.stringify(images) : null]
      );

      // Cập nhật updated_at của conversation
      await client.query(
        'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [conversationId]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Lấy messages của conversation
  static async getConversationMessages(conversationId: number) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
        [conversationId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Cập nhật title conversation
  static async updateConversationTitle(conversationId: number, title: string) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'UPDATE conversations SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [title, conversationId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Xóa conversations cũ hơn 3 ngày
  static async cleanupOldConversations() {
    const client = await pool.connect();
    try {
      // Xóa messages trước (do foreign key constraint)
      await client.query(
        `DELETE FROM messages 
         WHERE conversation_id IN (
           SELECT id FROM conversations 
           WHERE updated_at < NOW() - INTERVAL '3 days'
         )`
      );

      // Xóa conversations cũ hơn 3 ngày
      const result = await client.query(
        'DELETE FROM conversations WHERE updated_at < NOW() - INTERVAL \'3 days\' RETURNING id',
      );

      console.log(`🧹 Cleaned up ${result.rowCount} old conversations`);
      return result.rowCount;
    } finally {
      client.release();
    }
  }
}