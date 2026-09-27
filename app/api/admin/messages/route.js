import { fail, ok } from "@/lib/admin-api";
import { listMessages } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok({ messages: await listMessages() });
  } catch (err) {
    return fail(err.message, 500);
  }
}
