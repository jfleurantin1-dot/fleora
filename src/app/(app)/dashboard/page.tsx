import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
export default async function DashboardPage(){const p=await requireProfile();redirect(p.account_type==="vendor"?"/vendor/dashboard":p.account_type==="admin"?"/admin":"/events");}
