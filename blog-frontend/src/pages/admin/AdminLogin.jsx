import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      if (user.role !== 'admin' && user.role !== 'staff') {
        setError('Chỉ admin/staff được truy cập newsroom');
        return;
      }
      navigate(params.get('from') || '/admin/newsroom');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-border rounded-2xl p-8 shadow-sm space-y-4">
        <div className="text-center mb-2">
          <h1 className="font-heading italic text-3xl text-foreground">Thera Derma Blog</h1>
          <p className="text-sm text-muted-foreground mt-1">Đăng nhập quản trị</p>
        </div>
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        <div>
          <label className="text-xs text-muted-foreground">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Mật khẩu</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>
    </div>
  );
}
