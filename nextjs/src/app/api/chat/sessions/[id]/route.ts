import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://server:8000") + "/api/chat";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await fetch(`${BACKEND_API_URL}/sessions/${id}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GET /api/chat/sessions/${id} error:`, errorText);
      return NextResponse.json(
        { error: "Failed to fetch session" },
        { status: response.status }
      );
    }

    const session = await response.json();
    return NextResponse.json(session);
  } catch (error) {
    console.error(`GET /api/chat/sessions/[id] exception:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await fetch(`${BACKEND_API_URL}/sessions/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DELETE /api/chat/sessions/${id} error:`, errorText);
      return NextResponse.json(
        { error: "Failed to delete session" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/chat/sessions/[id] exception:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
