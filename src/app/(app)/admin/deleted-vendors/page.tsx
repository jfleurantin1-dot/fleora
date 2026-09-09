import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { shortDate } from "@/lib/format";

export default async function DeletedVendorsReport(){
  const profile=await requireProfile("/admin/deleted-vendors");
  if(profile.account_type!=="admin")redirect("/dashboard");
  const supabase=createClient();
  const {data:rows}=await supabase.from("vendor_admin_actions").select("id,vendor_id,vendor_user_id,business_name_snapshot,reason,admin_id,created_at").eq("action","deleted").order("created_at",{ascending:false});
  const adminIds=[...new Set((rows??[]).map((r)=>r.admin_id))];
  const {data:admins}=adminIds.length?await supabase.from("profiles").select("id,first_name,last_name").in("id",adminIds):{data:[] as {id:string;first_name:string|null;last_name:string|null}[]};
  const adminMap=new Map((admins??[]).map((a)=>[a.id,[a.first_name,a.last_name].filter(Boolean).join(" ")||"Admin"]));
  return <div className="space-y-7">
    <PageHeader title="Deleted vendor accounts" subtitle="Audit history of vendors removed from the Fleora marketplace, including the required deletion reason." action={<Link href="/admin" className="inline-flex min-h-10 items-center rounded-xl border border-plum-200 bg-white px-4 text-sm font-semibold text-plum-700">← Back to admin</Link>}/>
    <div className="flex items-center gap-2"><Badge tone="rose">{(rows??[]).length} deleted</Badge><p className="text-sm text-ink-500">Records are preserved for accountability and reporting.</p></div>
    {!rows?.length?<Empty title="No deleted vendor accounts"><p>Deleted vendors will appear here with the admin, date, and reason.</p></Empty>:<div className="space-y-3">{rows.map((row)=><Card key={row.id} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-ink-900">{row.business_name_snapshot}</h2><Badge tone="rose">Deleted</Badge></div><p className="mt-2 text-sm text-ink-700"><span className="font-semibold">Reason:</span> {row.reason}</p><p className="mt-2 text-xs text-ink-500">Deleted {shortDate(row.created_at)} by {adminMap.get(row.admin_id)??"Admin"}</p></div>{row.vendor_id&&<Link href={`/vendors/${row.vendor_id}`} className="text-sm font-semibold text-plum-700 hover:underline">View retained record</Link>}</Card>)}</div>}
  </div>;
}
