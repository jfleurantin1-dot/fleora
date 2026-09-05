import Image from "next/image";
import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {requireProfile} from "@/lib/auth";
import {Badge,Card,Empty,PageHeader,Stars,Input,Select,Button} from "@/components/ui";
import {CATEGORIES,CATEGORY_GROUPS,categoryLabel} from "@/lib/constants";
import {ChevronRightIcon,MapPinIcon,SearchIcon,CalendarIcon} from "@/components/icons";
import {money} from "@/lib/format";
import {FavoriteButton} from "@/components/favorite-button";

export default async function BrowseVendors({searchParams}:{searchParams:{q?:string;category?:string;location?:string;max?:string;date?:string;saved?:string}}){
 const profile=await requireProfile();const supabase=createClient();
 const q=(searchParams.q??"").trim().toLowerCase();const category=(searchParams.category??"").trim();const location=(searchParams.location??"").trim().toLowerCase();const maxPrice=Number(searchParams.max)||null;const date=(searchParams.date??"").trim();const savedOnly=searchParams.saved==="1";
 const {data:allVendors}=await supabase.from("vendors").select("*").eq("status","approved").order("rating",{ascending:false});
 const ids=(allVendors??[]).map(v=>v.id);const safeIds=ids.length?ids:["00000000-0000-0000-0000-000000000000"];
 const [{data:photos},{data:cats},{data:services},{data:favs},{data:blocked}]=await Promise.all([
  supabase.from("vendor_photos").select("vendor_id,url,sort").in("vendor_id",safeIds).order("sort"),
  supabase.from("vendor_categories").select("vendor_id,category").in("vendor_id",safeIds),
  supabase.from("services").select("vendor_id,starting_price,category").in("vendor_id",safeIds),
  supabase.from("vendor_favorites").select("vendor_id").eq("user_id",profile.id),
  date?supabase.from("vendor_unavailable_dates").select("vendor_id").eq("unavailable_date",date):Promise.resolve({data:[] as {vendor_id:string}[]}),
 ]);
 const hero=new Map<string,string>();for(const p of photos??[])if(!hero.has(p.vendor_id))hero.set(p.vendor_id,p.url);
 const byCat=new Map<string,string[]>();for(const c of cats??[])byCat.set(c.vendor_id,[...(byCat.get(c.vendor_id)??[]),c.category]);
 const minPrice=new Map<string,number>();for(const s of services??[]){if(s.starting_price==null)continue;if(category&&s.category!==category)continue;const n=Number(s.starting_price);const cur=minPrice.get(s.vendor_id);if(cur==null||n<cur)minPrice.set(s.vendor_id,n)}
 const favoriteSet=new Set((favs??[]).map(f=>f.vendor_id));const blockedSet=new Set((blocked??[]).map(b=>b.vendor_id));
 const vendors=(allVendors??[]).filter(v=>{const vc=byCat.get(v.id)??[];const price=minPrice.get(v.id);if(q&&!`${v.business_name} ${v.description??""} ${v.location??""} ${vc.map(categoryLabel).join(" ")}`.toLowerCase().includes(q))return false;if(category&&!vc.includes(category))return false;if(location&&!(v.location??"").toLowerCase().includes(location))return false;if(maxPrice!=null&&price!=null&&price>maxPrice)return false;if(date&&blockedSet.has(v.id))return false;if(savedOnly&&!favoriteSet.has(v.id))return false;return true});
 return <div><PageHeader title="Find vendors" subtitle="Search Fleora by service, location, price and availability."/>
  <Card className="mb-6"><form method="get" className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_.8fr_.9fr_auto]">
   <label className="relative"><span className="pointer-events-none absolute left-3 top-3.5 text-plum-500"><SearchIcon size={18}/></span><Input name="q" defaultValue={searchParams.q??""} placeholder="Business or service" className="pl-10"/></label>
   <Select name="category" defaultValue={category}><option value="">All services</option>{CATEGORY_GROUPS.map(g=><optgroup key={g.key} label={g.label}>{CATEGORIES.filter(c=>c.group===g.key).map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</optgroup>)}</Select>
   <Input name="location" defaultValue={searchParams.location??""} placeholder="City, State"/>
   <Input name="max" type="number" min={0} defaultValue={searchParams.max??""} placeholder="Max $"/>
   <label className="relative"><span className="pointer-events-none absolute left-3 top-3.5 text-plum-500"><CalendarIcon size={17}/></span><Input name="date" type="date" defaultValue={date} className="pl-10"/></label>
   <Button type="submit">Search</Button>
  </form><div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><Link href="/vendors/browse" className="fleora-chip">Clear filters</Link>{profile.account_type==="client"&&<Link href={`/vendors/browse?saved=${savedOnly?"0":"1"}`} className={`fleora-chip ${savedOnly?"fleora-chip-active":""}`}>Saved vendors</Link>} {date&&<span className="text-ink-500">Unavailable vendors are hidden for your selected date.</span>}</div></Card>
  <div className="mb-4 flex items-center justify-between"><p className="text-sm text-ink-500"><strong className="text-ink-900">{vendors.length}</strong> vendor{vendors.length===1?"":"s"} found</p></div>
  {!vendors.length?<Empty title="No vendors match these filters"><p>Try widening your location, price range or removing a filter.</p></Empty>:<ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{vendors.map(v=>{const photo=hero.get(v.id);const vc=(byCat.get(v.id)??[]).slice(0,3);const price=minPrice.get(v.id);return <Card as="li" key={v.id} variant="interactive" padding="none" className="relative overflow-hidden"><Link href={`/vendors/${v.id}`} className="block h-full"><div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-plum-50 to-[#F3ECF8]">{photo?<Image src={photo} alt={v.business_name} fill sizes="(max-width:768px) 100vw,33vw" className="object-cover"/>:<div className="grid h-full place-items-center font-display text-5xl text-plum-300">F</div>}<div className="absolute left-3 top-3 flex gap-2">{v.verified&&<Badge tone="plum">Verified</Badge>}{date&&<Badge tone="green">Available</Badge>}</div>{profile.account_type==="client"&&<div className="absolute right-3 top-3"><FavoriteButton vendorId={v.id} initial={favoriteSet.has(v.id)}/></div>}</div><div className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-display text-2xl text-ink-900">{v.business_name}</h3><p className="mt-1 flex items-center gap-1 text-xs text-ink-500"><MapPinIcon size={13}/>{v.location??"Greater Boston"}</p></div><ChevronRightIcon size={18} className="mt-1 shrink-0 text-ink-400"/></div><div className="mt-3"><Stars rating={v.rating} count={v.review_count}/></div>{v.description&&<p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-600">{v.description}</p>}<div className="mt-4 flex flex-wrap gap-1.5">{vc.map(c=><Badge key={c} tone="slate">{categoryLabel(c)}</Badge>)}</div><div className="mt-5 flex items-end justify-between border-t fleora-divider pt-4"><div><p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Starting at</p><p className="mt-0.5 font-semibold text-ink-900">{price!=null?money(price):"Request pricing"}</p></div><span className="text-xs font-bold text-plum-700">View vendor</span></div></div></Link></Card>})}</ul>}
 </div>;
}
