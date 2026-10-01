import { db } from "@/server/store";
import { json } from "@/server/api-utils";
import { computeMetrics } from "@/server/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  return json(await computeMetrics(await db()));
}
