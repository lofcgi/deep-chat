import { Suspense } from "react";
import { SessionClient } from "./SessionClient";

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<div>Loading session...</div>}>
      <SessionClient sessionId={parseInt(id)} />
    </Suspense>
  );
}
