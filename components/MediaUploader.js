'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { productAPI } from '@/lib/api';
import { toast } from 'sonner';
import { ImageIcon, CloudUpload, Loader2, Trash2, ChevronDown, Star } from 'lucide-react';

export default function MediaUploader({ productId, initialMedia = [], onMediaChange, attributeValues = [] }) {
  const [media, setMedia] = useState(initialMedia);
  useEffect(() => {
    setMedia(initialMedia);
  }, [initialMedia]);
  const [uploading, setUploading] = useState(false);
  const [selectedAttrValue, setSelectedAttrValue] = useState('');
  const inputRef = useRef();

  // Group media: general (no attribute_value) + per-attribute-value
  const groupedMedia = useMemo(() => {
    const general = media.filter(m => !m.attribute_value_id);
    const byValue = {};
    media.forEach(m => {
      if (m.attribute_value_id) {
        if (!byValue[m.attribute_value_id]) {
          byValue[m.attribute_value_id] = {
            label: `${m.attribute_name}: ${m.attribute_value_name}`,
            items: [],
          };
        }
        byValue[m.attribute_value_id].items.push(m);
      }
    });
    return { general, byValue };
  }, [media]);

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', file.type.startsWith('video/') ? 'video' : 'image');
    formData.append('alt_text', file.name);
    if (selectedAttrValue) {
      formData.append('attribute_value_id', selectedAttrValue);
    }
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
      const autoDetected = uploaded.filter(u => u.auto_detected);
      if (autoDetected.length > 0) {
        toast.success(`${uploaded.length} file(s) uploaded! Auto-linked: ${autoDetected.map(u => u.auto_detected_label).join(', ')}`);
      } else {
        toast.success(`${uploaded.length} file(s) uploaded!`);
      }
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const [deletingId, setDeletingId] = useState(null);
  const [settingThumbId, setSettingThumbId] = useState(null);

  const handleDelete = async (mediaItem) => {
    if (!productId) {
      const next = media.filter(m => m.id !== mediaItem.id);
      setMedia(next);
      onMediaChange?.(next);
      return;
    }
    setDeletingId(mediaItem.id);
    try {
      const res = await productAPI.deleteMedia(productId, mediaItem.id);
      const newThumbId = res.data?.new_thumbnail_id;
      let next = media.filter(m => m.id !== mediaItem.id);
      // If backend auto-promoted a new thumbnail, reflect it in UI
      if (newThumbId) {
        next = next.map(m => ({ ...m, is_thumbnail: m.id === newThumbId }));
      }
      setMedia(next);
      onMediaChange?.(next);
      toast.success('Image deleted successfully.');
    } catch {
      toast.error('Failed to delete image. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetThumbnail = async (mediaItem) => {
    if (!productId) return;
    setSettingThumbId(mediaItem.id);
    try {
      await productAPI.setThumbnail(productId, mediaItem.id);
      const next = media.map(m => ({ ...m, is_thumbnail: m.id === mediaItem.id }));
      setMedia(next);
      onMediaChange?.(next);
      toast.success('Thumbnail set!');
    } catch {
      toast.error('Failed to set thumbnail.');
    } finally {
      setSettingThumbId(null);
    }
  };

  const renderMediaGrid = (items, label) => {
    if (items.length === 0) return null;
    return (
      <div className="mt-4">
        <h4 className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">{label}</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                item.is_thumbnail
                  ? 'border-[#ff6600] ring-2 ring-[#ff6600]/20'
                  : 'border-slate-200 dark:border-gray-700 hover:border-[#ff6600]/40 dark:hover:border-[#ff6600]/40'
              }`}
            >
              {item.media_type === 'video' ? (
                <video
                  src={item.file_url}
                  className="w-full h-full object-cover"
                  muted
                />
              ) : item.file_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.file_url}
                  alt={item.alt_text || 'Product image'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-gray-700 text-slate-400 gap-1">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-xs text-center px-1 truncate w-full">{item.alt_text}</span>
                </div>
              )}
              {/* Thumbnail badge */}
              {item.is_thumbnail && (
                <span className="absolute top-2 left-2 bg-[#ff6600] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-white" /> THUMBNAIL
                </span>
              )}
              {/* Alt text badge */}
              <span className="absolute bottom-1 left-1 right-8 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded truncate">
                {item.alt_text}
              </span>
              {/* Action buttons overlay */}
              <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Set Thumbnail */}
                {item.media_type === 'image' && !item.is_thumbnail && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSetThumbnail(item); }}
                    disabled={settingThumbId === item.id}
                    className="p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-full text-[#ff6600] shadow-sm hover:bg-[#ff6600]/10 dark:hover:bg-[#ff6600]/20 disabled:opacity-100 disabled:cursor-wait"
                    title="Set as Thumbnail"
                  >
                    {settingThumbId === item.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Star className="w-4 h-4" />
                    }
                  </button>
                )}
                {/* Delete */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                  disabled={deletingId === item.id}
                  className="p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-full text-red-500 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-100 disabled:cursor-wait"
                  title="Delete"
                >
                  {deletingId === item.id
                    ? <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
              </div>
              {item.media_type === 'video' && (
                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                  VIDEO
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-[#ff6600]/10 dark:border-gray-700 p-6 md:p-8 shadow-sm mt-8">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#ff6600]/5 dark:border-gray-700">
        <ImageIcon className="w-5 h-5 text-[#ff6600]" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Product Media</h2>
      </div>

      {/* Attribute Value Selector + Upload Button */}
      {attributeValues.length > 0 ? (
        <div className="flex items-end gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5 block">
              Upload images for:
            </label>
            <div className="relative inline-block">
              <select
                value={selectedAttrValue}
                onChange={(e) => setSelectedAttrValue(e.target.value)}
                className="appearance-none rounded-lg border border-[#ff6600]/20 bg-[#ff6600]/5 px-4 h-11 pr-10 text-sm text-slate-900 dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 transition-all font-medium"
              >
                <option value="">General (Product Main)</option>
                {attributeValues.map(av => (
                  <option key={av.id} value={av.id}>
                    {av.attribute_name}: {av.value}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 cursor-pointer rounded-lg h-11 px-6 bg-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-5 h-5" />
                <span>Upload Images</span>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 cursor-pointer rounded-lg h-11 px-6 bg-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-5 h-5" />
                <span>Upload Images</span>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Grouped Media Gallery */}
      {media.length > 0 && (
        <div className="mt-6 space-y-6">
          {/* General images */}
          {renderMediaGrid(groupedMedia.general, 'General Product Images')}

          {/* Per-attribute-value images */}
          {Object.entries(groupedMedia.byValue).map(([valueId, group]) => (
            <div key={valueId}>
              {renderMediaGrid(group.items, group.label)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
