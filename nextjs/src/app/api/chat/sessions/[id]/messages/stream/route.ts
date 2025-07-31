import { NextRequest } from "next/server";

const BACKEND_API_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://server:8000") + "/api/chat";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const response = await fetch(`${BACKEND_API_URL}/sessions/${id}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `POST /api/chat/sessions/${id}/messages/stream error:`,
        errorText
      );
      return new Response(JSON.stringify({ error: "Failed to send message" }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 스트리밍 응답을 그대로 전달
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error(
      `POST /api/chat/sessions/[id]/messages/stream exception:`,
      error
    );
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
