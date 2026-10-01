import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Divider, Grid, MenuItem, Paper, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography } from '@mui/material';
import { api } from '../api';
import { useHotel } from '../hotelContext';
import { HotelGuard, PageTitle, Stat, StatusChip, addDaysIso, ageOn, fmtDate, money, nightsBetween, todayIso } from '../components/ui';

const STATUS_BY_ID: Record<number, string> = { 1: 'PENDING', 2: 'CONFIRMED', 3: 'CHECKED_IN', 4: 'CHECKED_OUT', 5: 'CANCELLED', 6: 'NO_SHOW' };
const emptyGuest = () => ({ firstName: '', lastName: '', dateOfBirth: '' });

function NewReservation() {
  const { hotel, hotelId } = useHotel();
  const nav = useNavigate();
  const cur = hotel?.currencyCode ?? 'EGP';
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [q, setQ] = useState({ checkIn: todayIso(), checkOut: addDaysIso(todayIso(), 1), adults: 2, children: 0, roomTypeId: '' });
  const [result, setResult] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([emptyGuest(), emptyGuest()]);
  const [cust, setCust] = useState({ firstName: '', lastName: '', phone: '', email: '', nationalId: '', passportNumber: '', nationality: '', notes: '' });
  const [preview, setPreview] = useState<any>(null);
  const [created, setCreated] = useState<any>(null);
  const [error, setError] = useState(''); const [info, setInfo] = useState(''); const [busy, setBusy] = useState(false);

  useEffect(() => { api.roomTypes().then(setRoomTypes).catch(e => setError(e.message)); }, []);

  const nights = nightsBetween(q.checkIn, q.checkOut);
  const guestCount = Number(q.adults) + Number(q.children);
  const setCount = (adults: number, children: number) => {
    setQ(p => ({ ...p, adults, children }));
    setGuests(g => Array.from({ length: adults + children }, (_, i) => g[i] ?? emptyGuest()));
  };
  const guestsReady = guests.length === guestCount && guests.every(g => g.firstName.trim() && g.lastName.trim() && g.dateOfBirth);
  const custReady = cust.firstName.trim() && cust.lastName.trim();
  const reset = () => { setResult(null); setRoom(null); setPreview(null); setCreated(null); };

  const search = async () => {
    setBusy(true); setError(''); setInfo(''); reset();
    try {
      setResult(await api.availability({ hotelId, checkInDate: q.checkIn, checkOutDate: q.checkOut, adults: Number(q.adults), children: Number(q.children), roomTypeId: q.roomTypeId ? Number(q.roomTypeId) : null }));
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  const priceGuests = () => {
    const byAge = new Map<number, number>();
    guests.forEach(g => { const a = ageOn(g.dateOfBirth, q.checkIn); byAge.set(a, (byAge.get(a) ?? 0) + 1); });
    return [...byAge].map(([age, count]) => ({ age, count }));
  };
  const runPreview = async () => {
    setBusy(true); setError(''); setPreview(null);
    try { setPreview(await api.calculateRoomPrice({ roomId: room.roomId, checkInDate: q.checkIn, checkOutDate: q.checkOut, guests: priceGuests() })); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  const create = async () => {
    setBusy(true); setError('');
    const clean = (s: string) => s.trim() || null;
    try {
      const r = await api.createReservation({
        hotelId, checkInDate: q.checkIn, checkOutDate: q.checkOut, currencyCode: cur, bookingSource: 'FRONT_DESK', notes: clean(cust.notes),
        customer: { firstName: cust.firstName.trim(), lastName: cust.lastName.trim(), phone: clean(cust.phone), email: clean(cust.email), nationalId: clean(cust.nationalId), passportNumber: clean(cust.passportNumber), nationality: clean(cust.nationality), notes: clean(cust.notes) },
        rooms: [{ roomId: room.roomId, guests: guests.map((g, i) => ({ firstName: g.firstName.trim(), lastName: g.lastName.trim(), dateOfBirth: g.dateOfBirth, isPrimaryGuest: i === 0 })) }],
      });
      setCreated({ ...r, status: 'PENDING' });
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  const act = async (fn: () => Promise<any>, ok: string) => {
    try { const r = await fn(); setCreated((c: any) => ({ ...c, status: r.status })); setInfo(ok); setError(''); } catch (e: any) { setError(e.message); }
  };

  if (created) return (
    <Card sx={{ border: '2px solid #10b981', borderRadius: 3 }}><CardContent>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        تم إنشاء الحجز رقم {created.reservationNumber} <StatusChip status={created.status} />
      </Typography>
      <Grid container spacing={2} sx={{ my: 2 }}>
        <Grid size={{ xs: 4 }}><Stat label="المبلغ الإجمالي" value={money(created.grossAmount, cur)} /></Grid>
        <Grid size={{ xs: 4 }}><Stat label="إجمالي الخصم" value={money(created.discountAmount, cur)} /></Grid>
        <Grid size={{ xs: 4 }}><Stat label="الصافي المطلوب" value={money(created.finalAmount, cur)} color="success.main" /></Grid>
      </Grid>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      {info && <Alert severity="success" sx={{ mb: 1 }}>{info}</Alert>}
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        {created.status === 'PENDING' && <Button variant="contained" color="success" onClick={() => act(() => api.confirmReservation(created.reservationId), 'تم تأكيد الحجز بنجاح.')}>تأكيد الحجز الآن</Button>}
        {created.status !== 'CANCELLED' && <Button color="error" onClick={() => window.confirm('هل تريد إلغاء هذا الحجز؟') && act(() => api.cancelReservation(created.reservationId), 'تم إلغاء الحجز.')}>إلغاء الحجز</Button>}
        <Button variant="outlined" onClick={() => nav(`/payments?reservationId=${created.reservationId}`)}>تسجيل المدفوعات</Button>
        <Button onClick={() => { reset(); setInfo(''); setGuests(Array.from({ length: guestCount }, emptyGuest)); setCust({ firstName: '', lastName: '', phone: '', email: '', nationalId: '', passportNumber: '', nationality: '', notes: '' }); }}>حجز جديد</Button>
      </Stack>
    </CardContent></Card>
  );

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      <Paper sx={{ p: 2.5 }}>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>1. إدخال فترات الإقامة والبحث عن الإتاحة</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
          <TextField label="تاريخ الوصول (Check-in)" type="date" size="small" value={q.checkIn} onChange={e => { const v = e.target.value; setQ(p => ({ ...p, checkIn: v, checkOut: p.checkOut <= v ? addDaysIso(v, 1) : p.checkOut })); reset(); }} InputLabelProps={{ shrink: true }} />
          <TextField label="تاريخ المغادرة (Check-out)" type="date" size="small" value={q.checkOut} onChange={e => { setQ({ ...q, checkOut: e.target.value }); reset(); }} InputLabelProps={{ shrink: true }} helperText={nights > 0 ? `${nights} ليلة` : 'يجب أن يكون بعد تاريخ الوصول'} />
          <TextField label="عدد البالغين" type="number" size="small" value={q.adults} onChange={e => { setCount(Math.max(0, Number(e.target.value)), Number(q.children)); reset(); }} sx={{ width: 110 }} />
          <TextField label="عدد الأطفال" type="number" size="small" value={q.children} onChange={e => { setCount(Number(q.adults), Math.max(0, Number(e.target.value))); reset(); }} sx={{ width: 110 }} />
          <TextField select label="نوع الغرفة المطلوبة" size="small" value={q.roomTypeId} onChange={e => { setQ({ ...q, roomTypeId: e.target.value }); reset(); }} sx={{ minWidth: 160 }}>
            <MenuItem value="">الكل / أي نوع</MenuItem>
            {roomTypes.map(t => <MenuItem key={t.roomTypeId} value={t.roomTypeId}>{t.roomTypeName}</MenuItem>)}
          </TextField>
          <Button variant="contained" onClick={search} disabled={busy || nights <= 0 || guestCount <= 0} sx={{ height: 40 }}>البحث عن غرف متاحة</Button>
        </Stack>

        {result && (
          <Table size="small" sx={{ mt: 2 }}>
            <TableHead><TableRow><TableCell>رقم الغرفة</TableCell><TableCell>نوع الغرفة</TableCell><TableCell>المبنى</TableCell><TableCell>الطابق</TableCell><TableCell>السعة القصوى</TableCell><TableCell align="right">اختيار</TableCell></TableRow></TableHead>
            <TableBody>
              {result.rooms.map((r: any) => (
                <TableRow key={r.roomId} selected={room?.roomId === r.roomId}>
                  <TableCell><b>غرفة {r.roomNumber}</b></TableCell><TableCell>{r.roomTypeName}</TableCell><TableCell>{r.buildingName}</TableCell><TableCell>{r.floorName}</TableCell><TableCell>{r.maxOccupancy} أفراد</TableCell>
                  <TableCell align="right"><Button size="small" variant={room?.roomId === r.roomId ? 'contained' : 'outlined'} onClick={() => { setRoom(r); setPreview(null); }}>{room?.roomId === r.roomId ? 'تم الاختيار' : 'اختيار هذه الغرفة'}</Button></TableCell>
                </TableRow>
              ))}
              {!result.rooms.length && <TableRow><TableCell colSpan={6} sx={{ color: 'text.secondary' }}>لا توجد غرف متاحة لهذه التواريخ والعدد المحدد.</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </Paper>

      {room && (
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>2. بيانات النزلاء المقيمين في غرفة رقم {room.roomNumber}</Typography>
          <Stack spacing={1.5}>
            {guests.map((g, i) => (
              <Stack key={i} direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                <Typography sx={{ width: 100, fontWeight: 700 }}>{i === 0 ? 'النزيل الرئيسي' : `مرافق ${i + 1}`}</Typography>
                <TextField size="small" label="الاسم الأول" value={g.firstName} onChange={e => setGuests(gs => gs.map((x, j) => j === i ? { ...x, firstName: e.target.value } : x))} />
                <TextField size="small" label="اسم العائلة" value={g.lastName} onChange={e => setGuests(gs => gs.map((x, j) => j === i ? { ...x, lastName: e.target.value } : x))} />
                <TextField size="small" label="تاريخ الميلاد" type="date" value={g.dateOfBirth} InputLabelProps={{ shrink: true }} onChange={e => setGuests(gs => gs.map((x, j) => j === i ? { ...x, dateOfBirth: e.target.value } : x))} helperText={g.dateOfBirth ? `العمر عند الوصول: ${ageOn(g.dateOfBirth, q.checkIn)} سنة` : ' '} />
              </Stack>
            ))}
          </Stack>

          <Divider sx={{ my: 2.5 }} />
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>3. بيانات العميل صاحب الحجز (Booker)</Typography>
          <Button size="small" variant="outlined" sx={{ mb: 2 }} onClick={() => setCust(c => ({ ...c, firstName: guests[0].firstName, lastName: guests[0].lastName }))}>نسخ اسم النزيل الرئيسي</Button>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            <TextField size="small" label="الاسم الأول" value={cust.firstName} onChange={e => setCust({ ...cust, firstName: e.target.value })} />
            <TextField size="small" label="اسم العائلة" value={cust.lastName} onChange={e => setCust({ ...cust, lastName: e.target.value })} />
            <TextField size="small" label="رقم الهاتف" value={cust.phone} onChange={e => setCust({ ...cust, phone: e.target.value })} />
            <TextField size="small" label="البريد الإلكتروني" value={cust.email} onChange={e => setCust({ ...cust, email: e.target.value })} />
            <TextField size="small" label="الرقم القومي" value={cust.nationalId} onChange={e => setCust({ ...cust, nationalId: e.target.value })} />
            <TextField size="small" label="رقم جواز السفر" value={cust.passportNumber} onChange={e => setCust({ ...cust, passportNumber: e.target.value })} />
            <TextField size="small" label="الجنسية" value={cust.nationality} onChange={e => setCust({ ...cust, nationality: e.target.value })} />
            <TextField size="small" label="ملاحظات الحجز" value={cust.notes} onChange={e => setCust({ ...cust, notes: e.target.value })} />
          </Box>

          <Divider sx={{ my: 2.5 }} />
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>4. معاينة التكلفة وتأكيد إنشاء الحجز</Typography>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={runPreview} disabled={busy || !guestsReady}>معاينة سعر الليالي تفصيلياً</Button>
            <Button variant="contained" onClick={create} disabled={busy || !guestsReady || !custReady}>إنشاء وتأكيد الحجز مبدئياً (Pending)</Button>
          </Stack>

          {preview && (
            <Box sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead><TableRow><TableCell>التاريخ (الليلة)</TableCell><TableCell>فترة التسعير</TableCell><TableCell align="right">سعر الليلة الإجمالي</TableCell></TableRow></TableHead>
                <TableBody>
                  {preview.nights.map((n: any) => <TableRow key={n.stayDate}><TableCell>{fmtDate(n.stayDate)}</TableCell><TableCell>{n.pricingPeriod}</TableCell><TableCell align="right">{money(n.nightTotal, cur)}</TableCell></TableRow>)}
                  <TableRow><TableCell colSpan={2}><b>إجمالي السعر قبل الخصومات والتخفيضات ({preview.numberOfNights} ليلة)</b></TableCell><TableCell align="right"><b>{money(preview.total, cur)}</b></TableCell></TableRow>
                </TableBody>
              </Table>
            </Box>
          )}
        </Paper>
      )}
    </Stack>
  );
}

function FindReservation() {
  const nav = useNavigate(); const { hotel } = useHotel(); const cur = hotel?.currencyCode ?? 'EGP';
  const [id, setId] = useState(''); const [data, setData] = useState<any>(null); const [status, setStatus] = useState('');
  const [error, setError] = useState(''); const [info, setInfo] = useState('');
  const load = async () => { try { const r: any = await api.reservation(Number(id)); setData(r); setStatus(STATUS_BY_ID[r.reservation.statusId] ?? `#${r.reservation.statusId}`); setError(''); } catch (e: any) { setData(null); setError(e.message); } };
  const act = async (fn: () => Promise<any>, ok: string) => { try { const r = await fn(); setStatus(r.status); setInfo(ok); setError(''); } catch (e: any) { setError(e.message); } };
  const r = data?.reservation;
  const total = useMemo(() => (data?.rooms ?? []).length, [data]);

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={2}>
          <TextField size="small" type="number" label="رقم الحجز (Reservation ID)" value={id} onChange={e => setId(e.target.value)} onKeyDown={e => e.key === 'Enter' && id && load()} placeholder="مثال: 1" />
          <Button variant="contained" disabled={!id} onClick={load}>بحث واستعلام</Button>
        </Stack>
      </Paper>
      {error && <Alert severity="error">{error}</Alert>}
      {info && <Alert severity="success" onClose={() => setInfo('')}>{info}</Alert>}
      {r && (
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}><CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            رقم الحجز: {r.reservationNumber} <StatusChip status={status} />
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            الفترة: {fmtDate(r.checkInDate)} ← {fmtDate(r.checkOutDate)} ({nightsBetween(fmtDate(r.checkInDate), fmtDate(r.checkOutDate))} ليلة) · كود العميل #{r.customerId} · عدد الغرف: {total}
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 4 }}><Stat label="المبلغ الأساسي" value={money(r.grossAmount, r.currencyCode || cur)} /></Grid>
            <Grid size={{ xs: 4 }}><Stat label="قيمة الخصم" value={money(r.discountAmount, r.currencyCode || cur)} /></Grid>
            <Grid size={{ xs: 4 }}><Stat label="المبلغ النهائي" value={money(r.finalAmount, r.currencyCode || cur)} color="success.main" /></Grid>
          </Grid>
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead><TableRow><TableCell>رقم الغرفة</TableCell><TableCell>البالغين</TableCell><TableCell>الأطفال</TableCell><TableCell align="right">الإجمالي</TableCell><TableCell align="right">الخصم</TableCell><TableCell align="right">الصافي</TableCell></TableRow></TableHead>
            <TableBody>{data.rooms.map((x: any) => <TableRow key={x.reservationRoomId}><TableCell>غرفة {x.roomId}</TableCell><TableCell>{x.adultsCount}</TableCell><TableCell>{x.childrenCount}</TableCell><TableCell align="right">{money(x.grossAmount, cur)}</TableCell><TableCell align="right">{money(x.discountAmount, cur)}</TableCell><TableCell align="right"><b>{money(x.finalAmount, cur)}</b></TableCell></TableRow>)}</TableBody>
          </Table>
          <Stack direction="row" spacing={1}>
            {status === 'PENDING' && <Button variant="contained" color="success" onClick={() => act(() => api.confirmReservation(r.reservationId), 'تم تأكيد الحجز بنجاح.')}>تأكيد الحجز</Button>}
            {status !== 'CANCELLED' && <Button color="error" onClick={() => window.confirm('هل تريد إلغاء هذا الحجز؟') && act(() => api.cancelReservation(r.reservationId), 'تم إلغاء الحجز.')}>إلغاء الحجز</Button>}
            <Button variant="outlined" onClick={() => nav(`/payments?reservationId=${r.reservationId}`)}>تسجيل المدفوعات والماليات</Button>
          </Stack>
        </CardContent></Card>
      )}
    </Stack>
  );
}

function Content() {
  const [tab, setTab] = useState(0);
  return (
    <>
      <PageTitle title="إدارة الحجوزات والإشغال" subtitle="البحث عن الغرف المتاحة، حساب الأسعار، وإنشاء وتأكيد الحجوزات" />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}><Tab label="حجز جديد" /><Tab label="استعلام عن حجز" /></Tabs>
      {tab === 0 ? <NewReservation /> : <FindReservation />}
    </>
  );
}
export default function Reservations() { return <HotelGuard><Content /></HotelGuard>; }
