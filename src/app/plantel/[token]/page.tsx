import { AccreditationPanel } from "@/components/accreditation-panel";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function PlantelPage({ params }: { params: { token: string } }) {
  return <AccreditationPanel token={params.token} />;
}
