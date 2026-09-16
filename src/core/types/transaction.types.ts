export enum EventType {
  StockAdjusted = 'StockAdjusted',
  ReservationPlaced = 'ReservationPlaced',
  ReservationConfirmed = 'ReservationConfirmed',
  ReservationCancelled = 'ReservationCancelled',
  ReservationExpired = 'ReservationExpired',
}

export interface TransactionRow {
  seq: number;
  ts: number;
  event_type: EventType;
  item_code: string;
  location: string;
  qty_delta: number | null;
  reservation_id: string | null;
  reason: string | null;
  resulting_on_hand: number;
  resulting_reserved: number;
}

export interface TransactionWriteParams {
  ts: number;
  eventType: EventType;
  itemCode: string;
  location: string;
  qtyDelta?: number | null;
  reservationId?: string | null;
  reason?: string | null;
  resultingOnHand: number;
  resultingReserved: number;
}

export interface PositionAtResult {
  item_code: string;
  location: string;
  as_of: number;
  on_hand: number;
  reserved: number;
  available: number;
  last_event_type: EventType;
  last_event_ts: number;
}
