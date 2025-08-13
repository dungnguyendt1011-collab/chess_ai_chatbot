import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import { ChatHistoryDB, pool } from './database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|txt|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and text documents are allowed'));
    }
  }
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  image_url?: {
    url: string;
  };
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
}

interface FileUploadRequest extends express.Request {
  file?: Express.Multer.File;
}

// Helper function to encode image to base64
const encodeImageToBase64 = (imagePath: string): string => {
  const imageBuffer = fs.readFileSync(imagePath);
  return `data:image/${path.extname(imagePath).slice(1)};base64,${imageBuffer.toString('base64')}`;
};

// Helper function to extract text from PDF
const extractTextFromPDF = async (pdfPath: string): Promise<string> => {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return 'Error reading PDF file';
  }
};

// Helper function to read text file
const readTextFile = (filePath: string): string => {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error('Error reading text file:', error);
    return 'Error reading text file';
  }
};

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req: FileUploadRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileUrl = `/uploads/${req.file.filename}`;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    let fileContent = '';
    let fileType = '';

    // Process different file types
    if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileExtension)) {
      fileType = 'image';
      fileContent = encodeImageToBase64(filePath);
    } else if (fileExtension === '.pdf') {
      fileType = 'pdf';
      fileContent = await extractTextFromPDF(filePath);
    } else if (['.txt', '.doc', '.docx'].includes(fileExtension)) {
      fileType = 'text';
      fileContent = readTextFile(filePath);
    }

    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: fileUrl,
        type: fileType,
        content: fileContent
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Enhanced chat endpoint with vision support
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model = 'gpt-4o-mini' }: ChatRequest = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Process messages for vision API
    const processedMessages = messages.map(msg => {
      if (msg.image_url) {
        return {
          role: msg.role as 'user' | 'assistant' | 'system',
          content: [
            {
              type: 'text' as const,
              text: msg.content
            },
            {
              type: 'image_url' as const,
              image_url: {
                url: msg.image_url.url
              }
            }
          ]
        };
      }
      return {
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      };
    });

    const completion = await openai.chat.completions.create({
      model,
      messages: processedMessages as any, // Type casting for vision API compatibility
      temperature: 0.7,
      max_tokens: 1000,
      stream: false,
    });

    const assistantMessage = completion.choices[0]?.message;
    
    if (!assistantMessage) {
      return res.status(500).json({ error: 'No response from OpenAI' });
    }

    res.json({
      message: assistantMessage,
      usage: completion.usage,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      if (error.message.includes('quota')) {
        return res.status(429).json({ error: 'API quota exceeded' });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize database connection
const chatDB = new ChatHistoryDB();

// Chat History API Endpoints

// Get user's conversations
app.get('/api/conversations', async (req, res) => {
  try {
    const sessionId = req.headers['session-id'] as string || 'anonymous';
    
    const user = await ChatHistoryDB.getOrCreateUser(sessionId);
    const conversations = await ChatHistoryDB.getUserConversations(user.id);
    
    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Create new conversation
app.post('/api/conversations', async (req, res) => {
  try {
    const sessionId = req.headers['session-id'] as string || 'anonymous';
    const { title } = req.body;
    
    const user = await ChatHistoryDB.getOrCreateUser(sessionId);
    const conversation = await ChatHistoryDB.createConversation(user.id, title);
    
    res.json({ conversation });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get messages for a conversation
app.get('/api/conversations/:id/messages', async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const messages = await ChatHistoryDB.getConversationMessages(conversationId);
    
    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Save message to conversation
app.post('/api/conversations/:id/messages', async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const { role, content, images } = req.body;
    
    const message = await ChatHistoryDB.saveMessage(conversationId, role, content, images);
    
    res.json({ message });
  } catch (error) {
    console.error('Save message error:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Update conversation title
app.put('/api/conversations/:id', async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const { title } = req.body;
    
    const conversation = await ChatHistoryDB.updateConversationTitle(conversationId, title);
    
    res.json({ conversation });
  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test route để kiểm tra routes hoạt động
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working', sessionId: req.headers['session-id'] });
});

// Chạy cleanup job mỗi 24 giờ (86400000 ms)
const cleanupInterval = setInterval(async () => {
  try {
    await ChatHistoryDB.cleanupOldConversations();
  } catch (error) {
    console.error('❌ Cleanup job error:', error);
  }
}, 24 * 60 * 60 * 1000);

// Cleanup khi server shutdown
process.on('SIGTERM', () => {
  clearInterval(cleanupInterval);
  pool.end();
});

process.on('SIGINT', () => {
  clearInterval(cleanupInterval);
  pool.end();
  process.exit(0);
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`File uploads enabled at: http://localhost:${PORT}/api/upload`);
  
  // Chạy cleanup ngay khi server start
  try {
    await ChatHistoryDB.cleanupOldConversations();
    console.log('📋 Chat history cleanup completed');
  } catch (error) {
    console.error('❌ Initial cleanup error:', error);
  }
  console.log('📋 Chat history cleanup scheduled every 24 hours');
});