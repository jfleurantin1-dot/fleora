import { redirect } from "next/navigation";

export default function LegacyInspirationPage({ params }: { params: { id: string } }) {
  redirect(`/events/${params.id}/edit`);
}
