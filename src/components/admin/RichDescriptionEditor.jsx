import React, { useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Film, ImagePlus, Link2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uploadCatalogImage, uploadCatalogMedia } from '@/lib/mediaUpload';
import { toast } from 'sonner';

export default function RichDescriptionEditor({ value, onChange, placeholder }) {
  const quillRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [uploading, setUploading] = React.useState(false);
  const [videoUrl, setVideoUrl] = React.useState('');

  const insertHtml = (html) => {
    const editor = quillRef.current?.getEditor?.();
    if (!editor) {
      onChange(`${value || ''}${html}`);
      return;
    }
    const range = editor.getSelection(true);
    const index = range ? range.index : editor.getLength();
    editor.clipboard.dangerouslyPasteHTML(index, html);
    editor.setSelection(index + 1);
  };

  const handleImageFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadCatalogImage(file);
      insertHtml(`<p><img src="${url}" alt="" style="max-width:100%;border-radius:8px" /></p>`);
      toast.success('Đã chèn ảnh vào mô tả');
    } catch (error) {
      toast.error(error.message || 'Không thể upload ảnh');
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleVideoFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadCatalogMedia(file);
      insertHtml(
        `<p><video controls src="${url}" style="max-width:100%;border-radius:8px"></video></p>`,
      );
      toast.success('Đã chèn video vào mô tả');
    } catch (error) {
      toast.error(error.message || 'Không thể upload video');
    } finally {
      setUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const insertVideoFromUrl = () => {
    const url = videoUrl.trim();
    if (!url) {
      toast.error('Vui lòng nhập URL video');
      return;
    }
    const embed = url.includes('youtube.com') || url.includes('youtu.be')
      ? `<p><iframe src="${toYoutubeEmbed(url)}" style="width:100%;aspect-ratio:16/9;border:0;border-radius:8px" allowfullscreen></iframe></p>`
      : `<p><video controls src="${url}" style="max-width:100%;border-radius:8px"></video></p>`;
    insertHtml(embed);
    setVideoUrl('');
    toast.success('Đã chèn video');
  };

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean'],
      ],
    }),
    [],
  );

  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground">Mô tả chi tiết</label>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => imageInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
          )}
          Chèn ảnh
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => videoInputRef.current?.click()}
        >
          <Film className="mr-1.5 h-3.5 w-3.5" />
          Tải video
        </Button>
        <div className="flex min-w-[200px] flex-1 items-center gap-1">
          <Input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="URL YouTube / MP4..."
            className="h-8 text-xs"
          />
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={insertVideoFromUrl}>
            <Link2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        accept="image/*,.jpg,.jpeg,.png,.webp,.gif"
        onChange={(e) => handleImageFile(e.target.files?.[0])}
      />
      <input
        ref={videoInputRef}
        type="file"
        className="hidden"
        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
        onChange={(e) => handleVideoFile(e.target.files?.[0])}
      />

      <div className="catalog-rich-editor rounded-lg border border-border bg-background [&_.ql-container]:min-h-[180px] [&_.ql-editor]:min-h-[160px] [&_.ql-toolbar]:rounded-t-lg [&_.ql-container]:rounded-b-lg">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value || ''}
          onChange={onChange}
          modules={modules}
          placeholder={placeholder || 'Mô tả dịch vụ — có thể chèn ảnh và video...'}
        />
      </div>
    </div>
  );
}

function toYoutubeEmbed(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${parsed.pathname.replace('/', '')}`;
    }
    const id = parsed.searchParams.get('v');
    if (id) return `https://www.youtube.com/embed/${id}`;
  } catch {
    // ignore
  }
  return url;
}
