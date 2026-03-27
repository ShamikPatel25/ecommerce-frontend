'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { productAPI } from '@/lib/api';
import { toast } from 'sonner';
import { ImageIcon, CloudUpload, Loader2, Trash2 } from 'lucide-react';

export default function MediaUploader({ productId, initialMedia = [], onMediaChange }) {
  const [media, setMedia] = useState(initialMedia);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', file.type.startsWith('video/') ? 'video' : 'image');
    formData.append('alt_text', file.name);
    const res = await productAPI.uploadMedia(productId, formData);
    return res.data;
  };

  const handleFiles = async (files) => {
    if (!productId) {
      toast.error('Save the product first before uploading media.');
      return;
    }
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (fileArr.length === 0) {
      toast.error('Only image and video files are allowed.');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await Promise.all(fileArr.map(uploadFile));
      const next = [...media, ...uploaded];
      setMedia(next);
      onMediaChange?.(next);
      toast.success(`${uploaded.length} file(s) uploaded!`);
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = (mediaItem) => {
    const next = media.filter(m => m.id !== mediaItem.id);
    setMedia(next);
    onMediaChange?.(next);
    toast.info('Removed from view (refresh to confirm)');
  };

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ff6600]/10 dark:border-gray-700 p-6 md:p-8 shadow-sm mt-8">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#ff6600]/5 dark:border-gray-700">
        <ImageIcon className="w-5 h-5 text-[#ff6600]" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Product Media</h2>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-[#ff6600] bg-[#ff6600]/10 dark:bg-[#ff6600]/20'
            : 'border-[#ff6600]/30 dark:border-gray-600 bg-[#ff6600]/5 dark:bg-gray-700/50 hover:bg-[#ff6600]/10 dark:hover:bg-gray-700'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-[#ff6600] animate-spin" />
            <p className="text-sm text-[#ff6600] font-bold">Uploading...</p>
          </div>
        ) : (
          <>
            <div className="mb-4 h-16 w-16 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-sm text-[#ff6600]">
              <CloudUpload className="w-8 h-8" />
            </div>
            <p className="text-lg font-bold text-slate-800 dark:text-white">Drag and drop images here</p>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              PNG, JPG, WEBP, MP4 — or <span className="text-[#ff6600] font-bold">browse files</span>
            </p>
          </>
        )}
      </div>

      {/* Media Grid */}
      {media.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square rounded-xl overflow-hidden border-2 border-slate-200 dark:border-gray-700 hover:border-[#ff6600]/40 dark:hover:border-[#ff6600]/40 transition-all"
            >
              {item.media_type === 'video' ? (
                <video
                  src={item.file_url}
                  className="w-full h-full object-cover"
                  muted
                />
              ) : (
                <Image
                  src={item.file_url}
                  alt={item.alt_text || 'Product image'}
                  fill
                  className="object-cover"
                />
              )}
              {/* Delete overlay */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {/* Type badge */}
              {item.media_type === 'video' && (
                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                  VIDEO
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
