/**
 * Lightweight per-tenant shopping cart, persisted in localStorage.
 * Keyed by tenant slug so a user can have separate carts per shop
 * if they happen to visit two storefronts in the same browser.
 */

export interface CartItem {
  id: string;        // product id
  name: string;
  price: number;
  image: string | null;
  qty: number;
  stock: number;
}

const KEY = (tenantSlug: string) => `kpsp:cart:${tenantSlug}`;

export function readCart(tenantSlug: string): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY(tenantSlug));
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function writeCart(tenantSlug: string, items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY(tenantSlug), JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('cart:update', { detail: { tenantSlug } }));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function addToCart(tenantSlug: string, item: Omit<CartItem, 'qty'> & { qty?: number }): void {
  const cart = readCart(tenantSlug);
  const existing = cart.find((c) => c.id === item.id);
  if (existing) {
    existing.qty = Math.min(existing.stock, existing.qty + (item.qty || 1));
  } else {
    cart.push({ ...item, qty: Math.min(item.stock, item.qty || 1) });
  }
  writeCart(tenantSlug, cart);
}

export function updateQty(tenantSlug: string, id: string, qty: number): void {
  const cart = readCart(tenantSlug)
    .map((c) => (c.id === id ? { ...c, qty: Math.max(0, Math.min(c.stock, qty)) } : c))
    .filter((c) => c.qty > 0);
  writeCart(tenantSlug, cart);
}

export function removeFromCart(tenantSlug: string, id: string): void {
  writeCart(
    tenantSlug,
    readCart(tenantSlug).filter((c) => c.id !== id),
  );
}

export function clearCart(tenantSlug: string): void {
  writeCart(tenantSlug, []);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, it) => sum + it.price * it.qty, 0);
}
