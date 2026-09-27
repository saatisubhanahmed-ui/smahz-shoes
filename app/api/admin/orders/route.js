import { fail, ok } from "@/lib/admin-api";
import { listOrders } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const sp = req.nextUrl.searchParams;
  try {
    const result = await listOrders({
      status: sp.get("status") || undefined,
      channel: sp.get("channel") || undefined,
      search: sp.get("q") || undefined,
      page: Math.max(1, parseInt(sp.get("page") || "1", 10)),
      pageSize: 20,
    });
    return ok(result);
  } catch (err) {
    return fail(err.message, 500);
  }
}
