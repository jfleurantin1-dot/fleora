import {createClient} from "./supabase/server";
import {buildBudgetRows} from "./budget-sheet";
export async function loadBudget(eventId:string){
 const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user)throw Error("Please sign in.");
 const {data:event}=await s.from("events").select("*").eq("id",eventId).eq("client_id",user.id).single();if(!event)throw Error("Event not found.");
 const [expenses,bookings,invoices,plans,shopping]=await Promise.all([s.from("event_budget_expenses").select("*").eq("event_id",eventId),s.from("bookings").select("*").eq("event_id",eventId).neq("status","cancelled"),s.from("event_budget_invoices").select("*").eq("event_id",eventId).order("created_at"),s.from("event_plan_items").select("*").eq("event_id",eventId).eq("choice","diy"),s.from("event_shopping_items").select("*").eq("event_id",eventId)]);
 if([expenses,bookings,invoices,plans,shopping].some(x=>x.error))throw Error("Could not load your complete budget. Please try again.");
 const ids=[...new Set((bookings.data??[]).map(b=>b.vendor_id))];const vendors=ids.length?await s.from("vendors").select("id,business_name").in("id",ids):{data:[],error:null};if(vendors.error)throw Error("Could not load vendor names.");const names=new Map((vendors.data??[]).map(v=>[v.id,v.business_name]));
 const rows=buildBudgetRows(expenses.data??[],bookings.data??[],invoices.data??[],names,plans.data??[],shopping.data??[],eventId);
 const nonUsd=(plans.data??[]).flatMap(p=>p.diy_products??[]).filter(p=>p.currency!=="USD").length;
 return {s,event,rows,names,bookings:bookings.data??[],shopping:shopping.data??[],nonUsd};
}
