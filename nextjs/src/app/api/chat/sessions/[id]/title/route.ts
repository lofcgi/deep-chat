import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://server:8000") + "/api/chat";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const response = await fetch(`${BACKEND_API_URL}/sessions/${id}/title`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`PUT /api/chat/sessions/${id}/title error:`, errorText);
      return NextResponse.json(
        { error: "Failed to update session title" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`PUT /api/chat/sessions/[id]/title exception:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
