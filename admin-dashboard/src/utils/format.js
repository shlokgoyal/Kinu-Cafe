export const formatCurrency = (n) => {
  const v = Number(n || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(v);
};

export const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export const formatDateShort = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { dateStyle: 'medium' });
};

const BADGE_STYLES = {
  placed:      'bg-blue-100 text-blue-700',
  preparing:   'bg-amber-100 text-amber-700',
  ready:       'bg-teal-100 text-teal-700',
  served:      'bg-emerald-100 text-emerald-700',
  cancelled:   'bg-slate-200 text-slate-600',
  unbilled:    'bg-slate-100 text-slate-600',
  billed:      'bg-indigo-100 text-indigo-700',
  paid:        'bg-green-100 text-green-700',
  available:   'bg-emerald-100 text-emerald-700',
  occupied:    'bg-amber-100 text-amber-700',
  reserved:    'bg-blue-100 text-blue-700',
  pending:     'bg-yellow-100 text-yellow-800',
  confirmed:   'bg-green-100 text-green-700',
  completed:   'bg-slate-200 text-slate-600',
  active:      'bg-green-100 text-green-700',
  inactive:    'bg-slate-200 text-slate-600',
};

export const statusBadge = (status) =>
  'badge ' + (BADGE_STYLES[status] || 'bg-slate-100 text-slate-600');

export const toDateInput = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export const toDateTimeInput = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
