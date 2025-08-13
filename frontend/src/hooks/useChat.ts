import { useState, useCallback } from 'react';
import type { Message, UploadedFile, PastedImage } from '../types';
import { ChatAPI } from '../services/api';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string, file?: UploadedFile, images?: PastedImage[]) => {
    if (!content.trim() && !file && (!images || images.length === 0)) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim() || (file ? `Uploaded: ${file.originalname}` : '') || (images && images.length > 0 ? 'Images pasted' : ''),
      timestamp: new Date(),
      file: file,
      images: images,
      image_url: file?.type === 'image' ? {
        url: file.content || `http://localhost:3002${file.url}`
      } : undefined,
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const chatMessages = [...messages, userMessage].map(msg => {
        const baseMessage = {
          role: msg.role,
          content: msg.content,
        };

        // Handle file content for non-image files
        if (msg.file && msg.file.type !== 'image') {
          baseMessage.content = `${msg.content}\n\nFile content:\n${msg.file.content}`;
        }

        // Handle multiple images for vision API
        if (msg.images && msg.images.length > 0) {
          const contentArray = [
            {
              type: 'text' as const,
              text: msg.content
            },
            ...msg.images.map(image => ({
              type: 'image_url' as const,
              image_url: {
                url: image.content
              }
            }))
          ];
          
          return {
            ...baseMessage,
            content: contentArray,
          };
        }

        // Add single image URL for vision API (legacy file upload)
        if (msg.image_url) {
          return {
            ...baseMessage,
            image_url: msg.image_url,
          };
        }

        return baseMessage;
      });

      const response = await ChatAPI.sendMessage({
        messages: chatMessages,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: response.message.content,
        timestamp: new Date(),
      };

      setMessages(prev => [
        ...prev.slice(0, -1), // Remove loading message
        assistantMessage,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setMessages(prev => prev.slice(0, -1)); // Remove loading message
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
};