import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Avatar, Box, Button, Chip, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, MenuItem, Select, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HotelIcon from '@mui/icons-material/Hotel';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SettingsIcon from '@mui/icons-material/Settings';
import StarIcon from '@mui/icons-material/Star';
import LogoutIcon from '@mui/icons-material/Logout';
import { useHotel } from '../hotelContext';
import ChatbotWidget from './ChatbotWidget';

const items = [
  ['/', 'لوحة التحكم الرئيسيّة', DashboardIcon],
  ['/hotel', 'إعدادات الفندق والمباني', HotelIcon],
  ['/rooms', 'الغرف والحظر والصيانة', MeetingRoomIcon],
  ['/pricing', 'إدارة الأسعار والعروض', PriceChangeIcon],
  ['/customers', 'سجل العملاء والنزلاء', PeopleIcon],
  ['/reservations', 'إدارة الحجوزات', EventIcon],
  ['/payments', 'المدفوعات والاسترداد', PaymentsIcon],
  ['/expenses', 'المصروفات والمالية', AccountBalanceWalletIcon],
  ['/settings', 'إعدادات النظام والاتصال', SettingsIcon],
] as const;

const DRAWER_WIDTH = 260;

export default function Layout() {
  const [open, setOpen] = useState(true);
  const nav = useNavigate();
  const loc = useLocation();
  const { hotels, hotelId, setHotelId } = useHotel();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    nav('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <AppBar position="fixed" sx={{ zIndex: t => t.zIndex.drawer + 1, backgroundColor: '#0f172a', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => setOpen(!open)} edge="start" sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#d97706', borderRadius: '50%', p: 0.8 }}>
              <StarIcon sx={{ color: '#ffffff', fontSize: 22 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#ffffff' }}>
              نظام إدارة فنادق ماجيستك <span style={{ fontSize: '0.75em', color: '#fbbf24', fontWeight: 600 }}>(Majestic Hotels System)</span>
            </Typography>
            <Chip size="small" label="LUXURY PRO" sx={{ backgroundColor: '#d97706', color: '#fff', fontWeight: 700, ml: 1 }} />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {hotels.length > 0 && (
              <Select
                size="small"
                value={hotelId ?? ''}
                onChange={e => setHotelId(Number(e.target.value))}
                sx={{
                  color: 'white',
                  minWidth: 220,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderRadius: 2,
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#d97706' },
                  '.MuiSvgIcon-root': { color: '#fbbf24' },
                }}
              >
                {hotels.map(h => (
                  <MenuItem key={h.hotelId} value={h.hotelId}>
                    🏨 {h.hotelName === 'Class Hotel' || h.hotelName.includes('كلاس') ? 'فندق ماجيستك الرئيسي (Majestic Hotel)' : h.hotelName}
                  </MenuItem>
                ))}
              </Select>
            )}

            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'rgba(255,255,255,0.1)', p: '4px 12px', borderRadius: 3 }}>
                <Avatar sx={{ width: 32, height: 32, backgroundColor: '#d97706', fontSize: '0.85rem', fontWeight: 700 }}>
                  {user.name[0]}
                </Avatar>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 700, lineHeight: 1.1 }}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#fbbf24', fontSize: '0.72rem' }}>
                    {user.role}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={handleLogout} sx={{ color: '#f87171', ml: 0.5 }} title="تسجيل الخروج">
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="persistent"
        anchor="right"
        open={open}
        sx={{
          width: open ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          transition: 'width .2s',
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            pt: 9,
            backgroundColor: '#ffffff',
            borderColor: '#e2e8f0',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 0.5 }}>
            قائمة إدارة الفندق
          </Typography>
        </Box>
        <Divider sx={{ mb: 1 }} />
        <List sx={{ px: 1 }}>
          {items.map(([path, label, Icon]) => {
            const isSelected = path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(path);
            return (
              <ListItemButton
                key={path}
                selected={isSelected}
                onClick={() => nav(path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    '& .MuiListItemIcon-root': { color: '#fbbf24' },
                    '&:hover': { backgroundColor: '#1e293b' },
                  },
                  '&:hover': {
                    backgroundColor: '#f1f5f9',
                  },
                }}
              >
                <ListItemIcon sx={{ color: isSelected ? '#fbbf24' : '#64748b', minWidth: 40 }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{ fontSize: '0.92rem', fontWeight: isSelected ? 700 : 500 }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>

      <Box component="main" sx={{ flex: 1, minWidth: 0, p: 3, pt: 11, transition: 'margin .2s' }}>
        <Outlet />
      </Box>
      <ChatbotWidget />
    </Box>
  );
}
