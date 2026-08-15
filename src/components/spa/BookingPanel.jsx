import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ArrowRight, Check, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '@/lib/LanguageContext';
import { base44 } from '@/api/entities';
import { useServices } from '@/shared/hooks/useServices';
import { uploadAppointmentPhoto } from '@/lib/mediaUpload';

const timeSlots = [
  '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM',
  '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
];

// '1:00 PM' -> '13:00' (backend expects HH:mm)
function to24h(slot) {
  const [time, meridiem] = slot.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (meridiem === 'PM' && h !== 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function BookingPanel({ bgImage }) {
  const { t } = useLang();
  const { data: services, isLoading: servicesLoading } = useServices(200);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', serviceId: '',
    date: null, time: '', skinCondition: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const bookableServices = useMemo(() => {
    if (!services?.length) return [];
    return [...services]
      .filter((s) => s.isActive !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [services]);

  const selectedService = bookableServices.find((s) => s.id === form.serviceId);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.serviceId || !form.date || !form.time) {
      toast.error(t.booking.errorRequired);
      return;
    }
    const serviceName = selectedService?.name;
    if (!serviceName) {
      toast.error(t.booking.errorRequired);
      return;
    }
    setSubmitting(true);
    try {
      let photoUrl = '';
      if (photoFile) {
        setPhotoUploading(true);
        photoUrl = await uploadAppointmentPhoto(photoFile);
        setPhotoUploading(false);
      }
      await base44.entities.Appointment.create({
        customerName: form.name,
        ...(form.email ? { customerEmail: form.email } : {}),
        customerPhoneNumber: form.phone,
        serviceNames: [serviceName],
        date: format(form.date, 'yyyy-MM-dd'),
        time: to24h(form.time),
        ...(form.skinCondition ? { skinCondition: form.skinCondition } : {}),
        ...(photoUrl ? { photoUrl } : {}),
      });
      setSubmitted(true);
      toast.success(t.booking.successMsg);
    } catch (error) {
      toast.error(error.message || t.booking.errorRequired);
    } finally {
      setPhotoUploading(false);
      setSubmitting(false);
    }
  };

  return (
    <section id="booking" className="relative py-24 md:py-32 px-6 md:px-12 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={bgImage} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground font-medium mb-4">
            {t.booking.badge}
          </p>
          <h2 className="font-heading italic font-light text-4xl md:text-6xl lg:text-7xl tracking-tight text-foreground">
            {t.booking.title}
            <br />
            <span className="text-primary">{t.booking.title2}</span>
          </h2>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Check size={32} className="text-primary" />
            </div>
            <h3 className="font-heading italic font-light text-3xl text-foreground mb-4">
              {t.booking.thankYou} {form.name}
            </h3>
            <p className="text-base text-foreground/60 max-w-md mx-auto">
              {t.booking.confirmMsg.replace('{treatment}', selectedService?.name || '').replace('{date}', format(form.date, 'dd/MM/yyyy')).replace('{time}', form.time)}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-card/80 backdrop-blur-xl border border-border/50 p-8 md:p-12"
          >
            {/* Steps indicator */}
            <div className="flex items-center gap-4 mb-10">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <button
                    onClick={() => setStep(s)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      step >= s
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {s}
                  </button>
                  {s < 2 && (
                    <div className={`flex-1 h-px transition-all duration-300 ${
                      step > s ? 'bg-foreground' : 'bg-border'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {step === 1 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium mb-2 block">
                      {t.booking.name} *
                    </label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={t.booking.namePlaceholder}
                      className="h-12 bg-background border-border/60 font-body"
                    />
                  </div>
                  <div>
                    <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium mb-2 block">
                       {t.booking.email}
                    </label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="your@email.com"
                      className="h-12 bg-background border-border/60 font-body"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium mb-2 block">
                    {t.booking.phone} *
                  </label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder={t.booking.phonePlaceholder}
                    className="h-12 bg-background border-border/60 font-body"
                  />
                </div>
                <div>
                  <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium mb-2 block">
                    {t.booking.treatment} *
                  </label>
                  <Select
                    value={form.serviceId}
                    onValueChange={(v) => setForm({ ...form, serviceId: v })}
                    disabled={servicesLoading || bookableServices.length === 0}
                  >
                    <SelectTrigger className="h-12 bg-background border-border/60 font-body">
                      <SelectValue placeholder={t.booking.treatmentPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {bookableServices.map((svc) => (
                        <SelectItem key={svc.id} value={svc.id}>{svc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => {
                    if (!form.name || !form.phone || !form.serviceId) {
                      toast.error(t.booking.errorRequired);
                      return;
                    }
                    setStep(2);
                  }}
                  className="w-full h-12 bg-foreground text-background hover:bg-primary font-medium tracking-widest uppercase text-sm transition-all duration-500"
                >
                  {t.booking.continue}
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium mb-3 block">
                    {t.booking.date} *
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-12 justify-start text-left font-body bg-background border-border/60"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {form.date ? format(form.date, 'dd/MM/yyyy') : t.booking.chooseDatePlaceholder}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.date}
                        onSelect={(d) => setForm({ ...form, date: d })}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium mb-3 block">
                    {t.booking.time} *
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setForm({ ...form, time: slot })}
                        className={`py-3 px-2 text-sm font-medium border transition-all duration-300 ${
                          form.time === slot
                            ? 'bg-foreground text-background border-foreground'
                            : 'bg-background border-border/60 text-foreground/70 hover:border-foreground/30'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium mb-3 block">
                    {t.booking.skinCondition}
                  </label>
                  <Textarea
                    value={form.skinCondition}
                    onChange={(e) => setForm({ ...form, skinCondition: e.target.value })}
                    placeholder={t.booking.skinConditionPlaceholder}
                    className="min-h-24 bg-background border-border/60 font-body"
                  />
                </div>

                <div>
                  <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium mb-3 block">
                    {t.booking.photo}
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  {photoPreview ? (
                    <div className="relative w-32 h-32">
                      <img src={photoPreview} alt="" className="w-full h-full object-cover rounded-md border border-border/60" />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center"
                        aria-label={t.booking.photoRemove}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 h-12 px-4 border border-dashed border-border/60 text-sm text-muted-foreground hover:border-foreground/30 transition-colors duration-300"
                    >
                      <ImagePlus size={16} />
                      {t.booking.photoHint}
                    </button>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 h-12 border-border/60 font-medium tracking-widest uppercase text-sm"
                  >
                    {t.booking.back}
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 h-12 bg-foreground text-background hover:bg-primary font-medium tracking-widest uppercase text-sm transition-all duration-500 disabled:opacity-60"
                  >
                    {submitting ? (photoUploading ? t.booking.photoUploading : '...') : t.booking.submit}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}