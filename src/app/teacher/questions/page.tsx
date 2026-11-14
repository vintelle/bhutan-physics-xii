import { requirePageUser } from "@/lib/auth";
import { aiEnabled } from "@/lib/ai/client";
import { curriculum, topicByCode } from "@/lib/curriculum";
import { PageHeader } from "@/components/ui";
import { QuestionBank } from "@/components/teacher/QuestionBank";

export const dynamic = "force-dynamic";
export const metadata = { title: "Question bank" };

export default async function QuestionsPage({ searchParams }: { searchParams: { tab?: string; status?: string } }) {
  await requirePageUser(["TEACHER", "ADMIN"]);
  const outcomes = curriculum.learning_objectives.map((o) => ({ code: o.code, statement: o.statement, subtopics: o.subtopics, topicName: topicByCode.get(o.topic)?.name ?? "" }));
  return (
    <>
      <PageHeader eyebrow="Teacher" title="Question bank">Every item is tagged to a learning outcome, sub-topic, Bloom's level and assessment domain. Students only ever see approved items.</PageHeader>
      <QuestionBank outcomes={outcomes} aiEnabled={aiEnabled()} initialTab={searchParams.tab as "browse"} initialStatus={searchParams.status} />
    </>
  );
}
