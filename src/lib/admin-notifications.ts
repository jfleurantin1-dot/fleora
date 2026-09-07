import { createAdminClient } from "@/lib/supabase/server";
import { sendFleoraEmail } from "@/lib/email";

type AdminNotice = {
  title: string;
  body: string;
  href: string;
  emailSubject?: string;
  emailHeading?: string;
  emailBody?: string;
  emailCtaLabel?: string;
};

export async function notifyFleoraAdmins(notice: AdminNotice) {
  try {
    const admin = createAdminClient();
    const { data: admins, error } = await admin.from("profiles").select("id").eq("account_type", "admin");
    if (error || !admins?.length) return;

    await admin.from("notifications").insert(
      admins.map((profile) => ({
        user_id: profile.id,
        kind: "admin",
        title: notice.title,
        body: notice.body,
        href: notice.href,
      })),
    );

    if (!notice.emailSubject) return;
    await Promise.all(
      admins.map(async (profile) => {
        try {
          const { data } = await admin.auth.admin.getUserById(profile.id);
          const email = data.user?.email;
          if (!email) return;
          await sendFleoraEmail({
            to: email,
            subject: notice.emailSubject!,
            heading: notice.emailHeading ?? notice.title,
            body: notice.emailBody ?? notice.body,
            ctaLabel: notice.emailCtaLabel ?? "Open Fleora Admin",
            ctaHref: notice.href,
          });
        } catch (emailError) {
          console.error("Could not send Fleora admin notification email", emailError);
        }
      }),
    );
  } catch (notificationError) {
    console.error("Could not notify Fleora admins", notificationError);
  }
}
