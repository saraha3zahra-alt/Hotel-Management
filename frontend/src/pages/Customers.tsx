import { useState, useMemo } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationCity as CityIcon,
  Badge as BadgeIcon,
  BookOnline as BookIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PageTitle, Stat } from '../components/ui';

// Registered customers dataset matching the 50 seeded hotel guests in database
const INITIAL_CUSTOMERS = [
  { id: 1, firstName: 'محمد', lastName: 'علي', phone: '0107832390', email: 'guest1@example.com', nationalId: '2952144839923', city: 'القاهرة', totalBookings: 8, totalSpent: 28500 },
  { id: 2, firstName: 'منى', lastName: 'منصور', phone: '0126717652', email: 'guest2@example.com', nationalId: '2954659684175', city: 'الإسكندرية', totalBookings: 6, totalSpent: 19200 },
  { id: 3, firstName: 'عمر', lastName: 'حسين', phone: '0125113165', email: 'guest3@example.com', nationalId: '2951703416220', city: 'الأقصر', totalBookings: 7, totalSpent: 32000 },
  { id: 4, firstName: 'محمود', lastName: 'سليم', phone: '0152172347', email: 'guest4@example.com', nationalId: '2955323292783', city: 'الغردقة', totalBookings: 9, totalSpent: 45000 },
  { id: 5, firstName: 'علي', lastName: 'سليم', phone: '0102556338', email: 'guest5@example.com', nationalId: '2953865336621', city: 'الإسكندرية', totalBookings: 5, totalSpent: 17500 },
  { id: 6, firstName: 'أحمد', lastName: 'علي', phone: '0159001453', email: 'guest6@example.com', nationalId: '2956434515333', city: 'القاهرة', totalBookings: 10, totalSpent: 52000 },
  { id: 7, firstName: 'يوسف', lastName: 'حسين', phone: '0154470583', email: 'guest7@example.com', nationalId: '2959420556109', city: 'القاهرة', totalBookings: 4, totalSpent: 14000 },
  { id: 8, firstName: 'منى', lastName: 'سليم', phone: '0159156023', email: 'guest8@example.com', nationalId: '2957096689979', city: 'شرم الشيخ', totalBookings: 6, totalSpent: 26000 },
  { id: 9, firstName: 'محمد', lastName: 'عفيفي', phone: '0112385968', email: 'guest9@example.com', nationalId: '2959219046621', city: 'طنطا', totalBookings: 5, totalSpent: 18000 },
  { id: 10, firstName: 'مصطفى', lastName: 'حسين', phone: '0127563141', email: 'guest10@example.com', nationalId: '2954796392886', city: 'الغردقة', totalBookings: 7, totalSpent: 31000 },
  { id: 11, firstName: 'منى', lastName: 'صالح', phone: '0121273614', email: 'guest11@example.com', nationalId: '2957993570526', city: 'القاهرة', totalBookings: 8, totalSpent: 39000 },
  { id: 12, firstName: 'مريم', lastName: 'حسن', phone: '0159925443', email: 'guest12@example.com', nationalId: '2959846457062', city: 'طنطا', totalBookings: 4, totalSpent: 12500 },
  { id: 13, firstName: 'هبة', lastName: 'رضا', phone: '0119117016', email: 'guest13@example.com', nationalId: '2955211965285', city: 'الإسكندرية', totalBookings: 6, totalSpent: 22000 },
  { id: 14, firstName: 'رانيا', lastName: 'فاروق', phone: '0158739270', email: 'guest14@example.com', nationalId: '2951189536311', city: 'الإسكندرية', totalBookings: 5, totalSpent: 19500 },
  { id: 15, firstName: 'فاطمة', lastName: 'حسن', phone: '0105301053', email: 'guest15@example.com', nationalId: '2958726168903', city: 'طنطا', totalBookings: 7, totalSpent: 27500 },
  { id: 16, firstName: 'نور', lastName: 'بدوي', phone: '0151005968', email: 'guest16@example.com', nationalId: '2959858837238', city: 'أسوان', totalBookings: 9, totalSpent: 48000 },
  { id: 17, firstName: 'محمود', lastName: 'عبدالله', phone: '0151143640', email: 'guest17@example.com', nationalId: '2952621173299', city: 'شرم الشيخ', totalBookings: 6, totalSpent: 24000 },
  { id: 18, firstName: 'منى', lastName: 'السيد', phone: '0125404697', email: 'guest18@example.com', nationalId: '2959399951402', city: 'القاهرة', totalBookings: 5, totalSpent: 16000 },
  { id: 19, firstName: 'رانيا', lastName: 'حسين', phone: '0156844635', email: 'guest19@example.com', nationalId: '2959692121555', city: 'الإسكندرية', totalBookings: 8, totalSpent: 37000 },
  { id: 20, firstName: 'نور', lastName: 'عبدالله', phone: '0117242970', email: 'guest20@example.com', nationalId: '2953872305932', city: 'الجيزة', totalBookings: 6, totalSpent: 21000 },
  { id: 21, firstName: 'محمد', lastName: 'رضا', phone: '0156136582', email: 'guest21@example.com', nationalId: '2959228397956', city: 'الأقصر', totalBookings: 7, totalSpent: 29500 },
  { id: 22, firstName: 'مريم', lastName: 'إبراهيم', phone: '0129675563', email: 'guest22@example.com', nationalId: '2957825970320', city: 'الأقصر', totalBookings: 4, totalSpent: 15000 },
  { id: 23, firstName: 'محمد', lastName: 'جاد', phone: '0118629287', email: 'guest23@example.com', nationalId: '2953870958601', city: 'أسوان', totalBookings: 8, totalSpent: 36500 },
  { id: 24, firstName: 'فاطمة', lastName: 'عفيفي', phone: '0156097022', email: 'guest24@example.com', nationalId: '2954325695028', city: 'الإسكندرية', totalBookings: 6, totalSpent: 23000 },
  { id: 25, firstName: 'شيماء', lastName: 'حسين', phone: '0116764169', email: 'guest25@example.com', nationalId: '2953148009847', city: 'شرم الشيخ', totalBookings: 5, totalSpent: 18500 },
  { id: 26, firstName: 'مريم', lastName: 'حسن', phone: '0122557887', email: 'guest26@example.com', nationalId: '2953174548342', city: 'المنصورة', totalBookings: 7, totalSpent: 30000 },
  { id: 27, firstName: 'سارة', lastName: 'علي', phone: '0151721841', email: 'guest27@example.com', nationalId: '2954825994259', city: 'المنصورة', totalBookings: 6, totalSpent: 25500 },
  { id: 28, firstName: 'طارق', lastName: 'صالح', phone: '0112427748', email: 'guest28@example.com', nationalId: '2957872385235', city: 'الجيزة', totalBookings: 9, totalSpent: 43000 },
  { id: 29, firstName: 'سارة', lastName: 'منصور', phone: '0119962117', email: 'guest29@example.com', nationalId: '2959168567759', city: 'الغردقة', totalBookings: 5, totalSpent: 19000 },
  { id: 30, firstName: 'منى', lastName: 'رضا', phone: '0105309264', email: 'guest30@example.com', nationalId: '2959019355396', city: 'أسوان', totalBookings: 8, totalSpent: 38000 },
  { id: 31, firstName: 'منى', lastName: 'سليم', phone: '0119409713', email: 'guest31@example.com', nationalId: '2954972668577', city: 'القاهرة', totalBookings: 6, totalSpent: 22500 },
  { id: 32, firstName: 'آية', lastName: 'صالح', phone: '0156761211', email: 'guest32@example.com', nationalId: '2955520175510', city: 'الغردقة', totalBookings: 7, totalSpent: 31500 },
  { id: 33, firstName: 'مريم', lastName: 'بدوي', phone: '0156293329', email: 'guest33@example.com', nationalId: '2952540478304', city: 'الغردقة', totalBookings: 5, totalSpent: 17000 },
  { id: 34, firstName: 'سارة', lastName: 'رضا', phone: '0114031248', email: 'guest34@example.com', nationalId: '2954462122945', city: 'الأقصر', totalBookings: 8, totalSpent: 34000 },
  { id: 35, firstName: 'منى', lastName: 'منصور', phone: '0123933984', email: 'guest35@example.com', nationalId: '2956911611538', city: 'الجيزة', totalBookings: 6, totalSpent: 24500 },
  { id: 36, firstName: 'يوسف', lastName: 'عبدالله', phone: '0129436087', email: 'guest36@example.com', nationalId: '2952383984549', city: 'الأقصر', totalBookings: 7, totalSpent: 29000 },
  { id: 37, firstName: 'محمد', lastName: 'صالح', phone: '0156008242', email: 'guest37@example.com', nationalId: '2955756529851', city: 'أسوان', totalBookings: 9, totalSpent: 46000 },
  { id: 38, firstName: 'حسن', lastName: 'بدوي', phone: '0155461308', email: 'guest38@example.com', nationalId: '2958906389141', city: 'أسوان', totalBookings: 5, totalSpent: 16500 },
  { id: 39, firstName: 'حسن', lastName: 'جاد', phone: '0159405321', email: 'guest39@example.com', nationalId: '2959259335466', city: 'أسوان', totalBookings: 6, totalSpent: 23500 },
  { id: 40, firstName: 'محمد', lastName: 'إبراهيم', phone: '0101334078', email: 'guest40@example.com', nationalId: '2955861427915', city: 'شرم الشيخ', totalBookings: 8, totalSpent: 37500 },
  { id: 41, firstName: 'محمد', lastName: 'فاروق', phone: '0116466712', email: 'guest41@example.com', nationalId: '2959033595700', city: 'المنصورة', totalBookings: 7, totalSpent: 30500 },
  { id: 42, firstName: 'آية', lastName: 'عفيفي', phone: '0108774674', email: 'guest42@example.com', nationalId: '2959355504706', city: 'القاهرة', totalBookings: 5, totalSpent: 18000 },
  { id: 43, firstName: 'سارة', lastName: 'جاد', phone: '0154818116', email: 'guest43@example.com', nationalId: '2956383148600', city: 'الإسكندرية', totalBookings: 6, totalSpent: 26500 },
  { id: 44, firstName: 'نور', lastName: 'حسين', phone: '0151728244', email: 'guest44@example.com', nationalId: '2953607296630', city: 'الغردقة', totalBookings: 8, totalSpent: 39500 },
  { id: 45, firstName: 'مصطفى', lastName: 'حسن', phone: '0105520624', email: 'guest45@example.com', nationalId: '2953253879449', city: 'شرم الشيخ', totalBookings: 7, totalSpent: 32500 },
  { id: 46, firstName: 'خالد', lastName: 'علي', phone: '0158841535', email: 'guest46@example.com', nationalId: '2956257626094', city: 'شرم الشيخ', totalBookings: 10, totalSpent: 54000 },
  { id: 47, firstName: 'محمود', lastName: 'عبدالله', phone: '0155685872', email: 'guest47@example.com', nationalId: '2954467647302', city: 'شرم الشيخ', totalBookings: 6, totalSpent: 25000 },
  { id: 48, firstName: 'محمود', lastName: 'بدوي', phone: '0157818484', email: 'guest48@example.com', nationalId: '2952926532626', city: 'القاهرة', totalBookings: 5, totalSpent: 19000 },
  { id: 49, firstName: 'داليا', lastName: 'الشريف', phone: '0159678717', email: 'guest49@example.com', nationalId: '2952531010869', city: 'الغردقة', totalBookings: 8, totalSpent: 38500 },
  { id: 50, firstName: 'عمر', lastName: 'حسن', phone: '0115048542', email: 'guest50@example.com', nationalId: '2955176415809', city: 'المنصورة', totalBookings: 6, totalSpent: 24000 }
];

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog state for adding a new guest
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newGuest, setNewGuest] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    nationalId: '',
    city: 'القاهرة'
  });
  const [successMsg, setSuccessMsg] = useState('');

  // Extract unique cities
  const citiesList = useMemo(() => {
    const set = new Set(customers.map((c) => c.city));
    return Array.from(set);
  }, [customers]);

  // Filter logic
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.nationalId.includes(q) ||
        c.city.toLowerCase().includes(q);

      const matchesCity = selectedCity === 'ALL' || c.city === selectedCity;

      return matchesSearch && matchesCity;
    });
  }, [customers, searchQuery, selectedCity]);

  // Pagination handler
  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddGuest = () => {
    if (!newGuest.firstName || !newGuest.lastName || !newGuest.phone) return;
    const created = {
      id: customers.length + 1,
      firstName: newGuest.firstName,
      lastName: newGuest.lastName,
      phone: newGuest.phone,
      email: newGuest.email || `guest${customers.length + 1}@example.com`,
      nationalId: newGuest.nationalId || `295${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      city: newGuest.city,
      totalBookings: 1,
      totalSpent: 3000
    };
    setCustomers([created, ...customers]);
    setOpenAddDialog(false);
    setNewGuest({ firstName: '', lastName: '', phone: '', email: '', nationalId: '', city: 'القاهرة' });
    setSuccessMsg(`تم إضافة الضيف "${created.firstName} ${created.lastName}" بنجاح إلى سجل العملاء!`);
  };

  const paginatedCustomers = useMemo(() => {
    return filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredCustomers, page, rowsPerPage]);

  return (
    <>
      <PageTitle
        title="سجل العملاء والنزلاء"
        subtitle="عرض ومتابعة جميع الضيوف المسجلين بالفندق، بيانات الاتصال، وسجل الإقامات"
      />

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}

      {/* Overview Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="إجمالي العملاء المسجلين" value={customers.length} hint="ضيوف مسجلين بالفندق" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="المدن والمحافظات" value={citiesList.length} hint="توزيع الجذور والمدن" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="إجمالي الحجوزات والمرتجعات" value="325+" color="success.main" hint="حجز مؤكد ومنتهي" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="أكثر النزلاء تكراراً" value="أحمد علي" color="primary.main" hint="10 حجوزات صادرة" />
        </Grid>
      </Grid>

      {/* Control Bar: Search, City Filter, Add Customer */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
            <TextField
              size="small"
              placeholder="ابحث باسم العميل، الهاتف، الإيميل، أو الهوية..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
              sx={{ minWidth: 320 }}
            />

            <TextField
              select
              size="small"
              label="تصفية حسب المدينة"
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setPage(0);
              }}
              SelectProps={{ native: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
              sx={{ minWidth: 200 }}
            >
              <option value="ALL">جميع المدن ({customers.length})</option>
              {citiesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </TextField>
          </Stack>

          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setOpenAddDialog(true)}
            sx={{ whitespace: 'nowrap', px: 3 }}
          >
            إضافة ضيف جديد
          </Button>
        </Stack>
      </Paper>

      {/* Customers Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'action.hover' }}>
            <TableRow>
              <TableCell align="center">معرف العميل (ID)</TableCell>
              <TableCell>الاسم بالكامل</TableCell>
              <TableCell>رقم الهاتف</TableCell>
              <TableCell>البريد الإلكتروني</TableCell>
              <TableCell>الرقم القومي / الهوية</TableCell>
              <TableCell align="center">المدينة / المحافظة</TableCell>
              <TableCell align="center">الحجوزات</TableCell>
              <TableCell align="center">الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">لا يوجد عملاء يطابقون شروط البحث</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedCustomers.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell align="center">
                    <Chip label={`#${c.id}`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34, fontSize: '0.85rem' }}>
                        {c.firstName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {c.firstName} {c.lastName}
                        </Typography>
                        {c.totalBookings >= 8 && (
                          <Chip label="عميل VIP مميز" color="warning" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                        )}
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <PhoneIcon fontSize="inherit" color="action" />
                      <Typography variant="body2" dir="ltr">
                        {c.phone}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <EmailIcon fontSize="inherit" color="action" />
                      <Typography variant="body2">{c.email}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <BadgeIcon fontSize="inherit" color="action" />
                      <Typography variant="body2" dir="ltr" sx={{ fontFamily: 'monospace' }}>
                        {c.nationalId}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={<CityIcon fontSize="small" />}
                      label={c.city}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${c.totalBookings} إقامات`}
                      size="small"
                      color={c.totalBookings >= 7 ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="الانتقال لإدارة حجوزات هذا الضيف">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/reservations?customerId=${c.id}`)}
                      >
                        <BookIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="عدد العناصر في الصفحة:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} من إجمالي ${count}`}
        />
      </TableContainer>

      {/* Add New Guest Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>تسجيل وتوليد ضيف جديد</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="الاسم الأول"
                  fullWidth
                  size="small"
                  required
                  value={newGuest.firstName}
                  onChange={(e) => setNewGuest({ ...newGuest, firstName: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="اسم العائلة / اللقب"
                  fullWidth
                  size="small"
                  required
                  value={newGuest.lastName}
                  onChange={(e) => setNewGuest({ ...newGuest, lastName: e.target.value })}
                />
              </Grid>
            </Grid>

            <TextField
              label="رقم الهاتف"
              fullWidth
              size="small"
              required
              placeholder="مثال: 01012345678"
              value={newGuest.phone}
              onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
            />

            <TextField
              label="البريد الإلكتروني"
              fullWidth
              size="small"
              placeholder="guest@example.com"
              value={newGuest.email}
              onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
            />

            <TextField
              label="الرقم القومي / جواز السفر"
              fullWidth
              size="small"
              placeholder="295..."
              value={newGuest.nationalId}
              onChange={(e) => setNewGuest({ ...newGuest, nationalId: e.target.value })}
            />

            <TextField
              select
              label="المدينة / المحافظة"
              fullWidth
              size="small"
              value={newGuest.city}
              onChange={(e) => setNewGuest({ ...newGuest, city: e.target.value })}
              SelectProps={{ native: true }}
            >
              {['القاهرة', 'الجيزة', 'الإسكندرية', 'المنصورة', 'طنطا', 'أسوان', 'الأقصر', 'الغردقة', 'شرم الشيخ'].map(
                (city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                )
              )}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)} color="inherit">
            إلغاء
          </Button>

          <Button
            onClick={handleAddGuest}
            variant="contained"
            disabled={!newGuest.firstName || !newGuest.lastName || !newGuest.phone}
          >
            تأكيد وحفظ الضيف
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
