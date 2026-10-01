import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BlockIcon from '@mui/icons-material/Block';
import { api } from '../api';
import { PageTitle, todayIso, addDaysIso, fmtDate } from '../components/ui';

export default function Rooms() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [dlg, setDlg] = useState<'room' | 'roomType' | 'block' | null>(null);

  const [roomForm, setRoomForm] = useState({
    floorId: '', roomTypeId: '', operationalStatusId: '1', roomNumber: '', description: '', notes: '',
  });

  const [typeForm, setTypeForm] = useState({
    roomTypeCode: '', roomTypeName: '', maxOccupancy: 2, maxAdults: 2, maxChildren: 1, description: '',
  });

  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [blockForm, setBlockForm] = useState({
    blockReasonId: '', startDate: todayIso(), endDate: addDaysIso(todayIso(), 2), notes: '',
  });
  const [roomBlocksList, setRoomBlocksList] = useState<any[]>([]);

  const loadData = () => {
    Promise.all([api.rooms(), api.roomTypes(), api.floors(), api.roomStatuses(), api.roomBlockReasons()])
      .then(([r, t, f, s, br]) => {
        setRooms(r); setTypes(t); setFloors(f); setStatuses(s); setReasons(br);
      })
      .catch(e => setError(e.message));
  };

  useEffect(loadData, []);

  const type = (id: number) => types.find(x => x.roomTypeId === id)?.roomTypeName ?? id;
  const floor = (id: number) => floors.find(x => x.floorId === id)?.floorName ?? id;
  const status = (id: number) => statuses.find(x => x.statusId === id);

  const saveRoom = async () => {
    try {
      await api.createRoom({
        floorId: Number(roomForm.floorId),
        roomTypeId: Number(roomForm.roomTypeId),
        operationalStatusId: Number(roomForm.operationalStatusId),
        roomNumber: roomForm.roomNumber,
        description: roomForm.description || null,
        notes: roomForm.notes || null,
      });
      setInfo('تم إضافة الغرفة بنجاح.');
      setDlg(null);
      setError('');
      loadData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const saveRoomType = async () => {
    try {
      await api.createRoomType({
        roomTypeCode: typeForm.roomTypeCode,
        roomTypeName: typeForm.roomTypeName,
        maxOccupancy: Number(typeForm.maxOccupancy),
        maxAdults: Number(typeForm.maxAdults),
        maxChildren: Number(typeForm.maxChildren),
        description: typeForm.description || null,
      });
      setInfo('تم إضافة نوع الغرفة بنجاح.');
      setDlg(null);
      setError('');
      loadData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const openBlockDialog = async (r: any) => {
    setSelectedRoom(r);
    setBlockForm({
      blockReasonId: String(reasons[0]?.reasonId ?? reasons[0]?.blockReasonId ?? '1'),
      startDate: todayIso(),
      endDate: addDaysIso(todayIso(), 2),
      notes: '',
    });
    try {
      const blocks = await api.roomBlocks(r.roomId);
      setRoomBlocksList(blocks);
    } catch {
      setRoomBlocksList([]);
    }
    setDlg('block');
  };

  const saveRoomBlock = async () => {
    if (!selectedRoom) return;
    try {
      await api.createRoomBlock(selectedRoom.roomId, {
        blockReasonId: Number(blockForm.blockReasonId),
        startDate: blockForm.startDate,
        endDate: blockForm.endDate,
        notes: blockForm.notes || null,
      });
      setInfo(`تم حظر الغرفة رقم ${selectedRoom.roomNumber} بنجاح.`);
      setDlg(null);
      setError('');
      loadData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <>
      <PageTitle
        title="إدارة الغرف وأنواعها"
        subtitle={`إجمالي الغرف المسجلة: ${rooms.length} غرفة`}
        action={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => {
              setTypeForm({ roomTypeCode: '', roomTypeName: '', maxOccupancy: 2, maxAdults: 2, maxChildren: 1, description: '' });
              setDlg('roomType');
            }}>نوع غرفة جديد</Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
              setRoomForm({ floorId: String(floors[0]?.floorId ?? ''), roomTypeId: String(types[0]?.roomTypeId ?? ''), operationalStatusId: String(statuses[0]?.statusId ?? '1'), roomNumber: '', description: '', notes: '' });
              setDlg('room');
            }} disabled={!floors.length || !types.length}>إضافة غرفة جديدة</Button>
          </Stack>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {info && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInfo('')}>{info}</Alert>}

      {!floors.length && <Alert severity="info" sx={{ mb: 2 }}>يرجى إضافة طابق أولاً من صفحة إعدادات الفندق لإتاحة إضافة الغرف.</Alert>}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>سجل الغرف المسجلة</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>رقم الغرفة</TableCell>
              <TableCell>نوع الغرفة</TableCell>
              <TableCell>الطابق</TableCell>
              <TableCell>الحالة التشغيلية</TableCell>
              <TableCell>متاحة للبيع</TableCell>
              <TableCell align="right">الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rooms.map(x => (
              <TableRow key={x.roomId}>
                <TableCell><b>غرفة {x.roomNumber}</b></TableCell>
                <TableCell>{type(x.roomTypeId)}</TableCell>
                <TableCell>{floor(x.floorId)}</TableCell>
                <TableCell>
                  <Chip size="small" variant="outlined" color={status(x.operationalStatusId)?.isSellable ? 'success' : 'warning'} label={status(x.operationalStatusId)?.statusName ?? x.operationalStatusId} />
                </TableCell>
                <TableCell>{x.isActive === false ? 'لا' : 'نعم'}</TableCell>
                <TableCell align="right">
                  <Button size="small" startIcon={<BlockIcon />} color="warning" onClick={() => openBlockDialog(x)}>حظر / صيانة</Button>
                </TableCell>
              </TableRow>
            ))}
            {!rooms.length && !error && (
              <TableRow><TableCell colSpan={6} sx={{ color: 'text.secondary' }}>لا توجد غرف مسجلة حتى الآن. اضغط "إضافة غرفة جديدة".</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>أنواع الغرف السكنية ({types.length})</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>الكود</TableCell>
              <TableCell>اسم النوع</TableCell>
              <TableCell>السعة القصوى</TableCell>
              <TableCell>البالغين</TableCell>
              <TableCell>الأطفال</TableCell>
              <TableCell>الوصف</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {types.map(t => (
              <TableRow key={t.roomTypeId}>
                <TableCell>{t.roomTypeCode}</TableCell>
                <TableCell><b>{t.roomTypeName}</b></TableCell>
                <TableCell>{t.maxOccupancy} أفراد</TableCell>
                <TableCell>{t.maxAdults}</TableCell>
                <TableCell>{t.maxChildren}</TableCell>
                <TableCell>{t.description || '—'}</TableCell>
              </TableRow>
            ))}
            {!types.length && <TableRow><TableCell colSpan={6} sx={{ color: 'text.secondary' }}>لا توجد أنواع غرف مسجلة.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      {/* حوار إضافة غرفة */}
      <Dialog open={dlg === 'room'} onClose={() => setDlg(null)} fullWidth maxWidth="xs">
        <DialogTitle>إضافة غرفة جديدة</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField label="رقم الغرفة" value={roomForm.roomNumber} onChange={e => setRoomForm({ ...roomForm, roomNumber: e.target.value })} fullWidth placeholder="مثال: 101, 102" />
            <TextField select label="نوع الغرفة" value={roomForm.roomTypeId} onChange={e => setRoomForm({ ...roomForm, roomTypeId: e.target.value })} fullWidth>
              {types.map(t => <MenuItem key={t.roomTypeId} value={t.roomTypeId}>{t.roomTypeName}</MenuItem>)}
            </TextField>
            <TextField select label="الطابق" value={roomForm.floorId} onChange={e => setRoomForm({ ...roomForm, floorId: e.target.value })} fullWidth>
              {floors.map(f => <MenuItem key={f.floorId} value={f.floorId}>{f.floorName}</MenuItem>)}
            </TextField>
            <TextField select label="الحالة التشغيلية" value={roomForm.operationalStatusId} onChange={e => setRoomForm({ ...roomForm, operationalStatusId: e.target.value })} fullWidth>
              {statuses.map(s => <MenuItem key={s.statusId} value={s.statusId}>{s.statusName}</MenuItem>)}
            </TextField>
            <TextField label="الوصف" value={roomForm.description} onChange={e => setRoomForm({ ...roomForm, description: e.target.value })} fullWidth />
            <TextField label="ملاحظات" value={roomForm.notes} onChange={e => setRoomForm({ ...roomForm, notes: e.target.value })} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg(null)}>إلغاء</Button>
          <Button variant="contained" onClick={saveRoom} disabled={!roomForm.roomNumber.trim() || !roomForm.floorId || !roomForm.roomTypeId}>حفظ الغرفة</Button>
        </DialogActions>
      </Dialog>

      {/* حوار إضافة نوع غرفة */}
      <Dialog open={dlg === 'roomType'} onClose={() => setDlg(null)} fullWidth maxWidth="xs">
        <DialogTitle>إضافة نوع غرفة جديد</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField label="كود النوع" value={typeForm.roomTypeCode} onChange={e => setTypeForm({ ...typeForm, roomTypeCode: e.target.value })} fullWidth placeholder="مثال: DBL, STE, SGL" />
            <TextField label="اسم النوع" value={typeForm.roomTypeName} onChange={e => setTypeForm({ ...typeForm, roomTypeName: e.target.value })} fullWidth placeholder="مثال: جناح فاخر / غرفة مزدوجة" />
            <Stack direction="row" spacing={1}>
              <TextField label="الإجمالي" type="number" value={typeForm.maxOccupancy} onChange={e => setTypeForm({ ...typeForm, maxOccupancy: Number(e.target.value) })} fullWidth />
              <TextField label="البالغين" type="number" value={typeForm.maxAdults} onChange={e => setTypeForm({ ...typeForm, maxAdults: Number(e.target.value) })} fullWidth />
              <TextField label="الأطفال" type="number" value={typeForm.maxChildren} onChange={e => setTypeForm({ ...typeForm, maxChildren: Number(e.target.value) })} fullWidth />
            </Stack>
            <TextField label="الوصف" value={typeForm.description} onChange={e => setTypeForm({ ...typeForm, description: e.target.value })} fullWidth multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg(null)}>إلغاء</Button>
          <Button variant="contained" onClick={saveRoomType} disabled={!typeForm.roomTypeCode.trim() || !typeForm.roomTypeName.trim()}>حفظ النوع</Button>
        </DialogActions>
      </Dialog>

      {/* حوار حظر غرفة */}
      <Dialog open={dlg === 'block'} onClose={() => setDlg(null)} fullWidth maxWidth="sm">
        <DialogTitle>حظر الغرفة رقم {selectedRoom?.roomNumber} (خارج الخدمة / صيانة)</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            {roomBlocksList.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>فترات الحظر السابقة لهذه الغرفة:</Typography>
                <Table size="small">
                  <TableHead><TableRow><TableCell>من</TableCell><TableCell>إلى</TableCell><TableCell>الملاحظات</TableCell></TableRow></TableHead>
                  <TableBody>
                    {roomBlocksList.map(b => (
                      <TableRow key={b.roomBlockId}><TableCell>{fmtDate(b.startDate)}</TableCell><TableCell>{fmtDate(b.endDate)}</TableCell><TableCell>{b.notes || '—'}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
            <TextField select label="سبب الحظر" value={blockForm.blockReasonId} onChange={e => setBlockForm({ ...blockForm, blockReasonId: e.target.value })} fullWidth>
              {reasons.map(r => <MenuItem key={r.reasonId ?? r.blockReasonId} value={r.reasonId ?? r.blockReasonId}>{r.reasonName}</MenuItem>)}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField label="تاريخ البدء" type="date" value={blockForm.startDate} onChange={e => setBlockForm({ ...blockForm, startDate: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="تاريخ الانتهاء" type="date" value={blockForm.endDate} onChange={e => setBlockForm({ ...blockForm, endDate: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
            </Stack>
            <TextField label="ملاحظات الحظر" value={blockForm.notes} onChange={e => setBlockForm({ ...blockForm, notes: e.target.value })} fullWidth placeholder="مثال: أعمال صيانة وتدهين" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg(null)}>إلغاء</Button>
          <Button variant="contained" color="warning" onClick={saveRoomBlock} disabled={!blockForm.startDate || !blockForm.endDate || blockForm.endDate <= blockForm.startDate}>تأكيد حظر الغرفة</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
