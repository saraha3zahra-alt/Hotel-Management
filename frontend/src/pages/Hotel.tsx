import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid, MenuItem, Paper, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { api } from '../api';
import { useHotel } from '../hotelContext';
import { PageTitle } from '../components/ui';

export default function Hotel() {
  const { hotels, error: ctxError, loading, reload } = useHotel();
  const [buildings, setBuildings] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [dlg, setDlg] = useState<'hotel' | 'building' | 'location' | 'floor' | null>(null);
  const [editHotelId, setEditHotelId] = useState<number | null>(null);

  const [hotelForm, setHotelForm] = useState({
    hotelCode: 'CLASS-01', hotelName: 'فندق كلاس', address: 'القاهرة، مصر', phone: '01000000000', email: 'info@classhotel.com', currencyCode: 'EGP', timezone: 'Africa/Cairo', isActive: true,
  });

  const [buildingForm, setBuildingForm] = useState({ hotelId: '', buildingCode: '', buildingName: '', description: '' });
  const [locationForm, setLocationForm] = useState({ locationCode: '', locationName: '', description: '' });
  const [floorForm, setFloorForm] = useState({ buildingId: '', pricingLocationId: '', floorCode: '', floorName: '', floorNumber: 1 });

  const loadExtra = () => {
    Promise.all([api.buildings(), api.locations(), api.floors()])
      .then(([b, l, f]) => { setBuildings(b); setLocations(l); setFloors(f); })
      .catch(e => setError(e.message));
  };

  useEffect(loadExtra, []);

  const openNewHotel = () => {
    setEditHotelId(null);
    setHotelForm({ hotelCode: 'CLASS-01', hotelName: 'فندق كلاس', address: 'القاهرة، مصر', phone: '', email: '', currencyCode: 'EGP', timezone: 'Africa/Cairo', isActive: true });
    setDlg('hotel');
  };

  const openEditHotel = (h: any) => {
    setEditHotelId(h.hotelId);
    setHotelForm({
      hotelCode: h.hotelCode ?? '',
      hotelName: h.hotelName ?? '',
      address: h.address ?? '',
      phone: h.phone ?? '',
      email: h.email ?? '',
      currencyCode: h.currencyCode ?? 'EGP',
      timezone: h.timezone ?? 'Africa/Cairo',
      isActive: h.isActive !== false,
    });
    setDlg('hotel');
  };

  const saveHotel = async () => {
    try {
      if (editHotelId) {
        await api.updateHotel(editHotelId, hotelForm);
        setInfo('تم تعديل بيانات الفندق بنجاح.');
      } else {
        await api.createHotel(hotelForm);
        setInfo('تم إضافة الفندق بنجاح.');
      }
      setDlg(null);
      setError('');
      reload();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const saveBuilding = async () => {
    try {
      await api.createBuilding({
        hotelId: Number(buildingForm.hotelId),
        buildingCode: buildingForm.buildingCode,
        buildingName: buildingForm.buildingName,
        description: buildingForm.description || null,
      });
      setInfo('تم إضافة المبنى بنجاح.');
      setDlg(null);
      setError('');
      loadExtra();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const saveLocation = async () => {
    try {
      await api.createLocation({
        locationCode: locationForm.locationCode,
        locationName: locationForm.locationName,
        description: locationForm.description || null,
      });
      setInfo('تم إضافة موقع التسعير بنجاح.');
      setDlg(null);
      setError('');
      loadExtra();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const saveFloor = async () => {
    try {
      await api.createFloor({
        buildingId: Number(floorForm.buildingId),
        pricingLocationId: floorForm.pricingLocationId ? Number(floorForm.pricingLocationId) : null,
        floorCode: floorForm.floorCode,
        floorName: floorForm.floorName,
        floorNumber: Number(floorForm.floorNumber),
      });
      setInfo('تم إضافة الطابق بنجاح.');
      setDlg(null);
      setError('');
      loadExtra();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <>
      <PageTitle
        title="إعدادات الفندق والمباني"
        subtitle="إدارة بيانات الفندق والمباني والطوابق ومواقع التسعير"
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="outlined" onClick={() => { setBuildingForm({ hotelId: String(hotels[0]?.hotelId ?? ''), buildingCode: '', buildingName: '', description: '' }); setDlg('building'); }}>مبنى جديد</Button>
            <Button variant="outlined" onClick={() => { setLocationForm({ locationCode: '', locationName: '', description: '' }); setDlg('location'); }}>موقع تسعير جديد</Button>
            <Button variant="outlined" onClick={() => { setFloorForm({ buildingId: String(buildings[0]?.buildingId ?? ''), pricingLocationId: '', floorCode: '', floorName: '', floorNumber: 1 }); setDlg('floor'); }}>طابق جديد</Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openNewHotel}>إضافة فندق</Button>
          </Stack>
        }
      />

      {(error || ctxError) && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error || ctxError}</Alert>}
      {info && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInfo('')}>{info}</Alert>}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>سجل الفنادق المسجلة</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>كود الفندق</TableCell>
              <TableCell>اسم الفندق</TableCell>
              <TableCell>الهاتف</TableCell>
              <TableCell>البريد الإلكتروني</TableCell>
              <TableCell>العملة</TableCell>
              <TableCell>التوقيت</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell align="right">الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hotels.map(x => (
              <TableRow key={x.hotelId}>
                <TableCell><b>{x.hotelCode}</b></TableCell>
                <TableCell>{x.hotelName === 'Class Hotel' ? 'فندق كلاس (Class Hotel)' : x.hotelName}</TableCell>
                <TableCell>{x.phone || '—'}</TableCell>
                <TableCell>{x.email || '—'}</TableCell>
                <TableCell>{x.currencyCode}</TableCell>
                <TableCell>{x.timezone}</TableCell>
                <TableCell>
                  <Chip size="small" variant="outlined" color={x.isActive ? 'success' : 'default'} label={x.isActive ? 'نشط' : 'غير نشط'} />
                </TableCell>
                <TableCell align="right">
                  <Button size="small" startIcon={<EditIcon />} onClick={() => openEditHotel(x)}>تعديل</Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && !hotels.length && !error && (
              <TableRow><TableCell colSpan={8} sx={{ color: 'text.secondary' }}>لا يوجد فنادق حتى الآن. اضغط "إضافة فندق" للبدء.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* الهيكل التنظيمي للمباني والطوابق */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>المباني ({buildings.length})</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>الكود</TableCell><TableCell>الاسم</TableCell><TableCell>الوصف</TableCell></TableRow></TableHead>
              <TableBody>
                {buildings.map(b => <TableRow key={b.buildingId}><TableCell>{b.buildingCode}</TableCell><TableCell>{b.buildingName}</TableCell><TableCell>{b.description || '—'}</TableCell></TableRow>)}
                {!buildings.length && <TableRow><TableCell colSpan={3} sx={{ color: 'text.secondary' }}>لا توجد مباني مسجلة.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>الطوابق ({floors.length})</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>الكود</TableCell><TableCell>الاسم</TableCell><TableCell>الرقم</TableCell></TableRow></TableHead>
              <TableBody>
                {floors.map(f => <TableRow key={f.floorId}><TableCell>{f.floorCode}</TableCell><TableCell>{f.floorName}</TableCell><TableCell>{f.floorNumber}</TableCell></TableRow>)}
                {!floors.length && <TableRow><TableCell colSpan={3} sx={{ color: 'text.secondary' }}>لا توجد طوابق مسجلة.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>مواقع التسعير ({locations.length})</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>الكود</TableCell><TableCell>الاسم</TableCell></TableRow></TableHead>
              <TableBody>
                {locations.map(l => <TableRow key={l.pricingLocationId}><TableCell>{l.locationCode}</TableCell><TableCell>{l.locationName}</TableCell></TableRow>)}
                {!locations.length && <TableRow><TableCell colSpan={2} sx={{ color: 'text.secondary' }}>لا توجد مواقع تسعير.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>

      {/* حوار الفندق */}
      <Dialog open={dlg === 'hotel'} onClose={() => setDlg(null)} fullWidth maxWidth="sm">
        <DialogTitle>{editHotelId ? 'تعديل بيانات الفندق' : 'إضافة فندق جديد'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField label="كود الفندق" value={hotelForm.hotelCode} onChange={e => setHotelForm({ ...hotelForm, hotelCode: e.target.value })} fullWidth placeholder="مثال: CLASS-01" />
              <TextField label="اسم الفندق" value={hotelForm.hotelName} onChange={e => setHotelForm({ ...hotelForm, hotelName: e.target.value })} fullWidth placeholder="فندق كلاس" />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="رقم الهاتف" value={hotelForm.phone} onChange={e => setHotelForm({ ...hotelForm, phone: e.target.value })} fullWidth />
              <TextField label="البريد الإلكتروني" value={hotelForm.email} onChange={e => setHotelForm({ ...hotelForm, email: e.target.value })} fullWidth />
            </Stack>
            <TextField label="العنوان" value={hotelForm.address} onChange={e => setHotelForm({ ...hotelForm, address: e.target.value })} multiline rows={2} />
            <Stack direction="row" spacing={2}>
              <TextField label="رمز العملة" value={hotelForm.currencyCode} onChange={e => setHotelForm({ ...hotelForm, currencyCode: e.target.value })} fullWidth helperText="مثال: EGP, USD" inputProps={{ maxLength: 3 }} />
              <TextField label="التوقيت الزمني" value={hotelForm.timezone} onChange={e => setHotelForm({ ...hotelForm, timezone: e.target.value })} fullWidth helperText="مثال: Africa/Cairo" />
            </Stack>
            <FormControlLabel control={<Switch checked={hotelForm.isActive} onChange={e => setHotelForm({ ...hotelForm, isActive: e.target.checked })} />} label="الفندق نشط" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg(null)}>إلغاء</Button>
          <Button variant="contained" onClick={saveHotel} disabled={!hotelForm.hotelCode.trim() || !hotelForm.hotelName.trim()}>حفظ البيانات</Button>
        </DialogActions>
      </Dialog>

      {/* حوار المبنى */}
      <Dialog open={dlg === 'building'} onClose={() => setDlg(null)} fullWidth maxWidth="xs">
        <DialogTitle>إضافة مبنى جديد</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField select label="الفندق التابع له" value={buildingForm.hotelId} onChange={e => setBuildingForm({ ...buildingForm, hotelId: e.target.value })} fullWidth>
              {hotels.map(h => <MenuItem key={h.hotelId} value={h.hotelId}>{h.hotelName}</MenuItem>)}
            </TextField>
            <TextField label="كود المبنى" value={buildingForm.buildingCode} onChange={e => setBuildingForm({ ...buildingForm, buildingCode: e.target.value })} fullWidth placeholder="مثال: MAIN, TOWER1" />
            <TextField label="اسم المبنى" value={buildingForm.buildingName} onChange={e => setBuildingForm({ ...buildingForm, buildingName: e.target.value })} fullWidth placeholder="مثال: المبنى الرئيسي" />
            <TextField label="الوصف" value={buildingForm.description} onChange={e => setBuildingForm({ ...buildingForm, description: e.target.value })} fullWidth multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg(null)}>إلغاء</Button>
          <Button variant="contained" onClick={saveBuilding} disabled={!buildingForm.hotelId || !buildingForm.buildingCode.trim() || !buildingForm.buildingName.trim()}>حفظ</Button>
        </DialogActions>
      </Dialog>

      {/* حوار الموقع */}
      <Dialog open={dlg === 'location'} onClose={() => setDlg(null)} fullWidth maxWidth="xs">
        <DialogTitle>إضافة موقع تسعير جديد</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField label="كود الموقع" value={locationForm.locationCode} onChange={e => setLocationForm({ ...locationForm, locationCode: e.target.value })} fullWidth placeholder="مثال: SEA, GARDEN" />
            <TextField label="اسم الموقع" value={locationForm.locationName} onChange={e => setLocationForm({ ...locationForm, locationName: e.target.value })} fullWidth placeholder="مثال: مطل على البحر" />
            <TextField label="الوصف" value={locationForm.description} onChange={e => setLocationForm({ ...locationForm, description: e.target.value })} fullWidth multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg(null)}>إلغاء</Button>
          <Button variant="contained" onClick={saveLocation} disabled={!locationForm.locationCode.trim() || !locationForm.locationName.trim()}>حفظ</Button>
        </DialogActions>
      </Dialog>

      {/* حوار الطابق */}
      <Dialog open={dlg === 'floor'} onClose={() => setDlg(null)} fullWidth maxWidth="xs">
        <DialogTitle>إضافة طابق جديد</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField select label="المبنى" value={floorForm.buildingId} onChange={e => setFloorForm({ ...floorForm, buildingId: e.target.value })} fullWidth>
              {buildings.map(b => <MenuItem key={b.buildingId} value={b.buildingId}>{b.buildingName}</MenuItem>)}
            </TextField>
            <TextField select label="موقع التسعير (اختياري)" value={floorForm.pricingLocationId} onChange={e => setFloorForm({ ...floorForm, pricingLocationId: e.target.value })} fullWidth>
              <MenuItem value="">— لا يوجد —</MenuItem>
              {locations.map(l => <MenuItem key={l.pricingLocationId} value={l.pricingLocationId}>{l.locationName}</MenuItem>)}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField label="كود الطابق" value={floorForm.floorCode} onChange={e => setFloorForm({ ...floorForm, floorCode: e.target.value })} fullWidth placeholder="مثال: FL1" />
              <TextField label="رقم الطابق" type="number" value={floorForm.floorNumber} onChange={e => setFloorForm({ ...floorForm, floorNumber: Number(e.target.value) })} fullWidth />
            </Stack>
            <TextField label="اسم الطابق" value={floorForm.floorName} onChange={e => setFloorForm({ ...floorForm, floorName: e.target.value })} fullWidth placeholder="مثال: الدور الأول" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg(null)}>إلغاء</Button>
          <Button variant="contained" onClick={saveFloor} disabled={!floorForm.buildingId || !floorForm.floorCode.trim() || !floorForm.floorName.trim()}>حفظ</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
