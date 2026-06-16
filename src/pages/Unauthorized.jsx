import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function Unauthorized() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-foreground/10" />
      <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-background/70 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl px-8 py-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert size={28} className="text-destructive" />
          </div>
          <h1 className="font-heading text-2xl font-light text-foreground mb-2">
            Không có quyền truy cập
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Tài khoản của bạn{user?.email ? ` (${user.email})` : ''} không có quyền
            truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là nhầm lẫn.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              to="/"
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium tracking-widest uppercase text-sm hover:bg-primary/90 transition-all"
            >
              Về trang chủ
            </Link>
            <button
              onClick={() => logout('/login')}
              className="w-full py-3 border border-border text-foreground rounded-xl font-medium tracking-widest uppercase text-sm hover:bg-muted transition-all"
            >
              Đăng nhập tài khoản khác
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
