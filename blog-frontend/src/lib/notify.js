import { toast } from 'sonner';

export const notify = {
  success: ({ title, description }) => toast.success(title, { description }),
  error: ({ title, description }) => toast.error(title, { description }),
  info: ({ title, description }) => toast.info(title, { description }),
};
