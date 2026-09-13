import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { webUrl } from "@/lib/decor-products";
import { fetchProductPage } from "@/lib/fetch-product-page";
import { parseProductMetadata } from "@/lib/product-metadata";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error:"Please sign in again."},{status:401});
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({error:"Invalid request."},{status:400}); }
  if (!body || typeof body !== "object") return NextResponse.json({error:"Invalid request."},{status:400});
  const url = webUrl(body.url);
  if (!url) return NextResponse.json({error:"Paste an https product link."},{status:400});
  const {data:event} = await supabase.from("events").select("id").eq("id",String(body.eventId)).eq("client_id",user.id).maybeSingle();
  if (!event) return NextResponse.json({error:"This event is not available."},{status:403});
  try {
    const page = await fetchProductPage(url,AbortSignal.timeout(8000));
    return NextResponse.json(parseProductMetadata(page.html,page.url));
  } catch {
    return NextResponse.json({error:"This store couldn’t share its product details. You can still add them below.",retailer:new URL(url).hostname.replace(/^www\./,"")},{status:422});
  }
}
