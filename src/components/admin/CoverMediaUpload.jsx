import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, Upload, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CATALOG_IMAGE_ACCEPT,
  CATALOG_VIDEO_ACCEPT,
  resolveMediaUrl,
  uploadCatalogImage,
  uploadCatalogMedia,
} from '@/lib/mediaUpload';
import { toast } from 'sonner';

export default function CoverMediaUpload({
  label,
  value,
  onChange,
  mode = 'image',
  urlPlaceholder,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const previewUrl = resolveMediaUrl(value);
  const isVideo = mode === 'video';

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = isVideo
        ? (await uploadCatalogMedia(file)).url
        : await uploadCatalogImage(file);
      onChange(url);
      toast.success(isVideo ? 'Đã tải video lên' : 'Đã tải ảnh lên');
    } catch (error) {
      toast.error(error.message || 'Upload thất bại');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground">{label}</label>

      <div className="rounded-lg border border-border bg-muted/20 p-3">
        {previewUrl ? (
          <div className="relative mb-3 overflow-hidden rounded-md border border-border bg-background">
            {isVideo ? (
              <video
                src={previewUrl}
                controls
                className="max-h-40 w-full bg-black object-contain"
              />
            ) : (
              <img src={previewUrl} alt="" className="max-h-40 w-full object-cover" />
            )}
          </div>
        ) : (
          <div className="mb-3 flex h-28 items-center justify-center rounded-md border border-dashed border-border bg-background/50 text-muted-foreground">
            {isVideo ? <Video className="h-8 w-8 opacity-40" /> : <ImagePlus className="h-8 w-8 opacity-40" />}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-3.5 w-3.5" />
            )}
            {previewUrl ? (isVideo ? 'Thay video' : 'Thay ảnh') : 'Tải lên'}
          </Button>
          {previewUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onChange('')}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Xóa
            </Button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={isVideo ? CATALOG_VIDEO_ACCEPT : CATALOG_IMAGE_ACCEPT}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={urlPlaceholder || (isVideo ? 'Hoặc dán URL video...' : 'Hoặc dán URL ảnh...')}
        className="text-xs"
      />
    </div>
  );
}
