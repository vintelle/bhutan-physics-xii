import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { HttpError } from "@/lib/api";
import { attemptView } from "@/lib/services/attempts";
import { QuestionRunner, type AttemptData } from "@/components/QuestionRunner";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quiz" };

export default async function QuizPage({ params }: { params: { attemptId: string } }) {
  const user = await requirePageUser();
  try {
    const data = await attemptView(user, params.attemptId);
    return <QuestionRunner initial={JSON.parse(JSON.stringify(data)) as AttemptData} />;
  } catch (e) {
    if (e instanceof HttpError) notFound();
    throw e;
  }
}
