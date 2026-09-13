export type DecorProduct = { id: string; url: string; name: string; retailer: string; quantity: number; price: string; currency: string; image: string };
export const MAX_DECOR_PRODUCTS = 20;
export function webUrl(value: unknown): string {
  if (typeof value !== "string" || value.length > 2048) return "";
  try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password ? u.href : ""; } catch { return ""; }
}
export function normalizeProducts(value: unknown): DecorProduct[] {
  if (!Array.isArray(value) || value.length > MAX_DECOR_PRODUCTS) throw new Error("Add up to 20 items per decor element.");
  return value.map((p) => {
    if (!p || typeof p !== "object") throw new Error("Invalid decor item.");
    const text = (v: unknown, max = 200) => typeof v === "string" ? v.trim().slice(0, max) : "";
    const url = webUrl(p.url), image = webUrl(p.image);
    if (p.url && !url || p.image && !image) throw new Error("Use a valid https link for products and pictures.");
    const quantity = Number(p.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) throw new Error("Quantity must be a whole number from 1 to 100,000.");
    const price = text(p.price, 20);
    if (price && (!/^\d+(\.\d{1,2})?$/.test(price) || Number(price) > 10000000)) throw new Error("Enter a valid price, with up to two decimal places.");
    const currency = text(p.currency, 3).toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Enter a three-letter currency code, such as USD.");
    return { id: text(p.id, 80), url, image, name: text(p.name), retailer: text(p.retailer, 100), quantity, price, currency };
  }).filter(p => p.url || p.name || p.image || p.price || p.retailer);
}
