import { AccreditationPanel } from "@/components/accreditation-panel";

export default function AcreditarPage({ params }: { params: { token: string } }) {
  return <AccreditationPanel token={params.token} />;
}
