import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://server:8000") + "/api/chat";

export async function GET() {
  try {
    console.log("=== Next.js API Route GET /api/chat/sessions ===");
    console.log("BACKEND_API_URL:", BACKEND_API_URL);
    console.log("Full URL:", `${BACKEND_API_URL}/sessions`);

    const response = await fetch(`${BACKEND_API_URL}/sessions`);

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GET /api/chat/sessions error:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: response.status }
      );
    }

    const sessions = await response.json();
    console.log("Sessions data:", sessions);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("GET /api/chat/sessions exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== Next.js API Route POST /api/chat/sessions ===");
    console.log("BACKEND_API_URL:", BACKEND_API_URL);
    console.log("Full URL:", `${BACKEND_API_URL}/sessions`);

    const body = await request.json();
    console.log("Request body:", body);

    const response = await fetch(`${BACKEND_API_URL}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("POST /api/chat/sessions error:", errorText);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: response.status }
      );
    }

    const session = await response.json();
    console.log("Session data:", session);
    return NextResponse.json(session);
  } catch (error) {
    console.error("POST /api/chat/sessions exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
