'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, Image as ImageIcon, X, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  placeholder?: string;
  aspectRatio?: 'square' | 'banner' | 'video' | 'portrait';
  className?: string;
  required?: boolean;
}

export default function ImageUploadField({
  value,
  onChange,
  label = 'Image',
  helperText = 'PNG, JPG, WEBP, or SVG up to 10MB',
  placeholder = 'Paste image URL or upload from device',
  aspectRatio = 'square',
  className = '',
  required = false,
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP, SVG, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10MB limit');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      onChange(data.url);
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleClear = () => {
    onChange('');
    setUploadError(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-[#45363B]">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] text-[#8C3A4F] hover:underline cursor-pointer"
          >
            {showUrlInput ? 'Hide URL link' : 'Or paste URL'}
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Upload / Preview Area */}
      {value ? (
        <div className="relative group rounded-2xl overflow-hidden border border-[#EAC9D1] bg-[#FCF8F9] p-2.5 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-white border border-stone-200 shrink-0 shadow-2xs">
            <Image
              src={value}
              alt="Uploaded preview"
              fill
              className="object-cover"
              sizes="112px"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                ✓ Image Selected
              </span>
            </div>
            <p className="text-xs text-stone-600 truncate font-mono bg-white/70 px-2 py-1 rounded-lg border border-stone-200/50">
              {value}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-[#8C3A4F] hover:bg-[#722E3F] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Change Image</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-600 hover:text-rose-600 text-xs font-semibold rounded-xl border border-stone-200 transition-colors cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2.5 ${
            isDragOver
              ? 'border-[#8C3A4F] bg-[#FDF0F4]'
              : 'border-[#EAC9D1] bg-[#FCF8F9] hover:bg-[#FDF0F4]/60 hover:border-[#8C3A4F]/60'
          }`}
        >
          {isUploading ? (
            <div className="py-4 flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-[#8C3A4F] animate-spin" />
              <p className="text-xs font-bold text-[#8C3A4F]">Uploading image from device...</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#FDF0F4] border border-[#EAC9D1] text-[#8C3A4F] flex items-center justify-center shadow-2xs">
                <Upload className="w-6 h-6 text-[#8C3A4F]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#2D1B1B]">
                  Click to upload image <span className="text-[#8C3A4F] font-normal">or drag &amp; drop</span>
                </p>
                <p className="text-[11px] text-[#7A5B64] mt-0.5">{helperText}</p>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 bg-[#8C3A4F] text-white rounded-xl text-xs font-bold shadow-2xs hover:bg-[#722E3F] transition-colors pointer-events-none mt-1"
              >
                Choose Image File
              </button>
            </>
          )}
        </div>
      )}

      {/* Optional URL Input if admin explicitly wants it */}
      {showUrlInput && (
        <div className="pt-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-xs bg-white border border-[#EAC9D1] rounded-xl outline-hidden focus:ring-2 focus:ring-[#8C3A4F]/30 font-mono"
          />
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}
