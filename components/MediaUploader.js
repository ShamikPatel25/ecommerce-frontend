'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { productAPI } from '@/lib/api';
import { toast } from 'sonner';

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
        // Optimistically remove from UI (deletion API can be added later)
        const next = media.filter(m => m.id !== mediaItem.id);
        setMedia(next);
        onMediaChange?.(next);
        toast.info('Removed from view (refresh to confirm)');
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Media</h2>

            {/* Drop Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition select-none ${dragging
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/40'
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
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                        <p className="text-sm text-orange-600 font-medium">Uploading…</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">🖼️</span>
                        <p className="text-sm font-medium text-gray-700">
                            Drag & drop images/videos here, or <span className="text-orange-500">browse</span>
                        </p>
                        <p className="text-xs text-gray-400">PNG, JPG, WEBP, MP4 supported</p>
                    </div>
                )}
            </div>

            {/* Media Grid */}
            {media.length > 0 && (
                <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {media.map((item) => (
                        <div key={item.id} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
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
                                className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xl"
                                title="Remove"
                            >
                                🗑️
                            </button>
                            {/* Type badge */}
                            {item.media_type === 'video' && (
                                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                                    VIDEO
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
