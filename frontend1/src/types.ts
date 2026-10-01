export type Id = number;
export interface Hotel { hotelId: Id; hotelCode: string; hotelName: string; address?: string; phone?: string; email?: string; currencyCode: string; timezone: string; isActive: boolean; }
export interface Room { roomId: Id; floorId: Id; roomTypeId: Id; operationalStatusId: number; roomNumber: string; description?: string; notes?: string; isActive?: boolean; }
export interface RoomType { roomTypeId: Id; roomTypeCode: string; roomTypeName: string; maxOccupancy: number; maxAdults: number; maxChildren: number; }
export interface Building { buildingId: Id; hotelId: Id; buildingCode: string; buildingName: string; }
export interface PricingPeriod { pricingPeriodId: Id; hotelId: Id; periodCode: string; periodName: string; startDate: string; endDate: string; priority: number; isActive: boolean; }
export interface Customer { customerId?: Id; firstName: string; lastName: string; phone?: string; email?: string; }
export interface ApiError { message?: string; title?: string; }
