import React from 'react';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: { label: 'Chờ xác nhận', class: 'bg-orange-100 text-orange-700' },
  confirmed: { label: 'Đã xác nhận', class: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Hoàn thành', class: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã hủy', class: 'bg-red-100 text-red-700' },
  active: { label: 'Đang thực hiện', class: 'bg-green-100 text-green-700' },
  account_active: { label: 'Hoạt động', class: 'bg-green-100 text-green-700' },
  inactive: { label: 'Ngưng HĐ', class: 'bg-gray-100 text-gray-600' },
  suspended: { label: 'Tạm khóa', class: 'bg-red-100 text-red-700' },
  paused: { label: 'Tạm dừng', class: 'bg-orange-100 text-orange-700' },
  admin: { label: 'Admin', class: 'bg-purple-100 text-purple-700' },
  staff: { label: 'Nhân viên', class: 'bg-blue-100 text-blue-700' },
  customer: { label: 'Khách hàng', class: 'bg-green-100 text-green-700' },
  noshow: { label: 'Không đến', class: 'bg-gray-100 text-gray-700' },
  manager: { label: 'Nhân viên', class: 'bg-blue-100 text-blue-700' },
  user: { label: 'Khách hàng', class: 'bg-green-100 text-green-700' },
  service: { label: 'Dịch vụ', class: 'bg-primary/10 text-primary' },
  product: { label: 'Sản phẩm', class: 'bg-secondary text-foreground' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, class: 'bg-muted text-muted-foreground' };
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', config.class)}>
      {config.label}
    </span>
  );
}