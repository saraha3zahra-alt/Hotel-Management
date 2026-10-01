import { Alert, Box, Card, CardContent, Chip, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { useHotel } from '../hotelContext';

export const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const todayIso = () => iso(new Date());
export const monthStartIso = () => { const d = new Date(); return iso(new Date(d.getFullYear(), d.getMonth(), 1)); };
export const monthEndIso = () => { const d = new Date(); return iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)); };
export const addDaysIso = (s: string, n: number) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return iso(d); };
export const nightsBetween = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
export const ageOn = (dob: string, on: string) => { const b = new Date(dob), d = new Date(on); let a = d.getFullYear() - b.getFullYear(); if (d < new Date(d.getFullYear(), b.getMonth(), b.getDate())) a--; return a; };

export const money = (n: any, cur = 'EGP') => {
  const symbol = cur === 'EGP' ? 'ج.م' : cur;
  const formatted = Number(n ?? 0).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${formatted} ${symbol}`;
};

export const fmtDate = (s?: string) => (s ? String(s).slice(0, 10) : '');
export const fmtDateTime = (s?: string) => (s ? new Date(s).toLocaleString('ar-EG') : '');

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3, flexWrap: 'wrap' }}>
      <Box>
        <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a' }}>{title}</Typography>
        {subtitle && <Typography color="text.secondary" variant="body1" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
      </Box>
      {action}
    </Box>
  );
}

export function Stat({ label, value, color, hint }: { label: string; value: ReactNode; color?: string; hint?: string }) {
  return (
    <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <CardContent>
        <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{label}</Typography>
        <Typography variant="h4" fontWeight={800} sx={{ color: color || '#0f172a' }}>{value}</Typography>
        {hint && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{hint}</Typography>}
      </CardContent>
    </Card>
  );
}

const statusLabels: Record<string, string> = {
  POSTED: 'تم التثبيت', SUCCESSFUL: 'مكتمل بنجاح', PAID: 'تم الدفع', APPROVED: 'معتمد', PROCESSED: 'تمت المعالجة', CONFIRMED: 'مؤكد', ACTIVE: 'نشط',
  DRAFT: 'مسودة', PENDING: 'قيد الانتظار', PENDING_APPROVAL: 'في انتظار الاعتماد', PARTIALLY_PAID: 'مدفوع جزئياً', UNPAID: 'غير مدفوع',
  VOID: 'ملغى (باطل)', FAILED: 'فشلت العملية', REJECTED: 'مرفوض', CANCELLED: 'ملغى', REVERSED: 'مسترجع',
  CHECKED_IN: 'تم الوصول', CHECKED_OUT: 'تمت المغادرة', NO_SHOW: 'عدم حضور',
};

const colors: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  POSTED: 'success', SUCCESSFUL: 'success', PAID: 'success', APPROVED: 'info', PROCESSED: 'success', CONFIRMED: 'success', ACTIVE: 'success',
  DRAFT: 'default', PENDING: 'warning', PENDING_APPROVAL: 'warning', PARTIALLY_PAID: 'warning', UNPAID: 'error',
  VOID: 'error', FAILED: 'error', REJECTED: 'error', CANCELLED: 'error', REVERSED: 'error',
};

export const StatusChip = ({ status }: { status: string }) => (
  <Chip size="small" label={statusLabels[status] ?? status} color={colors[status] ?? 'default'} variant="outlined" sx={{ fontWeight: 700 }} />
);

/** Shown by pages that need a selected hotel. */
export function HotelGuard({ children }: { children: ReactNode }) {
  const { hotelId, loading, error } = useHotel();
  if (loading) return <Typography color="text.secondary">جاري تحميل البيانات...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!hotelId) return <Alert severity="info">لم يتم العثور على فندق. يرجى إنشاء فندق كلاس أولاً في صفحة "إعدادات الفندق والمباني".</Alert>;
  return <>{children}</>;
}
