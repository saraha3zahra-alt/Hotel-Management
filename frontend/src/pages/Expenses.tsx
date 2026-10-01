import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { api } from '../api';
import { useHotel } from '../hotelContext';
import { HotelGuard, PageTitle, Stat, StatusChip, fmtDate, money, monthEndIso, monthStartIso, todayIso } from '../components/ui';

const METHODS = ['CASH', 'CARD', 'BANK_TRANSFER', 'OTHER'];
const METHOD_LABELS: Record<string, string> = {
  CASH: 'نقداً', CARD: 'بطاقة ائتمانية', BANK_TRANSFER: 'تحويل بنكي', OTHER: 'طريقة أخرى',
};

function Content() {
  const { hotel, hotelId } = useHotel();
  const cur = hotel?.currencyCode ?? 'EGP';
  const [from, setFrom] = useState(monthStartIso()); const [to, setTo] = useState(monthEndIso());
  const [cats, setCats] = useState<any[]>([]); const [rows, setRows] = useState<any[]>([]); const [sum, setSum] = useState<any>(null);
  const [error, setError] = useState(''); const [info, setInfo] = useState('');
  const [dlg, setDlg] = useState<'expense' | 'category' | null>(null);
  const [exp, setExp] = useState({ expenseCategoryId: '', expenseDate: todayIso(), amount: '', description: '', supplierName: '', referenceNumber: '', paymentMethod: 'CASH', status: 'POSTED' });
  const [cat, setCat] = useState({ categoryCode: '', categoryName: '' });

  const load = useCallback(() => {
    if (!hotelId) return;
    Promise.all([api.expenseCategories(hotelId), api.expenses(hotelId, from, to), api.financeSummary(hotelId, from, to)])
      .then(([c, e, s]) => { setCats(c); setRows(e); setSum(s); setError(''); })
      .catch(e => setError(e.message));
  }, [hotelId, from, to]);
  useEffect(load, [load]);

  const catName = (id: number) => cats.find(c => c.expenseCategoryId === id)?.categoryName ?? id;
  const run = async (fn: () => Promise<any>, ok: string, close = true) => {
    try { await fn(); setInfo(ok); setError(''); if (close) setDlg(null); load(); } catch (e: any) { setError(e.message); }
  };
  const saveExpense = () => run(() => api.createExpense({
    hotelId, expenseCategoryId: Number(exp.expenseCategoryId), expenseDate: exp.expenseDate, amount: Number(exp.amount),
    description: exp.description || null, supplierName: exp.supplierName || null, referenceNumber: exp.referenceNumber || null, paymentMethod: exp.paymentMethod, status: exp.status,
  }), 'تم تسجيل المصروف بنجاح.');
  const saveCategory = () => run(() => api.createExpenseCategory({ hotelId, categoryCode: cat.categoryCode, categoryName: cat.categoryName }), 'تم إضافة تصنيف المصروفات بنجاح.')
    .then(() => setCat({ categoryCode: '', categoryName: '' }));

  return (
    <>
      <PageTitle title="المصروفات والمالية" subtitle="إدارة المصروفات التشغيلية والملخص المالي بالفندق للفترة المحددة"
        action={<Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => setDlg('category')}>تصنيف جديد</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDlg('expense')} disabled={!cats.length}>تسجيل مصروف جديد</Button>
        </Stack>} />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {info && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInfo('')}>{info}</Alert>}
      {!cats.length && <Alert severity="info" sx={{ mb: 2 }}>قم بإنشاء تصنيف مصروفات أولاً (مثل: مرافق وصيانة، رواتب، تجهيزات) لتمكين إضافة المصروفات.</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}><Stack direction="row" spacing={2} alignItems="center">
        <TextField label="من تاريخ" type="date" size="small" value={from} onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField label="إلى تاريخ" type="date" size="small" value={to} onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
      </Stack></Paper>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><Stat label="النقدية المحصلة" value={money(sum?.cashIn, cur)} color="success.main" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><Stat label="المبالغ المستردة" value={money(sum?.refunds, cur)} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><Stat label="المصروفات التشغيلية" value={money(sum?.operatingExpenses, cur)} color="error.main" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><Stat label="صافي النقدية التشغيلية" value={money(sum?.netOperatingCash, cur)} color="primary.main" /></Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>سجل المصروفات المسجلة</Typography>
        <Table size="small">
          <TableHead><TableRow><TableCell>التاريخ</TableCell><TableCell>التصنيف</TableCell><TableCell>الوصف / البيان</TableCell><TableCell>المورد</TableCell><TableCell>طريقة الدفع</TableCell><TableCell align="right">المبلغ</TableCell><TableCell>الحالة</TableCell><TableCell align="right">إلغاء (Void)</TableCell></TableRow></TableHead>
          <TableBody>
            {rows.map(x => (
              <TableRow key={x.expenseId}>
                <TableCell>{fmtDate(x.expenseDate)}</TableCell><TableCell><b>{catName(x.expenseCategoryId)}</b></TableCell>
                <TableCell>{x.description || '—'}</TableCell><TableCell>{x.supplierName || '—'}</TableCell><TableCell>{METHOD_LABELS[x.paymentMethod] || x.paymentMethod}</TableCell>
                <TableCell align="right"><b>{money(x.amount, cur)}</b></TableCell><TableCell><StatusChip status={x.status} /></TableCell>
                <TableCell align="right">{x.status !== 'VOID' && <Button size="small" color="error" onClick={() => window.confirm('هل أنت تأكد من إبطال وإلغاء هذا المصروف؟') && run(() => api.voidExpense(x.expenseId), 'تم إبطال المصروف.', false)}>إلغاء المصروف</Button>}</TableCell>
              </TableRow>
            ))}
            {!rows.length && <TableRow><TableCell colSpan={8} sx={{ color: 'text.secondary' }}>لا توجد مصروفات مسجلة لهذه الفترة الزمنية.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      {/* حوار إضافة مصروف */}
      <Dialog open={dlg === 'expense'} onClose={() => setDlg(null)} fullWidth maxWidth="sm">
        <DialogTitle>تسجيل مصروف تشغيلي جديد</DialogTitle>
        <DialogContent><Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField select label="تصنيف المصروف" value={exp.expenseCategoryId} onChange={e => setExp({ ...exp, expenseCategoryId: e.target.value })}>{cats.map(c => <MenuItem key={c.expenseCategoryId} value={c.expenseCategoryId}>{c.categoryName}</MenuItem>)}</TextField>
          <Stack direction="row" spacing={2}>
            <TextField label="تاريخ المصروف" type="date" value={exp.expenseDate} onChange={e => setExp({ ...exp, expenseDate: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="المبلغ" type="number" value={exp.amount} onChange={e => setExp({ ...exp, amount: e.target.value })} fullWidth />
          </Stack>
          <TextField label="الوصف والبيان التفصيلي" value={exp.description} onChange={e => setExp({ ...exp, description: e.target.value })} inputProps={{ maxLength: 500 }} />
          <Stack direction="row" spacing={2}>
            <TextField label="اسم المورد / الشركة" value={exp.supplierName} onChange={e => setExp({ ...exp, supplierName: e.target.value })} fullWidth />
            <TextField label="رقم المرجع / الفاتورة" value={exp.referenceNumber} onChange={e => setExp({ ...exp, referenceNumber: e.target.value })} fullWidth />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField select label="طريقة الدفع" value={exp.paymentMethod} onChange={e => setExp({ ...exp, paymentMethod: e.target.value })} fullWidth>{METHODS.map(m => <MenuItem key={m} value={m}>{METHOD_LABELS[m] || m}</MenuItem>)}</TextField>
            <TextField select label="حالة المصروف" value={exp.status} onChange={e => setExp({ ...exp, status: e.target.value })} fullWidth><MenuItem value="POSTED">مؤكد ومرحل (Posted)</MenuItem><MenuItem value="DRAFT">مسودة (Draft)</MenuItem></TextField>
          </Stack>
        </Box></DialogContent>
        <DialogActions><Button onClick={() => setDlg(null)}>إلغاء</Button><Button variant="contained" onClick={saveExpense} disabled={!exp.expenseCategoryId || !(Number(exp.amount) > 0)}>حفظ المصروف</Button></DialogActions>
      </Dialog>

      {/* حوار تصنيف مصروفات */}
      <Dialog open={dlg === 'category'} onClose={() => setDlg(null)} fullWidth maxWidth="xs">
        <DialogTitle>إضافة تصنيف مصروفات جديد</DialogTitle>
        <DialogContent><Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField label="كود التصنيف" value={cat.categoryCode} onChange={e => setCat({ ...cat, categoryCode: e.target.value })} inputProps={{ maxLength: 50 }} placeholder="مثال: UTIL, SALARY, MAINT" />
          <TextField label="اسم التصنيف" value={cat.categoryName} onChange={e => setCat({ ...cat, categoryName: e.target.value })} inputProps={{ maxLength: 150 }} placeholder="مثال: المرافق والصيانة" />
        </Box></DialogContent>
        <DialogActions><Button onClick={() => setDlg(null)}>إلغاء</Button><Button variant="contained" onClick={saveCategory} disabled={!cat.categoryCode.trim() || !cat.categoryName.trim()}>إضافة التصنيف</Button></DialogActions>
      </Dialog>
    </>
  );
}
export default function Expenses() { return <HotelGuard><Content /></HotelGuard>; }
