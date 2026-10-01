import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Paper, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { api } from '../api';
import { useHotel } from '../hotelContext';
import { HotelGuard, PageTitle, fmtDate, money, todayIso, addDaysIso } from '../components/ui';

function Content() {
  const { hotel, hotelId } = useHotel();
  const cur = hotel?.currencyCode ?? 'EGP';

  const [periods, setPeriods] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [ages, setAges] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [dlg, setDlg] = useState<'period' | 'price' | 'age' | 'promotion' | null>(null);

  const [periodForm, setPeriodForm] = useState({
    periodCode: '', periodName: '', startDate: todayIso(), endDate: addDaysIso(todayIso(), 30), priority: 1, isActive: true,
  });

  const [priceForm, setPriceForm] = useState({
    pricingPeriodId: '', roomId: '', ageCategoryId: '', pricePerPersonPerNight: '', currencyCode: cur,
  });

  const [ageForm, setAgeForm] = useState({
    categoryCode: '', categoryName: '', minAge: 0, maxAge: 12, sortOrder: 1,
  });

  const [promoForm, setPromoForm] = useState({
    promotionCode: '', promotionName: '', discountType: 'PERCENTAGE', discountValue: 10, startDate: todayIso(), endDate: addDaysIso(todayIso(), 30), isActive: true,
  });

  const loadAll = () => {
    if (!hotelId) return;
    Promise.all([
      api.pricingPeriods(hotelId),
      api.roomPrices(),
      api.ageCategories(hotelId),
      api.rooms(),
      api.promotions(hotelId),
    ])
      .then(([p, r, a, rm, promo]) => {
        setPeriods(p); setPrices(r); setAges(a); setRooms(rm); setPromotions(promo); setError('');
      })
      .catch(e => setError(e.message));
  };

  useEffect(loadAll, [hotelId]);

  const periodName = (id: number) => periods.find(x => x.pricingPeriodId === id)?.periodName;
  const ageName = (id: number) => ages.find(x => x.ageCategoryId === id)?.categoryName ?? id;
  const roomNumber = (id: number) => rooms.find(x => x.roomId === id)?.roomNumber ?? id;

  const visiblePrices = prices.filter(p => periodName(p.pricingPeriodId));

  const savePeriod = async () => {
    if (!hotelId) return;
    try {
      await api.createPricingPeriod({
        hotelId,
        periodCode: periodForm.periodCode,
        periodName: periodForm.periodName,
        startDate: periodForm.startDate,
        endDate: periodForm.endDate,
        priority: Number(periodForm.priority),
        isActive: periodForm.isActive,
      });
      setInfo('تم إضافة فترة التسعير بنجاح.');
      setDlg(null);
      setError('');
      loadAll();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const savePrice = async () => {
    try {
      await api.setRoomPrice({
        pricingPeriodId: Number(priceForm.pricingPeriodId),
        roomId: Number(priceForm.roomId),
        ageCategoryId: Number(priceForm.ageCategoryId),
        pricePerPersonPerNight: Number(priceForm.pricePerPersonPerNight),
        currencyCode: priceForm.currencyCode || cur,
      });
      setInfo('تم حفظ سعر الغرفة بنجاح.');
      setDlg(null);
      setError('');
      loadAll();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const saveAge = async () => {
    if (!hotelId) return;
    try {
      await api.createAgeCategory({
        hotelId,
        categoryCode: ageForm.categoryCode,
        categoryName: ageForm.categoryName,
        minAge: Number(ageForm.minAge),
        maxAge: ageForm.maxAge ? Number(ageForm.maxAge) : null,
        sortOrder: Number(ageForm.sortOrder),
      });
      setInfo('تم إضافة الفئة العمرية بنجاح.');
      setDlg(null);
      setError('');
      loadAll();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const savePromotion = async () => {
    if (!hotelId) return;
    try {
      await api.createPromotion({
        hotelId,
        promotionCode: promoForm.promotionCode,
        promotionName: promoForm.promotionName,
        discountType: promoForm.discountType,
        discountValue: Number(promoForm.discountValue),
        startDate: promoForm.startDate,
        endDate: promoForm.endDate,
        isActive: promoForm.isActive,
      });
      setInfo('تم إضافة العرض الترويجي بنجاح.');
      setDlg(null);
      setError('');
      loadAll();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <>
      <PageTitle
        title="إدارة الأسعار والعروض"
        subtitle="إدارة فترات التسعير الموسمية، أسعار الليالي حسب الفئة العمرية، والعروض الترويجية"
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="outlined" onClick={() => {
              setAgeForm({ categoryCode: '', categoryName: '', minAge: 0, maxAge: 12, sortOrder: ages.length + 1 });
              setDlg('age');
            }}>فئة عمرية جديدة</Button>
            <Button variant="outlined" onClick={() => {
              setPeriodForm({ periodCode: '', periodName: '', startDate: todayIso(), endDate: addDaysIso(todayIso(), 30), priority: 1, isActive: true });
              setDlg('period');
            }}>فترة تسعير جديدة</Button>
            <Button variant="outlined" onClick={() => {
              setPromoForm({ promotionCode: '', promotionName: '', discountType: 'PERCENTAGE', discountValue: 10, startDate: todayIso(), endDate: addDaysIso(todayIso(), 30), isActive: true });
              setDlg('promotion');
            }}>عرض ترويجي جديد</Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
              setPriceForm({ pricingPeriodId: String(periods[0]?.pricingPeriodId ?? ''), roomId: String(rooms[0]?.roomId ?? ''), ageCategoryId: String(ages[0]?.ageCategoryId ?? ''), pricePerPersonPerNight: '500', currencyCode: cur });
              setDlg('price');
            }} disabled={!periods.length || !rooms.length || !ages.length}>تحديد سعر غرفة</Button>
          </Stack>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {info && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInfo('')}>{info}</Alert>}

      {!periods.length && <Alert severity="info" sx={{ mb: 2 }}>قم بإنشاء فترة تسعير أولاً (مثل: الموسم الصيفي 2026) لتحديد أسعار الغرف عليها.</Alert>}
      {!ages.length && <Alert severity="info" sx={{ mb: 2 }}>قم بإنشاء فئات عمرية أولاً (مثل: بالغين 18+، أطفال 0-12).</Alert>}

      {/* فترات التسعير */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>فترات التسعير الموسمية ({periods.length})</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>كود الفترة</TableCell>
              <TableCell>اسم الفترة</TableCell>
              <TableCell>تاريخ البدء</TableCell>
              <TableCell>تاريخ الانتهاء</TableCell>
              <TableCell>الأولوية</TableCell>
              <TableCell>نشط</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {periods.map(x => (
              <TableRow key={x.pricingPeriodId}>
                <TableCell>{x.periodCode}</TableCell>
                <TableCell><b>{x.periodName}</b></TableCell>
                <TableCell>{fmtDate(x.startDate)}</TableCell>
                <TableCell>{fmtDate(x.endDate)}</TableCell>
                <TableCell>{x.priority}</TableCell>
                <TableCell>
                  <Chip size="small" variant="outlined" color={x.isActive ? 'success' : 'default'} label={x.isActive ? 'نعم' : 'لا'} />
                </TableCell>
              </TableRow>
            ))}
            {!periods.length && <TableRow><TableCell colSpan={6} sx={{ color: 'text.secondary' }}>لا توجد فترات تسعير مضافة.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      {/* أسعار الغرف */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>جدول أسعار الغرف المسجلة ({visiblePrices.length})</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>الغرفة</TableCell>
              <TableCell>فترة التسعير</TableCell>
              <TableCell>الفئة العمرية</TableCell>
              <TableCell align="right">السعر / الفرد / الليلة</TableCell>
              <TableCell>العملة</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visiblePrices.map(x => (
              <TableRow key={x.guestNightPriceId ?? `${x.pricingPeriodId}-${x.roomId}-${x.ageCategoryId}`}>
                <TableCell><b>غرفة {roomNumber(x.roomId)}</b></TableCell>
                <TableCell>{periodName(x.pricingPeriodId)}</TableCell>
                <TableCell>{ageName(x.ageCategoryId)}</TableCell>
                <TableCell align="right"><b>{money(x.pricePerPersonPerNight, x.currencyCode)}</b></TableCell>
                <TableCell>{x.currencyCode}</TableCell>
              </TableRow>
            ))}
            {!visiblePrices.length && <TableRow><TableCell colSpan={5} sx={{ color: 'text.secondary' }}>لا توجد أسعار غرف محددة حتى الآن. اضغط "تحديد سعر غرفة".</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Grid container spacing={2}>
        {/* الفئات العمرية */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>الفئات العمرية ({ages.length})</Typography>
            <Table size="small">
              <TableHead>
                <TableRow><TableCell>الكود</TableCell><TableCell>الاسم</TableCell><TableCell>الحد الأدنى</TableCell><TableCell>الحد الأقصى</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {ages.map(a => (
                  <TableRow key={a.ageCategoryId}>
                    <TableCell>{a.categoryCode}</TableCell>
                    <TableCell><b>{a.categoryName}</b></TableCell>
                    <TableCell>{a.minAge} سنة</TableCell>
                    <TableCell>{a.maxAge !== null && a.maxAge !== undefined ? `${a.maxAge} سنة` : 'بدون حد أقصى'}</TableCell>
                  </TableRow>
                ))}
                {!ages.length && <TableRow><TableCell colSpan={4} sx={{ color: 'text.secondary' }}>لا توجد فئات عمرية معرفة.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* العروض الترويجية */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>العروض الترويجية والخصومات ({promotions.length})</Typography>
            <Table size="small">
              <TableHead>
                <TableRow><TableCell>الكود</TableCell><TableCell>اسم العرض</TableCell><TableCell>قيمة الخصم</TableCell><TableCell>الحالة</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {promotions.map(p => (
                  <TableRow key={p.promotionId}>
                    <TableCell>{p.promotionCode}</TableCell>
                    <TableCell><b>{p.promotionName}</b></TableCell>
                    <TableCell>{p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : money(p.discountValue, cur)}</TableCell>
                    <TableCell><Chip size="small" variant="outlined" color={p.isActive ? 'success' : 'default'} label={p.isActive ? 'نشط' : 'غير نشط'} /></TableCell>
                  </TableRow>
                ))}
                {!promotions.length && <TableRow><TableCell colSpan={4} sx={{ color: 'text.secondary' }}>لا توجد عروض ترويجية معرفة.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>

      {/* حوار فترة تسعير */}
      <Dialog open={dlg === 'period'} onClose={() => setDlg(null)} fullWidth maxWidth="xs">
        <DialogTitle>إضافة فترة تسعير جديدة</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField label="كود الفترة" value={periodForm.periodCode} onChange={e => setPeriodForm({ ...periodForm, periodCode: e.target.value })} fullWidth placeholder="مثال: SUMMER-2026" />
            <TextField label="اسم الفترة" value={periodForm.periodName} onChange={e => setPeriodForm({ ...periodForm, periodName: e.target.value })} fullWidth placeholder="مثال: الموسم الصيفي 2026" />
            <Stack direction="row" spacing={2}>
              <TextField label="تاريخ البدء" type="date" value={periodForm.startDate} onChange={e => setPeriodForm({ ...periodForm, startDate: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="تاريخ الانتهاء" type="date" value={periodForm.endDate} onChange={e => setPeriodForm({ ...periodForm, endDate: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
            </Stack>
            <TextField label="الأولوية" type="number" value={periodForm.priority} onChange={e => setPeriodForm({ ...periodForm, priority: Number(e.target.value) })} fullWidth helperText="الأولوية الأعلى تتغلب في حالة تداخل التواريخ" />
            <FormControlLabel control={<Switch checked={periodForm.isActive} onChange={e => setPeriodForm({ ...periodForm, isActive: e.target.checked })} />} label="الفترة نشطة" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg(null)}>إلغاء</Button>
          <Button variant="contained" onClick={savePeriod} disabled={!periodForm.periodCode.trim() || !periodForm.periodName.trim() || !periodForm.startDate || !periodForm.endDate}>حفظ الفترة</Button>
        </DialogActions>
      </Dialog>

      {/* حوار تحديد سعر غرفة */}
      <Dialog open={dlg === 'price'} onClose={() => setDlg(null)} fullWidth maxWidth="xs">
        <DialogTitle>تحديد سعر غرفة</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField select label="فترة التسعير" value={priceForm.pricingPeriodId} onChange={e => setPriceForm({ ...priceForm, pricingPeriodId: e.target.value })} fullWidth>
              {periods.map(p => <MenuItem key={p.pricingPeriodId} value={p.pricingPeriodId}>{p.periodName}</MenuItem>)}
            </TextField>
            <TextField select label="الغرفة" value={priceForm.roomId} onChange={e => setPriceForm({ ...priceForm, roomId: e.target.value })} fullWidth>
              {rooms.map(r => <MenuItem key={r.roomId} value={r.roomId}>غرفة رقم {r.roomNumber}</MenuItem>)}
            </TextField>
            <TextField select label="الفئة العمرية" value={priceForm.ageCategoryId} onChange={e => setPriceForm({ ...priceForm, ageCategoryId: e.target.value })} fullWidth>
              {ages.map(a => <MenuItem key={a.ageCategoryId} value={a.ageCategoryId}>{a.categoryName}</MenuItem>)}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField label="السعر / الفرد / الليلة" type="number" value={priceForm.pricePerPersonPerNight} onChange={e => setPriceForm({ ...priceForm, pricePerPersonPerNight: e.target.value })} fullWidth />
              <TextField label="العملة" value={priceForm.currencyCode} onChange={e => setPriceForm({ ...priceForm, currencyCode: e.target.value })} fullWidth inputProps={{ maxLength: 3 }} />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg(null)}>إلغاء</Button>
          <Button variant="contained" onClick={savePrice} disabled={!priceForm.pricingPeriodId || !priceForm.roomId || !priceForm.ageCategoryId || !(Number(priceForm.pricePerPersonPerNight) >= 0)}>حفظ السعر</Button>
        </DialogActions>
      </Dialog>

      {/* حوار فئة عمرية */}
      <Dialog open={dlg === 'age'} onClose={() => setDlg(null)} fullWidth maxWidth="xs">
        <DialogTitle>إضافة فئة عمرية جديدة</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField label="كود الفئة" value={ageForm.categoryCode} onChange={e => setAgeForm({ ...ageForm, categoryCode: e.target.value })} fullWidth placeholder="مثال: ADULT, CHILD" />
            <TextField label="اسم الفئة" value={ageForm.categoryName} onChange={e => setAgeForm({ ...ageForm, categoryName: e.target.value })} fullWidth placeholder="مثال: بالغين (18 سنة فأكثر)" />
            <Stack direction="row" spacing={2}>
              <TextField label="الحد الأدنى للعمر" type="number" value={ageForm.minAge} onChange={e => setAgeForm({ ...ageForm, minAge: Number(e.target.value) })} fullWidth />
              <TextField label="الحد الأقصى (اختياري)" type="number" value={ageForm.maxAge} onChange={e => setAgeForm({ ...ageForm, maxAge: e.target.value ? Number(e.target.value) : 100 })} fullWidth placeholder="اتركه خالياً إن لم يوجد حد" />
            </Stack>
            <TextField label="ترتيب العرض" type="number" value={ageForm.sortOrder} onChange={e => setAgeForm({ ...ageForm, sortOrder: Number(e.target.value) })} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg(null)}>إلغاء</Button>
          <Button variant="contained" onClick={saveAge} disabled={!ageForm.categoryCode.trim() || !ageForm.categoryName.trim()}>حفظ الفئة</Button>
        </DialogActions>
      </Dialog>

      {/* حوار عرض ترويجي */}
      <Dialog open={dlg === 'promotion'} onClose={() => setDlg(null)} fullWidth maxWidth="xs">
        <DialogTitle>إضافة عرض ترويجي جديد</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField label="كود العرض" value={promoForm.promotionCode} onChange={e => setPromoForm({ ...promoForm, promotionCode: e.target.value })} fullWidth placeholder="مثال: SUMMER10" />
            <TextField label="اسم العرض" value={promoForm.promotionName} onChange={e => setPromoForm({ ...promoForm, promotionName: e.target.value })} fullWidth placeholder="مثال: خصم الصيف 10%" />
            <Stack direction="row" spacing={2}>
              <TextField select label="نوع الخصم" value={promoForm.discountType} onChange={e => setPromoForm({ ...promoForm, discountType: e.target.value })} fullWidth>
                <MenuItem value="PERCENTAGE">نسبة مئوية (%)</MenuItem>
                <MenuItem value="FIXED_AMOUNT">مبلغ ثابت</MenuItem>
              </TextField>
              <TextField label="القيمة" type="number" value={promoForm.discountValue} onChange={e => setPromoForm({ ...promoForm, discountValue: Number(e.target.value) })} fullWidth />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="تاريخ البدء" type="date" value={promoForm.startDate} onChange={e => setPromoForm({ ...promoForm, startDate: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="تاريخ الانتهاء" type="date" value={promoForm.endDate} onChange={e => setPromoForm({ ...promoForm, endDate: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
            </Stack>
            <FormControlLabel control={<Switch checked={promoForm.isActive} onChange={e => setPromoForm({ ...promoForm, isActive: e.target.checked })} />} label="العرض نشط" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg(null)}>إلغاء</Button>
          <Button variant="contained" onClick={savePromotion} disabled={!promoForm.promotionCode.trim() || !promoForm.promotionName.trim()}>حفظ العرض</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function Pricing() { return <HotelGuard><Content /></HotelGuard>; }
