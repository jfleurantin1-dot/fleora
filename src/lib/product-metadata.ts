import { webUrl } from "./decor-products";

function decode(s: string) {
  return s.replace(/&(?:amp|quot|apos|lt|gt|#39|#x27);/g, x => ({"&amp;":"&", "&quot;":'"', "&apos;":"'", "&lt;":"<", "&gt;":">", "&#39;":"'", "&#x27;":"'"}[x] || x));
}
export function parseProductMetadata(html: string, pageUrl: string) {
  const meta = new Map<string, string>();
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const attrs: Record<string,string> = {};
    for (const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) attrs[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4]);
    const key = attrs.property || attrs.name;
    if (key && attrs.content) meta.set(key.toLowerCase(), attrs.content);
  }
  let product: Record<string, any> | undefined;
  function visit(v: any, depth = 0) {
    if (!v || typeof v !== "object" || depth > 12 || product) return;
    const types = Array.isArray(v["@type"]) ? v["@type"] : [v["@type"]];
    if (types.includes("Product")) { product = v; return; }
    for (const child of Object.values(v)) visit(child, depth + 1);
  }
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { visit(JSON.parse(m[1])); } catch { /* Fall back to page metadata. */ }
  }
  const p: Record<string, any> = product || {};
  const offer = Array.isArray(p.offers) ? p.offers[0] : p.offers;
  const imageValue = Array.isArray(p.image) ? p.image[0] : p.image;
  const image = typeof imageValue === "string" ? imageValue : imageValue?.url;
  const priceValue = offer?.price ?? meta.get("product:price:amount") ?? meta.get("og:price:amount");
  const price = /^\d+(\.\d{1,2})?$/.test(String(priceValue)) ? String(priceValue) : "";
  const title = p.name || meta.get("og:title") || decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  let imageUrl = "";
  try { imageUrl = webUrl(new URL(image || meta.get("og:image") || "", pageUrl).href); } catch { /* Optional preview. */ }
  if (!image && !meta.get("og:image")) imageUrl = "";
  const currency = String(offer?.priceCurrency || meta.get("product:price:currency") || "").toUpperCase();
  return { name: String(title).trim().slice(0,200), image: imageUrl, price, currency: /^[A-Z]{3}$/.test(currency) ? currency : "", retailer: (meta.get("og:site_name") || new URL(pageUrl).hostname.replace(/^www\./, "")).slice(0,100) };
}
