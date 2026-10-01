import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Checkbox, FormControlLabel, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import StarIcon from '@mui/icons-material/Star';
import HotelIcon from '@mui/icons-material/Hotel';
import { useAuth } from '../authContext';

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('admin@majestic.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور.');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      const ok = login(username, password);
      setLoading(false);
      if (ok) {
        nav('/');
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
      }
    }, 400);
  };

  const handleDemoLogin = (userType: 'admin' | 'reception') => {
    if (userType === 'admin') {
      login('admin@majestic.com', '123456');
    } else {
      login('reception@majestic.com', '123456');
    }
    nav('/');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.75) 100%), url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        p: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 440,
          width: '100%',
          borderRadius: 4,
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.15)',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        {/* Header decoration */}
        <Box
          sx={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            p: 3,
            textAlign: 'center',
            borderBottom: '3px solid #d97706',
          }}
        >
          <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d97706', borderRadius: '50%', p: 1.2, mb: 1 }}>
            <HotelIcon sx={{ color: '#ffffff', fontSize: 32 }} />
          </Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
            فنادق ماجيستك
          </Typography>
          <Stack direction="row" justifyContent="center" spacing={0.5} sx={{ color: '#fbbf24', my: 0.5 }}>
            {[...Array(5)].map((_, i) => <StarIcon key={i} sx={{ fontSize: 18 }} />)}
          </Stack>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            نظام الإدارة الفندقية والتشغيلية الشامل (Majestic System)
          </Typography>
        </Box>

        <CardContent sx={{ p: 3.5 }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#0f172a', mb: 0.5 }}>
            تسجيل الدخول للنظام
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            يرجى إدخال بيانات حسابك لمتابعة لوحة التحكم والإدارة.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="اسم المستخدم / البريد الإلكتروني"
              fullWidth
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin@majestic.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon sx={{ color: '#64748b' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="كلمة المرور"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#64748b' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <FormControlLabel
              control={<Checkbox checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} color="primary" />}
              label={<Typography variant="body2">تذكر بياناتي في هذا الجهاز</Typography>}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.3,
                fontSize: '1rem',
                fontWeight: 700,
                backgroundColor: '#0f172a',
                '&:hover': { backgroundColor: '#1e293b' },
              }}
            >
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
              تجربة سريعة للبدء:
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center">
              <Button size="small" variant="outlined" onClick={() => handleDemoLogin('admin')}>
                دخول كـ (مدير النظام)
              </Button>
              <Button size="small" variant="outlined" onClick={() => handleDemoLogin('reception')}>
                دخول كـ (استقبال)
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
