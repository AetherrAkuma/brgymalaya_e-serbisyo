import { useState } from 'react';
import { fileAPI } from '../services/api';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  const uploadFile = async (file, options = {}) => {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
      onProgress
    } = options;

    setUploading(true);
    setUploadError('');
    setUploadedFile(null);

    try {
      // Validate file size
      if (file.size > maxSize) {
        throw new Error(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
      }

      const response = await fileAPI.uploadFile(file);
      
      if (response.data.status === 'success') {
        setUploadedFile(response.data);
        return response.data;
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Upload failed';
      setUploadError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setUploading(false);
    setUploadError('');
    setUploadedFile(null);
  };

  return {
    uploading,
    uploadError,
    uploadedFile,
    uploadFile,
    reset
  };
};