import { Alert, Button, Paper, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageTitle } from '../components/ui';

export default function Customers() {
  const nav = useNavigate();
  return (
    <>
      <PageTitle title="سجل العملاء والنزلاء" subtitle="يتم إنشاء وحفظ سجلات العملاء تلقائياً عند إجراء حجز جديد بالفندق" />
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          يتم ربط وحفظ بيانات العميل تلقائياً في قاعدة البيانات فور تسجيل أي حجز جديد من صفحة الحجوزات.
        </Alert>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          يمكنك الانتقال لصفحة الحجوزات لإجراء حجز جديد وتسجيل عميل، أو الاستعلام عن الحجوزات المالية الحالية.
        </Typography>
        <Button variant="contained" onClick={() => nav('/reservations')}>الانتقال إلى إدارة الحجوزات</Button>
      </Paper>
    </>
  );
}
