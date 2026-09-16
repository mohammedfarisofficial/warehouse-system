import { getDb } from '../../database';
import type { StockRow } from '../../core/types/stock.types.js';

export function findByItemAndLocation(itemCode: string, location: string): StockRow | undefined {
  return getDb()
    .prepare(`SELECT on_hand, reserved, version FROM stock WHERE item_code = ? AND location = ?`)
    .get(itemCode, location) as StockRow | undefined;
}

export function findAllByItem(itemCode: string): StockRow[] {
  return getDb()
    .prepare(`SELECT * FROM stock WHERE item_code = ?`)
    .all(itemCode) as StockRow[];
}

export function insertStock(
  itemCode: string,
  location: string,
  onHand: number,
): void {
  getDb()
    .prepare(
      `INSERT INTO stock (item_code, location, on_hand, reserved, version) VALUES (?, ?, ?, 0, 0)`,
    )
    .run(itemCode, location, onHand);
}

export function updateOnHand(
  itemCode: string,
  location: string,
  newOnHand: number,
): void {
  getDb()
    .prepare(
      `UPDATE stock SET on_hand = ?, version = version + 1 WHERE item_code = ? AND location = ?`,
    )
    .run(newOnHand, itemCode, location);
}
