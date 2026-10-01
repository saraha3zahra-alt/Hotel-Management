const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
async function request<T>(path:string, options:RequestInit={}) : Promise<T> {
  const res = await fetch(`${BASE}${path}`, {headers:{'Content-Type':'application/json',...(options.headers||{})}, ...options});
  if(!res.ok){let body: any={}; try{body=await res.json()}catch{}; throw new Error(body.message || body.title || `Request failed (${res.status})`);}
  if(res.status===204) return undefined as T; return res.json();
}
export const api={
  health:()=>fetch(`${BASE.replace(/\/api$/,'')}/health`).then(r=>r.ok),
  hotels:()=>request<any[]>('/hotels'),
  buildings:()=>request<any[]>('/buildings'),
  floors:(buildingId?:number)=>request<any[]>(`/floors${buildingId?`?buildingId=${buildingId}`:''}`),
  locations:()=>request<any[]>('/pricing-locations'),
  roomTypes:()=>request<any[]>('/room-types'),
  roomStatuses:()=>request<any[]>('/room-statuses'),
  rooms:()=>request<any[]>('/rooms'),
  ageCategories:(hotelId?:number)=>request<any[]>(`/age-categories${hotelId?`?hotelId=${hotelId}`:''}`),
  pricingPeriods:(hotelId?:number)=>request<any[]>(`/pricing-periods${hotelId?`?hotelId=${hotelId}`:''}`),
  roomPrices:(roomId?:number, pricingPeriodId?:number)=>request<any[]>(`/room-prices?${roomId?`roomId=${roomId}&`:''}${pricingPeriodId?`pricingPeriodId=${pricingPeriodId}`:''}`),
  promotions:(hotelId?:number)=>request<any[]>(`/promotions${hotelId?`?hotelId=${hotelId}`:''}`),
  reservations:(id:number)=>request<any>(`/reservations/${id}`),
  availability:(body:any)=>request<any[]>('/availability/search',{method:'POST',body:JSON.stringify(body)}),
  financeSummary:(hotelId:number,from:string,to:string)=>request<any>(`/finance/summary?hotelId=${hotelId}&from=${from}&to=${to}`),
  expenses:(hotelId:number,from:string,to:string)=>request<any[]>(`/finance/expenses?hotelId=${hotelId}&from=${from}&to=${to}`),
};
