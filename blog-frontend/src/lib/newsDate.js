import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

export function formatNewsDate(value, lang = 'vi') {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, 'dd/MM/yyyy', { locale: lang === 'en' ? enUS : vi });
}
