import { productionLockedResponse } from "@/lib/production-lock";

export const dynamic = "force-dynamic";

export async function GET() {
  return productionLockedResponse();
}
