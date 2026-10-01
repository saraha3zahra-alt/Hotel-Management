import { useEffect, useState } from 'react';
import { Alert, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import { API_BASE, api } from '../api';
import { useHotel } from '../hotelContext';
import { PageTitle } from '../components/ui';

export default function Settings() {
  const { hotel, hotels, error } = useHotel();
  const [ok, setOk] = useState<boolean | null>(null);
  const check = () => { setOk(null); api.health().then(setOk); };
  useEffect(check, []);

  return (
    <>
      <PageTitle title="إعدادات النظام والاتصال" subtitle="معلومات حالة الاتصال بالـ Backend والبيئة التشغيلية" />
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>حالة الاتصال بالسيرفر (API)</Typography>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>مسار الخادم (API Base URL)</TableCell>
              <TableCell><code>{API_BASE}</code></TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>حالة الاتصال بالسيرفر</TableCell>
              <TableCell>
                {ok === null ? (
                  <Chip size="small" label="جاري الفحص..." />
                ) : ok ? (
                  <Chip size="small" color="success" label="السيرفر متصل ويعمل بنجاح" />
                ) : (
                  <Chip size="small" color="error" label="غير متصل بالسيرفر" />
                )}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>عدد الفنادق المسجلة</TableCell>
              <TableCell><b>{hotels.length} فندق</b></TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>الفندق الحالي النشط</TableCell>
              <TableCell>
                {hotel ? `🏨 ${hotel.hotelName === 'Class Hotel' ? 'فندق كلاس (Class Hotel)' : hotel.hotelName} (${hotel.currencyCode}, ${hotel.timezone})` : '—'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Stack direction="row" sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={check}>إعادة فحص الاتصال</Button>
        </Stack>

        {ok === false && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            السيرفر غير متصل. يرجى التأكد من تشغيل خادم الـ Backend والتأكد من إعدادات الـ CORS والشهادة الأمنية HTTPS.
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
    </>
  );
}
