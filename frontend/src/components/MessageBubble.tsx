import React from 'react';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isLoading = message.isLoading;

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'pdf':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-slide-up`}>
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`
            relative px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm
            ${isUser
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white ml-auto'
              : 'bg-white/10 text-gray-800 dark:text-gray-200 border border-white/20'
            }
            ${isLoading ? 'animate-pulse' : ''}
          `}
        >
          {isLoading ? (
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          ) : (
            <>
              {/* Inline Images */}
              {message.images && message.images.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {message.images.map((image) => (
                      <div key={image.id} className="relative">
                        <img
                          src={image.content}
                          alt={image.filename}
                          className="max-w-32 max-h-32 rounded-lg object-cover border border-white/20"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Attachment */}
              {message.file && (
                <div className="mb-3">
                  {message.file.type === 'image' ? (
                    <div className="relative">
                      <img
                        src={`http://localhost:3002${message.file.url}`}
                        alt={message.file.originalname}
                        className="max-w-full max-h-64 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="text-xs opacity-75 mt-1">
                        {message.file.originalname}
                      </div>
                    </div>
                  ) : (
                    <div className={`
                      flex items-center space-x-2 p-2 rounded-lg
                      ${isUser ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}
                    `}>
                      {getFileIcon(message.file.type)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {message.file.originalname}
                        </div>
                        <div className="text-xs opacity-75">
                          {(message.file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Text Content */}
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </>
          )}
          
          {/* Message tail */}
          <div
            className={`
              absolute top-0 w-0 h-0
              ${isUser
                ? 'right-0 -mr-2 border-l-8 border-l-blue-500 border-t-8 border-t-transparent'
                : 'left-0 -ml-2 border-r-8 border-r-white/10 border-t-8 border-t-transparent'
              }
            `}
          />
        </div>
        
        {!isLoading && (
          <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
      
      {/* Avatar */}
      <div className={`flex-shrink-0 ${isUser ? 'order-1 mr-3' : 'order-2 ml-3'}`}>
        <div
          className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${isUser
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
              : 'bg-gradient-to-br from-gray-700 to-gray-800 text-white'
            }
          `}
        >
          {isUser ? 'U' : 'AI'}
        </div>
      </div>
    </div>
  );
};