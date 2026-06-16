import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Clock, Star, Calendar, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useServices } from '@/shared/hooks/useServices';
import { canManageCatalog, getCatalogAdminPath } from '@/shared/utils/catalogAccess';
import { resolveMediaUrl } from '@/lib/mediaUpload';
import BookingModal from '@/components/spa/BookingModal';

const GOLD_IMAGE = 'https://media.base44.com/images/public/69e98326eaa5ac077903e89c/fca79c947_pnht.png';

const serviceDetails = {
  'AQUA + Exforliate': {
    price: '950 ~ 1.200k',
    duration: 90,
    description: 'Liệu trình làm sạch sâu bằng công nghệ nước áp lực, loại bỏ tế bào chết và cung cấp độ ẩm chuyên sâu cho da.',
    benefits: ['Làm sạch lỗ chân lông sâu', 'Cung cấp nước và khoáng chất', 'Phù hợp da khô và nhạy cảm', 'Không xâm lấn, không đau'],
    steps: ['Làm sạch da', 'Tẩy tế bào chết nhẹ nhàng', 'Aqua hydration', 'Mặt nạ dưỡng ẩm', 'Kem dưỡng hoàn thiện'],
    rating: 4.9,
    reviews: 128,
  },
  'VITAMIN C + Exforliate': {
    price: '950 ~ 1.200k',
    duration: 90,
    description: 'Liệu trình giàu Vitamin C giúp sáng da, mờ thâm nám và chống oxy hoá hiệu quả.',
    benefits: ['Làm sáng da tức thì', 'Mờ thâm, đốm nâu', 'Chống oxy hoá mạnh', 'Kết cấu da đều màu hơn'],
    steps: ['Làm sạch da', 'Tẩy tế bào chết', 'Serum Vitamin C đậm đặc', 'Mặt nạ brightening', 'Kem dưỡng hoàn thiện'],
    rating: 4.8,
    reviews: 96,
  },
  'NANO LIGHT + Exforliate': {
    price: '1.600 ~ 1.800k',
    duration: 120,
    description: 'Công nghệ nano kết hợp ánh sáng sinh học LED, tái tạo tế bào da và làm sáng toàn diện.',
    benefits: ['Tái tạo tế bào da', 'Kích thích collagen', 'Làm sáng da toàn diện', 'Giảm nếp nhăn nhỏ'],
    steps: ['Làm sạch da', 'Tẩy tế bào chết', 'Nano infusion', 'LED light therapy 20 phút', 'Serum tái tạo', 'Kem dưỡng hoàn thiện'],
    rating: 4.9,
    reviews: 214,
  },
  '24K GOLD + Exforliate': {
    price: '2.200 ~ 2.400k',
    duration: 120,
    description: 'Liệu trình cao cấp nhất với hạt vàng nano 24K, chống lão hoá mạnh mẽ, căng bóng và nuôi dưỡng da sâu.',
    benefits: ['Chống lão hoá vượt trội', 'Làn da căng bóng tức thì', 'Nuôi dưỡng sâu với vàng 24K', 'Tái tạo collagen & elastin'],
    steps: ['Làm sạch da', 'Tẩy tế bào chết nhẹ nhàng', 'Nano gold infusion', 'Mặt nạ vàng 24K', 'LED chống lão hoá', 'Serum & kem cao cấp'],
    rating: 5.0,
    reviews: 189,
  },
};

// Default for services not in the map
const defaultDetail = {
  price: '',
  duration: 90,
  description: 'Liệu trình chuyên sâu được thực hiện bởi đội ngũ chuyên gia da liễu hàng đầu của Thera Derma.',
  benefits: ['Làm sạch da chuyên sâu', 'Cải thiện kết cấu da', 'Dưỡng ẩm tối ưu', 'Kết quả lâu dài'],
  steps: ['Làm sạch da', 'Tẩy tế bào chết', 'Liệu trình chuyên sâu', 'Mặt nạ dưỡng', 'Hoàn thiện'],
  rating: 4.8,
  reviews: 75,
};

const allImages = [
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
];

