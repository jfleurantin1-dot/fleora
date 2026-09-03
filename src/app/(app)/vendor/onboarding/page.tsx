import { createClient } from "@/lib/supabase/server";
import { requireVendor } from "@/lib/auth";
import { Badge, Card, PageHeader } from "@/components/ui";
import { VendorForm } from "./form";
import type { Service } from "@/lib/types";

export default async function VendorOnboardingPage(){
 const {profile,vendor}=await requireVendor(); const supabase=createClient(); let categories:string[]=[], services:Service[]=[], photos:string[]=[];
 if(vendor){const [{data:cats},{data:svc},{data:pics}]=await Promise.all([supabase.from("vendor_categories").select("category").eq("vendor_id",vendor.id),supabase.from("services").select("*").eq("vendor_id",vendor.id),supabase.from("vendor_photos").select("url").eq("vendor_id",vendor.id).order("sort")]);categories=(cats??[]).map(c=>c.category);services=svc??[];photos=(pics??[]).map(p=>p.url)}
 return <div className="mx-auto max-w-4xl"><PageHeader title={vendor?"Your Fleora profile":"Set up your vendor profile"} subtitle="Make a strong first impression. These details power your matches, profile and leads." action={vendor&&<Badge tone={vendor.status==="approved"?"green":"amber"}>{vendor.status}</Badge>}/><Card variant="soft" className="mb-6"><div className="grid gap-4 sm:grid-cols-3"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-ink-400">01</p><p className="mt-1 font-semibold text-ink-900">Tell your story</p><p className="mt-1 text-xs text-ink-600">Business, location and style.</p></div><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-ink-400">02</p><p className="mt-1 font-semibold text-ink-900">Add services</p><p className="mt-1 text-xs text-ink-600">Categories and starting prices.</p></div><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-ink-400">03</p><p className="mt-1 font-semibold text-ink-900">Show your work</p><p className="mt-1 text-xs text-ink-600">Upload a polished portfolio.</p></div></div></Card><VendorForm userId={profile.id} vendor={vendor} categories={categories} services={services} photos={photos}/></div>;
}
