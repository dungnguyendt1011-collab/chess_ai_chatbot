import React, { useState, useRef, useEffect } from 'react';
import type { UploadedFile, PastedImage } from '../types';
import { FileUpload } from './FileUpload';

interface InputBoxProps {
  onSendMessage: (message: string, file?: UploadedFile, images?: PastedImage[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const InputBox: React.FC<InputBoxProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message or paste an image...",
}) => {
  const [message, setMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState<UploadedFile | null>(null);
  const [pastedImages, setPastedImages] = useState<PastedImage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || attachedFile || pastedImages.length > 0) && !disabled) {
      onSendMessage(message, attachedFile || undefined, pastedImages.length > 0 ? pastedImages : undefined);
      setMessage('');
      setAttachedFile(null);
      setPastedImages([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      await processImageFiles(imageFiles);
    }
  };

  const processImageFiles = async (files: File[]) => {
    const newImages: PastedImage[] = [];
    
    for (const file of files) {
      try {
        const base64Content = await fileToBase64(file);
        const pastedImage: PastedImage = {
          id: `${Date.now()}-${Math.random()}`,
          content: base64Content,
          filename: file.name || `pasted-image.${file.type.split('/')[1]}`,
          size: file.size
        };
        newImages.push(pastedImage);
      } catch (error) {
        console.error('Error processing pasted image:', error);
      }
    }
    
    setPastedImages(prev => [...prev, ...newImages]);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (imageId: string) => {
    setPastedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleFileUpload = (file: UploadedFile) => {
    setAttachedFile(file);
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
      {/* Inline Image Preview */}
      {pastedImages.length > 0 && (
        <div className="px-4 pt-4 max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-2 mb-2">
            {pastedImages.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.content}
                  alt={image.filename}
                  className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-600"
                />
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Preview */}
      {attachedFile && (
        <div className="px-4 pt-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3">
              {attachedFile.type === 'image' ? (
                <div className="flex-shrink-0">
                  <img
                    src={attachedFile.content || `http://localhost:3002${attachedFile.url}`}
                    alt={attachedFile.originalname}
                    className="w-12 h-12 rounded object-cover"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {attachedFile.originalname}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(attachedFile.size / 1024).toFixed(1)} KB • {attachedFile.type}
                </p>
              </div>
            </div>
            <button
              onClick={removeAttachedFile}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-3 p-4 max-w-4xl mx-auto">
        <FileUpload onFileUpload={handleFileUpload} disabled={disabled} />
        
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="
              w-full resize-none rounded-2xl border border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-800 px-4 py-3 pr-12
              text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
              focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              max-h-32 overflow-y-auto
            "
            style={{ minHeight: '48px' }}
          />
          
          {/* Character count */}
          {message.length > 0 && (
            <div className="absolute bottom-1 right-12 text-xs text-gray-400">
              {message.length}
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={(!message.trim() && !attachedFile && pastedImages.length === 0) || disabled}
          className="
            flex-shrink-0 w-12 h-12 rounded-2xl
            bg-gradient-to-br from-blue-500 to-blue-600
            hover:from-blue-600 hover:to-blue-700
            disabled:from-gray-300 disabled:to-gray-400
            text-white shadow-lg hover:shadow-xl
            transition-all duration-200 transform hover:scale-105 disabled:scale-100
            disabled:cursor-not-allowed disabled:opacity-50
            flex items-center justify-center
            focus:outline-none focus:ring-2 focus:ring-blue-500/50
          "
        >
          {disabled ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};