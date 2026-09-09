import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { AddVendorForm } from "../add-vendor-form";

export default async function AdminAddVendorPage() {
  const profile = await requireProfile("/admin/add-vendor");
  if (profile.account_type !== "admin") redirect("/dashboard");

  return (
    <div className="space-y-7">
      <Link href="/admin" className="inline-flex text-sm font-semibold text-plum-700 hover:underline">
        ← Back to Admin
      </Link>
      <PageHeader
        title="Add vendor"
        subtitle="Create an unclaimed vendor listing for the Fleora marketplace."
      />
      <AddVendorForm adminUserId={profile.id} />
    </div>
  );
}
