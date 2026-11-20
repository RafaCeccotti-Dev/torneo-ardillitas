import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AcreditarRedirectPage({ params }: { params: { token: string } }) {
  redirect(`/plantel/${params.token}`);
}
