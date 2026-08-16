export const newsroomT = {
  brand: {
    title: 'Thera Derma Blog',
    subtitle: 'Phòng tin tức biên tập',
  },
  sidebar: {
    collapse: 'Thu gọn thanh bên',
    expand: 'Mở rộng thanh bên',
    groups: {
      operate: 'Vận hành',
      content: 'Nội dung',
      system: 'Hệ thống',
    },
    items: {
      dashboard: 'Bảng điều khiển',
      review: 'Hàng đợi duyệt',
      ingestion: 'Thu thập',
      articles: 'Bài viết',
      scheduler: 'Lịch xuất bản',
      translation: 'AI & Dịch thuật',
      sources: 'Nguồn tin',
      analytics: 'Phân tích',
      rules: 'Quy tắc quy trình',
      logs: 'Nhật ký hệ thống',
      settings: 'Cài đặt',
    },
    roles: {
      admin: 'Quản trị viên',
      staff: 'Nhân viên',
      super_admin: 'Siêu quản trị',
      content_admin: 'Biên tập viên',
    },
  },
  header: {
    pending: 'chờ duyệt',
    scheduled: 'đã lên lịch',
    searchPlaceholder: 'Tìm bài viết, nguồn tin, thao tác…',
    toggleFeed: 'Bật/tắt hoạt động trực tiếp',
    newArticle: 'Bài viết mới',
    home: 'Trở về trang chủ',
    pendingReviews: 'Bài chờ duyệt',
    scheduledArticles: 'Bài đã lên lịch',
  },
  pages: {
    '/admin/newsroom': {
      title: 'Trung tâm điều hành',
      description: 'Tổng quan phòng tin tức theo thời gian thực',
    },
    '/admin/newsroom/review': {
      title: 'Hàng đợi duyệt',
      description: 'Không gian kiểm duyệt nội dung',
    },
    '/admin/newsroom/ingestion': {
      title: 'Thu thập',
      description: 'Bài nhập tự động đang chờ duyệt',
    },
    '/admin/newsroom/articles': {
      title: 'Bài viết',
      description: 'Tất cả bài đã xuất bản, lên lịch và bản nháp',
    },
    '/admin/newsroom/scheduler': {
      title: 'Lịch xuất bản',
      description: 'Lịch biên tập & mật độ xuất bản',
    },
    '/admin/newsroom/translation': {
      title: 'AI & Dịch thuật',
      description: 'Hỗ trợ AI, đồng bộ song ngữ',
    },
    '/admin/newsroom/sources': {
      title: 'Nguồn tin',
      description: 'Sức khỏe nguồn RSS / API & quy tắc',
    },
    '/admin/newsroom/analytics': {
      title: 'Phân tích',
      description: 'Chỉ số vận hành và biên tập',
    },
    '/admin/newsroom/rules': {
      title: 'Quy tắc quy trình',
      description: 'Tự động xuất bản & định tuyến',
    },
    '/admin/newsroom/logs': {
      title: 'Nhật ký hệ thống',
      description: 'Sự kiện pipeline có cấu trúc',
    },
    '/admin/newsroom/settings': {
      title: 'Cài đặt',
      description: 'Tùy chọn phòng tin tức',
    },
    default: {
      title: 'Phòng tin tức',
      description: '',
    },
  },
  articles: {
    title: 'Bài viết',
    count: (total) => `${total} bài viết`,
    countMatching: (total, query) => `${total} bài viết khớp "${query}"`,
    refresh: 'Làm mới',
    newArticle: 'Bài viết mới',
    tabs: {
      all: 'Tất cả',
      pending: 'Chờ duyệt',
      published: 'Đã xuất bản',
      scheduled: 'Đã lên lịch',
      draft: 'Bản nháp',
      archived: 'Lưu trữ',
    },
    searchPlaceholder: 'Tìm tiêu đề, mô tả, nội dung…',
    allCategories: 'Tất cả chuyên mục',
    sort: {
      recent: 'Mới nhất',
      oldest: 'Cũ nhất',
      popular: 'Xem nhiều nhất',
    },
    scope: {
      all: 'Tất cả tác giả',
      mine: 'Của tôi',
    },
    selected: (n) => `${n} đã chọn`,
    bulkApprove: 'Duyệt hàng loạt',
    clear: 'Bỏ chọn',
    table: {
      selectAll: 'Chọn tất cả',
      article: 'Bài viết',
      status: 'Trạng thái',
      category: 'Chuyên mục',
      created: 'Ngày tạo',
      views: 'Lượt xem',
      actions: 'Thao tác',
      noImage: 'không có ảnh',
      featured: 'Nổi bật',
      empty: 'Không có bài viết phù hợp với bộ lọc.',
    },
    pagination: {
      page: (page, total) => `Trang ${page} / ${total}`,
      prev: 'Trước',
      next: 'Sau',
    },
    actions: {
      viewPublic: 'Xem bản công khai',
      edit: 'Chỉnh sửa',
      submit: 'Gửi duyệt',
      approve: 'Duyệt',
      reject: 'Từ chối',
      delete: 'Xóa',
    },
    notify: {
      approved: 'Đã duyệt',
      approveFailed: 'Duyệt thất bại',
      sentToDraft: 'Đã chuyển về bản nháp',
      rejectFailed: 'Từ chối thất bại',
      deleteConfirm:
        'Xóa bài viết này? Hệ thống sẽ tạo yêu cầu xóa trừ khi bạn là super_admin.',
      deleteRequested: 'Đã tạo yêu cầu xóa',
      deleteFailed: 'Xóa thất bại',
      submitted: 'Đã gửi duyệt',
      submitFailed: 'Gửi duyệt thất bại',
      bulkApproveConfirm: (n) => `Duyệt ${n} bài viết?`,
      bulkApproved: (ok, total) => `Đã duyệt ${ok} / ${total}`,
    },
    categories: {
      news: 'Tin tức',
      announcement: 'Thông báo',
      scholarship: 'Học bổng',
      event: 'Sự kiện',
    },
  },
  activity: {
    title: 'Hoạt động trực tiếp',
    subtitle: 'Sự kiện quy trình, thu thập, AI',
    filter: 'Lọc',
    refresh: 'Làm mới',
    empty:
      'Chưa có hoạt động gần đây. Khi biên tập viên xuất bản, chạy thu thập hoặc hoàn tất dịch thuật, sự kiện sẽ hiển thị tại đây theo thời gian thực.',
    system: 'hệ thống',
  },
  commandPalette: {
    searchPlaceholder: 'Tìm thao tác, điều hướng, chạy lệnh…',
    noMatches: 'Không tìm thấy kết quả.',
    quickActions: 'Thao tác nhanh',
    navigate: 'Điều hướng',
    actions: {
      newArticle: 'Tạo bài viết mới',
      refresh: 'Làm mới dữ liệu bảng điều khiển',
      dashboard: 'Mở bảng điều khiển',
      review: 'Mở hàng đợi duyệt',
      ingestion: 'Mở thu thập',
      createArticle: 'Tạo bài viết',
      scheduler: 'Mở lịch xuất bản',
      translation: 'Trình soạn AI & Dịch thuật',
      sources: 'Mở nguồn tin',
      analytics: 'Mở phân tích',
      rules: 'Mở quy tắc quy trình',
      logs: 'Mở nhật ký hệ thống',
      settings: 'Mở cài đặt',
    },
  },
  statusPill: {
    draft: 'Bản nháp',
    pending: 'Chờ duyệt',
    published: 'Đã xuất bản',
    scheduled: 'Đã lên lịch',
    archived: 'Lưu trữ',
    failed: 'Thất bại',
  },
  placeholders: {
    rules: {
      title: 'Quy tắc quy trình',
      description:
        'Trình tạo quy tắc trực quan: tự động xuất bản nguồn tin uy tín, định tuyến theo chuyên mục, ngưỡng kiểm duyệt AI.',
      hint: 'Đang phát triển — API /api/newsroom/rules',
    },
    settings: {
      title: 'Cài đặt phòng tin tức',
      description:
        'Chuyên mục mặc định, múi giờ lịch xuất bản, ngưỡng AI, thông báo và tích hợp hệ thống.',
      hint: 'Sử dụng bảng system_settings',
    },
  },
};

export function resolveNewsroomPageMeta(pathname) {
  if (newsroomT.pages[pathname]) return newsroomT.pages[pathname];
  const matched = Object.entries(newsroomT.pages).find(
    ([key]) => key !== '/admin/newsroom' && pathname.startsWith(key),
  );
  return matched ? matched[1] : newsroomT.pages.default;
}
