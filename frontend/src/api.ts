const BASE = ((import.meta.env.VITE_API_BASE_URL as string) || 'https://localhost:57777/api').replace(/\/$/, '');

export const API_BASE = BASE;

function errorMessage(body: any, status: number): string {
  if (typeof body === 'string' && body) return body;
  if (body?.message) return body.message;
  if (body?.errors) return Object.values(body.errors).flat().join(' ');
  return body?.title || `Request failed (${status})`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
  } catch {
    throw new Error(`Cannot reach the API at ${BASE}. Check that the backend is running, the HTTPS certificate is trusted, and CORS allows this origin.`);
  }
  const text = await res.text();
  let body: any = null;
  if (text) { try { body = JSON.parse(text); } catch { body = text; } }
  if (!res.ok) throw new Error(errorMessage(body, res.status));
  // Several backend services answer 200 with { ok:false, message } on business-rule errors.
  if (body && typeof body === 'object' && !Array.isArray(body) && body.ok === false) {
    throw new Error(body.message || 'Operation failed.');
  }
  return body as T;
}

const get = <T = any>(path: string) => request<T>(path);
const post = <T = any>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
const put = <T = any>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) });
const qs = (o: Record<string, string | number | undefined | null>) => {
  const p = Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return p.length ? '?' + p.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&') : '';
};

export const api = {
  health: () => fetch(`${BASE.replace(/\/api$/, '')}/health`).then(r => r.ok).catch(() => false),

  // master data
  hotels: () => get<any[]>('/hotels'),
  createHotel: (body: any) => post('/hotels', body),
  updateHotel: (id: number, body: any) => put(`/hotels/${id}`, body),

  buildings: () => get<any[]>('/buildings'),
  createBuilding: (body: any) => post('/buildings', body),

  locations: () => get<any[]>('/pricing-locations'),
  createLocation: (body: any) => post('/pricing-locations', body),

  floors: (buildingId?: number) => get<any[]>(`/floors${qs({ buildingId })}`),
  createFloor: (body: any) => post('/floors', body),

  roomTypes: () => get<any[]>('/room-types'),
  createRoomType: (body: any) => post('/room-types', body),

  roomStatuses: () => get<any[]>('/room-statuses'),

  rooms: () => get<any[]>('/rooms'),
  createRoom: (body: any) => post('/rooms', body),

  roomBlocks: (roomId: number) => get<any[]>(`/rooms/${roomId}/blocks`),
  createRoomBlock: (roomId: number, body: any) => post(`/rooms/${roomId}/blocks`, body),
  roomBlockReasons: () => get<any[]>('/room-block-reasons'),

  ageCategories: (hotelId?: number) => get<any[]>(`/age-categories${qs({ hotelId })}`),
  createAgeCategory: (body: any) => post('/age-categories', body),

  // pricing
  pricingPeriods: (hotelId?: number) => get<any[]>(`/pricing-periods${qs({ hotelId })}`),
  createPricingPeriod: (body: any) => post('/pricing-periods', body),

  roomPrices: (roomId?: number, pricingPeriodId?: number) => get<any[]>(`/room-prices${qs({ roomId, pricingPeriodId })}`),
  setRoomPrice: (body: any) => post('/room-prices', body),
  calculateRoomPrice: (body: any) => post('/pricing/calculate-room', body),
  promotions: (hotelId?: number) => get<any[]>(`/promotions${qs({ hotelId })}`),
  createPromotion: (body: any) => post('/promotions', body),

  // availability & reservations
  availability: (body: any) => post('/availability/search', body),
  createReservation: (body: any) => post('/reservations', body),
  reservation: (id: number) => get(`/reservations/${id}`),
  confirmReservation: (id: number) => post(`/reservations/${id}/confirm`),
  cancelReservation: (id: number) => post(`/reservations/${id}/cancel`),

  // payments & refunds
  paymentMethods: () => get<any[]>('/payment-methods'),
  refundReasons: () => get<any[]>('/refund-reasons'),
  reservationFinance: (id: number) => get(`/reservations/${id}/finance`),
  addPayment: (body: any) => post('/payments', body),
  createRefund: (body: any) => post('/refunds', body),
  changeRefundStatus: (id: number, status: string) => post(`/refunds/${id}/status`, { status }),

  // expenses & finance
  expenseCategories: (hotelId: number) => get<any[]>(`/finance/expense-categories${qs({ hotelId })}`),
  createExpenseCategory: (body: any) => post('/finance/expense-categories', body),
  expenses: (hotelId: number, from: string, to: string) => get<any[]>(`/finance/expenses${qs({ hotelId, from, to })}`),
  createExpense: (body: any) => post('/finance/expenses', body),
  voidExpense: (id: number) => post(`/finance/expenses/${id}/void`),
  financeSummary: (hotelId: number, from: string, to: string) => get(`/finance/summary${qs({ hotelId, from, to })}`),
};

