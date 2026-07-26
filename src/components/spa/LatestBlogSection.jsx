import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Calendar, Eye } from 'lucide-react';
import { base44 } from '@/api/entities';
import { format } from 'date-fns';
import { getBlogUrl } from '@/lib/blogUrl';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
  'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80',
  'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80',
];

export default function LatestBlogSection() {
  const [posts, setPosts] = useState([]);
  const blogUrl = getBlogUrl();

  useEffect(() => {
    base44.entities.BlogPost.list('-created_date', 3).then(data => {
      const list = Array.isArray(data) ? data : data?.items ?? [];
      setPosts(list.filter(p => p.published !== false && p.status === 'published').slice(0, 3));
    }).catch(() => {});
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="py-12 md:py-24 px-6 md:px-12 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-4 mb-8 md:mb-12"
        >
          <div>
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground font-medium mb-3">
              Kiến thức & Tin tức
            </p>
            <h2 className="font-heading italic font-light text-[2rem] md:text-5xl tracking-tight text-foreground">
              Bài viết <span className="text-primary">mới nhất</span>
            </h2>
          </div>
          <a
            href={blogUrl}
            className="flex items-center gap-1.5 text-sm font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            Xem tất cả <ChevronRight size={15} />
          </a>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post, i) => {
            const img = post.coverImage || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];
            const dateStr = post.created_date
              ? format(new Date(post.created_date), 'dd/MM/yyyy')
              : '';
            return (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="group"
              >
                <a href={`${blogUrl}/${post.slug || post.id}`}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl mb-4">
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
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><Calendar size={11} />{dateStr}</span>
                    <span className="flex items-center gap-1"><Eye size={11} />{post.views || 0}</span>
                  </div>
                  <h3 className="font-heading text-xl font-light italic text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 leading-snug mb-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {post.excerpt || post.content?.replace(/[#*_]/g, '').substring(0, 100)}
                  </p>
                </a>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}