export default function ServiceDetail() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { user } = useAuth();
  const { data: apiServices } = useServices();
  const [bookingOpen, setBookingOpen] = useState(false);
  const isStaffView = canManageCatalog(user?.role);

  const urlParams = new URLSearchParams(window.location.search);
  const serviceName = urlParams.get('name') || '';
  const servicePrice = urlParams.get('price') || '';
  const serviceIdParam = urlParams.get('id') || '';

  const matchedService = apiServices?.find(
    (s) => s.id === serviceIdParam || s.name === serviceName,
  );

  const detail = serviceDetails[serviceName] || { ...defaultDetail, price: servicePrice };
  const isGold = serviceName.includes('24K GOLD');
  const image = matchedService?.imageUrl
    ? resolveMediaUrl(matchedService.imageUrl)
    : isGold
      ? GOLD_IMAGE
      : allImages[Math.abs(serviceName.length) % allImages.length];

  const goToEdit = () => {
    const base = getCatalogAdminPath(user?.role);
    if (matchedService?.id) {
      navigate(`${base}?edit=${matchedService.id}`);
      return;
    }
    navigate(`${base}?q=${encodeURIComponent(serviceName)}`);
  };

  return (
    <>
    {!isStaffView ? (
      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        serviceName={serviceName}
        servicePrice={detail.price}
      />
    ) : null}
    <div className="min-h-screen bg-background">
      {/* Back button */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/40 px-6 md:px-12 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="font-heading italic">Thera Derma</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* LEFT - Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:sticky lg:top-32"
          >
            <div className="relative overflow-hidden rounded-[2rem] rounded-tl-none aspect-[4/5]">
              <img
                src={image}
                alt={serviceName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />
              {/* Rating badge */}
              <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-full flex items-center gap-1.5">
                <Star size={12} className="fill-primary text-primary" />
                <span className="text-xs font-semibold">{detail.rating}</span>
                <span className="text-xs text-muted-foreground">({detail.reviews})</span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT - Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="space-y-8"
          >
            {/* Header */}
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-primary font-semibold mb-2">
                {t.services.category} · Thera Derma
              </p>
              <h1 className="font-heading italic font-light text-4xl md:text-5xl text-foreground leading-tight mb-4">
                {serviceName}
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-semibold text-primary">{detail.price}</span>
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <Clock size={14} />
                  <span>{detail.duration} phút</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-base font-body leading-relaxed text-foreground/70">
              {matchedService?.description
                ? stripHtml(matchedService.description) || detail.description
                : detail.description}
            </p>

            {/* Benefits */}
            <div>
              <h3 className="font-heading italic font-light text-xl text-foreground mb-4">
                Lợi ích nổi bật
              </h3>
              <ul className="space-y-2.5">
                {detail.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Check size={10} className="text-primary" />
                    </span>
                    <span className="text-sm text-foreground/70">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Steps */}
            <div>
              <h3 className="font-heading italic font-light text-xl text-foreground mb-4">
                Quy trình thực hiện
              </h3>
              <div className="flex flex-wrap gap-2">
                {detail.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-muted/60 border border-border/50 text-xs text-foreground/70 rounded-full">
                      <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-semibold">
                        {i + 1}
                      </span>
                      {step}
                    </span>
                    {i < detail.steps.length - 1 && (
                      <span className="text-border text-xs">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/40" />

            {/* Reservation / Admin actions */}
            {isStaffView ? (
              <div>
                <h3 className="font-heading italic font-light text-2xl text-foreground mb-2">
                  Quản lý dịch vụ
                </h3>
                <p className="text-sm text-foreground/50 mb-6">
                  Bạn đang xem ở chế độ quản trị. Chỉnh sửa giá, ảnh, video và mô tả chi tiết.
                </p>
                <Button
                  onClick={goToEdit}
                  className="w-full h-12 bg-foreground text-background hover:bg-primary font-medium tracking-widest uppercase text-sm transition-all duration-500"
                >
                  <Pencil size={16} className="mr-2" />
                  {t.services.edit}
                </Button>
              </div>
            ) : (
              <div>
                <h3 className="font-heading italic font-light text-2xl text-foreground mb-2">
                  Đặt lịch hẹn
                </h3>
                <p className="text-sm text-foreground/50 mb-6">
                  Liên hệ với chúng tôi để đặt lịch trải nghiệm dịch vụ này tại Thera Derma.
                </p>
                <Button
                  onClick={() => setBookingOpen(true)}
                  className="w-full h-12 bg-foreground text-background hover:bg-primary font-medium tracking-widest uppercase text-sm transition-all duration-500"
                >
                  <Calendar size={16} className="mr-2" />
                  Đặt lịch ngay
                </Button>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
    </>
  );
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}