import { db, fail, ok } from "@/lib/admin-api";
import { demoProducts } from "@/lib/demo-data";
import { emailConfigured } from "@/lib/email";
import { listMessages, listOrders, orderStats } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = db();
    const [stats, recent, messages] = await Promise.all([orderStats(), listOrders({ pageSize: 6 }), listMessages()]);

    let productCount = demoProducts.length;
    if (client) {
      const { count } = await client.from("products").select("id", { count: "exact", head: true });
      productCount = count || 0;
    }

    return ok({
      ...stats,
      productCount,
      unreadMessages: messages.filter((m) => !m.is_read).length,
      recent: recent.rows,
      demoMode: !client,
      emailReady: emailConfigured(),
    });
  } catch (err) {
    return fail(err.message, 500);
  }
}
