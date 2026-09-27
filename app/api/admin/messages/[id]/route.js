import { fail, ok, readJson } from "@/lib/admin-api";
import { deleteMessage, updateMessage } from "@/lib/repo";

export async function PATCH(req, { params }) {
  const { id } = await params;
  const body = await readJson(req);
  try {
    const message = await updateMessage(id, { is_read: Boolean(body?.is_read) });
    return ok({ message });
  } catch (err) {
    return fail(err.message, 500);
  }
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  try {
    await deleteMessage(id);
    return ok({ ok: true });
  } catch (err) {
    return fail(err.message, 500);
  }
}
