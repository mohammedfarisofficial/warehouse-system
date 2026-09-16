import { getDb } from '../src/database';

export function cleanupItem(itemCode: string): void {
  const db = getDb();
  db.exec(`DELETE FROM transactions WHERE item_code='${itemCode}'`);
  db.exec(`DELETE FROM reservations WHERE item_code='${itemCode}'`);
  db.exec(`DELETE FROM stock WHERE item_code='${itemCode}'`);
}

export function insertTestStock(
  itemCode: string,
  location: string,
  onHand: number,
  reserved = 0,
): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO stock (item_code, location, on_hand, reserved, version) VALUES (?, ?, ?, ?, 0)`,
  ).run(itemCode, location, onHand, reserved);
}

export function getTestStock(
  itemCode: string,
  location: string,
): { on_hand: number; reserved: number } {
  const db = getDb();
  return db
    .prepare(`SELECT on_hand, reserved FROM stock WHERE item_code = ? AND location = ?`)
    .get(itemCode, location) as { on_hand: number; reserved: number };
}
