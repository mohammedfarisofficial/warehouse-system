export enum ReservationState {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface ReservationRow {
  id: string;
  request_id: string;
  item_code: string;
  location: string;
  qty: number;
  state: ReservationState;
  created_at: number;
  expires_at: number;
  confirmed_at: number | null;
  cancelled_at: number | null;
}

export interface PlaceReservationInput {
  itemCode: string;
  location: string;
  qty: number;
  requestId: string;
}

export interface PlaceReservationResult {
  ok: true;
  id: string;
  state: ReservationState;
  expiresAt: number;
  replay?: boolean;
}

export interface StateTransitionResult {
  ok: true;
  state: ReservationState;
  replay?: boolean;
}
