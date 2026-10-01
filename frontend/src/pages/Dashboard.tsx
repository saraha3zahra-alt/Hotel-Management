import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, CardMedia, Grid, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import StarIcon from '@mui/icons-material/Star';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useHotel } from '../hotelContext';
import { HotelGuard, Stat, money, monthEndIso, monthStartIso } from '../components/ui';

function Content() {
  const { hotel, hotelId } = useHotel();
  const nav = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState('');
  const from = monthStartIso(), to = monthEndIso();

  useEffect(() => {
    if (!hotelId) return;
    Promise.all([api.rooms(), api.roomStatuses(), api.financeSummary(hotelId, from, to)])
      .then(([r, s, f]) => { setRooms(r); setStatuses(s); setSummary(f); setError(''); })
      .catch(e => setError(e.message));
  }, [hotelId]);

  const cur = hotel?.currencyCode ?? 'EGP';
  const hotelName = hotel?.hotelName === 'Class Hotel' || hotel?.hotelName.includes('كلاس') ? 'فندق ماجيستك الرئيسي' : (hotel?.hotelName ?? 'فندق ماجيستك الرئيسي');
  const byStatus = statuses.map(s => ({ name: s.statusName, count: rooms.filter(r => r.operationalStatusId === s.statusId).length }));

  return (
    <Stack spacing={3}>
      {/* 🌟 HERO BANNER WITH HOTEL IMAGE & BRANDING */}
      <Paper
        sx={{
          position: 'relative',
          borderRadius: 4,
          overflow: 'hidden',
          color: '#ffffff',
          backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.7) 100%), url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.25)',
          p: { xs: 3, md: 5 },
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Box sx={{ maxWidth: 800, position: 'relative', zIndex: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 0.5, color: '#fbbf24' }}>
              {[...Array(5)].map((_, i) => <StarIcon key={i} sx={{ fontSize: 20 }} />)}
            </Box>
            <Typography variant="subtitle2" sx={{ color: '#fbbf24', fontWeight: 700, letterSpacing: 1 }}>
              فنادق ومنتجعات ماجيستك (MAJESTIC HOTELS & RESORTS)
            </Typography>
          </Stack>

          <Typography variant="h3" fontWeight={800} sx={{ mb: 1.5, fontSize: { xs: '1.8rem', md: '2.5rem' }, lineHeight: 1.2 }}>
            نظام إدارة فنادق ماجيستك
          </Typography>

          <Typography variant="body1" sx={{ color: '#cbd5e1', fontSize: '1.05rem', mb: 3, lineHeight: 1.6 }}>
            مرحباً بك في لوحة تحكم {hotelName} — متابعة الحجوزات اليومية، نسبة إشغال الغرف، والتحصيل المالي والتشغيلي بمرونة وكفاءة عالية.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => nav('/reservations')}
              sx={{ backgroundColor: '#d97706', '&:hover': { backgroundColor: '#b45309' }, px: 3, py: 1.2, fontWeight: 700 }}
            >
              إجراء حجز جديد
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<MeetingRoomIcon />}
              onClick={() => nav('/rooms')}
              sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', '&:hover': { borderColor: '#ffffff', backgroundColor: 'rgba(255,255,255,0.1)' }, px: 3, py: 1.2 }}
            >
              إدارة الغرف والإشغال
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<PaymentsIcon />}
              onClick={() => nav('/payments')}
              sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', '&:hover': { borderColor: '#ffffff', backgroundColor: 'rgba(255,255,255,0.1)' }, px: 3, py: 1.2 }}
            >
              تسجيل المقبوضات والمالية
            </Button>
          </Stack>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* 🏨 HOTEL PHOTO CARDS (صور إيضاحية لأقسام الفندق) */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <CardMedia
              component="img"
              height="140"
              image="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"
              alt="الغرف والأجنحة الفاخرة"
            />
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>الأجنحة والغرف الفاخرة</Typography>
              <Typography variant="body2" color="text.secondary">
                إجمالي الغرف المجهزة: <b>{rooms.length} غرفة</b> مع متابعة حالة الصيانة والتنظيف أولاً بأول.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <CardMedia
              component="img"
              height="140"
              image="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"
              alt="المرافق وحمامات السباحة"
            />
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>المرافق والخدمات الفندقية</Typography>
              <Typography variant="body2" color="text.secondary">
                خدمات الاستقبال الفاخرة، حمامات السباحة، والشواطئ لضمان أفضل تجربة للنزلاء.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <CardMedia
              component="img"
              height="140"
              image="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"
              alt="المطاعم والمالية"
            />
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>التحصيل والمصروفات</Typography>
              <Typography variant="body2" color="text.secondary">
                متابعة التحصيل النقدي الإجمالي: <b>{money(summary?.cashIn, cur)}</b> خلال الشهر الحالي.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 📊 FINANCIAL STATS GRID */}
      <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', mt: 1 }}>
        الملخص المالي والتشغيلي للشهر الحالي ({from} ← {to})
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="إجمالي عدد الغرف" value={`${rooms.length} غرفة`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="النقدية المحصّلة" value={money(summary?.cashIn, cur)} color="success.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="المصروفات التشغيلية" value={money(summary?.operatingExpenses, cur)} color="error.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="صافي النقدية التشغيلية" value={money(summary?.netOperatingCash, cur)} color="primary.main" />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="إجمالي إيرادات الحجوزات" value={money(summary?.bookedRevenue, cur)} hint="الحجوزات المتداخلة هذا الشهر" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="خصومات الحجوزات" value={money(summary?.bookingDiscounts, cur)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="المبالغ المستردة" value={money(summary?.refunds, cur)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="صافي التحصيل النقدي" value={money(summary?.netCashCollected, cur)} />
        </Grid>
      </Grid>

      {/* 📋 TABLES GRID */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>الغرف حسب الحالة التشغيلية</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>الحالة التشغيلية</TableCell>
                  <TableCell align="right">عدد الغرف</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {byStatus.map(s => (
                  <TableRow key={s.name}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell align="right"><b>{s.count} غرفة</b></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>المصروفات حسب التصنيف</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>تصنيف المصروف</TableCell>
                  <TableCell align="right">المبلغ الإجمالي</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(summary?.expenseBreakdown ?? []).map((c: any) => (
                  <TableRow key={c.expenseCategoryId}>
                    <TableCell>{c.categoryName}</TableCell>
                    <TableCell align="right"><b>{money(c.amount, cur)}</b></TableCell>
                  </TableRow>
                ))}
                {!(summary?.expenseBreakdown ?? []).length && (
                  <TableRow><TableCell colSpan={2} sx={{ color: 'text.secondary' }}>لا توجد مصروفات مسجلة لهذا الشهر.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}

export default function Dashboard() { return <HotelGuard><Content /></HotelGuard>; }
