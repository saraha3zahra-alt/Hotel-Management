import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';

interface Ctx { hotels: any[]; hotel: any | null; hotelId: number | null; setHotelId: (id: number) => void; loading: boolean; error: string; reload: () => void; }
const HotelCtx = createContext<Ctx>({ hotels: [], hotel: null, hotelId: null, setHotelId: () => {}, loading: true, error: '', reload: () => {} });
export const useHotel = () => useContext(HotelCtx);

const KEY = 'hms.hotelId';
const readSaved = () => { try { return Number(localStorage.getItem(KEY)) || null; } catch { return null; } };

export function HotelProvider({ children }: { children: ReactNode }) {
  const [hotels, setHotels] = useState<any[]>([]);
  const [hotelId, setId] = useState<number | null>(readSaved());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.hotels().then(list => {
      setHotels(list); setError('');
      setId(cur => (cur && list.some(h => h.hotelId === cur)) ? cur : (list[0]?.hotelId ?? null));
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [tick]);

  const setHotelId = (id: number) => { setId(id); try { localStorage.setItem(KEY, String(id)); } catch { /* ignore */ } };
  const hotel = hotels.find(h => h.hotelId === hotelId) ?? null;
  return <HotelCtx.Provider value={{ hotels, hotel, hotelId, setHotelId, loading, error, reload: () => setTick(t => t + 1) }}>{children}</HotelCtx.Provider>;
}
