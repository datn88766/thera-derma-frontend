import { useLocation } from 'react-router-dom';

const translations = {
  vi: {
    news: {
      title: 'Blog Thera Derma',
      subtitle: 'Kiến thức chăm sóc da & làm đẹp',
      searchPlaceholder: 'Tìm bài viết...',
      allCategories: 'Tất cả',
      noResults: 'Không tìm thấy bài viết',
      readMore: 'Đọc tiếp',
      views: 'lượt xem',
      manageNews: 'Quản lý bài viết',
      categories: {
        all: 'Tất cả',
        announcement: 'Thông báo',
        scholarship: 'Học bổng',
        event: 'Sự kiện',
        news: 'Tin tức',
        knowledge: 'Kiến thức',
      },
    },
  },
  en: {
    news: {
      title: 'Thera Derma Blog',
      subtitle: 'Skincare & beauty insights',
      searchPlaceholder: 'Search articles...',
      allCategories: 'All',
      noResults: 'No articles found',
      readMore: 'Read more',
      views: 'views',
      manageNews: 'Manage articles',
      categories: {
        all: 'All',
        announcement: 'Announcement',
        scholarship: 'Scholarship',
        event: 'Event',
        news: 'News',
        knowledge: 'Knowledge',
      },
    },
  },
};

export function useLang() {
  const { pathname } = useLocation();
  const lang = pathname.startsWith('/en') ? 'en' : 'vi';
  return { lang, t: translations[lang] };
}
