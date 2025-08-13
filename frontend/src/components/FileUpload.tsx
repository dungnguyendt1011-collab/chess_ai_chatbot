import React, { useRef, useState } from 'react';
import type { UploadedFile } from '../types';
import { ChatAPI } from '../services/api';

interface FileUploadProps {
  onFileUpload: (file: UploadedFile) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, disabled = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    if (disabled || isUploading) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only images (JPEG, PNG, GIF), PDFs, and text files are allowed');
      return;
    }

    setIsUploading(true);

    try {
      const response = await ChatAPI.uploadFile(file);
      onFileUpload(response.file);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.txt,.doc,.docx"
        onChange={(e) => handleFileSelect(e.target.files)}
        style={{ display: 'none' }}
        disabled={disabled || isUploading}
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="
          flex-shrink-0 w-10 h-10 rounded-lg
          bg-gray-100 dark:bg-gray-700
          hover:bg-gray-200 dark:hover:bg-gray-600
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          flex items-center justify-center
          focus:outline-none focus:ring-2 focus:ring-blue-500/50
        "
        title="Upload file (images, PDFs, text files)"
      >
        {isUploading ? (
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        )}
      </button>

      {/* Drag and Drop Overlay */}
      {dragActive && (
        <div
          className="
            fixed inset-0 z-50 bg-blue-500/20 backdrop-blur-sm
            flex items-center justify-center
          "
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="
            bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl
            border-2 border-dashed border-blue-400
            text-center
          ">
            <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Drop file here
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Images, PDFs, and text files (max 10MB)
            </p>
          </div>
        </div>
      )}
    </>
  );
};