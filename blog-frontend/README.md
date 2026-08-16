# Thera Derma Blog

Blog chạy **chung cổng 5174** với spa chính, phân biệt bằng hostname `blog.localhost`.

## Chạy local (khuyến nghị)

1. Thêm vào `C:\Windows\System32\drivers\etc\hosts`:
   ```
   127.0.0.1 blog.localhost
   ```

2. Chỉ cần chạy frontend chính (một terminal):
   ```powershell
   cd "d:\Thera Derma\Web\frontend"
   npm run dev
   ```

3. Backend:
   ```powershell
   cd "d:\Thera Derma\Web\backend"
   npm run start:dev
   ```

4. Truy cập:
   - Spa: http://localhost:5174
   - Blog public: http://blog.localhost:5174
   - Newsroom: http://blog.localhost:5174/admin/newsroom
   - Editor: http://blog.localhost:5174/admin/editor

## Cổng phụ 5175 (tùy chọn)

Chỉ dùng khi muốn dev blog độc lập, không chạy spa chính:

```powershell
cd blog-frontend
npm run dev
```

→ http://blog.localhost:5175

## Production

Build từ frontend chính (blog được bundle qua hostname). Deploy `frontend/dist` cho cả hai host, hoặc build riêng `blog-frontend` nếu deploy subdomain tách file.

`VITE_BLOG_URL=https://blog.theraderma.vn` trên frontend chính.
