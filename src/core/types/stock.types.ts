export interface StockRow {
  item_code: string;
  location: string;
  on_hand: number;
  reserved: number;
  version: number;
}

export interface StockView extends StockRow {
  available: number;
}
export interface StockAdjustmentInput {
  itemCode: string;
  location: string;
  delta: number;
  reason?: string;
}

export interface StockAdjustmentResult {
  ok: true;
  item_code: string;
  location: string;
  on_hand: number;
  reserved: number;
}
