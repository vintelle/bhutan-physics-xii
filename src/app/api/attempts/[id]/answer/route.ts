import { z } from "zod";
import { handler, ok, parseBody, requireUser } from "@/lib/api";
import { answerItem } from "@/lib/services/attempts";

export const maxDuration = 60;

export const POST = handler(async (req: Request, { params }: { params: { id: string } }) => {
  const u = await requireUser();
  const b = await parseBody(req, z.object({ itemId: z.string(), response: z.unknown() }));
  return ok(await answerItem(u, params.id, b.itemId, b.response));
});
