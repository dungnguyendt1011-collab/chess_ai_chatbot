export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  file?: UploadedFile;
  images?: PastedImage[];
  image_url?: {
    url: string;
  };
  saved?: boolean;
}

export interface PastedImage {
  id: string;
  content: string; // base64 data URL
  filename: string;
  size: number;
}

export interface UploadedFile {
  filename: string;
  originalname: string;
  size: number;
  url: string;
  type: 'image' | 'pdf' | 'text';
  content?: string;
}

export interface ChatResponse {
  message: {
    role: 'assistant';
    content: string;
  };
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string | Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: {
        url: string;
      };
    }>;
    image_url?: {
      url: string;
    };
  }>;
  model?: string;
}

export interface FileUploadResponse {
  success: boolean;
  file: UploadedFile;
}