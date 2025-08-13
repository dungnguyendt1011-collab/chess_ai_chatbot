import React, { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { InputBox } from './InputBox';
import { ThemeToggle } from './ThemeToggle';
import { ChatSidebar } from './ChatSidebar';
import { useChat } from '../hooks/useChat';
import { useChatHistory } from '../hooks/useChatHistory';
import type { Message, UploadedFile, PastedImage } from '../types';

export const ChatInterface: React.FC = () => {
  const { messages, isLoading, error, sendMessage, clearMessages, setMessages } = useChat();
  const {
    conversations,
    currentConversation,
    messages: historyMessages,
    loading: historyLoading,
    createNewConversation,
    selectConversation,
    saveMessage: saveHistoryMessage,
    updateConversationTitle,
    clearCurrentConversation,
  } = useChatHistory();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages khi chọn conversation từ history
  useEffect(() => {
    if (currentConversation && historyMessages.length > 0) {
      const convertedMessages: Message[] = historyMessages.map(msg => ({
        id: msg.id.toString(),
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        images: msg.images ? (typeof msg.images === 'string' ? JSON.parse(msg.images) : msg.images) : undefined,
        saved: true, // Mark as saved since they're from history
      }));
      setMessages(convertedMessages);
    }
    // Don't clear messages automatically - let user actions handle it
  }, [currentConversation, historyMessages, setMessages]);

  // Enhanced send message function với history
  const handleSendMessage = async (content: string, file?: UploadedFile, images?: PastedImage[]) => {
    // Nếu chưa có conversation, tạo mới trước khi send message
    if (!currentConversation) {
      const firstWords = content.trim().split(' ').slice(0, 6).join(' ');
      const title = firstWords.length > 0 ? firstWords : 'New Chat';
      const newConv = await createNewConversation(title);
      
      // Đảm bảo conversation được tạo thành công trước khi send message
      if (!newConv) {
        console.error('Failed to create conversation');
        return;
      }
    }

    // Send message như bình thường
    await sendMessage(content, file, images);
  };

  // Save messages to history after response completes
  useEffect(() => {
    if (!currentConversation || messages.length === 0) return;

    const saveMessagesSequentially = async () => {
      const lastMessage = messages[messages.length - 1];
      const secondLastMessage = messages[messages.length - 2];

      // Only save when assistant has completed responding
      if (lastMessage?.role === 'assistant' && !lastMessage.isLoading && !lastMessage.saved) {
        try {
          // Save user message first if exists and not saved
          if (secondLastMessage?.role === 'user' && !secondLastMessage.saved) {
            await saveHistoryMessage(secondLastMessage.role, secondLastMessage.content, secondLastMessage.images);
            setMessages(prev => prev.map(m => 
              m.id === secondLastMessage.id ? { ...m, saved: true } : m
            ));
          }

          // Then save assistant message
          await saveHistoryMessage(lastMessage.role, lastMessage.content);
          setMessages(prev => prev.map(m => 
            m.id === lastMessage.id ? { ...m, saved: true } : m
          ));
        } catch (error) {
          console.error('Failed to save messages to history:', error);
        }
      }
    };

    saveMessagesSequentially();
  }, [messages, currentConversation, saveHistoryMessage]);

  const handleNewChat = async () => {
    // Clear everything first to avoid conflicts
    clearMessages();
    clearCurrentConversation();
    // Don't create conversation yet, wait for first message
  };

  const handleSelectConversation = async (conversation: any) => {
    // Only clear messages if it's a different conversation
    if (currentConversation?.id !== conversation.id) {
      clearMessages(); // Clear messages first to avoid conflicts
      await selectConversation(conversation);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-80 flex-shrink-0">
          <ChatSidebar
            conversations={conversations}
            currentConversation={currentConversation}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            onUpdateTitle={updateConversationTitle}
            loading={historyLoading}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div 
        className="flex flex-col flex-1"
        style={{
          background: `linear-gradient(to bottom right, var(--gradient-from), var(--gradient-via), var(--gradient-to))`
        }}
      >
      {/* Header */}
      <header 
        className="flex-shrink-0 backdrop-blur-md shadow-sm"
        style={{
          backgroundColor: 'var(--header-bg)',
          borderBottom: `1px solid var(--border-primary)`
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 
                className="text-xl font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Chat Minio
              </h1>
              <p 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Powered by GPT
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {messages.length > 0 && (
              <button
                onClick={handleNewChat}
                className="
                  px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300
                  hover:text-gray-900 dark:hover:text-white
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  rounded-lg transition-colors duration-200
                "
              >
                New Chat
              </button>
            )}
            
            <ThemeToggle />
            
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Welcome to AI Chat
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  Start a conversation with our AI assistant. Ask questions, get help, or just chat!
                </p>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                  {[
                    "What can you help me with?",
                    "Explain quantum computing",
                    "Write a Python function",
                    "Plan my vacation"
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion)}
                      className="
                        p-3 text-sm text-left rounded-xl border border-gray-200 dark:border-gray-700
                        hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-gray-700
                        transition-colors duration-200 group
                      "
                    >
                      <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {suggestion}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Error Display */}
      {error && (
        <div className="flex-shrink-0 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0">
        <InputBox
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder={isLoading ? "AI is thinking..." : "Type your message..."}
        />
      </div>
      </div>
    </div>
  );
};