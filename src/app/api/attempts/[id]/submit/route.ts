import { handler, ok, requireUser } from "@/lib/api";
import { submitAttempt } from "@/lib/services/attempts";

export const POST = handler(async (_req: Request, { params }: { params: { id: string } }) => ok(await submitAttempt(await requireUser(), params.id)));
