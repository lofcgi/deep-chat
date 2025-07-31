const API_BASE_URL = "/api/chat";

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: number;
  session_id: number;
  role: "user" | "assistant";
  content: string;
  model_used?: string;
  routing_scores?: Record<string, unknown>;
  created_at: string;
}

export interface StreamingChunk {
  content: string;
  model_used?: string;
  routing_scores?: Record<string, unknown>;
  is_finished: boolean;
}

// 새 채팅 세션 생성
export async function createChatSession(
  title: string = "새 채팅"
): Promise<ChatSession> {
  console.log("=== createChatSession 시작 ===");
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log("title:", title);

  try {
    console.log("POST 요청 시작...");
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    console.log("createChatSession response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("createChatSession error:", errorText);
      throw new Error(
        `Failed to create chat session: ${response.status} - ${errorText}`
      );
    }

    const result = await response.json();
    console.log("createChatSession result:", result);
    return result;
  } catch (error) {
    console.error("createChatSession exception:", error);
    throw error;
  }
}

// 채팅 세션 목록 조회
export async function getChatSessions(): Promise<ChatSession[]> {
  console.log("getChatSessions 호출");

  try {
    const response = await fetch(`${API_BASE_URL}/sessions`);

    console.log("getChatSessions response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("getChatSessions error:", errorText);
      throw new Error(
        `Failed to fetch chat sessions: ${response.status} - ${errorText}`
      );
    }

    const result = await response.json();
    console.log("getChatSessions result:", result);
    return result;
  } catch (error) {
    console.error("getChatSessions exception:", error);
    throw error;
  }
}

// 특정 채팅 세션 조회
export async function getChatSession(sessionId: number): Promise<ChatSession> {
  console.log("getChatSession 호출:", sessionId);

  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);

    console.log("getChatSession response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("getChatSession error:", errorText);
      throw new Error(
        `Failed to fetch chat session: ${response.status} - ${errorText}`
      );
    }

    const result = await response.json();
    console.log("getChatSession result:", result);
    return result;
  } catch (error) {
    console.error("getChatSession exception:", error);
    throw error;
  }
}

// 세션 제목 업데이트
export async function updateSessionTitle(
  sessionId: number,
  title: string
): Promise<void> {
  console.log("updateSessionTitle 호출:", sessionId, title);

  try {
    const response = await fetch(
      `${API_BASE_URL}/sessions/${sessionId}/title`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      }
    );

    console.log("updateSessionTitle response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("updateSessionTitle error:", errorText);
      throw new Error(
        `Failed to update session title: ${response.status} - ${errorText}`
      );
    }

    console.log("updateSessionTitle 성공");
  } catch (error) {
    console.error("updateSessionTitle exception:", error);
    throw error;
  }
}

// 세션 삭제
export async function deleteChatSession(sessionId: number): Promise<void> {
  console.log("deleteChatSession 호출:", sessionId);

  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: "DELETE",
    });

    console.log("deleteChatSession response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("deleteChatSession error:", errorText);
      throw new Error(
        `Failed to delete chat session: ${response.status} - ${errorText}`
      );
    }

    console.log("deleteChatSession 성공");
  } catch (error) {
    console.error("deleteChatSession exception:", error);
    throw error;
  }
}

// 메시지 전송 (스트리밍)
export async function sendMessage(
  sessionId: number,
  content: string,
  onChunk: (chunk: StreamingChunk) => void
): Promise<void> {
  console.log("sendMessage 호출:", sessionId, content);

  try {
    const response = await fetch(
      `${API_BASE_URL}/sessions/${sessionId}/messages/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      }
    );

    console.log("sendMessage response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("sendMessage error:", errorText);
      throw new Error(
        `Failed to send message: ${response.status} - ${errorText}`
      );
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log("Streaming finished");
          break;
        }

        const chunk = decoder.decode(value);
        console.log("Received chunk:", chunk);
        console.log("Chunk length:", chunk.length);
        console.log("Chunk starts with 'data:':", chunk.startsWith("data: "));

        // SSE 형식 파싱: "data: {...}" 형태의 라인들을 처리
        const lines = chunk.split("\n");
        console.log("Split lines:", lines);
        for (const line of lines) {
          const trimmedLine = line.trim();
          console.log("Processing line:", trimmedLine);
          console.log(
            "Line starts with 'data:':",
            trimmedLine.startsWith("data: ")
          );

          if (trimmedLine && trimmedLine.startsWith("data: ")) {
            try {
              // "data: " 접두사 제거 후 JSON 파싱
              const jsonStr = trimmedLine.substring(6); // slice(6) 대신 substring(6) 사용
              console.log("Parsing SSE JSON:", jsonStr);
              const data = JSON.parse(jsonStr);
              console.log("Parsed streaming data:", data);
              console.log("Model used:", data.model_used);
              console.log("Routing scores:", data.routing_scores);
              onChunk(data);
            } catch (e) {
              console.error("Failed to parse SSE chunk:", trimmedLine, e);
            }
          } else if (trimmedLine && trimmedLine.startsWith("{")) {
            // 순수 JSON 형식인 경우
            try {
              console.log("Parsing direct JSON:", trimmedLine);
              const data = JSON.parse(trimmedLine);
              onChunk(data);
            } catch (e) {
              console.error("Failed to parse direct JSON:", trimmedLine, e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    console.error("sendMessage exception:", error);
    throw error;
  }
}
