import { z } from "zod";
import { handler, ok, parseBody, requireUser } from "@/lib/api";
import { revealHint } from "@/lib/services/attempts";

/** Reveal the next hint (1 -> 2 -> 3). Each hint reduces the item's credit by 15% (floor 40%). */
export const POST = handler(async (req: Request, { params }: { params: { id: string } }) => {
  const u = await requireUser();
  const b = await parseBody(req, z.object({ itemId: z.string() }));
  return ok(await revealHint(u, params.id, b.itemId));
});
