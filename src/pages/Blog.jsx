import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Calendar, Tag, TrendingUp, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/entities';
import { useBlogCategories } from '@/shared/hooks/useServices';
import Navbar from '@/components/spa/Navbar';
import Footer from '@/components/spa/Footer';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const CATEGORIES = ['Tất cả', 'Thông báo', 'Kiến thức', 'Sự kiện', 'Tin tức'];

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
  'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80',
  'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80',
  'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&q=80',
  'https://images.unsplash.com/photo-1607748862156-7c548e7e98f4?w=600&q=80',
  'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80',
];

function PostCard({ post, index }) {
  const img = post.coverImage || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  const dateStr = post.created_date
    ? format(new Date(post.created_date), 'dd/MM/yyyy', { locale: vi })
    : '';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5 }}
      className="group bg-card border border-border/50 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-500"
    >
      <Link to={`/blog/${post.slug || post.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={img}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          {post.category && (
            <span className="absolute top-3 left-3 px-2.5 py-1 bg-foreground/80 text-background text-xs font-medium rounded tracking-wide">
              {post.category}
            </span>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1"><Calendar size={11} />{dateStr}</span>
            <span className="flex items-center gap-1"><Eye size={11} />{post.views || 0} views</span>
          </div>
          <h3 className="font-heading text-lg font-medium text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4">
            {post.excerpt || post.content?.replace(/[#*_]/g, '').substring(0, 120) + '...'}
          </p>
          <span className="flex items-center gap-1 text-xs font-medium text-primary tracking-wide">
            Đọc thêm <ChevronRight size={13} />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const { data: apiCategories } = useBlogCategories();
  const categories = ['Tất cả', ...(apiCategories?.map((c) => c.name) ?? CATEGORIES.slice(1))];

  useEffect(() => {
    base44.entities.BlogPost.list('-created_date', 50).then(data => {
      setPosts(data.filter(p => p.published !== false));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = activeCategory === 'Tất cả'
    ? posts
    : posts.filter(p => p.category === activeCategory);

  const featured = posts.slice(0, 5);
  const allTags = [...new Set(posts.flatMap(p => p.tags || []))].slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero header */}
      <div className="pt-28 pb-12 bg-muted/30 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs tracking-widest uppercase text-primary font-medium mb-2">Thera Derma</p>
            <h1 className="font-heading text-4xl md:text-5xl italic font-light text-foreground mb-2">Blog & Tin tức</h1>
            <p className="text-muted-foreground text-base max-w-xl">Cập nhật kiến thức làm đẹp, xu hướng chăm sóc da và tin tức mới nhất từ Thera Derma.</p>
          </motion.div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-[64px] z-30 bg-background/90 backdrop-blur border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-300 ${
                  activeCategory === cat
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-foreground/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-muted/40 rounded-xl h-72 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="font-heading text-2xl italic">Chưa có bài viết nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filtered.map((post, i) => (
                  <PostCard key={post.id} post={post} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Featured posts */}
            <div className="bg-card border border-border/50 rounded-xl p-5">
              <h3 className="flex items-center gap-2 font-heading text-lg font-medium mb-4">
                <TrendingUp size={16} className="text-primary" /> Bài viết nổi bật
              </h3>
              <div className="space-y-4">
                {featured.map((post, i) => (
                  <Link key={post.id} to={`/blog/${post.id}`} className="flex items-start gap-3 group">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {post.created_date ? format(new Date(post.created_date), 'dd/MM/yyyy') : ''}
                        {' · '}<Eye size={10} className="inline" /> {post.views || 0}
                      </p>
                    </div>
                  </Link>
                ))}
                {featured.length === 0 && <p className="text-sm text-muted-foreground">Chưa có bài viết</p>}
              </div>
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div className="bg-card border border-border/50 rounded-xl p-5">
                <h3 className="flex items-center gap-2 font-heading text-lg font-medium mb-4">
                  <Tag size={16} className="text-primary" /> Tags phổ biến
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {}}
                      className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}