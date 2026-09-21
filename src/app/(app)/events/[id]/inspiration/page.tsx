import { redirect } from "next/navigation";

export default async function LegacyInspirationPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  redirect(`/events/${params.id}/edit`);
}
