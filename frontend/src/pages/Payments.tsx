import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { api } from '../api';
import { useHotel } from '../hotelContext';
import { PageTitle, Stat, StatusChip, fmtDateTime, money } from '../components/ui';

export default function Payments() {
  const { hotel } = useHotel();
  const cur = hotel?.currencyCode ?? 'EGP';
  const [params, setParams] = useSearchParams();
  const [idInput, setIdInput] = useState(params.get('reservationId') ?? '');
  const [fin, setFin] = useState<any>(null);
  const [methods, setMethods] = useState<any[]>([]); const [reasons, setReasons] = useState<any[]>([]);
  const [error, setError] = useState(''); const [info, setInfo] = useState('');
  const [dlg, setDlg] = useState<'payment' | 'refund' | null>(null);
  const [pay, setPay] = useState({ amount: '', paymentMethodId: '', referenceNumber: '', notes: '' });
  const [ref, setRef] = useState({ refundAmount: '', refundReasonId: '', paymentId: '', refundMethod: '', referenceNumber: '' });

  useEffect(() => { Promise.all([api.paymentMethods(), api.refundReasons()]).then(([m, r]) => { setMethods(m); setReasons(r); }).catch(e => setError(e.message)); }, []);

  const load = useCallback((id: string) => {
    if (!id) return;
    api.reservationFinance(Number(id)).then(f => { setFin(f); setError(''); }).catch(e => { setFin(null); setError(e.message); });
  }, []);
  useEffect(() => { load(params.get('reservationId') ?? ''); }, [params, load]);

  const search = () => setParams(idInput ? { reservationId: idInput } : {});
  const run = async (fn: () => Promise<any>, ok: string) => {
    try { await fn(); setInfo(ok); setError(''); setDlg(null); load(String(fin.reservationId)); } catch (e: any) { setError(e.message); }
  };
  const methodName = (id: number) => methods.find(m => m.paymentMethodId === id)?.methodName ?? id;
  const reasonName = (id: number) => reasons.find(r => r.refundReasonId === id)?.reasonName ?? id;

  const savePayment = () => run(() => api.addPayment({ reservationId: fin.reservationId, amount: Number(pay.amount), paymentMethodId: Number(pay.paymentMethodId), referenceNumber: pay.referenceNumber || null, notes: pay.notes || null, status: 'SUCCESSFUL' }), 'تم تسجيل الدفعة المالية بنجاح.')
    .then(() => setPay({ amount: '', paymentMethodId: '', referenceNumber: '', notes: '' }));
  const saveRefund = () => run(() => api.createRefund({ reservationId: fin.reservationId, paymentId: ref.paymentId ? Number(ref.paymentId) : null, refundAmount: Number(ref.refundAmount), refundReasonId: Number(ref.refundReasonId), refundMethod: ref.refundMethod || null, referenceNumber: ref.referenceNumber || null }), 'تم إرسال طلب استرداد المبلغ (في انتظار الموافقة).')
    .then(() => setRef({ refundAmount: '', refundReasonId: '', paymentId: '', refundMethod: '', referenceNumber: '' }));

  return (
    <>
      <PageTitle title="المدفوعات والاسترداد" subtitle="متابعة الحسابات، تسجيل المقبوضات والنقدية، وطلبات الاسترداد لكل حجز" />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {info && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInfo('')}>{info}</Alert>}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2}>
          <TextField size="small" label="رقم الحجز (Reservation ID)" type="number" value={idInput} onChange={e => setIdInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder="مثال: 1" />
          <Button variant="contained" onClick={search} disabled={!idInput}>عرض التفاصيل المالية</Button>
        </Stack>
      </Paper>

      {fin && <>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 3 }}><Stat label="كود الحجز" value={fin.reservationNumber} hint={<StatusChip status={fin.paymentStatus} /> as any} /></Grid>
          <Grid size={{ xs: 6, md: 3 }}><Stat label="إجمالي الحجز" value={money(fin.finalAmount, cur)} /></Grid>
          <Grid size={{ xs: 6, md: 3 }}><Stat label="صافي المدفوع" value={money(fin.netPaid, cur)} color="success.main" /></Grid>
          <Grid size={{ xs: 12, md: 3 }}><Stat label="المبلغ المتبقي (المستحق)" value={money(fin.balanceDue, cur)} color={fin.balanceDue > 0 ? 'error.main' : 'success.main'} /></Grid>
        </Grid>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button variant="contained" onClick={() => setDlg('payment')}>تسجيل تحصيل مبلغ جديد</Button>
          <Button variant="outlined" onClick={() => setDlg('refund')} disabled={!(fin.refundableAmount > 0)}>طلب استرداد مبلغ</Button>
        </Stack>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>سجل المدفوعات المسددة</Typography>
          <Table size="small"><TableHead><TableRow><TableCell>رقم العملية</TableCell><TableCell>التاريخ</TableCell><TableCell>طريقة الدفع</TableCell><TableCell>رقم المرجع</TableCell><TableCell>الملاحظات</TableCell><TableCell align="right">المبلغ</TableCell><TableCell>الحالة</TableCell></TableRow></TableHead>
            <TableBody>
              {fin.payments.map((p: any) => <TableRow key={p.paymentId}><TableCell>#{p.paymentId}</TableCell><TableCell>{fmtDateTime(p.paymentDate)}</TableCell><TableCell>{methodName(p.paymentMethodId)}</TableCell><TableCell>{p.referenceNumber || '—'}</TableCell><TableCell>{p.notes || '—'}</TableCell><TableCell align="right"><b>{money(p.amount, cur)}</b></TableCell><TableCell><StatusChip status={p.status} /></TableCell></TableRow>)}
              {!fin.payments.length && <TableRow><TableCell colSpan={7} sx={{ color: 'text.secondary' }}>لا توجد مدفوعات مسجلة لهذا الحجز.</TableCell></TableRow>}
            </TableBody></Table>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>طلبات الاسترداد والإرجاع</Typography>
          <Table size="small"><TableHead><TableRow><TableCell>رقم طلب الاسترداد</TableCell><TableCell>التاريخ</TableCell><TableCell>السبب</TableCell><TableCell>على عملية رقم</TableCell><TableCell align="right">المبلغ</TableCell><TableCell>الحالة</TableCell><TableCell align="right">الإجراءات</TableCell></TableRow></TableHead>
            <TableBody>
              {fin.refunds.map((r: any) => (
                <TableRow key={r.refundId}>
                  <TableCell>#{r.refundId}</TableCell><TableCell>{fmtDateTime(r.refundDate)}</TableCell><TableCell>{reasonName(r.refundReasonId)}</TableCell><TableCell>{r.paymentId ? `#${r.paymentId}` : '—'}</TableCell>
                  <TableCell align="right"><b>{money(r.refundAmount, cur)}</b></TableCell><TableCell><StatusChip status={r.status} /></TableCell>
                  <TableCell align="right">
                    {r.status === 'PENDING_APPROVAL' && <><Button size="small" color="success" onClick={() => run(() => api.changeRefundStatus(r.refundId, 'APPROVED'), 'تم الاعتماد.')}>موافقة</Button><Button size="small" color="error" onClick={() => run(() => api.changeRefundStatus(r.refundId, 'REJECTED'), 'تم الرفض.')}>رفض</Button></>}
                    {r.status === 'APPROVED' && <Button size="small" variant="contained" onClick={() => run(() => api.changeRefundStatus(r.refundId, 'PROCESSED'), 'تم الصرف والإرجاع.')}>تم الصرف</Button>}
                  </TableCell>
                </TableRow>
              ))}
              {!fin.refunds.length && <TableRow><TableCell colSpan={7} sx={{ color: 'text.secondary' }}>لا توجد عمليات استرداد.</TableCell></TableRow>}
            </TableBody></Table>
        </Paper>
      </>}

      {/* حوار تسجيل دفع */}
      <Dialog open={dlg === 'payment'} onClose={() => setDlg(null)} fullWidth maxWidth="xs">
        <DialogTitle>تسجيل دفعة مالية جديدة</DialogTitle>
        <DialogContent><Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField label="المبلغ المحصل" type="number" value={pay.amount} onChange={e => setPay({ ...pay, amount: e.target.value })} helperText={fin ? `المبلغ المستحق: ${money(fin.balanceDue, cur)}` : ''} />
          <TextField select label="طريقة الدفع" value={pay.paymentMethodId} onChange={e => setPay({ ...pay, paymentMethodId: e.target.value })}>{methods.map(m => <MenuItem key={m.paymentMethodId} value={m.paymentMethodId}>{m.methodName}</MenuItem>)}</TextField>
          <TextField label="رقم المرجع / الايصال" value={pay.referenceNumber} onChange={e => setPay({ ...pay, referenceNumber: e.target.value })} />
          <TextField label="ملاحظات الدفع" value={pay.notes} onChange={e => setPay({ ...pay, notes: e.target.value })} />
        </Box></DialogContent>
        <DialogActions><Button onClick={() => setDlg(null)}>إلغاء</Button><Button variant="contained" onClick={savePayment} disabled={!(Number(pay.amount) > 0) || !pay.paymentMethodId}>حفظ الدفعة</Button></DialogActions>
      </Dialog>

      {/* حوار طلب استرداد */}
      <Dialog open={dlg === 'refund'} onClose={() => setDlg(null)} fullWidth maxWidth="xs">
        <DialogTitle>طلب استرداد مبلغ</DialogTitle>
        <DialogContent><Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField label="المبلغ المراد استرداده" type="number" value={ref.refundAmount} onChange={e => setRef({ ...ref, refundAmount: e.target.value })} helperText={fin ? `المبلغ القابل للاسترداد: ${money(fin.refundableAmount, cur)}` : ''} />
          <TextField select label="سبب الاسترداد" value={ref.refundReasonId} onChange={e => setRef({ ...ref, refundReasonId: e.target.value })}>{reasons.map(r => <MenuItem key={r.refundReasonId} value={r.refundReasonId}>{r.reasonName}</MenuItem>)}</TextField>
          <TextField select label="خصماً من عملة دفع سابقة (اختياري)" value={ref.paymentId} onChange={e => setRef({ ...ref, paymentId: e.target.value })}>
            <MenuItem value="">— بدون تخصيص —</MenuItem>{(fin?.payments ?? []).filter((p: any) => p.status === 'SUCCESSFUL').map((p: any) => <MenuItem key={p.paymentId} value={p.paymentId}>#{p.paymentId} — {money(p.amount, cur)}</MenuItem>)}
          </TextField>
          <TextField label="طريقة الاسترداد" value={ref.refundMethod} onChange={e => setRef({ ...ref, refundMethod: e.target.value })} placeholder="نقداً / تحويل بنكي" />
          <TextField label="رقم المرجع" value={ref.referenceNumber} onChange={e => setRef({ ...ref, referenceNumber: e.target.value })} />
        </Box></DialogContent>
        <DialogActions><Button onClick={() => setDlg(null)}>إلغاء</Button><Button variant="contained" onClick={saveRefund} disabled={!(Number(ref.refundAmount) > 0) || !ref.refundReasonId}>إرسال الطلب</Button></DialogActions>
      </Dialog>
    </>
  );
}
