import { requirePageUser } from "@/lib/auth";
import { aiEnabled } from "@/lib/ai/client";
import { PageHeader } from "@/components/ui";
import { TutorChat } from "@/components/TutorChat";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI Tutor" };

export default async function TutorPage({ searchParams }: { searchParams: { q?: string } }) {
  await requirePageUser();
  return (
    <>
      <PageHeader eyebrow="AI Tutor" title="Your Class XII Physics tutor">Hints first, simple explanations, and step-by-step solutions - always within the national curriculum.</PageHeader>
      <TutorChat aiEnabled={aiEnabled()} initialQuestion={searchParams.q?.slice(0, 2000)} />
    </>
  );
}
