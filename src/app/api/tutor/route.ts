import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { HttpError, handler, ok, parseBody, requireUser } from "@/lib/api";
import { aiEnabled } from "@/lib/ai/client";
import { tutorStream } from "@/lib/ai/tutor";

export const maxDuration = 120;

export const GET = handler(async () => {
  const u = await requireUser();
  return ok(await prisma.tutorSession.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, title: true, createdAt: true } }));
});

/** Send a message to the AI tutor; the reply streams back as text/plain. The session id is in X-Session-Id. */
export const POST = handler(async (req: Request) => {
  const u = await requireUser();
  if (!aiEnabled()) throw new HttpError(503, "The AI tutor is not configured on this server yet (ANTHROPIC_API_KEY).");
  const b = await parseBody(req, z.object({ sessionId: z.string().optional(), message: z.string().trim().min(1).max(4000) }));
  let session = b.sessionId ? await prisma.tutorSession.findFirst({ where: { id: b.sessionId, userId: u.id } }) : null;
  if (!session) session = await prisma.tutorSession.create({ data: { userId: u.id, title: b.message.slice(0, 60) } });
  await prisma.tutorMessage.create({ data: { sessionId: session.id, role: "user", content: b.message } });
  const past = await prisma.tutorMessage.findMany({ where: { sessionId: session.id }, orderBy: { createdAt: "asc" }, take: 40 });
  const history: Anthropic.Beta.BetaMessageParam[] = past.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
  const sessionId = session.id;
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        for await (const chunk of tutorStream(history)) {
          full += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (e) {
        console.error("tutor stream failed", e);
        const msg = "\n\n_Sorry - the tutor is unavailable right now. Please try again in a moment._";
        full += msg;
        controller.enqueue(encoder.encode(msg));
      } finally {
        if (full.trim()) await prisma.tutorMessage.create({ data: { sessionId, role: "assistant", content: full } });
        controller.close();
      }
    },
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Session-Id": sessionId, "Cache-Control": "no-store" } });
});
