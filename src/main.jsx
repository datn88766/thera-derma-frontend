import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/index.css';

const isBlogHost =
  window.location.hostname === 'blog.localhost' ||
  window.location.hostname.startsWith('blog.');

const root = ReactDOM.createRoot(document.getElementById('root'));

if (isBlogHost) {
  import('@blog/App.jsx').then(({ default: BlogApp }) => {
    root.render(
      <React.StrictMode>
        <BlogApp />
      </React.StrictMode>,
    );
  });
} else {
  import('@/App.jsx').then(({ default: App }) => {
    root.render(<App />);
  });
}
