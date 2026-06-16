import React, { useState, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/shared/hooks/useServices';
import { FEATURED_SERVICE_NAMES, formatServicePriceRange } from '@/shared/utils/servicePrice';
import { canManageCatalog } from '@/shared/utils/catalogAccess';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import BookingModal from '@/components/spa/BookingModal';
import ServiceEditDialog from '@/components/admin/ServiceEditDialog';
import { toast } from 'sonner';

const GOLD_IMAGE = 'https://media.base44.com/images/public/69e98326eaa5ac077903e89c/fca79c947_pnht.png';

const featuredTreatments = [
  { name: 'AQUA + Exforliate', price: '950 ~ 1.200k', desc: 'Làm sạch sâu, cung cấp nước và khoáng chất cho da, phù hợp da khô và nhạy cảm.' },
  { name: 'NANO LIGHT + Exforliate', price: '1.600 ~ 1.800k', desc: 'Công nghệ nano kết hợp ánh sáng sinh học, tái tạo tế bào và làm sáng da toàn diện.' },
  { name: '24K GOLD + Exforliate', price: '2.200 ~ 2.400k', desc: 'Liệu trình cao cấp nhất với vàng 24K, chống lão hoá, căng bóng và nuôi dưỡng da sâu.' },
];

const allTreatments = [
  { name: 'AQUA + Exforliate', price: '950 ~ 1.200k' },
  { name: 'VITAMIN C + Exforliate', price: '950 ~ 1.200k' },
  { name: 'SKININOVATOR + Exforliate', price: '1.200 ~ 1.400k' },
  { name: 'HYDRATING + Exforliate', price: '1.200 ~ 1.400k' },
  { name: 'GREEN TEA + Exforliate', price: '1.400 ~ 1.600k' },
  { name: 'SHISO + Exforliate', price: '1.400 ~ 1.600k' },
  { name: 'ROSE + Exforliate', price: '1.400 ~ 1.600k' },
  { name: 'CO2 + Exforliate', price: '1.400 ~ 1.600k' },
  { name: 'NANO + Exforliate', price: '1.500 ~ 1.600k' },
  { name: 'NANO LIGHT + Exforliate', price: '1.600 ~ 1.800k' },
  { name: 'OXYGEN + Exforliate', price: '1.600 ~ 1.800k' },
  { name: '24K GOLD + Exforliate', price: '2.200 ~ 2.400k' },
];

function TreatmentTab({
  treatment,
  index,
  image,
  onHover,
  onLeave,
  isHovered,
  bookLabel,
  editLabel,
  detailLabel,
  categoryLabel,
  isStaffView,
  onDetail,
  onBook,
  onEdit,
}) {
  return (
    <div
      onMouseEnter={() => onHover(index)}
      onMouseLeave={onLeave}
      className="cursor-pointer border border-border/60 overflow-hidden transition-colors duration-300"
      style={{ borderColor: isHovered ? 'hsl(var(--primary) / 0.4)' : undefined, willChange: 'contents' }}
    >
      {/* Row */}
      <div
        className="flex items-center justify-between px-5 py-3.5 gap-4 transition-colors duration-200"
        style={{ background: isHovered ? 'hsl(var(--primary) / 0.06)' : undefined }}
      >
        <span className={`text-sm font-medium transition-colors duration-200 ${isHovered ? 'text-primary' : 'text-foreground'}`}>
          {treatment.name}
        </span>
        <span className={`text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${isHovered ? 'text-primary' : 'text-muted-foreground'}`}>
          {treatment.price}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateRows: isHovered ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div className="overflow-hidden">
          <div className="flex gap-4 px-5 pb-5 pt-2">
            <div className="relative w-28 flex-shrink-0 overflow-hidden" style={{ borderRadius: '10px' }}>
              <img
                src={image}
                alt={treatment.name}
                className="w-full aspect-[3/4] object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
            </div>
            <div className="flex flex-col justify-between py-1">
              <div>
                <p className="text-xs tracking-[0.2em] uppercase text-primary font-semibold mb-1.5">{categoryLabel}</p>
                <h4 className="font-heading italic font-light text-lg text-foreground leading-snug mb-2">
                  {treatment.name}
                </h4>
                <p className="text-base font-semibold text-primary">{treatment.price}</p>
              </div>
              <div className="flex gap-2 mt-3">
                {isStaffView ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onEdit(treatment)}
                      className="inline-block px-4 py-2 bg-foreground text-background text-xs tracking-widest uppercase hover:bg-primary transition-colors duration-300"
                      style={{ borderRadius: '6px' }}
                    >
                      {editLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDetail(treatment)}
                      className="inline-block px-4 py-2 border border-border text-foreground text-xs tracking-widest uppercase hover:border-primary hover:text-primary transition-colors duration-300"
                      style={{ borderRadius: '6px' }}
                    >
                      {detailLabel}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onBook(treatment)}
                      className="inline-block px-4 py-2 bg-foreground text-background text-xs tracking-widest uppercase hover:bg-primary transition-colors duration-300"
                      style={{ borderRadius: '6px' }}
                    >
                      {bookLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDetail(treatment)}
                      className="inline-block px-4 py-2 border border-border text-foreground text-xs tracking-widest uppercase hover:border-primary hover:text-primary transition-colors duration-300"
                      style={{ borderRadius: '6px' }}
                    >
                      {detailLabel}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServicePortals({ images }) {
  const [showAll, setShowAll] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [hoveredTab, setHoveredTab] = useState(null);
  const [bookingService, setBookingService] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const leaveTimer = useRef(null);
  const { t } = useLang();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isStaffView = canManageCatalog(user?.role);
  const { data: apiServices } = useServices();

  const treatmentsFromApi = useMemo(() => {
    if (!apiServices?.length) return null;
    return [...apiServices]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((s) => ({
        id: s.id,
        name: s.name,
        price: formatServicePriceRange(s.price, s.priceMax),
        desc: s.description || '',
      }));
  }, [apiServices]);

  const displayFeatured = useMemo(() => {
    if (!treatmentsFromApi?.length) return featuredTreatments;
    const picked = FEATURED_SERVICE_NAMES.map((name) =>
      treatmentsFromApi.find((item) => item.name === name),
    ).filter(Boolean);
    return picked.length === FEATURED_SERVICE_NAMES.length ? picked : treatmentsFromApi.slice(0, 3);
  }, [treatmentsFromApi]);

  const displayAll = treatmentsFromApi ?? allTreatments;

  const goToDetail = (treatment) => {
    const params = new URLSearchParams({
      name: treatment.name,
      price: treatment.price || '',
    });
    if (treatment.id) params.set('id', treatment.id);
    navigate(`/service?${params.toString()}`);
  };

  const openEdit = async (treatment) => {
    const match = apiServices?.find(
      (s) => s.id === treatment.id || s.name === treatment.name,
    );
    if (!match?.id) {
      toast.error('Không tìm thấy dịch vụ để chỉnh sửa');
      return;
    }
    setEditingService(match);
    setEditOpen(true);
    try {
      const full = await base44.entities.Service.get(match.id);
      setEditingService(full);
    } catch {
      // keep list item if detail fetch fails
    }
  };

  const handleEditOpenChange = (open) => {
    setEditOpen(open);
    if (!open) setEditingService(null);
  };

  const openBooking = (treatment) => {
    setBookingService(treatment);
  };

  const handleTabHover = (idx) => {
    clearTimeout(leaveTimer.current);
    setHoveredTab(idx);
  };

  const handleTabLeave = () => {
    leaveTimer.current = setTimeout(() => setHoveredTab(null), 150);
  };

  const getImage = (idx) => {
    const name = displayAll[idx]?.name || '';
    if (name.includes('24K GOLD')) return GOLD_IMAGE;
    return images[idx % images.length];
  };

  const getFeaturedImage = (idx) => {
    const name = displayFeatured[idx]?.name || '';
    if (name.includes('24K GOLD')) return GOLD_IMAGE;
    return images[idx % images.length];
  };

  return (
    <>
    {!isStaffView ? (
      <BookingModal
        open={!!bookingService}
        onClose={() => setBookingService(null)}
        serviceName={bookingService?.name || ''}
        servicePrice={bookingService?.price || ''}
      />
    ) : (
      <ServiceEditDialog
        key={editingService?.id ?? 'idle'}
        open={editOpen}
        onOpenChange={handleEditOpenChange}
        service={editingService}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['services'] })}
      />
    )}
    <section id="services" className="pt-24 md:pt-32 pb-12 md:pb-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground font-medium mb-4">
            {t.services.badge}
          </p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="font-heading italic font-light text-4xl md:text-6xl lg:text-7xl tracking-tight text-foreground">
              Facial
              <br />
              <span className="text-primary">Alchemy</span>
            </h2>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-primary" />
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                {t.services.tagline}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 3 Featured Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {displayFeatured.map((treatment, idx) => (
            <motion.div
              key={treatment.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              onMouseEnter={() => setActiveCard(idx)}
              onMouseLeave={() => setActiveCard(null)}
              className="group relative overflow-hidden cursor-pointer"
            >
              {/* Image */}
              <div className="relative overflow-hidden aspect-[3/4]">
                <motion.img
                  src={getFeaturedImage(idx)}
                  alt={treatment.name}
                  className="w-full h-full object-cover"
                  animate={{ scale: activeCard === idx ? 1.05 : 1 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent" />

                {/* Content overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <p className="text-xs tracking-[0.2em] uppercase text-primary font-semibold mb-2">
                    {t.services.category}
                  </p>
                  <h3 className="font-heading italic font-light text-2xl text-background leading-tight mb-2">
                    {treatment.name}
                  </h3>

                  {/* Description - shows on hover */}
                  <motion.p
                    initial={false}
                    animate={{
                      opacity: activeCard === idx ? 1 : 0,
                      y: activeCard === idx ? 0 : 10,
                    }}
                    transition={{ duration: 0.4 }}
                    className="text-sm text-background/70 leading-relaxed mb-4"
                  >
                    {treatment.desc}
                  </motion.p>

                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-primary">{treatment.price}</span>
                    <motion.div
                      animate={{ opacity: activeCard === idx ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex gap-2"
                    >
                      {isStaffView ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(treatment)}
                            className="px-4 py-2 bg-background/20 border border-background/40 text-xs tracking-widest uppercase text-background hover:bg-background hover:text-foreground transition-colors duration-300"
                          >
                            {t.services.edit}
                          </button>
                          <button
                            type="button"
                            onClick={() => goToDetail(treatment)}
                            className="px-4 py-2 border border-background/40 text-xs tracking-widest uppercase text-background hover:bg-background hover:text-foreground transition-colors duration-300"
                          >
                            {t.services.detail}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => openBooking(treatment)}
                            className="px-4 py-2 bg-background/20 border border-background/40 text-xs tracking-widest uppercase text-background hover:bg-background hover:text-foreground transition-colors duration-300"
                          >
                            {t.services.book}
                          </button>
                          <button
                            type="button"
                            onClick={() => goToDetail(treatment)}
                            className="px-4 py-2 border border-background/40 text-xs tracking-widest uppercase text-background hover:bg-background hover:text-foreground transition-colors duration-300"
                          >
                            {t.services.detail}
                          </button>
                        </>
                      )}
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* All Treatments Toggle */}
        <div>
          <button
            onClick={() => setShowAll(!showAll)}
            className="group flex items-center gap-3 mb-6 text-sm tracking-[0.2em] uppercase font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            <span>{showAll ? t.services.collapse : t.services.viewAll}</span>
            <motion.span
              animate={{ rotate: showAll ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown size={16} />
            </motion.span>
            <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary border border-primary/20">
              {displayAll.length}
            </span>
          </button>

          <AnimatePresence>
            {showAll && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {displayAll.map((treatment, idx) => (
                    <TreatmentTab
                      key={treatment.name}
                      treatment={treatment}
                      index={idx}
                      image={getImage(idx)}
                      onHover={handleTabHover}
                      onLeave={handleTabLeave}
                      isHovered={hoveredTab === idx}
                      isStaffView={isStaffView}
                      bookLabel={t.services.book}
                      editLabel={t.services.edit}
                      detailLabel={t.services.detail}
                      categoryLabel={t.services.category}
                      onDetail={goToDetail}
                      onBook={openBooking}
                      onEdit={openEdit}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Service Name Marquee - bottom */}
        <div className="overflow-hidden border-y border-border/40 py-3 mt-10">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...displayAll, ...displayAll].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-4 mx-6">
                <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">{item.name}</span>
                <span className="w-1 h-1 rounded-full bg-primary/50 flex-shrink-0" />
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
    </>
  );
}