import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import { base44 } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Pencil, Trash2, Eye, Globe, FileText } from 'lucide-react';
import { toast } from 'sonner';

const emptyForm = {
  title: '', excerpt: '', content: '', coverImage: '',
  category: '', tags: '', authorName: '', published: false,
};

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await base44.entities.BlogPost.list('-created_date', 200);
    setPosts(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = posts.filter(p => {
    const matchSearch = (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'published' ? p.published : !p.published);
    return matchSearch && matchStatus;
  });

  const openCreate = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (p) => {
    setForm({
      title: p.title || '',
      excerpt: p.excerpt || '',
      content: p.content || '',
      coverImage: p.coverImage || '',
      category: p.category || '',
      tags: (p.tags || []).join(', '),
      authorName: p.authorName || '',
      published: !!p.published,
    });
    setEditId(p.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung');
      return;
    }
    setSaving(true);
    try {
      const data = {
        title: form.title,
        excerpt: form.excerpt || '',
        content: form.content,
        coverImage: form.coverImage || '',
        category: form.category || '',
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        authorName: form.authorName || '',
        published: form.published,
      };
      if (editId) await base44.entities.BlogPost.update(editId, data);
      else await base44.entities.BlogPost.create(data);
      await load();
      setDialogOpen(false);
      toast.success('Đã lưu bài viết');
    } catch (error) {
      toast.error(error.message || 'Lưu bài viết thất bại');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (p) => {
    try {
      await base44.entities.BlogPost.update(p.id, { published: !p.published });
      setPosts(prev => prev.map(x => x.id === p.id ? { ...x, published: !p.published } : x));
    } catch (error) {
      toast.error(error.message || 'Cập nhật thất bại');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    try {
      await base44.entities.BlogPost.delete(id);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      toast.error(error.message || 'Xóa thất bại');
    }
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Quản lý Blog"
        subtitle={`${posts.length} bài viết · ${posts.filter(p => p.published).length} đã đăng`}
        action={<Button onClick={openCreate} className="bg-primary text-primary-foreground"><Plus size={16} className="mr-1" /> Viết bài</Button>}
      />

      {/* Filter bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm tiêu đề, danh mục..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="published">Đã đăng</SelectItem>
            <SelectItem value="draft">Bản nháp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Chưa có bài viết nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-3">Bài viết</th>
                <th className="px-4 py-3 hidden md:table-cell">Danh mục</th>
                <th className="px-4 py-3 hidden md:table-cell">Lượt xem</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground line-clamp-1">{p.title}</p>
                    {p.excerpt && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.excerpt}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{p.category || '—'}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="flex items-center gap-1 text-muted-foreground"><Eye size={13} />{p.views || 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublish(p)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        p.published
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-muted text-muted-foreground border border-border hover:bg-muted/70'
                      }`}
                      title="Bấm để chuyển trạng thái"
                    >
                      {p.published ? <Globe size={12} /> : <FileText size={12} />}
                      {p.published ? 'Đã đăng' : 'Bản nháp'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil size={13} /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 size={13} /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Editor dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Sửa bài viết' : 'Viết bài mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Tiêu đề *</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Mô tả ngắn</label>
              <Input value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Danh mục</label>
                <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Kiến thức, Thông báo..." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tác giả</label>
                <Input value={form.authorName} onChange={e => setForm({ ...form, authorName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Ảnh bìa (URL)</label>
              <Input value={form.coverImage} onChange={e => setForm({ ...form, coverImage: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tags (phân cách bằng dấu phẩy)</label>
              <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="spa, làm đẹp" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Nội dung (Markdown) *</label>
              <Textarea
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                className="min-h-[220px] font-mono text-xs"
                placeholder="## Tiêu đề&#10;&#10;Nội dung bài viết..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="published" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} />
              <label htmlFor="published" className="text-sm">Đăng công khai</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">{saving ? 'Đang lưu...' : 'Lưu'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
