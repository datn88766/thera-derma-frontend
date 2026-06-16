import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Eye, Tag, User, Share2, MessageCircle, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/entities';
import Navbar from '@/components/spa/Navbar';
import Footer from '@/components/spa/Footer';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
  'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80',
  'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800&q=80',
];

export default function BlogDetail() {
  const { slugOrId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      try {
        let p;
        try {
          p = await base44.entities.BlogPost.getBySlug(slugOrId);
        } catch {
          const data = await base44.entities.BlogPost.filter({ id: slugOrId });
          p = data[0];
        }
        if (p) {
          setPost(p);
          base44.entities.BlogPost.incrementView(p.slug || p.id).catch(() => {});
          const all = await base44.entities.BlogPost.list('-created_date', 10).catch(() => []);
          setRelated(all.filter((x) => x.id !== p.id && x.published !== false).slice(0, 3));
        }
      } catch {
        // not found
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slugOrId]);

  const handleShare = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post?.title || '');
    if (platform === 'facebook') window.open(`https://facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    if (platform === 'linkedin') window.open(`https://linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!post) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <p className="font-heading text-2xl italic text-muted-foreground">Bài viết không tồn tại</p>
      <Link to="/blog" className="text-sm text-primary hover:underline">← Quay lại Blog</Link>
    </div>
  );

  const img = post.coverImage || FALLBACK_IMAGES[post.id?.charCodeAt(0) % FALLBACK_IMAGES.length || 0];
  const dateStr = post.created_date
    ? format(new Date(post.created_date), "dd 'tháng' MM, yyyy", { locale: vi })
    : '';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24">
        {/* Cover image */}
        <div className="relative h-64 md:h-96 overflow-hidden">
          <img src={img} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Article */}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              {/* Back */}
              <button
                onClick={() => navigate('/blog')}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <ArrowLeft size={14} /> Quay lại Blog
              </button>

              {/* Category badge */}
              {post.category && (
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full mb-4">
                  {post.category}
                </span>
              )}

              {/* Title */}
              <h1 className="font-heading text-3xl md:text-4xl font-light text-foreground leading-tight mb-4">
                {post.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b border-border/50">
                <span className="flex items-center gap-1.5"><Calendar size={14} />{dateStr}</span>
                <span className="flex items-center gap-1.5"><Eye size={14} />{post.views || 0} lượt xem</span>
                {post.authorName && (
                  <span className="flex items-center gap-1.5"><User size={14} />{post.authorName}</span>
                )}
              </div>

              {/* Content */}
              <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed
                prose-headings:font-heading prose-headings:font-light prose-headings:text-foreground
                prose-p:text-foreground/80 prose-p:leading-relaxed
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground prose-strong:font-semibold
                prose-img:rounded-xl prose-blockquote:border-primary">
                <ReactMarkdown>{post.content}</ReactMarkdown>
              </div>

              {/* Tags */}
              {post.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-border/50">
                  <Tag size={14} className="text-muted-foreground mt-0.5" />
                  {post.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Share */}
              <div className="mt-8 pt-6 border-t border-border/50">
                <p className="text-sm font-medium text-foreground mb-3 tracking-wide uppercase text-xs">Chia sẻ bài viết</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleShare('facebook')}
                    className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleShare('linkedin')}
                    className="w-9 h-9 rounded-full bg-[#0A66C2] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(window.location.href); }}
                    className="w-9 h-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/80 transition-colors"
                  >
                    <Share2 size={14} />
                  </button>
                </div>
              </div>

              {/* Author */}
              {post.authorName && (
                <div className="mt-8 p-5 border border-border/50 rounded-xl bg-card flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{post.authorName}</p>
                    <p className="text-sm text-muted-foreground mt-1">Chuyên gia tư vấn làm đẹp và chăm sóc da tại Thera Derma.</p>
                    <Link to="/blog" className="text-xs text-primary mt-2 inline-block hover:underline">
                      Xem thêm bài viết của tác giả →
                    </Link>
                  </div>
                </div>
              )}

              {/* Comments placeholder */}
              <div className="mt-10">
                <h3 className="font-heading text-xl font-light mb-4 flex items-center gap-2">
                  <MessageCircle size={18} /> Bình luận (0)
                </h3>
                {currentUser ? (
                  <div className="border border-border/50 rounded-xl p-4 bg-card">
                    <textarea
                      placeholder="Viết bình luận của bạn..."
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none min-h-[80px]"
                    />
                    <div className="flex justify-end mt-2">
                      <button className="px-4 py-2 bg-primary text-primary-foreground text-xs font-medium tracking-widest uppercase rounded hover:bg-primary/90 transition-colors">
                        Gửi bình luận
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-border/50 rounded-xl p-8 bg-card text-center">
                    <p className="text-sm text-muted-foreground mb-3">Vui lòng đăng nhập để để lại bình luận cho bài viết này.</p>
                    <Link
                      to="/login"
                      className="inline-block px-5 py-2 bg-foreground text-background text-xs font-medium tracking-widest uppercase rounded hover:bg-primary transition-colors"
                    >
                      Đăng nhập
                    </Link>
                  </div>
                )}
              </div>
            </motion.article>

            {/* Sidebar */}
            <aside className="space-y-6 lg:sticky lg:top-24 self-start">
              {/* Table of contents placeholder */}
              <div className="bg-card border border-border/50 rounded-xl p-5">
                <h3 className="font-heading text-lg font-medium mb-3">Mục lục</h3>
                <p className="text-sm text-muted-foreground italic">{post.title}</p>
              </div>

              {/* CTA */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
                <h3 className="font-heading text-xl font-light mb-2">Bạn muốn tư vấn làn da?</h3>
                <p className="text-sm text-muted-foreground mb-4">Đăng ký để nhận tư vấn từ đội ngũ chuyên gia của chúng tôi ngay hôm nay.</p>
                <a
                  href="/#booking"
                  className="inline-block px-5 py-2.5 bg-primary text-primary-foreground text-xs font-medium tracking-widest uppercase rounded hover:bg-primary/90 transition-colors"
                >
                  Đặt lịch tư vấn
                </a>
              </div>
            </aside>
          </div>

          {/* Related posts */}
          {related.length > 0 && (
            <div className="mt-16 pt-10 border-t border-border/50">
              <h2 className="font-heading text-3xl italic font-light text-foreground mb-8 text-center">Bài viết liên quan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {related.map((p, i) => {
                  const rImg = p.coverImage || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];
                  return (
                    <Link key={p.id} to={`/blog/${p.id}`} className="group bg-card border border-border/50 rounded-xl overflow-hidden hover:shadow-md transition-all">
                      <div className="aspect-[16/9] overflow-hidden">
                        <img src={rImg} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      </div>
                      <div className="p-4">
                        {p.category && (
                          <span className="text-xs text-primary font-medium">{p.category}</span>
                        )}
                        <h4 className="font-heading text-base font-medium mt-1 line-clamp-2 group-hover:text-primary transition-colors">
                          {p.title}
                        </h4>
                        <span className="flex items-center gap-1 text-xs text-primary mt-3">
                          Đọc thêm <ChevronRight size={11} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}