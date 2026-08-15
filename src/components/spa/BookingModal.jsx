import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Check, ArrowRight, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { uploadAppointmentPhoto } from '@/lib/mediaUpload';

const timeSlots = [
  '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00',
];

export default function BookingModal({ open, onClose, serviceName, servicePrice }) {
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', date: null, time: '', skinCondition: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Pre-fill from user account if logged in
  useEffect(() => {
    if (open) {
      setSubmitted(false);
      setForm({
        name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        date: null,
        time: '',
        skinCondition: '',
      });
      setPhotoFile(null);
      setPhotoPreview('');
    }
  }, [open, user]);

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
    if (!form.name || !form.phone || !form.date || !form.time) {
      toast.error('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }
    setLoading(true);
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
        time: form.time,
        ...(form.skinCondition ? { skinCondition: form.skinCondition } : {}),
        ...(photoUrl ? { photoUrl } : {}),
      });
      setSubmitted(true);
      toast.success('Đặt lịch thành công!');
    } catch (error) {
      toast.error(error.message || 'Đặt lịch thất bại, vui lòng thử lại');
    } finally {
      setPhotoUploading(false);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-foreground px-6 py-5">
          <p className="text-xs tracking-[0.2em] uppercase text-background/40 font-semibold mb-1">
            Đặt lịch hẹn
          </p>
          <h2 className="font-heading italic font-light text-2xl text-background leading-tight">
            {serviceName}
          </h2>
          {servicePrice && (
            <p className="text-sm text-primary mt-1">{servicePrice}</p>
          )}
        </div>

        <div className="px-6 py-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Check size={28} className="text-primary" />
              </div>
              <h3 className="font-heading italic font-light text-2xl text-foreground mb-2">
                Cảm ơn, {form.name}!
              </h3>
              <p className="text-sm text-foreground/60">
                Lịch hẹn <strong>{serviceName}</strong> ngày <strong>{format(form.date, 'dd/MM/yyyy')}</strong> lúc <strong>{form.time}</strong> đã được ghi nhận. Chúng tôi sẽ liên hệ xác nhận sớm nhất.
              </p>
              <Button
                onClick={onClose}
                className="mt-6 w-full bg-foreground text-background hover:bg-primary tracking-widest uppercase text-xs"
              >
                Đóng
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium mb-1.5 block">
                  Họ và tên *
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Tên của bạn"
                  className="h-11 bg-background border-border/60"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium mb-1.5 block">
                  Email
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  className="h-11 bg-background border-border/60"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium mb-1.5 block">
                  Số điện thoại *
                </label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0xxx xxx xxx"
                  className="h-11 bg-background border-border/60"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium mb-1.5 block">
                  Ngày hẹn *
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-11 justify-start text-left bg-background border-border/60"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {form.date ? format(form.date, 'dd/MM/yyyy') : 'Chọn ngày'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.date}
                      onSelect={(d) => setForm({ ...form, date: d })}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time */}
              <div>
                <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium mb-1.5 block">
                  Giờ hẹn *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setForm({ ...form, time: slot })}
                      className={`py-2.5 text-sm font-medium border transition-all duration-200 rounded-sm ${
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

              {/* Skin condition */}
              <div>
                <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium mb-1.5 block">
                  Mô tả tình trạng da
                </label>
                <Textarea
                  value={form.skinCondition}
                  onChange={(e) => setForm({ ...form, skinCondition: e.target.value })}
                  placeholder="Mô tả tình trạng da của bạn (không bắt buộc)"
                  className="min-h-20 bg-background border-border/60"
                />
              </div>

              {/* Photo upload */}
              <div>
                <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium mb-1.5 block">
                  Ảnh tình trạng da
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                {photoPreview ? (
                  <div className="relative w-24 h-24">
                    <img src={photoPreview} alt="" className="w-full h-full object-cover rounded-md border border-border/60" />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center"
                      aria-label="Xóa ảnh"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 h-11 px-4 border border-dashed border-border/60 text-sm text-muted-foreground hover:border-foreground/30 transition-colors duration-200"
                  >
                    <ImagePlus size={16} />
                    Không bắt buộc — JPG, PNG, tối đa 10MB
                  </button>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-11 bg-foreground text-background hover:bg-primary font-medium tracking-widest uppercase text-xs transition-all duration-500 mt-2"
              >
                {loading ? (photoUploading ? 'Đang tải ảnh...' : 'Đang xử lý...') : 'Xác nhận đặt lịch'}
                {!loading && <ArrowRight size={14} className="ml-2" />}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}