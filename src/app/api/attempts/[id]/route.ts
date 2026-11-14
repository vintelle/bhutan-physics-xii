import { handler, ok, requireUser } from "@/lib/api";
import { attemptView } from "@/lib/services/attempts";

export const GET = handler(async (_req: Request, { params }: { params: { id: string } }) => ok(await attemptView(await requireUser(), params.id)));
